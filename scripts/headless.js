// Ejecución headless: corre un escenario fijo SIN interfaz y escribe un CSV.
// Uso:  npm run headless            (escribe output/headless.csv)
//       node scripts/headless.js ruta/salida.csv
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createInitialState, step, computeEnergy, angularMomentum,
  launchVelocityForApogee, applyCircularization, circularizationDeltaV
} from '../src/physics/index.js';

// Escenario fijo (SI): Tierra, torre a 300 km, órbita objetivo a 1200 km de altura.
export const ESCENARIO = Object.freeze({
  M: 5.972e24,        // kg
  R: 6.371e6,         // m
  h: 300e3,           // m
  hObjetivo: 1200e3,  // m sobre la superficie
  tolerancia: 0.02,   // ±2 % sobre el radio objetivo
  dt: 1,              // s
  salidaCadaS: 10,    // s entre filas del CSV
  vueltasTrasCircularizar: 2
});

export const COLUMNAS = [
  't_s', 'x_m', 'y_m', 'vx_ms', 'vy_ms', 'r_m', 'altura_m', 'v_ms',
  'Ek_Jkg', 'Ep_Jkg', 'Etotal_Jkg', 'L_m2s', 'evento'
];

/** Corre el escenario y devuelve { csv, resumen }. Determinista: sin aleatoriedad. */
export function runScenario(e = ESCENARIO) {
  const rObj = e.R + e.hObjetivo;
  const r0 = e.R + e.h;
  const v0 = launchVelocityForApogee(e.M, r0, rObj);
  const p = { M: e.M, R: e.R, h: e.h, v0, atmosfera: false };
  const plan = circularizationDeltaV(p);

  let s = createInitialState(p);
  const filas = [COLUMNAS.join(',')];
  const fila = (st, evento = '') => {
    const en = computeEnergy(st, e.M);
    filas.push([
      st.t, st.x, st.y, st.vx, st.vy, en.r, en.r - e.R, en.v,
      en.kinetic, en.potential, en.total, angularMomentum(st), evento
    ].map(v => (typeof v === 'number' ? v.toPrecision(10) : v)).join(','));
  };

  fila(s, 'lanzamiento');
  let proxima = e.salidaCadaS;
  let deltaVAplicado = null, tCirc = null, anguloAcum = 0, anguloDesdeCirc = null;
  const maxPasos = 400000;

  for (let i = 0; i < maxPasos; i++) {
    const previo = s;
    s = step(s, p, e.dt);
    const rPrev = Math.hypot(previo.x, previo.y), r = Math.hypot(s.x, s.y);
    const vrPrev = (previo.x * previo.vx + previo.y * previo.vy) / rPrev;
    const vr = (s.x * s.vx + s.y * s.vy) / r;
    let evento = '';

    if (deltaVAplicado === null && vrPrev > 0 && vr <= 0) {        // apogeo
      const res = applyCircularization(s, e.M);
      s = res.newState; deltaVAplicado = res.deltaV; tCirc = s.t;
      anguloDesdeCirc = 0; evento = 'circularizacion';
    } else if (anguloDesdeCirc !== null) {
      let d = Math.atan2(s.y, s.x) - Math.atan2(previo.y, previo.x);
      if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      anguloDesdeCirc += d;
    }
    if (r <= e.R) { fila(s, 'impacto'); break; }
    if (s.t >= proxima || evento) { fila(s, evento); while (proxima <= s.t) proxima += e.salidaCadaS; }
    if (anguloDesdeCirc !== null && Math.abs(anguloDesdeCirc) >= 2 * Math.PI * e.vueltasTrasCircularizar) {
      fila(s, 'fin'); break;
    }
  }

  const rFinal = Math.hypot(s.x, s.y);
  const errorRel = (rFinal - rObj) / rObj;
  const resumen = {
    v0_ms: v0,
    deltaVcirc_ms: deltaVAplicado,
    deltaVcirc_analitico_ms: plan.deltaV,
    deltaVtotal_ms: v0 + deltaVAplicado,
    tCircularizacion_s: tCirc,
    rObjetivo_m: rObj,
    rFinal_m: rFinal,
    errorRelativo: errorRel,
    dictamen: Math.abs(errorRel) <= e.tolerancia ? 'orbita conforme' : 'fuera de especificacion'
  };
  return { csv: filas.join('\n') + '\n', resumen };
}

// Solo ejecuta si se invoca directamente (no cuando lo importan las pruebas)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const salida = process.argv[2] || 'output/headless.csv';
  const { csv, resumen } = runScenario();
  mkdirSync(dirname(salida), { recursive: true });
  writeFileSync(salida, csv);
  console.log(`CSV escrito en ${salida} (${csv.trim().split('\n').length - 1} filas)`);
  console.log(resumen);
}

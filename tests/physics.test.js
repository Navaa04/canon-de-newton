import { describe, it, expect } from 'vitest';
import {
  G, createInitialState, step, computeEnergy, angularMomentum, escapeVelocity,
  circularVelocity, transferGeometry, circularizationDeltaV, launchVelocityForApogee,
  applyCircularization, classifyOutcome, sweepLaunchVelocities
} from '../src/physics/index.js';
import { TIERRA, MU, simular } from './helpers.js';

const relErr = (obtenido, esperado) => Math.abs(obtenido - esperado) / Math.abs(esperado);

/* ------------------------------------------------------------------ */
describe('Validación analítica (solución exacta conocida)', () => {

  it('V1 · Caída libre desde h=100 m: t = √(2h/g)  [tolerancia 0.5 %]', () => {
    const h = 100;
    const p = { ...TIERRA, h, v0: 0, atmosfera: false };
    const g = MU / TIERRA.R ** 2;
    const { tImpacto } = simular(p, 1e-3, 20);
    expect(relErr(tImpacto, Math.sqrt(2 * h / g))).toBeLessThan(0.005);
  });

  it('V2 · Alcance de proyectil horizontal: x = v0·√(2h/g)  [tolerancia 0.5 %]', () => {
    const h = 100, v0 = 50;
    const p = { ...TIERRA, h, v0, atmosfera: false };
    const g = MU / TIERRA.R ** 2;
    const { hist, tImpacto } = simular(p, 1e-3, 20);
    const ultimo = hist[hist.length - 1];
    expect(tImpacto).not.toBeNull();
    expect(relErr(ultimo.x, v0 * Math.sqrt(2 * h / g))).toBeLessThan(0.005);
  });

  it('V3 · Caída radial con gravedad variable (h=1000 km): fórmula de Kepler radial  [1 %]', () => {
    // t = √(r0³/2μ)·[ √(u(1−u)) + acos(√u) ],  u = R/r0
    const h = 1000e3, r0 = TIERRA.R + h, u = TIERRA.R / r0;
    const esperado = Math.sqrt(r0 ** 3 / (2 * MU)) * (Math.sqrt(u * (1 - u)) + Math.acos(Math.sqrt(u)));
    const p = { ...TIERRA, h, v0: 0, atmosfera: false };
    const { tImpacto } = simular(p, 0.5, 5000);
    expect(relErr(tImpacto, esperado)).toBeLessThan(0.01);
  });

  it('V4 · Órbita circular (h=300 km): período T = 2π√(r³/μ)  [0.5 %] y radio constante [0.5 %]', () => {
    const h = 300e3, r0 = TIERRA.R + h;
    const p = { ...TIERRA, h, v0: circularVelocity(TIERRA.M, r0), atmosfera: false };
    const T = 2 * Math.PI * Math.sqrt(r0 ** 3 / MU);
    const { hist } = simular(p, 1, 1.2 * T);
    let ang = 0, tVuelta = null, rMaxDesv = 0;
    for (let i = 1; i < hist.length && tVuelta === null; i++) {
      let d = Math.atan2(hist[i].y, hist[i].x) - Math.atan2(hist[i - 1].y, hist[i - 1].x);
      if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      const antes = Math.abs(ang); ang += d;
      rMaxDesv = Math.max(rMaxDesv, relErr(Math.hypot(hist[i].x, hist[i].y), r0));
      if (Math.abs(ang) >= 2 * Math.PI) {
        const f = (2 * Math.PI - antes) / Math.abs(d);
        tVuelta = hist[i - 1].t + f * (hist[i].t - hist[i - 1].t);
      }
    }
    expect(relErr(tVuelta, T)).toBeLessThan(0.005);
    expect(rMaxDesv).toBeLessThan(0.005);
  });

  it('V5 · Δv de circularización = Hohmann (2º impulso): √(μ/r2)·(1−√(2r1/(r1+r2)))  [1e-6]', () => {
    const r1 = TIERRA.R + 300e3, r2 = TIERRA.R + 1200e3;
    const v0 = launchVelocityForApogee(TIERRA.M, r1, r2);
    const p = { ...TIERRA, h: 300e3, v0 };
    const hohmann = Math.sqrt(MU / r2) * (1 - Math.sqrt(2 * r1 / (r1 + r2)));
    expect(relErr(circularizationDeltaV(p).deltaV, hohmann)).toBeLessThan(1e-6);
  });

  it('V6 · Apogeo simulado = apogeo analítico (vis-viva)  [0.5 %]', () => {
    const r1 = TIERRA.R + 300e3, r2 = TIERRA.R + 1200e3;
    const p = { ...TIERRA, h: 300e3, v0: launchVelocityForApogee(TIERRA.M, r1, r2), atmosfera: false };
    const geo = transferGeometry(p);
    const { hist } = simular(p, 1, 2 * Math.PI * Math.sqrt(geo.a ** 3 / MU));
    const rMax = Math.max(...hist.map(s => Math.hypot(s.x, s.y)));
    expect(relErr(rMax, geo.rApo)).toBeLessThan(0.005);
    expect(relErr(geo.rApo, r2)).toBeLessThan(1e-9);
  });
});

/* ------------------------------------------------------------------ */
describe('Conservación', () => {
  const p = { ...TIERRA, h: 300e3, v0: 7900, atmosfera: false };   // órbita elíptica

  it('C1 · Energía mecánica: |ΔE/E0| < 1 % tras 10 órbitas completas', () => {
    const T = 2 * Math.PI * Math.sqrt(transferGeometry(p).a ** 3 / MU);
    const { hist } = simular(p, 1, 10 * T);
    const E0 = computeEnergy(hist[0], p.M).total;
    const peor = Math.max(...hist.map(s => relErr(computeEnergy(s, p.M).total, E0)));
    expect(peor).toBeLessThan(0.01);
  });

  it('C2 · Momento angular constante: variación relativa < 1e-9 (sin arrastre)', () => {
    const { hist } = simular(p, 1, 20000);
    const L0 = angularMomentum(hist[0]);
    const peor = Math.max(...hist.map(s => relErr(angularMomentum(s), L0)));
    expect(peor).toBeLessThan(1e-9);
  });

  it('C3 · Con atmósfera la energía total disminuye (disipación)', () => {
    const pa = {
      ...p, v0: circularVelocity(TIERRA.M, TIERRA.R + 300e3), atmosfera: true,
      altAtmosfera: 900e3, escalaAltura: 90e3, rho0: 2.5e-9, Cd: 2.2, areaSobreMasa: 0.02
    };
    const { hist } = simular(pa, 1, 6000);
    const E0 = computeEnergy(hist[0], pa.M).total;
    const Ef = computeEnergy(hist[hist.length - 1], pa.M).total;
    expect(Ef).toBeLessThan(E0);
  });
});

/* ------------------------------------------------------------------ */
describe('Velocidad de escape y clasificación', () => {
  const r0 = TIERRA.R + 300e3;
  const base = { ...TIERRA, h: 300e3, atmosfera: false };

  it('E1 · A v = v_esc la energía total es 0 (tolerancia relativa 1e-12)', () => {
    const s = { x: 0, y: r0, vx: escapeVelocity(TIERRA.M, r0), vy: 0, t: 0 };
    const e = computeEnergy(s, TIERRA.M);
    expect(Math.abs(e.total) / Math.abs(e.potential)).toBeLessThan(1e-12);
  });

  it('E2 · Frontera: 0.999·v_esc no escapa, 1.001·v_esc sí', () => {
    const vEsc = escapeVelocity(TIERRA.M, r0);
    expect(classifyOutcome({ ...base, v0: 0.999 * vEsc })).not.toBe('escape');
    expect(classifyOutcome({ ...base, v0: 1.001 * vEsc })).toBe('escape');
  });

  it('E3 · Simulación con 1.2·v_esc: el proyectil se aleja de forma monótona (> 5·r0 a 20 000 s)', () => {
    const p = { ...base, v0: 1.2 * escapeVelocity(TIERRA.M, r0) };
    const { hist } = simular(p, 2, 20000);
    const rs = hist.map(s => Math.hypot(s.x, s.y));
    expect(rs[rs.length - 1]).toBeGreaterThan(5 * r0);
    for (let i = 1; i < rs.length; i++) expect(rs[i]).toBeGreaterThanOrEqual(rs[i - 1] - 1e-6);
  });

  it('E4 · Casos límite: v0=0 → impacto (clasificador y simulación); v0=v_circ → circular', () => {
    expect(classifyOutcome({ ...base, v0: 0 })).toBe('impacto');
    expect(simular({ ...base, v0: 0 }, 1, 5000).tImpacto).not.toBeNull();
    expect(classifyOutcome({ ...base, v0: circularVelocity(TIERRA.M, r0) })).toBe('circular');
  });

  it('E5 · Barrido coherente: impacto al inicio, escape al final y "circular" solo cerca de v_circ (±1.5 %)', () => {
    const barrido = sweepLaunchVelocities(base, 0, 12000, 400);
    const res = barrido.map(b => b.outcome);
    const vc = circularVelocity(TIERRA.M, r0);
    const iEsc = res.indexOf('escape');
    expect(res[0]).toBe('impacto');
    expect(res[res.length - 1]).toBe('escape');
    expect(res.slice(iEsc).every(r => r === 'escape')).toBe(true);          // nada vuelve a "ligado" tras escapar
    const circ = barrido.filter(b => b.outcome === 'circular');
    expect(circ.length).toBeGreaterThan(0);
    expect(circ.every(b => Math.abs(b.v0 - vc) / vc < 0.015)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
describe('Maniobra de circularización', () => {
  it('M1 · Tras el impulso la velocidad en el apogeo es v_circ(r) y Δv = v_circ − v_apo', () => {
    const r1 = TIERRA.R + 300e3, r2 = TIERRA.R + 1200e3;
    const p = { ...TIERRA, h: 300e3, v0: launchVelocityForApogee(TIERRA.M, r1, r2) };
    const { vApo } = circularizationDeltaV(p);
    const sApo = { x: 0, y: r2, vx: vApo, vy: 0, t: 0 };       // estado en el apogeo
    const { newState, deltaV } = applyCircularization(sApo, TIERRA.M);
    expect(relErr(Math.hypot(newState.vx, newState.vy), circularVelocity(TIERRA.M, r2))).toBeLessThan(1e-12);
    expect(relErr(deltaV, circularizationDeltaV(p).deltaV)).toBeLessThan(1e-9);
  });
});

/* ------------------------------------------------------------------ */
describe('Pureza y determinismo de la librería', () => {
  const p = { ...TIERRA, h: 300e3, v0: 7900, atmosfera: false };

  it('P1 · Mismo estado + mismo dt → mismo resultado, y no modifica la entrada', () => {
    const s0 = Object.freeze(createInitialState(p));
    expect(step(s0, p, 1)).toEqual(step(s0, p, 1));
    expect(s0).toEqual({ x: 0, y: TIERRA.R + 300e3, vx: 7900, vy: 0, t: 0 });
  });

  it('P2 · Dos simulaciones idénticas dan trayectorias idénticas (bit a bit)', () => {
    const a = simular(p, 1, 3000).hist, b = simular(p, 1, 3000).hist;
    expect(a).toEqual(b);
  });

  it('P3 · G es la constante de gravitación universal (6.674e-11)', () => {
    expect(G).toBe(6.674e-11);
  });
});

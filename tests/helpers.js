import { createInitialState, step } from '../src/physics/index.js';

// Planeta de referencia (Tierra)
export const TIERRA = { M: 5.972e24, R: 6.371e6 };
export const MU = 6.674e-11 * TIERRA.M;

/**
 * Integra hasta tMax o hasta tocar la superficie.
 * Devuelve la lista de estados y el tiempo de impacto interpolado (o null).
 */
export function simular(p, dt, tMax) {
  let s = createInitialState(p);
  const hist = [s];
  let tImpacto = null;
  while (s.t < tMax) {
    const previo = s;
    s = step(s, p, dt);
    hist.push(s);
    const rPrev = Math.hypot(previo.x, previo.y), r = Math.hypot(s.x, s.y);
    if (r <= p.R) {
      const f = (rPrev - p.R) / (rPrev - r);   // interpolación lineal del cruce
      tImpacto = previo.t + f * dt;
      break;
    }
  }
  return { hist, tImpacto };
}

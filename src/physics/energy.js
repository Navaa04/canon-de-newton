import { G } from './constants.js';
/**
 * Energía mecánica específica (por unidad de masa del proyectil).
 * @returns {{kinetic:number,potential:number,total:number,r:number,v:number}} J/kg, J/kg, J/kg, m, m/s
 */
export function computeEnergy(s, M) {
  const r = Math.hypot(s.x, s.y);
  const v2 = s.vx * s.vx + s.vy * s.vy;
  const kinetic = 0.5 * v2;
  const potential = -G * M / r;
  return { kinetic, potential, total: kinetic + potential, r, v: Math.sqrt(v2) };
}
/** Velocidad de escape a distancia r del centro (m/s). */
export function escapeVelocity(M, r) { return Math.sqrt(2 * G * M / r); }
/** Velocidad de órbita circular a distancia r del centro (m/s). */
export function circularVelocity(M, r) { return Math.sqrt(G * M / r); }
/** Momento angular específico L = x·vy − y·vx (m²/s). */
export function angularMomentum(s) { return s.x * s.vy - s.y * s.vx; }

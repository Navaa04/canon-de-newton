import { G } from './constants.js';
/**
 * Aceleración gravitatoria (ley de gravitación universal), dirigida al centro.
 * @param {{x:number,y:number}} s  posición (m)
 * @param {number} M  masa del planeta (kg)
 * @returns {{ax:number,ay:number}} m/s²
 */
export function computeAcceleration(s, M) {
  const r = Math.hypot(s.x, s.y);
  const k = -G * M / (r * r * r);
  return { ax: k * s.x, ay: k * s.y };
}

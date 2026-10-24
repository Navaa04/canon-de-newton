import { computeAcceleration } from './gravity.js';
import { computeDragAcceleration } from './drag.js';
/**
 * Un paso de Euler semi-implícito (simpléctico). Función pura: no modifica `s`.
 * @param {{x:number,y:number,vx:number,vy:number,t:number}} s
 * @param {object} p  parámetros físicos (M en kg, y los de drag.js)
 * @param {number} dt  paso (s)
 * @returns {{x:number,y:number,vx:number,vy:number,t:number}}
 */
export function step(s, p, dt) {
  const g = computeAcceleration(s, p.M);
  const d = computeDragAcceleration(s, p);
  const vx = s.vx + (g.ax + d.ax) * dt;
  const vy = s.vy + (g.ay + d.ay) * dt;
  return { x: s.x + vx * dt, y: s.y + vy * dt, vx, vy, t: s.t + dt };
}

import { classifyOutcome } from './classifier.js';
/**
 * Barrido de velocidades de lanzamiento (m/s) → clasificación.
 * @returns {{v0:number,outcome:string}[]}
 */
export function sweepLaunchVelocities(p, vMin, vMax, n = 120) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const v0 = vMin + (vMax - vMin) * i / (n - 1);
    out.push({ v0, outcome: classifyOutcome({ ...p, v0 }) });
  }
  return out;
}

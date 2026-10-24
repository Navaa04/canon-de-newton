import { transferGeometry } from './maneuver.js';
/**
 * Clasificación analítica del lanzamiento.
 * @param {{M:number,R:number,h:number,v0:number}} p
 * @param {number} [tol=0.02]  excentricidad máxima para llamarla "circular"
 * @returns {"impacto"|"eliptica"|"circular"|"escape"}
 */
export function classifyOutcome(p, tol = 0.02) {
  const geo = transferGeometry(p);
  if (geo.escape) return 'escape';
  if (geo.rPeri <= p.R) return 'impacto';
  if (geo.ecc <= tol) return 'circular';
  return 'eliptica';
}

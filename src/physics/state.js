/**
 * Estado inicial: proyectil en la cima de la torre, lanzado en horizontal.
 * @param {{R:number,h:number,v0:number}} p  R (m), h (m), v0 (m/s)
 * @returns {{x:number,y:number,vx:number,vy:number,t:number}} m, m, m/s, m/s, s
 */
export function createInitialState(p) {
  const r0 = p.R + p.h;
  return { x: 0, y: r0, vx: p.v0, vy: 0, t: 0 };
}

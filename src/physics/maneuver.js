import { G } from './constants.js';
import { circularVelocity } from './energy.js';

/**
 * Geometría de la órbita de transferencia (lanzamiento horizontal = perigeo).
 * @param {{M:number,R:number,h:number,v0:number}} p
 * @returns {{escape:boolean,E:number,L:number,r0:number,a:number,rApo:number,rPeri:number,ecc:number}}
 */
export function transferGeometry(p) {
  const mu = G * p.M;
  const r0 = p.R + p.h;
  const E = 0.5 * p.v0 * p.v0 - mu / r0;
  const L = r0 * p.v0;
  if (E >= 0) return { escape: true, E, L, r0, a: Infinity, rApo: Infinity, rPeri: r0, ecc: 1 };
  const a = -mu / (2 * E);
  const ecc = Math.sqrt(Math.max(0, 1 + 2 * E * L * L / (mu * mu)));
  return { escape: false, E, L, r0, a, rApo: a * (1 + ecc), rPeri: a * (1 - ecc), ecc };
}

/** Δv de circularización en el apogeo (ecuación vis-viva). m/s */
export function circularizationDeltaV(p) {
  const geo = transferGeometry(p);
  if (geo.escape) return { deltaV: NaN, geo };
  const mu = G * p.M;
  const vApo = Math.sqrt(mu * (2 / geo.rApo - 1 / geo.a));
  const vCirc = Math.sqrt(mu / geo.rApo);
  return { deltaV: vCirc - vApo, vApo, vCirc, geo };
}

/** v0 (m/s) que da una órbita de transferencia con perigeo r0 y apogeo rApo (m). */
export function launchVelocityForApogee(M, r0, rApo) {
  const mu = G * M;
  const a = (r0 + rApo) / 2;
  return Math.sqrt(mu * (2 / r0 - 1 / a));
}

/**
 * Aplica el impulso instantáneo de circularización (mantiene la dirección de v).
 * @param {{x:number,y:number,vx:number,vy:number,t:number}} s  estado en el apogeo
 * @param {number} M  kg
 * @returns {{newState:object,deltaV:number}} deltaV en m/s
 */
export function applyCircularization(s, M) {
  const r = Math.hypot(s.x, s.y);
  const vAct = Math.hypot(s.vx, s.vy);
  const vCirc = circularVelocity(M, r);
  const k = vCirc / vAct;
  return { newState: { ...s, vx: s.vx * k, vy: s.vy * k }, deltaV: vCirc - vAct };
}

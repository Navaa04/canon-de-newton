/**
 * Aceleración por arrastre atmosférico: a = -½ρ·Cd·(A/m)·|v|·v
 * Modelo provisional (densidad exponencial). Devuelve 0 si la atmósfera está apagada.
 * @param {{x:number,y:number,vx:number,vy:number}} s
 * @param {{atmosfera:boolean,R:number,altAtmosfera:number,rho0:number,escalaAltura:number,Cd:number,areaSobreMasa:number}} p
 * @returns {{ax:number,ay:number}} m/s²
 */
export function computeDragAcceleration(s, p) {
  if (!p.atmosfera) return { ax: 0, ay: 0 };
  const r = Math.hypot(s.x, s.y);
  const alt = r - p.R;
  if (alt > p.altAtmosfera || alt < 0) return { ax: 0, ay: 0 };
  const rho = p.rho0 * Math.exp(-alt / p.escalaAltura);
  const v = Math.hypot(s.vx, s.vy);
  const k = -0.5 * rho * p.Cd * p.areaSobreMasa * v;
  return { ax: k * s.vx, ay: k * s.vy };
}

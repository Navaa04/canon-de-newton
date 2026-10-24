import { describe, it, expect } from 'vitest';
import { runScenario, COLUMNAS } from '../scripts/headless.js';

describe('Escenario headless (CSV auditable)', () => {
  const { csv, resumen } = runScenario();
  const filas = csv.trim().split('\n');

  it('H1 · El CSV tiene la cabecera esperada y filas con el mismo número de columnas', () => {
    expect(filas[0]).toBe(COLUMNAS.join(','));
    for (const f of filas.slice(1)) expect(f.split(',').length).toBe(COLUMNAS.length);
    expect(filas.length).toBeGreaterThan(100);
  });

  it('H2 · Es determinista: dos corridas generan exactamente el mismo CSV', () => {
    expect(runScenario().csv).toBe(csv);
  });

  it('H3 · Dictamen: órbita conforme (±2 %) y Δv simulado ≈ Δv analítico (< 0.1 %)', () => {
    expect(resumen.dictamen).toBe('orbita conforme');
    expect(Math.abs(resumen.errorRelativo)).toBeLessThan(0.02);
    expect(Math.abs(resumen.deltaVcirc_ms - resumen.deltaVcirc_analitico_ms) / resumen.deltaVcirc_analitico_ms).toBeLessThan(0.001);
  });

  it('H4 · El CSV registra el evento de circularización', () => {
    expect(filas.some(f => f.endsWith(',circularizacion'))).toBe(true);
  });
});

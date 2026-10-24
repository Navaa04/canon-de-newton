import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// La librería no puede conocer la interfaz (regla del Avance 2).
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'physics');
const PROHIBIDO = /\b(document|window|canvas|requestAnimationFrame|localStorage|Math\.random)\b/;

describe('Independencia de la interfaz', () => {
  for (const f of readdirSync(dir).filter(n => /\.(js|ts)$/.test(n))) {
    it(`I · ${f} no referencia DOM, canvas ni aleatoriedad`, () => {
      expect(readFileSync(join(dir, f), 'utf8')).not.toMatch(PROHIBIDO);
    });
  }
});

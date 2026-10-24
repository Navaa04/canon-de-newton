## Instalación, pruebas y ejecución headless

```bash
npm install          # instala dependencias (Vitest)
npm test             # corre las pruebas unitarias y de validación analítica
npm run headless     # corre el escenario fijo sin interfaz y escribe output/headless.csv
```

### Pruebas de validación analítica (tolerancias declaradas)

| ID | Escenario | Referencia analítica | Tolerancia |
|----|-----------|----------------------|-----------|
| V1 | Caída libre desde h = 100 m | t = √(2h/g) | 0.5 % |
| V2 | Proyectil horizontal (h = 100 m, v₀ = 50 m/s) | x = v₀·√(2h/g) | 0.5 % |
| V3 | Caída radial h = 1000 km (gravedad variable) | fórmula de Kepler radial | 1 % |
| V4 | Órbita circular a 300 km | T = 2π√(r³/μ), radio constante | 0.5 % |
| V5 | Δv de circularización | 2.º impulso de Hohmann | 1e-6 |
| V6 | Apogeo de la órbita de transferencia | ecuación vis-viva | 0.5 % |
| C1 | Energía mecánica, 10 órbitas | E constante | 1 % |
| C2 | Momento angular, sin arrastre | L constante | 1e-9 |
| C3 | Con atmósfera | la energía total disminuye | — |
| E1–E5 | Velocidad de escape, clasificación y barrido | E = 0 en v_esc; fronteras coherentes | 1e-12 / — |
| P1–P3, I | Pureza, determinismo e independencia de la interfaz | — | exacto |

### Escenario headless

Tierra (M = 5.972×10²⁴ kg, R = 6371 km), torre a 300 km, órbita objetivo a 1200 km, dt = 1 s.
Se lanza con la v₀ de la transferencia, se circulariza en el apogeo y se simulan 2 vueltas más.
El CSV (`output/headless.csv`) trae t, x, y, vx, vy, r, altura, rapidez, Ek, Ep, E total (J/kg), L (m²/s) y el evento
(`lanzamiento`, `circularizacion`, `fin`). La consola imprime v₀, Δv_circ, Δv_total y el dictamen.

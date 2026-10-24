## Instalación, pruebas y ejecución headless

```bash
npm install          # instala dependencias (Vitest)
npm test             # corre las pruebas unitarias y de validación analítica
npm run headless     # corre el escenario fijo sin interfaz y escribe output/headless.csv
```

### Pruebas de validación analítica (tolerancias declaradas)

| ID | Escenario | Referencia analítica | Tolerancia | Error medido | Justificación |
|----|-----------|----------------------|-----------|--------------|---------------|
| V1 | Caída libre desde h = 100 m | t = √(2h/g) | 0.5 % | 0.01 % | dt = 1 ms; el error viene del paso del integrador y de la variación de g con la altura (despreciable en 100 m). |
| V2 | Proyectil horizontal (h = 100 m, v₀ = 50 m/s) | x = v₀·√(2h/g) | 0.5 % | 0.002 % | Mismo origen que V1; la tolerancia deja un margen amplio sobre el error del integrador. |
| V3 | Caída radial h = 1000 km (gravedad variable) | fórmula de Kepler radial | 1 % | 0.05 % | dt = 0.5 s; es más laxa porque la caída termina con velocidad alta y el cruce con la superficie se interpola linealmente. |
| V4 | Órbita circular a 300 km | T = 2π√(r³/μ), radio constante | 0.5 % | 0.0001 % (T), 0.06 % (r) | dt = 1 s sobre un período de unos 5400 s; el radio oscila levemente por la discretización de Euler semi-implícito. |
| V5 | Δv de circularización | 2.º impulso de Hohmann | 1e-6 | 2.6e-14 | Es una igualdad algebraica entre dos fórmulas cerradas: solo hay error de redondeo. |
| V6 | Apogeo de la órbita de transferencia | ecuación vis-viva | 0.5 % | 0.0004 % | dt = 1 s; el máximo se toma de muestras discretas, no del instante exacto del apogeo. |
| C1 | Energía mecánica, 10 órbitas | E constante | 1 % | 0.005 % | Es el 1 % que pide la consigna. Euler semi-implícito es simpléctico: la energía oscila acotada, no se desvía. |
| C2 | Momento angular, sin arrastre | L constante | 1e-9 | 6.4e-15 | La fuerza es central y el esquema conserva L salvo redondeo; 1e-9 es holgado frente a eso. |
| M1 | Circularización en el apogeo | v tras el impulso = v_circ(r) y Δv = v_circ − v_apo | 1e-12 (v), 1e-9 (Δv) | 1.3e-16 (v), 2.3e-14 (Δv) | Comparación contra fórmulas cerradas: solo hay error de redondeo. |
| C3 | Con atmósfera | la energía total disminuye | — | — | Prueba cualitativa: el arrastre solo puede disipar energía. |
| E1–E5 | Velocidad de escape, clasificación y barrido | E = 0 en v_esc; fronteras coherentes | 1e-12 (E1), ±0.1 % (E2), ±1.5 % (E5) | 0 (E1) | Igualdades de fórmulas cerradas (redondeo) y fronteras de clasificación. |
| H1–H4 | Escenario headless (CSV) | Cabecera y columnas correctas; mismo CSV en dos corridas; evento de circularización; dictamen "órbita conforme" | exacto / 2 % (radio final) / 0.1 % (Δv) | 0.0001 % (radio final), 0.002 % (Δv) | El 2 % es la tolerancia del dictamen del Avance 1. El Δv simulado se compara con el analítico de vis-viva. |
| P1–P3, I | Pureza, determinismo e independencia de la interfaz | — | exacto | — | Comparaciones exactas: no hay error numérico que tolerar. |

Los errores medidos corresponden al código y a los pasos de tiempo de estas pruebas; si se cambia el integrador o algún `dt`, hay que volver a medirlos.

### Escenario headless

Tierra (M = 5.972×10²⁴ kg, R = 6371 km), torre a 300 km, órbita objetivo a 1200 km, dt = 1 s.
Se lanza con la v₀ de la transferencia, se circulariza en el apogeo y se simulan 2 vueltas más.
El CSV (`output/headless.csv`) trae t, x, y, vx, vy, r, altura, rapidez, Ek, Ep, E total (J/kg), L (m²/s) y el evento
(`lanzamiento`, `circularizacion`, `fin`). La consola imprime v₀, Δv_circ, Δv_total y el dictamen.
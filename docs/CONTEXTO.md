# Academia La Red de Luz · contexto del proyecto

Documento para retomar el trabajo desde cero, con otra IA o con otra persona.
Estado a 1 de septiembre de 2026, después de unificar el motor.

---

## Qué es esto

Un sitio estático publicado en `academia.lareddeluz.com` desde GitHub Pages.
No hay backend, ni base de datos, ni build tool: Node plano con archivos `.cjs`.

Dos cursos, que aquí se llaman **constelaciones**:

| Constelación | Ruta | Identidad |
|---|---|---|
| De tu Mente al Mundo (DTMM) | `/dtmm/` | Dorado `#e8a13c`, Unbounded, figura Lyra |
| ¡Hablemos Inglés! | `/ingles/` | Rojo `#c8102e`, Archivo Black, figura Gemini |

Vocabulario de la casa: un **nodo** es una persona dentro de La Red de Luz.

---

## Estructura

```
academy/
  index.html                    portada de Academia
  academy.courses.json          manifiesto: qué cursos hay y dónde se publican

  motor/                        ← el motor, una sola vez para todos
    hub.js                      dibuja el hub desde constelacion.json + clases.json
    hub.css                     estructura del hub (sin marca)
    deck.js                     navegación de presentaciones (HUD, notas, teclado)
    deck.css                    estructura y átomos de las slides
    progreso.js                 avance del alumno
    temas/
      dtmm.css                  tokens, tipografías y motivo de DTMM
      ingles.css                íd. de Inglés
    README.md                   catálogo de átomos para escribir un deck

  cursos/dtmm/
    constelacion.json           identidad, figura, menú, capacidades
    clases.json                 contenido: filas y clases
    index.html                  hub
    clase.html                  detalle de una clase (grabación + recursos)
    repaso.html                 video + presentación lado a lado
    basico/*.html               los decks, uno por clase
    intermedio/ avanzado/ ventas/ herramientas-ia/ masterclass/
    assets/video.js
    shared/assets/imgs/         imágenes que se publican en la raíz del sitio

  cursos/ingles/
    constelacion.json
    clases.json
    index.html
    sesion-*.html               los decks
    recursos.html
    recursos/                   apps didácticas (autónomas, ver abajo)
    assets/ingles.css           overrides propios del curso
    assets/motor/imgs/
    scripts/                    pruebas propias del curso

  scripts/
    build-academy.cjs           arma el sitio publicable
    serve-site.cjs              servidor local para revisar _site
    test-*.cjs                  las pruebas

  docs/
    architecture/academy-platform-vision.md    visión a largo plazo (aprobada)
    superpowers/plans/                          planes por trabajo
```

---

## Las dos ideas que sostienen todo

### 1. El motor no conoce a ninguna constelación por su nombre

Todo lo que distingue a DTMM de Inglés vive en datos, no en código:

- **`constelacion.json`** — identidad, figura (como coordenadas SVG), menú y
  capacidades. Ejemplo real: el menú de Inglés lleva *Recursos* porque son
  abiertos; el de DTMM no. Eso es un dato, no un `if`.
- **`motor/temas/<id>.css`** — tokens de color, tipografías y motivo de fondo.

Hay una prueba que falla si el motor menciona `theme-dtmm`, `figuraGemini` o
similares. Si necesitas una excepción por constelación, va en su configuración.

**Cada página que usa el motor declara su tema en dos sitios**, y hacen falta
los dos:

```html
<link rel="stylesheet" href="assets/motor/temas/ingles.css">
<body class="theme-ingles">
```

Falta uno y la página cae al tema por defecto del motor. Pasó de verdad: los
decks de Inglés salieron dorados. `test-motor-hub.cjs` lo comprueba ahora en
todas las páginas.

### 2. Sólo `progreso.js` habla con el almacenamiento

```js
Progreso.visto(cursoId, claseId)
Progreso.marcar(cursoId, claseId, estado)   // 'visto' | 'curso' | 'nuevo'
Progreso.delCurso(cursoId)
Progreso.ultima(cursoId)
```

Los métodos son **async aunque hoy `localStorage` sea síncrono**. Es
deliberado: el día que la respuesta venga de la red no hay que tocar ningún
punto de llamada.

El formato guarda `ts` por clase, `esquema` y `dispositivoId`:

```json
{
  "esquema": 1,
  "dispositivoId": "d7f3a91c",
  "cursos": {
    "ingles": {
      "clases": { "sesion-3": { "estado": "visto", "ts": "2026-09-01T18:22:11Z" } },
      "ultima": "sesion-5"
    }
  }
}
```

La fecha es lo que permitirá fusionar dos dispositivos sin perder nada cuando
existan cuentas. Sin ella habría que escoger uno y tirar el otro.

**Limitación real:** el progreso es por navegador. En incógnito o al limpiar
datos del sitio se pierde. Eso sólo lo resuelven las cuentas.

---

## Cómo trabajar aquí

```bash
node scripts/build-academy.cjs --out _site    # arma el sitio
node scripts/serve-site.cjs                   # sírvelo en localhost:4173
```

**Nunca abras los HTML con `file://`**: el hub hace `fetch` de sus JSON y el
navegador lo bloquea. Hace falta el servidor.

### Las pruebas

Corren en CI antes de cada publicación. En local:

```bash
node scripts/test-academy-index.cjs
node scripts/test-monorepo-boundaries.cjs
node scripts/test-build-academy.cjs
node scripts/test-academy-hubs-structure.cjs
node scripts/test-motor-hub.cjs
node scripts/test-progreso.cjs
node cursos/ingles/scripts/test-academy-shell.cjs
node cursos/ingles/scripts/test-grammar-grill.cjs
node cursos/ingles/scripts/test-grammar-grill-ui.cjs
node scripts/build-academy.cjs --out _site
node scripts/test-route-parity.cjs _site
```

Si agregas una prueba, añádela **en dos sitios**: el workflow
`.github/workflows/deploy-pages.yml` y la lista de
`scripts/test-monorepo-boundaries.cjs`, que verifica que el workflow la corra.

### Publicar

`git push` a `master` dispara el workflow: corre las pruebas, arma el sitio y
lo publica. No hay paso manual. Las ramas no disparan nada.

---

## Tareas frecuentes

**Agregar una clase** → un objeto en `clases.json` y su deck en HTML. No se
toca el motor.

**Agregar un deck** → copia la plantilla de `motor/README.md`. Recuerda el
`<link>` del tema y la clase del `<body>`.

**Cambiar el color de una constelación** → sólo `motor/temas/<id>.css`.

**Agregar una constelación nueva** → carpeta en `cursos/`, su
`constelacion.json` y `clases.json`, su tema en `motor/temas/`, y una entrada
en `academy.courses.json`.

---

## Detalles que muerden

**Finales de línea.** El repo guarda LF y Windows usa CRLF. `sed -i` convierte
el archivo entero y ensucia el diff con 300 líneas fantasma. Usa
`perl -0pi -e` con patrones que no dependan de `^`/`$`.

**Las apps didácticas son autónomas.** `grammar-grill`, `flashcards` y
`100-palabras` traen su propio CSS y no dependen del motor ni del tema. No las
metas en el sistema de temas.

**El build inyecta `<link rel="canonical">`** apuntando al dominio real. Por
eso al navegar el sitio local algunos enlaces saltan a producción. Es correcto,
no un bug.

**El motor de decks está unificado pero los decks siguen siendo HTML.** Cada
deck trae su `<style>` propio (~150 KB repartidos en 30 archivos). La regla
vigente: *si un átomo aparece en tres o más decks, sube a `motor/deck.css`*.

---

## Estado actual

### Hecho

- Motor unificado: `hub.js` (era `hub.js` 391 líneas + `ingles.js` 220, con
  once funciones homónimas y ninguna idéntica), `hub.css`, `deck.css`, `deck.js`.
- `constelacion.json` por constelación; identidad fuera del código.
- Temas separados en `motor/temas/`.
- Capa `Progreso` con API async y formato pensado para migrar.
- Rejilla en vez del riel horizontal, que cortaba la última tarjeta y metía un
  scroll dentro de otro.
- Estados de tarjeta: vista / aquí te quedaste / próximamente, y barra por fila.
  El estado se lee por forma además de por color, y se anuncia a lectores de
  pantalla.
- Cuatro solapamientos corregidos, cada uno con prueba de regresión:
  enlaces del cajón sin estilo, firma sobre la ayuda de teclado, QR contra el
  HUD, y *Recursos* duplicado en el menú.

### Pendiente

1. **Slide que no cabe.** `dtmm/masterclass/por-que-nadie-te-escribe` #10: el
   chip choca con el chrome en ventanas bajas. Es contenido que no cabe, no
   fallo del motor. Se arregla partiendo la slide o soltando el chip — cambia
   lo que ve el alumno, así que es decisión de Javier.

2. **Los decks siguen siendo HTML.** El plan escrito es migrarlos a
   `.deck.json` con un renderer que corra igual en el build y en el navegador.
   Está en `docs/superpowers/plans/2026-09-01-deck-framework.md`, con el
   contrato de dos caras (`render` + `campos`) que permitiría un editor visual
   después. **No empezado.**

3. **Vaciar los `<style>` por deck** subiendo al motor lo que se repita.

4. **Cuentas y progreso en servidor.** Fase 5 de la visión. La capa `Progreso`
   ya está preparada; falta el backend.

---

## Para leer antes de proponer arquitectura

`docs/architecture/academy-platform-vision.md` — visión aprobada, con fases 0 a
5, el framework de DEX, el Studio de autoría y el papel de la IA. Lo hecho hasta
ahora implementa parte de la Fase 1.

La recomendación registrada es **no migrar a Next.js todavía**: resuelve login,
progreso y pagos, que aún no existen. Lo que duele hoy es el contenido atrapado
en HTML, y eso se arregla con el contrato de datos, que sirve igual en el sitio
estático de hoy que en el Next de mañana.

# Plan · Framework de decks (`.deck.json` + motor)

**Fecha:** 1 de septiembre de 2026
**Estado:** en curso — nada publicado todavía
**Contexto:** implementa la Fase 1 y la Fase 2 de [la visión de arquitectura](../../architecture/academy-platform-vision.md).

## Avance

| Paso | Estado |
|---|---|
| Motor de decks unificado en `motor/` | Hecho, verificado archivo por archivo contra el sitio actual |
| `hub.css` unificado (también estaba duplicado) | Hecho |
| `constelacion.json` por constelación | Hecho — identidad, figura, menú y capacidades |
| Capa `Progreso` con API async | Hecho, con pruebas |
| Bug del cajón de navegación | Arreglado, con prueba que detecta la regresión |
| Fusionar `hub.js` + `ingles.js` en un motor | Pendiente |
| Rejilla en vez de rieles | Pendiente |
| Extraer temas a `motor/temas/` | Pendiente |
| Migrar los 32 decks a `.deck.json` | Pendiente |

Catálogo visual de componentes aprobado por revisar:
`https://claude.ai/code/artifact/7368f21c-06f8-4d12-be76-082adc137330`

### El bug del cajón

Los enlaces del menú lateral salían **azules y subrayados** — el aspecto por
defecto del navegador — cuando el cajón se abría por falta de ancho.

Causa: el cajón se abre por dos caminos, el `@media(max-width:820px)` y
`body.nav-overflow` (que salta en cualquier ancho cuando la nav no cabe), pero
todo el estilo de sus enlaces vivía **dentro** del media query. Por el segundo
camino no se aplicaba nada.

Arreglo: sacar el contenido del cajón fuera del `@media`; ahí dentro queda sólo
lo que de verdad depende del ancho. `scripts/test-motor-hub.cjs` comprueba que
no vuelva a entrar, y se verificó que la prueba falla si se reintroduce.

## El problema, medido

El motor actual ya está bien hecho: `deck.js` genera todo el chrome y `deck.css`
tiene el tema en un solo bloque de tokens. Lo que falla no es el motor, es que
**el contenido vive dentro del HTML**, y eso produce tres costos concretos:

| Síntoma | Medida real hoy |
|---|---|
| Motor duplicado | `cursos/dtmm/assets/deck.{js,css}` y `cursos/ingles/assets/motor/deck.{js,css}` son **byte por byte idénticos** (6 610 y 19 637 bytes). Cada arreglo hay que hacerlo dos veces. |
| CSS suelto por deck | ~150 KB de `<style>` repartidos en 30 archivos. `avatar-cliente-2.html` carga 8 405 bytes propios; `flashcards.html`, 15 623. |
| Contenido no consultable | 32 decks, ~380 slides. No se puede listar, buscar, traducir ni reordenar sin abrir HTML a mano. |

El catálogo de átomos (`slide`, `eyebrow`, `mega`, `lead`, `split`, `steps`,
`ab`, `cascade`, `gradlist`, `fill`, `dm`, `chip`…) ya está estabilizado y
documentado en `cursos/dtmm/assets/README.md`. **Ese catálogo es el schema**: no
hay que inventarlo, hay que extraerlo.

## La decisión de fondo

La visión aprobada apunta a Next.js. **No empezamos por ahí.** El backend en
Next/React resuelve identidad, membresías, progreso y pagos — cosas que hoy no
existen todavía. Lo que duele hoy es el contenido atrapado en HTML, y eso se
resuelve con un contrato de datos que sirve *igual de bien* en el sitio estático
de hoy que en el Next.js de mañana.

El orden correcto es:

```
.deck.json  →  deck-core (sin DOM)  →  renderer estático  →  renderer React
                                            (hoy)            (cuando haya login)
```

Si escribiéramos el schema *después* de migrar a React, el schema saldría con
forma de React y dejaría de ser exportable — que es justo lo que la visión pide
evitar ("el framework debe ser portable y no depender de Next.js").

## El contrato: `.deck.json`

Un deck es un documento. La portada de `redes-desde-cero-1.html` queda así:

```json
{
  "schema": 1,
  "id": "redes-desde-cero-1",
  "titulo": "Antes de publicar, ¿a quién le hablas?",
  "curso": "dtmm",
  "volver": { "href": "../clase.html?id=redes-desde-cero-1", "texto": "‹ Clase" },
  "slides": [
    {
      "tipo": "portada",
      "eyebrow": "Redes desde cero · Nivel Básico · Parte 1",
      "titulo": "Antes de publicar,\n¿a quién le {hablas?}",
      "lead": "La primera decisión que casi nadie toma… y la que lo cambia *todo*.",
      "glow": "tr",
      "notas": "Arranca preguntando en voz alta."
    },
    {
      "tipo": "comparacion",
      "eyebrow": "El cambio",
      "antes": { "label": "Sin avatar", "texto": "Hola a todos 👋" },
      "despues": { "label": "Con avatar", "texto": "Si tienes un changarro y nadie te encuentra…" }
    }
  ]
}
```

Reglas del contrato:

- `{llaves}` marcan el resaltado de marca (hoy `<span class="hl">`). `*asteriscos*`
  marcan énfasis. Nada de HTML crudo en el contenido — así el mismo documento
  puede renderizarse a PDF o a otro medio después.
- Cada `tipo` de slide corresponde a un átomo ya existente en `deck.css`. Nada
  nuevo se inventa en esta etapa.
- `estilo` es un campo opcional por deck para el CSS que hoy vive en `<style>`.
  Se migra tal cual al principio; se va vaciando conforme los átomos suben al
  motor (la regla que ya existe: *si aparece en tres decks, sube a `deck.css`*).

### Tipos iniciales

Salen uno a uno de los átomos que ya se usan, ordenados por frecuencia real:

`portada` · `enunciado` · `comparacion` (`ab`) · `proceso` (`steps`) ·
`lista` (`gradlist`) · `cascada` (`cascade`) · `dialogo` (`dm`) ·
`dato` (`stat`) · `cita` (`quote`) · `rellenar` (`fill`) · `dos-columnas` (`split`) ·
`recursos` (`reslist`) · `libre` (escotilla: HTML crudo, para lo que aún no tiene tipo)

`libre` es deliberado: permite migrar el 100% de los decks desde el día uno sin
quedarnos atorados en la slide rara. Cada `libre` que se repite es la señal de
que falta un tipo.

## Estructura de archivos

```
motor/                          ← un solo motor, no dos
  deck.css                      ← el actual, sin cambios
  deck.js                       ← chrome + navegación (el actual)
  deck-core.js                  ← estado y validación, sin DOM
  deck-render.js                ← .deck.json → DOM
  temas/
    dtmm.css                    ← solo el bloque :root
    ingles.css
  README.md                     ← el catálogo, ya escrito

cursos/dtmm/
  basico/redes-desde-cero-1.deck.json
  ...
```

`deck-core.js` sin DOM es lo que permite después reusarlo desde React, desde un
Web Component o desde un exportador, sin reescribir la lógica de navegación.

## El renderer corre en dos momentos

Decisión de diseño que hay que respetar desde el principio, aunque el Studio
llegue mucho después:

```
                    ┌─────────────────┐
    .deck.json ───▶ │  deck-render.js │ ───▶ HTML
                    └─────────────────┘
                            ▲
                            │  el mismo archivo
                    ┌───────┴────────┐
                    │                │
              en el BUILD      en el NAVEGADOR
              (Node, deploy)   (Studio, preview)
```

`deck-render.js` es una **función pura**: entra JSON, sale texto HTML. Sin
efectos, sin estado, sin `document`. En Node se escribe a un archivo; en el
navegador se mete en un `innerHTML`. Mismo código, mismo resultado.

Si se escribe atado a Node, el Studio necesitará un segundo renderer y los dos se
van a desincronizar — el clásico "en el editor se ve bien pero publicado no".
Escribirlo puro no cuesta trabajo extra hoy; rehacerlo después sí.

## Contrato de dos caras por tipo de slide

Cada tipo declara **cómo se dibuja** y **qué se puede editar**:

```js
comparacion: {
  // cómo se dibuja  ← lo que necesita el build
  render: (s) => `...`,

  // qué se puede editar  ← lo que necesitará el Studio
  campos: {
    eyebrow: { tipo: 'texto', etiqueta: 'Etiqueta superior' },
    antes:   { tipo: 'grupo', etiqueta: 'Antes',
               campos: { label: 'texto', texto: 'parrafo' } },
    despues: { tipo: 'grupo', etiqueta: 'Después',
               campos: { label: 'texto', texto: 'parrafo' } },
    notas:   { tipo: 'parrafo', etiqueta: 'Notas del ponente' }
  }
}
```

Con `campos`, el inspector del Studio **se genera solo**: un formulario que lee
la declaración, no uno escrito a mano por tipo. Se agrega un tipo una vez y
aparece en el renderer *y* en el editor.

`campos` no es trabajo perdido mientras no exista el Studio: el build lo usa
desde el día uno para validar que un deck no traiga campos inventados.

### Guardado, cuando llegue el Studio

Conviene separar dos cosas que suenan iguales:

- **Guardar el archivo** no necesita infraestructura. El Studio puede ser una
  página estática: abres un `.deck.json`, editas, descargas el archivo. Sin
  login, sin servidor. Utilizable desde el día uno.
- **Guardar en la nube con cuentas** sí necesita el backend (login, permisos,
  versiones, autoría). Es la Fase 5 de la visión.

La primera versión del Studio no espera al backend. Cuando el backend llegue,
cambia de dónde sale el JSON y a dónde se manda; el editor y el renderer no se
tocan.

## Cómo se sirve

El sitio sigue siendo estático. `scripts/build-academy.cjs` ya recorre, valida
referencias y normaliza HTML — se le añade un paso: **cada `.deck.json` se
compila a un `.html` autónomo en el build**.

Esto importa: el HTML publicado sigue siendo un archivo suelto que abre sin
JavaScript de arranque ni fetch. No se pierde velocidad, no se pierde el
funcionamiento offline, y el validador de enlaces que ya existe sigue aplicando.
El JSON es la fuente; el HTML es el artefacto.

Ventaja adicional: la validación de schema entra en el build, así que un deck
mal formado rompe el deploy en vez de llegar a producción roto.

## Migración

Estricta regla de oro: **el HTML publicado no puede cambiar de forma visible.**
Se compara byte a byte (normalizando espacios) el HTML generado contra el actual.

1. **Unificar el motor.** Borrar el duplicado de `ingles/assets/motor/`, dejar
   `motor/` en la raíz. Cero cambio visual — son archivos idénticos.
2. **Extraer los temas.** Sacar el bloque `:root` a `temas/dtmm.css` y
   `temas/ingles.css`. Cero cambio visual.
3. **Escribir el schema y el renderer** contra *un* deck real
   (`sesion-3.html`, 10 slides, 3 618 bytes de CSS propio — tamaño medio).
   Prueba de aceptación: el HTML compilado equivale al actual.
4. **Migrar por lotes**, curso por curso, verificando cada lote con las pruebas
   que ya existen (`test-route-parity.cjs`, `test-academy-hubs-e2e.cjs`).
5. **Vaciar los `<style>`** subiendo al motor los átomos que se repitan.

Los recursos interactivos (`grammar-grill`, `flashcards`, `100-palabras`) **no se
tocan**: son aplicaciones, no decks. Entran después al registro de recursos como
dice la visión.

## Qué se trae de Refero

Consultado; hay dos cosas que sirven de verdad y una que conviene descartar.

**Sirve — el layout del Studio (Synthesia).** El editor de tres paneles que la
visión dibuja a mano (`estructura · preview · inspector`) está validado en
producción en Synthesia: rail de escenas a la izquierda, canvas al centro,
inspector de propiedades a la derecha. Refero tiene además los flows de
`Deleting canvas elements`, `Replacing media asset` y `Uploading asset`
(IDs 13736, 13732, 13737) — que son exactamente los comandos `DeleteBlock`,
`UpdateBlock` y los assets del plan. Cuando toque construir el Studio (Fase 4),
esto ahorra el diseño desde cero.

**Sirve — el flow de creación de curso de Teachable** (flow 9573, 34 pasos), que
cubre el alta de curso paso a paso incluyendo generación asistida por IA del
temario. Es el mapa del alta de constelación.

**Descartar — la estética.** Refero tiene referencias cálidas afines (Delphi:
pergamino `#fdf6ee`, cognac `#2b180a`, serif de display en peso ligero con
tracking negativo — muy cerca del `--paper #f3ead7` / `--on-paper #221a12` de
DTMM). Pero DTMM ya tiene una identidad resuelta, con `brand-profile-dtmm.md` y
`brand-profile-hablemos-ingles.md` propios. **Copiar una estética externa aquí
sería un retroceso, no una mejora.** Lo único que vale la pena adoptar de Delphi
es una técnica puntual: el tracking negativo escalonado por tamaño
(`-0.03em` a 64px, `-0.012em` a 20px) en vez del `-.02em` fijo que usa `.mega`
hoy. Es un ajuste de una línea en `deck.css`, no un rediseño.

Sobre el hub (`index.html`): tiene 30 KB de CSS en una sola línea, sin tokens
compartidos con los decks. Merece su propio pase, pero es un trabajo separado
del framework de decks y no debe mezclarse con esta migración.

## Lo que este plan deja fuera, a propósito

- **Next.js / React.** Entra en la Fase 3, cuando exista una razón de producto
  (login, progreso, pagos). El `deck-core` que sale de aquí es el que lo va a
  alimentar.
- **El Studio visual.** Fase 4. Necesita el schema terminado primero.
- **Base de datos.** Nada aquí la necesita.
- **`package.json` y bundler.** El proyecto hoy no tiene ninguno y funciona.
  Node plano con `.cjs`, como los scripts existentes.

## Criterio de terminado

- Un solo motor, sin duplicados.
- Los 32 decks son `.deck.json`; ningún HTML de deck se edita a mano.
- El HTML publicado es equivalente al actual (verificado por prueba).
- `deck-core.js` no toca el DOM.
- El build falla si un `.deck.json` no valida.

## Preguntas abiertas para Javier

1. **¿Migramos los 32 decks o solo los nuevos?** Migrar todo da una base limpia;
   migrar solo lo nuevo es menos trabajo pero deja dos formas conviviendo por
   tiempo indefinido. Recomiendo migrar todo — son 380 slides pero el renderer
   hace el trabajo pesado.
2. **¿El repaso y los hubs también se vuelven schema?** `clases.json` y
   `recursos.json` ya son datos; `clase.html` y `repaso.html` son plantillas.
   Quedarían coherentes bajo el mismo motor, pero puede ir en un segundo paso.

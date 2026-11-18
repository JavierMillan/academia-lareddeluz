# Motor de decks · Academia La Red de Luz

Todos los decks de la academia comparten `deck.css` (estructura y estilos) y
`deck.js` (navegación, HUD, notas). Un deck solo contiene **su contenido**.

El motor vive **una sola vez**, aquí en `motor/`. El build lo publica dentro de
cada curso como `assets/motor/`, así que desde un deck siempre se referencia con
esa ruta. No lo copies a un curso: un arreglo hecho en dos lugares deja de
hacerse en dos lugares tarde o temprano.

## Crear un deck nuevo

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mi clase — De tu mente al mundo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Spline+Sans:wght@300;400;500;600&family=Martian+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/motor/deck.css">
</head>
<body>

<div id="stage">
  <div class="deck" id="deck">

    <section class="slide">
      <div class="glow tr"></div>
      <div class="eyebrow">Nivel · Clase 1</div>
      <h1 class="mega">Tu titular <span class="hl">aquí</span></h1>
      <p class="lead wide mt-m">Bajada de una o dos líneas.</p>
      <div class="brandmark">De tu mente al mundo · una iniciativa de La Red de Luz</div>
    </section>

  </div>
</div>

<script src="../assets/motor/deck.js" defer></script>
</body>
</html>
```

**No copies** la barra de progreso, el HUD, el panel de notas ni el script de
navegación: `deck.js` los genera.

**Tema de la marca:** los decks de DTMM nuevos (Herramientas de IA en adelante)
cargan además el tema, justo después de `deck.css`:

```html
<link rel="stylesheet" href="../assets/motor/temas/dtmm.css">
```

## Videos dentro de una slide

Pon el `<video>` tal cual (`controls playsinline preload="none"` y un `poster`).
`deck.js` lo envuelve solo en `.media` y le agrega un botón de pantalla completa
siempre visible (también doble clic, o **espacio** y **F** cuando el video está
enfocado). Al cambiar de slide, los videos de las demás se pausan solos. Los
archivos van en `recursos/video/` de la sección, con su `.jpg` de póster, y
ligeros (2–3 MB): se descargan desde GitHub Pages.

## Botón "volver"

Por defecto apunta al hub. Para que vuelva a la vista de detalle de la clase:

```html
<body data-volver="../clase.html?id=mi-clase" data-volver-texto="‹ Clase">
```

## Notas del ponente

```html
<section class="slide" data-notes="Lo que quieres recordar al presentar. Usa <em>énfasis</em> para lo clave.">
```

Se abren con **N**. El botón solo aparece si el deck tiene al menos una nota, y
se atenúa en las slides que no la tienen.

## Atajos

| Tecla | Acción |
|---|---|
| `→` `↓` `espacio` | siguiente |
| `←` `↑` | anterior |
| `Inicio` / `Fin` | primera / última |
| `N` | notas del ponente |
| `F` | pantalla completa |
| deslizar | cambiar de slide (táctil) |

La slide actual queda en la URL (`#7`), así que se puede compartir un enlace a
una slide concreta.

## Átomos disponibles

### Slide

| Clase | Qué hace |
|---|---|
| `slide` | fondo carbón (por defecto) |
| `slide paper` | fondo crema |
| `slide center` | contenido centrado |
| `glow tr` / `br` / `bl` | mancha de luz decorativa |

### Texto

| Clase | Uso |
|---|---|
| `eyebrow` | etiqueta superior con línea |
| `mega` | titular de portada |
| `h1` | titular de slide |
| `lead` / `lead wide` | párrafo (30ch / 46ch) |
| `hl` | resalta en color de marca |
| `quote` | cita en serif itálica |
| `bigline` | frase corta grande |
| `rule` | línea degradada separadora |
| `stat` | dato gigante · `stat sm` para cifras largas |
| `serif` `mono` | cambia familia puntualmente |
| `brandmark` | firma inferior |

### Composición

| Clase | Estructura |
|---|---|
| `split` | dos columnas 1.1fr / .9fr |
| `steps` + `step` | rejilla de etapas (`.ico` `.st` `.sh`) |
| `ab` + `pub a` / `pub b` | comparación antes/después (`.label` `.txt`) |
| `cascade` | lista editorial (`.lead-num` `.main .item` `.aside-col`) |
| `gradlist` + `gitem` | checklist numerado (`.box` `.t`) |
| `fill` | plantilla para rellenar (`.blank` `.kw`) |
| `dm` + `bub them` / `bub you` | diálogo de chat (`.tag`) |
| `chip` + `dot` | llamada a pausar o preguntar |

### Espaciado

`mt-s` `mt-m` `mt-l` — márgenes superiores fluidos.

## Átomos propios de un deck

Si una slide necesita algo que no está aquí, va en un `<style>` dentro de ese
deck. **Si el mismo átomo aparece en tres o más decks, súbelo a `deck.css`** —
así es como creció este catálogo.

Átomos propios que ya se repiten (candidatos a subir al motor si aparecen en
un tercer deck): `.conector` ("Pero…" / "Por eso…" en mono, Clases 5 y 6) y
`.con-clip` + `.clip` (texto a un lado, video al otro).

## Publicar una clase nueva (checklist)

Así se subieron las Clases 5 y 6 de Herramientas de IA. En orden:

1. **El deck**: `cursos/dtmm/<seccion>/<id>.html`, con `data-volver` hacia
   `../clase.html?id=<id>` y notas del ponente en cada slide.
2. **Los recursos**: páginas sueltas en `<seccion>/recursos/`. Copian la
   estructura de `herramientas-ia/recursos/tu-video-empieza-en-el-guion.html`:
   barra superior (‹ Hub · Ver la clase · ⇩ Guardar como PDF), `.wrap`,
   `.eyebrow` "Sección · Clase N · Recurso", `.promptbox` con botón **Copiar**
   para los prompts, `.lesson` para avisos y estilos de impresión.
3. **`clases.json`**: la clase dentro de su fila, con `id`, `parte`, `titulo`,
   `resumen`, `deck`, `temas` (5–6 frases), `recursos`
   (`tipo` prompt/guia/skill, `icono`, `titulo`, `descripcion`, `url`) y
   `grabaciones` con su fecha y `"url": ""` hasta que exista el video.
4. **`scripts/academy-live-routes.json`**: agrega cada `.html` nuevo con su
   ruta pública (`dtmm/...`), en orden alfabético. Si falta, el deploy falla en
   "Verify public route parity".
5. **Prueba local**: `node scripts/build-academy.cjs --out _site`,
   `node scripts/test-route-parity.cjs _site` y los tests del workflow
   (`.github/workflows/deploy-pages.yml`). Abre el hub, la clase, el deck y
   cada recurso en el navegador, también a ancho de celular.
6. **Publica**: commit y push a `master`; GitHub Pages despliega solo.
7. **Después de la clase**: pega la URL de la grabación (abajo) y anótala en
   `cursos/dtmm/GRABACIONES.md`.

## Agregar la grabación de una clase

En `clases.json`, dentro de la clase:

```json
"grabaciones": [
  { "generacion": "1ª", "fecha": "2026-06-26",
    "url": "https://youtu.be/abc123" },
  { "generacion": "2ª", "fecha": "2026-09-14",
    "url": "https://drive.google.com/file/d/1AbC.../view" }
]
```

Pega la URL tal como la copias del navegador. Se reconocen **YouTube**, **Vimeo**
y **Google Drive** en cualquiera de sus formatos; si es otro sitio, se muestra
como enlace normal.

La más reciente se reproduce por defecto y aparece un selector para cambiar de
generación. El video se abre en **modo repaso** (`repaso.html`): la grabación de
un lado y la presentación del otro, cada una navegable por su cuenta. En celular
se apilan — video arriba, presentación abajo.

**Si el video es de Drive**, tiene que estar compartido como "cualquiera con el
enlace"; si queda privado, se ve un cuadro pidiendo iniciar sesión. YouTube "no
listado" o Vimeo con dominio restringido son más fiables para material que no
quieres público.

## Cambiar el tema

Los colores y familias viven en el primer bloque de `deck.css`. La estructura no
depende de ellos: sustituir ese bloque cambia la marca sin tocar nada más.

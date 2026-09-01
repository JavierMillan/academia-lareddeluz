# Motor de decks · DTMM

Todos los decks del programa comparten `deck.css` (estructura y estilos) y
`deck.js` (navegación, HUD, notas). Un deck solo contiene **su contenido**.

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
<link rel="stylesheet" href="../assets/deck.css">
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

<script src="../assets/deck.js" defer></script>
</body>
</html>
```

**No copies** la barra de progreso, el HUD, el panel de notas ni el script de
navegación: `deck.js` los genera.

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

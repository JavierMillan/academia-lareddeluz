# Grabaciones · dónde va cada video

Los videos están en Drive y hay que subirlos a **YouTube como "no listado"**
(no salen en búsquedas ni en tu canal; solo entra quien tiene el enlace).

Al terminar cada uno, pega su URL en `clases.json`, en el campo `url` de la
clase correspondiente. El hueco ya está creado con su fecha — solo falta el
enlace.

## Cómo pegar la URL

Sirve cualquier formato: `https://youtu.be/ABC123` o
`https://www.youtube.com/watch?v=ABC123`. Se copia del navegador tal cual.

```json
"grabaciones": [
  { "generacion": "1ª", "fecha": "2026-07-01",
    "url": "https://youtu.be/ABC123" }
]
```

Mientras `url` esté vacío, la clase muestra "Próximamente" — no se rompe nada.

## La lista

Carpeta de origen:
https://drive.google.com/drive/folders/1jHrdDtJNGLSnbH84cmjmCWH62hbDN0kk

| # | Video en Drive | Fecha | Clase en la plataforma | `id` en clases.json |
|---|---|---|---|---|
| 1 | DTMM - Porque nadie te escribe | 26 jun | Masterclass (destacado) | `por-que-nadie-te-escribe` |
| 2 | Clase Nivel Básico | 1 jul | Básico · Parte 1 | `redes-desde-cero-1` |
| 3 | Basico 2 | 7 jul | Básico · Parte 2 | `formatos-que-funcionan-2` |
| 4 | Básico 3 | 15 jul | Básico · Parte 3 | `cadencia-sostenible-3` |
| 5 | Clase Nivel Intermedio | 2 jul | Intermedio · Parte 1 | `intermedio-algoritmo-1` |
| 6 | Intermedio 2 · Recording 2 | 8 jul | Intermedio · Parte 2 | `avatar-cliente-2` |
| 7 | Clase Nivel Avanzado | 3 jul | Avanzado · Parte 1 | `avanzado-conversacion-1` |
| 8 | Ventas - Guiones | 29 jul | Ventas · Clase 1 | `guiones-estrategicos-1` |
| 9 | Ventas - Conseguir Prospectos | 31 jul | Ventas · Clase 2 | `creatividad-prospectos-2` |
| 10 | Clase IA - Practico | 6 ago | Clases abiertas | `clase-ia-practico` |
| 11 | Creacion de Videos con IA - 1 | 12 ago | Herramientas de IA · Clase 1 | `video-con-codigo-1` |

## Clases sin grabación

Existen en la plataforma pero no encontré su video en la carpeta. Si aparecen,
se agregan igual; si nunca se grabaron, se quedan sin la sección de grabación y
ya (no hace falta tocar nada).

- Básico · Parte 4 · Taller — `tu-primer-post-4`
- Intermedio · Parte 3 — `leer-metricas-3`
- Intermedio · Parte 4 · Taller — `crea-tu-carrusel-4`
- Avanzado · Parte 2 — `vender-sin-hartar-2`
- Avanzado · Parte 3 — `automatizar-ia-3`

## Al subir a YouTube

- Visibilidad: **No listado**. No "Privado" (ese no se puede incrustar) ni
  "Público" salvo que quieras que cualquiera lo encuentre.
- En la configuración del video, deja activado que se pueda incrustar.
- Si el video es largo, YouTube tarda un rato en procesar la calidad alta; se
  puede pegar el enlace antes de que termine.

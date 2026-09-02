# Navegador curricular enfocado de Academia

**Estado:** aprobado visualmente  
**Fecha:** 1 de septiembre de 2026  
**Alcance:** hubs de DTMM e Inglés

Esta especificación sustituye el tratamiento de portada y divulgación de categorías de `2026-09-01-academy-curriculum-explorer-design.md`. Conserva de ese documento el modelo de progreso, materiales, navegación libre y renderer compartido.

## Problema

El explorador curricular actual sustituyó las tarjetas grandes por filas, pero todavía abre todas las categorías en escritorio. En DTMM esto representa 24 clases en 6 categorías y produce una página de aproximadamente 4.6 pantallas de alto. La persona puede explorar el curso, pero debe procesar demasiado contenido simultáneamente.

El problema principal no es el estilo de las filas: es la divulgación inicial de todo el currículo.

## Objetivo

Mantener visibles la estructura, el progreso y la libertad de navegación del curso sin desplegar todas las clases a la vez.

La interfaz debe responder rápidamente tres preguntas:

1. ¿Dónde estoy dentro del curso?
2. ¿Qué me conviene continuar?
3. ¿Qué otras categorías puedo explorar?

## Dirección aprobada

La solución combina patrones encontrados en Refero:

- navegación lateral y panel activo de Getanchor;
- lista compacta de lecciones de Kajabi;
- rail persistente y sobrio de Base.

Estos patrones se adaptan a la identidad visual de cada constelación. No se copian colores, tipografía ni superficies de las referencias.

## Escritorio: mapa del curso y categoría activa

Debajo de una portada compacta, el currículo tendrá dos columnas:

- **Mapa del curso:** rail izquierdo de aproximadamente 220 px con todas las categorías, su progreso y un indicador de selección.
- **Categoría activa:** panel derecho con el título, subtítulo, progreso y únicamente las clases de la categoría seleccionada.

Cambiar de categoría actualizará el panel derecho sin recargar la página ni alterar el progreso. La selección inicial será:

1. la categoría que contiene la clase marcada `curso`;
2. la categoría que contiene la última clase guardada;
3. la primera categoría con una clase pendiente;
4. la primera categoría disponible.

El rail permanecerá visible mientras se recorre una categoría cuando exista espacio suficiente. No será un sidebar global de la aplicación: pertenece únicamente al currículo.

## Portada compacta

La portada conservará identidad, progreso y continuidad, pero dejará de parecer una card dentro de otra página.

Se organizará como una franja horizontal:

- identidad y descripción del curso a la izquierda;
- progreso general debajo de la descripción;
- siguiente clase a la derecha, separada por una regla vertical;
- una única acción primaria: **Comenzar**, **Continuar** o **Repasar**.

No se usará un panel con borde y esquinas redondeadas alrededor de la recomendación. En móvil, las dos zonas se apilarán y la regla pasará a ser horizontal.

## Filas de clase

Las filas conservarán el contenido actual, con menor altura y menos repetición visual:

- estado o número;
- parte y título;
- materiales disponibles;
- acción contextual.

El resumen largo se omitirá en el índice o se limitará a una línea cuando sea necesario para distinguir clases similares. La altura objetivo en escritorio será de 76–84 px.

Toda la fila de una clase publicada seguirá siendo un enlace. El orden es una recomendación, no un bloqueo.

## Móvil

En pantallas estrechas no habrá dos columnas. Las categorías se convertirán en un acordeón exclusivo:

- sólo una categoría puede permanecer abierta;
- la categoría activa se abre inicialmente;
- al abrir otra, la anterior se cierra;
- el encabezado siempre muestra nombre, cantidad y progreso;
- cada control usa un botón real con `aria-expanded` y `aria-controls`.

Este comportamiento reduce el desplazamiento sin introducir un selector horizontal difícil de recorrer.

## Estado y navegación

La categoría seleccionada es estado de presentación, no progreso académico. Cambiarla no escribe en `Progreso`.

El progreso continúa determinando:

- la recomendación de la portada;
- la categoría inicial;
- los estados `nuevo`, `curso` y `visto`;
- el progreso global y por categoría.

La navegación libre continúa dependiendo únicamente de que la clase tenga un destino publicado.

## Accesibilidad

- El mapa de escritorio se implementará como navegación de categorías con botones; no se usarán roles de tabs si el contenido no cumple por completo el patrón de teclado de tabs.
- El estado seleccionado se expondrá con `aria-current` o `aria-pressed`, según la semántica final.
- El panel tendrá un encabezado actualizado y una región viva discreta para anunciar el cambio de categoría.
- En móvil se conservará el patrón WAI-ARIA de acordeón.
- Las acciones táctiles tendrán un mínimo de 44 px.
- El foco será visible y no dependerá sólo del color.
- `prefers-reduced-motion` eliminará transiciones no esenciales.

## Degradación y datos incompletos

- Si el progreso no está disponible, se seleccionará la primera categoría con contenido y se omitirá el resumen personalizado.
- Una categoría vacía mostrará “Contenido próximamente”.
- Una clase sin destino no será foco ni enlace.
- Si JavaScript falla después de cargar los datos, el estado de error seguirá usando el mensaje existente del hub.

## Pruebas

Las pruebas cubrirán:

1. selección inicial por clase en curso, última clase, pendiente y currículo vacío;
2. cambio de categoría sin navegación ni escritura de progreso;
3. render de una sola categoría de clases en escritorio;
4. rail con todas las categorías y progreso correcto;
5. acordeón exclusivo en móvil;
6. libertad de navegación de todas las clases publicadas;
7. funcionamiento sin `localStorage`;
8. ausencia de desbordamiento a 1440, 1024, 760, 430 y 390 px;
9. paridad estructural entre DTMM e Inglés;
10. build, rutas y pruebas existentes.

## Fuera de alcance

- cambiar los reproductores o decks de clase;
- bloquear clases o añadir prerrequisitos;
- guardar en el servidor la categoría seleccionada;
- añadir búsqueda, filtros o gamificación;
- rediseñar la página global de constelaciones;
- modificar el esquema de progreso.

## Criterios de aceptación

El diseño estará implementado cuando:

- ninguna vista inicial despliegue las 24 clases de DTMM;
- escritorio muestre el mapa completo y una sola categoría activa;
- móvil mantenga una sola categoría abierta;
- la portada ocupe menos espacio y no se perciba como una card;
- cambiar de categoría sea inmediato, accesible y no afecte el progreso;
- todas las clases publicadas sigan disponibles;
- DTMM e Inglés usen el mismo renderer y comportamiento;
- las pruebas completas pasen sobre el artefacto construido.

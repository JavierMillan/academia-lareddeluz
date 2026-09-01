# Explorador curricular de Academia

**Estado:** aprobado para planificación  
**Fecha:** 1 de septiembre de 2026  
**Alcance:** hubs de constelación de Academia La Red de Luz

## Objetivo

Convertir los hubs de curso en exploradores curriculares claros. La persona debe poder recorrer todas las categorías, clases y recursos con rapidez, entender el orden recomendado y abrir cualquier contenido sin bloqueos.

El rediseño conserva una acción destacada para retomar la última clase, pero la exploración del temario es el trabajo principal de la página.

## Principios de experiencia

1. **El temario completo es visible.** Las categorías y sus clases forman el contenido principal.
2. **El orden orienta, no restringe.** Cada clase lleva una posición clara, pero todas las clases publicadas permanecen disponibles.
3. **Una sola acción domina.** La portada recomienda continuar o comenzar; las demás acciones tienen menor peso visual.
4. **El progreso informa.** Se muestra de forma general y por categoría, sin convertir la página en un tablero de estadísticas.
5. **Los materiales se reconocen antes de abrir.** Grabación, presentación, práctica y recursos aparecen como metadatos de la clase.
6. **Una plataforma, varias identidades.** DTMM e Inglés comparten estructura y comportamiento, mientras sus temas controlan color, tipografía y motivo.

## Referencias aplicadas

- **Preply:** prioriza una acción de continuidad y presenta próximos aprendizajes en una lista compacta.
- **Teachable:** agrupa el currículo por secciones y resume el contenido disponible dentro de cada clase.

Se adoptan estos patrones de producto, no su tratamiento visual. La identidad seguirá siendo la de Academia y cada constelación.

## Arquitectura de información

```text
Cascarón de Academia
└── Identidad de la constelación
    ├── Resumen de progreso
    ├── Acción recomendada
    ├── Navegación: Clases / Recursos
    └── Categorías curriculares
        ├── Encabezado y progreso
        └── Clases ordenadas
            ├── Estado
            ├── Número, título y resumen
            ├── Materiales disponibles
            └── Acción
```

## Portada de la constelación

La portada actual se compactará para dedicar más espacio al currículo. Contendrá:

- nombre, resumen y figura de la constelación;
- progreso total expresado como clases vistas sobre clases publicadas;
- barra de progreso total;
- título y contexto de la clase recomendada;
- botón **Comenzar**, **Continuar** o **Repasar**, según el progreso disponible.

La clase recomendada será, en este orden:

1. la clase marcada como `curso`;
2. la última clase guardada si continúa disponible;
3. la primera clase publicada que no esté vista;
4. la primera clase publicada, cuando todas estén vistas.

El bloque no inventará recomendaciones pedagógicas ni impedirá abrir otra clase.

## Navegación principal

Debajo de la portada habrá dos destinos:

- **Clases:** índice curricular completo;
- **Recursos:** recursos generales de la constelación, cuando estén habilitados.

En Inglés, Recursos se integrará visualmente con el hub aunque conserve su ruta actual durante esta fase. En DTMM no se mostrará la pestaña mientras la capacidad siga deshabilitada.

La navegación continuará saliendo de `constelacion.json`; el motor no introducirá condiciones por nombre de curso.

## Categorías

Cada fila de `clases.json` se representará como una categoría curricular. Su encabezado mostrará:

- título y subtítulo;
- cantidad de clases publicadas;
- progreso `vistas / publicadas`;
- control para expandir o contraer cuando corresponda.

En escritorio, todas las categorías estarán abiertas inicialmente. En móvil, la categoría que contiene la clase en curso estará abierta; si no existe, se abrirá la primera. Las demás estarán contraídas para reducir desplazamiento, pero podrán abrirse libremente.

Contraer categorías sólo cambia la presentación. No altera el progreso ni bloquea clases.

## Filas de clase

Las tarjetas grandes se sustituyen por filas curriculares. Cada fila incluirá:

- indicador de estado con forma, color y texto accesible;
- posición dentro de la categoría;
- título;
- resumen breve;
- etiquetas de materiales disponibles;
- acción contextual alineada al final.

Estados:

| Estado | Indicador | Acción |
|---|---|---|
| Vista | marca de verificación | Repasar |
| En curso | punto activo y fondo acentuado | Continuar |
| Sin comenzar | número neutro | Abrir |
| Próximamente | indicador apagado | Próximamente |

Las clases publicadas siempre serán enlaces completos. Las clases sin destino usarán contenido no interactivo y no recibirán foco.

## Materiales y datos

El motor derivará los materiales de los datos existentes:

- `deck` → Presentación;
- `grabacion` o `grabaciones[]` con URL → Grabación;
- `recursos[]` → cantidad de recursos.

Los tipos adicionales sólo se mostrarán cuando exista un campo explícito en el contrato de contenido. No se deducirán a partir del título o la descripción.

Esta fase no exige modificar los archivos de clases actuales. Si una constelación no declara un tipo de material, la interfaz simplemente omite la etiqueta.

## Progreso y flujo de datos

```text
constelacion.json ─┐
                   ├─→ hub.js ─→ portada + categorías + filas
clases.json ───────┤
                   │
Progreso.delCurso ─┘
```

`progreso.js` seguirá siendo el único módulo que accede a almacenamiento. `hub.js` consumirá su API asíncrona y convertirá el resultado en:

- progreso total;
- progreso por categoría;
- clase recomendada;
- estado de cada fila.

No se cambia el esquema de `localStorage`. El progreso continúa siendo local al navegador hasta que existan cuentas.

## Componentes del motor

El renderer compartido se organizará en unidades con responsabilidades claras:

- `resumenCurso`: calcula totales y selecciona la clase recomendada;
- `portadaCurso`: representa identidad, progreso y acción principal;
- `categoriaCurricular`: representa encabezado, progreso y estado expandido;
- `filaClase`: representa una clase y sus materiales;
- `navegacionCurso`: representa Clases y las capacidades adicionales;
- `activarCategorias`: controla expansión, atributos ARIA y comportamiento responsive.

Los nombres son conceptuales; el plan de implementación decidirá si conviene mantener funciones privadas dentro de `hub.js` o extraer módulos sin introducir un sistema de build.

## Tratamiento visual

La estructura común será sobria para que la identidad de la constelación tenga protagonismo:

- portada más baja y horizontal;
- currículo contenido en una columna amplia;
- categorías separadas por reglas y espacio, no por grandes superficies decorativas;
- filas densas con una zona de estado constante;
- acento de la constelación reservado para progreso, estado activo y foco;
- movimiento limitado a expansión de categorías y cambios de estado.

La figura astronómica seguirá siendo el gesto distintivo. No se añadirán ilustraciones genéricas, gráficas de actividad, rachas, puntos ni gamificación.

## Responsive y accesibilidad

- Escritorio: título, metadatos y acción comparten una fila; categorías abiertas.
- Tablet: la acción puede bajar a una segunda línea sin ocultar información.
- Móvil: categorías desplegables y filas apiladas; la acción conserva un área táctil mínima de 44 px.
- Los encabezados de categoría serán botones reales con `aria-expanded` y `aria-controls`.
- Estado y progreso tendrán texto accesible; nunca dependerán sólo del color.
- El foco será visible con los tokens de cada tema.
- `prefers-reduced-motion` eliminará transiciones de expansión y pulsos.
- El orden del DOM seguirá el orden pedagógico mostrado.

## Carga, errores y ausencia de progreso

- Mientras se leen los JSON, se conservará el estado de carga existente sin mostrar cifras falsas.
- Si falla un JSON, se mostrará el error actual con una instrucción útil para ejecución local.
- Si `Progreso` no está disponible, el currículo seguirá funcionando y se omitirá el resumen personalizado.
- Si no hay clases publicadas, la categoría mostrará “Contenido próximamente” y no una rejilla vacía.
- Los datos incompletos no deben romper otras categorías; una clase sin destino se trata como próxima.

## Pruebas

Las pruebas cubrirán:

1. selección de clase recomendada para progreso vacío, en curso y completo;
2. cálculo de progreso general y por categoría;
3. orden y libertad de navegación de las clases;
4. etiquetas derivadas de grabaciones, presentaciones y recursos;
5. estados accesibles y clases próximas no enfocables;
6. categorías abiertas en escritorio y comportamiento desplegable en móvil;
7. ausencia de desbordamiento en los breakpoints actuales;
8. paridad de comportamiento entre DTMM e Inglés;
9. respeto de capacidades declaradas en `constelacion.json`;
10. build y paridad de rutas del sitio publicable.

## Fuera de alcance

- cuentas y sincronización entre dispositivos;
- bloqueo de clases o prerrequisitos;
- porcentajes basados en tiempo de video;
- calificaciones, certificados, rachas o recompensas;
- recomendaciones generadas por IA;
- migración a React, Next.js o una base de datos;
- rediseño del reproductor de clase o de los decks;
- unificación técnica de `recursos.html` con el hub en esta fase.

## Criterios de aceptación

El diseño estará implementado cuando:

- todas las clases se puedan explorar por categoría y en orden;
- una clase publicada se pueda abrir aunque las anteriores no estén vistas;
- la acción recomendada refleje el progreso local;
- el progreso total y por categoría sea correcto y legible;
- materiales disponibles aparezcan antes de abrir la clase;
- el currículo sea compacto en escritorio y manejable en móvil;
- DTMM e Inglés compartan el mismo renderer sin condiciones por identidad;
- las pruebas existentes y las nuevas pasen sobre el artefacto construido.

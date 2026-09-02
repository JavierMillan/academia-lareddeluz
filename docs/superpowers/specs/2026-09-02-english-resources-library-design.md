# Biblioteca de recursos de Inglés

## Objetivo

Alinear `/ingles/recursos.html` con el explorador curricular nuevo sin convertir tres recursos en un catálogo sobredimensionado. La página debe sentirse como una extensión directa del hub de Inglés, cargar rápido y mantener todos los recursos visibles y accesibles.

## Alcance

- Cambiar únicamente la vista de Recursos de Inglés y sus pruebas.
- Conservar `recursos.json` como fuente de contenido y las URLs actuales de cada herramienta.
- Reutilizar el shell, los tokens y la tipografía del tema Inglés.
- No modificar el directorio principal de Academia ni las herramientas individuales.

## Dirección visual

La página funcionará como una biblioteca editorial compacta.

- Cabecera: usar el mismo shell de Academia que el hub, con contexto `Inglés / Recursos`, regreso a Clases y acceso a Todas las constelaciones.
- Introducción: un encabezado breve con etiqueta, título y descripción; sin hero monumental ni tarjeta contenedora.
- Inventario: sustituir las tarjetas redondeadas por filas planas separadas por líneas. Cada fila mostrará símbolo, nombre, descripción y una acción clara.
- Firma: una línea de inventario con nodos rojos que conecte visualmente los recursos con la idea de constelación sin añadir decoración gratuita.
- Densidad: los tres recursos deben caber dentro de una pantalla de escritorio habitual junto con la introducción y la navegación.

## Responsive

- En escritorio, el inventario usa columnas estables para símbolo, contenido y acción.
- En móvil, cada fila apila descripción y acción, conserva un área táctil mínima de 44 px y evita desbordamiento horizontal.
- El encabezado colapsa con el mismo patrón que el hub; no se duplican controles de navegación.
- Se respeta `prefers-reduced-motion` y el foco de teclado es visible.

## Estados

- Cargando: mensaje discreto dentro del inventario.
- Vacío: indicar que aún no hay recursos publicados.
- Error: explicar que no fue posible cargar los recursos y mantener visible el regreso a Clases.

## Contrato técnico

- El render continúa leyendo `recursos.json` mediante `fetch`.
- Los enlaces internos conservan el origen actual mediante el build existente.
- Las etiquetas canónicas siguen apuntando a producción.
- La estructura expone selectores semánticos y estados accesibles verificables en navegador.

## Verificación

- Prueba de estructura del shell y del inventario editorial.
- Prueba E2E en escritorio y móvil para navegación, ausencia de overflow y disponibilidad de los tres recursos.
- Build completo, paridad de rutas y revisión visual mediante capturas.


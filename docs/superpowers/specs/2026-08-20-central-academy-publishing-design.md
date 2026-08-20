# Publicación central de constelaciones en Academia

## Objetivo

Servir los hubs y sus recursos desde el dominio de Academia, sin mantener copias manuales dentro del repositorio de Academia.

Rutas canónicas aprobadas:

- `https://academia.lareddeluz.com/`
- `https://academia.lareddeluz.com/dtmm/`
- `https://academia.lareddeluz.com/ingles/`
- `https://academia.lareddeluz.com/ingles/recursos.html`

Los enlaces internos, tarjetas y navegación deben conservar al usuario dentro de `academia.lareddeluz.com`.

## Decisión arquitectónica

`academia-lareddeluz` será el repositorio publicador. El contenido seguirá editándose en sus repositorios fuente, pero GitHub Pages recibirá un artefacto ensamblado automáticamente.

En la primera etapa, la fuente vigente de ambos hubs es `De-tu-mente-al-mundo`:

- `presentacion/` se publica como `/dtmm/`.
- `ingles/` se publica como `/ingles/`.

El repositorio `hablemos-ingles` no se incorporará todavía porque su hub está detrás de la versión que hoy está en producción. Su consolidación se tratará durante la migración de framework.

## Configuración declarativa

El ensamblado se controlará con un manifiesto JSON versionado en Academia. Cada constelación declarará, como mínimo:

- identificador;
- repositorio y rama fuente;
- carpeta fuente;
- ruta pública;
- archivo de configuración de marca;
- rutas de recursos compartidos;
- hostname anterior y destino canónico.

El script de construcción leerá ese manifiesto. Añadir otra constelación no deberá exigir duplicar la lógica del build.

## Contrato de marca de cada constelación

La identidad visual no deberá quedar acoplada al HTML ni depender de reglas CSS dispersas. Cada constelación tendrá un archivo de configuración versionado que describa su personalidad dentro del sistema madre de Academia.

El contrato conservará:

- nombre, nombre corto, slug y descripción;
- figura de constelación, nombre astronómico y recurso gráfico;
- paleta mediante tokens semánticos: accent de texto, accent de superficie, fondo, panel, borde y glow;
- familias tipográficas para display, cuerpo y texto técnico;
- tratamiento de títulos: mayúsculas, peso, tracking, interlineado y segmento que recibe el accent;
- motivo de fondo y densidad decorativa;
- logotipo y assets propios, cuando existan;
- etiquetas de navegación, categorías y terminología propia;
- versión del esquema de configuración.

El cascarón seguirá controlando la estructura común: navbar, navegación móvil, espaciado base, accesibilidad, tarjetas, estados de foco y regreso a Academia. La configuración sólo podrá modificar los tokens y variantes expresamente permitidos; no inyectará CSS o JavaScript arbitrario.

Si un dato falta o no pasa validación, el cascarón usará el tema madre de La Red de Luz. Los colores de texto y controles deberán cumplir contraste antes de ser aceptados. Esto evita que una constelación nueva rompa la navegación o vuelva ilegible la interfaz.

La primera extracción tomará como referencia las identidades vigentes:

- DTMM: fondo cálido oscuro, dorado como accent, lenguaje de construcción y tipografía editorial/técnica.
- Inglés: negro, rojo como accent, Archivo Black en titulares y lenguaje de conversación/comunidad.

La configuración de marca y el contenido serán archivos separados. Cambiar clases, sesiones o recursos no deberá modificar el branding; cambiar el branding no deberá alterar el contenido didáctico.

## Flujo de publicación

1. GitHub Actions obtiene el repositorio de Academia y los repositorios fuente públicos.
2. Un script crea un directorio limpio de salida.
3. Copia el index y los assets propios de Academia.
4. Copia cada constelación a la ruta pública indicada por el manifiesto.
5. Normaliza las dependencias compartidas necesarias para que ninguna página dependa de una URL antigua.
6. Valida rutas, assets, navegación y ausencia de enlaces canónicos al subdominio obsoleto.
7. Publica un único artefacto con GitHub Pages bajo `academia.lareddeluz.com`.

El workflow correrá al cambiar Academia, manualmente y de forma programada. La primera versión evitará tokens entre repositorios; una iteración posterior podrá disparar el despliegue inmediatamente desde cada repositorio fuente.

## Transición de URLs antiguas

Los hubs incluirán una etiqueta `canonical` apuntando a Academia. Cuando una página detecte que está siendo visitada desde `detumentealmundo.lareddeluz.com`, redirigirá al equivalente canónico:

- `/presentacion/` → `https://academia.lareddeluz.com/dtmm/`
- `/ingles/…` → `https://academia.lareddeluz.com/ingles/…`

GitHub Pages no ofrece redirecciones HTTP 301 por ruta. La primera etapa usará redirección en cliente y enlace canónico. Si más adelante se requiere un 301 real, se añadirá una regla en la capa DNS/proxy sin cambiar la estructura pública.

## Compatibilidad y despliegue seguro

La publicación nueva no reemplazará el sitio general de `detumentealmundo.lareddeluz.com`; sólo trasladará sus hubs de aprendizaje. `masterclass`, servicios y otras rutas ajenas a Academia quedan fuera de alcance.

Antes de activar la nueva publicación se verificará:

- carga completa de CSS, JavaScript, JSON, imágenes y recursos;
- navegación móvil y de escritorio;
- funcionamiento de clases y decks;
- rutas relativas dentro de `/dtmm/` y `/ingles/`;
- ausencia de enlaces de regreso al dominio anterior;
- redirección correcta desde las dos rutas antiguas.

El cambio se desplegará primero sin borrar las fuentes ni los dominios anteriores. Esto permite revertir el publicador de Academia sin perder contenido.

## Relación con la futura migración a React

Las URLs públicas y el manifiesto serán contratos estables. Una futura aplicación React, Next.js o similar podrá reemplazar el ensamblador estático por rutas y componentes sin cambiar los enlaces visibles.

El futuro cascarón resolverá una ruta, cargará la configuración de marca correspondiente y aplicará sus valores mediante tokens CSS y variantes de componentes. Después cargará el contenido de clases, sesiones y recursos. Esta separación permitirá reutilizar el mismo componente de hub sin uniformar visualmente las constelaciones.

El motor de decks continuará separado del shell de navegación. La migración deberá envolverlo como módulo o aplicación embebida antes de reescribirlo, para evitar una reconstrucción innecesaria del contenido didáctico actual.

## Fuera de alcance

- Reescribir los hubs en React durante esta migración.
- Mover masterclass, servicios o el sitio corporativo de DTMM.
- Eliminar repositorios o historial.
- Introducir autenticación, base de datos o pagos.
- Reemplazar el motor de decks.

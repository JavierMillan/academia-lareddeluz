# Visión de arquitectura de Academia La Red de Luz

**Estado:** visión aprobada para orientar decisiones futuras  
**Fecha:** 20 de agosto de 2026  
**Alcance:** Academia, constelaciones, framework de DEX, recursos didácticos, IA y autoría

## Resumen ejecutivo

Academia no se concibe únicamente como un catálogo de cursos. Es una plataforma de aprendizaje y comunidad en la que una persona es un nodo y una constelación organiza nodos, conocimiento, experiencias, herramientas y conversación alrededor de una misión.

La dirección técnica acordada es una plataforma común con identidad madre, constelaciones configurables, un framework de DEX exportable y aplicaciones didácticas desarrolladas exclusivamente por el equipo. La IA se utilizará principalmente para transformar conocimiento en borradores de DEX; no generará ni publicará aplicaciones ejecutables.

La evolución deberá ser incremental. Los productos actuales continuarán funcionando mientras son incorporados gradualmente al nuevo cascarón.

## Principios

1. **Una plataforma, múltiples constelaciones.** No se desplegará una aplicación independiente por constelación.
2. **Marca madre estable, personalidad configurable.** El cascarón controla UX y accesibilidad; cada constelación aporta tokens, tipografías, motivos y lenguaje.
3. **Contenido separado de presentación y comportamiento.** Cursos, branding, DEX y aplicaciones tendrán contratos distintos.
4. **Núcleo hermético, formatos portables.** El equipo controla el código ejecutable; los documentos de contenido pueden validarse, versionarse y exportarse.
5. **Migración gradual.** No habrá una reescritura total con un único corte.
6. **La IA propone; las reglas validan; una persona publica.**
7. **Complejidad bajo demanda.** No se introducirán microservicios, bases de grafos o colaboración en tiempo real antes de necesitarlos.

## Arquitectura objetivo

```text
                         ACADEMIA LA RED DE LUZ
┌──────────────────────────────────────────────────────────────────┐
│ Cascarón madre                                                   │
│ navegación · identidad · permisos · búsqueda · comunidad · pagos │
└──────────────────────────────┬───────────────────────────────────┘
                               │
             ┌─────────────────▼─────────────────┐
             │ Registro de constelaciones        │
             │ branding · contenido · capacidades│
             └──────────┬──────────────┬─────────┘
                        │              │
                   ┌────▼────┐    ┌────▼────┐
                   │  DTMM   │    │ Inglés  │
                   └────┬────┘    └────┬────┘
                        └──────┬────────┘
                               │
             ┌─────────────────▼─────────────────┐
             │ Motores internos reutilizables    │
             │ cursos · DEX · recursos · video   │
             └─────────────────┬─────────────────┘
                               │
             ┌─────────────────▼─────────────────┐
             │ Identidad y datos                 │
             │ nodos · membresías · versiones    │
             └───────────────────────────────────┘
```

La arquitectura recomendada para la plataforma dinámica es un **monolito modular en Next.js y TypeScript**, organizado como monorepo. Los dominios estarán separados internamente, pero comenzarán dentro de una sola aplicación y una sola base de datos.

Dominios previstos:

- identidad y nodos;
- constelaciones y membresías;
- catálogo y aprendizaje;
- framework de DEX;
- recursos didácticos;
- comunidad;
- Studio de autoría;
- copiloto de IA;
- media y video;
- comercio y remuneración.

## Estructura futura del monorepo

```text
apps/
  academy/                 Plataforma pública
  studio/                  Autoría interna, separable cuando crezca
  workers/                 Procesamiento pesado futuro

packages/
  domain/                  Entidades y reglas de negocio
  constellation-schema/    Configuración de constelaciones
  content-schema/          Cursos, clases y recursos
  brand-system/            Tokens y variantes visuales
  ui/                      Cascarón y componentes compartidos
  deck-schema/             Contrato versionado de DEX
  deck-core/               Estado y reglas independientes del framework
  deck-react/              Renderer para Academia
  deck-element/            Web Component exportable
  deck-exporter/           Salida HTML/PWA
  resource-registry/       Aplicaciones internas aprobadas
  auth/                    Roles y políticas
  adapters/                Video, almacenamiento, IA y pagos
```

## Constelaciones como configuración

Cada constelación tendrá archivos separados para:

- identidad y branding;
- capacidades habilitadas;
- navegación y terminología;
- cursos, clases y recursos;
- referencias a DEX y aplicaciones internas.

La configuración de marca conservará paleta, tipografías, figura astronómica, motivos, assets, tratamiento de títulos y segmento con accent. Se validará con un esquema versionado. No podrá inyectar CSS, HTML o JavaScript arbitrario.

El cascarón aplicará valores permitidos mediante tokens CSS y variantes de componentes. Si una configuración es inválida, utilizará el tema madre de La Red de Luz.

La especificación de publicación y URLs vive en [Publicación central de constelaciones](../superpowers/specs/2026-08-20-central-academy-publishing-design.md).

## Framework de DEX

El framework debe ser portable y no depender de Next.js.

```text
Deck Document
     ↓
Deck Core
     ↓
┌─────────────┬────────────────┬────────────────┐
│ React       │ Web Component  │ Exportador     │
│ Academia    │ Embed externo  │ HTML/PWA       │
└─────────────┴────────────────┴────────────────┘
```

### Separación de responsabilidades

- **Deck Schema:** estructura, contenido, versión y referencias.
- **Deck Core:** navegación, estado, validación e interacciones.
- **Renderer:** convierte el documento en UI.
- **Theme:** aplica la identidad de una constelación.
- **Runtime:** ejecuta ejercicios, respuestas y progreso.
- **Exporter:** empaqueta el documento y sus assets.

### Componentes iniciales

- statement;
- texto e imagen;
- comparación;
- proceso o timeline;
- conversación;
- video segmentado;
- quiz;
- matching;
- flashcards;
- escenario;
- recurso embebido.

El motor utilizará Registry, Factory, Composite, Strategy, Adapter y State Machine. Sólo podrá renderizar componentes registrados y validados.

### Formas de exportación

1. Enlace alojado en Academia.
2. Web Component incrustable en otra página.
3. Paquete HTML/PWA autónomo.
4. Documento JSON portable para otra instalación compatible.

## Studio: interfaz visual para crear DEX

La edición visual forma parte del framework, no es un agregado opcional. Se construirá como un editor guiado por esquemas, no como un lienzo libre parecido a PowerPoint.

### Interfaz propuesta

```text
┌────────────────┬──────────────────────────┬─────────────────────┐
│ Estructura     │ Preview responsive       │ Inspector           │
│ secciones      │                          │ propiedades         │
│ slides         │ slide seleccionada       │ contenido           │
│ bloques        │                          │ interacción         │
│                │ desktop/tablet/mobile    │ branding + IA       │
└────────────────┴──────────────────────────┴─────────────────────┘
```

Capacidades previstas:

- crear, duplicar, ordenar y eliminar slides;
- insertar bloques desde el registro aprobado;
- edición directa de texto y medios;
- inspector generado a partir del esquema de cada componente;
- preview desktop, tablet y móvil;
- aplicación inmediata del branding de la constelación;
- validación de estructura, contraste, desbordes y contenido faltante;
- undo/redo;
- autosave de borradores;
- historial de versiones;
- comparación entre versiones;
- preview compartible;
- flujo de revisión y publicación;
- exportación.

### Modelo técnico del editor

El editor y la IA modificarán el mismo `DeckDocument` mediante comandos validados:

```text
AddSlide
MoveSlide
UpdateBlock
ApplyTheme
LinkVideoSegment
DeleteBlock
RestoreVersion
```

Cada comando será reversible para soportar undo/redo y auditable para conocer quién cambió qué. Se guardarán snapshots inmutables por versión. No se introducirá Event Sourcing completo en la primera etapa.

El registro de componentes incluirá dos contratos:

```text
rendererSchema  → cómo se representa y ejecuta
editorSchema    → qué campos puede editar el Studio
```

Esto permitirá añadir un nuevo tipo de slide una sola vez y hacerlo disponible tanto al renderer como al editor.

La colaboración simultánea mediante CRDT se evaluará cuando exista uso real de múltiples editores sobre el mismo documento. Al inicio se utilizarán bloqueo optimista, versiones y detección de conflictos.

## Aplicaciones didácticas

Las aplicaciones permanecerán herméticas. Sólo el equipo podrá crear, auditar, registrar y publicar código ejecutable.

La comunidad podrá aportar:

- necesidades pedagógicas;
- ideas de actividades;
- contenido;
- ejemplos y escenarios;
- retroalimentación.

El equipo decidirá si la necesidad se resuelve mediante un componente existente, un nuevo bloque del framework de DEX o una aplicación didáctica interna.

Las aplicaciones como Grammar Grill vivirán en un registro privado. Cada publicación conservará:

```text
autor → revisor → versión → commit → publicador
```

No se construirá un marketplace ni se ejecutará código aportado por terceros. La arquitectura interna seguirá siendo modular para conservar reutilización y auditabilidad.

## Papel de la IA

La IA será un copiloto para creación de DEX.

```text
video, transcripción, notas o intención
                    ↓
       extracción y propuesta narrativa
                    ↓
       DeckDocument con bloques permitidos
                    ↓
  validación de esquema, marca y accesibilidad
                    ↓
              preview del equipo
                    ↓
          revisión humana y publicación
```

Herramientas autorizadas:

- `createDeckDraft`;
- `createSection`;
- `addApprovedSlide`;
- `rewriteSlide`;
- `linkVideoSegment`;
- `suggestInteraction`;
- `validateDeck`;
- `validateBrand`;
- `preparePreview`.

La IA no podrá generar JavaScript ejecutable, registrar componentes, modificar el motor, publicar contenido o acceder directamente a producción.

Cuando detecte una necesidad que no cubre el registro, generará una solicitud estructurada para el equipo con objetivo pedagógico, comportamiento esperado, datos necesarios y posibilidades de reutilización.

Las modificaciones sugeridas por IA pasarán por el mismo sistema de comandos del editor. Serán visibles, reversibles y atribuibles.

## Patrones y técnicas

| Necesidad | Decisión |
|---|---|
| Evolución sin detener lo actual | Strangler Fig |
| Velocidad con límites claros | Modular Monolith |
| Dominio aislado de proveedores | Hexagonal Architecture |
| Constelaciones configurables | Schema-Driven Architecture |
| Branding variable | Strategy + Design Tokens |
| DEX compuestos por bloques | Composite + Registry + Factory |
| Aplicaciones internas | Private Plugin Registry |
| Edición reversible | Command + Immutable Versions |
| Publicación segura | State Machine |
| Integraciones futuras | Ports and Adapters |
| Segmentación de datos | Multi-tenancy + Row-Level Security |
| Procesos secundarios futuros | Domain Events + Outbox |
| Activación gradual | Feature Flags |

## Ruta de evolución

### Fase 0 — centralización actual

- Servir hubs desde `academia.lareddeluz.com`.
- Automatizar el artefacto de publicación.
- Corregir navegación y URLs antiguas.

### Fase 1 — contratos

- Inventariar el motor actual de DEX.
- Definir `ConstellationSchema`, `BrandSchema` y `DeckSchema`.
- Extraer configuraciones de DTMM e Inglés.
- Registrar los recursos actuales.

### Fase 2 — núcleo portable

- Separar `deck-core` del DOM y del renderer actual.
- Implementar validación y migraciones de documentos.
- Crear renderer compatible con los DEX existentes.
- Probar exportación autónoma.

### Fase 3 — cascarón y migración a React

- Crear monorepo y aplicación Next.js.
- Migrar el index de Academia.
- Migrar un hub completo como referencia.
- Envolver los DEX y recursos actuales sin reescribirlos.

### Fase 4 — Studio interno

- Construir navegación, canvas e inspector.
- Añadir comandos, undo/redo y versiones.
- Integrar preview responsive y validadores.
- Incorporar el copiloto de IA para borradores.

### Fase 5 — plataforma dinámica

- Identidad y membresías.
- Comunidad y comentarios.
- Progreso y actividad.
- Media y video.
- Pagos y remuneración cuando el modelo lo requiera.

## Decisiones que se revisarán después

- proveedor de hosting dinámico;
- autenticación y almacenamiento administrados;
- proveedor y estrategia de video;
- modelo de colaboración simultánea;
- búsqueda semántica y recomendaciones;
- separación eventual de workers;
- monetización y reparto de ingresos.

## Referencias

- [Next.js — Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [JSON Schema 2020-12](https://json-schema.org/specification)
- [MDN — Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)
- [Martin Fowler — Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [GitHub Pages — Custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)


# Academia La Red de Luz — Requirements y visión

> Documento de trabajo · noviembre 2026 · sin código todavía.
> Objetivo: convertir la Academia en algo mejor que Skool para nuestra comunidad en México.
> **Parte de** la visión aprobada (`docs/architecture/academy-platform-vision.md`, agosto 2026) y de `docs/CONTEXTO.md`. No la reemplaza: **concreta su Fase 5 ("plataforma dinámica": identidad, membresías, comunidad, progreso, pagos)** y propone adelantarla.

---

## 1. Resumen

**La idea en una frase:** la Academia ya enseña mejor que Skool (decks en vivo, recursos interactivos, identidad propia); le falta lo que hace que Skool *retenga y cobre*: cuentas, comunidad, progreso y pagos.

**Qué proponemos:**

1. **Dos sistemas separados**, como pide Javier:
   - **Progreso por clases con prerrequisitos.** "Si completas estas clases, se abre la siguiente." Lo decide el aprendizaje, no los likes.
   - **Nivel de comunidad.** Rangos por participar (comentar, ayudar, responder), al estilo de los foros clásicos. **Nunca desbloquea clases.**
2. **Comunidad propia:** cuentas, comentarios en cada clase y un foro.
3. **Cobrar como Skool, pero mejor:** se paga por **constelación** (DTMM $390/mes, Inglés $290/mes) o por el **bundle Red completa** ($590/mes, todas). Una parte queda gratis para siempre (Masterclass + primera clase de cada nivel) y todo lo demás se ve en vista previa. Stripe para lo mensual; OXXO, SPEI y meses sin intereses para el anual y los pagos únicos.
4. **Clases en vivo dentro de la Academia** (fase 3): sala con cámaras y chat, el deck sincronizado en cada pantalla y la grabación pegada sola en la clase. Mientras tanto, Zoom con la grabación automatizada.
5. **Biblioteca de recursos** con buscador y filtros, conectada a cada clase.
6. **Tecnología:** respetamos la visión aprobada (monolito modular en Next.js *a futuro*, migración gradual) y lo ya decidido en `CONTEXTO.md` ("no migrar a Next.js todavía"). Para el MVP: el sitio estático actual + **Supabase** (cuentas + Postgres con RLS) detrás de la capa `motor/progreso.js`, que ya se diseñó async para este momento. Next.js llega después y usa la misma base de datos.

**MVP (primeras 6–8 semanas):** cuentas, progreso en la cuenta con prerrequisitos, comentarios por clase, una membresía de pago y contenido de pago protegido. Foro y rangos van en la fase 2.

**El cambio de orden que proponemos:** la visión pone la plataforma dinámica (Fase 5) *después* de Next.js (Fase 3) y del Studio (Fase 4). Para llegar a la meta de ingresos, proponemos hacer primero un **mínimo de la Fase 5** sobre lo que ya existe. Es una decisión de Javier (ver preguntas).

**Ojo con dos riesgos grandes:**
- Hoy **todo el contenido es público** en GitHub. Antes de cobrar hay que mover lo de pago a un lugar protegido.
- Construir puede comerse el tiempo de vender. El MVP debe salir rápido y venderse con DESPEGA.

---

## 2. Qué hace Skool (y qué copiar o no)

### Cómo funciona

| Pieza | Cómo es en Skool |
|---|---|
| **Comunidad** | Un muro (feed) con publicaciones por categorías, likes y comentarios. Es el corazón del producto. |
| **Classroom** | Cursos con módulos y videos. Simple: sin exámenes, sin certificados, sin prerrequisitos. |
| **Acceso a cursos** | 5 opciones: abierto, **desbloqueo por nivel**, compra única, desbloqueo por días desde que entraste, privado. |
| **Puntos y niveles** | **Solo se gana puntos cuando alguien le da like** a lo que publicas (1 like = 1 punto). 9 niveles: 0, 5, 20, 65, 155, 515, 2,015, 8,015 y 33,015 puntos. El dueño puede renombrar los niveles. |
| **Leaderboard** | Ranking de los últimos 7 días, 30 días y de siempre. |
| **Calendario** | Eventos y llamadas en vivo con recordatorios. |
| **Miembros** | Directorio con perfil, nivel y actividad. |
| **About page** | Página pública de venta de cada comunidad: video, descripción, precio, número de miembros. |
| **Discovery** | Directorio interno donde la gente encuentra comunidades dentro de Skool. |
| **Auth** | Una sola cuenta Skool para todas las comunidades. |
| **Precios para la comunidad** | Gratis, suscripción mensual/anual (con prueba de 7 días), freemium, varios niveles de precio o pago único. |

### Su modelo de negocio

- **Lo que paga el creador:** plan Hobby **US$9/mes + 10% por cada cobro**, o plan Pro **US$99/mes + 2.9% por cobro**. Conviene Pro arriba de ~US$1,300/mes en ventas. Pagando anual, 2 meses gratis. Prueba de 14 días.
- **Afiliados de la comunidad:** en Pro, el dueño fija un % de comisión para miembros que traen a otros miembros.
- **Afiliados de Skool:** Skool paga a quien le trae creadores (fuentes externas hablan de 40% recurrente; no está en sus páginas oficiales).

### Qué copiar y qué no

| Copiar ✅ | No copiar ❌ |
|---|---|
| Comunidad pegada al curso: comentas *donde* aprendes. | **Desbloquear clases por likes.** Premia al que más publica, no al que más aprendió. |
| Rangos visibles en el avatar: dan identidad y ganas de volver. | Puntos solo por likes: invita a publicar por publicar. |
| Calendario de lives con recordatorios. | Todas las comunidades se ven iguales; no hay marca propia. |
| About page clara para vender. | Contenido cerrado: Google no lo encuentra (sin SEO). |
| Freemium: entrar gratis y subir a pago. | Cobros en dólares, sin OXXO ni meses sin intereses. |
| Leaderboard de 30 días (le da chance a los nuevos). | 10% de comisión en el plan barato. |

---

## 3. Qué ya tenemos y qué hacemos mejor

**Lo que existe hoy** (`origin/master`: monorepo estático publicado en `academia.lareddeluz.com` con GitHub Actions; sin cuentas ni pagos):

- **Índice de Academia** (`index.html`) y manifiesto `academy.courses.json` con dos constelaciones: **DTMM** (`cursos/dtmm`, 28 clases en Básico, Intermedio, Avanzado, Ventas, Herramientas IA y Abiertas) e **Inglés** (`cursos/ingles`, 13 sesiones).
- **Motor unificado** (`motor/`): `hub.js` + `hub-model.js` dibujan cualquier hub a partir de datos; `deck.js` navega las presentaciones (HUD, notas, teclado); temas por constelación en `motor/temas/`. El motor no conoce ninguna constelación por su nombre, y hay una prueba que lo vigila.
- **Constelaciones como configuración:** cada una tiene `constelacion.json` (identidad, figura, menú y **capacidades**: grabaciones, recursos, temas, progreso) y `clases.json` (contenido y grabaciones por generación).
- **Explorador curricular:** mapa del curso por categorías, clase recomendada (Comenzar / Continuar / Repasar), estados por clase y barra de progreso.
- **Progreso local** (`motor/progreso.js`): API async, guarda fecha por clase y un id de dispositivo para poder fusionar cuando existan cuentas. Hoy vive en el navegador y se pierde en incógnito. Al abrir una clase queda "en curso"; todavía nada la marca como "vista".
- **Recursos interactivos:** flashcards con repetición espaciada, Grammar Grill, 100 palabras, banco de ideas e historias, chuleta de respuestas, plantilla de seguimiento, documento de voz, guías de video, skills descargables (.zip) para Claude, entre otros.
- **Calidad:** build (`scripts/build-academy.cjs`) y ~15 pruebas que corren en CI antes de publicar.
- **Visión aprobada** de plataforma: cascarón madre, registro de constelaciones, framework de DEX portable, Studio de autoría y copiloto de IA.
- **Identidad visual** por constelación y concepto de marca: cada persona es un **Nodo**.

**Dónde ya le ganamos a Skool:**

| Nosotros | Skool |
|---|---|
| Decks interactivos hechos para la clase en vivo y el repaso. | Video + texto. |
| Recursos que *se usan* (flashcards, simuladores). | Archivos adjuntos. |
| Marca propia por constelación. | Plantilla igual para todos. |
| Páginas públicas que Google e IAs pueden leer (ya hay SEO, sitemap, llms.txt). | Comunidad cerrada. |
| En español, pensado para México. | En inglés, cobros en dólares. |
| El orden de las clases tiene lógica pedagógica (Básico → Intermedio → Avanzado). | Orden plano. |
| Motor y constelaciones configurables con pruebas en CI. | Una sola plantilla, sin control del código. |

**Lo que nos falta:** cuentas, progreso en servidor (hoy por navegador), un "completé esta clase" real, comentarios, foro, pagos y contenido protegido.

---

## 4. Visión

> **Una academia donde avanzas por lo que aprendes y subes de rango por lo que aportas.**

Dos ejes que no se mezclan:

```
           Progreso (lo que aprendiste)          Rango (lo que aportaste)
           ─────────────────────────────          ─────────────────────────
Se gana:   completar clases y tareas              comentar, responder, ayudar
Abre:      la siguiente clase o nivel             insignias, perks, moderación
Nunca:     depende de likes                       abre clases
```

**Ejemplos de prerrequisitos que Javier quiere poder configurar:**
- Sin *bases de redes sociales* (Básico 1–3) no se abre *Automatiza con IA*.
- Sin *edición básica* no se abren las *herramientas avanzadas*.
- Para pasar a **Intermedio**, completar 5 de las 6 clases de **Básico**.

**Ojo: esto cambia un principio aprobado.** El explorador curricular de septiembre dice "el orden orienta, no restringe: todas las clases publicadas permanecen disponibles". Para respetar ambas cosas proponemos que los prerrequisitos sean una **capacidad por constelación** en `constelacion.json`, con dos modos:
- `recomienda`: la clase se abre igual, pero avisa qué conviene ver antes (como hoy, más claro).
- `bloquea`: la clase no se abre hasta cumplir la regla (lo que pide Javier para DTMM).

Así Inglés puede seguir abierto y DTMM puede tener ruta obligatoria.

**Cómo se ve:** cada constelación es un mapa de estrellas. Las clases completadas brillan, las disponibles parpadean, las bloqueadas están apagadas y dicen qué falta ("Te faltan 2 clases: Formatos que funcionan y Tu primer post").

---

## 5. Requirements funcionales

Prioridad: **MVP** = sale en la primera versión de pago · **F2/F3** = fases siguientes · **Después** = cuando haya tracción.

### 5.1 Cuentas y perfil (Nodo)

| # | Requirement | Prioridad |
|---|---|---|
| A1 | Entrar con enlace mágico por correo y con Google. Sin contraseñas. | MVP |
| A2 | Perfil de Nodo: nombre, foto, bio corta, ciudad, redes, constelaciones inscritas. | MVP |
| A3 | Roles: miembro gratis, miembro de pago, moderador, admin. | MVP |
| A4 | Aviso de privacidad y términos aceptados al registrarse. | MVP |
| A5 | Directorio de miembros con buscador y filtro por constelación. | F3 |
| A6 | Mapa de Nodos (por ciudad, opcional y con permiso). | Después |

### 5.2 Progreso por clases con prerrequisitos

| # | Requirement | Prioridad |
|---|---|---|
| P0 | El progreso de `motor/progreso.js` se guarda en la cuenta; al iniciar sesión se fusiona el del navegador usando las fechas que ya guarda. | MVP |
| P1 | Marcar una clase como **completada** (botón al final del deck/repaso) usando el estado `visto` que ya existe. | MVP |
| P2 | Cada clase puede declarar **reglas de desbloqueo**: "todas estas", "al menos N de estas", o "completar la categoría X". Se configuran en `clases.json`; el modo (`recomienda`/`bloquea`) en `constelacion.json`. | MVP |
| P3 | Una clase bloqueada se ve, pero dice **exactamente qué falta** y lleva a esas clases. | MVP |
| P4 | Barra de progreso por fila/nivel y por constelación. | MVP |
| P5 | El admin puede dar acceso manual a alguien (p. ej. ya tomó DESPEGA presencial). | MVP |
| P6 | Criterio de completado configurable por clase: botón, tarea entregada, o mini-quiz. | F2 |
| P7 | Vista de mapa (constelación) del progreso. | F2 |
| P8 | Certificado/insignia al terminar un nivel. | F3 |
| P9 | Editor visual de reglas para el admin (sin tocar JSON). | Después |

### 5.3 Nivel de comunidad (rangos)

| # | Requirement | Prioridad |
|---|---|---|
| R1 | Puntos por aportar: publicar en foro, comentar, recibir "me sirvió", **respuesta marcada como solución** (vale más). | F2 |
| R2 | Rangos con nombres de la marca (ej. Chispa → Destello → Estrella → Constelación → Nebulosa → Galaxia). Visibles en el avatar. | F2 |
| R3 | Topes diarios y sin puntos por autolikes, para evitar inflar. | F2 |
| R4 | Leaderboard de 30 días y de siempre. | F2 |
| R5 | Los rangos dan **perks, no clases**: insignias, acceso anticipado a eventos, poder ser moderador, descuentos en DESPEGA. | F3 |
| R6 | Firma y "mensajes totales" en el perfil, al estilo foro clásico. | F3 |

### 5.4 Comunidad

| # | Requirement | Prioridad |
|---|---|---|
| C1 | **Comentarios en cada clase** (con respuestas de un nivel). | MVP |
| C2 | Reportar comentario; moderadores pueden ocultar/borrar. | MVP |
| C3 | Aviso por correo cuando te responden. | MVP |
| C4 | **Foro** con categorías por constelación (DTMM, Inglés, Ventas, Off-topic, Presentaciones). | F2 |
| C5 | Hilos fijados, marcar solución, buscador del foro. | F2 |
| C6 | Notificaciones dentro del sitio (campanita). | F3 |
| C7 | Mensajes directos entre miembros. | Después |

### 5.5 Pagos y membresías

| # | Requirement | Prioridad |
|---|---|---|
| $1 | Membresía mensual en MXN **por constelación** y **bundle Red completa**, con tarjeta (cobro automático). | MVP |
| $2 | Pago anual único (12 meses) con tarjeta, **meses sin intereses**, OXXO o SPEI. | MVP |
| $2b | **Vista previa** para no miembros: temario, primeras 3 slides, clip de 2 min y botón doble (constelación / bundle). | MVP |
| $2c | Dos candados distintos y con su propio texto: **pago** ("es de DTMM") y **ruta** ("te faltan estas clases"). | MVP |
| $2d | Pasar de una constelación al bundle cobrando solo la diferencia. | F2 |
| $3 | Portal para que el miembro cambie tarjeta o cancele solo. | MVP |
| $4 | Si un cobro falla: reintentos y aviso; tras el periodo de gracia, vuelve a gratis (no se borra su progreso). | MVP |
| $5 | Cupones (p. ej. para alumnos de DESPEGA). | F2 |
| $6 | Venta de clases o programas sueltos (pago único). | F3 |
| $7 | Programa de afiliados/referidos para miembros. | Después |
| $8 | Facturación CFDI a quien la pida. | Por definir (ver preguntas) |

### 5.6 Contenido y biblioteca de recursos

| # | Requirement | Prioridad |
|---|---|---|
| B1 | **Contenido de pago protegido**: decks, grabaciones y recursos de pago solo se cargan con sesión activa. | MVP |
| B2 | Cada clase muestra sus recursos; cada recurso dice de qué clase viene. | MVP |
| B3 | **Biblioteca** de toda la Academia (hoy solo Inglés tiene página de recursos, como inventario editorial): buscador + filtros por tipo (deck, grabación, plantilla, herramienta interactiva, prompt), constelación y nivel. | F2 |
| B4 | Guardar recursos en "Mi biblioteca". | F2 |
| B5 | El progreso de herramientas (flashcards) se guarda en la cuenta, no solo en el navegador. | F2 |
| B6 | Etiqueta "Gratis" / "Miembros" visible en cada recurso (los gratis sirven de gancho). | F2 |

**Cómo mostrar los recursos (patrones vistos en Refero):**

- **Catálogo con filtros a la izquierda + tarjetas** (Microsoft Learn, Apollo Odyssey, Miro Academy): buscador arriba, filtros por tipo/tema/nivel, tarjetas con tipo y duración. → Para la **Biblioteca**.
- **Tira de categorías horizontal** (MasterClass): cambiar de constelación con un toque, filtros finos aparte. → Para el **móvil**.
- **Camino de nodos con candados y palomitas** (Brilliant): la ruta de un curso como zigzag de nodos completados, siguientes y bloqueados. → Encaja perfecto con la **constelación** y con los prerrequisitos.
- **Unidades en lista con prueba bloqueada** (Preply): cada unidad se expande y la evaluación aparece con candado hasta completar. → Para la vista de un **nivel**.
- **Resultados agrupados por tipo** (Quizlet): buscar "carrusel" y ver clases, recursos y hilos del foro en secciones. → Para el **buscador global**.

### 5.7 Calendario y clases en vivo

| # | Requirement | Prioridad |
|---|---|---|
| E1 | Calendario de próximas clases en vivo con botón "agregar a mi calendario". | F2 |
| E2 | Recordatorio por correo 24 h y 1 h antes. | F2 |
| E3 | Al terminar el live, la grabación aparece sola en la clase (con Zoom: webhook → servicio de video protegido). | F2 |
| E4 | **Sala propia** solo para miembros: cámaras, micrófonos, chat y levantar la mano (Daily embebido). | F3 |
| E5 | **Deck sincronizado**: el profe cambia de slide y cambia en todas las pantallas. | F3 |
| E6 | Repaso con el deck moviéndose junto al video y capítulos por slide. | F3 |
| E7 | Modo escenario para más de ~50 personas, transcripción y resumen con IA. | Después |

Detalle, opciones y costos en la sección 7.

### 5.8 Página pública y descubrimiento

| # | Requirement | Prioridad |
|---|---|---|
| D1 | Página "Únete" (estilo About de Skool): qué incluye, precio, testimonios, preguntas frecuentes. | MVP |
| D2 | Las fichas de clase siguen siendo públicas e indexables (título, resumen, temario); solo el contenido completo es de pago. | MVP |
| D3 | Clases "muestra" gratis para que Google y la gente prueben. | MVP |

### 5.9 Administración

| # | Requirement | Prioridad |
|---|---|---|
| M1 | Ver miembros, su plan y su progreso. | MVP (vía panel de Supabase) |
| M2 | Panel propio de admin (clases, reglas, miembros, moderación). | F3 |
| M3 | Métricas: miembros activos, altas, bajas, clases más completadas. | F3 |

---

## 6. Cómo cobrar (modelo de acceso)

**La idea principal:** en Skool compras *una comunidad* y adentro vienen las clases. Nosotros hacemos lo mismo con las **constelaciones**, pero con una ventaja que Skool no tiene: **una sola cuenta y un bundle** para tener todas. Cada quien paga solo lo que le interesa, o todo junto con descuento.

**Meta de Javier:** ~200 mil MXN/mes en menos de 2 años, sumando DESPEGA presencial + Academia.

### Cómo lo hace Skool

- Cada comunidad pone su propio precio: gratis, mensual, anual, freemium, varios niveles o pago único.
- Si quieres dos comunidades, pagas dos membresías separadas, con dos cuentas de cobro. **No hay bundle entre comunidades.** Dentro de una sola comunidad sí puede haber niveles (por ejemplo, "básico" y "premium").
- El creador le paga a Skool US$9/mes + 10% por cobro, o US$99/mes + 2.9%. Los cobros son en dólares, sin OXXO ni meses sin intereses.
- Los precios para miembros van de gratis a ~US$100/mes o más. No hay una estadística pública del precio promedio.

### Nuestros planes

| Plan | Mensual | Anual (pago único, 12 meses) | Qué incluye |
|---|---|---|---|
| **Nodo** (gratis) | $0 | — | Vista previa de todo + la parte gratis de cada constelación (ver abajo). Comentar en clases gratis. |
| **Constelación DTMM** | **$390** | **$3,900** (2 meses gratis, hasta 12 MSI) | Todas las clases, grabaciones y recursos de DTMM. Foro de DTMM. Lives de DTMM. |
| **Constelación Inglés** | **$290** | **$2,900** | Todo lo de Inglés. Precio menor: otro público y sesiones más cortas. |
| **Red completa** (bundle) | **$590** | **$5,900** | Todas las constelaciones actuales **y las que vengan**. Foro completo. Separadas costarían $680/mes. |
| **Círculo** (premium) | **$990** | — | Red completa + sesión grupal de revisión al mes + descuento en DESPEGA. Cupo limitado. |
| **Programa suelto** (pago único) | — | p. ej. **$990** | Un paquete cerrado de por vida (ej. "Herramientas de IA" con sus skills). Sirve para quien no quiere suscripción. |
| **DESPEGA** (presencial) | precio aparte | — | Incluye 3 meses de Red completa: la Academia es la continuación natural. |

*Precios de partida para probar; hay que validarlos con la comunidad actual. Todos en MXN con IVA incluido.*

**Por qué así:**
- **Mensual** baja la barrera de entrada. **Anual** como pago único permite meses sin intereses, OXXO y SPEI (Stripe no ofrece MSI en cobros recurrentes). Al vencer, avisamos por correo para renovar.
- El **bundle** sube el ticket promedio y premia a quien se queda: cada constelación nueva le da más valor sin costo extra.
- **Pago único de por vida** solo para programas cerrados que ya no cambian. La membresía es lo que paga los lives y la comunidad.

### La parte gratis y la vista previa

**Gratis para siempre** (propuesta):
- La **Masterclass** de entrada ("Por qué nadie te escribe").
- **La primera clase de cada nivel** o categoría (Básico 1, Intermedio 1, Avanzado 1, Ventas 1, IA 1; Inglés sesión 1).
- Los recursos marcados "Gratis" (por ejemplo, 100 palabras).

**Lo que ve alguien sin membresía** en una clase de pago:
- Título, resumen, temario, duración, qué recursos trae y cuántos comentarios tiene (todo indexable por Google).
- Las **primeras 3 slides** del deck y un **clip de 2 minutos** de la grabación.
- Un botón doble: **"Desbloquear DTMM · $390/mes"** y **"Todo con Red completa · $590/mes"**.

### Cómo se cruza con los prerrequisitos

Son **dos candados distintos** y la pantalla siempre dice cuál es:

```
¿Tiene acceso a esta constelación (pagó o es clase gratis)?
   No → candado de PAGO:  "Esta clase es de la constelación DTMM"  [Ver planes]
   Sí ↓
¿Cumple los prerrequisitos?
   No → candado de RUTA:  "Te faltan 2 clases: Formatos que funcionan y Tu primer post"  [Ir a la primera]
   Sí → se abre
```

Reglas para que no choquen:
- Una **clase gratis solo puede pedir clases gratis**. Si no, alguien sin membresía quedaría atorado. Una prueba del build lo revisa.
- En el MVP los prerrequisitos son **dentro de una misma constelación**. Entre constelaciones (ej. "Inglés para tu contenido" pide DTMM Básico) va después y solo aplica si tienes las dos o el bundle.
- Si alguien deja de pagar, **conserva su progreso**. Al volver, todo sigue donde lo dejó.

### Cómo encaja con Stripe y Mercado Pago

| Producto | Cómo se cobra | Métodos |
|---|---|---|
| Mensual (constelación, bundle, Círculo) | Suscripción de Stripe | Tarjeta |
| Anual | Pago único en Stripe Checkout que da 12 meses de acceso | Tarjeta, **MSI**, OXXO, SPEI |
| Programa suelto | Pago único en Stripe Checkout | Tarjeta, MSI, OXXO, SPEI |
| Quien pida Mercado Pago | Link de pago de MP; el admin da el acceso a mano (o por webhook en una fase posterior) | Lo que ofrezca MP |

- Cambiar de una constelación al bundle: Stripe cobra solo la diferencia del mes (prorrateo). En anual, se descuenta lo que queda.
- En la base de datos todo se guarda igual: `membresias(nodo, alcance: 'dtmm' | 'ingles' | 'todas', vence, origen: stripe | mp | despega | manual)`. El candado de pago solo pregunta "¿hay una membresía vigente que cubra esta constelación?".

### ¿Cuánto hace falta?

Ejemplo de mezcla a ~18–24 meses:

| Fuente | Cuentas | Ingreso mensual |
|---|---|---|
| DTMM mensual | 180 × $390 | $70,200 |
| Inglés mensual | 80 × $290 | $23,200 |
| Red completa mensual | 90 × $590 | $53,100 |
| Anuales (prorrateado) | 60 × ~$400 | $24,000 |
| Círculo | 20 × $990 | $19,800 |
| **Academia** | **~430 personas pagando** | **~$190,000** |
| DESPEGA (prorrateado) | | lo que falte para 200k |

Menos comisiones de pago (~4–5% con IVA) y herramientas (~$1,500–3,000 MXN/mes, contando las clases en vivo de la sección 7).

**Comparación de costos:** con Skool Pro serían ~US$99/mes (~$1,800 MXN) por comunidad + 2.9% por cobro, en dólares y sin OXXO. Para tener DTMM e Inglés por separado serían dos comunidades. Con plataforma propia: Supabase gratis al inicio (luego ~US$25/mes) + comisión del procesador. El ahorro no es enorme; **la ventaja real es el producto** (bundle, prerrequisitos, decks, marca, pagos mexicanos, SEO).

### Pagos: Stripe vs Mercado Pago (México)

| | **Stripe** | **Mercado Pago** |
|---|---|---|
| Tarjeta nacional | ~3.6% + $3 MXN + IVA | 3.49% + $4 MXN + IVA (dinero al instante); menos si esperas 14–30 días |
| Suscripciones automáticas | ✅ Muy completas: reintentos, portal del cliente, cupones, prorrateos | ✅ Existen (API de *preapproval*), solo con tarjeta; 4 reintentos y baja tras 3 cobros fallidos |
| OXXO | ✅ Pago único | ✅ Pago único |
| SPEI | ✅ (transferencia bancaria) | ✅ |
| Meses sin intereses | ✅ 3–24 meses, **no** en cobros recurrentes; cuota extra según plazo | ✅ hasta 24 meses; cuota extra (p. ej. 3 MSI ≈ 4.7% + IVA, 6 MSI ≈ 7.7% + IVA) |
| Para programar | Muy buena documentación, Checkout y portal ya hechos | Más trabajo; documentación menos clara |
| Confianza del comprador | Buena | Muy alta en México |

**Recomendación:** **Stripe para el MVP** (mensual + anual con MSI/OXXO/SPEI desde un solo lugar, con portal de cliente ya hecho, que nos ahorra semanas de código). Mercado Pago queda como **Link de pago** manual para quien lo pida, y se integra en serio solo si muchos lo piden.

*Las comisiones salen de páginas públicas y blogs de noviembre 2026; confirmarlas en la cuenta de cada uno antes de fijar precios.*

---

## 7. Clases en vivo dentro de la Academia

**La idea principal:** dar la clase **dentro de la Academia**, en una sala con cámaras, chat y el deck sincronizado, y que al terminar **la grabación aparezca sola en la clase**. Esto Skool no lo tiene: Skool solo pone un enlace a Zoom en su calendario.

**Recomendación:** no empezar por aquí. Primero cuentas y pagos. Mientras tanto se sigue con Zoom/Meet, pero automatizando la subida de la grabación. La sala propia llega en la fase 3, con **Daily** (la más rápida de montar) y con opción de pasar a **LiveKit** cuando crezca.

### Cómo se vería

```
┌───────────────────────────────────────────┬──────────────┐
│  DECK del motor (lo controla el profe)    │  Chat        │
│  cada alumno lo ve nítido en su pantalla, │  Preguntas   │
│  no como video compartido                 │  Levantar    │
│                                           │  la mano     │
├───────────────────────────────────────────┤              │
│  Cámaras: profe + quienes estén en escena │              │
└───────────────────────────────────────────┴──────────────┘
```

- **Sala, no solo transmisión:** los alumnos pueden prender cámara y micrófono.
- **Deck sincronizado:** cuando el profe cambia de slide, cambia en todas las pantallas. No se manda como video: se manda solo "vamos en la slide 12" (por Supabase Realtime), así que se ve perfecto y casi no gasta.
- **Chat** guardado junto a la clase; las preguntas buenas pueden pasar al foro.
- **Grabación automática:** al terminar, la grabación se guarda en un servicio de video y se pega sola en la clase. Ya no hay que subir a YouTube a mano ni editar `clases.json`.
- **Repaso sincronizado:** como sabemos en qué minuto se cambió cada slide, `repaso.html` puede mover el deck junto con el video y mostrar capítulos por slide.
- **Solo miembros:** la entrada pide sesión y membresía vigente. Sin enlaces que se reenvíen.

**Cuántas cámaras:** en una sala de 30 todos pueden tener cámara. Con más de ~50 conviene el **modo escenario**: profe + hasta ~10 cámaras invitadas en pantalla; el resto con chat y "levantar la mano" para subir al escenario. Así se siente como sala sin saturar a nadie.

### Opciones y costos

Supuesto para comparar: **4 clases al mes de 90 minutos**. Un "minuto de participante" es un minuto de una persona conectada (30 personas × 90 min = 2,700).

| Opción | Tipo | Precio base | Costo/mes con **30** alumnos | con **100** | con **300** | Grabación |
|---|---|---|---|---|---|---|
| **Zoom / Meet + subir a mano** (hoy) | Sala externa | Zoom Pro ~US$15/mes (hasta 100; 300 con complemento) | ~US$15 | ~US$15 | ~US$15 + complemento | En su nube; subirla a mano |
| **Zoom + automatizar** (MVP propuesto) | Sala externa | Igual | ~US$15 | ~US$15 | ~US$15 + complemento | Webhook de Zoom → servicio de video → la clase |
| **Daily** (Prebuilt embebido) | Sala propia | 10,000 min gratis/mes; luego US$0.004/min | **~US$3** | **~US$105** | **~US$390** | ~US$0.0135/min grabado (~US$5/mes) |
| **LiveKit Cloud** | Sala propia (más código) | Gratis 5,000 min; plan Ship US$50/mes | US$50 | US$50 | ~US$50–100* | Incluida en cupos; luego por minuto |
| **100ms** | Sala propia | 10,000 min gratis; luego ~US$0.004/min | ~US$3 | ~US$105 | ~US$390 | ~US$0.04/min compuesto |
| **Whereby Embedded** | Sala propia (iframe, muy simple) | US$9.99/mes con 2,000 min; luego US$0.004/min **solo micrófonos abiertos** | ~US$10–45 | ~US$15–145 | ~US$20–435 | US$0.01/min |
| **Cloudflare Realtime** | Sala propia (hay que armarla) | US$0.05/GB que sale (~1 GB por alumno por clase) | ~US$6 | ~US$20 | ~US$60 | No incluida: armarla aparte |
| **Mux Live** | Transmisión (sin cámaras de alumnos) | Desde ~US$20/mes; ~US$0.025–0.04/min de entrada + entrega | ~US$20 | ~US$40 | ~US$100 | Sí, queda como video |
| **Cloudflare Stream** | Transmisión + videoteca | US$5 por 1,000 min guardados + US$1 por 1,000 min vistos | ~US$15 | ~US$40 | ~US$110 | Sí, queda como video |

\* Los cupos del plan Ship de LiveKit varían según la fuente (de 5,000 a 150,000 minutos incluidos). Confirmar antes de elegir.

*Todas las cifras son aproximadas, de páginas oficiales y blogs de noviembre 2026. Con Whereby el rango depende de cuántos tengan el micrófono abierto. A esto se suma guardar las grabaciones (ej. Cloudflare Stream: ~US$5 por cada 1,000 minutos guardados ≈ 17 clases de 1 h).*

**Cómo leer la tabla:**
- **Mux y Cloudflare Stream** son transmisión tipo YouTube Live: buenas para mucha gente, pero **los alumnos no pueden prender cámara**. No cumplen lo que pide Javier por sí solas; sirven como *videoteca* para guardar y reproducir las grabaciones protegidas.
- **Daily, 100ms y Whereby** dan sala completa casi lista. **Daily** es el mejor equilibrio: interfaz armada (Prebuilt), grabación en la nube y webhooks para saber cuándo está lista.
- **LiveKit** es el más barato a escala y el más flexible (modo escenario a la medida), pero pide más código. Es el camino natural cuando haya cientos de alumnos por clase.
- **Cloudflare Realtime** es muy barato pero hay que construir casi todo, grabación incluida. No vale la pena al inicio.

### MVP y después

| Paso | Qué | Cuándo |
|---|---|---|
| **Ya** | Seguir con Zoom/Meet. Calendario de lives en la Academia con recordatorios. | Fase 1–2 |
| **MVP en vivo** | Zoom con grabación en la nube → webhook → Cloudflare Stream (protegido) → se pega sola en la clase. Sin subir a YouTube a mano. | Fase 2 |
| **Sala propia** | Página `/en-vivo/<clase>` con Daily embebido, solo para miembros, deck sincronizado, chat y grabación automática. | Fase 3 |
| **Después** | Modo escenario, repaso con capítulos por slide, transcripción y resumen con IA, subtítulos, pasar a LiveKit si los costos de Daily suben. | Fase 4 |

**Por qué Zoom primero:** el valor grande es que la grabación llegue sola y protegida. Eso se logra con Zoom sin construir una sala. La sala propia se justifica cuando haya membresías pagando y cuando el deck sincronizado y el modo escenario sean el siguiente diferenciador.

---

## 8. Arquitectura recomendada

**Recomendación:** **seguir con el sitio estático actual + agregar Supabase ya**, y migrar a Next.js cuando toque según la visión aprobada (Fases 3–4). Es el patrón Strangler Fig que la visión ya eligió: lo nuevo crece junto a lo que funciona.

Cómo encaja con decisiones que la visión dejó abiertas:

| Decisión pendiente en la visión | Propuesta |
|---|---|
| Autenticación y almacenamiento administrados | Supabase Auth + Postgres + Storage |
| Segmentación de datos (Multi-tenancy + RLS) | Postgres con RLS por constelación y por plan |
| Integraciones (Ports and Adapters) | `progreso.js` y un `pagos` adaptador: el motor no sabe si detrás hay Supabase o Stripe |
| Hosting dinámico | Sin servidor propio en el MVP (Edge Functions de Supabase); Vercel u otro cuando llegue Next.js |
| Monetización | Stripe primero (sección 6) |

```
Sitio estático (motor/, cursos/) publicado por GitHub Actions
   │  progreso.js / sesion.js / comentarios.js  →  supabase-js
   ▼
Supabase ── Auth (correo mágico, Google)
        ├── Postgres (perfiles, progreso, comentarios, foro, puntos)  + reglas de acceso por fila (RLS)
        ├── Storage privado (decks, recursos y archivos de pago)
        └── Edge Functions (webhooks de Stripe, correos, calcular desbloqueos)
   ▲
Stripe ── Checkout + Portal del cliente + Webhooks
```

**Por qué así:**
- `progreso.js` ya es el único punto que habla con el almacenamiento y ya es async: cambiar localStorage por Supabase no toca el resto del motor.
- Supabase da cuentas, base de datos y archivos protegidos en un solo lugar, gratis al inicio (50 mil usuarios activos/mes).
- Los datos son relacionales (clases ↔ prerrequisitos, hilos ↔ respuestas) y la visión ya pide Postgres con RLS: Supabase es Postgres estándar, así que el Next.js de mañana usa la misma base sin migrar datos.
- No adelanta la migración a Next.js, que `CONTEXTO.md` decidió posponer.

**El punto delicado: proteger el contenido.** GitHub Pages publica todo lo que sale del build. Para cobrar, el build debe dejar fuera los decks y recursos de pago y subirlos a Storage privado de Supabase (se sirven con enlaces firmados), o mover el hosting a uno con funciones que revisen la sesión. Las fichas públicas de cada clase siguen en el sitio para SEO. El repo también debería volverse privado o el contenido de pago salir de él.

Detalles técnicos en el [Apéndice](#apéndice-técnico).

---

## 9. Fases

| Fase | Duración aprox. | Qué sale | Cómo sabemos que funcionó |
|---|---|---|---|
| **0 · Decidir** | 1 semana | Precios, qué es gratis y qué de pago, criterio de "clase completada", cuenta de Stripe. | Preguntas abiertas respondidas. |
| **1 · MVP de pago** | 5–7 semanas | Cuentas, perfil de Nodo, progreso + prerrequisitos, comentarios por clase, membresías por constelación + bundle (Stripe), vista previa, contenido de pago protegido, página "Únete". | 30 miembros de pago; 50% completa al menos 3 clases en el primer mes. |
| **2 · Comunidad** | 4–6 semanas | Foro, rangos y puntos, leaderboard, biblioteca con filtros, progreso de herramientas en la cuenta, mapa de constelación, calendario de lives y **grabación de Zoom pegada sola en la clase**. | 40% de miembros publica o comenta al mes. |
| **3 · Ritmo** | 6–8 semanas | **Sala en vivo propia** (Daily) con deck sincronizado y repaso por capítulos, plan Círculo, directorio de miembros, panel de admin, métricas, certificados. | Bajas mensuales < 8%; 60% de asistentes vuelve al siguiente live. |
| **4 · Crecer** | continuo | Afiliados, venta de programas sueltos, editor visual de reglas, PWA. | Camino claro a 200k/mes. |

**Cómo se cruza con la ruta de la visión aprobada:**

| Visión (ago 2026) | Estado | En este plan |
|---|---|---|
| Fase 0 · centralización | Hecha | — |
| Fase 1 · contratos (`constelacion.json`, temas, registro de recursos) | En gran parte hecha | Se reutiliza: prerrequisitos y capacidades nuevas van en esos contratos |
| Fase 2 · núcleo portable de DEX (`.deck.json`) | Sin empezar | Sigue en paralelo, no bloquea el negocio |
| Fase 3 · Next.js y cascarón en React | Pospuesta | Después de las fases 1–2 de este plan, con la misma base de datos |
| Fase 4 · Studio | Pendiente | Después |
| Fase 5 · plataforma dinámica | Pendiente | **Se adelanta un mínimo** (fases 1–3 de este plan) |

**Regla de oro:** mientras se construye la fase 1, se vende con DESPEGA y con la Masterclass. Se puede abrir una lista de espera con precio de fundador desde la fase 0.

---

## 10. Riesgos

| Riesgo | Qué hacer |
|---|---|
| **Contenido de pago hoy es público** (repo y videos no listados). | Moverlo a almacenamiento privado antes de cobrar; aceptar que lo no listado se puede compartir. |
| **Construir se come el tiempo de vender.** | MVP pequeño; usar el panel de Supabase como admin al principio. |
| **Foro vacío** ("pueblo fantasma"). | Abrir el foro hasta tener ~50 miembros activos; Javier y moderadores siembran hilos cada semana; empezar por comentarios en clases. |
| **Inflar puntos o spam.** | Topes diarios, puntos solo por aportes reales, moderación. |
| **Prerrequisitos frustran** a quien ya sabe. | Acceso manual del admin y, después, "examen para saltar". |
| **Cobros fallidos y bajas.** | Reintentos automáticos, aviso por correo, anual con descuento. |
| **Legal y fiscal** (aviso de privacidad, términos, facturas, régimen fiscal). | Revisarlo con contador antes de cobrar. |
| **Depender de un solo proveedor** (Supabase/Stripe). | Postgres estándar y datos exportables; nada que impida migrar. |
| **Seguridad** (datos personales, permisos mal puestos). | Reglas de acceso por fila (RLS) en todas las tablas y revisión antes del lanzamiento. |

---

## 11. Preguntas abiertas para Javier

1. **Orden:** ¿adelantamos un mínimo de la Fase 5 (cuentas, comunidad, pagos) antes de Next.js y del Studio?
2. **Prerrequisitos:** el explorador aprobado dice "el orden orienta, no restringe". ¿En DTMM quieres que **bloqueen** o solo que **recomienden**? ¿E Inglés?
3. **Precios:** ¿te late DTMM $390, Inglés $290 y Red completa $590 al mes (anual = 10 meses)? ¿El plan Círculo desde el inicio o después?
4. **Gratis vs pago:** ¿qué clases quedan gratis para siempre? (Propuesta: Masterclass + la primera clase de cada nivel.) ¿Te late la vista previa de 3 slides + 2 minutos de video?
5. **Programas sueltos:** ¿quieres vender algo de pago único de por vida (ej. el paquete de Herramientas de IA con sus skills)?
6. **Clases en vivo:** ¿cuántas personas llegan hoy a cada live? ¿Quieres que todos puedan prender cámara o basta con que algunos suban "al escenario"?
7. **Zoom primero:** ¿te parece seguir con Zoom (automatizando la grabación) hasta la fase 3, o la sala propia es prioridad antes?
8. **DESPEGA:** ¿incluye meses de Academia? ¿cuántos?
9. **"Clase completada":** ¿basta con un botón, o pides una tarea/mini-quiz en algunas?
10. **Reglas de prerrequisitos:** ¿nos pasas el mapa de qué clase requiere cuál? (ej. ¿qué cuenta como "edición básica"?)
11. **Grabaciones:** ¿siguen en YouTube no listado o pasamos a un hosting privado de video (más protegido, con costo)?
12. **Moderación:** ¿quién te ayuda a moderar el foro?
13. **Facturación:** ¿necesitas emitir CFDI? ¿con qué régimen vas a cobrar?
14. **Pagos:** ¿alguien de tu comunidad te ha pedido pagar con Mercado Pago específicamente?
15. **Nombres de rangos:** ¿te gustan Chispa → Destello → Estrella → Constelación → Nebulosa → Galaxia?
16. **Fecha:** ¿cuándo quieres empezar a cobrar? Eso define cuánto cabe en el MVP.

---

## Apéndice técnico

### A. Modelo de datos (Supabase / Postgres)

```
profiles        (id = auth.users.id, nombre, avatar_url, bio, ciudad, rol, plan, puntos, rango, creado)
clases          (id, constelacion, fila, titulo, es_gratis, orden)          ← sincronizado desde clases.json
reglas          (clase_id, tipo: 'todas'|'al_menos'|'nivel', requeridas: text[], minimo int)
progreso        (user_id, curso_id, clase_id, estado: 'nuevo'|'curso'|'visto', ts, dispositivo_id, metodo: 'boton'|'tarea'|'quiz'|'manual')
                ← mismo formato que hoy guarda progreso.js; al fusionar gana el ts más reciente
accesos_manual  (user_id, clase_id|nivel, otorgado_por, motivo)
comentarios     (id, clase_id, user_id, padre_id, cuerpo, oculto, creado)
foro_categorias (id, nombre, constelacion, orden)
foro_hilos      (id, categoria_id, user_id, titulo, cuerpo, fijado, solucion_id, creado)
foro_respuestas (id, hilo_id, user_id, cuerpo, creado)
reacciones      (user_id, objetivo_tipo, objetivo_id, tipo: 'me_sirvio')
puntos_log      (user_id, motivo, puntos, creado)     ← permite topes diarios y auditoría
membresias      (user_id, alcance: 'dtmm'|'ingles'|'todas', plan: 'mensual'|'anual'|'circulo'|'programa', vence, origen: 'stripe'|'mp'|'despega'|'manual', stripe_sub_id)
sesiones_vivo   (id, clase_id, inicia, sala_proveedor, sala_id, estado: 'programada'|'en_vivo'|'terminada')
grabaciones     (id, clase_id, sesion_id, proveedor: 'cloudflare'|'mux'|'youtube', video_id, duracion, slides_ts jsonb)  ← slides_ts: minuto de cada cambio de slide
chat_vivo       (id, sesion_id, user_id, cuerpo, creado)
recursos        (id, clase_id, tipo, titulo, ruta_storage, es_gratis)
```

Todas las tablas con RLS: cada quien lee lo público y lo suyo; escribe solo lo suyo; moderadores/admin según rol.

### B. Reglas de desbloqueo en `clases.json`

Extensión compatible con los contratos actuales (los campos nuevos son opcionales y el motor sigue sin conocer constelaciones por nombre).

En `cursos/dtmm/constelacion.json`:

```json
"capacidades": { "grabaciones": true, "recursos": true, "temas": true, "progreso": true,
                 "prerrequisitos": "bloquea", "comentarios": true }
```

En `cursos/dtmm/clases.json`:

```json
{
  "id": "automatizar-ia-3",
  "requiere": { "todas": ["redes-desde-cero-1", "formatos-que-funcionan-2", "cadencia-sostenible-3"] }
},
{
  "id": "intermedio-algoritmo-1",
  "requiere": { "nivel": "basico", "al_menos": 5 }
}
```

La regla se evalúa en `motor/hub-model.js` (que ya calcula estados y la clase recomendada) para *mostrar*, y en una Edge Function/RLS para *proteger*: `desbloqueada = es_gratis o acceso_manual o cumple(requiere, progreso)`. El navegador solo *muestra*; quien *protege* el contenido es el servidor.

### C. Puntos de comunidad (propuesta inicial)

| Acción | Puntos | Tope diario |
|---|---|---|
| Comentar en una clase | +1 | 10 |
| Crear hilo en el foro | +2 | 3 hilos |
| Recibir "me sirvió" | +1 | 20 |
| Tu respuesta marcada como solución | +10 | — |
| Presentarte en el foro (una vez) | +5 | — |

Rangos sugeridos (umbral de puntos): Chispa 0 · Destello 10 · Estrella 50 · Constelación 150 · Nebulosa 400 · Galaxia 1,000.

### D. Pagos

- **Stripe Checkout** en modo suscripción para los mensuales (un *Price* por constelación, bundle y Círculo); en modo pago único para anuales y programas sueltos (habilitar tarjeta con MSI, OXXO y transferencia).
- **Webhook** (`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`) → Edge Function → crea o actualiza `membresias`.
- Candado de pago: `existe membresía vigente con alcance = constelación de la clase o 'todas'`, o la clase es gratis. Va en RLS y en el enlace firmado del contenido.
- **Customer Portal** de Stripe para cambiar tarjeta/cancelar: cero UI propia.
- OXXO tarda hasta 1–3 días en confirmarse: el acceso se da al confirmar el pago, no al generar la ficha.

### E. Contenido protegido

- Mover decks/recursos de pago a un bucket privado de Supabase Storage; el navegador pide un **enlace firmado** (expira en minutos) solo si la RLS lo permite.
- Alternativa: mover el hosting a Cloudflare Pages/Netlify con una función que verifique el JWT de Supabase antes de servir `/miembros/*`.
- Las fichas públicas (título, resumen, temario) se quedan en GitHub Pages para SEO.

### F. Costos de infraestructura estimados

| Servicio | Inicio | Con ~1,000 miembros |
|---|---|---|
| GitHub Pages | $0 | $0 |
| Supabase | $0 (Free: 50k usuarios activos; pausa tras 1 semana sin uso) | US$25/mes (Pro) |
| Correos (Resend o similar) | $0 | ~US$20/mes |
| Stripe | solo comisión por cobro | solo comisión |
| Video privado de grabaciones (Cloudflare Stream) | ~US$5–15/mes | ~US$40–110/mes |
| Clases en vivo (Zoom → Daily en fase 3) | ~US$15/mes | ~US$100–400/mes con Daily; menos con LiveKit |

### H. Clases en vivo: cómo se arma

- **Entrar a la sala:** la página `/en-vivo/<clase>` pide sesión; una Edge Function revisa la membresía y crea un token de la sala (Daily *meeting token*) con rol `profe` o `alumno`. Sin token no se entra.
- **Deck sincronizado:** el deck del motor escucha un canal de Supabase Realtime `vivo:<sesion>`. El profe publica `{slide: 12, ts}`; los alumnos mueven su deck local. El servidor guarda cada cambio en `grabaciones.slides_ts`.
- **Grabación:** grabación en la nube del proveedor → webhook "lista" → Edge Function la copia a Cloudflare Stream (enlaces firmados) → crea la fila en `grabaciones` y la clase la muestra. Con Zoom en fase 2: webhook `recording.completed` → mismo camino.
- **Repaso por capítulos:** `repaso.html` lee `slides_ts` y mueve el deck al ritmo del video; cada slide es un capítulo.
- **Cambiar de proveedor:** la sala va detrás de un adaptador (`sala.crear`, `sala.token`, `sala.grabacion`), como pide la visión (Ports and Adapters). Pasar de Daily a LiveKit no toca el resto.

### G. Fuentes

- Skool, ayuda oficial: [puntos y niveles](https://help.skool.com/article/31-points-and-leveling), [acceso a cursos](https://help.skool.com/article/144-how-to-grant-course-access-to-members), [cursos por nivel](https://help.skool.com/article/145-how-does-level-locked-courses-work), [precios de la comunidad](https://help.skool.com/article/215-how-to-setup-pricing-for-the-group), [referidos](https://help.skool.com/article/192-how-to-set-up-member-referrals-for-your-community), [precios Skool](https://www.skool.com/pricing).
- Skool, terceros: [Learning Revolution — precios](https://www.learningrevolution.net/skool-pricing/), [RevenueGeeks](https://revenuegeeks.com/software/skool/pricing), [SchoolMaker — afiliados](https://schoolmaker.com/blog/skool-affiliate-program), [Ruzuku — límites del classroom](https://blog.ruzuku.com/learn/articles/is-skool-any-good).
- Mercado Pago: [Link de pago y tarifas](https://www.mercadopago.com.mx/herramientas-para-vender/link-de-pago), [API de suscripciones](https://www.mercadopago.com.mx/developers/es/reference/online-payments/subscriptions/overview).
- Stripe: [Meses sin intereses](https://stripe.com/en-pt/payment-method/meses-sin-intereses), [configurar MSI](https://support.stripe.com/questions/c%C3%B3mo-configurar-meses-sin-intereses-%28msi%29-en-tu-cuenta-stripe?locale=es-419), [pagos en México](https://stripe.com/en-cn/resources/more/payments-in-mexico-an-in-depth-guide), [comparativa de pasarelas](https://www.guiadesoftware.com/blog/mejor-pasarela-pago-mexico).
- Supabase: [precios 2026](https://schematichq.com/blog/supabase-pricing).
- Video en vivo: [LiveKit](https://livekit.io/pricing), [Daily (resumen de precios)](https://www.activepieces.com/blog/dailyco-pricing-2026-per-minute-rates-and-plans), [100ms](https://100ms.live/pricing), [Whereby Embedded](https://whereby.com/information/embedded/pricing), [Cloudflare Realtime](https://developers.cloudflare.com/calls/pricing/), [Cloudflare Stream](https://developers.cloudflare.com/stream/pricing/index.md), [Mux](https://www.mux.com/docs/pricing).
- Refero (patrones de UI): Microsoft Learn, Apollo Odyssey, Miro Academy, MasterClass, Brilliant, Preply, Quizlet.

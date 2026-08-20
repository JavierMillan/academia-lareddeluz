# Brand Profile — ¡Hablemos Inglés! (Constelación · La Red de Luz)
<!-- version: 1.1 · updated: 2026-08-18 · status: confirmed -->

## 0. Snapshot
- One-line definition: sesiones de inglés en vivo, en comunidad, dentro de la constelación de programas de La Red de Luz.
- Tagline: "La luz se construye en red."
- Primary channels: Instagram (posts/stories de convocatoria) + web (hub de sesiones + decks de clase).
- Goal of most visuals: convocar (pre-live, en vivo) + enseñar (deck de sesión).

## 1. Essence
- Mission: que hablar inglés deje de dar miedo, practicando en vivo y en grupo — no solo aprendiendo teoría.
- Personality: en vivo, urgente-pero-cálido, tecnológico, colectivo, sin pena.
- Jungian archetype: **Everyman/Compañero** (shadow: puede sentirse frío o corporativo si el rojo/negro se usa sin la calidez del tono — la voz siempre debe compensar con cercanía) — cruzado con un poco de **Explorador** (te atreves a hablar, a equivocarte).
- Audience: adultos hispanohablantes con miedo a hablar inglés, que ya están en la comunidad de La Red de Luz; buscan un espacio sin juicio para practicar en vivo.
- The ONE feeling every visual must evoke: **"esto está pasando ahora, y no estoy solo."** Urgencia de transmisión en vivo + pertenencia de red.
- Brands/works admired (dirección, no copiar): estética de transmisión en vivo / control room (cuentas regresivas, badges "LIVE"), diagramas de red neuronal minimalistas.

## 2. Color system
- Dominant / base (~60%): Negro `#0A0A0A` — fondo de toda pieza. *(inferido — confirmar si es #000 puro o un negro cálido tipo #0A0A0A; en las piezas se ve negro casi puro con textura sutil)*
- Secondary (~30%): Blanco hueso `#F2F0EC` — titulares grandes, texto principal.
- Accent (~10%, reservado): Rojo Constelación — dos variantes según uso, no un solo hex:
  - **Texto** `#EA4A63` — la única que se usa donde el rojo lleva palabras encima (eyebrows, `.hl`, badges, tablas). `#C8102E` (el rojo "de marca" más saturado de las piezas de referencia) da solo 3.37:1 sobre negro — falla el mínimo AA de 4.5:1. `#EA4A63` pasa en cualquier fondo del deck: 5.33:1 sobre negro puro, 4.94:1 sobre tarjetas `--char-soft`.
  - **Superficie** `#C8102E` (`--sesame-deep`) — bordes, fondos translúcidos, gradientes de barra de progreso, la línea/dot del badge en vivo. Ahí no aplica el requisito de contraste de texto, así que se conserva el rojo más saturado y fiel a las piezas.
  *(inferido — confirmar hex exacto con el diseñador si difiere; la separación texto/superficie es una regla nueva de este ciclo, nacida de una auditoría de contraste real hecha en el navegador)*
- Neutrals: gris línea `rgba(242,240,236,.14)`, gris mute `rgba(242,240,236,.5)`, línea activa roja `rgba(200,16,46,.4)`.
- Dorado de marca madre `#D4A94A` — **solo** en el lockup del logo "LA RED DE LUZ", nunca como acento de la pieza de Inglés. Mantiene la trazabilidad a la marca madre sin diluir el rojo como acento único de esta sub-marca.
- Harmony logic: acromático (negro/blanco) + un solo acento saturado (rojo) — "punch" editorial de control room, no una paleta cromática compleja. El dorado queda aislado al logo como firma de procedencia, no como color de composición.
- Semantic: no aplica UI compleja aún; el rojo dobla como "en vivo/urgente" y el blanco como "informativo".
- Contraste verificado (medido con composición de alfa real en navegador, no solo el hex nominal): blanco hueso sobre negro ≈ 18:1 (AAA). Rojo texto `#EA4A63` sobre negro ≈ 5.33:1 (AA), sobre tarjeta `--char-soft` ≈ 4.94:1 (AA). **Nunca texto rojo sobre fondo rojo translúcido** — ese combo falla siempre sin importar el tono exacto; en esos casos el texto va en blanco y el rojo se queda en el borde/acento (ver `.ab .b .label` en ingles.css como ejemplo resuelto).

## 3. Typography system
- Heading face: sans condensada, bold/black, todo mayúsculas, tracking ajustado (look "broadcast"). *(inferido — confirmar familia exacta; candidatas de espíritu similar: **Archivo Black**, **Anton**, o **Bebas Neue** — todas gratuitas, con ese peso condensado-editorial. Se usará Archivo Black como placeholder hasta confirmar.)*
- Body face: sans neutra y legible — **Spline Sans** (heredada de La Red de Luz / DTMM, mantiene consistencia con el resto del ecosistema de programas).
- Mono/accent face: **Martian Mono** (heredada) — para eyebrows tipo "CONSTELACIÓN", badges de reloj "00:15:00", y etiquetas técnicas.
- Pairing rationale (← essence): condensada+mayúsculas = urgencia de transmisión en vivo; mono para los datos "de sistema" (reloj, estado) refuerza el look tecnológico; sans neutra en cuerpo para que el mensaje humano (la voz cálida) no se pierda en el ruido visual.
- Type scale: base 16px · ratio 1.333 (Perfect Fourth, más dramático que DTMM) → 12·16·21·28·38·50·67·90.
- Defaults: body leading 1.5 · headings 0.95-1.05 (compacto, como en las piezas) · tracking headings +0.01em · tracking eyebrows/mono +0.2-0.3em.
- Text alignment policy: centrado permitido para portadas/anuncios cortos (como las piezas de referencia); left default dentro del deck educativo para bloques de lectura.

## 4. Composition & layout doctrine
- Grid: mismo grid de deck.css (slide = pantalla completa, padding fluido); spacing scale 4·8·16·24·32·48.
- Balance bias: simétrico/centrado en portadas y momentos de cierre (como las piezas); asimétrico/editorial dentro de las slides de contenido (igual que DTMM).
- Focal-point strategy: salto de escala dramático entre el elemento hero (número o palabra clave gigante) y el texto de apoyo — igual que "FALTAN 15 MIN" o "YA INICIAMOS". El acento rojo cae siempre sobre la palabra que debe "doler" o urgir.
- Negative space stance: generoso — el negro respira, nunca se llena.
- Signature moves: **líneas de constelación** (curvas finas conectando nodos circulares) como fondo decorativo en portada y cierre — nunca detrás de texto denso; **badge de estado** tipo "● EN VIVO" / "● PRE-LIVE 00:15:00" con punto rojo pulsante; regla horizontal delgada roja/blanca como separador de sección.
- Aspect-ratio defaults per channel: IG post 1:1, story/reel 9:16, deck 16:9 (heredado del motor de decks).

## 5. Aesthetic direction (style)
- Style blend: 50% control-room / broadcast en vivo · 30% minimalismo tech (grid fino, iconografía de red) · 20% calidez editorial heredada de La Red de Luz (para que no se sienta corporativo-frío).
- Texture / finish: flat con textura de ruido/grano muy sutil en el negro (se percibe en las piezas, no un negro plano de pantalla); sin gradientes vistosos.
- Shape language: geométrico, círculos pequeños (nodos) + líneas curvas finas; esquinas de badges muy redondeadas (pill/999px) contrastando con el titular recto.
- Motion feel (deck/web): calm/eased, coherente con el resto del motor (--ease del deck.css), sin rebote.

## 6. Imagery direction
- Medium: gráfico/generativo (líneas + nodos), no fotografía en las piezas de anuncio; el deck educativo puede usar diagramas simples (tablas, diálogos) sin imagen fotográfica.
- Treatment: alto contraste, negro dominante, elementos lineales finos (1px) en blanco/rojo translúcido.
- Subject do: constelaciones, nodos conectados, badges de estado, cuentas regresivas. Don't: fotografía de stock, íconos de emoji, ilustraciones orgánicas/redondeadas tipo DTMM.
- For AI generation (si se generaran fondos): "black background, thin white and red constellation lines connecting small circular nodes, minimal, high contrast, broadcast/live aesthetic"; negative: "gradient, glow bloom excessive, warm earthy tones, hand-drawn".

## 7. Logo & assets
- Lockup: ícono de La Red de Luz (dorado, la figura de "persona-árbol" ya usada en DTMM) + wordmark "LA RED DE LUZ" en mono tracking amplio, centrado arriba de cada pieza de anuncio.
- Clear space: igual que en las piezas — el logo respira solo, sin texto pegado.
- Do/don't: no recolorear el ícono fuera de dorado; no estirarlo; no ponerlo sobre las líneas de constelación directamente (déjalo en zona de negro limpio).

## 8. Voice tie-in
- Tone in 3 words: en vivo, cercano, sin pena.
- How tone shows up visually: la estructura es urgente/tech (rojo, mayúsculas, reloj), pero el copy real debe mantenerse cálido y de "entre amigos" — la tensión entre forma urgente y voz cálida es intencional, no un error a corregir.

## 9. Guardrails — the "never" list
- Nunca dorado como acento de composición — el dorado es exclusivo del logo/lockup de La Red de Luz.
- Nunca más de un acento rojo "hero" por pantalla (una palabra/número, no varios compitiendo).
- Nunca rojo en texto de cuerpo pequeño (falla contraste práctico y se ve como error, no como diseño).
- Nunca mezclar el sistema mostaza/carbón/crema de DTMM dentro de una pieza de ¡Hablemos Inglés! — son sub-marcas hermanas, no la misma piel.
- Nunca líneas de constelación detrás de texto denso o tablas (solo en portada/cierre, zonas de respiro).
- Nunca iconografía tipo emoji en las piezas de anuncio (IG, hero del hub). **Excepción confirmada**: en el deck educativo de clase (dentro de `.step .ico`) sí se permiten — calidez de aula por encima de la pureza broadcast; decisión de Javier, 18 ago 2026.

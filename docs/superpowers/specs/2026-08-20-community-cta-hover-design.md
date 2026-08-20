# Hover del CTA Comunidad

## Objetivo

Hacer evidente que `COMUNIDAD ↗` es interactivo sin romper la estética sobria del navbar de Academia.

## Comportamiento aprobado

- La transición afecta color, borde, fondo, sombra y transformación durante `180ms`.
- En `:hover`, el botón sube `1px`, recibe un fondo dorado translúcido, un borde más luminoso y un glow suave.
- En `:focus-visible`, conserva el mismo contraste y añade un contorno dorado claramente visible para navegación por teclado.
- El estado base, el enlace de WhatsApp y la composición del navbar no cambian.
- En dispositivos sin hover no se aplica movimiento accidental.

## Verificación

- El test del índice debe comprobar que existen reglas para `.community:hover` y `.community:focus-visible`.
- La página debe seguir sin overflow horizontal en escritorio y móvil.
- El CTA debe continuar apuntando al grupo oficial de WhatsApp.

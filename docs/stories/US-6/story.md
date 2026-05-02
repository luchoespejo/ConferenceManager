# US-6: Publicar congreso

## Descripción

Como organizador, quiero publicar mi congreso para que sea visible en el mini-sitio público en vivo. El estado pasa de **Borrador** a **Publicado**, gatillando la visible de sesiones, expositores, salas en el sitio público.

## Criterios de aceptación

### AC1: Cambio de estado Borrador → Publicado
- Botón "Publicar" en dashboard/detalles del congreso
- endpoint: `PUT /api/dashboard/conferencias/{id}/publicar`
- Valida ownership
- Cambia `Estado` de "Borrador" a "Publicado"
- Retorna ConferenciaDetalleDto actualizado

### AC2: Validaciones antes de publicar (TBD)
- ~~NO requerir sesiones~~ — decidir con PO si es mandatorio tener al menos 1 sesión
- Actualmente: sin validación, solo cambio de estado

### AC3: Angular UI
- Botón "Publicar" en detalles del congreso
- Confirma antes de ejecutar
- Actualiza estado local tras éxito
- Feedback de error si falla

## Notas

- **Constraint**: Solo si estado = "Borrador"
- **Reversible**: US-X en futuro permitirá volver a "Borrador" (despublicar)
- **Mini-sitio**: El sitio Next.js cachea ISR — revalidación manual por ahora (TODO US-X: webhook de revalidación)

## Tamaño

**Small** — 1-2 horas. Solo cambio de estado + UI + endpoint.

## Dependencias

- US-5 completo (necesitamos sesiones para poder publicar bien)

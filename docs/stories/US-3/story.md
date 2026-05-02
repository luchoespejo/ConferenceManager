# US-3: Gestionar salas de un congreso

**Estado:** Ready
**Dependencia:** US-2 (congreso existe con adminToken)

---

## Descripcion

Como organizador autenticado (accedo via adminToken del congreso), quiero poder gestionar las salas de mi congreso para definir los espacios fisicos donde se realizaran las sesiones.

## Actor

Organizador autenticado. La autenticacion es via JWT emitido por el flujo de US-1/US-2; el organizador ya tiene un token valido en el panel admin.

## Criterios de aceptacion

1. **Crear sala:** El organizador puede crear una sala con nombre (requerido, max 100 chars) y capacidad (opcional, entero positivo).
2. **Listar salas:** El organizador puede ver todas las salas de su congreso ordenadas por nombre.
3. **Editar sala:** El organizador puede modificar el nombre y/o la capacidad de una sala existente.
4. **Eliminar sala:** El organizador puede eliminar una sala **solo si no tiene sesiones asignadas**. Si tiene sesiones, el sistema responde con error 422.
5. **Ownership:** Un organizador no puede operar sobre salas de un congreso que no le pertenece (respuesta 404).
6. **Validaciones:** nombre requerido (max 100 chars); capacidad debe ser entero positivo si se provee; nombre unico dentro del mismo congreso.

## Reglas de negocio

- Una sala pertenece a exactamente un congreso.
- El nombre de sala debe ser unico dentro del congreso (no globalmente).
- La capacidad es un campo informativo; no restringe inscripciones.
- La restriccion de eliminacion con sesiones asignadas debe prepararse como hook aunque US-5 (sesiones) aun no exista. En US-3 la tabla `sesiones` no existe, por lo que la validacion siempre pasara — se implementa con un COUNT que retorna 0.
- El endpoint verifica ownership pasando por la tabla `conferencias` (join o subquery): el `conferenciaId` del path debe pertenecer al `usuarioId` del JWT.

## Fuera de alcance

- Asignacion de sesiones a salas (US-5).
- Capacidad como restriccion de cupos de inscripcion.
- Ordenamiento personalizado de salas.

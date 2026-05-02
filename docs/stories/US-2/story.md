# US-2: Crear y configurar un congreso

## Description
As an authenticated organizer,
I want to create and configure my conference with its name, slug, dates, and optional branding and venue information,
so that I have a named, uniquely identifiable entity that I can build out with rooms, speakers, and sessions before making it public.

## Context
El congreso es la entidad central de ConferenceManager. Todo lo demás —salas, expositores, sesiones, participantes, certificados, el mini-sitio público— existe dentro del contexto de un congreso concreto. Sin esta entidad creada y configurada correctamente, ninguna otra operación del organizador es posible. US-2 establece ese núcleo.

La multitenancy del sistema se instrumenta a través del congreso: cada organizador solo ve y opera sobre los congresos que él mismo creó. No existe visibilidad cruzada entre organizadores. Toda query que involucra congresos debe filtrarse por el `organizador_id` extraído del JWT, y toda query pública futura filtrará por `slug`. El slug es, en consecuencia, el identificador de negocio más crítico del sistema: una vez que el congreso es público no puede cambiar sin romper URLs ya distribuidas.

Al crear el congreso el organizador proporciona los datos mínimos obligatorios (nombre, slug, fechas) y puede enriquecer el registro con branding (logo, colores, tipografía) y datos de venue. El congreso nace en estado `borrador`, invisible para el público. Este estado permite al organizador iterar sobre la configuración con libertad total —incluyendo edición de todos los campos— antes de hacer el congreso accesible al mundo, acción que cubre una historia separada (US-6). La eliminación solo está permitida mientras el congreso está en `borrador`; los congresos `publicados` o `finalizados` son registros permanentes del negocio.

El dashboard de administración expone al organizador la lista de sus congresos con los datos de estado más relevantes, permitiéndole acceder rápidamente a cualquiera. Esta vista es el punto de entrada habitual al panel una vez que el organizador tiene más de un congreso activo.

## Scope

**Includes:**
- Crear congreso con campos obligatorios: nombre, slug, fecha_inicio, fecha_fin
- Crear congreso con campos opcionales: descripción, logo_url, color_primario, color_secundario, tipografia, venue_nombre, venue_direccion, venue_link_maps
- Sugerencia automática de slug a partir del nombre (solo minúsculas, números y guiones; sin acentos ni caracteres especiales)
- Validación del slug: solo minúsculas, dígitos y guiones; mínimo 3 caracteres, máximo 50; único en todo el sistema
- El congreso se crea en estado `borrador`
- Editar cualquier campo del congreso mientras está en `borrador` o `publicado`
- Listar los congresos propios del organizador autenticado con: nombre, slug, estado, fecha_inicio, fecha_fin, cantidad de sesiones
- Eliminar un congreso en estado `borrador` (requiere confirmación explícita del organizador en el cliente)
- Rechazo de eliminación cuando el congreso está en estado `publicado` o `finalizado`
- Protección de todos los endpoints bajo JWT válido (herencia de US-1)

**Does not include (explicitly out of scope):**
- Publicar el congreso y transición de estado `borrador` → `publicado` (US-6)
- Gestión de salas (US-3), expositores (US-4), sesiones (US-5)
- Gestión de participantes (US-10)
- Avisos urgentes (US-12)
- Branding visual efectivo en el mini-sitio público (US-17)
- Campo `firma_url` para certificados (Fase 2)
- Cambio de slug después de que el congreso ha sido publicado
- Duplicación/clonado de congresos

## Acceptance criteria

### Scenario 1: Creación exitosa de un congreso con datos mínimos
```gherkin
Given el organizador está autenticado con un JWT válido
  And no existe ningún congreso con slug "mi-congreso-2026" en el sistema
When el organizador envía nombre="Mi Congreso 2026", slug="mi-congreso-2026", fecha_inicio="2026-09-01", fecha_fin="2026-09-03"
Then el sistema crea el congreso con los datos proporcionados
  And el congreso queda en estado "borrador"
  And la respuesta incluye el id UUID del congreso recién creado y todos sus campos
  And el congreso aparece en la lista de congresos del organizador
```

### Scenario 2: Creación exitosa con todos los campos opcionales
```gherkin
Given el organizador está autenticado con un JWT válido
  And el slug "conf-full-2026" no existe en el sistema
When el organizador envía todos los campos: nombre, slug, fechas, descripción, logo_url, color_primario, color_secundario, tipografia, venue_nombre, venue_direccion, venue_link_maps
Then el sistema persiste todos los campos tal como fueron enviados
  And el congreso queda en estado "borrador"
  And la respuesta refleja la totalidad de los campos almacenados
```

### Scenario 3: Rechazo por slug duplicado
```gherkin
Given existe un congreso (de cualquier organizador) con slug "slug-existente"
When el organizador autenticado intenta crear un congreso con slug="slug-existente"
Then el sistema retorna HTTP 409
  And el cuerpo de la respuesta indica que el slug ya está en uso
  And no se crea ningún congreso nuevo
```

### Scenario 4: Rechazo por slug con formato inválido
```gherkin
Given el organizador está autenticado con un JWT válido
When el organizador envía un slug que incumple el formato permitido (por ejemplo: "Mi Congreso", "ab", "slug_con_underscore", "-empieza-con-guion", "slug-que-supera-los-cincuenta-caracteres-de-limite-maximo")
Then el sistema retorna HTTP 400
  And el cuerpo de la respuesta incluye el mensaje de error específico para el campo slug
  And no se crea ningún congreso
```

### Scenario 5: Rechazo por campos obligatorios ausentes
```gherkin
Given el organizador está autenticado con un JWT válido
When el organizador envía una petición de creación sin uno o más campos obligatorios (nombre, slug, fecha_inicio, fecha_fin)
Then el sistema retorna HTTP 400
  And la respuesta identifica cada campo obligatorio ausente o inválido
  And no se crea ningún congreso
```

### Scenario 6: Rechazo por fechas inconsistentes
```gherkin
Given el organizador está autenticado con un JWT válido
When el organizador envía fecha_inicio posterior a fecha_fin (por ejemplo fecha_inicio="2026-09-05", fecha_fin="2026-09-01")
Then el sistema retorna HTTP 400
  And la respuesta indica que la fecha de inicio debe ser anterior o igual a la fecha de fin
  And no se crea ningún congreso
```

### Scenario 7: Sugerencia automática de slug a partir del nombre
```gherkin
Given el organizador está en el formulario de creación de congreso
When el organizador escribe el nombre "Congreso Internacional de IA 2026"
Then el campo slug se autocompleta con "congreso-internacional-de-ia-2026" (minúsculas, acentos eliminados, espacios reemplazados por guiones)
  And el organizador puede editar el slug sugerido antes de confirmar
```

### Scenario 8: Edición exitosa de un congreso en borrador
```gherkin
Given existe un congreso del organizador autenticado en estado "borrador"
When el organizador envía nuevos valores para uno o más campos (incluido el slug, si el nuevo slug no existe)
Then el sistema actualiza el congreso con los nuevos valores
  And la respuesta retorna el congreso con los datos actualizados
  And el estado permanece en "borrador"
```

### Scenario 9: Edición exitosa de un congreso publicado
```gherkin
Given existe un congreso del organizador autenticado en estado "publicado"
When el organizador envía una edición de campos de configuración (nombre, descripción, branding, venue)
Then el sistema actualiza los campos editables del congreso
  And la respuesta retorna el congreso con los datos actualizados
  And el estado permanece en "publicado"
```

### Scenario 10: Listar congresos propios del organizador
```gherkin
Given el organizador autenticado tiene 3 congresos creados (en distintos estados)
  And otro organizador tiene congresos propios en el sistema
When el organizador solicita su lista de congresos
Then el sistema retorna únicamente los 3 congresos del organizador autenticado
  And cada ítem incluye: nombre, slug, estado, fecha_inicio, fecha_fin, cantidad_sesiones
  And los congresos de otros organizadores no aparecen en la respuesta
```

### Scenario 11: Eliminación exitosa de un congreso en borrador
```gherkin
Given existe un congreso del organizador autenticado en estado "borrador"
  And el organizador confirma la intención de eliminar en el cliente
When el organizador envía la petición de eliminación
Then el sistema elimina el congreso permanentemente
  And retorna HTTP 204
  And el congreso ya no aparece en la lista del organizador
```

### Scenario 12: Intento de eliminar un congreso publicado
```gherkin
Given existe un congreso del organizador autenticado en estado "publicado"
When el organizador envía la petición de eliminación
Then el sistema retorna HTTP 422
  And el cuerpo de la respuesta indica que un congreso publicado no puede ser eliminado
  And el congreso permanece intacto
```

### Scenario 13: Intento de eliminar un congreso finalizado
```gherkin
Given existe un congreso del organizador autenticado en estado "finalizado"
When el organizador envía la petición de eliminación
Then el sistema retorna HTTP 422
  And el cuerpo de la respuesta indica que un congreso finalizado no puede ser eliminado
  And el congreso permanece intacto
```

### Scenario 14: Acceso rechazado a congreso de otro organizador
```gherkin
Given existe un congreso cuyo propietario es el organizador B
  And el organizador A está autenticado con un JWT válido
When el organizador A intenta editar, eliminar o ver el detalle del congreso de B usando su ID
Then el sistema retorna HTTP 404
  And no se expone información sobre la existencia del congreso ni del organizador B
```

### Scenario 15: Endpoint rechazado sin JWT
```gherkin
Given una petición a cualquier endpoint de congreso sin cabecera Authorization
When el sistema procesa la petición
Then el sistema retorna HTTP 401
  And no se devuelve ningún dato de congreso
```

## Dependencies
- **US-1**: El organizador debe estar autenticado vía JWT. Todos los endpoints de US-2 requieren el `organizador_id` extraído del token. US-1 debe estar completada y en producción.

## Open questions

Resueltas por PO (2026-04-28):

1. **Cambio de slug post-publicación (RISK-02-02):** NO permitido en Fase 1. Una vez que el congreso es publicado, el slug es inmutable. El organizador que distribuya el subdominio incorrecto debe contactar a soporte. Esta limitación debe ser comunicada claramente en el UI antes de publicar. **Acción:** Documentar explícitamente que edición de slug solo es posible en estado `borrador`.

2. **Eliminación en cascada (RISK-02-04):** SÍ se implementa. Eliminar un congreso en borrador que tiene salas, sesiones, expositores u otros datos cargados eliminará TODAS las entidades hijas en cascada. El cliente DEBE mostrar una advertencia explícita al organizador antes de confirmar la eliminación, detallando qué va a borrarse (ej. "Esto eliminará 5 salas, 12 sesiones y 8 expositores"). **Acción:** TL define cascade rules en el modelo EF Core; cliente implementa warning modal.

3. **Monopolio de slugs (RISK-02-03):** Aceptado como riesgo de negocio. No hay mecanismo de liberación de slugs registrados pero no usados. Un slug "congreso-2026" que es registrado por un organizador y nunca publicado es irecuperable. Este riesgo se monitorea para Fase 2. **Acción:** Equipo de soporte instruida sobre este escenario.

## Identified functional risks

| ID | Description | Probabilidad | Impacto |
|----|-------------|-------------|--------|
| RISK-02-01 | El slug se autocompleta en el cliente pero el backend no lo re-valida de forma independiente; si hay un bug en la lógica de sugerencia el cliente podría enviar slugs inválidos que el backend debería rechazar. El backend DEBE validar el slug siempre, independientemente de la sugerencia del cliente. | Low | High |
| RISK-02-02 | Un organizador publica el congreso (US-6) y luego quiere cambiar el slug porque distribuyó el subdominio incorrecto. El scope actual no contempla cambio de slug post-publicación, lo que podría generar presión de soporte. | Medium | Medium |
| RISK-02-03 | La unicidad del slug es global (cross-tenant). Un slug "popular" (ej. "congreso-2026") podría ser registrado por el primer organizador que llegue, bloqueando a todos los demás. No hay mecanismo de liberación ni expiración. | Medium | Medium |
| RISK-02-04 | No está definido qué ocurre con las entidades hijas (salas, sesiones, expositores) si se elimina un congreso en borrador que ya tiene datos cargados. La eliminación en cascada debe ser explícita en el modelo de datos. | Low | High |

**Riesgos que requieren atención antes de implementar:**

- **RISK-02-02** (Medium × Medium) — LOG: registrado, equipo notificado.
- **RISK-02-03** (Medium × Medium) — LOG: registrado, equipo notificado.
- **RISK-02-01** (Low × High) — LOG: registrado; el TL debe asegurar validación server-side explícita en el plan técnico.
- **RISK-02-04** (Low × High) — LOG: registrado; el TL debe definir la política de eliminación en cascada en el plan técnico.

## Metadata
- **ID:** US-2
- **Epic:** E2 — Gestión del congreso
- **Estimate:** L
- **Status:** Ready
- **Author:** Functional Analyst
- **Date:** 2026-04-28
- **Reviewed by PO:** Approved 2026-04-28

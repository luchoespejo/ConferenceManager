# US-10: Gestionar participantes del congreso

**Épica**: E2 (Gestión del congreso)  
**Prioridad**: 🟡 Media  
**Tamaño**: M  
**Estado**: Ready  
**Dependencias**: US-2 (Crear y configurar congreso)

---

## Valor de negocio

Como organizador de congresos,  
Quiero gestionar una lista de participantes (nombres, emails),  
Para poder generar certificados y hacer seguimiento de asistencia.

---

## Criterios de aceptación

### CA1: Create Participante
- POST `/api/dashboard/conferencias/{id}/participantes`
- Body: `{ nombre, email }`
- Validar: email único por conferencia, nombre no vacío
- Retorna: participante creado con ID

### CA2: List Participantes
- GET `/api/dashboard/conferencias/{id}/participantes`
- Retorna: array de participantes (paginado opcional)
- Filtra por ownership (solo mi conferencia)

### CA3: Get Participante Detail
- GET `/api/dashboard/conferencias/{id}/participantes/{participanteId}`
- Retorna: nombre, email, puede_generar_certificado (bool)

### CA4: Update Participante
- PUT `/api/dashboard/conferencias/{id}/participantes/{participanteId}`
- Puede editar: nombre, email, puede_generar_certificado
- Email debe ser único si cambia

### CA5: Delete Participante
- DELETE `/api/dashboard/conferencias/{id}/participantes/{participanteId}`
- No hay deps, simplemente elimina

### CA6: Admin UI (Angular)
- List view: tabla con nombre, email, certificado (switch)
- Create form: modal o inline
- Inline edit: email + certificado toggle
- Delete: confirm dialog

---

## Notas técnicas

- **Model**: Participante(Id, ConferenciaId, Nombre, Email, PuedeGenerarCertificado, CreatedAt)
- **PK**: UUID
- **Constraints**: Email unique per Conferencia (composite index)
- **DTO**: ParticipanteDto (list + detail)
- **Service**: IParticipanteService (CRUD)
- **Controller**: /api/dashboard/conferencias/{id}/participantes

---

## Tareas

- [ ] Backend model + EF migration
- [ ] Backend service + controller
- [ ] Backend validation + tests
- [ ] Angular list component
- [ ] Angular create/edit form
- [ ] Angular delete with confirmation
- [ ] E2E test: Create → List → Edit → Delete

---

*Escrito: 2026-05-02*

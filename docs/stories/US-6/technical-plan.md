# Technical Plan — US-6: Publicar congreso

**Estimated size**: Small  
**Effort**: 1-2 hours  
**Branch**: `feature/US-6-publicar-congreso`

---

## Implementation Breakdown

### Backend (1 task)

1. **Add PublicarAsync to IConferenciaService + ConferenciaService**
   - Check ownership
   - Validate estado == "Borrador", else fail with error code (e.g., "AlreadyPublished")
   - Change estado to "Publicado"
   - Save & return ConferenciaDetalleDto
   - Method: `Task<ServiceResult<ConferenciaDetalleDto>> PublicarAsync(Guid conferenciaId, Guid usuarioId)`

### Controller (1 task)

2. **Add PUT endpoint to ConferenciasController**
   - Route: `PUT /api/dashboard/conferencias/{id}/publicar`
   - Invoke PublicarAsync
   - Return 200 ConferenciaDetalleDto on success
   - Return 400 with error code if not Borrador

### Error Codes (1 task)

3. **Add error constant**
   - ConferenciaErrorCodes.AlreadyPublished (or CannotPublishNotDraft)

### Angular UI (2 tasks)

4. **Add button to congreso-form.component or create detail view**
   - "Publicar" button visible only if estado == "Borrador"
   - On click: confirm dialog
   - Call service method
   - Update local signal
   - Handle error

5. **Add publicar() method to CongresoService**
   - `publicar(id: string): Observable<ConferenciaDetalleDto>`
   - HTTP PUT to `/api/dashboard/conferencias/{id}/publicar`

---

## Files to Create/Modify

### Backend

- `backend/Services/ConferenciaService.cs` — add PublicarAsync method
- `backend/Services/ConferenciaErrorCodes.cs` — add AlreadyPublished constant
- `backend/Controllers/ConferenciasController.cs` — add [HttpPut("{id}/publicar")] endpoint

### Angular

- `admin/src/app/congresos/congreso.service.ts` — add publicar() method
- `admin/src/app/congresos/congreso-form/congreso-form.component.ts` — add Publicar button + logic
  OR
- `admin/src/app/dashboard/dashboard.component.ts` — add Publicar button to list item

### Docs

- `docs/stories/US-6/implementation-notes.md` — after implementation

---

## Blockers

None. Ready to start.

---

## Key Decisions

- **No session validation** — currently no requirement to have sesiones before publishing (can decide with PO)
- **Button placement**: Suggest in congreso detail view (edit page) or dashboard list item
- **UI flow**: Click button → confirm dialog → API call → update local state → show success message
- **Reversibility**: Not implemented in this story; US-X can add "Despublicar" later

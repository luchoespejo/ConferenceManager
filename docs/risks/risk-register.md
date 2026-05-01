# Risk Register — ConferenceManager

| ID | Historia | Descripción | Tipo | Probabilidad | Impacto | Estado | Identificado por |
|----|----------|-------------|------|-------------|---------|--------|-----------------|
| RT-4-03 | US-4 | La validación "no eliminar expositor si tiene sesiones asignadas" no existe hasta que US-5 la implemente. Un expositor podría eliminarse aunque tenga sesiones asignadas si US-5 no agrega explícitamente esa validación en `ExpositorService.DeleteAsync`. | Funcional / Integridad referencial | Media | Media | TL (US-4) |

_Se completa a medida que los agentes identifican riesgos durante el análisis funcional y técnico._

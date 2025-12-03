# Google Meet Captions - Investigación y Estado

## Estado Actual

**Fecha de investigación:** 2025-01-28

## Resultado de la Investigación

Después de investigar la disponibilidad de captions de Google Meet a través de la API de Google Calendar, se determinó lo siguiente:

### Google Calendar API

La API de Google Calendar **NO expone directamente** los captions o transcripciones de Google Meet. La API de Calendar solo proporciona:

- Información básica del evento (título, descripción, fecha/hora)
- Metadatos del evento (organizador, participantes, ubicación)
- Links de Meet (si el evento tiene una reunión de Meet asociada)
- Campos personalizados del evento

### Google Meet API

Google tiene una API separada para Google Meet, pero:

1. **Google Meet Recording API** - Requiere permisos administrativos y solo está disponible para Workspace Enterprise
2. **No hay API pública** para acceder a captions/transcripciones de reuniones de Meet
3. Los captions se generan en tiempo real durante la reunión, pero no se almacenan de forma accesible por API

### Alternativas Actuales

1. **Tactiq** - Servicio de terceros que genera transcripciones automáticamente y las guarda en Google Drive
2. **Google Drive** - Las transcripciones de Tactiq se guardan como Google Docs en la carpeta `📂 Registros/Tactiq Transcription`
3. **Manual** - Exportar captions manualmente desde Meet si están disponibles

## Implementación Futura

Cuando Google proporcione acceso a captions/transcripciones de Meet vía API, se implementará:

1. Detección automática de reuniones de Meet con captions disponibles
2. Extracción directa de captions desde la API de Meet
3. Priorización de captions de Meet sobre transcripciones de Tactiq
4. Fallback automático a Tactiq si Meet no tiene captions

## Referencias

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google Meet API Documentation](https://developers.google.com/meet/api)
- [Tactiq Integration](https://tactiq.com/)

## Notas

- El sistema actual usa la carpeta de Tactiq como fuente principal de transcripciones
- El matching jerárquico implementado en `match-tactiq-transcript.ts` es suficiente para encontrar transcripciones de Tactiq
- Si en el futuro Google expone captions de Meet, se actualizará `find-transcript-for-event.ts` para priorizar Meet


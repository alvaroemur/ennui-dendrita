# Extracción de Transcripciones de Reuniones

Script para extraer transcripciones de reuniones desde Supabase. Esta funcionalidad en el futuro será proporcionada por **Neuron por API**.

## 📋 Descripción

Este script busca transcripciones de reuniones en las tablas de Supabase:

- `calendar_events` - Eventos de calendario sincronizados
- `calendar_event_instances` - Instancias de eventos recurrentes

Las transcripciones pueden estar almacenadas en:
- Campo `full_metadata` (JSONB) con campos como `transcript_url`, `transcript_text`, `tactiq_transcript`
- Campo `description` con links a Google Docs (transcripciones de Tactiq)

## 🚀 Uso

### Ejecución básica

```bash
npx ts-node .dendrita/integrations/scripts/extract-meeting-transcripts.ts
```

### Especificar ruta de salida

```bash
npx ts-node .dendrita/integrations/scripts/extract-meeting-transcripts.ts ./output/transcripts.json
```

## 📊 Salida

El script genera dos archivos:

1. **JSON** (`meeting-transcripts-YYYY-MM-DD.json`): Lista completa de transcripciones encontradas
2. **TXT** (`meeting-transcripts-YYYY-MM-DD-summary.txt`): Resumen en texto plano

### Formato del JSON

```json
[
  {
    "event_id": "uuid-del-evento",
    "google_event_id": "google-event-id",
    "summary": "Título de la reunión",
    "start_date_time": "2025-11-06T10:00:00Z",
    "transcript_url": "https://docs.google.com/document/d/...",
    "transcript_text": "Texto de la transcripción...",
    "transcript_source": "url|text|description_link",
    "source_type": "calendar_event|calendar_instance"
  }
]
```

## 🔍 Búsqueda de Transcripciones

El script busca transcripciones en los siguientes campos:

### En `full_metadata` (JSONB):
- `transcript_url` / `transcriptUrl`
- `transcript_text` / `transcriptText`
- `transcript` / `transcription`
- `tactiq_transcript_url` / `tactiqTranscriptUrl`
- `tactiq_transcript` / `tactiqTranscript`
- `meeting_transcript_url` / `meetingTranscriptUrl`

### En `description`:
- Links a Google Docs (formato: `https://docs.google.com/document/d/...`)

## ⚠️ Estado Actual

**No se encontraron transcripciones en Supabase** porque:

1. **Las transcripciones están en Google Drive**: Según el código de Neuron, las transcripciones de Tactiq se almacenan en Google Drive (carpeta `📂 Registros/Tactiq Transcription`)
2. **No se han sincronizado a Supabase**: Las transcripciones aún no se han migrado desde Google Sheets/Drive a Supabase
3. **Estructura diferente**: Las transcripciones pueden estar en otra tabla o estructura

## 🔮 Integración Futura con Neuron

En el futuro, **Neuron proporcionará esta funcionalidad por API**:

### API Propuesta

```typescript
// Ejemplo de API futura de Neuron
interface NeuronTranscriptAPI {
  // Obtener transcripciones de un evento
  getTranscript(eventId: string): Promise<Transcript>;
  
  // Obtener todas las transcripciones de un rango de fechas
  getTranscriptsByDateRange(start: Date, end: Date): Promise<Transcript[]>;
  
  // Obtener transcripciones por neurona
  getTranscriptsByNeuron(neuronName: string): Promise<Transcript[]>;
  
  // Buscar transcripciones por texto
  searchTranscripts(query: string): Promise<Transcript[]>;
}
```

### Migración desde Google Sheets

Cuando Neuron migre de Google Sheets a Supabase:

1. **Sincronización automática**: Las transcripciones se sincronizarán automáticamente desde Google Drive a Supabase
2. **API REST**: Neuron expondrá una API REST para acceder a las transcripciones
3. **Integración con Axon**: Las transcripciones se integrarán con el sistema Axon para análisis conjunto

## 📝 Notas

- El script usa **Supabase service role key** si está disponible, o **anon key** como fallback
- Las transcripciones se deduplican por `google_event_id`
- El script limita la búsqueda a 1000 eventos por tabla para evitar sobrecarga

## 🔗 Relación con Neuron

Este script es un **precursor** de la funcionalidad que Neuron proporcionará:

- **Ahora**: Script manual para extraer transcripciones desde Supabase
- **Futuro**: API de Neuron que proporcionará transcripciones de forma integrada

## 📚 Referencias

- [Neuron - Pipeline de Transcripciones](../_temp/neuron/gas/pipeline.transcripts.js)
- [Neuron - Documentación del Sistema](../_temp/neuron/docs/neuron-system-sheets-overview.md)
- [Calendar Scraper Schema](../services/google/calendar-scraper-schema.sql)


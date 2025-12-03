# Pipeline de Procesamiento de Transcripciones de Reuniones

Pipeline modular para procesar transcripciones de reuniones desde el calendario hasta el enriquecimiento de meeting notes.

## Descripción

Este pipeline automatiza el proceso completo de:

1. **Actualización del calendario** - Usa el scraper de dendrita para sincronizar eventos
2. **Obtención de transcripciones** - Busca transcripciones desde Google Meet (futuro), Supabase o carpeta Tactiq
3. **Gestión de matches** - Guarda relaciones entre eventos y transcripciones en `event_transcript_matches`
4. **Análisis con LLM** - Analiza transcripciones y extrae información estructurada (tags, variables, tareas, decisiones)
5. **Gestión de meeting notes** - Busca o crea entradas del día en `meeting-notes.md`
6. **Actualización de metadatos** - Mantiene JSON persistente con metadatos de reuniones
7. **Integración y enriquecimiento** - Integra transcripciones con notas existentes

### 🔗 Relaciones en Base de Datos

Las transcripciones matcheadas se guardan en la tabla `event_transcript_matches` de Supabase, lo que permite:

- **Evitar rehacer el matching**: Los matches confirmados se reutilizan automáticamente
- **Historial de matches**: Se guarda el historial de todos los matches (confirmados, pendientes, rechazados)
- **Confirmación manual**: Los matches de Tactiq requieren confirmación manual antes de ser usados automáticamente
- **Rendimiento mejorado**: No es necesario buscar en Tactiq cada vez si ya hay un match guardado

**Prioridad de búsqueda:**
1. **Base de datos** (matches guardados confirmados o pendientes)
2. Google Meet captions (futuro)
3. Supabase (`full_metadata`, `description`)
4. Tactiq folder (matching jerárquico)

## Arquitectura

```
process-meeting-transcript.ts (Pipeline principal)
├── find-transcript-for-event.ts (Búsqueda unificada de transcripciones)
│   ├── Google Meet captions (futuro)
│   ├── Supabase (full_metadata, description)
│   └── match-tactiq-transcript.ts (Matching jerárquico de Tactiq)
├── analyze-transcript.ts (Análisis con LLM)
├── manage-meeting-notes-entry.ts (Gestión de entradas)
├── update-meeting-metadata.ts (Gestión de metadatos)
└── integrate-transcript-analysis.ts (Integración y enriquecimiento)
```

## Uso

### Procesamiento Individual

Procesar un evento específico:

```bash
ts-node .dendrita/integrations/scripts/pipelines/meeting-notes-pipeline/process-meeting-transcript.ts \
  --event-id <event-id> \
  [--workspace inspiro] \
  [--auto-apply] \
  [--model gpt-4-turbo] \
  [--output-dir ./output]
```

### Procesamiento Masivo

Procesar múltiples eventos:

```bash
# Últimos 7 días (por defecto)
ts-node .dendrita/integrations/scripts/pipelines/meeting-notes-pipeline/process-meeting-transcript.ts \
  --batch \
  [--workspace inspiro] \
  [--auto-apply]

# Con rango de fechas específico
ts-node .dendrita/integrations/scripts/pipelines/meeting-notes-pipeline/process-meeting-transcript.ts \
  --batch \
  --date-range 2025-01-01:2025-01-31 \
  [--workspace inspiro] \
  [--auto-apply]
```

## Opciones

- `--event-id <id>` - ID del evento en Supabase a procesar
- `--batch` - Procesamiento masivo de eventos
- `--date-range <start:end>` - Rango de fechas (YYYY-MM-DD:YYYY-MM-DD) para batch
- `--workspace <name>` - Workspace a usar (default: inspiro)
- `--auto-apply` - Aplicar integración automáticamente (sin revisión manual)
- `--model <model>` - Modelo de OpenAI a usar (default: según task type)
- `--output-dir <dir>` - Directorio para archivos de salida (análisis, recomendaciones)

## Componentes

### 1. `find-transcript-for-event.ts`

Búsqueda unificada de transcripciones con prioridad:

1. **Base de datos** - Busca matches guardados en `event_transcript_matches` (confirmados o pendientes)
2. **Google Meet captions** (futuro - cuando Google proporcione API)
3. **Supabase** - Busca en `full_metadata` y `description` de eventos (guarda match si encuentra)
4. **Tactiq folder** - Matching jerárquico mejorado de Neuron 1.0 (guarda match como pendiente)

### 1.1. `manage-transcript-matches.ts`

Gestión de relaciones entre eventos y transcripciones:

- `findExistingMatch(eventId)` - Busca match existente para un evento
- `saveMatch(match)` - Guarda nuevo match o actualiza existente
- `confirmMatch(matchId)` - Confirma un match pendiente
- `rejectMatch(matchId)` - Rechaza un match
- `getMatchesForEvent(eventId)` - Obtiene todos los matches para un evento

### 1.2. `list-transcript-matches.ts`

Script para gestionar matches guardados:

```bash
# Listar matches para un evento
ts-node list-transcript-matches.ts list <event-id>

# Listar todos los matches pendientes
ts-node list-transcript-matches.ts pending

# Confirmar un match
ts-node list-transcript-matches.ts confirm <match-id>

# Rechazar un match
ts-node list-transcript-matches.ts reject <match-id>
```

### 2. `match-tactiq-transcript.ts`

Matching jerárquico mejorado basado en lógica de Neuron 1.0:

- **Filtro temporal**: Mismo día o ventana de 48 horas
- **Score por fecha**: Fecha en nombre (YYYY-MM-DD) + tokens del título
- **Score por proximidad temporal**: Fin de evento vs createdTime del Doc
- **Score por similitud de nombres**: Jaro-Winkler mejorado
- **Bonus por participantes**: Detecta participantes en título/nombre

### 3. `analyze-transcript.ts`

Análisis de transcripción con LLM que extrae:

- Información de la reunión (fecha, participantes, resumen)
- Temas discutidos
- Decisiones tomadas
- Tareas asignadas
- Clientes/proyectos mencionados
- Próximos pasos
- Insights clave
- **Tags** - Etiquetas para categorizar la reunión
- **Variables** - Variables estructuradas (workspace, type, participants, client, project)

### 4. `manage-meeting-notes-entry.ts`

Gestión de entradas en `meeting-notes.md`:

- Busca entrada por fecha (formato: `## Nov 06, 2025 | ...`)
- Crea nueva entrada si no existe
- Retorna información de entrada existente

### 5. `update-meeting-metadata.ts`

Gestión de JSON persistente de metadatos:

- Archivo: `workspaces/🌸 inspiro/⚙️ company-management/data/meeting-notes-metadata.json`
- Estructura: `{entries: [{date, title, participants, transcript_url, transcript_source, last_updated, tags, variables}]}`
- Agrega/actualiza entradas automáticamente

### 6. `process-meeting-transcript.ts`

Pipeline principal que orquesta todo el flujo:

1. Obtiene evento desde Supabase
2. Busca transcripción (Google Meet → Supabase → Tactiq)
3. Analiza transcripción con LLM
4. Gestiona entrada en `meeting-notes.md`
5. Actualiza JSON de metadatos
6. Determina estrategia de integración
7. Aplica integración (si `--auto-apply`)

## Configuración

### Archivo de configuración

`.dendrita/users/[user-id]/config/transcript-matching.json`:

```json
{
  "tactiq_folder": {
    "path": ["📂 Registros", "Tactiq Transcription"],
    "folder_id": null
  },
  "matching": {
    "time_window_hours": 48,
    "name_similarity_threshold": 0.45,
    "time_weight": 0.7,
    "name_weight": 0.3,
    "participants_bonus": 0.05,
    "min_final_score": 0.3
  },
  "google_meet": {
    "enabled": true,
    "prefer_captions": true
  }
}
```

## Estructura de Archivos

```
.dendrita/integrations/scripts/
├── pipelines/
│   └── meeting-notes-pipeline/
│       ├── process-meeting-transcript.ts      # Pipeline principal
│       ├── find-transcript-for-event.ts       # Búsqueda de transcripciones
│       ├── match-tactiq-transcript.ts         # Matching de Tactiq
│       ├── manage-transcript-matches.ts       # Gestión de matches en BD
│       ├── list-transcript-matches.ts         # Script para gestionar matches
│       ├── manage-meeting-notes-entry.ts       # Gestión de entradas
│       ├── update-meeting-metadata.ts         # Gestión de metadatos
│       └── README.md                           # Este archivo
├── analyze/
│   ├── analyze-transcript.ts                  # Análisis con LLM (extendido)
│   └── integrate-transcript-analysis.ts       # Integración y enriquecimiento
└── config/
    └── transcript-matching.json                # Configuración de matching
```

## Flujo de Datos

```
Evento (Supabase)
  ↓
Buscar Transcripción
  ├─ Base de datos (matches guardados) ← NUEVO
  ├─ Google Meet (futuro)
  ├─ Supabase (full_metadata, description) → Guarda match
  └─ Tactiq (matching jerárquico) → Guarda match (pending)
  ↓
Analizar con LLM
  ├─ Extraer información estructurada
  ├─ Identificar tags
  └─ Extraer variables
  ↓
Gestionar Entrada
  ├─ Buscar entrada del día
  └─ Crear si no existe
  ↓
Actualizar Metadatos
  └─ JSON persistente
  ↓
Integrar y Enriquecer
  ├─ Determinar estrategia
  └─ Aplicar (auto-apply o manual)
```

## Troubleshooting

### No se encuentra transcripción

1. Verificar que el evento tenga transcripción en Supabase (`full_metadata`)
2. Verificar que la carpeta de Tactiq exista y tenga documentos
3. Verificar que el matching tenga suficiente score (ver `min_final_score` en config)

### Error al analizar transcripción

1. Verificar que `OPENAI_API_KEY` esté configurado
2. Verificar que el modelo especificado esté disponible
3. Verificar que la transcripción no esté vacía

### Error al gestionar entrada

1. Verificar que `meeting-notes.md` exista y sea accesible
2. Verificar formato de fecha (debe ser YYYY-MM-DD)
3. Verificar permisos de escritura

### Error al actualizar metadatos

1. Verificar que el directorio `data/` exista
2. Verificar permisos de escritura
3. Verificar formato JSON válido

## Integración con Sistema Existente

- Usa `CalendarScraper` existente para actualización de calendario
- Extiende `analyze-transcript.ts` para tags y variables
- Reutiliza `integrate-transcript-analysis.ts` para enriquecimiento
- Puede integrarse con hook `session-initialization-verification.md` para ejecución automática

## Estado de Google Meet Captions

Actualmente, Google Meet captions **NO están disponibles** vía API. Ver `../../.archived/2025-11-06-integration-docs/scripts-docs/GOOGLE-MEET-CAPTIONS.md` para más información.

El sistema usa Tactiq como fuente principal de transcripciones con matching jerárquico mejorado.

## Próximos Pasos

- [ ] Implementar auto-apply completo en `integrate-transcript-analysis.ts`
- [ ] Agregar soporte para Google Meet captions cuando esté disponible
- [ ] Mejorar matching de Tactiq con machine learning
- [ ] Agregar tests unitarios e integración
- [ ] Integrar con hook de inicialización para ejecución automática


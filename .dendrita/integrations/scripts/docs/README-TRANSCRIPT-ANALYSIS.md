# Análisis de Transcripciones con OpenAI

Scripts para analizar transcripciones de reuniones y enriquecer meeting notes usando OpenAI.

## Scripts Disponibles

### 1. `analyze-transcript.ts`
Analiza una transcripción de reunión y genera un JSON estructurado con información clave.

**Uso:**
```bash
ts-node .dendrita/integrations/scripts/analyze-transcript.ts <transcript-file> [output-json] [model]
```

**Ejemplo:**
```bash
# Usando modelo por defecto (gpt-4o-mini)
ts-node .dendrita/integrations/scripts/analyze-transcript.ts transcript.txt analysis.json

# Usando modelo más robusto (gpt-4-turbo)
ts-node .dendrita/integrations/scripts/analyze-transcript.ts transcript.txt analysis.json gpt-4-turbo
```

**Salida:**
Genera un JSON con:
- Información de la reunión (fecha, participantes, resumen)
- Temas discutidos
- Decisiones tomadas
- Tareas asignadas
- Clientes/proyectos mencionados
- Próximos pasos
- Insights clave

### 2. `integrate-transcript-analysis.ts`
Determina cómo integrar el análisis en el documento destino (meeting notes).

**Uso:**
```bash
ts-node .dendrita/integrations/scripts/integrate-transcript-analysis.ts <analysis-json> <target-document> [output-json] [model]
```

**Ejemplo:**
```bash
ts-node .dendrita/integrations/scripts/integrate-transcript-analysis.ts analysis.json meeting-notes.md recommendation.json
```

**Salida:**
Genera una recomendación de integración con:
- Estrategia (append, merge, replace, create_new)
- Secciones a actualizar
- Nuevas secciones sugeridas
- Conflictos detectados y recomendaciones

### 3. `enrich-meeting-notes.ts` (Wrapper)
Ejecuta el pipeline completo: análisis + integración.

**Uso:**
```bash
ts-node .dendrita/integrations/scripts/enrich-meeting-notes.ts <transcript-file> <meeting-notes-file> [options]
```

**Opciones:**
- `--model <model>`: Modelo de OpenAI (default: gpt-4o-mini)
- `--auto-apply`: Aplicar integración automáticamente (próximamente)
- `--output-dir <dir>`: Directorio para archivos de salida

**Ejemplo:**
```bash
ts-node .dendrita/integrations/scripts/enrich-meeting-notes.ts transcript.txt meeting-notes.md --model gpt-4-turbo
```

## Modelos Recomendados

### Costo-Consciente (Recomendado)
- **gpt-4o-mini**: Más económico, buena calidad para análisis estructurado
- **gpt-3.5-turbo**: Más económico aún, calidad suficiente para análisis simples

### Mayor Calidad
- **gpt-4-turbo**: Mejor calidad, mayor costo
- **gpt-4**: Máxima calidad, mayor costo

**Recomendación:** Usar `gpt-4o-mini` por defecto. Si necesitas mayor precisión o el análisis es complejo, usar `gpt-4-turbo`.

## Estructura de Archivos

```
.dendrita/integrations/
├── scripts/
│   ├── analyze-transcript.ts              # Script 1: Análisis
│   ├── integrate-transcript-analysis.ts   # Script 2: Integración
│   ├── enrich-meeting-notes.ts           # Wrapper: Pipeline completo
│   └── README-TRANSCRIPT-ANALYSIS.md     # Este archivo
└── services/
    └── openai/
        └── chat.ts                        # Servicio de OpenAI
```

## Flujo de Trabajo

1. **Obtener transcripción** (desde JSON de transcripciones o archivo)
2. **Analizar transcripción** → `transcript-analysis.json`
3. **Determinar integración** → `integration-recommendation.json`
4. **Revisar recomendación** y aplicar cambios manualmente
5. **Actualizar meeting notes** con la información estructurada

## Ejemplo Completo

```bash
# 1. Extraer transcripción del JSON
# (usar extract-transcripts-from-drive.ts o manualmente)

# 2. Analizar transcripción
ts-node .dendrita/integrations/scripts/analyze-transcript.ts \
  transcript.txt \
  transcript-analysis.json \
  gpt-4o-mini

# 3. Determinar integración
ts-node .dendrita/integrations/scripts/integrate-transcript-analysis.ts \
  transcript-analysis.json \
  meeting-notes.md \
  integration-recommendation.json \
  gpt-4o-mini

# 4. O usar el wrapper (hace ambos pasos)
ts-node .dendrita/integrations/scripts/enrich-meeting-notes.ts \
  transcript.txt \
  meeting-notes.md \
  --model gpt-4o-mini
```

## Requisitos

- OpenAI API key configurada en `.dendrita/.env.local`:
  ```
  OPENAI_API_KEY=sk-...
  ```

- Node.js y TypeScript instalados
- Dependencias del proyecto instaladas

## Notas

- Los scripts usan `response_format: { type: 'json_object' }` para garantizar JSON válido
- La temperatura está configurada en 0.3 para respuestas más consistentes
- Los modelos más robustos pueden manejar mejor transcripciones largas o complejas
- El costo varía según el modelo y la longitud de la transcripción

## Próximos Pasos

- [ ] Implementar aplicación automática de integración
- [ ] Agregar validación de esquema JSON
- [ ] Soporte para múltiples formatos de transcripción
- [ ] Integración directa con Supabase para transcripciones


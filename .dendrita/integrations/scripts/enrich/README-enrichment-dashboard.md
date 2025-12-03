# Dashboard de Análisis de Enriquecimiento de Documentos

Dashboard interactivo para visualizar estadísticas y análisis del proceso de enriquecimiento de documentos con relaciones semánticas y backlinks.

## 🚀 Características

- **Visualización interactiva** con gráficos dinámicos (Chart.js)
- **Controles configurables** para variar parámetros de visualización
- **Estadísticas en tiempo real** del procesamiento
- **Múltiples tipos de gráficos** (barras, líneas, circular)
- **Filtros personalizables** (límite de resultados, valor mínimo)

## 📊 Métricas Mostradas

- Documentos totales, procesados y saltados
- Backlinks agregados
- Relaciones semánticas detectadas
- Uso de tokens de OpenAI
- Costo estimado
- Llamadas a la API
- Embeddings creados
- Top documentos por backlinks, relaciones y tokens

## 🛠️ Instalación

### Local

1. Procesar el log para generar estadísticas:
```bash
npx ts-node .dendrita/integrations/scripts/enrich/process-enrichment-log.ts /tmp/enrichment-relationships.log
```

2. Iniciar el servidor:
```bash
npx ts-node .dendrita/integrations/scripts/enrich/enrichment-dashboard-server.ts
```

3. Acceder al dashboard:
```
http://localhost:18434
```

### Servidor Remoto

1. Ejecutar el script de setup:
```bash
sudo bash .dendrita/integrations/scripts/enrich/setup-enrichment-dashboard.sh
```

2. Iniciar el servicio:
```bash
sudo systemctl start dendrita-enrichment-dashboard
```

3. Verificar estado:
```bash
sudo systemctl status dendrita-enrichment-dashboard
```

4. Acceder al dashboard:
```
http://34.171.12.47:18434
```

## 🔧 Configuración

### Variables de Entorno

- `ENRICHMENT_DASHBOARD_PORT`: Puerto del servidor (default: 18434)
- `DENDRITA_REPO_ROOT`: Ruta raíz del repositorio (default: process.cwd())

### Archivos

- **Log de procesamiento**: `/tmp/enrichment-relationships.log`
- **Estadísticas generadas**: `.dendrita/dashboards/enrichment-stats.json`
- **Logs del servidor**: `.dendrita/logs/enrichment-dashboard.log`

## 📡 API Endpoints

### GET `/api/stats`

Obtiene las estadísticas de enriquecimiento.

**Parámetros de consulta:**
- `limit`: Límite de resultados para top documentos (default: 20)
- `minValue`: Valor mínimo para filtrar documentos (default: 0)

**Ejemplo:**
```bash
curl "http://localhost:18434/api/stats?limit=10&minValue=5"
```

### POST `/api/refresh`

Fuerza el refresco de estadísticas desde el log.

**Ejemplo:**
```bash
curl -X POST "http://localhost:18434/api/refresh"
```

## 🎨 Controles del Dashboard

- **Límite de resultados**: Controla cuántos documentos mostrar en los top charts (5-50)
- **Valor mínimo**: Filtra documentos por valor mínimo (backlinks, relaciones, tokens)
- **Tipo de gráfico**: Cambia entre barras, líneas y circular
- **Actualizar**: Recarga los datos desde la API
- **Refrescar Estadísticas**: Reprocesa el log y regenera las estadísticas

## 📈 Gráficos Disponibles

1. **Top Documentos por Backlinks**: Muestra los documentos con más backlinks agregados
2. **Top Documentos por Relaciones**: Muestra los documentos con más relaciones detectadas
3. **Top Documentos por Uso de Tokens**: Muestra los documentos que consumieron más tokens
4. **Distribución de Documentos**: Gráfico circular mostrando procesados vs saltados
5. **Uso de Tokens**: Gráfico de dona mostrando prompt vs completion tokens
6. **Llamadas a la API**: Gráfico de barras mostrando diferentes tipos de llamadas

## 🔄 Actualización de Datos

El dashboard se actualiza automáticamente cuando:
- Se cambian los controles (límite, valor mínimo, tipo de gráfico)
- Se hace clic en "Actualizar"
- Se refrescan las estadísticas desde el log

## 📝 Notas

- El dashboard procesa el log automáticamente si no existe el archivo de estadísticas
- Las estadísticas se refrescan automáticamente si el log es más reciente
- El servidor se reinicia automáticamente en caso de error (systemd)

## 🐛 Troubleshooting

### El dashboard no carga datos

1. Verificar que el log existe: `/tmp/enrichment-relationships.log`
2. Procesar el log manualmente:
```bash
npx ts-node .dendrita/integrations/scripts/enrich/process-enrichment-log.ts /tmp/enrichment-relationships.log
```

### El servidor no inicia

1. Verificar logs:
```bash
tail -f .dendrita/logs/enrichment-dashboard.log
```

2. Verificar que el puerto no esté en uso:
```bash
lsof -i :18434
```

### Los gráficos no se muestran

1. Verificar la consola del navegador para errores
2. Verificar que Chart.js se carga correctamente
3. Verificar la conexión a la API


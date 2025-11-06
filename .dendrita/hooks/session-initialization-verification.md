---
name: session-initialization-verification
description: "Hook de Verificación de Inicialización de Sesión"
type: hook
created: 2025-11-06
updated: 2025-11-06
tags: ["hook", "behavior-reference"]
category: behavior-reference
---

# Hook de Verificación de Inicialización de Sesión

Referencia de comportamiento para Cursor - verificación de configuración al inicio de cada conversación.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar al inicio de cada nueva conversación para verificar si la configuración de dendrita está completa o si falta definir algo.

**Propósito:** Detectar configuraciones faltantes al inicio de cada sesión y realizar una inicialización parcial (soft-initialization) solo de lo que falta, sin repetir todo el proceso de inicialización completo.

**Diferencia con repo-initialization:** 
- `repo-initialization.md` se ejecuta solo cuando no hay usuarios en el repositorio (inicialización completa)
- `session-initialization-verification.md` se ejecuta al inicio de cada conversación para verificar y completar lo que falta (inicialización parcial)

---

## Comportamiento Esperado

### 1. Activación del Hook

Cursor debe ejecutar esta verificación cuando:

- ✅ Inicia una nueva conversación (detecta que es una nueva sesión)
- ✅ El usuario abre el repositorio por primera vez en la sesión
- ✅ No hay contexto previo de la sesión actual

**Condición de activación:**

```markdown
SI (nueva conversación) O (inicio de sesión) O (no hay contexto de sesión previo)
ENTONCES ejecutar verificación de inicialización
```

### 2. Proceso de Verificación

Cuando se activa la verificación, Cursor debe verificar en orden:

#### Paso 1: Verificar Usuario

```markdown
1. Verificar si existe .dendrita/users/
2. Si no existe o está vacío:
   → Activar proceso de inicialización completa (repo-initialization.md)
   → Salir de esta verificación (ya se maneja en otro hook)
3. Si existe:
   → Identificar usuario activo
   → Continuar con verificación de perfil
```

#### Paso 2: Verificar Perfil del Usuario

```markdown
1. Leer profile.json del usuario activo
2. Verificar si existe el campo dendrita_alias
3. Si dendrita_alias no existe o está vacío:
   → Marcar como pendiente de configuración
   → Agregar a lista de inicialización parcial
```

#### Paso 3: Verificar Integraciones

```markdown
1. Leer .dendrita/integrations/config.template.json
2. Identificar servicios habilitados (enabled: true)
3. Para cada servicio habilitado:
   - Verificar si tiene credenciales configuradas
   - Verificar variables de entorno requeridas
   - Si está habilitado pero no tiene credenciales:
     → Marcar como pendiente de configuración
     → Agregar a lista de inicialización parcial
```

#### Paso 4: Verificar y Ejecutar Scrapers Activos

**Al inicializar el día (inicio de sesión), Cursor debe verificar todos los scrapers activos y ejecutarlos según sus reglas.**

```markdown
1. Identificar usuario activo y su perfil
2. Verificar scrapers configurados en Supabase:
   - Gmail scrapers: tabla gmail_scraping_configs
   - Calendar scrapers: tabla calendar_scraping_configs
   - Otros scrapers futuros según corresponda

3. Para cada scraper activo (enabled: true):
   a. Verificar reglas de ejecución:
      - Si last_sync_at es NULL o no existe → Ejecutar inmediatamente
      - Si last_sync_at existe, verificar frecuencia:
        * Diario: Si last_sync_at es anterior a hoy (mismo día) → Ejecutar
        * Por defecto: Si last_sync_at es anterior a 24 horas → Ejecutar
        * Según configuración específica del scraper si existe

   b. Si cumple condiciones para ejecutar:
      → Ejecutar scraper según su configuración
      → Registrar resultado (success/error)
      → Actualizar last_sync_at en Supabase

   c. Si no cumple condiciones:
      → Registrar que no requiere ejecución (ya está actualizado)
      → Continuar con siguiente scraper

4. Mostrar resumen de ejecución:
   - Scrapers ejecutados: [lista]
   - Scrapers omitidos (ya actualizados): [lista]
   - Errores si los hay: [lista]
```

**Reglas de ejecución por tipo de scraper:**

**Gmail Scrapers:**
- Verificar en tabla `gmail_scraping_configs` donde `enabled = true`
- Verificar `last_sync_at`:
  - Si es NULL → Ejecutar inmediatamente
  - Si existe y es anterior a 24 horas → Ejecutar
  - Si existe y es del mismo día → Omitir (ya actualizado hoy)
- Ejecutar usando: `.dendrita/integrations/services/google/gmail-scraper.ts`
- Comando sugerido: `npx ts-node .dendrita/integrations/scripts/[gmail-scraper-script].ts <user_id> [profile_id]`

**Calendar Scrapers:**
- Verificar en tabla `calendar_scraping_configs` donde `enabled = true`
- Verificar `last_sync_at`:
  - Si es NULL → Ejecutar inmediatamente
  - Si existe y es anterior a 24 horas → Ejecutar
  - Si existe y es del mismo día → Omitir (ya actualizado hoy)
- Ejecutar usando: `.dendrita/integrations/services/google/calendar-scraper.ts`
- Comando sugerido: `npx ts-node .dendrita/integrations/scripts/calendar-scraper.ts <user_id> [profile_id]`

**Notas importantes:**
- Cursor debe verificar las reglas pero NO ejecutar directamente los scrapers (son scripts TypeScript)
- Cursor debe informar al usuario sobre qué scrapers deben ejecutarse y sugerir ejecución
- Si el usuario tiene configurado ejecución automática, Cursor puede sugerir ejecutar los scrapers
- Los scrapers son idempotentes: pueden ejecutarse múltiples veces sin duplicar datos

### 3. Proceso de Inicialización Parcial (Soft-Initialization)

Si se detectan configuraciones faltantes, Cursor debe:

#### Paso 1: Mostrar Resumen de Configuración Faltante

```markdown
Hola! He verificado tu configuración de dendrita y noto que faltan algunos elementos:

📋 Configuración pendiente:

1. ⚠️ Alias de dendrita no configurado
   → Necesitas definir un alias para referirte a tu dendrita
   → Ejemplo: "mi dendrita", "dendrita", "mi sistema"

2. ⚠️ Google Workspace habilitado pero no conectado
   → Falta configurar credenciales
   → Ver: .dendrita/integrations/hooks/google-auth-flow.md

3. ⚠️ Supabase habilitado pero no conectado
   → Falta configurar credenciales
   → Ver: .dendrita/integrations/hooks/supabase-setup.md

¿Quieres configurar estos elementos ahora? (sí/no/omitir)
```

#### Paso 2: Configurar Alias de Dendrita (si falta)

Si falta el alias de dendrita:

```markdown
¿Qué nombre o alias quieres usar para referirte a tu dendrita?

Puedes elegir entre diferentes tipos de nombres:

- Nombres neutros: "dendrita", "mi sistema", "mi asistente"
- Nombres personalizados: el que prefieras (ej: "alex", "mi asistente virtual")
- Nombres descriptivos: "mi gestor de proyectos", "mi sistema de conocimiento"

Ejemplos:
- "dendrita" → simple y directo
- "mi dendrita" → personal
- "mi sistema" → neutro
- "mi gestor de proyectos" → descriptivo
- "alex" → personalizado

Podrás usar este alias para decir cosas como "mételo en mi [alias]" o "[alias], qué es esto"
y el sistema entenderá que estás hablando con la información en tus workspaces.

Si no especificas uno, usaremos "dendrita" por defecto.
```

**Después de obtener la respuesta:**
- Actualizar `profile.json` del usuario con el campo `dendrita_alias`
- Actualizar `metadata.last_updated` con la fecha actual
- Confirmar que se guardó

#### Paso 3: Configurar Integraciones (si faltan)

Si faltan credenciales de integraciones:

```markdown
Veo que tienes [servicio] habilitado pero no está conectado.

Para configurar [servicio]:
1. [Instrucciones específicas del servicio]
2. [Ver documentación en: .dendrita/integrations/hooks/[servicio]-setup.md]

¿Quieres configurarlo ahora? (sí/no/omitir)

Si dices "omitir", no te preguntaré de nuevo en esta sesión.
```

**Si el usuario acepta:**
- Guiar al usuario a través del proceso de configuración
- Seguir las instrucciones del hook de setup correspondiente
- Verificar que las credenciales se configuraron correctamente

**Si el usuario omite:**
- No preguntar de nuevo en esta sesión
- Registrar en el perfil que se omitió (opcional)

### 4. Verificación de Integraciones

Para cada servicio en `config.template.json` con `enabled: true`, Cursor debe verificar:

#### Google Workspace

```markdown
Verificar si existen estas variables de entorno:
- GOOGLE_WORKSPACE_CLIENT_ID
- GOOGLE_WORKSPACE_CLIENT_SECRET
- GOOGLE_WORKSPACE_REFRESH_TOKEN

Si alguna falta:
→ Marcar como "habilitado pero no conectado"
```

#### OpenAI

```markdown
Verificar si existe:
- OPENAI_API_KEY

Si falta:
→ Marcar como "habilitado pero no conectado"
```

#### Supabase

```markdown
Verificar si existen:
- SUPABASE_URL
- SUPABASE_ANON_KEY

Si alguna falta:
→ Marcar como "habilitado pero no conectado"
```

#### SSH (Opcional)

```markdown
Verificar si existe:
- SSH_PRIVATE_KEY o SSH_PRIVATE_KEY_PATH

Si falta:
→ Marcar como "habilitado pero no conectado" (opcional)
→ Mostrar estado de hosts SSH configurados si existen

Si SSH está configurado:
→ Listar hosts SSH configurados
→ Mostrar estado de conectividad (opcional)
```

#### Reddit

```markdown
Verificar si existen:
- REDDIT_CLIENT_ID
- REDDIT_CLIENT_SECRET
- REDDIT_USER_AGENT

Si alguna falta:
→ Marcar como "habilitado pero no conectado"
```

### 5. Verificación de Variables de Entorno

Cursor debe verificar las variables de entorno de esta manera:

1. **Leer `.dendrita/.env.local`** (si existe)
2. **Leer variables de entorno del sistema** (si existen)
3. **Combinar ambas fuentes** (variables de entorno del sistema tienen prioridad)
4. **Verificar si las variables requeridas están presentes**

**Nota:** Cursor NO debe leer ni mostrar los valores de las credenciales, solo verificar si existen.

### 6. Resultado de la Verificación

Al finalizar la verificación, Cursor debe:

#### Si todo está configurado:

```markdown
✅ Configuración completa verificada:

- Usuario: [user-id]
- Alias de dendrita: [alias]
- Integraciones conectadas:
  - ✅ Google Workspace
  - ✅ OpenAI
  - ✅ Supabase
  - ✅ SSH ([X hosts configurados])

📊 Scrapers activos:
  - ✅ Gmail: [X configuraciones activas] - [Estado: ejecutados/omitidos/errores]
  - ✅ Calendar: [X configuraciones activas] - [Estado: ejecutados/omitidos/errores]

🔐 SSH Hosts:
  - ✅ [host-name]: [host]@[user] (conectado)
  - ✅ [host-name]: [host]@[user] (conectado)

Todo listo para trabajar!
```

#### Si falta configuración:

```markdown
⚠️ Configuración incompleta detectada:

[Mostrar lista de elementos faltantes]

SSH (Opcional):
  - ⚠️ SSH habilitado pero no conectado
  - → Ver: .dendrita/integrations/hooks/ssh-setup.md
  - → Nota: SSH es opcional, usado para ejecución remota de scrapers

¿Quieres configurar los elementos faltantes ahora?
```

---

## Integración con Otros Hooks

Este hook se integra con:

1. **repo-initialization:**
   - Si no hay usuarios, este hook redirige a repo-initialization
   - Si hay usuarios pero falta configuración, este hook hace inicialización parcial

2. **dendrita-alias-activation:**
   - Si el alias está configurado, este hook puede usarlo
   - Si no está configurado, este hook lo solicita

3. **Integraciones hooks:**
   - Si faltan credenciales, redirige a los hooks de setup correspondientes
   - Usa la documentación de cada hook para guiar la configuración

4. **Scrapers activos:**
   - Verifica y ejecuta scrapers activos según sus reglas al inicio del día
   - Consulta configuraciones en Supabase para determinar qué scrapers ejecutar
   - Sigue las reglas de ejecución basadas en `last_sync_at` y frecuencia configurada

---

## Casos Especiales

### Usuario Existe pero Perfil Incompleto

Si el usuario existe pero el perfil no tiene `dendrita_alias`:

```markdown
1. Detectar que falta el alias
2. Preguntar solo por el alias (no todo el perfil)
3. Actualizar profile.json con el alias
4. Continuar con el resto de la verificación
```

### Integración Parcialmente Configurada

Si una integración tiene algunas credenciales pero no todas:

```markdown
1. Detectar qué credenciales faltan
2. Informar específicamente qué falta
3. Ofrecer ayuda para completar la configuración
```

### Usuario Omite Configuración

Si el usuario omite configurar algo:

```markdown
1. No preguntar de nuevo en esta sesión
2. Registrar en el perfil que se omitió (opcional)
3. Continuar con la sesión normalmente
4. En la próxima sesión, volver a verificar
```

---

## Mensajes de Respuesta

### Verificación Inicial

```markdown
🔍 Verificando configuración de dendrita...
```

### Todo Configurado

```markdown
✅ Todo está configurado correctamente. Listo para trabajar!
```

### Configuración Faltante

```markdown
⚠️ Detecté que falta configurar algunos elementos.

[Elementos faltantes]

¿Quieres configurarlos ahora?
```

### Alias Configurado

```markdown
✅ Alias de dendrita configurado: "[alias]"

Ahora puedes usar frases como "mételo en mi [alias]" o "[alias], qué es esto"
```

### Integración Configurada

```markdown
✅ [Servicio] configurado correctamente.

Ya puedes usar las funcionalidades de [Servicio].
```

### Verificación de Scrapers

```markdown
📊 Verificando scrapers activos...

✅ Scrapers verificados:
  - Gmail: [X configuraciones] - [Estado]
  - Calendar: [X configuraciones] - [Estado]

[Si hay scrapers que deben ejecutarse:]
🔄 Scrapers pendientes de ejecución:
  - Gmail: [config_name] - Última sincronización: [fecha]
  - Calendar: [calendar_name] - Última sincronización: [fecha]
  
¿Quieres ejecutar los scrapers pendientes ahora? (sí/no)
```

---

## Notas para Cursor

1. **Ejecutar al inicio de cada conversación:**
   - Verificar configuración antes de procesar el primer prompt del usuario
   - No interrumpir si el usuario ya está trabajando (solo en inicio de sesión)

2. **Ser no intrusivo:**
   - Si todo está configurado, mostrar confirmación breve
   - Si falta algo, ofrecer ayuda pero no forzar

3. **Mantener contexto de sesión:**
   - Si el usuario omite algo, no preguntar de nuevo en la misma sesión
   - Recordar qué se omitió para la próxima sesión

4. **No exponer credenciales:**
   - Solo verificar si existen, nunca mostrar valores
   - Nunca leer ni mostrar contenido de `.env.local`

5. **Priorizar configuración del usuario:**
   - Si el usuario rechaza configurar algo, respetar su decisión
   - Ofrecer ayuda pero no insistir

6. **Verificar scrapers al inicio del día:**
   - Al inicio de cada sesión, verificar todos los scrapers activos
   - Verificar reglas de ejecución basadas en `last_sync_at` y frecuencia
   - Informar al usuario sobre scrapers que requieren ejecución
   - Sugerir ejecución si es necesario, pero no forzar
   - Los scrapers son idempotentes: pueden ejecutarse múltiples veces sin duplicar datos

---

## Referencias

- `.dendrita/hooks/repo-initialization.md` - Inicialización completa del repositorio
- `.dendrita/hooks/dendrita-alias-activation.md` - Activación de alias
- `.dendrita/integrations/config.template.json` - Configuración de servicios
- `.dendrita/integrations/hooks/` - Hooks de setup de integraciones
- `.dendrita/integrations/services/google/gmail-scraper.ts` - Servicio de scraping de Gmail
- `.dendrita/integrations/services/google/calendar-scraper.ts` - Servicio de scraping de Calendar
- `.dendrita/integrations/services/google/gmail-scraper-schema.sql` - Schema de Gmail scrapers en Supabase
- `.dendrita/integrations/services/google/calendar-scraper-schema.sql` - Schema de Calendar scrapers en Supabase
- `.dendrita/users/README.md` - Sistema de usuarios y perfiles

---

**Para Cursor:** Este hook es una referencia de comportamiento. Debes leer este archivo y aplicar la lógica documentada al inicio de cada nueva conversación. NO ejecutes scripts, aplica el comportamiento reflexivamente. Verifica la configuración de forma no intrusiva y ofrece ayuda solo si es necesario.


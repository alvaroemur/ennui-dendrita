# Hook de Activación de Alias de Dendrita

Referencia de comportamiento para Cursor - activación de contexto de workspaces mediante alias de dendrita.

---

## ¿Qué es este Hook?

Este hook documenta el comportamiento esperado que Cursor debe aplicar cuando detecta que el usuario menciona el alias de dendrita en sus prompts.

**Propósito:** Permitir que el usuario pueda referirse a su sistema dendrita con un alias personalizado (como "mételo en mi X" o "X, qué es esto") y que el chat entienda que está hablando con la información en sus workspaces.

**Diferencia con otros hooks:** Este hook se enfoca en la activación del contexto de workspaces mediante el alias, no en la edición de configuración de dendrita (que es manejado por `dendrita-infrastructure-modification.md`).

---

## Comportamiento Esperado

### 1. Detección de Menciones del Alias

Cursor debe detectar menciones del alias cuando:

- ✅ El usuario menciona el alias de dendrita en el prompt
- ✅ El usuario usa frases como "mételo en mi [alias]" o "[alias], qué es esto"
- ✅ El usuario se refiere al alias directamente seguido de una pregunta o instrucción
- ✅ El prompt contiene patrones que indican que el usuario está hablando "con" su dendrita

**Condición de activación:**

```markdown
SI (prompt contiene alias de dendrita) O (patrón de "mételo en mi [alias]" o "[alias], ...")
ENTONCES activar contexto de workspaces y dendrita
```

### 2. Obtención del Alias

El alias de dendrita se obtiene del perfil del usuario:

1. **Leer el perfil activo del usuario:**
   - Si hay un workspace activo: usar perfil de workspace (`workspace-[workspace].json`)
   - Si no hay workspace activo: usar perfil por defecto (`profile.json`)

2. **Buscar el campo `dendrita_alias`:**
   - Si existe: usar ese alias
   - Si no existe: usar "dendrita" como alias por defecto

3. **Validar el alias:**
   - El alias puede ser cualquier tipo de nombre:
     - **Nombres neutros**: "dendrita", "mi sistema", "mi asistente"
     - **Nombres personalizados**: cualquier nombre que el usuario prefiera (ej: "alex", "mi asistente virtual")
     - **Nombres descriptivos**: "mi gestor de proyectos", "mi sistema de conocimiento"
   - El alias debe ser una frase coherente (puede tener múltiples palabras)
   - No debe contener caracteres especiales que confundan la detección
   - Se recomienda usar un alias que sea fácil de recordar y mencionar

### 3. Proceso de Activación del Contexto

Cuando se detecta una mención del alias, Cursor debe:

#### Paso 1: Identificar el Alias Mencionado

```markdown
1. Leer el perfil del usuario activo
2. Extraer el alias de dendrita (campo dendrita_alias)
3. Buscar menciones del alias en el prompt del usuario
4. Validar que la mención es intencional (no casual)
```

#### Paso 2: Activar Contexto de Workspaces

Cuando se detecta el alias, Cursor debe activar el contexto completo de dendrita:

1. **Leer información de workspaces:**
   - Listar todos los workspaces disponibles en `workspaces/`
   - Identificar el workspace principal del usuario (del perfil)
   - Cargar estructura de proyectos activos

2. **Cargar contexto relevante:**
   - Leer `current-context.md` de proyectos activos si el contexto es específico
   - Leer `tasks.md` si se pregunta sobre tareas
   - Leer `master-plan.md` si se pregunta sobre estrategia

3. **Aplicar contexto de dendrita:**
   - Activar conocimiento de skills disponibles
   - Activar conocimiento de agents disponibles
   - Activar conocimiento de best-practices del workspace activo

#### Paso 3: Responder con Contexto de Workspaces

Cursor debe responder como si fuera el sistema dendrita del usuario:

1. **Usar el contexto de workspaces:**
   - Cuando el usuario dice "mételo en mi [alias]", entender que quiere guardar/registrar algo en su dendrita
   - Cuando el usuario dice "[alias], qué es esto", entender que pregunta sobre información en sus workspaces

2. **Aplicar conocimiento de dendrita:**
   - Usar información de proyectos activos
   - Usar información de best-practices
   - Usar información de stakeholders/aliados
   - Usar información de productos y herramientas

3. **Responder de manera contextual:**
   - Las respuestas deben reflejar el conocimiento de los workspaces del usuario
   - Las respuestas deben ser específicas a su contexto, no genéricas
   - Las respuestas deben considerar el workspace activo y proyectos relevantes

### 4. Patrones de Detección

Cursor debe reconocer estos patrones como menciones del alias:

#### Patrón 1: Instrucción de Guardado
```
"mételo en mi [alias]"
"guárdalo en [alias]"
"agrégalo a [alias]"
"registra esto en [alias]"
```

**Comportamiento esperado:**
- Entender que el usuario quiere guardar información en dendrita
- Identificar qué información guardar
- Determinar dónde guardarla (proyecto, workspace, best-practice, etc.)
- Guardar la información en el lugar apropiado

#### Patrón 2: Pregunta Directa
```
"[alias], qué es esto"
"[alias], explica esto"
"[alias], dame información sobre"
"[alias], busca en"
```

**Comportamiento esperado:**
- Entender que el usuario pregunta sobre información en sus workspaces
- Buscar información relevante en los workspaces
- Responder con contexto específico de sus proyectos/workspaces
- Si no encuentra información, indicarlo claramente

#### Patrón 3: Referencia Contextual
```
"según [alias]"
"como dice [alias]"
"[alias] me dice que"
"en [alias] tengo"
```

**Comportamiento esperado:**
- Entender que el usuario está haciendo referencia al contexto de dendrita
- Activar contexto de workspaces para la respuesta
- Usar información de dendrita para responder

---

## Integración con Perfil de Usuario

### Campo dendrita_alias

El alias debe estar guardado en el perfil del usuario:

**En `profile.json` o `workspace-[workspace].json`:**

```json
{
  "dendrita_alias": "mi dendrita",
  "dendrita_settings": {
    "default_context": "workspace",
    "auto_activate": true
  }
}
```

**Ejemplos de alias por tipo:**

- **Nombres neutros**: "dendrita", "mi sistema", "mi asistente"
- **Nombres personalizados**: "alex", "mi asistente virtual", "ennui"
- **Nombres descriptivos**: "mi gestor de proyectos", "mi sistema de conocimiento"

### Validación del Alias

El alias debe cumplir:
- ✅ Puede ser cualquier tipo de nombre (neutro, personalizado, o descriptivo)
- ✅ Puede tener múltiples palabras (recomendado 1-4 palabras)
- ✅ No contener caracteres especiales confusos
- ✅ Ser fácil de recordar y mencionar
- ✅ Ser único en el contexto del usuario

---

## Ejemplos de Uso

### Ejemplo 1: Guardar Información

**Usuario:** "Mételo en mi dendrita"

**Comportamiento esperado:**
1. Detectar que "dendrita" es el alias
2. Identificar qué información guardar (del contexto de la conversación)
3. Determinar dónde guardarla (proyecto activo, workspace, best-practice)
4. Guardar la información en el lugar apropiado
5. Confirmar que se guardó

### Ejemplo 2: Preguntar sobre Información

**Usuario:** "mi dendrita, qué proyectos tengo activos?"

**Comportamiento esperado:**
1. Detectar que "mi dendrita" es el alias
2. Activar contexto de workspaces
3. Leer información de proyectos activos
4. Responder con lista de proyectos activos del usuario
5. Incluir información relevante de cada proyecto

### Ejemplo 3: Referencia Contextual

**Usuario:** "Según mi dendrita, qué best-practices tengo para proyectos de sostenibilidad?"

**Comportamiento esperado:**
1. Detectar que "mi dendrita" es el alias
2. Activar contexto de workspaces
3. Buscar best-practices de sostenibilidad en los workspaces
4. Responder con información específica de las best-practices del usuario

---

## Casos Especiales

### Alias No Configurado

Si el usuario no tiene alias configurado:

1. **Usar "dendrita" como alias por defecto**
2. **Sugerir configurar un alias personalizado:**
   ```markdown
   Noto que no tienes un alias configurado para dendrita.
   ¿Te gustaría configurar uno? Puedes elegir entre diferentes tipos de nombres:
   
   - Nombres neutros: "dendrita", "mi sistema", "mi asistente"
   - Nombres personalizados: el que prefieras (ej: "alex", "mi asistente virtual")
   - Nombres descriptivos: "mi gestor de proyectos", "mi sistema de conocimiento"
   ```

### Alias Mencionado Casualmente

Si el alias aparece en el prompt pero no parece ser intencional:

1. **No activar contexto completo**
2. **Responder normalmente**
3. **Solo activar si hay indicadores claros** (como "mételo en", preguntas directas, etc.)

### Múltiples Workspaces

Si el usuario tiene múltiples workspaces:

1. **Usar el workspace activo o principal**
2. **Si el contexto es ambiguo, preguntar en qué workspace**
3. **Ofrecer información de todos los workspaces si es relevante**

---

## Integración con Otros Hooks

Este hook se integra con:

1. **skill-activation-prompt:**
   - Cuando se activa el contexto de dendrita, también considerar skills relevantes
   - Las skills pueden ayudar a entender mejor qué hacer con la información

2. **post-tool-use-tracker:**
   - Cuando se guarda información en dendrita, registrar el contexto
   - Mantener registro de dónde se guardó la información

3. **repo-initialization:**
   - Durante la inicialización, preguntar por el alias de dendrita
   - Guardar el alias en el perfil del usuario

---

## Mensajes de Respuesta

### Alias Detectado

```markdown
✅ Entendido, estoy activando el contexto de tus workspaces.
```

### Información Guardada

```markdown
✅ Información guardada en [ubicación específica].
```

### Información No Encontrada

```markdown
⚠️ No encontré información sobre [tema] en tus workspaces.
¿Quieres que busque en otro lugar o crear esta información?
```

### Alias No Configurado

```markdown
💡 Noto que no tienes un alias configurado para dendrita.
¿Te gustaría configurar uno? Puedo ayudarte a hacerlo.
```

---

## Notas para Cursor

1. **Siempre verificar el alias del usuario:**
   - Leer el perfil activo antes de buscar menciones
   - Usar el alias correcto del perfil del usuario

2. **Ser inteligente con la detección:**
   - No activar contexto si el alias aparece casualmente
   - Buscar indicadores claros de intención (verbos de acción, preguntas directas)

3. **Activar contexto completo:**
   - Cuando se detecta el alias, cargar información relevante de workspaces
   - No limitarse a información genérica

4. **Mantener el contexto activo:**
   - Una vez activado el contexto, mantenerlo durante la conversación
   - Si el usuario cambia de tema, seguir considerando el contexto de dendrita

---

## Referencias

- `.dendrita/users/README.md` - Sistema de usuarios y perfiles
- `.dendrita/hooks/repo-initialization.md` - Inicialización (incluye configuración de alias)
- `.dendrita/settings.json` - Configuración general del sistema

---

**Para Cursor:** Este hook es una referencia de comportamiento. Debes leer este archivo y aplicar la lógica documentada cuando detectes menciones del alias de dendrita en los prompts del usuario. NO ejecutes scripts, aplica el comportamiento reflexivamente.


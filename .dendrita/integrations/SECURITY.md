# 🔐 Seguridad en Integraciones de Dendrita

Políticas y mejores prácticas para mantener tus credenciales seguras.

---

## 🎯 Principios Fundamentales

```
1. ❌ NUNCA expongas credenciales en el código
2. ❌ NUNCA comitees archivos con credenciales
3. ✅ SIEMPRE usa variables de entorno o .env.local
4. ✅ SIEMPRE rotea credenciales regularmente
5. ✅ SIEMPRE revisa logs sin información sensible
```

---

## 🛡️ Capas de Protección

### Capa 1: Separación Física

```
✅ CORRECTO - Credenciales fuera del repo

ennui-dendrita/
├── .dendrita/
│   ├── integrations/
│   │   ├── services/          ← Sin credenciales
│   │   ├── utils/
│   │   │   ├── credentials.ts ← Carga, no almacena
│   │   └── .env.local         ← Gitignored
│   │       ├── OPENAI_API_KEY=sk-...
│   │       └── GOOGLE_WORKSPACE_*=...
│   └── ... otros archivos
└── .gitignore
    ├── .dendrita/.env.local
    ├── .env
    └── .env.*.local

❌ INCORRECTO - Credenciales en el código

app/
├── config.ts            ← ❌ { apiKey: 'sk-...' }
├── services/openai.ts   ← ❌ const KEY = 'sk-...'
└── constants.json       ← ❌ { "googleSecret": "..." }
```

### Capa 2: Carga Segura

```typescript
// ✅ Código seguro
import { credentials } from './utils/credentials';

try {
  const apiKey = credentials.getOpenAIKey(); // ← Retorna string
  // Usa apiKey...
} catch (error) {
  console.error('Credenciales no configuradas');
  // Nunca loguea la credencial faltante
}

// ❌ Código inseguro
const apiKey = process.env.OPENAI_API_KEY;
console.log(`Using key: ${apiKey}`); // ← EXPUESTO EN LOGS
```

### Capa 3: Logs Redactados

```typescript
// Todos los logs pasan por logger.ts que redacta automáticamente

logger.info('Conectando con token sk-12345...');
// OUTPUT: "Conectando con token [OPENAI_KEY_REDACTED]"

logger.error('Bearer sk-abc123 no es válido');
// OUTPUT: "Bearer [TOKEN_REDACTED] no es válido"

// Patrones detectados automáticamente:
// - sk-[a-zA-Z0-9]{20,}      → OpenAI keys
// - Bearer [token]            → Authorization headers
// - authorization: [token]    → Header values
```

### Capa 4: Validación de Configuración

```typescript
// Verifica SIN exponer las credenciales

credentials.hasGoogleWorkspace()  // → true/false
credentials.hasOpenAI()           // → true/false
credentials.getAvailableServices() // → ['Google Workspace', 'OpenAI']

// NUNCA:
credentials.getGoogleWorkspace().clientSecret  // ❌ Acceso directo
JSON.stringify(credentials)                      // ❌ Serializar
```

---

## 📋 Checklist de Configuración Segura

### ✅ Antes de empezar

- [ ] Clonaste el repo en tu máquina local (no en servidor compartido)
- [ ] Tu máquina tiene antivirus/malware protection
- [ ] `.gitignore` del repo tiene `.env.local` incluido
- [ ] Revisaste este archivo de seguridad

### ✅ Configurando Credenciales

- [ ] Creaste `.dendrita/.env.local` (archivo local)
- [ ] Guardaste credenciales SOLO en `.env.local`
- [ ] Verificaste que `.env.local` está en `.gitignore`
- [ ] NO ejecutaste `git add .env.local`
- [ ] NO compartiste `.env.local` por email/chat

### ✅ Después de guardar credenciales

- [ ] Ejecutaste `git status` y confirmaste `.env.local` NO aparece
- [ ] Testeaste que las credenciales se cargan correctamente
- [ ] Revisaste que NO hay credenciales en git history
- [ ] Configuraste Git para alertar si accidentalmente añades `.env`

### ✅ Mantenimiento continuo

- [ ] Roteas credenciales cada 3-6 meses
- [ ] Verificas logs no contienen información sensible
- [ ] Revisas permisos de acceso regularmente
- [ ] Documentas quién tiene acceso a `.env.local`

---

## 🚨 Situaciones de Riesgo

### Riesgo 1: Credenciales en Git History

**Síntoma**: Subiste `.env.local` accidentalmente hace un commit

**Solución**:

```bash
# 1. Verifica si está en el historio
git log --all -- '.dendrita/.env.local'

# 2. Si aparece, usa BFG (limpiador de git):
# Ver: https://rtyley.github.io/bfg-repo-cleaner/

# 3. O usa git filter-branch (más difícil)
git filter-branch --tree-filter 'rm -f .dendrita/.env.local' HEAD

# 4. Force push (cuidado: afecta a otros)
git push origin --force-with-lease

# 5. IMPORTANTE: Rota todas tus credenciales
# Google: Crea nuevo refresh token
# OpenAI: Crea nueva API key y delete la vieja
```

### Riesgo 2: Credenciales en Variables de Entorno Global

**Síntoma**: Exportaste credenciales en `.bashrc` o `.zshrc`

```bash
# ❌ INCORRECTO en .bashrc
export OPENAI_API_KEY=sk-...
export GOOGLE_CLIENT_SECRET=...

# ✅ CORRECTO - Solo en .env.local
# (que no se commitea)
```

**Solución**:

```bash
# Remueve del shell config
nano ~/.bashrc  # O ~/.zshrc
# Borra líneas con credenciales

# Cierra y abre nueva terminal para que se apliquen cambios
```

### Riesgo 3: Logs Contienen Credenciales

**Síntoma**: Hiciste `console.log()` directo con credenciales

```typescript
// ❌ INCORRECTO
console.log('Token:', token);  // → Expuesto en logs

// ✅ CORRECTO - Usar logger
logger.info('Authentificating...');  // → Redactado automáticamente
```

### Riesgo 4: Credenciales en Screenshots/Terminal

**Síntoma**: Compartes screenshot con terminal mostrando credenciales

```bash
# ❌ Evita compartir esto:
export OPENAI_API_KEY=sk-abc123...
# ↑ Visible en screenshot

# ✅ En su lugar, comparte:
# Logs redactados
# Errores sin credenciales
# Stack traces sin tokens
```

---

## 🔄 Rotación de Credenciales

### Cuándo rotar (cada 3-6 meses, o:)

- [ ] Suspecha de exposición
- [ ] Cambio de equipo/dispositivo
- [ ] Acceso perdido a empresa
- [ ] Cambio de permisos/roles

### Cómo rotar Google Workspace

```bash
# 1. Ve a Google Cloud Console
# 2. Crea NUEVO OAuth client ID (no reuses el viejo)
# 3. Obtén nuevo client_id y client_secret
# 4. Ejecuta script de autenticación nuevamente:
node .dendrita/integrations/scripts/get-refresh-token.js

# 5. Actualiza .env.local:
GOOGLE_WORKSPACE_CLIENT_ID=new_...
GOOGLE_WORKSPACE_CLIENT_SECRET=new_...
GOOGLE_WORKSPACE_REFRESH_TOKEN=new_...

# 6. Elimina el viejo OAuth client en Google Cloud Console

# 7. Verifica que sigue funcionando:
node -e "
  const g = require('./utils/credentials');
  console.log('✅ Google configurado')
"
```

### Cómo rotar OpenAI

```bash
# 1. Ve a https://platform.openai.com/api-keys
# 2. Click ⋯ junto a tu key actual
# 3. Delete la key vieja
# 4. Create new secret key
# 5. Copia el key nuevo (solo lo ves UNA vez)
# 6. Actualiza .env.local:
OPENAI_API_KEY=sk-new_key_here

# 7. Verifica que funciona:
node -e "
  const c = require('./utils/credentials');
  console.log('✅ OpenAI configurado')
"
```

---

## 🔍 Auditoría de Seguridad

### Verificar que nada está expuesto

```bash
# 1. Buscar patrones de credenciales en git
git log -p -S "sk-" --all

# 2. Buscar en files actuales
grep -r "sk-" .  --exclude-dir=.git --exclude-dir=node_modules

# 3. Buscar credenciales en git index
git ls-files --cached | xargs grep -l "sk-" || echo "✅ No found"

# 4. Revisar .gitignore está completo
cat .gitignore | grep -E "\.env|\.local|credentials" || echo "⚠️ Missing patterns"
```

### Configurar Git para prevenir commits accidentales

```bash
# Crear hook local (pre-commit)
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached | grep -E "(sk-|OPENAI_API_KEY|GOOGLE_WORKSPACE_SECRET)"; then
  echo "❌ PREVENTED: Trying to commit credentials!"
  exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

---

## 📊 Matriz de Seguridad

| Escenario | Riesgo | Protección | Acción |
|-----------|--------|-----------|--------|
| `.env.local` modificado | Modificado por usuario | File perms (700) | `chmod 600 .env.local` |
| Credenciales en logs | Expuesto si alguien ve logs | Logger redacta | Usa `createLogger()` |
| API key vieja expuesta | Puede usarla hacker | Rotar key | Delete y crear new |
| `.env.local` uncommitted pero no en .gitignore | Podría ser commiteado | .gitignore rules | `git check-ignore .env.local` |
| Credenciales en error message | Expuesto en pantalla | Error handler | Usa `handleApiError()` |

---

## ✅ Integración Segura: Paso a Paso

### 1️⃣ Setup Inicial

```bash
# Crear archivo local
touch .dendrita/.env.local

# Restringir permisos (opcional pero recomendado)
chmod 600 .dendrita/.env.local
```

### 2️⃣ Agregar Credenciales

```env
# En .dendrita/.env.local (nunca comitear)

# Google Workspace
GOOGLE_WORKSPACE_CLIENT_ID=from_google_cloud
GOOGLE_WORKSPACE_CLIENT_SECRET=from_google_cloud
GOOGLE_WORKSPACE_REFRESH_TOKEN=from_auth_script

# OpenAI
OPENAI_API_KEY=sk-from_platform_openai
```

### 3️⃣ Verificar Protección

```bash
# Confirmar .env.local NO está commiteado
git status | grep env.local || echo "✅ Protected"

# Confirmar está en .gitignore
grep ".env.local" .gitignore && echo "✅ In gitignore"
```

### 4️⃣ Usar en Código

```typescript
// ✅ Importar loader
import { credentials } from './.dendrita/integrations/utils/credentials';

// ✅ Verificar disponibilidad
if (!credentials.hasOpenAI()) throw new Error('OpenAI not configured');

// ✅ Usar con try-catch
try {
  const key = credentials.getOpenAIKey();
  // Usar key...
} catch (error) {
  logger.error('Credentials error', error);
}
```

---

## 🔗 Referencias

- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Secrets Management](https://owasp.org/www-project-top-ten/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [API Key Management Guide](https://cheatsheetseries.owasp.org/cheatsheets/API_Key_Management_Cheat_Sheet.html)

---

## 📞 ¿Preguntas?

Si tienes dudas sobre seguridad:

1. Revisa este documento
2. Lee `README.md` de integrations
3. Consulta la documentación oficial de Google y OpenAI
4. Nunca compartas credenciales para pedir ayuda

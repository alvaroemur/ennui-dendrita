---
name: index
description: "Índice de Integrations en Dendrita"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# 📚 Índice de Integrations en Dendrita

Guía de navegación para el sistema de integraciones seguro.

---

## 🚀 Empezar Rápido

**Si es tu primera vez**: Lee en este orden:

1. **[SETUP.md](./SETUP.md)** (5 min) - Setup inicial paso a paso
2. **[README.md](./README.md)** (10 min) - Visión general del sistema
3. **[SECURITY.md](./SECURITY.md)** (10 min) - Políticas de seguridad

---

## 📖 Documentación Completa

### 🔧 Setup y Configuración

| Documento | Propósito | Tiempo |
|-----------|----------|--------|
| [SETUP.md](./SETUP.md) | Guía rápida de setup | 5 min |
| [README.md](./README.md) | Visión general del sistema | 10 min |
| [../hooks/google-auth-flow.md](../hooks/google-auth-flow.md) | Setup Google Workspace OAuth | 15 min |
| [../hooks/openai-key-management.md](../hooks/openai-key-management.md) | Setup OpenAI API Key | 3 min |

### 🏗️ Arquitectura y Seguridad

| Documento | Propósito | Audiencia |
|-----------|----------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Cómo funciona el sistema | Developers |
| [SECURITY.md](./SECURITY.md) | Mejores prácticas de seguridad | Everyone |

### 💻 Código y Ejemplos

| Ubicación | Descripción |
|-----------|-------------|
| `services/` | Implementación de servicios |
| `utils/` | Utilities reutilizables |
| `examples/` | Ejemplos de uso |

---

## 🗂️ Estructura de Archivos

```
.dendrita/integrations/
├── services/                     ← Implementación de APIs
│   ├── base/
│   │   └── service.interface.ts
│   ├── google/
│   │   ├── auth.ts
│   │   ├── gmail.ts
│   │   ├── calendar.ts
│   │   └── drive.ts
│   └── openai/
│       ├── auth.ts
│       └── chat.ts

.dendrita/docs/integrations/     ← Documentación (TÚ ESTÁS AQUÍ)
├── INDEX.md                      ← Índice de documentación
├── README.md                     ← Visión general
├── SETUP.md                      ← Quick start
├── SECURITY.md                   ← Políticas de seguridad
├── ARCHITECTURE.md               ← Cómo funciona
├── SCRAPER-ARCHITECTURE.md       ← Arquitectura de scrapers
└── SCRAPER-CONFIG-DESIGN.md      ← Diseño de configuración
├── config.template.json          ← Plantilla de configuración
├── .gitignore                    ← Protege credenciales
│
├── services/                     ← Implementación de APIs
│   ├── base/
│   │   └── service.interface.ts
│   ├── google/
│   │   ├── auth.ts
│   │   ├── gmail.ts
│   │   ├── calendar.ts
│   │   └── drive.ts
│   └── openai/
│       ├── auth.ts
│       └── chat.ts
│
├── utils/                        ← Funcionalidad compartida
│   ├── credentials.ts            ← Carga credenciales
│   ├── error-handler.ts          ← Manejo de errores
│   ├── logger.ts                 ← Logger seguro por servicio
│   ├── usage-logger.ts           ← Sistema de logging interno
│   ├── usage-stats.ts            ← Estadísticas de uso
│   └── usage-tracker.ts          ← Helpers para tracking automático
│
├── hooks/                        ← Documentación de setup
│   ├── google-auth-flow.md
│   └── openai-key-management.md
│
└── examples/                     ← Código de ejemplo
    ├── google-workspace-query.ts
    └── openai-completion.ts
```

---

## 🔐 Archivo Crítico: .env.local

```
.dendrita/.env.local             ← LOCAL ONLY, GITIGNORED
├── GOOGLE_WORKSPACE_CLIENT_ID
├── GOOGLE_WORKSPACE_CLIENT_SECRET
├── GOOGLE_WORKSPACE_REFRESH_TOKEN
└── OPENAI_API_KEY
```

**IMPORTANTE**: Este archivo NUNCA debe ser commiteado. Está protegido por `.gitignore`.

---

## 📝 Flujos Comunes

### ¿Quiero usar Gmail?

1. Lee: [hooks/google-auth-flow.md](./hooks/google-auth-flow.md)
2. Configura: Google OAuth credentials
3. Usa: `import { GmailService } from './services/google/gmail'`
4. Ejemplo: Ver `examples/google-workspace-query.ts`

### ¿Quiero usar ChatGPT?

1. Lee: [hooks/openai-key-management.md](./hooks/openai-key-management.md)
2. Configura: API key en `.env.local`
3. Usa: `import { ChatService } from './services/openai/chat'`
4. Ejemplo: Ver `examples/openai-completion.ts`

### ¿Quiero hacer scraping de Google Drive?

1. Lee: [hooks/drive-scraper-setup.md](./hooks/drive-scraper-setup.md)
2. Configura: Schema SQL en Supabase
3. Configura: Carpetas a monitorear por workspace
4. Usa: `import { DriveScraper } from './services/google/drive-scraper'`
5. Ejemplo: Ver `scripts/drive-scraper.ts`

### ¿Tengo dudas de seguridad?

1. Lee: [SECURITY.md](./SECURITY.md)
2. Revisa: Matriz de seguridad y checklists
3. Busca: Tu escenario específico en "Situaciones de Riesgo"

### ¿Quiero agregar un nuevo servicio?

1. Lee: [ARCHITECTURE.md](./ARCHITECTURE.md) - Sección "Extensión Futura"
2. Crea: `services/[nuevo]/auth.ts`
3. Crea: `services/[nuevo]/client.ts`
4. Documenta: `hooks/[nuevo]-setup.md`
5. Ejemplo: `examples/[nuevo]-usage.ts`

### ¿Quiero consultar estadísticas de uso?

1. Lee: [USAGE-LOGGING.md](../../scripts/.archived/2025-11-06-integration-docs/USAGE-LOGGING.md) - Documentación completa (desarrollo personal)
2. Usa: `import { usageStats } from './utils/usage-stats'`
3. Ejemplo: Ver `examples/usage-logging-example.ts`

---

## ✅ Checklist de Setup Completo

- [ ] Leí SETUP.md
- [ ] Leí SECURITY.md
- [ ] Creé `.dendrita/.env.local`
- [ ] Configuré Google Workspace (si lo necesito)
- [ ] Configuré OpenAI (si lo necesito)
- [ ] Verifiqué que `.env.local` está en `.gitignore`
- [ ] Testeé que las credenciales se cargan
- [ ] Ejecuté los ejemplos exitosamente

---

## 🔗 Links Útiles

### Documentación Oficial

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API](https://developers.google.com/gmail/api)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [OpenAI API](https://platform.openai.com/docs)

### Herramientas

- [Google Cloud Console](https://console.cloud.google.com/)
- [OpenAI Platform](https://platform.openai.com)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)

### Seguridad

- [OWASP Secrets Management](https://owasp.org/www-project-top-ten/)
- [API Key Management](https://cheatsheetseries.owasp.org/cheatsheets/API_Key_Management_Cheat_Sheet.html)

---

## 🆘 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Credenciales no encontradas" | Verifica `.env.local` existe y está bien formado |
| "401 Unauthorized" | Google: refresh token expiró. OpenAI: key inválida |
| "Credenciales en logs" | Usa `createLogger()` en lugar de `console.log()` |
| "Accidentalmente comitee `.env.local`" | Ver SECURITY.md - "Riesgo 1" |

---

## 💡 Pro Tips

1. **Automation**: Usa estos servicios en scripts cron para automatizar tareas
2. **Monitoring**: Revisa logs regularmente en `.dendrita/integrations/logs/`
3. **Usage Tracking**: Usa el sistema de logging interno para monitorear uso de integraciones
4. **Performance**: Implementa caching para reducir requests a APIs
5. **Testing**: Crea test suite con credenciales de desarrollo

---

## 📞 Preguntas Frecuentes

### ¿Es seguro almacenar credenciales aquí?

**Sí**, si:
- Usas `.env.local` (gitignored)
- No lo compartes por email/chat
- Roteas credenciales regularmente
- Revisas logs no contienen datos sensibles

### ¿Puedo usar esto en producción?

**Sí**, con:
- Credenciales en variables de entorno del servidor
- Setup seguro de permisos de archivos
- Monitoring y alertas de errores
- Rotación regular de credenciales

### ¿Qué pasa si expongo una credencial?

1. **Inmediatamente**: Rota la credencial (delete y crear nueva)
2. **En git**: Limpia el historio (ver SECURITY.md)
3. **Monitoreo**: Revisa Google/OpenAI logs por actividad sospechosa

---

## 📈 Roadmap

Próximas integraciones planeadas:

- [ ] Slack API
- [ ] Microsoft 365
- [ ] Notion API
- [ ] Airtable API

¿Te gustaría agregar otra? Contribuye siguiendo la estructura en ARCHITECTURE.md

---

**Última actualización**: 2024
**Versión**: 1.0
**Mantenedor**: Alvaro Mur (ennui)

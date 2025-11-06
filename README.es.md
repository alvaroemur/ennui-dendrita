# ennui-dendrita (README en español)

<p align="center">
  <a href=".dendrita/blog/README.md"><img alt="Blog Índice" src="https://img.shields.io/badge/BLOG-%C3%8DNDICE-0a84ff?style=for-the-badge&logo=rss&logoColor=white"></a>
  <a href=".dendrita/blog/posts/"><img alt="Blog Posts" src="https://img.shields.io/badge/BLOG-POSTS-0a84ff?style=for-the-badge"></a>
</p>

> Este es el README general en español. Si prefieres la versión original en inglés, consulta `README.md`.

[Licencia MIT](LICENSE) · [Código de Conducta](CODE_OF_CONDUCT.md) · [Contribuir](CONTRIBUTING.md) · [Seguridad](SECURITY.md)

---

## 🌱 ¿Qué es esto?

**ennui-dendrita** es un sistema y metodología para gestionar múltiples proyectos en paralelo, manteniendo continuidad entre sesiones y aplicando buenas prácticas de forma consistente. Está adaptado para operaciones de negocio y gestión de proyectos, integrando documentación estructurada, agentes especializados y plantillas reutilizables.

- Gestiona múltiples proyectos sin perder trazabilidad
- Mantiene el contexto vivo entre sesiones (docs-as-code)
- Aplica mejores prácticas por tipo de proyecto
- Facilita reportes y toma de decisiones
- Orquesta equipos y aliados con gobernanza clara

---

## 🧭 Filosofía

Buscamos cerrar la brecha entre personas no técnicas y el trabajo asistido por IA. Con nociones básicas de lógica y una estructura clara, cualquiera puede operar con un enfoque híbrido (documentación + automatización + agentes).

Principios guía:
- Utilidad sobre ornamento: cada entregable debe habilitar una decisión
- Evidencia honesta: medimos lo que importa
- Colaboración con responsabilidad: roles y gobernanza simples
- Aprendizaje continuo: ciclos cortos de prueba y ajuste
- Valor público alineado al negocio

---

## 🙏 Créditos

Este repositorio se inspira en [Claude Code Infrastructure Showcase](https://github.com/claude-code-infrastructure-showcase). Adaptamos sus patrones técnico-organizativos al contexto de operaciones de negocio, con estructura de workspaces, proyectos y conocimiento de dominio.

---

## 🚀 Empezar rápido

1) Crea tu workspace: `workspaces/[tu-empresa]/`
2) Crea un proyecto: `workspaces/[tu-empresa]/active-projects/[tu-proyecto]/`
3) Añade los 3 archivos base:
   - `master-plan.md` (plan maestro)
   - `current-context.md` (contexto vivo)
   - `tasks.md` (tareas)
4) Usa las plantillas de `.dendrita/templates/workspace-template/` según el tipo de proyecto
5) Mantén `current-context.md` actualizado tras decisiones importantes

Si usas este repo como plantilla:
- Actualiza `LICENSE` con los datos de tu organización
- Define estilo en `workspaces/[tu-empresa]/config-estilo.json`
- Personaliza `.dendrita/settings.json` con metadatos de tu proyecto

---

## 📁 Estructura de carpetas

```
ennui-dendrita/
├── README.md / README.es.md
├── workspaces/
│   └── [workspace-name]/
│       ├── active-projects/
│       ├── archived-projects/
│       ├── best-practices/
│       ├── products/
│       ├── stakeholders/
│       ├── tools-templates/
│       └── company-management/
└── .dendrita/                 # Metadatos reflexivos (revisar SIEMPRE primero)
    ├── users/                 # Perfiles, agentes y skills por usuario
    ├── skills/                # Conocimiento contextual
    ├── agents/                # Agentes especializados
    ├── hooks/                 # Referencias de comportamiento (NO ejecutables)
    └── settings.json          # Metadatos del proyecto
```

Notas importantes:
- Cada workspace puede definir su `config-estilo.json` (convenciones de nombre y redacción)
- Los proyectos activos deben tener: `master-plan.md`, `current-context.md`, `tasks.md`
- Mantén consistencia con `workspaces/[empresa]/best-practices/`

---

## 🔄 Flujo de trabajo recomendado

1. Iniciación
   - Crea carpeta del proyecto y los 3 archivos base
   - Revisa la plantilla del tipo de proyecto en `best-practices/`
2. Ejecución
   - Revisa `current-context.md` al iniciar cada sesión
   - Actualiza tareas y decisiones clave
   - Activa agentes de `.dendrita/users/[user-id]/agents/` cuando necesites metodologías especializadas
3. Cierre
   - Completa reportes finales
   - Archiva el proyecto (mueve a `archived-projects/`)
   - Documenta aprendizajes en `best-practices/`

---

## 📚 Sistema de documentos persistentes

- `master-plan.md`: resumen ejecutivo, fases, métricas, cronograma, riesgos
- `current-context.md` (actualiza seguido): progreso, decisiones, bloqueadores, próximos pasos
- `tasks.md`: checklist por fases, estado, criterios de aceptación, responsables

---

## 🧩 Mejores prácticas (ejemplos)

Revisa `.dendrita/templates/workspace-template/best-practices/` para ejemplos de:
- Bootcamp de fundraising
- Diagnóstico de sostenibilidad (fase 1)
- Pipeline de proyectos y alianzas
- Sistema MEL (Monitoreo, Evaluación y Aprendizaje)
- Implementación de sostenibilidad (fases 2–4)

---

## 🤖 Agentes y modos de trabajo

Activa agentes cargando los archivos en `.dendrita/users/[user-id]/agents/` según la necesidad (estrategia de sostenibilidad, gestión de proyecto, análisis MEL, gestión de aliados, fundraising).

Preferencias de trabajo generales: `.dendrita/users/[user-id]/work-modes/user-work-mode.md`.

---

## 🔗 Integración con ChatGPT u otras IA

Dendrita puede generar prompts optimizados en base al contexto activo.

Cómo usar:
- Pide: "genérame el contexto/prompt para trabajar X en ChatGPT/Gemini/Claude"
- Se recopila el contexto del workspace/proyecto/agente
- Se genera un archivo en `_working-export/` listo para copiar/pegar

Más detalles: `.dendrita/hooks/external-prompt-generator.md`.

---

## 📊 Gestión multi-proyecto

- Usa `company-management/projects-dashboard.md` por workspace
- Actualízalo semanalmente con estado, fase y próximos hitos
- Mantén `stakeholders/` para relaciones clave y aliados

---

## 🧩 Estándares y estilo

- Para componentes de `.dendrita/`, sigue `.dendrita/config-estilo.json`
- Para archivos del workspace/proyectos, sigue `workspaces/[empresa]/config-estilo.json`
- Respeta nombres en minúsculas con guiones cuando se indique (por ejemplo, "ennui")

---

## 🤝 Contribuir y gobernanza

- Lee [CONTRIBUTING.md](CONTRIBUTING.md) para pautas de contribución
- Código de conducta: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Vulnerabilidades: reporta de forma privada según [SECURITY.md](SECURITY.md)

---

## 📬 Contacto

Creador y mantenedor: **Álvaro E. Mur** — `alvaro.e.mur@gmail.com`

Sobre **ennui**: consultora social y ambiental (Perú) enfocada en diagnóstico de sostenibilidad, estrategia de fundraising, medición de impacto (MEL), gestión de aliados e implementación de proyectos.

---

## 📎 Enlaces útiles

- Versión en inglés: `README.md`
- Documentación de hooks: `.dendrita/hooks/README.md`
- Sistema de usuarios: `.dendrita/users/README.md`
- Plantillas de workspace: `.dendrita/templates/workspace-template/`

---

MIT © ennui


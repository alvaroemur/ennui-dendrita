---
title: "Un mes de dendrita: cuando la obsesión con el orden se convierte en sistema"
description: "Un mes después de empezar este proyecto, reflexiono sobre cómo mi obsesión con el orden se convirtió en la solución para mantener el contexto en un sistema de gestión de proyectos con IA."
category: dendrita
channel: blog
subchannel: dendrita
status: published
created: 2025-12-03T00:00:00.000Z
updated: 2025-12-03T02:04:00.000Z
published_at: 2025-12-03T07:05:00.000Z
date: 2025-12-03
author: Álvaro E. Mur
categories: ["reflexión", "desarrollo"]
tags: ["dendrita", "reflexión", "desarrollo", "contexto", "sistema"]
slug: "2025-12-03-un-mes-de-dendrita"
url: "./posts/2025-12-03-un-mes-de-dendrita.md"
---

# Un mes de dendrita: cuando la obsesión con el orden se convierte en sistema

Sin darme cuenta se pasó un mes desde que empecé este proyecto. Pensaba que lo iba a abandonar rápido, como esas cosas que uno descubre y que dices "esto puede cambiarlo todo", pero suena tan mágico que inmediatamente se activa el pensamiento contrario que dice "bah, seguro no va a funcionar".

Incluso, en uno de los primeros experimentos de agenticación de mi trabajo, quise automatizar el posteo en Reddit sobre la herramienta en varios subreddits para recibir feedback. Hice todo el workflow aquí: investigué qué subreddits eran buenos candidatos, elaboré los posts optimizándolos para cada caso y... cuando iba a publicarlos automáticamente no se pudo porque tuve problemas con la API de Reddit 😅. Hice 2 publicaciones manualmente en r/projectmanagement y r/opensource y en cuestión de horas recibí un comentario:

> "Yes. I've done this and it breaks down with about 10 business days worth of notes. Every modern model hallucinates false requirements, incorrect note summaries, or hallucinates fake due dates/milestone.
>
> I found it incredibly inefficiently constantly reviewing all AI summaries and eventually quite using it for this task.
>
> The worst thing is that all outputs looks plausible so it can sometimes be difficult to debug."

Desalentador.

Y para colmo, los posts fueron borrados porque no cumplían con las políticas de los subreddits escogidos. Parece que mencionar ChatGPT en opensource está prohibido, y sólo lo mencionaba como referencia. En fin, no tenía ganas de pelear con los mods.

Pero eso no me detuvo. Al contrario, ese comentario me hizo pensar: ¿qué tenía mi sistema que otros no tenían? Me di cuenta que mi obsesión con el orden durante años era el ingrediente perfecto para hacer que el sistema se mantuviera a raya. Como un trapesista que tiene un contrapeso que no lo deja salirse del alambre. Lo que mencionaba el usuario era exactamente el problema que tenía que resolver: cómo evitar que el sistema se perdiera en el contexto cuando hay cientos de archivos y días de trabajo acumulados.

La solución: un sistema de documentos persistentes en tres niveles. En cada proyecto, mantengo tres archivos que se actualizan constantemente: `master-plan.md` (el plan maestro), `current-context.md` (el estado actual y decisiones recientes), y `tasks.md` (las tareas con su estado). Estos tres archivos se combinan automáticamente en un `project-context.json` que le da a la IA un resumen estructurado de dónde está el proyecto, qué se decidió, y qué sigue.

Pero no termina ahí. Estos contextos de proyecto se propagan hacia arriba: primero al workspace (si trabajo en múltiples empresas o áreas), y luego al contexto general del usuario. Todo esto con un sistema de "quickReference" que permite búsquedas rápidas sin tener que revisar cientos de archivos. Es como tener un índice inteligente que siempre sabe dónde buscar.

Y hay algo más: el sistema se documenta a sí mismo. Cada vez que modifico un hook, un skill o un agente, el sistema registra el cambio en su propio timeline, hablando en primera persona. Es como si el sistema tuviera memoria de su propia evolución. No tengo que recordar qué cambié o por qué—el sistema lo sabe.

La clave está en que estos documentos no son solo para mí—son para que cualquier herramienta de IA (Cursor, ChatGPT, Claude) pueda mantener continuidad entre sesiones. Cuando vuelvo a trabajar en algo después de días o semanas, la IA ya sabe qué estaba haciendo, qué decisiones tomé, y qué sigue. No tengo que explicarle todo desde cero cada vez.

Y sí, hace falta constancia para mantener estos archivos al día. Pero mi tendencia a organizarlo todo ha resultado ser justo el equilibrio que evita el caos. No es cuestión de magia—es cuestión de método. Es diseñar un sistema que ordena sin ser inflexible, que cambia con las necesidades pero nunca pierde el hilo.

Un mes después, el sistema sigue funcionando. Y cada vez que lo uso, me recuerdo que a veces la solución no está en hacer la IA más inteligente, sino en darle la estructura correcta para que no se pierda.

Quizás ese comentario desalentador de Reddit tenía razón: sin estructura, cualquier sistema de IA se desmorona con el tiempo. Pero con la estructura correcta, el mismo sistema se vuelve confiable. No es magia—es método. Y mi obsesión con el orden, que durante años me ha hecho tomar "la ruta larga" en lugar de "el remedio práctico", resultó ser la solución perfecta.


#!/usr/bin/env npx ts-node
/**
 * Script para actualizar meeting notes con formato simple (Notes y Action items)
 * Analiza transcripción y actualiza directamente la minuta
 */

import { analyzeTranscript, MeetingAnalysis } from './analyze-transcript';
import { ChatService, ChatMessage } from '../../../../services/openai/chat';
import { createLogger } from '../../../../utils/logger';
import { selectModel } from '../../../../utils/model-selector';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('UpdateMeetingNotesSimple');

interface SimpleMeetingNotes {
  date: string;
  title: string;
  attendees: string[];
  notes: string[];
  action_items: Array<{
    task: string;
    assignee?: string;
    due_date?: string;
  }>;
}

/**
 * Genera formato simple de meeting notes desde análisis
 */
async function generateSimpleFormat(
  analysis: MeetingAnalysis,
  transcriptText: string,
  options: { model?: string } = {}
): Promise<SimpleMeetingNotes> {
  const chat = new ChatService();

  if (!chat.isConfigured()) {
    throw new Error('OpenAI not configured. Set OPENAI_API_KEY in .env.local');
  }

  // Usar modelo Tier 2 para formato simple (más rápido y económico)
  const model = options.model || selectModel('simple-interpretation');

  logger.info(`Generando formato simple con ${model}...`);

  const systemPrompt = `Eres un asistente experto en generar meeting notes en formato simple.
Genera un formato limpio y conciso con solo dos secciones: Notes y Action items.

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "date": "YYYY-MM-DD",
  "title": "Título descriptivo de la reunión (ej: 'Inspiro check-in', 'Reunión con [cliente]')",
  "attendees": ["nombre1", "nombre2"],
  "notes": [
    "Nota 1 - punto clave discutido",
    "Nota 2 - otro punto importante",
    "Nota 3 - decisión o conclusión"
  ],
  "action_items": [
    {
      "task": "Descripción clara de la tarea",
      "assignee": "Persona asignada (si se menciona, solo nombre sin email)",
      "due_date": "Fecha límite en formato YYYY-MM-DD (solo si se menciona explícitamente)"
    }
  ]
}

REGLAS:
- date: Usa la fecha de la reunión del análisis (YYYY-MM-DD). Si no está disponible, usa la fecha de hoy.
- title: Genera un título descriptivo basado en el contenido (ej: "Inspiro check-in", "Reunión Arturo / Álvaro", "Reunión con [cliente]").
- Notes: Máximo 8-10 puntos clave. Sé conciso pero informativo. Incluye temas principales, decisiones, y puntos importantes.
- Action items: Solo tareas explícitas o claramente inferidas. Máximo 8-10. Sé específico.
- Si no hay assignee o due_date, omite esos campos (no uses null).
- Fechas en formato ISO (YYYY-MM-DD).
- Nombres de personas normalizados (sin emails, solo nombres completos como aparecen en la transcripción).
- Sé específico en las tareas, evita vaguedades.`;

  const userPrompt = `Analiza el siguiente análisis de transcripción y genera el formato simple:

=== ANÁLISIS ESTRUCTURADO ===
${JSON.stringify(analysis, null, 2)}

=== TRANSCRIPCIÓN COMPLETA (para contexto) ===
${transcriptText.substring(0, 5000)}...

Genera el formato simple con Notes y Action items basándote en el análisis y la transcripción.
Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await chat.sendMessage(messages, {
    model,
    temperature: 0.3,
    maxTokens: 2000,
    responseFormat: { type: 'json_object' },
  });

  logger.info('Respuesta recibida de OpenAI');

  // Parsear JSON
  let simpleNotes: SimpleMeetingNotes;
  try {
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    simpleNotes = JSON.parse(jsonText);
  } catch (parseError) {
    logger.error('Error al parsear JSON de OpenAI', parseError);
    logger.error('Respuesta recibida:', response);
    throw new Error('OpenAI no devolvió un JSON válido');
  }

  // Validar estructura
  if (!simpleNotes.date || !simpleNotes.notes || !simpleNotes.action_items) {
    throw new Error('JSON no tiene la estructura esperada');
  }

  logger.info('✅ Formato simple generado');
  logger.info(`- Notes: ${simpleNotes.notes.length}`);
  logger.info(`- Action items: ${simpleNotes.action_items.length}`);

  return simpleNotes;
}

/**
 * Formatea las meeting notes en markdown
 */
function formatSimpleMeetingNotes(simpleNotes: SimpleMeetingNotes): string {
  // Parsear fecha (puede venir en formato ISO o texto)
  let dateObj: Date;
  try {
    dateObj = new Date(simpleNotes.date);
    if (isNaN(dateObj.getTime())) {
      // Si no es una fecha válida, intentar parsear manualmente
      const dateMatch = simpleNotes.date.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        dateObj = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
      } else {
        dateObj = new Date(); // Fallback a hoy
      }
    }
  } catch {
    dateObj = new Date(); // Fallback a hoy
  }

  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Formatear attendees con emails correctos
  const attendeesList = simpleNotes.attendees.map((name) => {
    // Normalizar nombres para emails
    let email = '';
    if (name.toLowerCase().includes('arturo') || name.toLowerCase().includes('gonzales')) {
      email = 'arturo@inspiro.pe';
    } else if (name.toLowerCase().includes('álvaro') || name.toLowerCase().includes('alvaro') || name.toLowerCase().includes('mur')) {
      email = 'alvaro.e.mur@gmail.com';
    } else {
      // Fallback: generar email básico
      email = `${name.toLowerCase().replace(/\s+/g, '.')}@inspiro.pe`;
    }
    return `[${name}](mailto:${email})`;
  }).join(' ');

  let markdown = `## ${formattedDate} | ${simpleNotes.title}\n\n`;
  markdown += `Attendees: ${attendeesList}\n\n\n`;
  markdown += `Notes\n\n\n`;

  for (const note of simpleNotes.notes) {
    markdown += `* ${note}\n\n`;
  }

  markdown += `\nAction items\n\n\n`;

  for (const item of simpleNotes.action_items) {
    const assignee = item.assignee ? ` — ${item.assignee}` : '';
    const dueDate = item.due_date ? ` — ${item.due_date}` : '';
    markdown += `- [ ] ${item.task}${assignee}${dueDate}\n\n`;
  }

  return markdown;
}

/**
 * Inserta nueva entrada en meeting notes
 */
function insertMeetingNotesEntry(
  meetingNotesPath: string,
  newEntry: string
): void {
  if (!fs.existsSync(meetingNotesPath)) {
    throw new Error(`Archivo no encontrado: ${meetingNotesPath}`);
  }

  const content = fs.readFileSync(meetingNotesPath, 'utf-8');

  // Buscar el final del frontmatter (---)
  const frontmatterEnd = content.indexOf('---', 3);
  if (frontmatterEnd === -1) {
    throw new Error('No se encontró frontmatter en el archivo');
  }

  // Insertar después del frontmatter y un salto de línea
  const insertPosition = frontmatterEnd + 3;
  const before = content.substring(0, insertPosition);
  const after = content.substring(insertPosition).trimStart();

  const newContent = `${before}\n\n${newEntry}\n\n---\n\n${after}`;

  fs.writeFileSync(meetingNotesPath, newContent, 'utf-8');
  logger.info(`✅ Entrada agregada a: ${meetingNotesPath}`);
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    logger.error('Uso: ts-node update-meeting-notes-simple.ts <transcript-file> <meeting-notes-file> [options]');
    logger.error('');
    logger.error('Opciones:');
    logger.error('  --model <model>        Modelo de OpenAI (default: gpt-4o-mini)');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node update-meeting-notes-simple.ts transcript.txt meeting-notes.md');
    process.exit(1);
  }

  const transcriptPath = args[0];
  const meetingNotesPath = args[1];

  // Parsear opciones
  const options: { model?: string } = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--model' && i + 1 < args.length) {
      options.model = args[i + 1];
      i++;
    }
  }

  if (!fs.existsSync(transcriptPath)) {
    logger.error(`Archivo de transcripción no encontrado: ${transcriptPath}`);
    process.exit(1);
  }

  try {
    logger.info('=== ACTUALIZACIÓN DE MEETING NOTES (FORMATO SIMPLE) ===\n');

    // Paso 1: Analizar transcripción
    logger.info('📝 Paso 1: Analizando transcripción...');
    const analysis = await analyzeTranscript(transcriptPath, {
      model: options.model, // Si no se especifica, usa Tier 1 (complex-analysis)
    });
    logger.info('✅ Análisis completado\n');

    // Paso 2: Leer transcripción completa
    const transcriptText = fs.readFileSync(transcriptPath, 'utf-8');

    // Paso 3: Generar formato simple
    logger.info('📋 Paso 2: Generando formato simple...');
    const simpleNotes = await generateSimpleFormat(analysis, transcriptText, options);
    logger.info('✅ Formato simple generado\n');

    // Paso 4: Formatear en markdown
    logger.info('📄 Paso 3: Formateando en markdown...');
    const markdownEntry = formatSimpleMeetingNotes(simpleNotes);
    logger.info('✅ Markdown generado\n');

    // Paso 5: Insertar en meeting notes
    logger.info('💾 Paso 4: Actualizando meeting notes...');
    insertMeetingNotesEntry(meetingNotesPath, markdownEntry);
    logger.info('✅ Meeting notes actualizadas\n');

    logger.info('=== COMPLETADO ===');
    logger.info(`📄 Archivo actualizado: ${meetingNotesPath}`);
  } catch (error) {
    logger.error('Error fatal', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

export { generateSimpleFormat, formatSimpleMeetingNotes, insertMeetingNotesEntry };


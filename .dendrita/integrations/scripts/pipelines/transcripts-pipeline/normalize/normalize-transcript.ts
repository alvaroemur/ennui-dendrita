#!/usr/bin/env npx ts-node
/**
 * Script para normalizar transcripciones de reuniones
 * 
 * Normaliza el texto de una transcripción:
 * - Une cadenas de texto del mismo interlocutor que hayan quedado separadas
 * - Mejora la redacción manteniendo el sentido original
 * - Corrige errores en nombres propios, términos técnicos, fechas
 * - Mantiene estructura de diálogo
 */

import { ChatService } from '../../../../services/openai/chat';
import { createLogger } from '../../../../utils/logger';
import { selectModel } from '../../../../utils/model-selector';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('NormalizeTranscript');

export interface NormalizeOptions {
  model?: string;
  outputPath?: string;
  originalPath?: string;
}

/**
 * Normaliza una transcripción usando LLM
 */
async function normalizeTranscript(
  transcriptText: string,
  options: NormalizeOptions = {}
): Promise<string> {
  try {
    const chat = new ChatService();

    if (!chat.isConfigured()) {
      throw new Error('OpenAI not configured. Set OPENAI_API_KEY in .env.local');
    }

    // Usar modelo según estrategia de tiers:
    // - Normalización de texto → Tier 2 (gpt-4o-mini) - balanceado
    const model = options.model || selectModel('text-normalization');

    logger.info(`Normalizando transcripción con ${model}...`);

    const systemPrompt = `Eres un asistente experto en normalización de transcripciones de reuniones.
Tu tarea es mejorar la calidad y legibilidad de una transcripción manteniendo fielmente el contenido original.

INSTRUCCIONES:

1. **Unir cadenas de texto del mismo interlocutor:**
   - Si el mismo interlocutor tiene múltiples intervenciones consecutivas, únelas en una sola
   - Mantén la estructura de diálogo (interlocutor: texto)
   - Preserva los cambios de interlocutor

2. **Mejorar redacción:**
   - Corrige errores gramaticales evidentes
   - Mejora la fluidez de las oraciones
   - Mantén el tono y estilo original (formal, informal, técnico)
   - NO cambies el significado ni agregues información que no esté en el original

3. **Corregir errores:**
   - Nombres propios: Corrige nombres de personas, empresas, proyectos si son evidentemente incorrectos
   - Términos técnicos: Corrige términos técnicos o específicos del proyecto si hay errores obvios
   - Fechas y números: Corrige fechas y números si hay inconsistencias evidentes
   - Mantén dudas si no estás seguro (no inventes)

4. **Mantener estructura:**
   - Preserva la estructura de diálogo
   - Mantén la información técnica y específica del contexto
   - No elimines información, solo mejórala

5. **Formato de salida:**
   - Devuelve la transcripción normalizada en el mismo formato de diálogo
   - Mantén la estructura: "Interlocutor: texto"
   - No agregues comentarios ni explicaciones

IMPORTANTE:
- Mantén TODO el contenido original
- NO agregues información que no esté en el original
- NO cambies el significado de lo dicho
- Si hay dudas sobre correcciones, mantén el original
- Preserva el contexto y la información técnica específica`;

    const userPrompt = `Normaliza la siguiente transcripción de reunión siguiendo las instrucciones:

${transcriptText}

Devuelve ÚNICAMENTE la transcripción normalizada, sin comentarios adicionales.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await chat.sendMessage(messages, { model });
    const normalizedText = response.trim();

    logger.info('✅ Transcripción normalizada');

    // Guardar si se especifica outputPath
    if (options.outputPath) {
      const outputDir = path.dirname(options.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Crear frontmatter si hay originalPath
      let content = normalizedText;
      if (options.originalPath) {
        const frontmatter = `---
name: transcript-normalized
description: "Transcripción normalizada"
type: transcript-normalized
original_transcript: "${options.originalPath}"
normalized_date: "${new Date().toISOString()}"
normalization_model: "${model}"
---

`;
        content = frontmatter + normalizedText;
      }

      fs.writeFileSync(options.outputPath, content, 'utf-8');
      logger.info(`✅ Transcripción normalizada guardada en: ${options.outputPath}`);
    }

    return normalizedText;
  } catch (error: any) {
    logger.error('Error al normalizar transcripción', error);
    throw error;
  }
}

/**
 * Función principal para uso desde línea de comandos
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Uso: ts-node normalize-transcript.ts <transcript-file> [output-file] [model]');
    process.exit(1);
  }

  const transcriptPath = args[0];
  const outputPath = args[1] || transcriptPath.replace(/\.md$/, '-normalizada.md');
  const model = args[2];

  if (!fs.existsSync(transcriptPath)) {
    console.error(`Error: Archivo no encontrado: ${transcriptPath}`);
    process.exit(1);
  }

  const transcriptText = fs.readFileSync(transcriptPath, 'utf-8');

  // Extraer texto del frontmatter si existe
  let text = transcriptText;
  const frontmatterMatch = transcriptText.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontmatterMatch) {
    text = frontmatterMatch[2];
  }

  try {
    await normalizeTranscript(text, {
      model,
      outputPath,
      originalPath: transcriptPath,
    });

    console.log('\n✅ Normalización completada');
    console.log(`📄 Archivo guardado: ${outputPath}`);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { normalizeTranscript };


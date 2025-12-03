/**
 * Detector de relaciones semánticas entre documentos
 * 
 * Usa embeddings para detectar relaciones semánticas entre documentos
 * y sugerir backlinks basados en contenido, no solo wikilinks explícitos.
 */

import { ChatService, ChatCompletionResponse } from '../services/openai/chat';
import { createLogger } from './logger';
import { logIntegrationUsage } from './usage-logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('RelationshipDetector');

export interface Relationship {
  targetDocument: string;
  relationshipType: 'related' | 'references' | 'similar' | 'depends_on' | 'extends';
  strength: number; // 0-1
  context: string;
  suggestedTags: string[];
  reason: string;
}

/**
 * Calcula similitud coseno entre dos vectores
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Genera un resumen corto del contenido para embeddings
 */
function generateContentSummary(content: string, maxLength: number = 1000): string {
  // Si el contenido es corto, usarlo completo
  if (content.length <= maxLength) {
    return content;
  }

  // Extraer primeras líneas y últimas líneas
  const lines = content.split('\n');
  const firstLines = lines.slice(0, Math.floor(maxLength / 2 / 50)).join('\n');
  const lastLines = lines.slice(-Math.floor(maxLength / 2 / 50)).join('\n');
  
  // Extraer títulos y secciones importantes
  const titles = lines.filter(line => line.match(/^#{1,3}\s+/)).slice(0, 10).join('\n');
  
  return `${firstLines}\n\n[... contenido omitido ...]\n\n${titles}\n\n[... contenido omitido ...]\n\n${lastLines}`;
}

/**
 * Detecta relaciones semánticas entre un documento y otros documentos
 */
export async function detectRelationships(
  sourceContent: string,
  sourcePath: string,
  candidateDocuments: Array<{ path: string; content: string }>,
  options: {
    minSimilarity?: number;
    maxRelationships?: number;
  } = {}
): Promise<Relationship[]> {
  try {
    const chat = new ChatService();

    if (!chat.isConfigured()) {
      logger.warn('OpenAI not configured, skipping relationship detection');
      return [];
    }

    const minSimilarity = options.minSimilarity || 0.3;
    const maxRelationships = options.maxRelationships || 10;

    logger.info(`Detecting relationships for ${sourcePath} with ${candidateDocuments.length} candidates...`);

    // Generar resúmenes para embeddings
    const sourceSummary = generateContentSummary(sourceContent);
    const sourceEmbedding = await chat.createEmbedding(sourceSummary);

    // Calcular similitudes
    const similarities: Array<{ path: string; content: string; similarity: number }> = [];

    for (const candidate of candidateDocuments) {
      // Saltar si es el mismo archivo
      if (candidate.path === sourcePath) {
        continue;
      }

      try {
        const candidateSummary = generateContentSummary(candidate.content);
        const candidateEmbedding = await chat.createEmbedding(candidateSummary);
        const similarity = cosineSimilarity(sourceEmbedding, candidateEmbedding);

        if (similarity >= minSimilarity) {
          similarities.push({
            path: candidate.path,
            content: candidate.content,
            similarity,
          });
        }
      } catch (error) {
        logger.warn(`Error processing candidate ${candidate.path}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
    }

    // Ordenar por similitud y tomar los mejores
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topCandidates = similarities.slice(0, maxRelationships);

    logger.info(`Found ${topCandidates.length} potential relationships`);

    // Usar IA para determinar tipo de relación y contexto
    const relationships: Relationship[] = [];

    for (const candidate of topCandidates) {
      try {
        const relationship = await analyzeRelationship(
          sourceContent,
          sourcePath,
          candidate.content,
          candidate.path,
          candidate.similarity
        );
        relationships.push(relationship);
      } catch (error) {
        logger.warn(`Error analyzing relationship with ${candidate.path}: ${error instanceof Error ? error.message : String(error)}`);
        // Crear relación básica sin IA
        relationships.push({
          targetDocument: candidate.path,
          relationshipType: 'related',
          strength: candidate.similarity,
          context: '',
          suggestedTags: [],
          reason: `Similitud semántica: ${(candidate.similarity * 100).toFixed(1)}%`,
        });
      }
    }

    return relationships;
  } catch (error) {
    logger.error('Error detecting relationships', error);
    return [];
  }
}

/**
 * Analiza una relación específica usando IA
 */
async function analyzeRelationship(
  sourceContent: string,
  sourcePath: string,
  targetContent: string,
  targetPath: string,
  similarity: number
): Promise<Relationship> {
  const chat = new ChatService();
  const model = 'gpt-4o-mini'; // Modelo más barato para análisis de relaciones

  const systemPrompt = `Eres un asistente experto en análisis de relaciones entre documentos.
Analiza la relación entre dos documentos y determina:
1. Tipo de relación (related, references, similar, depends_on, extends)
2. Contexto de la relación
3. Tags sugeridos
4. Razón de la relación

IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido:

{
  "relationshipType": "related|references|similar|depends_on|extends",
  "context": "Breve descripción del contexto de la relación (1-2 oraciones)",
  "suggestedTags": ["tag1", "tag2"],
  "reason": "Razón específica de la relación"
}

TIPOS DE RELACIÓN:
- "related": Documentos relacionados temáticamente
- "references": Un documento referencia al otro
- "similar": Documentos con contenido similar
- "depends_on": Un documento depende del otro
- "extends": Un documento extiende o amplía el otro`;

  const sourcePreview = sourceContent.length > 2000 
    ? sourceContent.substring(0, 2000) + '[...]'
    : sourceContent;
  const targetPreview = targetContent.length > 2000 
    ? targetContent.substring(0, 2000) + '[...]'
    : targetContent;

  const userPrompt = `Analiza la relación entre estos dos documentos:

DOCUMENTO ORIGEN (${sourcePath}):
${sourcePreview}

DOCUMENTO OBJETIVO (${targetPath}):
${targetPreview}

Similitud semántica: ${(similarity * 100).toFixed(1)}%

Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

  try {
    const startTime = Date.now();
    const response: ChatCompletionResponse = await chat.sendMessageWithUsage(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model,
        temperature: 0.3,
        maxTokens: 500,
        responseFormat: { type: 'json_object' },
      }
    );

    const duration = Date.now() - startTime;
    
    // Registrar uso de tokens
    if (response.usage) {
      logIntegrationUsage('OpenAI', 'relationship-analysis', {
        status: 'success',
        duration,
        metadata: {
          model,
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
          sourcePath,
          targetPath,
        },
      });
    }

    let jsonText = response.content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(jsonText);

    return {
      targetDocument: targetPath,
      relationshipType: analysis.relationshipType || 'related',
      strength: similarity,
      context: analysis.context || '',
      suggestedTags: analysis.suggestedTags || [],
      reason: analysis.reason || `Similitud semántica: ${(similarity * 100).toFixed(1)}%`,
    };
  } catch (error) {
    logger.warn(`Error analyzing relationship, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return {
      targetDocument: targetPath,
      relationshipType: 'related',
      strength: similarity,
      context: '',
      suggestedTags: [],
      reason: `Similitud semántica: ${(similarity * 100).toFixed(1)}%`,
    };
  }
}


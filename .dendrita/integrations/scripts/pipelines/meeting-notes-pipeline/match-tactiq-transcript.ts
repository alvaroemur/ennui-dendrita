#!/usr/bin/env npx ts-node
/**
 * Matching jerárquico mejorado de transcripciones de Tactiq
 * Basado en la lógica de Neuron 1.0 con mejoras
 */

import { DriveService, DriveFile } from '../../../services/google/drive';
import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('MatchTactiqTranscript');

interface MatchingConfig {
  tactiq_folder: {
    path: string[];
    folder_id: string | null;
  };
  matching: {
    time_window_hours: number;
    name_similarity_threshold: number;
    time_weight: number;
    name_weight: number;
    participants_bonus: number;
    min_final_score: number;
  };
}

interface EventInfo {
  title: string;
  endTime: Date;
  guestList: string[];
  startTime?: Date;
}

interface TranscriptCandidate {
  id: string;
  name: string;
  created: Date;
  webViewLink?: string;
}

interface MatchResult {
  file: TranscriptCandidate | null;
  status: 'Time match' | 'Name match' | 'No match' | 'Pending' | 'Manual';
  finalScore: number;
  rationale: {
    reason?: string;
    timeDiffMin?: number;
    timeScore?: number;
    nameScore?: number;
    participantsScore?: number;
    finalScore?: number;
    criterio?: string;
    candidates?: Array<{ id: string; name: string; score: number }>;
  };
}

/**
 * Obtiene el user_id del perfil del usuario
 */
function getUserId(): string {
  try {
    const usersDir = path.join(process.cwd(), '.dendrita', 'users');
    if (!fs.existsSync(usersDir)) {
      throw new Error('No users directory found');
    }

    const userDirs = fs.readdirSync(usersDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'example-user')
      .map(dirent => dirent.name);

    if (userDirs.length === 0) {
      throw new Error('No user directories found');
    }

    const userId = process.env.USER_ID || userDirs[0];
    const profilePath = path.join(usersDir, userId, 'profile.json');
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    return userId;
  } catch (error: any) {
    logger.error('Failed to get user ID', error);
    throw error;
  }
}

/**
 * Carga configuración de matching
 */
function loadConfig(): MatchingConfig {
  try {
    const userId = getUserId();
    const configPath = path.join(
      process.cwd(),
      '.dendrita',
      'users',
      userId,
      'config',
      'transcript-matching.json'
    );

    if (!fs.existsSync(configPath)) {
      logger.warn('Config file not found, using defaults');
      return {
        tactiq_folder: {
          path: ['📂 Registros', 'Tactiq Transcription'],
          folder_id: null,
        },
        matching: {
          time_window_hours: 48,
          name_similarity_threshold: 0.45,
          time_weight: 0.7,
          name_weight: 0.3,
          participants_bonus: 0.05,
          min_final_score: 0.3,
        },
      };
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error: any) {
    logger.warn(`Failed to get user ID, using defaults: ${error instanceof Error ? error.message : String(error)}`);
    return {
      tactiq_folder: {
        path: ['📂 Registros', 'Tactiq Transcription'],
        folder_id: null,
      },
      matching: {
        time_window_hours: 48,
        name_similarity_threshold: 0.45,
        time_weight: 0.7,
        name_weight: 0.3,
        participants_bonus: 0.05,
        min_final_score: 0.3,
      },
    };
  }
}

/**
 * Normaliza un título removiendo caracteres especiales y normalizando espacios
 */
function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Implementación de Jaro-Winkler similarity
 */
function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0 || len2 === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const matchWindowSafe = Math.max(0, matchWindow);

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindowSafe);
    const end = Math.min(i + matchWindowSafe + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

  // Winkler prefix bonus
  let prefix = 0;
  for (let i = 0; i < Math.min(len1, len2, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Calcula similitud de nombres usando Jaro-Winkler
 */
function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  return jaroWinklerSimilarity(normA, normB);
}

/**
 * Verifica si dos fechas están en el mismo día
 */
function sameDay(date1: Date, date2: Date): boolean {
  if (!date1 || !date2) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Calcula score basado en proximidad temporal
 */
function scoreByTime(
  createdTime: Date,
  endTime: Date,
  windowHours: number
): number {
  if (!createdTime || !endTime) return 0;

  const diffHours = Math.abs(createdTime.getTime() - endTime.getTime()) / (1000 * 60 * 60);

  if (diffHours > windowHours) return 0;

  return 1 - Math.min(diffHours / windowHours, 1);
}

/**
 * Calcula score basado en similitud de nombres
 */
function scoreByName(eventTitle: string, fileName: string): number {
  if (!eventTitle || !fileName) return 0;
  return nameSimilarity(eventTitle, fileName);
}

/**
 * Calcula bonus por participantes detectados
 */
function scoreByParticipants(
  eventTitle: string,
  fileName: string,
  guestList: string[],
  bonus: number
): number {
  let totalBonus = 0;
  const text = (eventTitle + ' ' + fileName).toLowerCase();

  // Buscar nombres de participantes en el texto
  for (const guest of guestList) {
    const guestName = guest.toLowerCase().split('@')[0].split(' ')[0]; // Primer nombre del email
    if (text.includes(guestName)) {
      totalBonus += bonus;
      break; // Solo un bonus por archivo
    }
  }

  return Math.min(totalBonus, bonus);
}

/**
 * Agrega scores individuales en score final
 */
function aggregateScore(
  timeScore: number,
  nameScore: number,
  participantsScore: number,
  config: MatchingConfig['matching']
): {
  finalScore: number;
  timeScore: number;
  nameScore: number;
  participantsScore: number;
} {
  const finalScore =
    config.time_weight * timeScore +
    config.name_weight * nameScore +
    participantsScore;

  return {
    finalScore: Math.min(finalScore, 1.0),
    timeScore,
    nameScore,
    participantsScore,
  };
}

/**
 * Busca la carpeta de Tactiq en Google Drive
 */
export async function findTactiqFolder(
  drive: DriveService,
  config: MatchingConfig
): Promise<string | null> {
  try {
    let parentId = 'root';
    let folderId: string | null = null;

    // Si ya tenemos el folder_id en la configuración, usarlo
    if (config.tactiq_folder.folder_id) {
      return config.tactiq_folder.folder_id;
    }

    // Buscar cada parte del path
    for (const folderName of config.tactiq_folder.path) {
      const query = `mimeType='application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed = false`;
      const result = await drive.listFiles({ q: query, pageSize: 10 });

      if (!result.files || result.files.length === 0) {
        logger.warn(`No se encontró la carpeta "${folderName}"`);
        return null;
      }

      folderId = result.files[0].id;
      parentId = folderId;
    }

    logger.info(`Encontrada carpeta de Tactiq: ${folderId}`);
    return folderId;
  } catch (error: any) {
    logger.error('Error al buscar carpeta de Tactiq', error);
    return null;
  }
}

/**
 * Lista todos los documentos de transcripción en la carpeta de Tactiq
 */
async function listTactiqTranscripts(
  drive: DriveService,
  folderId: string
): Promise<TranscriptCandidate[]> {
  const transcripts: TranscriptCandidate[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const query = `mimeType='application/vnd.google-apps.document' and '${folderId}' in parents and trashed = false`;
      const result = await drive.listFiles({
        q: query,
        pageSize: 200,
        pageToken,
        orderBy: 'modifiedTime desc',
      });

      if (result.files) {
        for (const file of result.files) {
          transcripts.push({
            id: file.id,
            name: file.name,
            created: new Date(file.createdTime),
            webViewLink: file.webViewLink,
          });
        }
      }

      pageToken = result.nextPageToken;
    } while (pageToken);

    logger.info(`Encontrados ${transcripts.length} documentos de transcripción`);
    return transcripts;
  } catch (error: any) {
    logger.error('Error al listar transcripciones', error);
    return [];
  }
}

/**
 * Encuentra el mejor candidato de transcript usando sistema jerárquico
 */
export async function findBestCandidate(
  event: EventInfo,
  candidates: TranscriptCandidate[],
  currentMatch?: MatchResult | null
): Promise<MatchResult> {
  const config = loadConfig();

  // Guardas de seguridad
  if (currentMatch && currentMatch.status === 'Manual') {
    return {
      file: null,
      status: 'Manual',
      finalScore: 0,
      rationale: { reason: 'Manual override - no changes' },
    };
  }

  if (!candidates || candidates.length === 0) {
    return {
      file: null,
      status: 'No match',
      finalScore: 0,
      rationale: { reason: 'No candidates available' },
    };
  }

  // Filtrar candidatos por fecha - más permisivo
  let filteredCandidates = candidates;
  if (event.endTime) {
    filteredCandidates = candidates.filter((f) => {
      if (!f.created) return false;
      // Incluir si está en el mismo día O dentro de la ventana temporal ampliada
      const timeDiffHours =
        Math.abs(f.created.getTime() - event.endTime.getTime()) / (1000 * 60 * 60);
      return sameDay(event.endTime, f.created) || timeDiffHours <= config.matching.time_window_hours;
    });
  }

  if (filteredCandidates.length === 0) {
    return {
      file: null,
      status: 'No match',
      finalScore: 0,
      rationale: { reason: 'No candidates within time window' },
    };
  }

  // Calcular scores para cada candidato
  const scoredCandidates = filteredCandidates.map((f) => {
    const timeScore = scoreByTime(
      f.created,
      event.endTime,
      config.matching.time_window_hours
    );
    const nameScore = scoreByName(event.title, f.name);
    const participantsScore = scoreByParticipants(
      event.title,
      f.name,
      event.guestList,
      config.matching.participants_bonus
    );

    const scores = aggregateScore(timeScore, nameScore, participantsScore, config.matching);

    return {
      file: f,
      timeScore: scores.timeScore,
      nameScore: scores.nameScore,
      participantsScore: scores.participantsScore,
      finalScore: scores.finalScore,
      diffMinutes:
        f.created && event.endTime
          ? Math.abs(f.created.getTime() - event.endTime.getTime()) / (1000 * 60)
          : 0,
    };
  });

  // Ordenar por score final descendente
  scoredCandidates.sort((a, b) => {
    if (a.finalScore !== b.finalScore) return b.finalScore - a.finalScore;
    return a.diffMinutes - b.diffMinutes; // En caso de empate, menor diffMinutes
  });

  const best = scoredCandidates[0];
  const second = scoredCandidates[1];

  // Determinar estado
  let status: MatchResult['status'] = 'No match';
  let criterio = 'none';

  // Umbral mínimo para cualquier match
  if (best.finalScore >= config.matching.min_final_score) {
    if (best.timeScore > 0.3 && best.nameScore >= config.matching.name_similarity_threshold) {
      status = 'Time match';
      criterio = 'Time match';
    } else if (best.nameScore >= 0.6 && sameDay(event.endTime, best.file.created)) {
      status = 'Name match';
      criterio = 'Name match';
    } else if (best.timeScore > 0.2) {
      status = 'Time match';
      criterio = 'Time match (low name score)';
    }
  }

  // Verificar empate técnico
  if (second && Math.abs(best.finalScore - second.finalScore) < 0.05) {
    status = 'Pending';
    criterio = 'Tie - multiple candidates';
  }

  // Verificar mejora mínima para reemplazar match existente
  if (
    currentMatch &&
    currentMatch.finalScore &&
    best.finalScore < currentMatch.finalScore + 0.05
  ) {
    return {
      file: null,
      status: 'No match',
      finalScore: best.finalScore,
      rationale: {
        reason: `Insufficient improvement over current match (current: ${currentMatch.finalScore}, new: ${best.finalScore})`,
      },
    };
  }

  // Preparar rationale
  const rationale: MatchResult['rationale'] = {
    timeDiffMin: best.diffMinutes,
    timeScore: best.timeScore,
    nameScore: best.nameScore,
    participantsScore: best.participantsScore,
    finalScore: best.finalScore,
    criterio,
    candidates: scoredCandidates.slice(0, 3).map((c) => ({
      id: c.file.id,
      name: c.file.name,
      score: c.finalScore,
    })),
  };

  return {
    file: status !== 'No match' && status !== 'Pending' ? best.file : null,
    status,
    finalScore: best.finalScore,
    rationale,
  };
}

/**
 * Busca transcripción de Tactiq para un evento
 */
export async function findTactiqTranscriptForEvent(
  event: EventInfo,
  drive: DriveService
): Promise<{ transcript: TranscriptCandidate | null; match: MatchResult }> {
  const config = loadConfig();

  // Buscar carpeta de Tactiq
  const tactiqFolderId = await findTactiqFolder(drive, config);
  if (!tactiqFolderId) {
    logger.warn('No se encontró la carpeta de Tactiq');
    return {
      transcript: null,
      match: {
        file: null,
        status: 'No match',
        finalScore: 0,
        rationale: { reason: 'Tactiq folder not found' },
      },
    };
  }

  // Listar transcripciones
  const candidates = await listTactiqTranscripts(drive, tactiqFolderId);
  if (candidates.length === 0) {
    logger.warn('No se encontraron transcripciones en la carpeta de Tactiq');
    return {
      transcript: null,
      match: {
        file: null,
        status: 'No match',
        finalScore: 0,
        rationale: { reason: 'No transcripts found in Tactiq folder' },
      },
    };
  }

  // Buscar mejor match
  const match = await findBestCandidate(event, candidates);

  return {
    transcript: match.file,
    match,
  };
}


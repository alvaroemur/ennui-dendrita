#!/usr/bin/env npx ts-node
/**
 * Gestión de JSON persistente de metadatos de meeting notes
 */

import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('UpdateMeetingMetadata');

export interface MeetingMetadataEntry {
  date: string; // YYYY-MM-DD
  title: string;
  participants: string[];
  transcript_url?: string;
  transcript_source?: string;
  last_updated: string; // ISO timestamp
  tags?: string[];
  variables?: {
    workspace?: string;
    type?: string;
    participants?: string[];
    client?: string;
    project?: string;
    [key: string]: any;
  };
}

export interface MeetingMetadata {
  entries: MeetingMetadataEntry[];
  last_updated: string;
}

/**
 * Lee el archivo de metadatos
 */
export function readMeetingMetadata(metadataPath: string): MeetingMetadata {
  const filePath = path.resolve(metadataPath);

  if (!fs.existsSync(filePath)) {
    logger.info(`Archivo de metadatos no existe, creando nuevo: ${filePath}`);
    return {
      entries: [],
      last_updated: new Date().toISOString(),
    };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const metadata: MeetingMetadata = JSON.parse(content);
    return metadata;
  } catch (error: any) {
    logger.error('Error al leer metadatos', error);
    return {
      entries: [],
      last_updated: new Date().toISOString(),
    };
  }
}

/**
 * Escribe el archivo de metadatos
 */
export function writeMeetingMetadata(
  metadataPath: string,
  metadata: MeetingMetadata
): void {
  const filePath = path.resolve(metadataPath);
  const dir = path.dirname(filePath);

  // Crear directorio si no existe
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Actualizar timestamp
  metadata.last_updated = new Date().toISOString();

  // Escribir archivo
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2), 'utf-8');
  logger.info(`Metadatos actualizados: ${filePath}`);
}

/**
 * Busca entrada en metadatos por fecha
 */
export function findMetadataEntry(
  metadata: MeetingMetadata,
  date: string
): MeetingMetadataEntry | null {
  return metadata.entries.find((e) => e.date === date) || null;
}

/**
 * Agrega o actualiza entrada en metadatos
 */
export function upsertMetadataEntry(
  metadataPath: string,
  entry: MeetingMetadataEntry
): MeetingMetadata {
  const metadata = readMeetingMetadata(metadataPath);

  // Buscar entrada existente
  const existingIndex = metadata.entries.findIndex((e) => e.date === entry.date);

  if (existingIndex >= 0) {
    // Actualizar entrada existente
    metadata.entries[existingIndex] = {
      ...metadata.entries[existingIndex],
      ...entry,
      last_updated: new Date().toISOString(),
    };
    logger.info(`Entrada actualizada en metadatos: ${entry.date}`);
  } else {
    // Agregar nueva entrada
    metadata.entries.push({
      ...entry,
      last_updated: new Date().toISOString(),
    });
    logger.info(`Nueva entrada agregada a metadatos: ${entry.date}`);
  }

  // Ordenar por fecha (más reciente primero)
  metadata.entries.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Guardar
  writeMeetingMetadata(metadataPath, metadata);

  return metadata;
}

/**
 * Crea o actualiza entrada de metadatos desde análisis de transcripción
 */
export function updateMetadataFromAnalysis(
  metadataPath: string,
  date: string,
  title: string,
  participants: string[],
  transcriptUrl?: string,
  transcriptSource?: string,
  tags?: string[],
  variables?: any
): MeetingMetadataEntry {
  const entry: MeetingMetadataEntry = {
    date,
    title,
    participants,
    transcript_url: transcriptUrl,
    transcript_source: transcriptSource,
    last_updated: new Date().toISOString(),
    tags,
    variables,
  };

  upsertMetadataEntry(metadataPath, entry);

  return entry;
}


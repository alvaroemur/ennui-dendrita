#!/usr/bin/env npx ts-node
/**
 * Script para extraer transcripciones de Google Docs por ID
 */

import { DriveService } from '../../../services/google/drive';
import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ExtractTranscriptsById');

/**
 * Extrae el texto de un Google Doc usando Google Docs API
 */
async function extractDocText(drive: DriveService, fileId: string): Promise<string | null> {
  try {
    await drive.authenticate();
    const accessToken = (drive as any).accessToken;

    if (!accessToken) {
      throw new Error('No se pudo obtener access token');
    }

    const url = `https://docs.googleapis.com/v1/documents/${fileId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      logger.warn(`Error al obtener documento ${fileId}: ${response.status}`);
      return null;
    }

    const doc = await response.json();

    // Extraer texto del documento
    let text = '';
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          for (const paraElement of element.paragraph.elements || []) {
            if (paraElement.textRun) {
              text += paraElement.textRun.content;
            }
          }
        }
      }
    }

    return text;
  } catch (error: any) {
    logger.error(`Error al extraer texto del documento ${fileId}`, error);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    logger.error('Uso: ts-node extract-transcripts-by-id.ts <file-id-1> [file-id-2] ... [output-dir]');
    logger.error('');
    logger.error('Ejemplo:');
    logger.error('  ts-node extract-transcripts-by-id.ts 1HRejyATzEzAzea6vpaf9VOEFEF459b7CHUMx8q4P-nA 1Ov-XuuArjFR-MKocDIkkMgmb2E5vdg2vQBpsaIb3f48');
    process.exit(1);
  }

  const outputDir = args[args.length - 1]?.startsWith('--output-dir=') 
    ? args[args.length - 1].replace('--output-dir=', '')
    : path.join(process.cwd(), 'workspaces/[workspace]/⚙️ company-management/data/transcripts');

  const fileIds = args.filter(arg => !arg.startsWith('--output-dir='));

  const drive = new DriveService();
  await drive.authenticate();

  for (const fileId of fileIds) {
    logger.info(`Extrayendo transcripción: ${fileId}`);
    const text = await extractDocText(drive, fileId);
    
    if (text) {
      // Crear directorio si no existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generar nombre de archivo con fecha
      const date = new Date().toISOString().split('T')[0];
      const filename = `${date}-transcript-${fileId.substring(0, 8)}.txt`;
      const filepath = path.join(outputDir, filename);

      fs.writeFileSync(filepath, text, 'utf-8');
      logger.info(`✅ Transcripción guardada en: ${filepath}`);
      logger.info(`   Tamaño: ${text.length} caracteres\n`);
    } else {
      logger.warn(`⚠️  No se pudo extraer transcripción: ${fileId}\n`);
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}


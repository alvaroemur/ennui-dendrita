#!/usr/bin/env npx ts-node
/**
 * Gestión de entradas en meeting-notes.md
 * Busca, crea y actualiza entradas por fecha
 */

import { createLogger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ManageMeetingNotesEntry');

export interface MeetingNotesEntry {
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  index: number; // Índice en el archivo (línea donde empieza)
}

export interface MeetingNotesInfo {
  entry_exists: boolean;
  entry_index?: number;
  entry_content?: string;
  entry_date?: string;
  file_path: string;
}

/**
 * Parsea una fecha desde el formato del meeting notes
 * Formato: "## Nov 06, 2025 | Reunión Arturo / Álvaro"
 */
function parseDateFromHeader(header: string): string | null {
  // Buscar patrón: "Nov 06, 2025" o "Nov 6, 2025"
  const match = header.match(/(\w{3})\s+(\d{1,2}),\s+(\d{4})/);
  if (!match) return null;

  const monthNames: Record<string, string> = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12',
  };

  const month = monthNames[match[1]];
  const day = match[2].padStart(2, '0');
  const year = match[3];

  if (!month) return null;

  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha al formato del meeting notes
 * Input: "2025-11-06" → Output: "Nov 06, 2025"
 */
function formatDateForHeader(date: string): string {
  const d = new Date(date);
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = monthNames[d.getMonth()];
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Busca entrada del día en meeting-notes.md
 */
export function findEntryByDate(
  meetingNotesPath: string,
  date: string
): MeetingNotesInfo {
  const filePath = path.resolve(meetingNotesPath);

  if (!fs.existsSync(filePath)) {
    logger.warn(`Archivo de meeting notes no existe: ${filePath}`);
    return {
      entry_exists: false,
      file_path: filePath,
    };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Buscar entrada por fecha
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      const parsedDate = parseDateFromHeader(line);
      if (parsedDate === date) {
        // Encontramos la entrada, extraer contenido hasta la siguiente entrada o fin del archivo
        let entryContent = line + '\n';
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('## ')) {
          entryContent += lines[j] + '\n';
          j++;
        }

        return {
          entry_exists: true,
          entry_index: i,
          entry_content: entryContent.trim(),
          entry_date: date,
          file_path: filePath,
        };
      }
    }
  }

  return {
    entry_exists: false,
    file_path: filePath,
  };
}

/**
 * Crea una nueva entrada en meeting-notes.md
 */
export function createNewEntry(
  meetingNotesPath: string,
  date: string,
  title: string,
  participants?: string[]
): string {
  const filePath = path.resolve(meetingNotesPath);
  const formattedDate = formatDateForHeader(date);

  // Leer contenido existente
  let content = '';
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  // Crear nueva entrada
  const newEntry = `## ${formattedDate} | ${title}

${participants && participants.length > 0 ? `Attendees: ${participants.map(p => `[${p}](mailto:${p})`).join(' ')}\n\n` : ''}### **📋 Resumen**

*[Sección a completar con resumen de la reunión]*

### **🗂️ Temas o clientes revisados**

*[Sección a completar con temas y clientes]*

### **💭 Puntos de discusión y conclusiones**

*[Sección a completar con puntos de discusión]*

### **💡 Decisiones**

*[Sección a completar con decisiones tomadas]*

### **🧭 Actividades próximas**

*[Sección a completar con actividades próximas]*

### **✅ Tareas**

*[Sección a completar con tareas]*

### **🔑 Insights clave**

*[Sección a completar con insights]*

---

`;

  // Agregar al inicio del archivo (después del frontmatter si existe)
  const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[0];
    const rest = content.substring(frontmatter.length);
    content = frontmatter + newEntry + rest;
  } else {
    content = newEntry + content;
  }

  // Guardar archivo
  fs.writeFileSync(filePath, content, 'utf-8');
  logger.info(`Nueva entrada creada para ${date}`);

  return newEntry;
}

/**
 * Obtiene información sobre una entrada en meeting-notes.md
 */
export function getMeetingNotesInfo(
  meetingNotesPath: string,
  date: string
): MeetingNotesInfo {
  return findEntryByDate(meetingNotesPath, date);
}


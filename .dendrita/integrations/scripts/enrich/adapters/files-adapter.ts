/**
 * Adapter para documentos markdown en el sistema de archivos
 * 
 * Extrae documentos markdown de workspaces/
 */

import * as fs from 'fs';
import * as path from 'path';
import { Document, DocumentAdapter } from './base-adapter';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('FilesAdapter');

export class FilesAdapter implements DocumentAdapter {
  private workspacesDir: string;
  private workspaceFilter?: string;
  private fileFilter?: string;

  constructor(
    workspacesDir: string = path.join(process.cwd(), 'workspaces'),
    workspaceFilter?: string,
    fileFilter?: string
  ) {
    this.workspacesDir = workspacesDir;
    this.workspaceFilter = workspaceFilter;
    this.fileFilter = fileFilter;
  }

  getName(): string {
    return 'files-adapter';
  }

  async extractDocuments(): Promise<Document[]> {
    const documents: Document[] = [];
    const files = this.findMarkdownFiles();

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relPath = path.relative(process.cwd(), filePath);

        documents.push({
          path: filePath,
          content,
          metadata: {
            relativePath: relPath,
            fileName: path.basename(filePath),
            workspace: this.extractWorkspace(filePath),
            project: this.extractProject(filePath),
          },
        });
      } catch (error) {
        logger.warn(`Error reading file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return documents;
  }

  async getDocumentContent(doc: Document): Promise<string> {
    return doc.content;
  }

  getDocumentMetadata(doc: Document): Record<string, any> {
    return doc.metadata;
  }

  private findMarkdownFiles(): string[] {
    const files: string[] = [];

    if (!fs.existsSync(this.workspacesDir)) {
      return files;
    }

    const workspaces = fs.readdirSync(this.workspacesDir, { withFileTypes: true });

    for (const workspace of workspaces) {
      if (!workspace.isDirectory()) continue;
      if (this.workspaceFilter && workspace.name !== this.workspaceFilter) continue;

      const workspacePath = path.join(this.workspacesDir, workspace.name);
      this.findMarkdownFilesRecursive(workspacePath, files);
    }

    // Filtrar por fileFilter si existe
    if (this.fileFilter) {
      const filterPath = path.isAbsolute(this.fileFilter)
        ? this.fileFilter
        : path.join(process.cwd(), this.fileFilter);
      return files.filter(f => f === filterPath);
    }

    return files;
  }

  private findMarkdownFilesRecursive(dir: string, files: string[]): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }
          this.findMarkdownFilesRecursive(fullPath, files);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorar errores de permisos
    }
  }

  private extractWorkspace(filePath: string): string | undefined {
    // Buscar workspace, puede tener emojis
    const match = filePath.match(/workspaces[\/\\]([^\/\\]+)/);
    if (match) {
      const workspaceName = match[1];
      // Si hay filtro de workspace, comparar sin emojis
      if (this.workspaceFilter) {
        const workspaceNameClean = workspaceName.replace(/[^\w\s-]/g, '').trim();
        const filterClean = this.workspaceFilter.replace(/[^\w\s-]/g, '').trim();
        return workspaceNameClean === filterClean ? workspaceName : undefined;
      }
      return workspaceName;
    }
    return undefined;
  }

  private extractProject(filePath: string): string | undefined {
    const match = filePath.match(/🚀 active-projects[\/\\]([^\/\\]+)/);
    return match ? match[1] : undefined;
  }
}


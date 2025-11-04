/**
 * Script para identificar archivos de test y debug que pueden ser archivados
 * 
 * Este script ayuda a identificar:
 * - Archivos de test que ya no son relevantes
 * - Scripts de debug obsoletos
 * - Ejemplos que están desactualizados
 * - Archivos duplicados o redundantes
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
  path: string;
  type: 'test' | 'debug' | 'example' | 'script' | 'unknown';
  size: number;
  modified: Date;
  lastAccessed?: Date;
  status: 'active' | 'deprecated' | 'duplicate' | 'unused';
  notes?: string;
}

interface ArchiveCandidate {
  file: FileInfo;
  reason: string;
  archiveLocation: string;
  relatedFiles?: string[];
}

class TestDebugIdentifier {
  private rootDir: string;
  private testPatterns: RegExp[] = [
    /test-.*\.ts$/i,
    /.*-test\.ts$/i,
    /.*\.spec\.ts$/i,
    /.*\.test\.ts$/i,
  ];
  private debugPatterns: RegExp[] = [
    /debug-.*\.ts$/i,
    /.*-debug\.ts$/i,
  ];
  private examplePatterns: RegExp[] = [
    /.*-example\.ts$/i,
    /examples?\/.*\.ts$/i,
  ];

  constructor(rootDir: string = '.') {
    this.rootDir = path.resolve(rootDir);
  }

  /**
   * Identifica archivos de test y debug
   */
  identifyFiles(directory: string = this.rootDir): FileInfo[] {
    const files: FileInfo[] = [];
    const dir = path.resolve(directory);

    if (!fs.existsSync(dir)) {
      console.warn(`⚠️  Directory does not exist: ${dir}`);
      return files;
    }

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      // Skip node_modules, .git, and other ignored directories
      if (item.name.startsWith('.') || item.name === 'node_modules') {
        continue;
      }

      if (item.isDirectory()) {
        // Recursively search in subdirectories
        files.push(...this.identifyFiles(fullPath));
      } else if (item.isFile() && item.name.endsWith('.ts')) {
        const fileInfo = this.analyzeFile(fullPath);
        if (fileInfo.type !== 'unknown') {
          files.push(fileInfo);
        }
      }
    }

    return files;
  }

  /**
   * Analiza un archivo para determinar su tipo
   */
  private analyzeFile(filePath: string): FileInfo {
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(this.rootDir, filePath);
    const fileName = path.basename(filePath);

    let type: FileInfo['type'] = 'unknown';
    let status: FileInfo['status'] = 'active';

    // Check test patterns
    if (this.testPatterns.some(pattern => pattern.test(fileName))) {
      type = 'test';
    } else if (this.debugPatterns.some(pattern => pattern.test(fileName))) {
      type = 'debug';
    } else if (this.examplePatterns.some(pattern => pattern.test(fileName)) || 
               filePath.includes('/examples/')) {
      type = 'example';
    } else if (filePath.includes('/scripts/')) {
      type = 'script';
    }

    // Determine status based on file age and location
    const daysSinceModified = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (daysSinceModified > 180) { // 6 months
      status = 'deprecated';
    }

    return {
      path: relativePath,
      type,
      size: stats.size,
      modified: stats.mtime,
      status,
    };
  }

  /**
   * Identifica candidatos para archivado
   */
  identifyArchiveCandidates(files: FileInfo[]): ArchiveCandidate[] {
    const candidates: ArchiveCandidate[] = [];

    // Group by type and find duplicates
    const byType = new Map<FileInfo['type'], FileInfo[]>();
    for (const file of files) {
      if (!byType.has(file.type)) {
        byType.set(file.type, []);
      }
      byType.get(file.type)!.push(file);
    }

    // Check for deprecated files
    for (const file of files) {
      if (file.status === 'deprecated') {
        candidates.push({
          file,
          reason: `File not modified in 6+ months (${Math.floor((Date.now() - file.modified.getTime()) / (1000 * 60 * 60 * 24))} days)`,
          archiveLocation: this.getArchiveLocation(file),
        });
      }
    }

    // Check for duplicates
    const duplicates = this.findDuplicates(files);
    for (const duplicate of duplicates) {
      candidates.push({
        file: duplicate.file,
        reason: `Duplicate or similar functionality to ${duplicate.original}`,
        archiveLocation: this.getArchiveLocation(duplicate.file),
        relatedFiles: [duplicate.original],
      });
    }

    return candidates;
  }

  /**
   * Encuentra archivos duplicados o similares
   */
  private findDuplicates(files: FileInfo[]): Array<{ file: FileInfo; original: string }> {
    const duplicates: Array<{ file: FileInfo; original: string }> = [];
    const seen = new Map<string, FileInfo>();

    for (const file of files) {
      const key = `${file.type}-${path.basename(file.path)}`;
      if (seen.has(key)) {
        const original = seen.get(key)!;
        // Keep the one in scripts/ or the newer one
        if (file.path.includes('/scripts/') || file.modified > original.modified) {
          duplicates.push({ file: original, original: file.path });
        } else {
          duplicates.push({ file, original: original.path });
        }
      } else {
        seen.set(key, file);
      }
    }

    return duplicates;
  }

  /**
   * Determina la ubicación de archivo en el archivo
   */
  private getArchiveLocation(file: FileInfo): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = path.basename(file.path, path.extname(file.path));
    const description = baseName.replace(/^(test|debug|example)-?/i, '');

    switch (file.type) {
      case 'test':
        return `archived/code/tests/${timestamp}-${description}`;
      case 'debug':
        return `archived/code/scripts/${timestamp}-${description}`;
      case 'example':
        return `archived/code/examples/${timestamp}-${description}`;
      default:
        return `archived/code/scripts/${timestamp}-${description}`;
    }
  }

  /**
   * Genera un reporte de archivos identificados
   */
  generateReport(files: FileInfo[], candidates: ArchiveCandidate[]): string {
    let report = '# Test and Debug Files Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '## Summary\n\n';
    report += `- Total files identified: ${files.length}\n`;
    report += `- Archive candidates: ${candidates.length}\n\n`;

    // Group by type
    const byType = new Map<FileInfo['type'], FileInfo[]>();
    for (const file of files) {
      if (!byType.has(file.type)) {
        byType.set(file.type, []);
      }
      byType.get(file.type)!.push(file);
    }

    report += '## Files by Type\n\n';
    for (const [type, typeFiles] of byType.entries()) {
      report += `### ${type} (${typeFiles.length})\n\n`;
      for (const file of typeFiles) {
        report += `- \`${file.path}\` (${file.size} bytes, modified: ${file.modified.toISOString().split('T')[0]})\n`;
      }
      report += '\n';
    }

    if (candidates.length > 0) {
      report += '## Archive Candidates\n\n';
      for (const candidate of candidates) {
        report += `### \`${candidate.file.path}\`\n\n`;
        report += `- **Type:** ${candidate.file.type}\n`;
        report += `- **Reason:** ${candidate.reason}\n`;
        report += `- **Archive Location:** \`${candidate.archiveLocation}\`\n`;
        if (candidate.relatedFiles) {
          report += `- **Related Files:** ${candidate.relatedFiles.join(', ')}\n`;
        }
        report += '\n';
      }
    }

    return report;
  }
}

// Main execution
if (require.main === module) {
  const identifier = new TestDebugIdentifier('.');
  
  console.log('🔍 Identifying test and debug files...\n');
  
  const files = identifier.identifyFiles();
  const candidates = identifier.identifyArchiveCandidates(files);
  const report = identifier.generateReport(files, candidates);

  console.log(report);

  // Save report
  const reportPath = path.join('.dendrita', 'archived', 'test-debug-report.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`\n✅ Report saved to: ${reportPath}`);
}

export { TestDebugIdentifier, FileInfo, ArchiveCandidate };


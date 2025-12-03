/**
 * Adapter base para diferentes fuentes de documentos
 * 
 * Define la interfaz para adapters que extraen documentos
 * de diferentes fuentes (sheets, transcripts, files, etc.)
 */

export interface Document {
  path: string;
  content: string;
  metadata: Record<string, any>;
}

/**
 * Interface base para adapters de documentos
 */
export interface DocumentAdapter {
  /**
   * Extrae documentos de la fuente
   */
  extractDocuments(): Promise<Document[]>;
  
  /**
   * Obtiene el contenido de un documento
   */
  getDocumentContent(doc: Document): Promise<string>;
  
  /**
   * Obtiene metadata de un documento
   */
  getDocumentMetadata(doc: Document): Record<string, any>;
  
  /**
   * Nombre del adapter para logging
   */
  getName(): string;
}


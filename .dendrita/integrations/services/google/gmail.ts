/**
 * Servicio de Gmail para buscar, leer y enviar emails
 */

import { BaseService } from '../base/service.interface';
import { GoogleAuth } from './auth';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Gmail');

export interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  date: Date;
}

/**
 * Email completo con todos los metadatos extraídos de Gmail API
 */
export interface FullEmailMetadata {
  // IDs de Gmail
  gmail_message_id: string;
  gmail_thread_id: string;
  gmail_history_id?: string;
  gmail_size_estimate?: number;
  
  // Información básica
  subject?: string;
  snippet?: string;
  
  // Remitentes y destinatarios
  from_email?: string;
  from_name?: string;
  to_emails?: string[];
  to_names?: string[];
  cc_emails?: string[];
  cc_names?: string[];
  bcc_emails?: string[];
  bcc_names?: string[];
  reply_to?: string;
  
  // Fechas
  date_sent?: Date;
  date_received?: Date;
  
  // Contenido
  body_text?: string;
  body_html?: string;
  body_html_sanitized?: string;
  
  // Etiquetas
  labels?: string[];
  is_starred?: boolean;
  is_important?: boolean;
  is_read?: boolean;
  is_sent?: boolean;
  is_draft?: boolean;
  is_trash?: boolean;
  is_spam?: boolean;
  
  // Información del hilo
  thread_size?: number;
  thread_history_id?: string;
  
  // Adjuntos
  has_attachments?: boolean;
  attachment_count?: number;
  attachment_info?: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  
  // Headers personalizados
  custom_headers?: Record<string, string>;
  
  // Metadatos completos (respuesta completa de Gmail API)
  full_metadata?: any;
}

export class GmailService extends BaseService {
  name = 'Gmail';
  private accessToken?: string;

  async authenticate(): Promise<void> {
    try {
      logger.info('Authenticating with Gmail...');

      if (!GoogleAuth.isConfigured()) {
        throw new Error('Google Workspace credentials not configured');
      }

      this.accessToken = await GoogleAuth.refreshAccessToken();
      logger.info('Gmail authentication successful');
    } catch (error) {
      logger.error('Gmail authentication failed', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return GoogleAuth.isConfigured();
  }

  /**
   * Busca emails usando Gmail search syntax
   * Ej: "from:cliente@example.com after:2024-01-01"
   */
  async searchEmails(query: string, maxResults: number = 10): Promise<Email[]> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Searching emails with query: "${query}"`);

      const url = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const messageIds = data.messages || [];

      // Obtener detalles de cada mensaje
      const emails: Email[] = [];
      for (const msg of messageIds.slice(0, maxResults)) {
        try {
          const email = await this.getEmail(msg.id);
          emails.push(email);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.warn(`Failed to fetch email ${msg.id}: ${errorMsg}`);
        }
      }

      logger.info(`Found ${emails.length} emails`);
      return emails;
    } catch (error) {
      logger.error('Email search failed', error);
      throw error;
    }
  }

  /**
   * Obtiene un email específico con todos los metadatos
   */
  async getFullEmailMetadata(messageId: string): Promise<FullEmailMetadata> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug(`Fetching full email metadata: ${messageId}`);

      const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
      }

      const message = await response.json();
      const headers = message.payload?.headers || [];
      
      const getHeader = (name: string): string => {
        const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return header?.value || '';
      };

      // Parsear email addresses
      const parseEmailAddress = (value: string): { email: string; name?: string } => {
        const match = value.match(/^(.+?)\s*<(.+?)>$|^(.+?)$/);
        if (match) {
          if (match[1] && match[2]) {
            return { name: match[1].trim(), email: match[2].trim() };
          }
          return { email: match[3] || match[1] || value.trim() };
        }
        return { email: value.trim() };
      };

      const parseEmailAddressList = (value: string): { emails: string[]; names: string[] } => {
        if (!value) return { emails: [], names: [] };
        const addresses = value.split(',').map(addr => parseEmailAddress(addr.trim()));
        return {
          emails: addresses.map(a => a.email).filter(Boolean),
          names: addresses.map(a => a.name || '').filter(Boolean),
        };
      };

      // Extraer cuerpo del mensaje
      let bodyText = '';
      let bodyHtml = '';
      const extractBody = (part: any): void => {
        if (part.body?.data) {
          const decoded = Buffer.from(part.body.data, 'base64').toString('utf-8');
          if (part.mimeType === 'text/html') {
            bodyHtml += decoded;
          } else if (part.mimeType === 'text/plain') {
            bodyText += decoded;
          } else {
            bodyText += decoded;
          }
        }
        if (part.parts) {
          part.parts.forEach((p: any) => extractBody(p));
        }
      };
      extractBody(message.payload);

      // Extraer información de adjuntos
      const attachments: Array<{ filename: string; mimeType: string; size: number; attachmentId: string }> = [];
      const extractAttachments = (part: any): void => {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType || 'application/octet-stream',
            size: part.body.size || 0,
            attachmentId: part.body.attachmentId,
          });
        }
        if (part.parts) {
          part.parts.forEach((p: any) => extractAttachments(p));
        }
      };
      extractAttachments(message.payload);

      // Extraer headers personalizados (X-*)
      const customHeaders: Record<string, string> = {};
      headers.forEach((h: any) => {
        if (h.name.toLowerCase().startsWith('x-')) {
          customHeaders[h.name] = h.value;
        }
      });

      // Parsear destinatarios
      const toList = parseEmailAddressList(getHeader('To'));
      const ccList = parseEmailAddressList(getHeader('Cc'));
      const bccList = parseEmailAddressList(getHeader('Bcc'));
      const fromAddr = parseEmailAddress(getHeader('From'));

      // Parsear fecha
      const dateHeader = getHeader('Date');
      const dateSent = dateHeader ? new Date(dateHeader) : undefined;
      const dateReceived = message.internalDate ? new Date(parseInt(message.internalDate)) : undefined;

      // Determinar etiquetas y flags
      const labelIds = message.labelIds || [];
      const isStarred = labelIds.includes('STARRED');
      const isImportant = labelIds.includes('IMPORTANT');
      const isRead = !labelIds.includes('UNREAD');
      const isSent = labelIds.includes('SENT');
      const isDraft = labelIds.includes('DRAFT');
      const isTrash = labelIds.includes('TRASH');
      const isSpam = labelIds.includes('SPAM');

      const metadata: FullEmailMetadata = {
        gmail_message_id: message.id,
        gmail_thread_id: message.threadId,
        gmail_history_id: message.historyId,
        gmail_size_estimate: message.sizeEstimate,
        
        subject: getHeader('Subject'),
        snippet: message.snippet,
        
        from_email: fromAddr.email,
        from_name: fromAddr.name,
        to_emails: toList.emails,
        to_names: toList.names,
        cc_emails: ccList.emails,
        cc_names: ccList.names,
        bcc_emails: bccList.emails,
        bcc_names: bccList.names,
        reply_to: getHeader('Reply-To'),
        
        date_sent: dateSent,
        date_received: dateReceived,
        
        body_text: bodyText || undefined,
        body_html: bodyHtml || undefined,
        body_html_sanitized: bodyHtml ? bodyHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : undefined,
        
        labels: labelIds,
        is_starred: isStarred,
        is_important: isImportant,
        is_read: isRead,
        is_sent: isSent,
        is_draft: isDraft,
        is_trash: isTrash,
        is_spam: isSpam,
        
        has_attachments: attachments.length > 0,
        attachment_count: attachments.length,
        attachment_info: attachments.length > 0 ? attachments : undefined,
        
        custom_headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
        
        full_metadata: message,
      };

      return metadata;
    } catch (error) {
      logger.error('Failed to fetch full email metadata', error);
      throw error;
    }
  }

  /**
   * Obtiene un email específico por ID (método simplificado, mantiene compatibilidad)
   */
  async getEmail(messageId: string): Promise<Email> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug(`Fetching email: ${messageId}`);

      const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
      }

      // Usar el método completo y simplificar
      const fullMetadata = await this.getFullEmailMetadata(messageId);
      
      const email: Email = {
        id: fullMetadata.gmail_message_id,
        threadId: fullMetadata.gmail_thread_id,
        from: fullMetadata.from_name ? `${fullMetadata.from_name} <${fullMetadata.from_email}>` : (fullMetadata.from_email || ''),
        to: fullMetadata.to_emails || [],
        subject: fullMetadata.subject || '',
        body: fullMetadata.body_text || fullMetadata.body_html || '',
        date: fullMetadata.date_received || fullMetadata.date_sent || new Date(),
      };

      return email;
    } catch (error) {
      logger.error('Failed to fetch email', error);
      throw error;
    }
  }

  /**
   * Envía un email
   */
  async sendEmail(to: string[], subject: string, body: string): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.info(`Sending email to: ${to.join(', ')}`);

      // Construir el mensaje en formato RFC 2822
      const messageLines = [
        `To: ${to.join(', ')}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        body,
      ];
      const rawMessage = messageLines.join('\n');
      const encodedMessage = Buffer.from(rawMessage).toString('base64url');

      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedMessage,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
      }

      logger.info('Email sent successfully');
    } catch (error) {
      logger.error('Failed to send email', error);
      throw error;
    }
  }

  /**
   * Lista todas las etiquetas del usuario
   */
  async listLabels(): Promise<Array<{ id: string; name: string; type: string }>> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug('Listing Gmail labels...');

      const url = 'https://www.googleapis.com/gmail/v1/users/me/labels';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const labels = (data.labels || []).map((label: any) => ({
        id: label.id,
        name: label.name,
        type: label.type || 'user',
      }));

      logger.debug(`Found ${labels.length} labels`);
      return labels;
    } catch (error) {
      logger.error('Failed to list labels', error);
      throw error;
    }
  }

  /**
   * Busca o crea una etiqueta por nombre
   * Retorna el ID de la etiqueta
   */
  async findOrCreateLabel(labelName: string): Promise<string> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug(`Finding or creating label: "${labelName}"`);

      // Primero buscar si existe
      const labels = await this.listLabels();
      const existingLabel = labels.find((l) => l.name === labelName);

      if (existingLabel) {
        logger.debug(`Label "${labelName}" already exists with ID: ${existingLabel.id}`);
        return existingLabel.id;
      }

      // Si no existe, crearla
      logger.debug(`Creating new label: "${labelName}"`);

      const url = 'https://www.googleapis.com/gmail/v1/users/me/labels';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
      }

      const label = await response.json();
      logger.info(`Created label "${labelName}" with ID: ${label.id}`);
      return label.id;
    } catch (error) {
      logger.error(`Failed to find or create label "${labelName}"`, error);
      throw error;
    }
  }

  /**
   * Aplica una etiqueta a un mensaje
   * @param messageId ID del mensaje
   * @param labelId ID de la etiqueta a aplicar
   */
  async addLabelToMessage(messageId: string, labelId: string): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug(`Adding label ${labelId} to message ${messageId}`);

      const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addLabelIds: [labelId],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
      }

      logger.debug(`Label ${labelId} added to message ${messageId}`);
    } catch (error) {
      logger.error(`Failed to add label to message ${messageId}`, error);
      throw error;
    }
  }

  /**
   * Aplica una etiqueta a un mensaje por nombre de etiqueta
   * Busca o crea la etiqueta si no existe
   * @param messageId ID del mensaje
   * @param labelName Nombre de la etiqueta
   */
  async addLabelToMessageByName(messageId: string, labelName: string): Promise<void> {
    try {
      const labelId = await this.findOrCreateLabel(labelName);
      await this.addLabelToMessage(messageId, labelId);
      logger.debug(`Label "${labelName}" applied to message ${messageId}`);
    } catch (error) {
      logger.error(`Failed to add label "${labelName}" to message ${messageId}`, error);
      throw error;
    }
  }

  /**
   * Aplica una etiqueta a un hilo completo
   * @param threadId ID del hilo
   * @param labelId ID de la etiqueta a aplicar
   */
  async addLabelToThread(threadId: string, labelId: string): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      logger.debug(`Adding label ${labelId} to thread ${threadId}`);

      const url = `https://www.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addLabelIds: [labelId],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
      }

      logger.debug(`Label ${labelId} added to thread ${threadId}`);
    } catch (error) {
      logger.error(`Failed to add label to thread ${threadId}`, error);
      throw error;
    }
  }

  /**
   * Aplica una etiqueta a un hilo completo por nombre de etiqueta
   * @param threadId ID del hilo
   * @param labelName Nombre de la etiqueta
   */
  async addLabelToThreadByName(threadId: string, labelName: string): Promise<void> {
    try {
      const labelId = await this.findOrCreateLabel(labelName);
      await this.addLabelToThread(threadId, labelId);
      logger.debug(`Label "${labelName}" applied to thread ${threadId}`);
    } catch (error) {
      logger.error(`Failed to add label "${labelName}" to thread ${threadId}`, error);
      throw error;
    }
  }
}

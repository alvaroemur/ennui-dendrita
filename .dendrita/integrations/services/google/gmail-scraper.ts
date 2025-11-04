/**
 * Servicio de scraping de Gmail
 * Extrae emails con todos los metadatos y los guarda en Supabase
 * Configurable por perfil de usuario, idempotente y etiqueta automáticamente con el nombre del sistema dendrita
 */

import { GmailService, FullEmailMetadata } from './gmail';
import { SupabaseService } from '../supabase/client';
import { createLogger } from '../../utils/logger';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('GmailScraper');

export interface GmailScrapingConfig {
  user_id: string;
  profile_id?: string;
  config_name: string; // Nombre descriptivo de la configuración
  enabled?: boolean;
  search_query: string; // Query de búsqueda de Gmail (ej: "from:cliente@example.com after:2024-01-01")
  max_results?: number;
  page_token?: string; // Token de paginación para continuar desde donde se quedó
  date_min?: string; // Fecha mínima (opcional, si no está en search_query)
  date_max?: string; // Fecha máxima (opcional, si no está en search_query)
  extract_attachments?: boolean;
  extract_labels?: boolean;
  extract_threads?: boolean;
  extract_full_body?: boolean;
  extract_metadata?: boolean;
  auto_label?: boolean; // Aplicar etiqueta automáticamente con el nombre del sistema dendrita
}

export interface GmailScrapingResult {
  config: GmailScrapingConfig;
  emails_processed: number;
  emails_created: number;
  emails_updated: number;
  threads_created: number;
  threads_updated: number;
  attachments_created: number;
  labels_applied: number;
  errors: string[];
  duration_ms: number;
}

export class GmailScraper {
  private gmailService: GmailService;
  private supabaseService: SupabaseService;
  private db: ReturnType<SupabaseService['db']>;
  private dendritaLabelName?: string; // Nombre de la etiqueta del sistema dendrita
  private workspaceLabelName?: string; // Nombre de la etiqueta del workspace (jerárquica: dendrita/workspace)

  constructor() {
    this.gmailService = new GmailService();
    this.supabaseService = new SupabaseService();
    this.db = this.supabaseService.db(true); // Usar service role para escritura
  }

  /**
   * Inicializa el scraper verificando configuraciones
   */
  async initialize(): Promise<void> {
    if (!this.gmailService.isConfigured()) {
      throw new Error('Gmail credentials not configured');
    }
    if (!this.supabaseService.isConfigured()) {
      throw new Error('Supabase credentials not configured');
    }

    await this.gmailService.authenticate();
    logger.info('Gmail scraper initialized');
  }

  /**
   * Carga el nombre del sistema dendrita y el workspace del perfil del usuario
   */
  private async loadDendritaAndWorkspace(userId: string, profileId?: string): Promise<{
    dendritaName?: string;
    workspace?: string;
  }> {
    try {
      // Intentar leer el perfil del usuario desde el sistema de archivos
      const profilePath = profileId
        ? `.dendrita/users/${userId}/profiles/${profileId}.json`
        : `.dendrita/users/${userId}/profile.json`;

      if (fs.existsSync(profilePath)) {
        const profileContent = fs.readFileSync(profilePath, 'utf-8');
        const profile = JSON.parse(profileContent);
        const dendritaName = profile.dendrita_name || profile.dendrita_alias;
        const workspace = profile.workspace || profile.primary_workspace;
        
        if (dendritaName) {
          logger.debug(`Loaded dendrita name from profile: ${dendritaName}`);
        }
        if (workspace) {
          logger.debug(`Loaded workspace from profile: ${workspace}`);
        }
        
        return { dendritaName, workspace };
      }

      logger.warn(`No profile found for user ${userId}`);
      return {};
    } catch (error) {
      logger.error(`Failed to load profile for user ${userId}`, error);
      return {};
    }
  }

  /**
   * Carga configuración de scraping desde archivo local del workspace
   * Paradigma de .dendrita: configuración en workspaces/[workspace]/scrapers-config.json
   */
  async loadConfigFromWorkspace(workspace: string, userId?: string, profileId?: string): Promise<GmailScrapingConfig[]> {
    try {
      const projectRoot = path.resolve(__dirname, '../../../..');
      const configPath = path.join(projectRoot, 'workspaces', workspace, 'scrapers-config.json');
      
      if (!fs.existsSync(configPath)) {
        logger.warn(`No scrapers-config.json found for workspace ${workspace}`);
        return [];
      }
      
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      if (!config.gmail || !config.gmail.configs) {
        logger.warn(`No gmail configuration found in scrapers-config.json for workspace ${workspace}`);
        return [];
      }
      
      // Cargar nombre del sistema dendrita y workspace para etiquetado automático
      if (userId && profileId) {
        const { dendritaName, workspace: workspaceFromProfile } = await this.loadDendritaAndWorkspace(userId, profileId);
        this.dendritaLabelName = dendritaName;
        
        // Crear etiqueta jerárquica del workspace si existe
        if (dendritaName && workspaceFromProfile) {
          this.workspaceLabelName = `${dendritaName}/${workspaceFromProfile}`;
          logger.debug(`Workspace label will be: ${this.workspaceLabelName}`);
        }
      }
      
      return config.gmail.configs.map((cfg: any) => ({
        user_id: userId || 'unknown',
        profile_id: profileId,
        config_name: cfg.config_name,
        enabled: cfg.enabled ?? true,
        search_query: cfg.search_query,
        max_results: cfg.max_results ?? 500,
        page_token: cfg.page_token || undefined,
        date_min: cfg.date_min || undefined,
        date_max: cfg.date_max || undefined,
        extract_attachments: cfg.extract_attachments ?? false,
        extract_labels: cfg.extract_labels ?? true,
        extract_threads: cfg.extract_threads ?? true,
        extract_full_body: cfg.extract_full_body ?? true,
        extract_metadata: cfg.extract_metadata ?? true,
        auto_label: cfg.auto_label !== false, // Habilitado por defecto
      }));
    } catch (error) {
      logger.error('Failed to load config from workspace', error);
      throw error;
    }
  }

  /**
   * @deprecated Use loadConfigFromWorkspace() instead. Kept for backward compatibility.
   * Carga configuración de scraping desde perfil de usuario
   */
  async loadConfigFromProfile(userId: string, profileId?: string): Promise<GmailScrapingConfig[]> {
    // Intentar obtener workspace del perfil
    const { workspace } = await this.loadDendritaAndWorkspace(userId, profileId);
    if (workspace) {
      return this.loadConfigFromWorkspace(workspace, userId, profileId);
    }
    logger.warn(`loadConfigFromProfile called without workspace. Use loadConfigFromWorkspace() instead.`);
    return [];
  }

  /**
   * Guarda o actualiza configuración de scraping en archivo local del workspace
   * Paradigma de .dendrita: configuración en workspaces/[workspace]/scrapers-config.json
   */
  async saveConfig(workspace: string, configs: GmailScrapingConfig[]): Promise<void> {
    try {
      const projectRoot = path.resolve(__dirname, '../../../..');
      const configPath = path.join(projectRoot, 'workspaces', workspace, 'scrapers-config.json');
      const workspaceDir = path.dirname(configPath);
      
      // Crear directorio si no existe
      if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
      }
      
      // Cargar configuración existente o crear nueva
      let config: any = {};
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
      } else {
        config.workspace = workspace;
        config.drive = { configs: [] };
        config.gmail = { configs: [] };
      }
      
      // Actualizar sección de gmail
      if (!config.gmail) {
        config.gmail = { configs: [] };
      }
      
      // Actualizar configuraciones de gmail
      config.gmail.configs = configs.map(cfg => ({
        config_name: cfg.config_name,
        enabled: cfg.enabled ?? true,
        search_query: cfg.search_query,
        max_results: cfg.max_results ?? 500,
        page_token: cfg.page_token || undefined,
        date_min: cfg.date_min || undefined,
        date_max: cfg.date_max || undefined,
        extract_attachments: cfg.extract_attachments ?? false,
        extract_labels: cfg.extract_labels ?? true,
        extract_threads: cfg.extract_threads ?? true,
        extract_full_body: cfg.extract_full_body ?? true,
        extract_metadata: cfg.extract_metadata ?? true,
        auto_label: cfg.auto_label !== false,
      }));
      
      // Actualizar metadata
      config.metadata = {
        ...config.metadata,
        last_updated: new Date().toISOString(),
      };
      
      // Guardar archivo
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      logger.info(`Config saved for workspace ${workspace} in ${configPath}`);
    } catch (error) {
      logger.error('Failed to save config', error);
      throw error;
    }
  }

  /**
   * @deprecated Use saveConfig() instead. Kept for backward compatibility.
   * Crea o actualiza configuración de scraping
   */
  async upsertConfig(config: GmailScrapingConfig): Promise<void> {
    // Necesitamos obtener el workspace del perfil
    const { workspace } = await this.loadDendritaAndWorkspace(config.user_id, config.profile_id);
    if (!workspace) {
      throw new Error('Workspace is required for Gmail scraper config');
    }
    await this.saveConfig(workspace, [config]);
  }

  /**
   * Calcula hash de un email para detectar cambios
   */
  private calculateEmailHash(email: FullEmailMetadata): string {
    const hashable = {
      subject: email.subject || '',
      from_email: email.from_email || '',
      to_emails: JSON.stringify(email.to_emails || []),
      date_sent: email.date_sent?.toISOString() || '',
      date_received: email.date_received?.toISOString() || '',
      body_text: email.body_text?.substring(0, 1000) || '', // Limitar tamaño para hash
      labels: JSON.stringify(email.labels || []),
      snippet: email.snippet || '',
    };

    const hashInput = JSON.stringify(hashable);
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Procesa un email y lo guarda en Supabase
   */
  private async processEmail(
    config: GmailScrapingConfig,
    emailMetadata: FullEmailMetadata,
    configId?: string
  ): Promise<{
    emailId: string;
    created: boolean;
    updated: boolean;
    labeled: boolean;
  }> {
    try {
      const syncHash = this.calculateEmailHash(emailMetadata);

      // Buscar email existente
      const { data: existingEmail, error: findError } = await this.db
        .from('gmail_emails')
        .select('id, sync_hash, deleted_at')
        .eq('user_id', config.user_id)
        .eq('gmail_message_id', emailMetadata.gmail_message_id)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      const emailData: any = {
        user_id: config.user_id,
        profile_id: config.profile_id || null,
        config_id: configId || null,
        gmail_message_id: emailMetadata.gmail_message_id,
        gmail_thread_id: emailMetadata.gmail_thread_id,
        gmail_history_id: emailMetadata.gmail_history_id || null,
        gmail_size_estimate: emailMetadata.gmail_size_estimate || null,
        subject: emailMetadata.subject || null,
        snippet: emailMetadata.snippet || null,
        from_email: emailMetadata.from_email || null,
        from_name: emailMetadata.from_name || null,
        to_emails: emailMetadata.to_emails || [],
        to_names: emailMetadata.to_names || [],
        cc_emails: emailMetadata.cc_emails || [],
        cc_names: emailMetadata.cc_names || [],
        bcc_emails: emailMetadata.bcc_emails || [],
        bcc_names: emailMetadata.bcc_names || [],
        reply_to: emailMetadata.reply_to || null,
        date_sent: emailMetadata.date_sent?.toISOString() || null,
        date_received: emailMetadata.date_received?.toISOString() || null,
        body_text: config.extract_full_body ? (emailMetadata.body_text || null) : null,
        body_html: config.extract_full_body ? (emailMetadata.body_html || null) : null,
        body_html_sanitized: config.extract_full_body ? (emailMetadata.body_html_sanitized || null) : null,
        labels: config.extract_labels ? (emailMetadata.labels || []) : [],
        is_starred: emailMetadata.is_starred ?? false,
        is_important: emailMetadata.is_important ?? false,
        is_read: emailMetadata.is_read ?? false,
        is_sent: emailMetadata.is_sent ?? false,
        is_draft: emailMetadata.is_draft ?? false,
        is_trash: emailMetadata.is_trash ?? false,
        is_spam: emailMetadata.is_spam ?? false,
        thread_size: emailMetadata.thread_size || null,
        thread_history_id: emailMetadata.thread_history_id || null,
        has_attachments: emailMetadata.has_attachments ?? false,
        attachment_count: emailMetadata.attachment_count || 0,
        attachment_info: config.extract_attachments && emailMetadata.attachment_info
          ? emailMetadata.attachment_info
          : null,
        custom_headers: emailMetadata.custom_headers || null,
        full_metadata: config.extract_metadata ? emailMetadata.full_metadata || {} : {},
        sync_hash: syncHash,
        last_synced_at: new Date().toISOString(),
        deleted_at: null, // Restaurar si estaba eliminado
        updated_at: new Date().toISOString(),
      };

      let emailId: string;
      let created = false;
      let updated = false;
      let labeled = false;

      if (existingEmail) {
        // Verificar si hay cambios
        if (existingEmail.sync_hash !== syncHash) {
          // Actualizar email existente
          const { data: updatedEmail, error: updateError } = await this.db
            .from('gmail_emails')
            .update(emailData)
            .eq('id', existingEmail.id)
            .select('id')
            .single();

          if (updateError) throw updateError;
          emailId = updatedEmail.id;
          updated = true;
        } else {
          // Sin cambios, no actualizar
          emailId = existingEmail.id;
        }
      } else {
        // Crear nuevo email
        const { data: newEmail, error: createError } = await this.db
          .from('gmail_emails')
          .insert(emailData)
          .select('id')
          .single();

        if (createError) throw createError;
        emailId = newEmail.id;
        created = true;
      }

      // Aplicar etiquetas automáticamente si está configurado
      if (config.auto_label && this.dendritaLabelName) {
        try {
          // Aplicar etiqueta del sistema dendrita
          await this.gmailService.addLabelToMessageByName(
            emailMetadata.gmail_message_id,
            this.dendritaLabelName
          );
          labeled = true;
          logger.debug(`Label "${this.dendritaLabelName}" applied to email ${emailMetadata.gmail_message_id}`);
          
          // Aplicar etiqueta del workspace si existe
          if (this.workspaceLabelName) {
            await this.gmailService.addLabelToMessageByName(
              emailMetadata.gmail_message_id,
              this.workspaceLabelName
            );
            logger.debug(`Workspace label "${this.workspaceLabelName}" applied to email ${emailMetadata.gmail_message_id}`);
          }
        } catch (error) {
          logger.warn(`Failed to apply label to email ${emailMetadata.gmail_message_id}`, error);
        }
      }

      // Procesar adjuntos si está configurado
      if (config.extract_attachments && emailMetadata.attachment_info) {
        for (const attachment of emailMetadata.attachment_info) {
          await this.processAttachment(emailId, attachment);
        }
      }

      return { emailId, created, updated, labeled };
    } catch (error) {
      logger.error(`Failed to process email ${emailMetadata.gmail_message_id}`, error);
      throw error;
    }
  }

  /**
   * Procesa un adjunto
   */
  private async processAttachment(
    emailId: string,
    attachment: { filename: string; mimeType: string; size: number; attachmentId: string }
  ): Promise<void> {
    try {
      const attachmentData: any = {
        email_id: emailId,
        gmail_attachment_id: attachment.attachmentId,
        filename: attachment.filename,
        mime_type: attachment.mimeType,
        size_bytes: attachment.size,
        downloaded: false,
        updated_at: new Date().toISOString(),
      };

      await this.db
        .from('gmail_attachments')
        .upsert(attachmentData, {
          onConflict: 'email_id,gmail_attachment_id',
        });
    } catch (error) {
      logger.error(`Failed to process attachment ${attachment.attachmentId}`, error);
      throw error;
    }
  }

  /**
   * Procesa un hilo de conversación
   */
  private async processThread(
    config: GmailScrapingConfig,
    threadId: string,
    emails: FullEmailMetadata[]
  ): Promise<{
    threadId: string;
    created: boolean;
    updated: boolean;
    labeled: boolean;
  }> {
    try {
      if (!config.extract_threads || emails.length === 0) {
        return { threadId, created: false, updated: false, labeled: false };
      }

      // Calcular estadísticas del hilo
      const participants = new Set<string>();
      const participantNames = new Map<string, string>();
      const allLabels = new Set<string>();
      let lastMessageDate: Date | null = null;
      let firstMessageDate: Date | null = null;
      let unreadCount = 0;

      for (const email of emails) {
        if (email.from_email) {
          participants.add(email.from_email);
          if (email.from_name) {
            participantNames.set(email.from_email, email.from_name);
          }
        }
        (email.to_emails || []).forEach(email => participants.add(email));
        (email.labels || []).forEach(label => allLabels.add(label));
        
        const emailDate = email.date_received || email.date_sent;
        if (emailDate) {
          if (!lastMessageDate || emailDate > lastMessageDate) {
            lastMessageDate = emailDate;
          }
          if (!firstMessageDate || emailDate < firstMessageDate) {
            firstMessageDate = emailDate;
          }
        }
        if (!email.is_read) {
          unreadCount++;
        }
      }

      const syncHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          participants: Array.from(participants).sort(),
          message_count: emails.length,
          last_message: lastMessageDate?.toISOString(),
        }))
        .digest('hex');

      // Buscar hilo existente
      const { data: existingThread } = await this.db
        .from('gmail_threads')
        .select('id, sync_hash')
        .eq('user_id', config.user_id)
        .eq('gmail_thread_id', threadId)
        .maybeSingle();

      const threadData: any = {
        user_id: config.user_id,
        profile_id: config.profile_id || null,
        gmail_thread_id: threadId,
        subject: emails[0]?.subject || null,
        participants: Array.from(participants),
        participant_names: Array.from(participants).map(email => participantNames.get(email) || ''),
        message_count: emails.length,
        unread_count: unreadCount,
        last_message_date: lastMessageDate?.toISOString() || null,
        first_message_date: firstMessageDate?.toISOString() || null,
        labels: Array.from(allLabels),
        full_metadata: {},
        sync_hash: syncHash,
        last_synced_at: new Date().toISOString(),
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };

      let created = false;
      let updated = false;
      let labeled = false;

      if (existingThread) {
        if (existingThread.sync_hash !== syncHash) {
          await this.db
            .from('gmail_threads')
            .update(threadData)
            .eq('id', existingThread.id);
          updated = true;
        }
      } else {
        await this.db
          .from('gmail_threads')
          .insert(threadData);
        created = true;
      }

      // Aplicar etiquetas al hilo si está configurado
      if (config.auto_label && this.dendritaLabelName) {
        try {
          // Aplicar etiqueta del sistema dendrita
          await this.gmailService.addLabelToThreadByName(threadId, this.dendritaLabelName);
          labeled = true;
          logger.debug(`Label "${this.dendritaLabelName}" applied to thread ${threadId}`);
          
          // Aplicar etiqueta del workspace si existe
          if (this.workspaceLabelName) {
            await this.gmailService.addLabelToThreadByName(threadId, this.workspaceLabelName);
            logger.debug(`Workspace label "${this.workspaceLabelName}" applied to thread ${threadId}`);
          }
        } catch (error) {
          logger.warn(`Failed to apply label to thread ${threadId}`, error);
        }
      }

      return { threadId, created, updated, labeled };
    } catch (error) {
      logger.error(`Failed to process thread ${threadId}`, error);
      throw error;
    }
  }

  /**
   * Ejecuta scraping para una configuración específica
   */
  async scrape(config: GmailScrapingConfig): Promise<GmailScrapingResult> {
    const startTime = Date.now();
    const result: GmailScrapingResult = {
      config,
      emails_processed: 0,
      emails_created: 0,
      emails_updated: 0,
      threads_created: 0,
      threads_updated: 0,
      attachments_created: 0,
      labels_applied: 0,
      errors: [],
      duration_ms: 0,
    };

    try {
      logger.info(`Starting scrape for user ${config.user_id}, config ${config.config_name}`);

      // Cargar nombre del sistema dendrita y workspace si no están cargados
      if (config.auto_label && !this.dendritaLabelName) {
        const { dendritaName, workspace } = await this.loadDendritaAndWorkspace(config.user_id, config.profile_id);
        this.dendritaLabelName = dendritaName;
        
        // Crear etiqueta jerárquica del workspace si existe
        if (dendritaName && workspace) {
          this.workspaceLabelName = `${dendritaName}/${workspace}`;
          logger.debug(`Workspace label will be: ${this.workspaceLabelName}`);
        }
        
        if (!this.dendritaLabelName) {
          logger.warn('Auto-label enabled but dendrita_name not found in profile');
        }
      }

      // Obtener configuración de Supabase para obtener el config_id
      const { data: configData } = await this.db
        .from('gmail_scraping_configs')
        .select('id')
        .eq('user_id', config.user_id)
        .eq('profile_id', config.profile_id || null)
        .eq('config_name', config.config_name)
        .maybeSingle();

      const configId = configData?.id;

      // Construir query de búsqueda
      let searchQuery = config.search_query;
      if (config.date_min && !searchQuery.includes('after:')) {
        const dateMin = new Date(config.date_min).toISOString().split('T')[0];
        searchQuery = `${searchQuery} after:${dateMin}`;
      }
      if (config.date_max && !searchQuery.includes('before:')) {
        const dateMax = new Date(config.date_max).toISOString().split('T')[0];
        searchQuery = `${searchQuery} before:${dateMax}`;
      }

      // Buscar emails
      const maxResults = config.max_results || 500;
      let pageToken = config.page_token;

      // Agrupar emails por thread para procesar hilos
      const threadsMap = new Map<string, FullEmailMetadata[]>();

      do {
        // Asegurar autenticación
        await this.gmailService.authenticate();
        
        // Obtener access token desde GmailService (necesitamos acceso al token privado)
        // Como accessToken es privado, usamos una forma de accederlo
        const accessToken = (this.gmailService as any).accessToken;
        if (!accessToken) {
          throw new Error('Gmail authentication failed - no access token');
        }
        
        const url = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=${Math.min(maxResults, 500)}${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const messageIds = data.messages || [];
        pageToken = data.nextPageToken;

        logger.info(`Found ${messageIds.length} messages in this batch`);

        // Procesar cada mensaje
        for (const msg of messageIds) {
          try {
            result.emails_processed++;

            // Obtener metadatos completos del email
            const emailMetadata = await this.gmailService.getFullEmailMetadata(msg.id);

            // Agrupar por thread
            const threadId = emailMetadata.gmail_thread_id;
            if (!threadsMap.has(threadId)) {
              threadsMap.set(threadId, []);
            }
            threadsMap.get(threadId)!.push(emailMetadata);

            // Procesar y guardar email
            const { created, updated, labeled } = await this.processEmail(
              config,
              emailMetadata,
              configId
            );

            if (created) {
              result.emails_created++;
            } else if (updated) {
              result.emails_updated++;
            }
            if (labeled) {
              result.labels_applied++;
            }

            // Contar adjuntos
            if (emailMetadata.attachment_info) {
              result.attachments_created += emailMetadata.attachment_info.length;
            }
          } catch (error: any) {
            const errorMsg = `Error processing email ${msg.id}: ${error.message}`;
            logger.error(errorMsg, error);
            result.errors.push(errorMsg);
          }
        }

        // Continuar si hay más páginas y no hemos alcanzado el límite
        if (pageToken && result.emails_processed < maxResults) {
          logger.info(`Continuing with next page, token: ${pageToken.substring(0, 20)}...`);
        } else {
          break;
        }
      } while (pageToken && result.emails_processed < maxResults);

      // Procesar hilos
      if (config.extract_threads) {
        for (const [threadId, emails] of threadsMap.entries()) {
          try {
            const { created, updated, labeled } = await this.processThread(config, threadId, emails);
            if (created) {
              result.threads_created++;
            } else if (updated) {
              result.threads_updated++;
            }
            if (labeled) {
              result.labels_applied++;
            }
          } catch (error: any) {
            const errorMsg = `Error processing thread ${threadId}: ${error.message}`;
            logger.error(errorMsg, error);
            result.errors.push(errorMsg);
          }
        }
      }

      // Actualizar estado de sincronización
      await this.updateSyncStatus(config, 'success', null, result.emails_processed, pageToken);

      result.duration_ms = Date.now() - startTime;
      logger.info(
        `Scrape completed: ${result.emails_processed} processed, ${result.emails_created} created, ${result.emails_updated} updated, ${result.labels_applied} labels applied`
      );

      return result;
    } catch (error: any) {
      const errorMsg = `Scrape failed: ${error.message}`;
      logger.error(errorMsg, error);
      result.errors.push(errorMsg);
      result.duration_ms = Date.now() - startTime;

      await this.updateSyncStatus(config, 'error', errorMsg, result.emails_processed, undefined);
      throw error;
    }
  }

  /**
   * Actualiza estado de sincronización
   */
  private async updateSyncStatus(
    config: GmailScrapingConfig,
    status: string,
    error: string | null,
    messageCount: number,
    pageToken?: string
  ): Promise<void> {
    try {
      await this.db
        .from('gmail_scraping_configs')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: status,
          last_sync_error: error,
          last_sync_message_count: messageCount,
          page_token: pageToken || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', config.user_id)
        .eq('profile_id', config.profile_id || null)
        .eq('config_name', config.config_name);
    } catch (error) {
      logger.error('Failed to update sync status', error);
    }
  }

  /**
   * Ejecuta scraping para un usuario y perfil específicos
   */
  async scrapeForUser(userId: string, profileId?: string): Promise<GmailScrapingResult[]> {
    // Obtener workspace del perfil
    const { workspace } = await this.loadDendritaAndWorkspace(userId, profileId);
    if (!workspace) {
      throw new Error('Workspace is required for Gmail scraper');
    }
    const configs = await this.loadConfigFromWorkspace(workspace, userId, profileId);

    if (configs.length === 0) {
      logger.warn(`No scraping configs found for user ${userId}`);
      return [];
    }

    const results: GmailScrapingResult[] = [];

    for (const config of configs) {
      if (!config.enabled) {
        logger.info(`Skipping disabled config ${config.config_name}`);
        continue;
      }

      try {
        const result = await this.scrape(config);
        results.push(result);
      } catch (error: any) {
        logger.error(`Failed to scrape config ${config.config_name}`, error);
        results.push({
          config,
          emails_processed: 0,
          emails_created: 0,
          emails_updated: 0,
          threads_created: 0,
          threads_updated: 0,
          attachments_created: 0,
          labels_applied: 0,
          errors: [error.message],
          duration_ms: 0,
        });
      }
    }

    return results;
  }
}


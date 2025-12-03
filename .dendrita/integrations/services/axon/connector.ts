/**
 * Servicio para acceder a datos de Axon desde ennui-dendrita
 * Axon es una Chrome extension que hace scraping de WhatsApp por contacto@axon
 */

import { BaseService } from '../base/service.interface';
import { SupabaseService } from '../supabase/client';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AxonConnector');

/**
 * Interfaz para un contacto de WhatsApp desde Axon
 */
export interface AxonContact {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  whatsapp_id?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Interfaz para un mensaje de WhatsApp desde Axon
 */
export interface AxonMessage {
  id: string;
  contact_id?: string;
  conversation_id?: string;
  from?: string;
  to?: string;
  message_text?: string;
  message_type?: string;
  timestamp?: string;
  is_from_me?: boolean;
  created_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Interfaz para una conversación de WhatsApp desde Axon
 */
export interface AxonConversation {
  id: string;
  contact_id?: string;
  name?: string;
  last_message_at?: string;
  message_count?: number;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Opciones para listar contactos
 */
export interface ListContactsOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Opciones para listar mensajes
 */
export interface ListMessagesOptions {
  contact_id?: string;
  conversation_id?: string;
  limit?: number;
  offset?: number;
  after?: string;
  before?: string;
}

/**
 * Opciones para listar conversaciones
 */
export interface ListConversationsOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Servicio para acceder a datos de Axon
 */
export class AxonConnector extends BaseService {
  name = 'Axon';
  private supabase: SupabaseService;
  private tableNames: {
    contacts?: string;
    messages?: string;
    conversations?: string;
  } = {};

  constructor() {
    super();
    this.supabase = new SupabaseService();
    
    // Intentar detectar nombres de tablas comunes
    // Estos se pueden sobrescribir después de detectar las tablas reales
    this.tableNames = {
      contacts: 'contacts',
      messages: 'whatsapp_messages',
      conversations: 'conversations',
    };
  }

  /**
   * Verifica si el servicio está configurado
   */
  isConfigured(): boolean {
    return this.supabase.isConfigured();
  }

  /**
   * Configura los nombres de tablas de Axon
   * Útil después de detectar las tablas reales en Supabase
   */
  setTableNames(names: { contacts?: string; messages?: string; conversations?: string }): void {
    this.tableNames = { ...this.tableNames, ...names };
    logger.info('Table names updated', this.tableNames);
  }

  /**
   * Detecta automáticamente los nombres de tablas de Axon
   */
  async detectTableNames(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured');
    }

    const db = this.supabase.db(true);
    const possibleNames = {
      contacts: ['contacts', 'axon_contacts', 'whatsapp_contacts', 'whatsapp_contact'],
      messages: ['whatsapp_messages', 'axon_messages', 'messages', 'whatsapp_message'],
      conversations: ['conversations', 'axon_conversations', 'chats', 'whatsapp_conversations'],
    };

    const detected: Record<string, string> = {};

    for (const [key, candidates] of Object.entries(possibleNames)) {
      for (const candidate of candidates) {
        try {
          const { error } = await db
            .from(candidate)
            .select('*')
            .limit(0);
          
          if (!error) {
            detected[key] = candidate;
            logger.info(`Detected table: ${key} = ${candidate}`);
            break;
          }
        } catch {
          // Table doesn't exist, continue
        }
      }
    }

    if (detected.contacts) this.tableNames.contacts = detected.contacts;
    if (detected.messages) this.tableNames.messages = detected.messages;
    if (detected.conversations) this.tableNames.conversations = detected.conversations;

    logger.info('Table detection complete', this.tableNames);
  }

  /**
   * Obtiene todos los contactos de WhatsApp
   */
  async getContacts(options: ListContactsOptions = {}): Promise<AxonContact[]> {
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured');
    }

    if (!this.tableNames.contacts) {
      throw new Error('Contacts table name not set. Call detectTableNames() first.');
    }

    const db = this.supabase.db(false);
    let query = db.from(this.tableNames.contacts).select('*');

    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,phone.ilike.%${options.search}%,email.ilike.%${options.search}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching contacts', error);
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    return (data || []).map(this.mapToContact);
  }

  /**
   * Obtiene un contacto por ID
   */
  async getContactById(id: string): Promise<AxonContact | null> {
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured');
    }

    if (!this.tableNames.contacts) {
      throw new Error('Contacts table name not set. Call detectTableNames() first.');
    }

    const db = this.supabase.db(false);
    const { data, error } = await db
      .from(this.tableNames.contacts)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Error fetching contact', error);
      throw new Error(`Failed to fetch contact: ${error.message}`);
    }

    return data ? this.mapToContact(data) : null;
  }

  /**
   * Obtiene contactos por teléfono
   */
  async getContactByPhone(phone: string): Promise<AxonContact | null> {
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured');
    }

    if (!this.tableNames.contacts) {
      throw new Error('Contacts table name not set. Call detectTableNames() first.');
    }

    const db = this.supabase.db(false);
    const { data, error } = await db
      .from(this.tableNames.contacts)
      .select('*')
      .or(`phone.eq.${phone},whatsapp_id.eq.${phone}`)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Error fetching contact by phone', error);
      throw new Error(`Failed to fetch contact: ${error.message}`);
    }

    return data ? this.mapToContact(data) : null;
  }

  /**
   * Obtiene mensajes de WhatsApp
   */
  async getMessages(options: ListMessagesOptions = {}): Promise<AxonMessage[]> {
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured');
    }

    if (!this.tableNames.messages) {
      throw new Error('Messages table name not set. Call detectTableNames() first.');
    }

    const db = this.supabase.db(false);
    let query = db.from(this.tableNames.messages).select('*');

    if (options.contact_id) {
      query = query.eq('contact_id', options.contact_id);
    }

    if (options.conversation_id) {
      query = query.eq('conversation_id', options.conversation_id);
    }

    if (options.after) {
      query = query.gte('timestamp', options.after);
    }

    if (options.before) {
      query = query.lte('timestamp', options.before);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      logger.error('Error fetching messages', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (data || []).map(this.mapToMessage);
  }

  /**
   * Obtiene conversaciones de WhatsApp
   */
  async getConversations(options: ListConversationsOptions = {}): Promise<AxonConversation[]> {
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured');
    }

    if (!this.tableNames.conversations) {
      throw new Error('Conversations table name not set. Call detectTableNames() first.');
    }

    const db = this.supabase.db(false);
    let query = db.from(this.tableNames.conversations).select('*');

    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const { data, error } = await query.order('last_message_at', { ascending: false });

    if (error) {
      logger.error('Error fetching conversations', error);
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return (data || []).map(this.mapToConversation);
  }

  /**
   * Obtiene una conversación por ID
   */
  async getConversationById(id: string): Promise<AxonConversation | null> {
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured');
    }

    if (!this.tableNames.conversations) {
      throw new Error('Conversations table name not set. Call detectTableNames() first.');
    }

    const db = this.supabase.db(false);
    const { data, error } = await db
      .from(this.tableNames.conversations)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Error fetching conversation', error);
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }

    return data ? this.mapToConversation(data) : null;
  }

  /**
   * Obtiene mensajes de una conversación específica
   */
  async getConversationMessages(conversationId: string, limit = 100): Promise<AxonMessage[]> {
    return this.getMessages({
      conversation_id: conversationId,
      limit,
    });
  }

  /**
   * Obtiene mensajes de un contacto específico
   */
  async getContactMessages(contactId: string, limit = 100): Promise<AxonMessage[]> {
    return this.getMessages({
      contact_id: contactId,
      limit,
    });
  }

  /**
   * Mapea datos raw a AxonContact
   */
  private mapToContact(data: any): AxonContact {
    return {
      id: data.id,
      name: data.name || data.display_name || data.contact_name,
      phone: data.phone || data.phone_number || data.whatsapp_id,
      email: data.email || data.email_address,
      whatsapp_id: data.whatsapp_id || data.phone,
      created_at: data.created_at,
      updated_at: data.updated_at,
      metadata: data.metadata || {},
    };
  }

  /**
   * Mapea datos raw a AxonMessage
   */
  private mapToMessage(data: any): AxonMessage {
    return {
      id: data.id,
      contact_id: data.contact_id || data.contact,
      conversation_id: data.conversation_id || data.conversation,
      from: data.from || data.from_number || data.from_whatsapp_id,
      to: data.to || data.to_number || data.to_whatsapp_id,
      message_text: data.message_text || data.text || data.body || data.content,
      message_type: data.message_type || data.type || 'text',
      timestamp: data.timestamp || data.created_at || data.date,
      is_from_me: data.is_from_me !== undefined ? data.is_from_me : data.from_me,
      created_at: data.created_at,
      metadata: data.metadata || {},
    };
  }

  /**
   * Mapea datos raw a AxonConversation
   */
  private mapToConversation(data: any): AxonConversation {
    return {
      id: data.id,
      contact_id: data.contact_id || data.contact,
      name: data.name || data.conversation_name || data.chat_name,
      last_message_at: data.last_message_at || data.updated_at,
      message_count: data.message_count || data.count,
      created_at: data.created_at,
      updated_at: data.updated_at,
      metadata: data.metadata || {},
    };
  }
}


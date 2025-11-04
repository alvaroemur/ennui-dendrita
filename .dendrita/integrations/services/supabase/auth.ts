/**
 * Servicio de autenticación para Supabase
 * Usa supabase-js con claves desde credentials loader
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { credentials } from '../../utils/credentials';
import { createLogger } from '../../utils/logger';

const logger = createLogger('SupabaseAuth');

export class SupabaseAuth {
  /**
   * Obtiene un cliente de Supabase.
   * - Por defecto usa ANON key (cliente)
   * - Con useServiceRole=true, usa SERVICE_ROLE key (servidor)
   */
  static getClient(opts?: { useServiceRole?: boolean }): SupabaseClient {
    const cfg = credentials.getSupabase();
    const key = opts?.useServiceRole ? cfg.serviceRoleKey : cfg.anonKey;
    if (!key) throw new Error('Supabase key not configured for selected mode');

    logger.debug(`Creating Supabase client (serviceRole=${!!opts?.useServiceRole})`);

    return createClient(cfg.url, key, {
      auth: { persistSession: false },
    });
  }

  /**
   * Verifica si Supabase está configurado
   */
  static isConfigured(): boolean {
    try {
      credentials.getSupabase();
      return true;
    } catch {
      return false;
    }
  }
}

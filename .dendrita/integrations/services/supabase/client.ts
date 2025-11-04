/**
 * Servicio de Supabase (wrapper simple)
 */

import { BaseService } from '../base/service.interface';
import { SupabaseAuth } from './auth';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Supabase');

export class SupabaseService extends BaseService {
  name = 'Supabase';

  isConfigured(): boolean {
    return SupabaseAuth.isConfigured();
  }

  /**
   * Obtiene cliente de Supabase
   * @param useServiceRole true para usar SERVICE_ROLE (solo servidor)
   */
  db(useServiceRole = false) {
    logger.debug('Acquiring Supabase client');
    return SupabaseAuth.getClient({ useServiceRole });
  }
}

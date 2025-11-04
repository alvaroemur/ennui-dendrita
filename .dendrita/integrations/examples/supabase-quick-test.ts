/**
 * EJEMPLO: Usar Supabase desde dendrita
 */

import { SupabaseService } from '../services/supabase/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('SupabaseExample');

async function quickSelect(): Promise<void> {
  const supa = new SupabaseService();

  if (!supa.isConfigured()) {
    logger.warn('Supabase not configured. Set SUPABASE_URL and keys in .env.local');
    return;
  }

  // Usa anon key por defecto (cliente)
  const client = supa.db(false);

  try {
    const { data, error } = await client.from('your_table').select('*').limit(5);
    if (error) throw error;
    logger.info(`Rows: ${data?.length ?? 0}`);
  } catch (error) {
    logger.error('Query failed', error);
  }
}

if (require.main === module) {
  quickSelect().catch((e) => logger.error('Fatal', e));
}

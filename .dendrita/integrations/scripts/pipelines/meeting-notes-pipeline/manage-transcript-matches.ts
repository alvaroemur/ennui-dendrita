#!/usr/bin/env npx ts-node
/**
 * Módulo para gestionar relaciones entre eventos y transcripciones en Supabase
 */

import { SupabaseService } from '../../../services/supabase/client';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('ManageTranscriptMatches');

export interface TranscriptMatch {
  id?: string;
  event_id: string;
  transcript_file_id: string;
  transcript_url?: string;
  match_score: number;
  match_method: 'supabase' | 'tactiq_matching' | 'manual';
  match_status?: 'pending' | 'confirmed' | 'rejected';
  matched_at?: string;
  confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca un match existente para un evento
 */
export async function findExistingMatch(
  eventId: string,
  db?: any
): Promise<TranscriptMatch | null> {
  try {
    if (!db) {
      const supa = new SupabaseService();
      if (!supa.isConfigured()) {
        throw new Error('Supabase not configured');
      }

      let supabaseDb;
      try {
        supabaseDb = supa.db(true);
      } catch {
        supabaseDb = supa.db(false);
      }
      db = supabaseDb;
    }

    // Buscar match confirmado o pendiente (priorizar confirmados)
    const { data: confirmedMatch, error: confirmedError } = await db
      .from('event_transcript_matches')
      .select('*')
      .eq('event_id', eventId)
      .eq('match_status', 'confirmed')
      .order('match_score', { ascending: false })
      .limit(1)
      .single();

    if (confirmedMatch && !confirmedError) {
      logger.info(`Match confirmado encontrado para evento ${eventId}`);
      return confirmedMatch as TranscriptMatch;
    }

    // Si no hay confirmado, buscar pendiente
    const { data: pendingMatch, error: pendingError } = await db
      .from('event_transcript_matches')
      .select('*')
      .eq('event_id', eventId)
      .eq('match_status', 'pending')
      .order('match_score', { ascending: false })
      .limit(1)
      .single();

    if (pendingMatch && !pendingError) {
      logger.info(`Match pendiente encontrado para evento ${eventId}`);
      return pendingMatch as TranscriptMatch;
    }

    return null;
  } catch (error: any) {
    // Si no hay matches, no es un error
    if (error.code === 'PGRST116') {
      return null;
    }
    logger.error('Error al buscar match existente', error);
    return null;
  }
}

/**
 * Guarda un nuevo match en la base de datos
 */
export async function saveMatch(
  match: Omit<TranscriptMatch, 'id' | 'created_at' | 'updated_at'>,
  db?: any
): Promise<TranscriptMatch | null> {
  try {
    if (!db) {
      const supa = new SupabaseService();
      if (!supa.isConfigured()) {
        throw new Error('Supabase not configured');
      }

      let supabaseDb;
      try {
        supabaseDb = supa.db(true);
      } catch {
        supabaseDb = supa.db(false);
      }
      db = supabaseDb;
    }

    // Verificar si ya existe un match para este evento y transcripción
    const { data: existing, error: checkError } = await db
      .from('event_transcript_matches')
      .select('id')
      .eq('event_id', match.event_id)
      .eq('transcript_file_id', match.transcript_file_id)
      .single();

    if (existing && !checkError) {
      // Actualizar match existente
      const { data: updated, error: updateError } = await db
        .from('event_transcript_matches')
        .update({
          match_score: match.match_score,
          match_method: match.match_method,
          match_status: match.match_status || 'pending',
          transcript_url: match.transcript_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      logger.info(`Match actualizado para evento ${match.event_id}`);
      return updated as TranscriptMatch;
    }

    // Crear nuevo match
    const { data: newMatch, error: insertError } = await db
      .from('event_transcript_matches')
      .insert({
        event_id: match.event_id,
        transcript_file_id: match.transcript_file_id,
        transcript_url: match.transcript_url,
        match_score: match.match_score,
        match_method: match.match_method,
        match_status: match.match_status || 'pending',
        matched_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    logger.info(`Match guardado para evento ${match.event_id} (score: ${match.match_score})`);
    return newMatch as TranscriptMatch;
  } catch (error: any) {
    logger.error('Error al guardar match', error);
    return null;
  }
}

/**
 * Confirma un match (cambia status a 'confirmed')
 */
export async function confirmMatch(
  matchId: string,
  db?: any
): Promise<TranscriptMatch | null> {
  try {
    if (!db) {
      const supa = new SupabaseService();
      if (!supa.isConfigured()) {
        throw new Error('Supabase not configured');
      }

      let supabaseDb;
      try {
        supabaseDb = supa.db(true);
      } catch {
        supabaseDb = supa.db(false);
      }
      db = supabaseDb;
    }

    const { data: updated, error } = await db
      .from('event_transcript_matches')
      .update({
        match_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Match confirmado: ${matchId}`);
    return updated as TranscriptMatch;
  } catch (error: any) {
    logger.error('Error al confirmar match', error);
    return null;
  }
}

/**
 * Rechaza un match (cambia status a 'rejected')
 */
export async function rejectMatch(
  matchId: string,
  db?: any
): Promise<TranscriptMatch | null> {
  try {
    if (!db) {
      const supa = new SupabaseService();
      if (!supa.isConfigured()) {
        throw new Error('Supabase not configured');
      }

      let supabaseDb;
      try {
        supabaseDb = supa.db(true);
      } catch {
        supabaseDb = supa.db(false);
      }
      db = supabaseDb;
    }

    const { data: updated, error } = await db
      .from('event_transcript_matches')
      .update({
        match_status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Match rechazado: ${matchId}`);
    return updated as TranscriptMatch;
  } catch (error: any) {
    logger.error('Error al rechazar match', error);
    return null;
  }
}

/**
 * Obtiene todos los matches para un evento
 */
export async function getMatchesForEvent(
  eventId: string,
  db?: any
): Promise<TranscriptMatch[]> {
  try {
    if (!db) {
      const supa = new SupabaseService();
      if (!supa.isConfigured()) {
        throw new Error('Supabase not configured');
      }

      let supabaseDb;
      try {
        supabaseDb = supa.db(true);
      } catch {
        supabaseDb = supa.db(false);
      }
      db = supabaseDb;
    }

    const { data: matches, error } = await db
      .from('event_transcript_matches')
      .select('*')
      .eq('event_id', eventId)
      .order('match_score', { ascending: false });

    if (error) {
      throw error;
    }

    return (matches || []) as TranscriptMatch[];
  } catch (error: any) {
    logger.error('Error al obtener matches para evento', error);
    return [];
  }
}


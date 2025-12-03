#!/usr/bin/env npx ts-node
/**
 * Script para buscar reuniones recientes con participantes específicos
 * Busca en calendar_events y calendar_event_attendees
 */

import { SupabaseService } from '../../../services/supabase/client';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('FindRecentMeetings');

interface MeetingInfo {
  event_id: string;
  google_event_id: string;
  summary: string;
  start_date_time: string;
  end_date_time: string;
  description?: string;
  location?: string;
  html_link?: string;
  attendees: string[];
  organizer_email?: string;
  full_metadata?: any;
}

/**
 * Busca reuniones recientes con participantes específicos
 */
async function findRecentMeetings(
  participantNames: string[],
  hoursBack: number = 24
): Promise<MeetingInfo[]> {
  const supa = new SupabaseService();
  
  if (!supa.isConfigured()) {
    throw new Error('Supabase not configured');
  }
  
  let db;
  try {
    db = supa.db(true);
  } catch {
    db = supa.db(false);
  }
  
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
  
  logger.info(`Buscando reuniones desde ${cutoffTime.toISOString()} con participantes: ${participantNames.join(', ')}`);
  
  // Buscar eventos recientes
  const { data: events, error: eventsError } = await db
    .from('calendar_events')
    .select('*')
    .gte('start_date_time', cutoffTime.toISOString())
    .order('start_date_time', { ascending: false })
    .limit(100);
  
  if (eventsError) {
    logger.error('Error al buscar eventos', eventsError);
    throw eventsError;
  }
  
  if (!events || events.length === 0) {
    logger.info('No se encontraron eventos recientes');
    return [];
  }
  
  logger.info(`Encontrados ${events.length} eventos recientes`);
  
  // Buscar asistentes para cada evento
  const meetings: MeetingInfo[] = [];
  
  for (const event of events) {
    // Obtener asistentes del evento
    const { data: attendees, error: attendeesError } = await db
      .from('calendar_event_attendees')
      .select('email, display_name')
      .eq('event_id', event.id);
    
    if (attendeesError) {
      logger.warn(`Error al obtener asistentes para evento ${event.id}: ${attendeesError.message}`);
      continue;
    }
    
    // Normalizar nombres de participantes para búsqueda
    const participantNamesLower = participantNames.map(n => n.toLowerCase().trim());
    
    // Verificar si alguno de los participantes está en la lista de asistentes
    const matchingAttendees: string[] = [];
    const allAttendees: string[] = [];
    
    if (attendees && attendees.length > 0) {
      for (const attendee of attendees) {
        const email = (attendee.email || '').toLowerCase();
        const name = (attendee.display_name || '').toLowerCase();
        const fullName = `${name} <${email}>`;
        
        allAttendees.push(fullName);
        
        // Buscar coincidencias en nombre o email
        const matches = participantNamesLower.some(participant => {
          const participantLower = participant.toLowerCase();
          return name.includes(participantLower) || 
                 email.includes(participantLower) ||
                 email.split('@')[0].includes(participantLower);
        });
        
        if (matches) {
          matchingAttendees.push(fullName);
        }
      }
    }
    
    // También buscar en summary, description y organizer
    const summary = (event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    const organizerEmail = (event.organizer_email || '').toLowerCase();
    const organizerName = (event.organizer_display_name || '').toLowerCase();
    
    const matchesInText = participantNamesLower.some(participant => {
      const participantLower = participant.toLowerCase();
      return summary.includes(participantLower) ||
             description.includes(participantLower) ||
             organizerEmail.includes(participantLower) ||
             organizerName.includes(participantLower);
    });
    
    // Si hay coincidencias en asistentes o texto, incluir el evento
    if (matchingAttendees.length > 0 || matchesInText) {
      meetings.push({
        event_id: event.id,
        google_event_id: event.google_event_id || '',
        summary: event.summary || 'Sin título',
        start_date_time: event.start_date_time || '',
        end_date_time: event.end_date_time || '',
        description: event.description || undefined,
        location: event.location || undefined,
        html_link: event.html_link || undefined,
        attendees: allAttendees,
        organizer_email: event.organizer_email || undefined,
        full_metadata: event.full_metadata || undefined
      });
    }
  }
  
  logger.info(`Encontradas ${meetings.length} reuniones con los participantes especificados`);
  
  return meetings;
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const participantNames = process.argv.slice(2);
  
  if (participantNames.length === 0) {
    console.error('\n❌ Error: Debes especificar al menos un nombre de participante');
    console.log('\n📖 Uso:');
    console.log('   npx ts-node .dendrita/integrations/scripts/find-recent-meetings.ts <nombre1> [nombre2] ...');
    console.log('\n📝 Ejemplo:');
    console.log('   npx ts-node .dendrita/integrations/scripts/find-recent-meetings.ts rodrigo arturo');
    process.exit(1);
  }
  
  logger.info(`=== Buscando Reuniones Recientes ===\n`);
  logger.info(`Participantes: ${participantNames.join(', ')}`);
  logger.info(`Horas hacia atrás: 24\n`);
  
  try {
    const meetings = await findRecentMeetings(participantNames, 24);
    
    console.log('\n📊 Resultados:');
    console.log('─'.repeat(80));
    console.log(`\n✅ Total de reuniones encontradas: ${meetings.length}\n`);
    
    if (meetings.length > 0) {
      meetings.forEach((meeting, i) => {
        console.log(`${i + 1}. ${meeting.summary}`);
        console.log(`   📅 Fecha: ${new Date(meeting.start_date_time).toLocaleString('es-ES')}`);
        console.log(`   🕐 Duración: ${new Date(meeting.start_date_time).toLocaleTimeString('es-ES')} - ${new Date(meeting.end_date_time).toLocaleTimeString('es-ES')}`);
        if (meeting.location) {
          console.log(`   📍 Ubicación: ${meeting.location}`);
        }
        if (meeting.html_link) {
          console.log(`   🔗 Link: ${meeting.html_link}`);
        }
        console.log(`   👥 Asistentes (${meeting.attendees.length}):`);
        meeting.attendees.forEach(attendee => {
          console.log(`      - ${attendee}`);
        });
        if (meeting.description) {
          const descPreview = meeting.description.substring(0, 200);
          console.log(`   📝 Descripción: ${descPreview}${meeting.description.length > 200 ? '...' : ''}`);
        }
        
        // Buscar transcripciones en full_metadata
        if (meeting.full_metadata) {
          const metadata = meeting.full_metadata;
          const transcriptUrl = metadata.transcript_url || 
                              metadata.transcriptUrl || 
                              metadata.transcript_link ||
                              metadata.tactiq_transcript_url ||
                              metadata.tactiqTranscriptUrl;
          
          if (transcriptUrl) {
            console.log(`   📄 Transcripción: ${transcriptUrl}`);
          }
        }
        
        console.log('');
      });
    } else {
      console.log('⚠️  No se encontraron reuniones con los participantes especificados en las últimas 24 horas');
      console.log('\n💡 Intenta:');
      console.log('   1. Aumentar el rango de horas (modificar el script)');
      console.log('   2. Verificar que los nombres estén escritos correctamente');
      console.log('   3. Buscar por email en lugar de nombre');
    }
    
    console.log('─'.repeat(80));
    
  } catch (error: any) {
    logger.error('Error al buscar reuniones', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { findRecentMeetings };


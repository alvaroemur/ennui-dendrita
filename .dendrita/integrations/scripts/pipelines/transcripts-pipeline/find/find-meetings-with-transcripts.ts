#!/usr/bin/env npx ts-node
/**
 * Script para buscar reuniones recientes con participantes específicos
 * y verificar si tienen transcripciones en Google Drive (Tactiq)
 */

import { SupabaseService } from '../../../services/supabase/client';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('FindMeetingsWithTranscripts');

/**
 * Busca reuniones recientes con participantes específicos
 */
async function findMeetingsWithParticipants(
  participantNames: string[],
  hoursBack: number = 48
): Promise<void> {
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
    .select(`
      id,
      google_event_id,
      summary,
      start_date_time,
      end_date_time,
      description,
      location,
      html_link,
      organizer_email,
      organizer_display_name,
      full_metadata,
      calendar_event_attendees (
        email,
        display_name
      )
    `)
    .gte('start_date_time', cutoffTime.toISOString())
    .order('start_date_time', { ascending: false })
    .limit(100);
  
  if (eventsError) {
    logger.error('Error al buscar eventos', eventsError);
    throw eventsError;
  }
  
  if (!events || events.length === 0) {
    console.log('\n⚠️  No se encontraron eventos recientes');
    return;
  }
  
  logger.info(`Encontrados ${events.length} eventos recientes`);
  
  // Normalizar nombres de participantes para búsqueda
  const participantNamesLower = participantNames.map(n => n.toLowerCase().trim());
  
  // Filtrar eventos que contengan los participantes
  const matchingMeetings: any[] = [];
  
  for (const event of events) {
    const attendees = event.calendar_event_attendees || [];
    const allEmails: string[] = [];
    const allNames: string[] = [];
    
    // Recopilar todos los emails y nombres
    for (const attendee of attendees) {
      if (attendee.email) allEmails.push(attendee.email.toLowerCase());
      if (attendee.display_name) allNames.push(attendee.display_name.toLowerCase());
    }
    
    // Agregar organizador
    if (event.organizer_email) allEmails.push(event.organizer_email.toLowerCase());
    if (event.organizer_display_name) allNames.push(event.organizer_display_name.toLowerCase());
    
    // Buscar en summary y description
    const summary = (event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    
    // Verificar si alguno de los participantes está presente
    const hasParticipant = participantNamesLower.some(participant => {
      const participantLower = participant.toLowerCase();
      
      // Buscar en nombres
      const inNames = allNames.some(name => name.includes(participantLower));
      
      // Buscar en emails
      const inEmails = allEmails.some(email => 
        email.includes(participantLower) || 
        email.split('@')[0].includes(participantLower)
      );
      
      // Buscar en texto
      const inText = summary.includes(participantLower) || 
                    description.includes(participantLower);
      
      return inNames || inEmails || inText;
    });
    
    if (hasParticipant) {
      matchingMeetings.push({
        ...event,
        allEmails,
        allNames
      });
    }
  }
  
  logger.info(`Encontradas ${matchingMeetings.length} reuniones con los participantes especificados`);
  
  // Mostrar resultados
  console.log('\n📊 Resultados:');
  console.log('─'.repeat(80));
  console.log(`\n✅ Total de reuniones encontradas: ${matchingMeetings.length}\n`);
  
  if (matchingMeetings.length > 0) {
    matchingMeetings.forEach((meeting, i) => {
      const startDate = new Date(meeting.start_date_time);
      const endDate = meeting.end_date_time ? new Date(meeting.end_date_time) : null;
      
      console.log(`${i + 1}. ${meeting.summary || 'Sin título'}`);
      console.log(`   📅 Fecha: ${startDate.toLocaleString('es-ES', { timeZone: 'America/Lima' })}`);
      if (endDate) {
        console.log(`   🕐 Duración: ${startDate.toLocaleTimeString('es-ES', { timeZone: 'America/Lima' })} - ${endDate.toLocaleTimeString('es-ES', { timeZone: 'America/Lima' })}`);
      }
      if (meeting.location) {
        console.log(`   📍 Ubicación: ${meeting.location}`);
      }
      if (meeting.html_link) {
        console.log(`   🔗 Link: ${meeting.html_link}`);
      }
      
      // Mostrar asistentes
      const attendees = meeting.calendar_event_attendees || [];
      if (attendees.length > 0) {
        console.log(`   👥 Asistentes (${attendees.length}):`);
        attendees.forEach((att: any) => {
          const name = att.display_name || att.email?.split('@')[0] || 'Sin nombre';
          console.log(`      - ${name} <${att.email || 'sin email'}>`);
        });
      }
      
      // Buscar transcripciones en full_metadata
      if (meeting.full_metadata) {
        const metadata = meeting.full_metadata;
        const transcriptUrl = metadata.transcript_url || 
                            metadata.transcriptUrl || 
                            metadata.transcript_link ||
                            metadata.tactiq_transcript_url ||
                            metadata.tactiqTranscriptUrl ||
                            metadata.meeting_transcript_url;
        
        const transcriptText = metadata.transcript_text ||
                              metadata.transcriptText ||
                              metadata.transcript ||
                              metadata.transcription;
        
        if (transcriptUrl) {
          console.log(`   📄 Transcripción (URL): ${transcriptUrl}`);
        }
        if (transcriptText) {
          const preview = String(transcriptText).substring(0, 200);
          console.log(`   📄 Transcripción (texto): ${preview}...`);
        }
      }
      
      // Buscar links a Google Docs en description
      if (meeting.description) {
        const desc = String(meeting.description);
        const docMatch = desc.match(/https?:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          console.log(`   📄 Transcripción (Google Docs): ${docMatch[0]}`);
        }
      }
      
      console.log('');
    });
  } else {
    console.log('⚠️  No se encontraron reuniones con los participantes especificados');
  }
  
  console.log('─'.repeat(80));
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const participantNames = process.argv.slice(2);
  
  if (participantNames.length === 0) {
    console.error('\n❌ Error: Debes especificar al menos un nombre de participante');
    console.log('\n📖 Uso:');
    console.log('   npx ts-node .dendrita/integrations/scripts/find-meetings-with-transcripts.ts <nombre1> [nombre2] ...');
    console.log('\n📝 Ejemplo:');
    console.log('   npx ts-node .dendrita/integrations/scripts/find-meetings-with-transcripts.ts rodrigo arturo');
    process.exit(1);
  }
  
  logger.info(`=== Buscando Reuniones Recientes ===\n`);
  logger.info(`Participantes: ${participantNames.join(', ')}`);
  logger.info(`Horas hacia atrás: 48\n`);
  
  try {
    await findMeetingsWithParticipants(participantNames, 48);
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

export { findMeetingsWithParticipants };


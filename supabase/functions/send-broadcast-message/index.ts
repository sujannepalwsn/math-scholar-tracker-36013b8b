/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { senderUserId, centerId, messageText, targetAudience, targetGrade, title } = await req.json();

    if (!senderUserId || !centerId || !messageText || !targetAudience) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sender, center, message, and target audience are required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: broadcastMessage, error: broadcastError } = await supabase
      .from('broadcast_messages')
      .insert({
        center_id: centerId,
        sender_user_id: senderUserId,
        message_text: messageText,
        target_audience: targetAudience,
        target_grade: targetGrade || null,
        title: title || 'Broadcast Message'
      })
      .select().single();

    if (broadcastError) throw broadcastError;

    // Also insert into notices table
    const { error: noticeError } = await supabase
      .from('notices')
      .insert({
        center_id: centerId,
        title: title || 'Broadcast Message',
        content: messageText,
        target_audience:
          targetAudience === 'all_teachers' ? 'Teachers' :
          targetAudience === 'all_parents' ? 'Parents' :
          targetAudience === 'grade_parents' ? 'Grade' :
          targetAudience === 'center' ? 'Center' :
          'All',
        target_grade: targetGrade || null,
        created_by: senderUserId
      });

    if (noticeError) console.error(JSON.stringify({ event: 'error', message: 'Error inserting into notices:', details: noticeError }));

    let recipientUsers: Array<{ id: string; student_id?: string; teacher_id?: string }> = [];

    if (targetAudience === 'all_parents' || targetAudience === 'grade_parents') {
      let studentsQuery = supabase.from('students').select('id, name, grade').eq('center_id', centerId);
      if (targetAudience === 'grade_parents' && targetGrade) studentsQuery = studentsQuery.eq('grade', targetGrade);
      const { data: students, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;

      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id);
        const { data: parents, error: parentsError } = await supabase.from('users').select('id, student_id').eq('role', 'parent').in('student_id', studentIds);
        if (parentsError) throw parentsError;
        recipientUsers = parents || [];
      }
    } else if (targetAudience === 'all_teachers') {
      const { data: teachers, error: teachersError } = await supabase.from('users').select('id, teacher_id').eq('role', 'teacher').eq('center_id', centerId);
      if (teachersError) throw teachersError;
      recipientUsers = teachers || [];
    } else if (targetAudience === 'center') {
      const { data: admins, error: adminsError } = await supabase.from('users').select('id').eq('role', 'center').eq('center_id', centerId);
      if (adminsError) throw adminsError;
      recipientUsers = admins || [];
    }

    const messagesToInsert: Array<{ conversation_id: string; sender_user_id: string; message_text: string; is_read: boolean }> = [];
    const conversationUpdateIds: string[] = [];

    for (const recipient of recipientUsers) {
      let conversationId: string | null = null;
      if (recipient.student_id) {
        const { data: existingConversation } = await supabase.from('chat_conversations').select('id').eq('center_id', centerId).eq('student_id', recipient.student_id).eq('parent_user_id', recipient.id).maybeSingle();
        if (existingConversation) {
          conversationId = existingConversation.id;
        } else {
          const { data: newConv } = await supabase.from('chat_conversations').insert({ center_id: centerId, student_id: recipient.student_id, parent_user_id: recipient.id }).select('id').single();
          conversationId = newConv?.id || null;
        }
      } else if (recipient.teacher_id) {
        // Find or create conversation for the teacher with the center
        const { data: existingConversation } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('center_id', centerId)
          .eq('parent_user_id', recipient.id)
          .is('student_id', null)
          .maybeSingle();

        if (existingConversation) {
          conversationId = existingConversation.id;
        } else {
          const { data: newConv } = await supabase
            .from('chat_conversations')
            .insert({ center_id: centerId, parent_user_id: recipient.id })
            .select('id')
            .single();
          conversationId = newConv?.id || null;
        }
      }
      if (conversationId) {
        messagesToInsert.push({ conversation_id: conversationId, sender_user_id: senderUserId, message_text: messageText, is_read: false });
        conversationUpdateIds.push(conversationId);
      }
    }

    if (messagesToInsert.length > 0) {
      const { error: messagesError } = await supabase.from('chat_messages').insert(messagesToInsert);
      if (messagesError) throw messagesError;
    }

    for (const convId of conversationUpdateIds) {
      await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
    }

    return new Response(
      JSON.stringify({ success: true, broadcastId: broadcastMessage.id, recipientsCount: recipientUsers.length, messagesSent: messagesToInsert.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send broadcast message';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from "https://esm.sh/bcryptjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user by username
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid username or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.password_hash);
    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid username or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Build user object with related data
    const user: Record<string, any> = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      center_id: userData.center_id,
      student_id: userData.student_id,
      teacher_id: userData.teacher_id,
    };

    // Fetch center name if center_id exists
    if (userData.center_id) {
      const { data: centerData } = await supabaseClient
        .from('centers')
        .select('name')
        .eq('id', userData.center_id)
        .single();
      
      if (centerData) {
        user.center_name = centerData.name;
      }
    }

    // Fetch student name if student_id exists (for single student)
    if (userData.student_id) {
      const { data: studentData } = await supabaseClient
        .from('students')
        .select('name')
        .eq('id', userData.student_id)
        .single();
      
      if (studentData) {
        user.student_name = studentData.name;
      }
    }

    // Fetch all linked students for parent (from junction table)
    if (userData.role === 'parent') {
      const { data: linkedStudents } = await supabaseClient
        .from('parent_students')
        .select('student_id, students(id, name, grade)')
        .eq('parent_user_id', userData.id);
      
      if (linkedStudents && linkedStudents.length > 0) {
        user.linked_students = linkedStudents.map((ls: any) => ({
          id: ls.students?.id,
          name: ls.students?.name,
          grade: ls.students?.grade,
        }));
      }
    }

    // Fetch teacher name if teacher_id exists
    if (userData.teacher_id) {
      const { data: teacherData } = await supabaseClient
        .from('teachers')
        .select('name')
        .eq('id', userData.teacher_id)
        .single();
      
      if (teacherData) {
        user.teacher_name = teacherData.name;
      }
    }

    // Fetch center feature permissions if role is center OR teacher OR parent
    if (userData.center_id) {
      const { data: permissionsData } = await supabaseClient
        .from('center_feature_permissions')
        .select('*')
        .eq('center_id', userData.center_id)
        .maybeSingle();
      
      if (permissionsData) {
        user.centerPermissions = permissionsData;
      } else {
        user.centerPermissions = {};
      }
    }

    // Fetch teacher feature permissions if role is teacher
    if (userData.role === 'teacher' && userData.teacher_id) {
      const { data: permissionsData } = await supabaseClient
        .from('teacher_feature_permissions')
        .select('*')
        .eq('teacher_id', userData.teacher_id)
        .maybeSingle();
      
      if (permissionsData) {
        user.teacherPermissions = permissionsData;
      } else {
        user.teacherPermissions = {};
      }
    }

    // Update last login
    await supabaseClient
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);

    return new Response(
      JSON.stringify({ success: true, user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: unknown) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

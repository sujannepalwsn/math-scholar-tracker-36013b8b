import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from "https://esm.sh/bcryptjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const getSyntheticAuthEmail = (userId: string) => `${userId}@app.local`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error(JSON.stringify({
        event: 'error',
        message: 'Missing Supabase environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceRole: !!serviceRoleKey,
          hasAnonKey: !!anonKey,
        },
      }));

      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*, teachers(contract_end_date, is_active), centers(is_active)')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error(JSON.stringify({ event: 'error', message: 'User not found', details: userError }));
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid username or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    if (!userData.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Account deactivated. Please contact administrator.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    if (userData.centers && userData.centers.is_active === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Institution subscription suspended. Please contact administrator.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    if (userData.expiry_date && new Date(userData.expiry_date) < new Date()) {
      await adminClient
        .from('users')
        .update({ is_active: false })
        .eq('id', userData.id);

      return new Response(
        JSON.stringify({ success: false, error: 'Account expired. Please contact administrator.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    if (userData.role === 'teacher' && userData.teachers?.[0]) {
      const teacher = userData.teachers[0];

      if (teacher.is_active === false) {
        await adminClient
          .from('users')
          .update({ is_active: false })
          .eq('id', userData.id);

        return new Response(
          JSON.stringify({ success: false, error: 'Teacher account suspended. Please contact administrator.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      if (teacher.contract_end_date && new Date(teacher.contract_end_date) < new Date()) {
        await adminClient
          .from('users')
          .update({ is_active: false })
          .eq('id', userData.id);

        return new Response(
          JSON.stringify({ success: false, error: 'Contract expired. Account deactivated.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    const passwordMatch = bcrypt.compareSync(password, userData.password_hash);
    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid username or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    let authEmail = getSyntheticAuthEmail(userData.id);
    const { data: authLookup, error: authLookupError } = await adminClient.auth.admin.getUserById(userData.id);

    if (authLookupError && authLookupError.status !== 404) {
      console.error(JSON.stringify({ event: 'error', message: 'Auth user lookup failed', details: authLookupError }));
    }

    if (!authLookup?.user) {
      console.log(JSON.stringify({ event: 'info', message: `Creating matching auth user for ${userData.username}`, details: { id: userData.id } }));

      const { data: createdAuthUser, error: createAuthError } = await adminClient.auth.admin.createUser({
        id: userData.id,
        email: authEmail,
        password,
        email_confirm: true,
        user_metadata: {
          username: userData.username,
          role: userData.role,
          center_id: userData.center_id,
        },
      } as any);

      if (createAuthError || !createdAuthUser.user) {
        console.error(JSON.stringify({ event: 'error', message: 'Failed to create matching auth user', details: createAuthError }));
        return new Response(
          JSON.stringify({ success: false, error: 'Unable to establish authenticated session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      authEmail = createdAuthUser.user.email ?? authEmail;
    } else {
      authEmail = authLookup.user.email ?? authEmail;

      if (!authLookup.user.email) {
        const { error: syncEmailError } = await adminClient.auth.admin.updateUserById(userData.id, {
          email: authEmail,
          email_confirm: true,
        });

        if (syncEmailError) {
          console.error(JSON.stringify({ event: 'error', message: 'Failed to sync auth email', details: syncEmailError }));
          return new Response(
            JSON.stringify({ success: false, error: 'Unable to establish authenticated session' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
    }

    let { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (signInError || !signInData?.session) {
      console.log(JSON.stringify({ event: 'info', message: `Syncing auth password for ${userData.username}`, details: { id: userData.id } }));

      const { error: syncPasswordError } = await adminClient.auth.admin.updateUserById(userData.id, {
        email: authEmail,
        password,
        email_confirm: true,
      });

      if (syncPasswordError) {
        console.error(JSON.stringify({ event: 'error', message: 'Failed to sync auth password', details: syncPasswordError }));
      } else {
        const retry = await anonClient.auth.signInWithPassword({ email: authEmail, password });
        signInData = retry.data;
        signInError = retry.error;
      }
    }

    if (signInError || !signInData?.session) {
      console.error(JSON.stringify({ event: 'error', message: 'Failed to create Supabase session', details: signInError }));
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to establish authenticated session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const user: Record<string, any> = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      center_id: userData.center_id,
      student_id: userData.student_id,
      teacher_id: userData.teacher_id,
    };

    if (userData.center_id) {
      const { data: centerData } = await adminClient
        .from('centers')
        .select('name')
        .eq('id', userData.center_id)
        .single();

      if (centerData) {
        user.center_name = centerData.name;
      }
    }

    if (userData.student_id) {
      const { data: studentData } = await adminClient
        .from('students')
        .select('name')
        .eq('id', userData.student_id)
        .single();

      if (studentData) {
        user.student_name = studentData.name;
      }
    }

    if (userData.role === 'parent') {
      const { data: linkedStudents } = await adminClient
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

    if (userData.teacher_id) {
      const { data: teacherData } = await adminClient
        .from('teachers')
        .select('name')
        .eq('id', userData.teacher_id)
        .single();

      if (teacherData) {
        user.teacher_name = teacherData.name;
      }
    }

    await adminClient
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);

    return new Response(
      JSON.stringify({ success: true, user, session: signInData.session }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: unknown) {
    console.error(JSON.stringify({ event: 'error', message: 'Login error', details: error }));
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from "https://esm.sh/bcryptjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Security: Only allow initialization if no admin exists at all
    const { count, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (countError) throw countError;
    if (count && count > 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Admin user already exists. This function can only be used for initial setup.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read credentials from request body — never hardcoded
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    if (typeof username !== 'string' || username.length < 3 || username.length > 255) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username must be between 3 and 255 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be between 8 and 128 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the password using bcryptjs
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const { data: admin, error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        role: 'admin',
        center_id: null,
        is_active: true
      })
      .select('id, username')
      .single();

    if (error) throw error;

    console.log('Admin user created successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Admin user created', admin: { id: admin.id, username: admin.username } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(JSON.stringify({ event: 'error', message: 'Init admin error' }));
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred during initialization' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

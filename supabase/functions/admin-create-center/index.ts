import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import * as bcrypt from "https://esm.sh/bcryptjs"; // Import bcryptjs

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing or invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify role is 'admin' (super-admin)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Super Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { centerName, address, contactNumber, username, password } = await req.json();

    if (!centerName || !username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Center name, username, and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create center
    const { data: center, error: centerError } = await supabase
      .from('centers')
      .insert({
        center_name: centerName,
        address: address || null,
        contact_number: contactNumber || null
      })
      .select()
      .single();

    if (centerError) throw centerError;

    // Hash password using bcryptjs
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: userCreated, error: userCreatedError } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        role: 'center',
        center_id: center.id,
        is_active: true
      })
      .select()
      .single();

    if (userCreatedError) {
      // Rollback: delete the center if user creation fails
      await supabase.from('centers').delete().eq('id', center.id);
      throw userCreatedError;
    }

    console.log('Center created successfully:', center.id);

    return new Response(
      JSON.stringify({ success: true, center, user: { id: userCreated.id, username: userCreated.username } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(JSON.stringify({ event: 'error', message: 'Create center error:', details: error }));
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

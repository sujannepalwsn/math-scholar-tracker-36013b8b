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

    // Check if admin exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'sujan1nepal@gmail.com')
      .eq('role', 'admin')
      .single();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ success: true, message: 'Admin already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the password "precioussn" using bcryptjs
    const passwordHash = await bcrypt.hash('precioussn', 12);

    // Create admin user
    const { data: admin, error } = await supabase
      .from('users')
      .insert({
        username: 'sujan1nepal@gmail.com',
        password_hash: passwordHash,
        role: 'admin',
        center_id: null,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Admin user created successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Admin user created', admin: { id: admin.id, username: admin.username } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(JSON.stringify({ event: 'error', message: 'Init admin error:', details: error }));
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

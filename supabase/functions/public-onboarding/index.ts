import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
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

    const {
      schoolName,
      location,
      adminName,
      adminEmail,
      adminPassword,
      modules,
      plan
    } = await req.json();

    if (!schoolName || !adminEmail || !adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Required fields missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', adminEmail)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email already registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create center
    const { data: center, error: centerError } = await supabase
      .from('centers')
      .insert({
        name: schoolName,
        address: location || null,
        is_active: true,
        header_config: { layout: 'classic', elements: [] }
      })
      .select()
      .single();

    if (centerError) throw centerError;

    // Hash password using bcryptjs
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create user in public.users
    const { data: userCreated, error: userCreatedError } = await supabase
      .from('users')
      .insert({
        username: adminEmail,
        password_hash: passwordHash,
        role: 'center',
        center_id: center.id,
        is_active: true
      })
      .select()
      .single();

    if (userCreatedError) {
      await supabase.from('centers').delete().eq('id', center.id);
      throw userCreatedError;
    }

    // Provision default permissions
    if (modules && modules.length > 0) {
        // Logic to enable selected modules in center_feature_permissions
        // For simplicity in this demo function, we'll just insert a record
        await supabase.from('center_feature_permissions').upsert({
            center_id: center.id,
            // Map the selected modules to the boolean columns
            academic_management: modules.includes('academic'),
            attendance_management: modules.includes('attendance'),
            finance_management: modules.includes('finance'),
            communication_management: modules.includes('comm'),
            inventory_management: modules.includes('inventory'),
            hr_management: modules.includes('hr')
        });
    }

    // Log the onboarding event
    console.log('New Onboarding Success:', center.id, adminEmail);

    return new Response(
      JSON.stringify({
          success: true,
          message: 'Account created successfully',
          centerId: center.id,
          username: adminEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(JSON.stringify({ event: 'error', message: 'Onboarding error:', details: error }));
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

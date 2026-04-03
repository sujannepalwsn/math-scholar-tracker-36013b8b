import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// One-time utility: syncs all public.users into auth.users with matching UUIDs.
// Each user gets a temporary password that will be overwritten on their next login.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all public.users
    const { data: publicUsers, error: fetchError } = await supabaseClient
      .from('users')
      .select('id, username, is_active');

    if (fetchError || !publicUsers) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch users', details: fetchError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const results: { id: string; username: string; status: string; detail?: string }[] = [];

    for (const pu of publicUsers) {
      // Check if auth user already exists
      const { data: existing, error: getErr } = await supabaseClient.auth.admin.getUserById(pu.id);

      if (existing?.user) {
        results.push({ id: pu.id, username: pu.username, status: 'already_exists' });
        continue;
      }

      // Create auth user with matching UUID
      const generatedEmail = `${pu.username.replace(/[^a-zA-Z0-9]/g, '_')}@app.local`;
      // Temporary password — will be synced on next real login via auth-login
      const tempPassword = `TempSync_${pu.id.substring(0, 8)}!`;

      const { error: createError } = await supabaseClient.auth.admin.createUser({
        uid: pu.id,
        email: generatedEmail,
        password: tempPassword,
        email_confirm: true,
      });

      if (createError) {
        // Try with unique email if conflict
        if (createError.message?.includes('already been registered')) {
          const uniqueEmail = `${pu.username.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}@app.local`;
          const { error: retryError } = await supabaseClient.auth.admin.createUser({
            uid: pu.id,
            email: uniqueEmail,
            password: tempPassword,
            email_confirm: true,
          });

          if (retryError) {
            results.push({ id: pu.id, username: pu.username, status: 'failed', detail: retryError.message });
          } else {
            results.push({ id: pu.id, username: pu.username, status: 'created_retry' });
          }
        } else {
          results.push({ id: pu.id, username: pu.username, status: 'failed', detail: createError.message });
        }
      } else {
        results.push({ id: pu.id, username: pu.username, status: 'created' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: publicUsers.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: userData, error: userError } = await supabaseClient.from('users').select('role').eq('id', user.id).single();
    if (userError || userData?.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: 'Admin access required' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { centerId, featureName, isEnabled } = await req.json();
    if (!centerId || !featureName || typeof isEnabled !== 'boolean') {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: upsertError } = await supabaseClient
      .from('center_feature_permissions')
      .upsert({ center_id: centerId, [featureName]: isEnabled, updated_at: new Date().toISOString() }, { onConflict: 'center_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, message: 'Feature permission updated successfully' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'error', message: 'Error in admin-toggle-center-feature:', details: err }));
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});

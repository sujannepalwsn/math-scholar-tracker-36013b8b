import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { teacherId, featureName, isEnabled } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user and get context
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !authUser) throw new Error('Unauthorized');

    const { data: profile } = await supabase.from('users').select('id, role, center_id').eq('id', authUser.id).single();
    if (!profile) throw new Error('Profile not found');
    if (profile.role !== 'center' && profile.role !== 'admin') throw new Error('Forbidden');

    const centerId = profile.center_id;
    if (!centerId) throw new Error('User not associated with a center');

    // Security check: Ensure teacher belongs to the same center
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('center_id')
      .eq('id', teacherId)
      .single();

    if (teacherError || !teacher) throw new Error('Teacher not found');
    if (teacher.center_id !== centerId) throw new Error('Forbidden: Teacher belongs to another center');

    // Check if permission record exists
    const { data: existingPerm } = await supabase
      .from("teacher_feature_permissions")
      .select("id")
      .eq("teacher_id", teacherId)
      .maybeSingle();

    if (existingPerm) {
      // Update existing permission
      const { data, error } = await supabase
        .from("teacher_feature_permissions")
        .update({ [featureName]: isEnabled })
        .eq("teacher_id", teacherId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Insert new permission record
      const { data, error } = await supabase
        .from("teacher_feature_permissions")
        .insert({ teacher_id: teacherId, [featureName]: isEnabled })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: unknown) {
    console.error(JSON.stringify({ event: 'error', message: 'Error in center-toggle-teacher-feature:', details: error }));
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

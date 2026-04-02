import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { studentId, centerId } = await req.json();

    // 1. Fetch Students (if studentId is null, process all for a center or all)
    let studentsQuery = supabase.from("students").select("id, center_id, grade, name").eq("is_active", true);
    if (studentId) studentsQuery = studentsQuery.eq("id", studentId);
    if (centerId) studentsQuery = studentsQuery.eq("center_id", centerId);

    const { data: students, error: studentsError } = await studentsQuery;
    if (studentsError) throw studentsError;

    const results = [];

    for (const student of students) {
      // 2. Fetch Attendance (last 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: attendance } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", student.id)
        .gte("date", ninetyDaysAgo);

      const totalAttendance = attendance?.length || 0;
      const presentCount = attendance?.filter(a => a.status === "present").length || 0;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

      // 3. Fetch Test Results
      const { data: testResults } = await supabase
        .from("test_results")
        .select("marks_obtained, tests(total_marks)")
        .eq("student_id", student.id);

      const avgGrade = testResults && testResults.length > 0
        ? testResults.reduce((acc, tr: any) => acc + (tr.marks_obtained / (tr.tests?.total_marks || 100)) * 100, 0) / testResults.length
        : 70; // Default to 70 if no tests

      // 4. Calculate Risk Score (50% attendance, 50% grades)
      // High Risk = attendance < 75% OR average grade < 50%
      // Medium Risk = attendance 75-85% OR average grade 50-65%
      // Low Risk = attendance > 85% AND average grade > 65%

      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      if (attendanceRate < 75 || avgGrade < 50) {
        riskLevel = 'High';
      } else if (attendanceRate < 85 || avgGrade < 65) {
        riskLevel = 'Medium';
      }

      const riskScore = Math.round(( (100 - attendanceRate) * 0.5 ) + ( (100 - avgGrade) * 0.5 ));

      // 5. Update predictive_scores
      const { data: upsertData, error: upsertError } = await supabase
        .from("predictive_scores")
        .upsert({
          student_id: student.id,
          center_id: student.center_id,
          risk_score: riskScore,
          risk_level: riskLevel,
          factors: { attendance: Math.round(attendanceRate), avg_grade: Math.round(avgGrade) },
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id' })
        .select();

      if (upsertError) console.error("Upsert Error:", upsertError);

      // 6. Trigger notification if High Risk
      if (riskLevel === 'High') {
        // Find center admin or relevant teacher
        const { data: users } = await supabase.from("users").select("id").eq("center_id", student.center_id).in("role", ["admin", "center"]);

        for (const user of users || []) {
           await supabase.from("notifications").insert({
            user_id: user.id,
            center_id: student.center_id,
            title: "High Academic Risk Alert",
            message: `Student ${student.name} (Grade ${student.grade}) is at high risk due to low ${attendanceRate < 75 ? 'attendance (' + Math.round(attendanceRate) + '%)' : 'grades (' + Math.round(avgGrade) + '%)'}.`,
            type: "warning",
            is_ai_insight: true
          });
        }
      }

      results.push({ studentId: student.id, riskScore, riskLevel });
    }

    return new Response(JSON.stringify({ success: true, processed: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

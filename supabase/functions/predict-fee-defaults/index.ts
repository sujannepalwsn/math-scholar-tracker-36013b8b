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

    let studentsQuery = supabase.from("students").select("id, center_id, name").eq("is_active", true);
    if (studentId) studentsQuery = studentsQuery.eq("id", studentId);
    if (centerId) studentsQuery = studentsQuery.eq("center_id", centerId);

    const { data: students, error: studentsError } = await studentsQuery;
    if (studentsError) throw studentsError;

    const results = [];

    for (const student of students) {
      // 1. Fetch Invoices and Payments
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, total_amount, paid_amount, status, due_date, invoice_date")
        .eq("student_id", student.id);

      const overdueInvoices = invoices?.filter(inv => inv.status === 'overdue') || [];
      const outstandingBalance = invoices?.reduce((acc, inv) => acc + (inv.total_amount - (inv.paid_amount || 0)), 0) || 0;

      // Calculate late payment ratio
      const { data: payments } = await supabase
        .from("payments")
        .select("payment_date, invoice_id, invoices(due_date)")
        .eq("invoices.student_id", student.id);

      const latePayments = payments?.filter(p => p.payment_date > p.invoices?.due_date).length || 0;
      const totalPayments = payments?.length || 0;
      const latePaymentRatio = totalPayments > 0 ? (latePayments / totalPayments) : 0;

      // 2. Prediction Scoring (Simplified logic)
      let riskScore = 0;
      if (overdueInvoices.length > 0) riskScore += 40;
      if (latePaymentRatio > 0.5) riskScore += 30;
      if (outstandingBalance > 5000) riskScore += 20;
      if (outstandingBalance > 10000) riskScore += 10;

      const riskLevel = riskScore > 70 ? 'High' : riskScore > 30 ? 'Medium' : 'Low';

      // 3. Upsert into fee_default_predictions
      await supabase
        .from("fee_default_predictions")
        .upsert({
          student_id: student.id,
          center_id: student.center_id,
          prediction_score: riskScore,
          risk_level: riskLevel,
          factors: { late_payments: latePayments, outstanding_balance: outstandingBalance, overdue_count: overdueInvoices.length },
          predicted_at: new Date().toISOString()
        }, { onConflict: 'student_id' });

      // 4. Alert if High Risk
      if (riskLevel === 'High') {
        const { data: admins } = await supabase.from("users").select("id").eq("center_id", student.center_id).in("role", ["admin", "center"]);
        for (const admin of admins || []) {
          await supabase.from("notifications").insert({
            user_id: admin.id,
            center_id: student.center_id,
            title: "Financial Default Warning",
            message: `Student ${student.name} is at high risk of fee default. Outstanding balance: ${outstandingBalance}.`,
            type: "error",
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

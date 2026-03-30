/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { format, addDays } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { month, year, academicYear, dueInDays = 30, gradeFilter = 'all' } = await req.json();

    if (!month || !year || !academicYear) {
      return new Response(
        JSON.stringify({ success: false, error: 'Month, year, and academic year are required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user and get context
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !authUser) throw new Error('Unauthorized');

    const { data: profile } = await supabase.from('users').select('id, role, center_id').eq('id', authUser.id).single();
    if (!profile) throw new Error('Profile not found');
    if (profile.role !== 'center' && profile.role !== 'admin') throw new Error('Forbidden');

    const centerId = profile.center_id;
    if (!centerId) throw new Error('User not associated with a center');

    let studentsQuery = supabase.from('students').select('id, name, grade').eq('center_id', centerId).eq('is_active', true);
    if (gradeFilter !== 'all') studentsQuery = studentsQuery.eq('grade', gradeFilter);
    const { data: students, error: studentsError } = await studentsQuery;
    if (studentsError) throw studentsError;

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ success: true, invoicesGenerated: 0, message: 'No active students found.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const generatedInvoices: Array<{ invoiceId: string; invoiceNumber: string; studentId: string; studentName: string; totalAmount: number }> = [];
    const invoiceDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
    const dueDate = format(addDays(new Date(invoiceDate), dueInDays), 'yyyy-MM-dd');

    for (const student of students) {
      const { data: existingInvoice } = await supabase.from('invoices').select('id').eq('student_id', student.id).eq('invoice_month', month).eq('invoice_year', year).maybeSingle();
      if (existingInvoice) continue;

      const { data: feeAssignments, error: feeError } = await supabase.from('fee_structures').select('id, amount, frequency, fee_headings(id, name)').eq('center_id', centerId).eq('class', student.grade);
      if (feeError || !feeAssignments?.length) continue;

      let totalAmount = 0;
      const invoiceItems: Array<{ fee_heading_id: string | null; description: string; unit_amount: number; quantity: number; total_amount: number }> = [];

      for (const assignment of feeAssignments) {
        totalAmount += assignment.amount;
        const feeHeading = Array.isArray(assignment.fee_headings) ? assignment.fee_headings[0] : assignment.fee_headings;
        invoiceItems.push({ fee_heading_id: feeHeading?.id || null, description: feeHeading?.name || 'Fee', unit_amount: assignment.amount, quantity: 1, total_amount: assignment.amount });
      }

      if (totalAmount === 0) continue;

      const invoiceNumber = `INV-${format(new Date(), 'yyyyMMddHHmmss')}-${student.name.substring(0, 3).toUpperCase()}`;
      const { data: newInvoice, error: invoiceError } = await supabase.from('invoices').insert({
        center_id: centerId, student_id: student.id, invoice_number: invoiceNumber, total_amount: totalAmount,
        paid_amount: 0, due_date: dueDate, invoice_date: invoiceDate, invoice_month: month, invoice_year: year,
        status: 'issued', notes: `Monthly fees for ${format(new Date(year, month - 1), 'MMMM yyyy')}`,
      }).select().single();

      if (invoiceError) continue;

      if (invoiceItems.length > 0) {
        await supabase.from('invoice_items').insert(invoiceItems.map(item => ({ ...item, invoice_id: newInvoice.id })));
      }

      generatedInvoices.push({ invoiceId: newInvoice.id, invoiceNumber: newInvoice.invoice_number, studentId: student.id, studentName: student.name, totalAmount: newInvoice.total_amount });
    }

    return new Response(JSON.stringify({ success: true, invoicesGenerated: generatedInvoices.length, invoices: generatedInvoices }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate invoices';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

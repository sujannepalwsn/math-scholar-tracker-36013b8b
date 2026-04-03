
-- ========================================
-- STEP 1: Enable RLS on ALL public tables
-- ========================================
ALTER TABLE public.academic_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_default_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_headings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_card_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resource_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_conclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nav_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positive_reinforcement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_model_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preschool_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_skill_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_engine_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_homework_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_learning_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_promotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: Remove dangerous public-role USING(true) policies
-- These "Service role full access" policies are on the {public} role instead of {service_role}
-- ========================================
DROP POLICY IF EXISTS "Service role full access" ON public.activities;
DROP POLICY IF EXISTS "Service role full access" ON public.activity_types;
DROP POLICY IF EXISTS "Service role full access" ON public.center_feature_permissions;
DROP POLICY IF EXISTS "Service role full access" ON public.class_teacher_assignments;
DROP POLICY IF EXISTS "Service role full access" ON public.discipline_categories;
DROP POLICY IF EXISTS "Service role full access" ON public.discipline_issues;
DROP POLICY IF EXISTS "Service role full access" ON public.expenses;
DROP POLICY IF EXISTS "Service role full access" ON public.fee_headings;
DROP POLICY IF EXISTS "Service role full access" ON public.fee_structures;
DROP POLICY IF EXISTS "Service role full access" ON public.meeting_attendees;
DROP POLICY IF EXISTS "Service role full access" ON public.meeting_conclusions;
DROP POLICY IF EXISTS "Service role full access" ON public.meetings;
DROP POLICY IF EXISTS "Service role full access" ON public.payments;
DROP POLICY IF EXISTS "Service role full access" ON public.preschool_activities;
DROP POLICY IF EXISTS "Service role full access" ON public.student_activities;
DROP POLICY IF EXISTS "Service role full access" ON public.student_chapters;
DROP POLICY IF EXISTS "Service role full access" ON public.student_homework_records;
DROP POLICY IF EXISTS "Service role full access" ON public.system_settings;
DROP POLICY IF EXISTS "Service role full access" ON public.teacher_attendance;
DROP POLICY IF EXISTS "Service role full access" ON public.teacher_feature_permissions;
DROP POLICY IF EXISTS "Service role full access" ON public.test_marks;
DROP POLICY IF EXISTS "Service role full access" ON public.test_results;

-- ========================================
-- STEP 3: Remove "Public full access" policies on leave tables
-- ========================================
DROP POLICY IF EXISTS "Public full access for leave applications" ON public.leave_applications;
DROP POLICY IF EXISTS "Public full access for categories" ON public.leave_categories;

-- ========================================
-- STEP 4: Remove dangerous public INSERT policies for error_logs
-- ========================================
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Public insert" ON public.error_logs;

-- ========================================
-- STEP 5: Fix storage.objects policies — remove public write/delete
-- ========================================
DROP POLICY IF EXISTS "Allow all delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow all insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow all update" ON storage.objects;
DROP POLICY IF EXISTS "Allow all select" ON storage.objects;

-- Add proper authenticated-only storage policies
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update their files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete their files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- STEP 6: Add error_logs insert policy for authenticated users only
-- ========================================
CREATE POLICY "Authenticated users can insert error logs"
  ON public.error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ========================================
-- STEP 7: Add leave policies for authenticated users
-- ========================================
CREATE POLICY "Users manage own center leave applications"
  ON public.leave_applications FOR ALL
  TO authenticated
  USING (public.get_user_center_id() = center_id)
  WITH CHECK (public.get_user_center_id() = center_id);

CREATE POLICY "Users view own center leave categories"
  ON public.leave_categories FOR ALL
  TO authenticated
  USING (public.get_user_center_id() = center_id)
  WITH CHECK (public.get_user_center_id() = center_id);

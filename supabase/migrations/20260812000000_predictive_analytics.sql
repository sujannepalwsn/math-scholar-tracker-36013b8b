
-- Migration for Predictive Analytics and AI Insights

-- 1. Create predictive_scores table
CREATE TABLE IF NOT EXISTS public.predictive_scores (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    risk_score numeric NOT NULL DEFAULT 0, -- 0 to 100
    risk_level text CHECK (risk_level IN ('Low', 'Medium', 'High')),
    predicted_grade numeric,
    attendance_weight numeric DEFAULT 0.5,
    grade_weight numeric DEFAULT 0.5,
    factors jsonb DEFAULT '{}'::jsonb, -- e.g., {"attendance": 70, "avg_grade": 45}
    last_calculated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT predictive_scores_pkey PRIMARY KEY (id)
);

-- 2. Create ai_insights table for sentiment analysis and summaries
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    entity_type text NOT NULL, -- 'student', 'teacher', 'lesson'
    entity_id uuid NOT NULL,
    insight_type text NOT NULL, -- 'sentiment', 'summary', 'behavior_pattern'
    content text NOT NULL,
    sentiment_score numeric, -- -1 to 1
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_insights_pkey PRIMARY KEY (id)
);

-- 3. Create fee_default_predictions table
CREATE TABLE IF NOT EXISTS public.fee_default_predictions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    prediction_score numeric NOT NULL, -- 0 to 100
    risk_level text CHECK (risk_level IN ('Low', 'Medium', 'High')),
    factors jsonb DEFAULT '{}'::jsonb, -- e.g., {"late_payments": 3, "outstanding_balance": 5000}
    predicted_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fee_default_predictions_pkey PRIMARY KEY (id)
);

-- 4. Add RLS Policies
ALTER TABLE public.predictive_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_default_predictions ENABLE ROW LEVEL SECURITY;

-- Predictive Scores Policies
CREATE POLICY "Admins can view all predictive scores"
ON public.predictive_scores FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Center admins can view their center's predictive scores"
ON public.predictive_scores FOR SELECT
USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Teachers can view scores for their students"
ON public.predictive_scores FOR SELECT
USING (
    student_id IN (
        SELECT s.id FROM public.students s
        WHERE s.center_id = (SELECT center_id FROM public.users WHERE id = auth.uid())
        -- Additional teacher scope logic would go here if needed
    )
);

CREATE POLICY "Parents can view their child's predictive scores"
ON public.predictive_scores FOR SELECT
USING (
    student_id IN (
        SELECT student_id FROM public.parent_students WHERE parent_user_id = auth.uid()
    )
);

-- AI Insights Policies (Similar to Predictive Scores)
CREATE POLICY "Admins can view all AI insights"
ON public.ai_insights FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Center admins can view their center's AI insights"
ON public.ai_insights FOR SELECT
USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

-- Fee Default Prediction Policies (Restricted to Admin/Center)
CREATE POLICY "Admins can view all fee predictions"
ON public.fee_default_predictions FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Center admins can view their center's fee predictions"
ON public.fee_default_predictions FOR SELECT
USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

-- 5. Add is_ai_insight column to notifications if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE column_name = 'is_ai_insight' AND table_name = 'notifications' AND table_schema = 'public') THEN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_ai_insight boolean DEFAULT false;
    END IF;
END $$;

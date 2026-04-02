
-- Migration for Batch and Real-time Triggers

-- 1. Setup Daily Predictive Jobs via pg_cron
-- (This requires pg_cron to be enabled in Supabase dashboard)
-- We will add a function that calls our edge functions

CREATE OR REPLACE FUNCTION public.trigger_daily_predictive_analytics()
RETURNS void AS $$
DECLARE
    center_id uuid;
BEGIN
    FOR center_id IN (SELECT id FROM public.centers) LOOP
        -- Call calculate-student-risk for each center
        PERFORM net.http_post(
            url := concat(current_setting('app.settings.supabase_url'), '/functions/v1/calculate-student-risk'),
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key'))
            ),
            body := jsonb_build_object('centerId', center_id)
        );

        -- Call predict-fee-defaults for each center
        PERFORM net.http_post(
            url := concat(current_setting('app.settings.supabase_url'), '/functions/v1/predict-fee-defaults'),
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key'))
            ),
            body := jsonb_build_object('centerId', center_id)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Real-time Trigger for Attendance/Grades Updates
CREATE OR REPLACE FUNCTION public.after_attendance_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only call if status changed to absent or present
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        PERFORM net.http_post(
            url := concat(current_setting('app.settings.supabase_url'), '/functions/v1/calculate-student-risk'),
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key'))
            ),
            body := jsonb_build_object('studentId', NEW.student_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_after_attendance_update
AFTER UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.after_attendance_update_trigger();

-- 3. Sentiment Analysis on Lesson Notes Trigger
CREATE OR REPLACE FUNCTION public.after_lesson_plan_notes_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.notes IS NOT NULL AND (OLD.notes IS NULL OR NEW.notes IS DISTINCT FROM OLD.notes) THEN
        PERFORM net.http_post(
            url := concat(current_setting('app.settings.supabase_url'), '/functions/v1/analyze-sentiment'),
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key'))
            ),
            body := jsonb_build_object(
                'entityType', 'lesson',
                'entityId', NEW.id,
                'centerId', NEW.center_id,
                'textContent', NEW.notes
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_after_lesson_plan_notes_update
AFTER UPDATE ON public.lesson_plans
FOR EACH ROW EXECUTE FUNCTION public.after_lesson_plan_notes_trigger();

-- 4. Batch Job via pg_cron (Example, needs manual setup in Supabase dashboard)
-- SELECT cron.schedule('daily-predictive-analytics', '0 0 * * *', 'SELECT public.trigger_daily_predictive_analytics();');

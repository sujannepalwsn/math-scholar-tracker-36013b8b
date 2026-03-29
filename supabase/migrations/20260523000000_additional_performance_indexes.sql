-- Additional Performance Indexes for high-frequency filter columns

-- Attendance filters
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Teacher Attendance filters
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance(date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_status ON teacher_attendance(status);

-- Lesson Plans filters
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher_id ON lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_lesson_date ON lesson_plans(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_status ON lesson_plans(status);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_grade ON lesson_plans(grade);

-- Homework filters
CREATE INDEX IF NOT EXISTS idx_homework_teacher_id ON homework(teacher_id);
CREATE INDEX IF NOT EXISTS idx_homework_due_date ON homework(due_date);
CREATE INDEX IF NOT EXISTS idx_homework_grade ON homework(grade);

-- Student Homework Records filters
CREATE INDEX IF NOT EXISTS idx_student_homework_records_status ON student_homework_records(status);

-- Tests and Results filters
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON tests(created_by);
CREATE INDEX IF NOT EXISTS idx_tests_test_date ON tests(test_date);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_date_taken ON test_results(date_taken);

-- Activities filters
CREATE INDEX IF NOT EXISTS idx_activities_activity_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_grade ON activities(grade);

-- Discipline Issues filters
CREATE INDEX IF NOT EXISTS idx_discipline_issues_issue_date ON discipline_issues(issue_date);
CREATE INDEX IF NOT EXISTS idx_discipline_issues_status ON discipline_issues(status);

-- Leave Applications filters
CREATE INDEX IF NOT EXISTS idx_leave_applications_status ON leave_applications(status);
CREATE INDEX IF NOT EXISTS idx_leave_applications_start_date ON leave_applications(start_date);
CREATE INDEX IF NOT EXISTS idx_leave_applications_end_date ON leave_applications(end_date);

-- Routine and Substitutions
CREATE INDEX IF NOT EXISTS idx_period_schedules_day_of_week ON period_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_period_schedules_grade ON period_schedules(grade);
CREATE INDEX IF NOT EXISTS idx_class_substitutions_date ON class_substitutions(date);

# Math Scholar Tracker - Predictive Analytics & AI Insights Documentation

## Data Mapping

### Existing Data
- `students`: Base entity for all student-related analytics.
- `attendance`: Used for calculating attendance rate (Risk Factor).
- `test_results` / `tests`: Used for calculating average proficiency (Risk Factor).
- `invoices` / `payments`: Used for analyzing payment patterns (Fee Default Risk).
- `lesson_plans`: Teacher notes used for sentiment analysis.

### New Features (Predictive Analytics)
- `predictive_scores` table: Stores academic risk scores and levels (Low, Medium, High).
- `fee_default_predictions` table: Stores financial risk scores for centers.
- `ai_insights` table: Stores AI-generated summaries and sentiment scores.

### Dashboards Integration
- **Admin Dashboard**: Global revenue tracking and Center performance comparison charts.
- **Center Dashboard**: "Academic Risk" and "Fee Default" AI widgets. Enrollment vs. Collection trends.
- **Teacher Dashboard**: "Student Risk Matrix" for assigned students. Anonymized performance benchmarking against global averages.
- **Parent Dashboard**: "Academic Forecast" widget. New "Daily Snapshot" mobile-friendly view.

### Alerts System
- **Triggers**:
    - High Risk academic score triggers a `warning` notification.
    - High Fee Default probability triggers an `error` notification.
    - Negative sentiment in lesson notes triggers a `warning` notification.
- **Visuals**: Notifications tagged with `is_ai_insight = true` display a Brain icon and indigo styling in the `AlertList`.

## Backend Infrastructure
- **Edge Functions**:
    - `calculate-student-risk`: Aggregates attendance and grades.
    - `predict-fee-defaults`: Analyzes invoice and payment history.
    - `analyze-sentiment`: Uses AI to parse qualitative teacher notes.
- **Automation**:
    - `pg_cron`: Scheduled daily batch calculation.
    - **Database Triggers**: Real-time updates on attendance or lesson plan modification.

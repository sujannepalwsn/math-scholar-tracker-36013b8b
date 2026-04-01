# RLS Architecture - Risk Analysis & System Integrity

## Schema Integrity
The Row Level Security (RLS) architecture has been designed to enforce strict multi-tenant isolation. A thorough verification of the schema confirms that almost all center-scoped tables (including `notices`, `payments`, `attendance`, and `students`) already possess a `center_id` column, which is the primary hook for isolation.

The following tables are globally scoped and correctly do **not** have a `center_id`:
1.  `system_settings`
2.  `module_permissions_meta`
3.  `subscription_plans`
4.  `login_page_settings`
5.  `centers` (The root entity)
6.  `error_logs` (System-wide monitoring)

## Risky or Poorly Designed Tables

1.  **`users` table**: Storing password hashes in the same table as user metadata is a security risk. If RLS is ever bypassed (e.g., via a leaked service role key), all hashes are exposed.
    - *Mitigation*: The RLS policies implemented here strictly limit access to the `users` table, allowing users to only see themselves and admins to see only their center's users.
2.  **`error_logs`**: Being a global table, it presents a cross-tenant data leak risk if not strictly limited.
    - *Mitigation*: Policies restrict `SELECT` to Super Admins only.
3.  **`broadcast_messages` & `notices`**: The `target_audience` is a text field. RLS enforces center isolation, but internal targeting (e.g., "Teachers only") relies on frontend logic or more complex RLS.
    - *Mitigation*: Policies currently ensure no one outside the center can see these messages.
4.  **`results` & `student_results`**: Use `bigint` for IDs. Predictable IDs can sometimes lead to scraping risks if RLS is weak.
    - *Mitigation*: Robust student-scoped RLS policies prevent unauthorized access to result records.

## Architecture Highlights
- **Recursion Prevention**: Uses a private `security` schema and `SECURITY DEFINER` functions to look up user context without triggering RLS loops.
- **Multi-Student Support**: Parents can access records for all their children linked via the `parent_students` mapping table.
- **Teacher Scope**: Teachers are restricted to assigned grades for operational records (attendance, exams, homework) but have broad read access to school configuration.
- **Fail-Closed**: Policies default to restricted access and require explicit role-based matches.

# RLS Architecture - Schema Adjustments & Risk Analysis

## Required Schema Adjustments
The following tables are currently "center-scoped" in logic but lack a `center_id` column in the provided schema. To enable robust RLS, these columns **must** be added:

1.  `notices` - Currently has `target_audience` and `target_grade` but no `center_id`.
2.  `fee_installments` - Only has `invoice_id`. Should have `center_id` for direct filtering.
3.  `invoice_items` - Only has `invoice_id`. Should have `center_id` for direct filtering.
4.  `payments` - Only has `invoice_id`. Should have `center_id` for direct filtering.
5.  `student_chapters` - Only has `student_id`. Should have `center_id` for direct filtering.
6.  `student_homework_records` - Only has `student_id` and `homework_id`. Should have `center_id` for direct filtering.
7.  `test_marks` - Only has `student_id` and `test_id`. Should have `center_id` for direct filtering.
8.  `test_results` - Only has `student_id` and `test_id`. Should have `center_id` for direct filtering.
9.  `student_promotion_history` - Only has `student_id`. Should have `center_id` for direct filtering.
10. `student_results` - Only has `student_id` and `result_id`. Should have `center_id` for direct filtering.
11. `payroll_logs` - Only has `teacher_id`. Should have `center_id` for direct filtering.
12. `performance_evaluations` - Only has `teacher_id`. Should have `center_id` for direct filtering.
13. `staff_contracts` - Only has `teacher_id`. Should have `center_id` for direct filtering.
14. `staff_documents` - Only has `teacher_id`. Should have `center_id` for direct filtering.
15. `consumable_logs` - Only has `consumable_id`. Should have `center_id` for direct filtering.

## Risky or Poorly Designed Tables

1.  **`users` table**: Storing password hashes in the same table as user metadata is risky if RLS is ever bypassed or if a SQL injection occurs. Recommendation: Use a separate `profiles` table for metadata and keep `users` minimal.
2.  **`error_logs`**: Being a global table without `center_id` makes it a cross-tenant data leak risk if not strictly limited to Super Admins.
3.  **`login_page_settings`**: Uses `page_type` as a primary key but lacks `center_id`. This implies settings are global for the entire platform rather than per-school.
4.  **`parent_students`**: Lacks a `center_id`. This can cause issues if a parent has students in different schools managed by the same system (if that's a supported use case).
5.  **`results` and `student_results`**: These use `bigint` for IDs instead of `uuid`, which is inconsistent with the rest of the schema and can lead to predictability issues.
6.  **`broadcast_messages`**: The `target_audience` is a simple text field. If the frontend doesn't correctly handle this, it could lead to messages being visible to the wrong groups despite RLS (as RLS would only filter by `center_id`).

## Implementation Note
The generated RLS policies assume that `center_id` exists on all these tables. If the schema is not updated, the policies will fail to compile. I have included the `center_id` in the logic as if it was already there to ensure the architecture is "correct by design."

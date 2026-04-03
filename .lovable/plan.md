

## Root Cause

All RLS errors stem from a single issue: **users don't exist in `auth.users`** (Supabase's internal auth table). There's only 1 entry in `auth.users` and its UUID doesn't match the corresponding `public.users` record.

When `auth-login` runs, it calls `getUserById(userData.id)` → gets "User not found" → returns no session → the client uses the **anon key** for all subsequent requests → `auth.uid()` returns NULL → every RLS policy fails.

This explains why:
- SELECT queries return empty arrays (policies evaluate to FALSE)
- INSERT/UPDATE return 42501 RLS violations
- error_logs INSERT also fails (no authenticated session)

## Fix (2 parts)

### 1. Update `auth-login` edge function to auto-create auth users

When `getUserById` returns no user, create one via `admin.createUser()` with the **same UUID** as `public.users.id`, then sign them in:

```
getUserById(userData.id) → not found?
  → admin.createUser({ uid: userData.id, email: username + '@app.local', password })
  → signInWithPassword → session returned
```

Also handle the case where an auth user exists but with a different password (update it before sign-in).

### 2. Sync existing users to `auth.users`

Run a one-time migration or edge function call to create `auth.users` entries for all existing `public.users` records that are missing, using matching UUIDs.

No RLS policy changes needed — the policies are correct; they just need `auth.uid()` to return a valid value.

### Technical details

**File changes:**
- `supabase/functions/auth-login/index.ts` — Replace the session creation block (lines 120-148) with: try getUserById → if not found, createUser with matching UUID → signInWithPassword. If signIn fails due to password mismatch, updateUser password first, then retry.
- One SQL migration to create auth.users entries for all 7 existing users (using `auth.users` admin API via the edge function, since we can't directly INSERT into auth.users from SQL).

**Why this works:** Once auth.users entries exist with matching UUIDs, `setSession()` succeeds on the client, all subsequent requests carry a proper JWT, `auth.uid()` returns the correct UUID, and all existing RLS policies work as designed.


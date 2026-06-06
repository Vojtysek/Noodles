# User Invite by Email — Design Spec

**Date:** 2026-06-06  
**Status:** Approved

## Summary

Allow an existing user to invite a new user by email from the overview dashboard. No email is sent — the invitee manually navigates to the login page, signs up with the invited email, and gains full shared ownership of the inviting user's building data.

---

## Database Schema

### New Table: `building_invites`

Stores pending invites for emails that have not yet registered.

```sql
CREATE TABLE building_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(building_id, invited_email)
);
```

**RLS:**
- INSERT: authenticated user where `created_by_user_id = auth.uid()`
- DELETE: authenticated user where `created_by_user_id = auth.uid()`
- No SELECT policy needed (invite check happens server-side via service role or elevated query)

### New Table: `building_members`

Stores accepted members (registered users with shared building access).

```sql
CREATE TABLE building_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(building_id, user_id)
);
```

**RLS:**
- SELECT: `user_id = auth.uid()`
- INSERT: service role only (inserted server-side at `/auth/confirm`)
- No DELETE/UPDATE policies (membership is permanent unless admin removes)

### RLS Changes on Existing Tables

Expand SELECT (and UPDATE/DELETE where applicable) policies on the following tables to also allow access when the building is in `building_members` for the current user:

**`buildings`:** Add OR condition:
```sql
id IN (SELECT building_id FROM building_members WHERE user_id = auth.uid())
```

**`personas`:** Personas are linked to a building via `user_id`. Expand to also allow if the persona's `user_id` owns a building the current user is a member of. Simpler approach: add `user_id` to the member's own data by fetching building owner's user_id and allowing access by that.

> **Note:** `personas`, `exports`, and `user_archetypes` are scoped by `user_id` (the building owner's user_id), not `building_id`. The shared member accesses these via the building's `user_id`. RLS on these tables must be expanded to: `user_id = auth.uid() OR user_id IN (SELECT buildings.user_id FROM buildings JOIN building_members ON buildings.id = building_members.building_id WHERE building_members.user_id = auth.uid())`.

---

## Post-Signup Flow

The invite linkage happens at `/app/auth/confirm/route.ts` — after Supabase email confirmation exchanges the token for an active session:

1. Exchange token for session (existing logic)
2. Get the confirmed user's email from the session
3. Query `building_invites` for `invited_email = user.email`
4. If a row exists:
   a. Insert into `building_members(building_id, user_id)`
   b. Delete the invite row from `building_invites`
5. Redirect to `/dashboard/prehled` (existing logic)

If no invite exists, proceed normally — no change to the existing flow.

---

## UI Changes

### Overview Page (`/dashboard/prehled`) — Compact Invite Section

A compact inline section added to the existing overview page. Contains:
- Email input field (type="email")
- "Pozvat" submit button
- Success message: "Pozvánka přidána" (no toast needed, inline feedback)
- Error states: "Neplatný email", "Již pozváno", or generic error

No list of existing invites displayed. The section is always visible (not collapsible) but visually compact.

**Server action:** `addInvite(formData)` in `/app/dashboard/prehled/actions.ts`
- Gets current user's building_id
- Inserts into `building_invites`
- Returns success/error state

### Login Page (`/app/login/page.tsx`) — Invited User Prompt

A small secondary text link below the main login form:
> "Byli jste pozváni? Zaregistrujte se zde →"

Clicking activates the existing signup mode. A brief helper note appears:
> "Použijte email, na který jste byli pozváni."

No new page or route needed — reuses the existing signup toggle.

---

## Data Flow Summary

```
Admin (existing user)
  → enters email on /dashboard/prehled
  → building_invites row created

Invitee
  → navigates to /login manually
  → sees "Byli jste pozváni?" link
  → clicks → signup mode activates
  → registers with invited email + chosen password
  → receives confirmation email (Supabase default)
  → clicks confirmation link → /auth/confirm
  → server checks building_invites for their email
  → building_members row created, invite deleted
  → redirected to /dashboard/prehled
  → sees full shared building data
```

---

## Out of Scope

- Removing a member once added
- Listing current members/invites in the UI
- Role-based access (all members have full access)
- Resending or cancelling invites
- Invite expiry

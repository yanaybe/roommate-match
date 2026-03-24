

## Fix: Squad Join Request Failing for Existing Invite Records

### Problem
The `squad_invites` table has a `UNIQUE(squad_id, invitee_id)` constraint. When you try to join a squad created by a user you've previously interacted with (e.g., Yanay Berdah), there's already a row for that `(squad_id, invitee_id)` pair from a prior accepted/rejected invite, causing the `INSERT` to fail. It works for "unknown" users because no prior record exists.

### Solution
Change the `handleRequestJoin` function in `src/pages/MySquads.tsx` from `.insert()` to `.upsert()` with `onConflict: "squad_id,invitee_id"`, so it resets the status to `"pending"` instead of failing when a record already exists.

### Changes

**File: `src/pages/MySquads.tsx`** (1 change)
- Line ~114: Replace `.insert({...})` with `.upsert({...}, { onConflict: "squad_id,invitee_id" })` in the `handleRequestJoin` function.


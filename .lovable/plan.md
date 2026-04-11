

## Plan: Create and Deploy a `notify` Edge Function

Since no `notify` edge function exists yet, we need to create one. Based on the existing notification system, this function would insert rows into the `notifications` table server-side (e.g., triggered by other backend logic or external webhooks).

### What will be built

A `notify` edge function at `supabase/functions/notify/index.ts` that:

1. **Accepts a POST request** with a JSON body containing `user_id`, `type`, `title`, `body` (optional), `actor_id` (optional), and `reference_id` (optional)
2. **Validates input** using Zod
3. **Authenticates** the caller (requires service role key or valid JWT)
4. **Inserts a notification** into the `public.notifications` table using a service-role Supabase client
5. **Returns** the created notification
6. **Includes CORS headers** for web app compatibility

### File to create

- `supabase/functions/notify/index.ts`

### Technical details

- Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (already available as secrets)
- CORS headers imported from `@supabase/supabase-js/cors` or defined manually
- Input validated with Zod (user_id required as UUID, type as enum, title as non-empty string)
- The function will be deployed automatically after creation


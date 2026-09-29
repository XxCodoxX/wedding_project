-- Migration: Live updates for the admin guest table (Supabase Realtime, private Broadcast)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- Design: a trigger broadcasts every guest change to a PRIVATE channel per wedding
-- ("wedding:<id>:guests"). Only signed-in users allowed to manage that wedding can
-- subscribe. The guests table itself stays closed to the browser (no SELECT policy),
-- so guest data is never readable through the public REST API.

-- 1. Access check usable from RLS policies.
--    SECURITY DEFINER so it can read user_profiles (which has RLS with no policies).
CREATE OR REPLACE FUNCTION public.can_access_wedding(p_wedding_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE auth_user_id = auth.uid()
      AND (role = 'admin' OR assigned_wedding_id = p_wedding_id)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_wedding(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_wedding(uuid) TO authenticated, service_role;

-- 2. Broadcast guest changes to the wedding's private channel.
CREATE OR REPLACE FUNCTION public.broadcast_guest_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'wedding:' || COALESCE(NEW.wedding_id, OLD.wedding_id)::text || ':guests', -- topic
    TG_OP,            -- event   (INSERT / UPDATE / DELETE)
    TG_OP,            -- operation
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS guests_broadcast_changes ON public.guests;
CREATE TRIGGER guests_broadcast_changes
AFTER INSERT OR UPDATE OR DELETE ON public.guests
FOR EACH ROW EXECUTE FUNCTION public.broadcast_guest_change();

-- 3. Who may LISTEN on "wedding:<id>:guests": admins, or the user assigned to that wedding.
DROP POLICY IF EXISTS "Wedding managers receive guest changes" ON realtime.messages;
CREATE POLICY "Wedding managers receive guest changes"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.messages.extension = 'broadcast'
  AND realtime.topic() ~ '^wedding:[0-9a-f-]{36}:guests$'
  AND public.can_access_wedding(split_part(realtime.topic(), ':', 2)::uuid)
);

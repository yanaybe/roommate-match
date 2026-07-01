-- Fix: Squad deletion should cascade to members, invites, and messages
-- Using IF EXISTS on constraint drops so this is safe to re-run.

ALTER TABLE squad_members
  DROP CONSTRAINT IF EXISTS squad_members_squad_id_fkey,
  ADD CONSTRAINT squad_members_squad_id_fkey
    FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE;

ALTER TABLE squad_invites
  DROP CONSTRAINT IF EXISTS squad_invites_squad_id_fkey,
  ADD CONSTRAINT squad_invites_squad_id_fkey
    FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE;

ALTER TABLE squad_messages
  DROP CONSTRAINT IF EXISTS squad_messages_squad_id_fkey,
  ADD CONSTRAINT squad_messages_squad_id_fkey
    FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE;

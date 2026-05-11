-- Public activity feed — anonymised events shown in the home-feed activity strip.
-- Two trigger sources: new apartment listings + mutual profile likes (matches).

CREATE TABLE IF NOT EXISTS public_activity (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text        NOT NULL CHECK (type IN ('match', 'listing')),
  display_text text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activity"
  ON public_activity FOR SELECT USING (true);

-- ── New listing trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_notify_new_listing()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public_activity (type, display_text)
  VALUES (
    'listing',
    '🏠 New listing: ' || NEW.neighborhood || ' · ₪' || NEW.price::text
  );
  -- Keep the table lean: prune entries older than 7 days on every insert
  DELETE FROM public_activity WHERE created_at < now() - interval '7 days';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_listing ON apartments;
CREATE TRIGGER trg_notify_new_listing
  AFTER INSERT ON apartments
  FOR EACH ROW EXECUTE FUNCTION fn_notify_new_listing();

-- ── Mutual match trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_notify_mutual_match()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reverse_exists boolean;
  user_city      text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM liked_profiles
    WHERE user_id = NEW.liked_user_id AND liked_user_id = NEW.user_id
  ) INTO reverse_exists;

  IF reverse_exists THEN
    SELECT city INTO user_city FROM profiles WHERE user_id = NEW.user_id;
    INSERT INTO public_activity (type, display_text)
    VALUES (
      'match',
      '🎉 Two people just matched' ||
        CASE WHEN user_city IS NOT NULL AND user_city <> '' THEN ' in ' || user_city ELSE '' END
    );
    DELETE FROM public_activity WHERE created_at < now() - interval '7 days';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_mutual_match ON liked_profiles;
CREATE TRIGGER trg_notify_mutual_match
  AFTER INSERT ON liked_profiles
  FOR EACH ROW EXECUTE FUNCTION fn_notify_mutual_match();

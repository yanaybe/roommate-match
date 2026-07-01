DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'squads_name_length'
  ) THEN
    ALTER TABLE squads
      ADD CONSTRAINT squads_name_length
      CHECK (length(trim(name)) > 0 AND length(name) <= 40);
  END IF;
END $$;

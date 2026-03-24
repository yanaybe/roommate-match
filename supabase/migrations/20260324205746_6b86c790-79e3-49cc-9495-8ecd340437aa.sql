
-- Apartments table
CREATE TABLE public.apartments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  neighborhood TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  rooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  size INTEGER NOT NULL DEFAULT 0,
  floor INTEGER,
  available_date TEXT NOT NULL DEFAULT 'Immediately',
  room_type TEXT NOT NULL DEFAULT 'Private',
  room_description TEXT NOT NULL DEFAULT '',
  is_furnished BOOLEAN NOT NULL DEFAULT false,
  has_balcony BOOLEAN NOT NULL DEFAULT false,
  has_parking BOOLEAN NOT NULL DEFAULT false,
  has_elevator BOOLEAN NOT NULL DEFAULT false,
  has_ac BOOLEAN NOT NULL DEFAULT false,
  has_laundry BOOLEAN NOT NULL DEFAULT false,
  has_wifi BOOLEAN NOT NULL DEFAULT false,
  has_gym BOOLEAN NOT NULL DEFAULT false,
  has_security BOOLEAN NOT NULL DEFAULT false,
  has_rooftop BOOLEAN NOT NULL DEFAULT false,
  has_garden BOOLEAN NOT NULL DEFAULT false,
  pet_friendly BOOLEAN NOT NULL DEFAULT false,
  images TEXT[] NOT NULL DEFAULT '{}',
  coordinates DOUBLE PRECISION[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view apartments"
  ON public.apartments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own apartments"
  ON public.apartments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own apartments"
  ON public.apartments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own apartments"
  ON public.apartments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for apartment photos
INSERT INTO storage.buckets (id, name, public) VALUES ('apartment-images', 'apartment-images', true);

CREATE POLICY "Anyone can view apartment images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'apartment-images');

CREATE POLICY "Authenticated users can upload apartment images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'apartment-images');

CREATE POLICY "Users can delete own apartment images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'apartment-images');

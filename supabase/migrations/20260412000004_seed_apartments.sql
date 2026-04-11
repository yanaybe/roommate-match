-- =============================================================================
-- Seed: 25 Demo Apartments across Israel
-- Runs as postgres (bypasses RLS). Safe to re-run — skips if already seeded.
-- =============================================================================

DO $$
DECLARE
  seed_uid uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM public.apartments WHERE user_id = seed_uid LIMIT 1) THEN
    RAISE NOTICE 'Seed apartments already exist — skipping.';
    RETURN;
  END IF;

  INSERT INTO public.apartments (
    user_id, title, description, address, neighborhood, city,
    price, rooms, bathrooms, size, floor, available_date, room_type,
    is_furnished, has_balcony, has_parking, has_elevator, has_ac,
    has_laundry, has_wifi, has_gym, has_security, has_rooftop, has_garden,
    pet_friendly, images, coordinates
  ) VALUES

  -- Tel Aviv
  (seed_uid,
   'Sunny Loft in Florentin',
   'Bright and airy loft in the heart of the Florentin art district. High ceilings, exposed brick walls, and a vibrant street vibe. 5 minutes from Carmel Market.',
   'Vital Street 14', 'Florentin', 'Tel Aviv', 3200, 3, 1, 85, 2, 'Immediately', 'Private',
   true, true, false, false, true, true, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop'],
   ARRAY[32.0560, 34.7710]),

  (seed_uid,
   'Cozy Room near Carmel Market',
   'Warm apartment in the Kerem neighborhood, walking distance to Carmel Market and the beach. Quiet street, great natural light.',
   'HaCarmel Street 8', 'Kerem', 'Tel Aviv', 2800, 4, 2, 110, 1, 'Immediately', 'Private',
   false, false, false, false, true, false, true, false, false, true, false, true,
   ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop'],
   ARRAY[32.0650, 34.7680]),

  (seed_uid,
   'Modern Flat on Rothschild Boulevard',
   'Sleek 2-room apartment on the iconic Rothschild Boulevard. Full of light, steps from top restaurants and bars. Building has elevator and gym.',
   'Rothschild Blvd 55', 'Rothschild', 'Tel Aviv', 4500, 2, 1, 65, 4, 'Next month', 'Private',
   true, false, false, true, true, false, true, true, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop'],
   ARRAY[32.0635, 34.7745]),

  (seed_uid,
   'Artsy Apartment in Neve Tzedek',
   'Charming apartment in the trendy Neve Tzedek neighborhood. Private garden, artistic vibe, ideal for creative professionals.',
   'Shabazi Street 22', 'Neve Tzedek', 'Tel Aviv', 3800, 3, 1, 90, 0, 'Immediately', 'Private',
   true, false, false, false, true, true, true, false, false, false, true, false,
   ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&h=400&fit=crop'],
   ARRAY[32.0580, 34.7660]),

  (seed_uid,
   'Spacious Room in North Tel Aviv',
   'Large, quiet room in a 4-bedroom apartment in north Tel Aviv. Close to Yarkon Park, great for joggers and outdoor people.',
   'Ibn Gabirol Street 120', 'North Tel Aviv', 'Tel Aviv', 3600, 4, 2, 130, 3, 'Immediately', 'Private',
   false, true, true, true, true, true, true, false, true, false, false, true,
   ARRAY['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop'],
   ARRAY[32.0900, 34.7800]),

  (seed_uid,
   'Penthouse with Sea View — Jaffa Port',
   'Stunning penthouse steps from Jaffa Port. Rooftop terrace with 180° sea views. Fully renovated, premium finishes throughout.',
   'Yefet Street 5', 'Jaffa Port', 'Tel Aviv', 5500, 3, 2, 120, 5, 'Next month', 'Private',
   true, true, true, true, true, false, true, false, true, true, false, false,
   ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'],
   ARRAY[32.0520, 34.7550]),

  (seed_uid,
   'Budget-Friendly Room in Shapira',
   'Affordable room in the up-and-coming Shapira neighborhood. Great vibe, close to the central bus station and city center.',
   'Levanda Street 30', 'Shapira', 'Tel Aviv', 2400, 3, 1, 75, 2, 'Immediately', 'Shared',
   false, false, false, false, true, false, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop'],
   ARRAY[32.0500, 34.7780]),

  -- Jerusalem
  (seed_uid,
   'Student Flat in Nachlaot',
   'Cozy apartment in the charming Nachlaot neighborhood, steps from Mahane Yehuda market. Perfect for students or young professionals.',
   'Agrippas Street 40', 'Nachlaot', 'Jerusalem', 2200, 3, 1, 70, 1, 'Next month', 'Private',
   false, false, false, false, true, true, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop'],
   ARRAY[31.7800, 35.2150]),

  (seed_uid,
   'Renovated Flat in German Colony',
   'Beautiful renovated apartment in the quiet German Colony neighborhood. Stone floors, high ceilings, private garden.',
   'Emek Refaim Street 15', 'German Colony', 'Jerusalem', 3500, 2, 1, 55, 0, 'In 2 months', 'Private',
   true, false, false, false, true, true, true, false, false, false, true, false,
   ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&h=400&fit=crop'],
   ARRAY[31.7600, 35.2210]),

  (seed_uid,
   'Central Room near Hebrew University',
   'Ideal for students at Hebrew University. Furnished room in a shared flat with other students, close to campus and Mount Scopus.',
   'Moshe Dayan Street 3', 'Mount Scopus', 'Jerusalem', 2000, 4, 1, 80, 2, 'Immediately', 'Private',
   true, false, false, false, true, false, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop'],
   ARRAY[31.7900, 35.2400]),

  (seed_uid,
   'Quiet Apartment in Baka',
   'Peaceful flat in the Baka neighborhood. Old Jerusalem architecture with modern upgrades. Great for couples or professionals.',
   'Bethlehem Road 28', 'Baka', 'Jerusalem', 3000, 3, 1, 85, 1, 'Next month', 'Private',
   false, true, false, false, true, true, true, false, false, false, false, true,
   ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop'],
   ARRAY[31.7520, 35.2270]),

  -- Haifa
  (seed_uid,
   'Sea View Apartment in Bat Galim',
   'Amazing sea-view apartment in the Bat Galim neighborhood. Steps from the beach, cable car to Mount Carmel nearby.',
   'HaGaaton Street 12', 'Bat Galim', 'Haifa', 2600, 3, 1, 80, 2, 'Immediately', 'Private',
   false, true, false, false, true, false, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop'],
   ARRAY[32.8230, 34.9700]),

  (seed_uid,
   'Modern Loft in Carmel Center',
   'Stylish loft in Carmel Center with a large balcony and panoramic views. Close to Carmel market and Haifa nightlife.',
   'Hanassi Blvd 72', 'Carmel Center', 'Haifa', 3300, 2, 1, 60, 3, 'Next month', 'Private',
   true, true, false, true, true, true, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'],
   ARRAY[32.7950, 34.9860]),

  (seed_uid,
   'Affordable Room in Hadar',
   'Central room in the Hadar neighborhood, easy commute to the Technion and downtown. Quiet building with great neighbors.',
   'HaHalutz Street 18', 'Hadar', 'Haifa', 1900, 3, 1, 70, 1, 'Immediately', 'Shared',
   false, false, false, false, true, false, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop'],
   ARRAY[32.8100, 35.0050]),

  -- Beer Sheva
  (seed_uid,
   'Renovated Flat in Beer Sheva Old City',
   'Nicely renovated apartment near Ben-Gurion University. Ideal for students. All utilities included. Quiet street.',
   'Trumpeldor Street 6', 'Old City', 'Beer Sheva', 1800, 4, 2, 100, 2, 'Immediately', 'Private',
   false, false, true, false, true, true, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop'],
   ARRAY[31.2520, 34.7910]),

  (seed_uid,
   'Modern Room near BGU Campus',
   'Fully furnished room 5 minutes from Ben-Gurion University. Air conditioned, fast WiFi, all bills included.',
   'Rager Blvd 11', 'Gimel', 'Beer Sheva', 1600, 3, 1, 75, 0, 'Immediately', 'Private',
   true, false, false, false, true, false, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop'],
   ARRAY[31.2620, 34.8030]),

  -- Herzliya
  (seed_uid,
   'Penthouse in Herzliya Pituach',
   'Luxury penthouse 2 minutes from the beach in Herzliya Pituach. Rooftop pool, gym, 24/7 security. Tech-hub central.',
   'Maskit Street 3', 'Herzliya Pituach', 'Herzliya', 6000, 4, 2, 140, 6, 'In 2 months', 'Private',
   true, true, true, true, true, false, true, true, true, true, false, false,
   ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'],
   ARRAY[32.1620, 34.7870]),

  (seed_uid,
   'Tech-Hub Flat near Hi-Tech Park',
   'Perfect for tech workers. Walking distance to Herzliya Hi-Tech Park and Rashi Street companies. Fast internet, professional building.',
   'HaSolelim Street 7', 'Industrial Zone', 'Herzliya', 4000, 3, 1, 90, 2, 'Immediately', 'Private',
   false, false, true, true, true, false, true, false, true, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop'],
   ARRAY[32.1580, 34.8200]),

  -- Netanya
  (seed_uid,
   'Spacious Flat near the Beach',
   'Beautiful apartment a short walk from the Netanya beach. Bright and airy with parking included.',
   'Herzl Street 40', 'City Center', 'Netanya', 3100, 3, 1, 90, 1, 'Immediately', 'Private',
   false, false, true, false, true, true, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&h=400&fit=crop'],
   ARRAY[32.3290, 34.8560]),

  -- Ramat Gan
  (seed_uid,
   'Bright Room in Ramat Gan Diamond District',
   'Quiet apartment near the Ramat Gan diamond district and Safari Park. Easy access to Tel Aviv via rail.',
   'Jabotinsky Street 45', 'City Center', 'Ramat Gan', 2400, 3, 1, 75, 1, 'Next week', 'Private',
   false, true, false, false, true, false, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop'],
   ARRAY[32.0830, 34.8120]),

  -- Rishon LeZion
  (seed_uid,
   'Luxury Suite in West Rishon',
   'Fully equipped luxury apartment in the prestigious west side of Rishon LeZion. Pool, gym, underground parking.',
   'HaRishonim Blvd 90', 'West Rishon', 'Rishon LeZion', 4200, 3, 2, 95, 3, 'In 2 months', 'Private',
   true, true, true, true, true, false, true, true, true, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'],
   ARRAY[31.9640, 34.7750]),

  -- Petah Tikva
  (seed_uid,
   'Cozy Apartment in Petah Tikva Center',
   'Comfortable and affordable flat in the heart of Petah Tikva. Close to public transport, shopping, and parks.',
   'HaMelakhim Street 12', 'City Center', 'Petah Tikva', 2200, 3, 1, 80, 2, 'Immediately', 'Private',
   false, false, false, false, true, false, true, false, false, false, false, true,
   ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop'],
   ARRAY[32.0840, 34.8870]),

  -- Givatayim
  (seed_uid,
   'Garden Apartment in Givatayim',
   'Lovely ground-floor apartment with a private garden in quiet Givatayim. Close to Kikar HaMedina and Tel Aviv.',
   'Borochov Street 8', 'Borochov', 'Givatayim', 2900, 3, 1, 85, 0, 'Next month', 'Private',
   false, false, true, false, true, true, true, false, false, false, true, false,
   ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&h=400&fit=crop'],
   ARRAY[32.0710, 34.8100]),

  -- Ashdod
  (seed_uid,
   'Modern Room near Ashdod Port',
   'New apartment near Ashdod Port and the beach. Great for professionals working in the industrial zone. All utilities included.',
   'HaNamal Street 15', 'Port Area', 'Ashdod', 2000, 3, 1, 78, 2, 'Immediately', 'Private',
   false, true, false, false, true, false, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop'],
   ARRAY[31.8040, 34.6550]),

  (seed_uid,
   'Affordable Student Room in Ashdod',
   'Budget-friendly room in a shared apartment near the college and central bus station. Great roommates, very social vibe.',
   'Rokach Street 22', 'Aleph', 'Ashdod', 1700, 4, 1, 90, 1, 'Immediately', 'Shared',
   false, false, false, false, true, false, true, false, false, false, false, false,
   ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop'],
   ARRAY[31.8120, 34.6430]);

END $$;

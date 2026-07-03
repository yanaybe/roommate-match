import type { Apartment } from "@/data/mockData";

// Fallback coordinates when a listing hasn't been geocoded yet
export const CITY_COORDS: Record<string, [number, number]> = {
  "Tel Aviv": [32.0853, 34.7818],
  "Jerusalem": [31.7683, 35.2137],
  "Haifa": [32.7940, 34.9896],
  "Beer Sheva": [31.2520, 34.7915],
  "Netanya": [32.3226, 34.8533],
  "Herzliya": [32.1663, 34.8434],
  "Ramat Gan": [32.0826, 34.8127],
  "Rishon LeZion": [31.9730, 34.7925],
  "Petah Tikva": [32.0842, 34.8841],
  "Ashdod": [31.8010, 34.6550],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbRowToApartment(row: any): Apartment {
  const amenities: string[] = [];
  if (row.has_balcony) amenities.push("Balcony");
  if (row.has_parking) amenities.push("Parking");
  if (row.has_elevator) amenities.push("Elevator");
  if (row.has_ac) amenities.push("AC");
  if (row.has_laundry) amenities.push("Laundry");
  if (row.has_wifi) amenities.push("WiFi");
  if (row.has_gym) amenities.push("Gym");
  if (row.has_security) amenities.push("Security");
  if (row.has_rooftop) amenities.push("Rooftop");
  if (row.has_garden) amenities.push("Garden");
  if (row.pet_friendly) amenities.push("Pet Friendly");
  if (row.is_furnished) amenities.push("Furnished");

  const coords: [number, number] =
    Array.isArray(row.coordinates) && row.coordinates.length === 2
      ? [row.coordinates[0], row.coordinates[1]]
      : CITY_COORDS[row.city] ?? [32.0853, 34.7818];

  return {
    id: row.id,
    title: row.title,
    price: row.price,
    location: `${row.neighborhood}, ${row.city}`,
    coordinates: coords,
    images: row.images?.length ? row.images : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
    rooms: row.rooms,
    bathrooms: row.bathrooms,
    size: row.size,
    roommates: [],
    matchPercent: 0,
    amenities,
    available: row.available_date,
    isBoosted: (row.is_featured === true && (!row.featured_until || new Date(row.featured_until) > new Date())) ?? false,
    listingType: (row.listing_type ?? "room") as "room" | "entire_place",
    ownerId: row.user_id,
  };
}

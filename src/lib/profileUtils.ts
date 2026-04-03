export const getMockLikedProfileKey = (userId: string, likedUserId: string) =>
  `liked_profile:${userId}:${likedUserId}`;

export const getMockSavedApartmentKey = (userId: string, apartmentId: string) =>
  `saved_apartment:${userId}:${apartmentId}`;

export const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  occupation: string;
  avatar: string;
  budget: number;
  roomType: string;
  sleepSchedule: string;
  cleanliness: number;
  smoking: boolean;
  pets: boolean;
  social: number;
  noise: number;
  wfh: boolean;
  bio: string;
  phoneVerified?: boolean;
  lastSeen?: string | null;
}

export interface Apartment {
  id: string;
  title: string;
  price: number;
  location: string;
  coordinates: [number, number];
  images: string[];
  rooms: number;
  bathrooms: number;
  size: number;
  roommates: UserProfile[];
  matchPercent: number;
  amenities: string[];
  available: string;
  isBoosted?: boolean;
  listingType?: "room" | "entire_place";
}

export interface ChatPreview {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup?: boolean;
}


export function getMatchColor(percent: number): string {
  if (percent >= 80) return "match-badge-high";
  if (percent >= 60) return "match-badge-medium";
  return "match-badge-low";
}

export function getMatchTextColor(percent: number): string {
  if (percent >= 80) return "text-match-high";
  if (percent >= 60) return "text-match-medium";
  return "text-match-low";
}

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

const avatars = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
];

export const mockUsers: UserProfile[] = [
  { id: "1", name: "Noa", age: 25, city: "Tel Aviv", occupation: "UX Designer", avatar: avatars[0], budget: 3500, roomType: "Private", sleepSchedule: "Night owl", cleanliness: 4, smoking: false, pets: false, social: 4, noise: 2, wfh: true, bio: "Creative soul, love cooking and design ✨" },
  { id: "2", name: "Yoav", age: 27, city: "Tel Aviv", occupation: "Software Engineer", avatar: avatars[1], budget: 4000, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 5, smoking: false, pets: false, social: 3, noise: 1, wfh: true, bio: "Clean freak, gym enthusiast 💪" },
  { id: "3", name: "Maya", age: 24, city: "Jerusalem", occupation: "Student", avatar: avatars[2], budget: 2800, roomType: "Shared OK", sleepSchedule: "Night owl", cleanliness: 3, smoking: false, pets: true, social: 5, noise: 3, wfh: false, bio: "Life of the party 🎉 Cat mom 🐱" },
  { id: "4", name: "Dan", age: 29, city: "Tel Aviv", occupation: "Product Manager", avatar: avatars[3], budget: 4500, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 4, smoking: false, pets: false, social: 3, noise: 2, wfh: true, bio: "Foodie, hiker, early morning runner 🏃" },
  { id: "5", name: "Shira", age: 26, city: "Haifa", occupation: "Architect", avatar: avatars[4], budget: 3200, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 5, smoking: false, pets: false, social: 2, noise: 1, wfh: false, bio: "Minimalist living, big dreams 🌿" },
  { id: "6", name: "Amit", age: 28, city: "Tel Aviv", occupation: "Musician", avatar: avatars[5], budget: 3000, roomType: "Shared OK", sleepSchedule: "Night owl", cleanliness: 3, smoking: false, pets: true, social: 5, noise: 4, wfh: false, bio: "Music is life 🎸 Dog dad" },
];

const apartmentImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop",
];

export const mockApartments: Apartment[] = [
  { id: "a1", title: "Sunny Loft in Florentin", price: 3200, location: "Florentin, Tel Aviv", images: [apartmentImages[0], apartmentImages[1]], rooms: 3, bathrooms: 1, size: 85, roommates: [mockUsers[0], mockUsers[1]], matchPercent: 92, amenities: ["Balcony", "AC", "Laundry", "WiFi"], available: "Immediately", isBoosted: true },
  { id: "a2", title: "Cozy Room near Carmel Market", price: 2800, location: "Kerem, Tel Aviv", images: [apartmentImages[2], apartmentImages[3]], rooms: 4, bathrooms: 2, size: 110, roommates: [mockUsers[2]], matchPercent: 78, amenities: ["Rooftop", "AC", "Parking"], available: "March 1" },
  { id: "a3", title: "Modern Flat in Rothschild", price: 4500, location: "Rothschild, Tel Aviv", images: [apartmentImages[4], apartmentImages[0]], rooms: 2, bathrooms: 1, size: 65, roommates: [mockUsers[3]], matchPercent: 85, amenities: ["Gym", "AC", "Elevator", "Security"], available: "April 1" },
  { id: "a4", title: "Artsy Apartment in Neve Tzedek", price: 3800, location: "Neve Tzedek, Tel Aviv", images: [apartmentImages[1], apartmentImages[4]], rooms: 3, bathrooms: 1, size: 90, roommates: [mockUsers[4], mockUsers[5]], matchPercent: 64, amenities: ["Garden", "AC", "Laundry"], available: "Immediately" },
];

export const mockChats: ChatPreview[] = [
  { id: "c1", name: "Noa", avatar: avatars[0], lastMessage: "Sounds great! When can you come see the room?", time: "2m", unread: 2 },
  { id: "c2", name: "Florentin Apt 🏠", avatar: avatars[1], lastMessage: "Dan: I'll bring the table tomorrow", time: "1h", unread: 0, isGroup: true },
  { id: "c3", name: "Maya", avatar: avatars[2], lastMessage: "Haha yes! Let's definitely meet up", time: "3h", unread: 1 },
  { id: "c4", name: "Shira", avatar: avatars[4], lastMessage: "The apartment looks amazing", time: "1d", unread: 0 },
];

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

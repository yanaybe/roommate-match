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
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=face",
];

export const mockUsers: UserProfile[] = [
  { id: "1", name: "Noa", age: 25, city: "Tel Aviv", occupation: "UX Designer", avatar: avatars[0], budget: 3500, roomType: "Private", sleepSchedule: "Night owl", cleanliness: 4, smoking: false, pets: false, social: 4, noise: 2, wfh: true, bio: "Creative soul, love cooking and design ✨" },
  { id: "2", name: "Yoav", age: 27, city: "Tel Aviv", occupation: "Software Engineer", avatar: avatars[1], budget: 4000, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 5, smoking: false, pets: false, social: 3, noise: 1, wfh: true, bio: "Clean freak, gym enthusiast 💪" },
  { id: "3", name: "Maya", age: 24, city: "Jerusalem", occupation: "Student", avatar: avatars[2], budget: 2800, roomType: "Shared OK", sleepSchedule: "Night owl", cleanliness: 3, smoking: false, pets: true, social: 5, noise: 3, wfh: false, bio: "Life of the party 🎉 Cat mom 🐱" },
  { id: "4", name: "Dan", age: 29, city: "Tel Aviv", occupation: "Product Manager", avatar: avatars[3], budget: 4500, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 4, smoking: false, pets: false, social: 3, noise: 2, wfh: true, bio: "Foodie, hiker, early morning runner 🏃" },
  { id: "5", name: "Shira", age: 26, city: "Haifa", occupation: "Architect", avatar: avatars[4], budget: 3200, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 5, smoking: false, pets: false, social: 2, noise: 1, wfh: false, bio: "Minimalist living, big dreams 🌿" },
  { id: "6", name: "Amit", age: 28, city: "Tel Aviv", occupation: "Musician", avatar: avatars[5], budget: 3000, roomType: "Shared OK", sleepSchedule: "Night owl", cleanliness: 3, smoking: false, pets: true, social: 5, noise: 4, wfh: false, bio: "Music is life 🎸 Dog dad" },
  { id: "7", name: "Lior", age: 23, city: "Beer Sheva", occupation: "Medical Student", avatar: avatars[6], budget: 2200, roomType: "Shared OK", sleepSchedule: "Night owl", cleanliness: 4, smoking: false, pets: false, social: 3, noise: 2, wfh: false, bio: "Future doctor, coffee addict ☕ Always studying" },
  { id: "8", name: "Oren", age: 30, city: "Herzliya", occupation: "Startup Founder", avatar: avatars[7], budget: 5500, roomType: "Private", sleepSchedule: "Night owl", cleanliness: 4, smoking: false, pets: false, social: 4, noise: 3, wfh: true, bio: "Building the next big thing 🚀 Beach runs at sunset" },
  { id: "9", name: "Tamar", age: 22, city: "Ramat Gan", occupation: "Graphic Designer", avatar: avatars[8], budget: 2600, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 3, smoking: false, pets: true, social: 4, noise: 2, wfh: true, bio: "Art, plants, and my parrot 🦜🎨" },
  { id: "10", name: "Eyal", age: 31, city: "Netanya", occupation: "Chef", avatar: avatars[9], budget: 3000, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 5, smoking: false, pets: false, social: 3, noise: 1, wfh: false, bio: "Will cook for roommates 🍳 Early riser" },
  { id: "11", name: "Gal", age: 26, city: "Tel Aviv", occupation: "Photographer", avatar: avatars[10], budget: 3400, roomType: "Shared OK", sleepSchedule: "Night owl", cleanliness: 3, smoking: false, pets: false, social: 5, noise: 3, wfh: true, bio: "Capturing moments 📸 Night explorer" },
  { id: "12", name: "Rotem", age: 27, city: "Haifa", occupation: "Marine Biologist", avatar: avatars[11], budget: 2900, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 4, smoking: false, pets: true, social: 2, noise: 1, wfh: false, bio: "Ocean lover 🌊 Quiet evenings with my cat" },
  { id: "13", name: "Yael", age: 24, city: "Jerusalem", occupation: "Law Student", avatar: avatars[12], budget: 3100, roomType: "Private", sleepSchedule: "Night owl", cleanliness: 5, smoking: false, pets: false, social: 3, noise: 2, wfh: false, bio: "Justice & jasmine tea ⚖️🍵" },
  { id: "14", name: "Tomer", age: 29, city: "Rishon LeZion", occupation: "Data Scientist", avatar: avatars[13], budget: 3800, roomType: "Private", sleepSchedule: "Early bird", cleanliness: 4, smoking: false, pets: false, social: 2, noise: 1, wfh: true, bio: "Numbers by day, board games by night 🎲" },
  { id: "15", name: "Neta", age: 25, city: "Givatayim", occupation: "Yoga Instructor", avatar: avatars[14], budget: 2500, roomType: "Shared OK", sleepSchedule: "Early bird", cleanliness: 5, smoking: false, pets: false, social: 4, noise: 1, wfh: false, bio: "Namaste 🧘‍♀️ Vegan cooking enthusiast" },
  { id: "16", name: "Ido", age: 28, city: "Petah Tikva", occupation: "Electrician", avatar: avatars[15], budget: 2700, roomType: "Shared OK", sleepSchedule: "Early bird", cleanliness: 4, smoking: false, pets: true, social: 3, noise: 2, wfh: false, bio: "Handy around the house 🔧 Dog walks every morning" },
];

const apartmentImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop",
];

export const mockApartments: Apartment[] = [
  { id: "a1", title: "Sunny Loft in Florentin", price: 3200, location: "Florentin, Tel Aviv", coordinates: [32.0560, 34.7710], images: [apartmentImages[0], apartmentImages[1]], rooms: 3, bathrooms: 1, size: 85, roommates: [mockUsers[0], mockUsers[1]], matchPercent: 92, amenities: ["Balcony", "AC", "Laundry", "WiFi"], available: "Immediately", isBoosted: true },
  { id: "a2", title: "Cozy Room near Carmel Market", price: 2800, location: "Kerem, Tel Aviv", coordinates: [32.0650, 34.7680], images: [apartmentImages[2], apartmentImages[3]], rooms: 4, bathrooms: 2, size: 110, roommates: [mockUsers[2]], matchPercent: 78, amenities: ["Rooftop", "AC", "Parking"], available: "March 1" },
  { id: "a3", title: "Modern Flat in Rothschild", price: 4500, location: "Rothschild, Tel Aviv", coordinates: [32.0635, 34.7745], images: [apartmentImages[4], apartmentImages[0]], rooms: 2, bathrooms: 1, size: 65, roommates: [mockUsers[3]], matchPercent: 85, amenities: ["Gym", "AC", "Elevator", "Security"], available: "April 1" },
  { id: "a4", title: "Artsy Apartment in Neve Tzedek", price: 3800, location: "Neve Tzedek, Tel Aviv", coordinates: [32.0580, 34.7660], images: [apartmentImages[1], apartmentImages[4]], rooms: 3, bathrooms: 1, size: 90, roommates: [mockUsers[4], mockUsers[5]], matchPercent: 64, amenities: ["Garden", "AC", "Laundry"], available: "Immediately" },
  { id: "a5", title: "Student Flat in Nachlaot", price: 2200, location: "Nachlaot, Jerusalem", coordinates: [31.7800, 35.2150], images: [apartmentImages[5], apartmentImages[6]], rooms: 3, bathrooms: 1, size: 70, roommates: [mockUsers[12]], matchPercent: 73, amenities: ["WiFi", "Laundry"], available: "May 1" },
  { id: "a6", title: "Sea View in Bat Galim", price: 2600, location: "Bat Galim, Haifa", coordinates: [32.8230, 34.9700], images: [apartmentImages[7], apartmentImages[8]], rooms: 3, bathrooms: 1, size: 80, roommates: [mockUsers[11]], matchPercent: 81, amenities: ["Balcony", "AC", "Sea View"], available: "Immediately" },
  { id: "a7", title: "Penthouse in Herzliya Pituach", price: 6000, location: "Herzliya Pituach, Herzliya", coordinates: [32.1620, 34.7870], images: [apartmentImages[9], apartmentImages[5]], rooms: 4, bathrooms: 2, size: 140, roommates: [mockUsers[7]], matchPercent: 88, amenities: ["Pool", "Gym", "Parking", "Security", "AC"], available: "June 1", isBoosted: true },
  { id: "a8", title: "Cozy Studio in German Colony", price: 3500, location: "German Colony, Jerusalem", coordinates: [31.7600, 35.2210], images: [apartmentImages[6], apartmentImages[7]], rooms: 2, bathrooms: 1, size: 55, roommates: [], matchPercent: 70, amenities: ["Garden", "AC", "Laundry"], available: "April 15" },
  { id: "a9", title: "Bright Room in Ramat Gan", price: 2400, location: "City Center, Ramat Gan", coordinates: [32.0830, 34.8120], images: [apartmentImages[8], apartmentImages[9]], rooms: 3, bathrooms: 1, size: 75, roommates: [mockUsers[8]], matchPercent: 76, amenities: ["Balcony", "AC", "Elevator"], available: "Immediately" },
  { id: "a10", title: "Spacious Flat near the Beach", price: 3100, location: "City Center, Netanya", coordinates: [32.3290, 34.8560], images: [apartmentImages[0], apartmentImages[8]], rooms: 3, bathrooms: 1, size: 90, roommates: [mockUsers[9]], matchPercent: 67, amenities: ["Parking", "AC", "WiFi", "Laundry"], available: "March 15" },
  { id: "a11", title: "Modern Loft in Carmel Center", price: 3300, location: "Carmel Center, Haifa", coordinates: [32.7950, 34.9860], images: [apartmentImages[7], apartmentImages[3]], rooms: 2, bathrooms: 1, size: 60, roommates: [mockUsers[4]], matchPercent: 83, amenities: ["Balcony", "AC", "Elevator", "WiFi"], available: "May 1" },
  { id: "a12", title: "Garden Apartment in Givatayim", price: 2900, location: "Borochov, Givatayim", coordinates: [32.0710, 34.8100], images: [apartmentImages[5], apartmentImages[2]], rooms: 3, bathrooms: 1, size: 85, roommates: [mockUsers[14]], matchPercent: 79, amenities: ["Garden", "Parking", "Laundry", "AC"], available: "Immediately" },
  { id: "a13", title: "Renovated Flat in Beer Sheva", price: 1800, location: "Old City, Beer Sheva", coordinates: [31.2520, 34.7910], images: [apartmentImages[9], apartmentImages[1]], rooms: 4, bathrooms: 2, size: 100, roommates: [mockUsers[6]], matchPercent: 71, amenities: ["AC", "Parking", "Laundry", "WiFi"], available: "April 1" },
  { id: "a14", title: "Luxury Suite in Rishon LeZion", price: 4200, location: "West Rishon, Rishon LeZion", coordinates: [31.9640, 34.7750], images: [apartmentImages[6], apartmentImages[4]], rooms: 3, bathrooms: 2, size: 95, roommates: [mockUsers[13]], matchPercent: 86, amenities: ["Gym", "Pool", "AC", "Security", "Elevator"], available: "June 1" },
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

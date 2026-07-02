// Shared amenity → Lucide icon map. Used by PostApartment (form + review chips)
// and FilterModal so amenity iconography stays identical everywhere.
import {
  Sunrise, Car, MoveVertical, Snowflake, WashingMachine, Wifi,
  Dumbbell, Shield, Building2, Leaf, PawPrint, Sofa, type LucideIcon,
} from "lucide-react";

export const AMENITY_ICONS: Record<string, LucideIcon> = {
  Balcony: Sunrise,
  Parking: Car,
  Elevator: MoveVertical,
  AC: Snowflake,
  Laundry: WashingMachine,
  WiFi: Wifi,
  Gym: Dumbbell,
  Security: Shield,
  Rooftop: Building2,
  Garden: Leaf,
  "Pet Friendly": PawPrint,
  Furnished: Sofa,
};

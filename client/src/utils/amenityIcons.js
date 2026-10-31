import {
  Armchair, Baby, Bike, Building2, Camera, Car, Cctv, ChevronsUpDown, CircleParking, Coffee, Droplets, Dumbbell,
  Flame, Flower2, Footprints, Gamepad2, Heart, HeartPulse, House, Landmark, Leaf, Library, Lightbulb, Lock, Music,
  PartyPopper, PersonStanding, Phone, Shield, ShieldCheck, ShoppingBag, Sparkles, SquareParking, Store, Sun,
  TreePine, Trees, Trophy, Users, Utensils, Video, Waves, Wifi, Wind, Zap,
} from 'lucide-react';

// Amenity.icon in the CMS stores one of these lucide names; unknown names fall back to Sparkles.
// (A curated map keeps the bundle small instead of importing every lucide icon.)
export const AMENITY_ICONS = {
  Armchair, Baby, Bike, Building2, Camera, Car, Cctv, ChevronsUpDown, CircleParking, Coffee, Droplets, Dumbbell,
  Flame, Flower2, Footprints, Gamepad2, Heart, HeartPulse, Home: House, House, Landmark, Leaf, Library, Lightbulb, Lock,
  Music, PartyPopper, PersonStanding, Phone, Shield, ShieldCheck, ShoppingBag, Sparkles, SquareParking, Store, Sun,
  TreePine, Trees, Trophy, Users, Utensils, Video, Waves, Wifi, Wind, Zap,
};

export const AMENITY_ICON_NAMES = Object.keys(AMENITY_ICONS);

export const getAmenityIcon = (name) => AMENITY_ICONS[name] ?? Sparkles;

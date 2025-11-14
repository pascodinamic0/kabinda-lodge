import { Restaurant, MenuItem } from './restaurant';

// Restaurant Image Types
export interface RestaurantImage {
  id: string;
  restaurant_id: number;
  image_url: string;
  alt_text?: string;
  display_order: number;
  created_at: string;
}

// Shared Restaurant Types
export interface RestaurantReview {
  id: string;
  user_id: string;
  restaurant_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface RestaurantWithMenu extends Restaurant {
  menuCategories: MenuCategory[];
  images?: RestaurantImage[];
  averageRating?: number;
  reviewCount?: number;
}
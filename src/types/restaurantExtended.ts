import { Restaurant, MenuItem } from './restaurant';

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
  averageRating?: number;
  reviewCount?: number;
}
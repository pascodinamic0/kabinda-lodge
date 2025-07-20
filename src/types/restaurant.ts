// Restaurant Types
export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  type: string;
  cuisine: string;
  location: string;
  price_range: string;
  rating?: number;
  specialties?: string[];
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  is_available: boolean;
  image_url?: string;
  images?: MenuItemImage[];
  created_at: string;
}

export interface MenuItemImage {
  id: string;
  url: string;
  alt_text: string;
}

export interface RestaurantTable {
  id: number;
  restaurant_id: number;
  table_number: string;
  capacity: number;
  status: string; // Allow any string for compatibility
  location_description?: string;
  created_at: string;
  updated_at: string;
}

export interface DiningReservation {
  id: number;
  user_id: string;
  restaurant_id: number;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  delivery_type: 'table' | 'address';
  table_id?: number;
  delivery_address?: string;
  delivery_fee: number;
  total_amount: number;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  created_at: string;
  updated_at: string;
}
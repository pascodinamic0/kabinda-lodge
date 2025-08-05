import { Json } from '../integrations/supabase/types';

// App Settings Types
export interface AppSettingValue {
  enabled?: boolean;
  promotion_id?: string;
  [key: string]: unknown;
}

// Google Maps Types
export interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
}

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

// Error Handling Types
export interface ErrorDetails {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Notification Types
export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
}

// Realtime Data Types
export interface RealtimeConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
}

// Content Management Types
export interface ContentSection {
  id: string;
  section: string;
  language: string;
  content: Json;
  updated_at: string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  activePromotions: number;
  pendingRequests: number;
}

// Service Request Types
export interface ServiceRequest {
  id: string;
  request_type: string;
  description: string;
  priority: string;
  status: string;
  room_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Review Types
export interface Review {
  id: string;
  booking_id: number;
  rating: number;
  message?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

// Housekeeping Task Types
export interface HousekeepingTask {
  id: string;
  task_type: string;
  description?: string;
  priority: string;
  status: string;
  room_id?: number;
  assigned_to?: string;
  estimated_duration?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Incident Types
export interface Incident {
  id: string;
  incident_type: string;
  description: string;
  location: string;
  severity: string;
  status: string;
  reported_by: string;
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// Menu Item Types
export interface MenuItemData {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  is_available: boolean;
  image_url?: string;
}

// Order Types
export interface OrderData {
  id: number;
  status: string;
  total_price: number;
  created_at: string;
  items?: OrderItemData[];
}

export interface OrderItemData {
  id: number;
  menu_item_id: number;
  quantity: number;
  notes?: string;
  menu_item?: MenuItemData;
}

// Promotion Types
export interface PromotionData {
  id: string;
  title: string;
  description?: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

// User Types
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  created_at: string;
}

// Booking Types
export interface BookingData {
  id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  user_id: string;
  room_id: number;
  notes?: string;
  created_at: string;
  room?: {
    name: string;
    type: string;
    price: number;
  };
  user?: {
    name: string;
    email: string;
  };
}

// Room Types
export interface RoomData {
  id: number;
  name: string;
  type: string;
  price: number;
  status: string;
  description?: string;
  created_at: string;
}

// Restaurant Types
export interface RestaurantData {
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

// Table Types
export interface TableData {
  id: number;
  table_number: string;
  capacity: number;
  status: string;
  location_description?: string;
  restaurant_id: number;
  created_at: string;
  updated_at: string;
} 
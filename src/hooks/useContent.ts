import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
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

interface ContentData {
  [key: string]: unknown;
}

export const useContent = <T extends Record<string, any> = Record<string, any>>(section: string) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState<T>({} as T);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let { data, error: fetchError } = await supabase
          .from('website_content')
          .select('content')
          .eq('section', section)
          .eq('language', currentLanguage)
          .maybeSingle();

        if ((!data || !data.content) && currentLanguage !== 'en') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('website_content')
            .select('content')
            .eq('section', section)
            .eq('language', 'en')
            .maybeSingle();
          data = fallbackData;
          fetchError = fetchError || fallbackError;
        }

        if (fetchError) throw fetchError;

        setContent((data?.content ? (data.content as T) : ({} as T)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
        setContent({} as T);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [section, currentLanguage]);

  return { content, isLoading, error };
};
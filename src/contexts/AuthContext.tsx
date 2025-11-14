
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '../integrations/supabase/types';

// Add proper type for app settings
interface AppSettingValue {
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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Mobile session management utilities
  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const checkStorageAvailability = () => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  };

  const proactiveSessionRefresh = async (session: Session) => {
    if (!session) return;
    
    const expiresAt = session.expires_at;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - currentTime;
    
    // Refresh 5 minutes before expiry on mobile, 2 minutes on desktop
    const refreshThreshold = isMobile() ? 300 : 120;
    
    if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
      console.log('Proactively refreshing session...');
      await refreshSession();
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return userData?.role || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    let isInitialized = false;
    let sessionRefreshInterval: NodeJS.Timeout | null = null;
    
    // Mobile-specific event listeners
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session) {
        console.log('App became visible, validating session...');
        // Validate session when app becomes visible again
        setTimeout(() => proactiveSessionRefresh(session), 100);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (session) {
        console.log('Network restored, validating session...');
        setTimeout(() => proactiveSessionRefresh(session), 100);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Network lost, session management paused...');
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isMobileDevice = isMobile();
        console.log(`Auth state changed (${isMobileDevice ? 'mobile' : 'desktop'}):`, event, session?.user?.email);
        
        // Prevent infinite loops during initialization
        if (event === 'INITIAL_SESSION' && isInitialized) {
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role using setTimeout to avoid blocking auth state change
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
          }, 0);

          // Set up proactive session refresh for mobile
          if (isMobileDevice && sessionRefreshInterval) {
            clearInterval(sessionRefreshInterval);
          }
          
          if (isMobileDevice) {
            sessionRefreshInterval = setInterval(() => {
              if (isOnline) {
                proactiveSessionRefresh(session);
              }
            }, 60000); // Check every minute on mobile
          }
        } else {
          setUserRole(null);
          if (sessionRefreshInterval) {
            clearInterval(sessionRefreshInterval);
            sessionRefreshInterval = null;
          }
        }
        
        if (!isInitialized) {
          setLoading(false);
          isInitialized = true;
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        // Check storage availability for mobile browsers
        if (isMobile() && !checkStorageAvailability()) {
          console.warn('Local storage not available on mobile browser');
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Add mobile-specific event listeners
    if (isMobile()) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    initializeAuth();

    return () => {
      subscription.unsubscribe();
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval);
      }
      if (isMobile()) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: string = 'Guest') => {
    const redirectUrl = `${window.location.origin}/kabinda-lodge`;
    
    try {
      // Check rate limit before attempting signup
      const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_identifier: email.trim(),
        p_attempt_type: 'signup',
        p_max_attempts: 3,
        p_window_minutes: 30
      });

      if (rateLimitError) {
        console.error('Rate limit check failed:', rateLimitError);
        // Continue with signup attempt even if rate limit check fails
      } else if (!rateLimitOk) {
        return { error: new Error('Too many signup attempts. Please try again in 30 minutes.') };
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name.trim(),
            role
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
      }
      
      return { error };
    } catch (fetchError) {
      console.error('Sign up fetch error:', fetchError);
      return { error: fetchError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check rate limit before attempting login
      const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_identifier: email.trim(),
        p_attempt_type: 'login',
        p_max_attempts: 5,
        p_window_minutes: 15
      });

      if (rateLimitError) {
        console.error('Rate limit check failed:', rateLimitError);
        // Continue with login attempt even if rate limit check fails
      } else if (!rateLimitOk) {
        return { error: new Error('Too many login attempts. Please try again in 15 minutes.') };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
      }
      
      return { error };
    } catch (fetchError) {
      console.error('Sign in fetch error:', fetchError);
      return { error: fetchError };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/kabinda-lodge`
        }
      });
      
      if (error) {
        console.error('Google sign in error:', error);
      }
      
      return { error };
    } catch (fetchError) {
      console.error('Google sign in fetch error:', fetchError);
      return { error: fetchError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setUserRole(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshSession = async () => {
    try {
      // Add retry logic for mobile networks
      let retryCount = 0;
      const maxRetries = isMobile() ? 3 : 1;
      
      while (retryCount <= maxRetries) {
        try {
          const { data: { session }, error } = await supabase.auth.refreshSession();
          
          if (error) {
            throw error;
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
          }
          
          console.log('Session refreshed successfully');
          return;
        } catch (error) {
          retryCount++;
          if (retryCount > maxRetries) {
            throw error;
          }
          
          // Exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          console.log(`Session refresh failed, retrying in ${delay}ms... (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.error('Error refreshing session after retries:', error);
      
      // On mobile, if session refresh fails completely, try to re-validate
      if (isMobile()) {
        console.log('Attempting to re-validate session on mobile...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.log('No valid session found, user needs to re-authenticate');
            setUser(null);
            setSession(null);
            setUserRole(null);
          }
        } catch (revalidateError) {
          console.error('Session re-validation failed:', revalidateError);
        }
      }
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

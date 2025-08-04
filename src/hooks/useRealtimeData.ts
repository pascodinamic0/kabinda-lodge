import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeDataProps {
  table: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onRefresh?: () => void;
}

export const useRealtimeData = ({ 
  table, 
  onInsert, 
  onUpdate, 
  onDelete, 
  onRefresh 
}: UseRealtimeDataProps) => {
  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table
        },
        (payload) => {
          onInsert?.(payload);
          onRefresh?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table
        },
        (payload) => {
          onUpdate?.(payload);
          onRefresh?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: table
        },
        (payload) => {
          onDelete?.(payload);
          onRefresh?.();
        }
      )
      .subscribe();

    return channel;
  }, [table, onInsert, onUpdate, onDelete, onRefresh]);

  useEffect(() => {
    const channel = setupRealtimeSubscription();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [setupRealtimeSubscription]);
};

// Specialized hook for guest data
export const useRealtimeGuests = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'users',
    onRefresh
  });
};

// Specialized hook for housekeeping tasks
export const useRealtimeHousekeeping = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'housekeeping_tasks',
    onRefresh
  });
};

// Specialized hook for room status
export const useRealtimeRooms = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'rooms',
    onRefresh
  });
};

// Specialized hook for key cards
export const useRealtimeKeyCards = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'key_cards',
    onRefresh
  });
};

// Specialized hook for payments
export const useRealtimePayments = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'payments',
    onRefresh
  });
};

// Specialized hook for bookings
export const useRealtimeBookings = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'bookings',
    onRefresh
  });
};

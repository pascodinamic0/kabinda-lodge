import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeConfig } from '../types/common';

interface UseRealtimeDataProps {
  table: string;
  onInsert?: (payload: unknown) => void;
  onUpdate?: (payload: unknown) => void;
  onDelete?: (payload: unknown) => void;
  onRefresh?: () => void;
}

export const useRealtimeData = <T>(
  config: RealtimeConfig,
  callback: (data: T) => void
) => {
  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel(`${config.table}-changes`)
      .on(
        'postgres_changes',
        {
          event: config.event,
          schema: 'public',
          table: config.table,
          filter: config.filter
        },
        (payload) => {
          callback(payload.new as T);
        }
      )
      .subscribe();

    return channel;
  }, [config.table, config.event, config.filter, callback]);

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
    event: 'INSERT',
    filter: 'id=eq.id',
    onRefresh
  }, (payload) => {
    onRefresh?.();
  });
};

// Specialized hook for housekeeping tasks
export const useRealtimeHousekeeping = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'housekeeping_tasks',
    event: 'INSERT',
    filter: 'id=eq.id',
    onRefresh
  }, (payload) => {
    onRefresh?.();
  });
};

// Specialized hook for room status
export const useRealtimeRooms = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'rooms',
    event: 'INSERT',
    filter: 'id=eq.id',
    onRefresh
  }, (payload) => {
    onRefresh?.();
  });
};

// Specialized hook for key cards
export const useRealtimeKeyCards = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'key_cards',
    event: 'INSERT',
    filter: 'id=eq.id',
    onRefresh
  }, (payload) => {
    onRefresh?.();
  });
};

// Specialized hook for payments
export const useRealtimePayments = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'payments',
    event: 'INSERT',
    filter: 'id=eq.id',
    onRefresh
  }, (payload) => {
    onRefresh?.();
  });
};

// Specialized hook for bookings
export const useRealtimeBookings = (onRefresh?: () => void) => {
  return useRealtimeData({
    table: 'bookings',
    event: 'INSERT',
    filter: 'id=eq.id',
    onRefresh
  }, (payload) => {
    onRefresh?.();
  });
};

import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

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
  useEffect(() => {
    if (!onRefresh) return;

    const channel = supabase
      .channel('guests-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'users' 
      }, () => {
        onRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);
};

// Specialized hook for housekeeping tasks
export const useRealtimeHousekeeping = (onRefresh?: () => void) => {
  useEffect(() => {
    if (!onRefresh) return;

    const channel = supabase
      .channel('housekeeping-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'housekeeping_tasks' 
      }, () => {
        onRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);
};

// Specialized hook for room status
export const useRealtimeRooms = (onRefresh?: () => void) => {
  useEffect(() => {
    if (!onRefresh) return;

    const channel = supabase
      .channel('rooms-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, () => {
        onRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);
};

// Specialized hook for key cards
export const useRealtimeKeyCards = (onRefresh?: () => void) => {
  useEffect(() => {
    if (!onRefresh) return;

    const channel = supabase
      .channel('keycards-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'key_cards' 
      }, () => {
        onRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);
};

// Specialized hook for payments
export const useRealtimePayments = (onRefresh?: () => void) => {
  useEffect(() => {
    if (!onRefresh) return;

    const channel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'payments' 
      }, () => {
        onRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);
};

// Specialized hook for bookings
export const useRealtimeBookings = (onRefresh?: () => void) => {
  useEffect(() => {
    if (!onRefresh) return;

    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, () => {
        onRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);
};

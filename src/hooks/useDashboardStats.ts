import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalRooms: number;
  pendingPayments: number;
  occupiedRooms: number;
  activeBookings: number;
  staffMembers: number;
  todayRevenue: number;
  loading: boolean;
  error: string | null;
}

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    pendingPayments: 0,
    occupiedRooms: 0,
    activeBookings: 0,
    staffMembers: 0,
    todayRevenue: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        const today = new Date().toISOString().split('T')[0];

        // Fetch total rooms and room status counts
        const { count: roomCount, error: roomError } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true });

        if (roomError) throw roomError;

        // Fetch pending payments (non-cash only, as cash payments are auto-verified)
        const { count: pendingCount, error: pendingError } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_verification')
          .neq('method', 'cash');

        if (pendingError) throw pendingError;

        // Fetch occupied rooms
        const { count: occupiedCount, error: occupiedError } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'occupied');

        if (occupiedError) throw occupiedError;

        // Fetch active bookings (booked status and current/future dates)
        const { count: bookingCount, error: bookingError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'booked')
          .gte('end_date', today);

        if (bookingError) throw bookingError;

        // Fetch staff members (non-guest users)
        const { count: staffCount, error: staffError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .neq('role', 'Guest');

        if (staffError) throw staffError;

        // Fetch today's revenue from payments
        const { data: payments, error: paymentError } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T00:00:00.000Z`);

        if (paymentError) throw paymentError;

        const todayRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

        setStats({
          totalRooms: roomCount || 0,
          pendingPayments: pendingCount || 0,
          occupiedRooms: occupiedCount || 0,
          activeBookings: bookingCount || 0,
          staffMembers: staffCount || 0,
          todayRevenue,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch stats',
        }));
      }
    };

    fetchStats();
  }, []);

  return stats;
}

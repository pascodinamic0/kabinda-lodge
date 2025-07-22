
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
  console.log('📊 useDashboardStats: Hook initialized');
  
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
    console.log('📊 useDashboardStats: useEffect triggered');
    
    const fetchStats = async () => {
      try {
        console.log('📊 useDashboardStats: Starting to fetch stats');
        setStats(prev => ({ ...prev, loading: true, error: null }));

        const today = new Date().toISOString().split('T')[0];
        console.log('📊 useDashboardStats: Today date:', today);

        // Fetch total rooms and room status counts
        console.log('📊 useDashboardStats: Fetching room count...');
        const { count: roomCount, error: roomError } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true });

        if (roomError) {
          console.error('📊 useDashboardStats: Room count error:', roomError);
          throw roomError;
        }
        console.log('📊 useDashboardStats: Room count result:', roomCount);

        // Fetch pending payments (both statuses for compatibility)
        console.log('📊 useDashboardStats: Fetching pending payments...');
        const { count: pendingCount, error: pendingError } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending_verification', 'pending'])
          .neq('method', 'cash');

        if (pendingError) {
          console.error('📊 useDashboardStats: Pending payments error:', pendingError);
          throw pendingError;
        }
        console.log('📊 useDashboardStats: Pending payments result:', pendingCount);

        // Fetch occupied rooms
        console.log('📊 useDashboardStats: Fetching occupied rooms...');
        const { count: occupiedCount, error: occupiedError } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'occupied');

        if (occupiedError) {
          console.error('📊 useDashboardStats: Occupied rooms error:', occupiedError);
          throw occupiedError;
        }
        console.log('📊 useDashboardStats: Occupied rooms result:', occupiedCount);

        // Fetch active bookings (booked status and current/future dates)
        console.log('📊 useDashboardStats: Fetching active bookings...');
        const { count: bookingCount, error: bookingError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'booked')
          .gte('end_date', today);

        if (bookingError) {
          console.error('📊 useDashboardStats: Active bookings error:', bookingError);
          throw bookingError;
        }
        console.log('📊 useDashboardStats: Active bookings result:', bookingCount);

        // Fetch staff members (non-guest users)
        console.log('📊 useDashboardStats: Fetching staff count...');
        const { count: staffCount, error: staffError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .neq('role', 'Guest');

        if (staffError) {
          console.error('📊 useDashboardStats: Staff count error:', staffError);
          throw staffError;
        }
        console.log('📊 useDashboardStats: Staff count result:', staffCount);

        // Fetch today's revenue from payments
        console.log('📊 useDashboardStats: Fetching today\'s revenue...');
        const { data: payments, error: paymentError } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T00:00:00.000Z`);

        if (paymentError) {
          console.error('📊 useDashboardStats: Revenue error:', paymentError);
          throw paymentError;
        }

        const todayRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
        console.log('📊 useDashboardStats: Today\'s revenue result:', todayRevenue);

        const finalStats = {
          totalRooms: roomCount || 0,
          pendingPayments: pendingCount || 0,
          occupiedRooms: occupiedCount || 0,
          activeBookings: bookingCount || 0,
          staffMembers: staffCount || 0,
          todayRevenue,
          loading: false,
          error: null,
        };

        console.log('📊 useDashboardStats: Final stats computed:', finalStats);
        setStats(finalStats);
      } catch (error) {
        console.error('📊 useDashboardStats: Error in fetchStats:', error);
        // Error fetching dashboard stats - using fallback values
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch stats',
        }));
      }
    };

    fetchStats();
  }, []);

  console.log('📊 useDashboardStats: Returning stats:', stats);
  return stats;
}

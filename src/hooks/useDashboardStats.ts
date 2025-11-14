import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { filterActiveBookings } from '@/utils/bookingUtils';

interface DashboardStats {
  totalRooms: number;
  pendingPayments: number;
  occupiedRooms: number;
  availableRooms: number;
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
    availableRooms: 0,
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

        // First, update room statuses to ensure they reflect current booking expiration (9:30 AM)
        await supabase.rpc('check_expired_bookings');

        const today = new Date().toISOString().split('T')[0];

        // Execute all queries in parallel with better error handling
        const [
          roomsResult,
          pendingPaymentsResult,
          occupiedRoomsResult,
          availableRoomsResult,
          activeBookingsResult,
          staffCountResult,
          todayRevenueResult
        ] = await Promise.allSettled([
          // Fetch total rooms
          supabase.from('rooms').select('*', { count: 'exact', head: true }),
          
          // Fetch pending payments (both statuses for compatibility)
          supabase.from('payments')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending_verification', 'pending'])
            .neq('method', 'cash'),
          
          // Fetch occupied rooms count based on room status (updated by check_expired_bookings)
          supabase.from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'occupied')
            .eq('manual_override', false),
          
          // Fetch available rooms (excluding manually overridden rooms)
          supabase.from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'available')
            .eq('manual_override', false),
          
          // Fetch bookings that might be active (we'll filter client-side for 9:30 AM expiration)
          supabase.from('bookings')
            .select('start_date, end_date, status')
            .in('status', ['booked', 'confirmed', 'pending_verification']),
          
          // Fetch staff members (non-guest users) via RPC
          supabase.rpc('get_staff_member_count'),
          
          // Fetch today's revenue via RPC
          supabase.rpc('get_today_revenue')
        ]);

        // Extract results with fallback handling
        const totalRooms = roomsResult.status === 'fulfilled' && !roomsResult.value.error ? 
          (roomsResult.value.count || 0) : 0;
          
        const pendingPayments = pendingPaymentsResult.status === 'fulfilled' && !pendingPaymentsResult.value.error ? 
          (pendingPaymentsResult.value.count || 0) : 0;
          
        // Occupied rooms count from room status (updated by check_expired_bookings with 9:30 AM logic)
        const occupiedRooms = occupiedRoomsResult.status === 'fulfilled' && !occupiedRoomsResult.value.error ? 
          (occupiedRoomsResult.value.count || 0) : 0;
          
        const availableRooms = availableRoomsResult.status === 'fulfilled' && !availableRoomsResult.value.error ? 
          (availableRoomsResult.value.count || 0) : 0;
          
        // Filter active bookings considering 9:30 AM expiration
        let activeBookings = 0;
        if (activeBookingsResult.status === 'fulfilled' && !activeBookingsResult.value.error) {
          const allBookings = activeBookingsResult.value.data || [];
          const activeBookingsList = filterActiveBookings(allBookings);
          activeBookings = activeBookingsList.length;
        }

        const staffMembers = staffCountResult.status === 'fulfilled' && !staffCountResult.value.error ? 
          (staffCountResult.value.data || 0) : 0;

        const todayRevenue = todayRevenueResult.status === 'fulfilled' && !todayRevenueResult.value.error ? 
          (Number(todayRevenueResult.value.data) || 0) : 0;

        // Log any errors for debugging but don't block the UI
        [roomsResult, pendingPaymentsResult, occupiedRoomsResult, availableRoomsResult, activeBookingsResult, staffCountResult, todayRevenueResult]
          .forEach((result, index) => {
            const queryNames = ['rooms', 'pending payments', 'occupied rooms', 'available rooms', 'active bookings', 'staff count', 'today revenue'];
            if (result.status === 'rejected') {
              console.error(`Error fetching ${queryNames[index]}:`, result.reason);
            } else if (result.value.error) {
              console.error(`Error fetching ${queryNames[index]}:`, result.value.error);
            }
          });

        setStats({
          totalRooms,
          pendingPayments,
          occupiedRooms,
          availableRooms,
          activeBookings,
          staffMembers,
          todayRevenue,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Critical error fetching dashboard stats:', error);
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
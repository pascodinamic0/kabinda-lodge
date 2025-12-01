import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalRooms: number;
  pendingPayments: number;
  occupiedRooms: number;
  availableRooms: number;
  activeBookings: number;
  staffMembers: number;
  todayRevenue: number;
  // Guest Service Requests stats
  pendingServiceRequests: number;
  urgentServiceRequests: number;
  totalServiceRequests: number;
  inProgressServiceRequests: number;
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
    pendingServiceRequests: 0,
    urgentServiceRequests: 0,
    totalServiceRequests: 0,
    inProgressServiceRequests: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Use same date format as SuperAdminDashboard (YYYY-MM-DD)
        const now = new Date();
        const todayDateString = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toLocaleDateString('en-CA');

        // Calculate today's start date in UTC (like SuperAdminDashboard)
        const todayStart = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0, 0, 0, 0
        ));

        // Execute all queries in parallel with better error handling
        const [
          roomsResult,
          pendingPaymentsResult,
          currentBookingsResult,
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
          
          // Fetch current bookings for occupied rooms calculation (direct query like SuperAdminDashboard)
          supabase.from('bookings')
            .select('room_id')
            .in('status', ['booked', 'confirmed', 'checked_in'])
            .lte('start_date', todayDateString)
            .gte('end_date', todayDateString),
          
          // Fetch active bookings (direct query - bookings that haven't ended yet)
          supabase.from('bookings')
            .select('*', { count: 'exact', head: true })
            .in('status', ['booked', 'confirmed', 'checked_in'])
            .gte('end_date', todayDateString),
          
          // Fetch staff members (non-guest users) via RPC
          supabase.rpc('get_staff_member_count'),
          
          // Fetch today's revenue directly (like SuperAdminDashboard) - use multiple successful statuses
          supabase.from('payments')
            .select('amount')
            .in('status', ['verified', 'completed', 'paid'])
            .gte('created_at', todayStart.toISOString())
        ]);

        // Extract results with fallback handling
        const totalRooms = roomsResult.status === 'fulfilled' && !roomsResult.value.error ? 
          (roomsResult.value.count || 0) : 0;
          
        const pendingPayments = pendingPaymentsResult.status === 'fulfilled' && !pendingPaymentsResult.value.error ? 
          (pendingPaymentsResult.value.count || 0) : 0;
          
        // Calculate occupied rooms from current bookings (like SuperAdminDashboard)
        let occupiedRooms = 0;
        if (currentBookingsResult.status === 'fulfilled' && !currentBookingsResult.value.error) {
          const currentBookings = currentBookingsResult.value.data || [];
          // Count unique room_ids
          const occupiedRoomIds = new Set(currentBookings.map((b: { room_id: number }) => b.room_id));
          occupiedRooms = occupiedRoomIds.size;
        }
          
        // Calculate available rooms
        const availableRooms = Math.max(0, totalRooms - occupiedRooms);
          
        // Get active bookings count directly from query
        const activeBookings = activeBookingsResult.status === 'fulfilled' && !activeBookingsResult.value.error ? 
          (activeBookingsResult.value.count || 0) : 0;

        // Get staff members count with fallback
        let staffMembers = 0;
        if (staffCountResult.status === 'fulfilled' && !staffCountResult.value.error) {
          staffMembers = staffCountResult.value.data || 0;
        } else if (staffCountResult.status === 'rejected' || (staffCountResult.value && staffCountResult.value.error)) {
          // Fallback: query users table directly if RPC fails
          try {
            const { count, error: fallbackError } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .neq('role', 'Guest');
            if (!fallbackError && count !== null) {
              staffMembers = count;
            }
          } catch (fallbackErr) {
            console.warn('Fallback staff count query also failed:', fallbackErr);
          }
        }

        // Calculate today's revenue from payment data (like SuperAdminDashboard)
        let todayRevenue = 0;
        if (todayRevenueResult.status === 'fulfilled' && !todayRevenueResult.value.error) {
          const revenueData = todayRevenueResult.value.data || [];
          todayRevenue = revenueData.reduce((sum: number, payment: { amount: number | string }) => {
            const amount = typeof payment.amount === 'number' ? payment.amount : Number(payment.amount ?? 0);
            return sum + (Number.isFinite(amount) ? amount : 0);
          }, 0);
        }

        // Log any errors for debugging but don't block the UI
        [roomsResult, pendingPaymentsResult, currentBookingsResult, activeBookingsResult, staffCountResult, todayRevenueResult]
          .forEach((result, index) => {
            const queryNames = ['rooms', 'pending payments', 'current bookings', 'active bookings', 'staff count', 'today revenue'];
            if (result.status === 'rejected') {
              console.error(`Error fetching ${queryNames[index]}:`, result.reason);
            } else if (result.value && result.value.error) {
              const error = result.value.error;
              // Log error with more details
              const errorMessage = error.message || error.code || JSON.stringify(error);
              const errorDetails = {
                message: errorMessage,
                code: error.code,
                details: error.details,
                hint: error.hint,
                fullError: error
              };
              console.error(`Error fetching ${queryNames[index]}:`, errorDetails);
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
          pendingServiceRequests: 0,
          urgentServiceRequests: 0,
          totalServiceRequests: 0,
          inProgressServiceRequests: 0,
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
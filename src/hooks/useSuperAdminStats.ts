import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  systemTables: number;
  loading: boolean;
  error: string | null;
}

type RevenueRange = 'all' | 'today' | '7d' | '30d';

interface UseSuperAdminStatsOptions {
  revenueRange?: RevenueRange;
}

export const useSuperAdminStats = (options?: UseSuperAdminStatsOptions): SuperAdminStats => {
  const { revenueRange = 'all' } = options || {};
  const [stats, setStats] = useState<SuperAdminStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    lastMonthRevenue: 0,
    systemTables: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Get total users count
        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // Get admin users count
        const { count: adminsCount, error: adminsError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .in('role', ['Admin', 'SuperAdmin']);

        if (adminsError) throw adminsError;

        // Get revenue based on range filter
        const successfulStatuses = ['verified', 'completed', 'paid'];

        // Calculate all revenue metrics
        const now = new Date();
        
        // Today's revenue
        const todayStart = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0, 0, 0, 0
        ));
        
        const { data: todayRevenueData } = await supabase
          .from('payments')
          .select('amount')
          .in('status', successfulStatuses)
          .gte('created_at', todayStart.toISOString());

        // This month's revenue
        const monthStart = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1,
          0, 0, 0, 0
        ));
        
        const { data: monthRevenueData } = await supabase
          .from('payments')
          .select('amount')
          .in('status', successfulStatuses)
          .gte('created_at', monthStart.toISOString());

        // Last month's revenue
        const lastMonthStart = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() - 1,
          1,
          0, 0, 0, 0
        ));
        
        const lastMonthEnd = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1,
          0, 0, 0, 0
        ));
        
        const { data: lastMonthRevenueData } = await supabase
          .from('payments')
          .select('amount')
          .in('status', successfulStatuses)
          .gte('created_at', lastMonthStart.toISOString())
          .lt('created_at', lastMonthEnd.toISOString());

        // Selected range revenue
        let revenueQuery = supabase
          .from('payments')
          .select('amount')
          .in('status', successfulStatuses);

        // Apply date filter if 30d range is selected
        if (revenueRange !== 'all') {
          const now = new Date();
          let startDate: Date | null = null;

          switch (revenueRange) {
            case 'today': {
              startDate = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                0, 0, 0, 0
              ));
              break;
            }
            case '7d': {
              startDate = new Date(now);
              startDate.setUTCDate(startDate.getUTCDate() - 6);
              startDate.setUTCHours(0, 0, 0, 0);
              break;
            }
            case '30d': {
              startDate = new Date(now);
              startDate.setUTCDate(startDate.getUTCDate() - 30);
              break;
            }
            default:
              startDate = null;
          }

          if (startDate) {
            revenueQuery = revenueQuery.gte('created_at', startDate.toISOString());
          }
        }

        const { data: revenueData, error: revenueError } = await revenueQuery;

        if (revenueError) throw revenueError;

        const calculateRevenue = (data: any[] | null) => {
          return data?.reduce((sum, payment) => {
            const amount = typeof payment.amount === 'number' ? payment.amount : Number(payment.amount ?? 0);
            return sum + (Number.isFinite(amount) ? amount : 0);
          }, 0) || 0;
        };

        const totalRevenue = calculateRevenue(revenueData);
        const todayRevenue = calculateRevenue(todayRevenueData);
        const monthRevenue = calculateRevenue(monthRevenueData);
        const lastMonthRevenue = calculateRevenue(lastMonthRevenueData);

        // Get system tables count (approximate)
        const systemTables = 15; // Approximate count of main system tables

        setStats({
          totalUsers: usersCount || 0,
          totalAdmins: adminsCount || 0,
          totalRevenue,
          todayRevenue,
          monthRevenue,
          lastMonthRevenue,
          systemTables,
          loading: false,
          error: null
        });

      } catch (err) {
        console.error('Error fetching super admin stats:', err);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load stats'
        }));
      }
    };

    fetchStats();
  }, [revenueRange]);

  return stats;
};
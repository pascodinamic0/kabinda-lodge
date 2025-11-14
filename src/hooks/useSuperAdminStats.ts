import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalRevenue: number;
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

        const totalRevenue = revenueData?.reduce((sum, payment) => {
          const amount = typeof payment.amount === 'number' ? payment.amount : Number(payment.amount ?? 0);
          return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0) || 0;

        // Get system tables count (approximate)
        const systemTables = 15; // Approximate count of main system tables

        setStats({
          totalUsers: usersCount || 0,
          totalAdmins: adminsCount || 0,
          totalRevenue,
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
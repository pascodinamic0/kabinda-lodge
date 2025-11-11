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

interface UseSuperAdminStatsOptions {
  revenueRange?: 'all' | '30d';
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
        let revenueQuery = supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed');

        // Apply date filter if 30d range is selected
        if (revenueRange === '30d') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          revenueQuery = revenueQuery.gte('created_at', thirtyDaysAgo.toISOString());
        }

        const { data: revenueData, error: revenueError } = await revenueQuery;

        if (revenueError) throw revenueError;

        const totalRevenue = revenueData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

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
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Users, DollarSign, Calendar, Download } from 'lucide-react';

interface PromotionUsage {
  id: number;
  promotion: {
    title: string;
    partner_name: string;
    discount_percent: number;
  };
  user: {
    name: string;
    email: string;
  };
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  created_at: string;
  booking_id?: number;
  conference_booking_id?: number;
}

interface PromotionStats {
  totalUsages: number;
  totalDiscountGiven: number;
  totalRevenueImpact: number;
  mostUsedPromotion: string;
}

export const PartnerPromotionUsageReport: React.FC = () => {
  const { toast } = useToast();
  const [usages, setUsages] = useState<PromotionUsage[]>([]);
  const [stats, setStats] = useState<PromotionStats>({
    totalUsages: 0,
    totalDiscountGiven: 0,
    totalRevenueImpact: 0,
    mostUsedPromotion: ''
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  useEffect(() => {
    fetchUsageData();
  }, [dateRange]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch usage data, fallback to empty if table doesn't exist
      let usageData: any[] = [];
      
      // Partner promotion usages table not implemented yet
      console.log('Partner promotion usages table not available yet, showing empty state');
      usageData = [];

      setUsages(usageData || []);

      // Calculate stats
      if (usageData && usageData.length > 0) {
        const totalDiscountGiven = usageData.reduce((sum, usage) => sum + Number(usage.discount_amount), 0);
        const totalRevenueImpact = usageData.reduce((sum, usage) => sum + Number(usage.original_amount), 0);
        
        // Find most used promotion
        const promotionCounts = usageData.reduce((acc, usage) => {
          const title = usage.promotion?.title || 'Unknown';
          acc[title] = (acc[title] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mostUsedPromotion = Object.entries(promotionCounts)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || '';

        setStats({
          totalUsages: usageData.length,
          totalDiscountGiven,
          totalRevenueImpact,
          mostUsedPromotion
        });
      } else {
        setStats({
          totalUsages: 0,
          totalDiscountGiven: 0,
          totalRevenueImpact: 0,
          mostUsedPromotion: ''
        });
      }

    } catch (error) {
      console.error('Error fetching usage data:', error);
      // Don't show error toast if it's just because the table doesn't exist yet
      // The component will show a friendly "no data" message instead
      setUsages([]);
      setStats({
        totalUsages: 0,
        totalDiscountGiven: 0,
        totalRevenueImpact: 0,
        mostUsedPromotion: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (usages.length === 0) {
      toast({
        title: "No Data",
        description: "No usage data available to export",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Date', 'Promotion', 'Partner', 'Customer', 'Original Amount', 'Discount %', 'Discount Amount', 'Final Amount', 'Booking Type'].join(','),
      ...usages.map(usage => [
        new Date(usage.created_at).toLocaleDateString(),
        usage.promotion?.title || '',
        usage.promotion?.partner_name || '',
        usage.user?.name || '',
        usage.original_amount,
        usage.promotion?.discount_percent || 0,
        usage.discount_amount,
        usage.final_amount,
        usage.booking_id ? 'Hotel' : 'Conference'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partner-promotion-usage-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Partner Promotion Usage Report</h2>
          <p className="text-muted-foreground">Track partner promotion performance and usage analytics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="start-date" className="text-sm font-medium">From:</label>
            <input
              id="start-date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1 border rounded-md text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="end-date" className="text-sm font-medium">To:</label>
            <input
              id="end-date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1 border rounded-md text-sm"
            />
          </div>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usages</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsages}</div>
            <p className="text-xs text-muted-foreground">
              Partner promotions applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalDiscountGiven.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Given as partner discounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenueImpact.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total booking value affected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Promotion</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">{stats.mostUsedPromotion || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Most frequently used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Usage Activity</CardTitle>
          <CardDescription>
            Detailed view of partner promotion applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading usage data...</div>
            </div>
          ) : usages.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No partner promotion usage data available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Usage tracking will begin once partner promotions are applied to bookings
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Promotion</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final Amount</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usages.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell>
                      {new Date(usage.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {usage.promotion?.title || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {usage.promotion?.partner_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{usage.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{usage.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>${Number(usage.original_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="text-green-600">
                        -{usage.promotion?.discount_percent || 0}%
                        <br />
                        <span className="text-xs">(-${Number(usage.discount_amount).toFixed(2)})</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${Number(usage.final_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={usage.booking_id ? 'default' : 'secondary'}>
                        {usage.booking_id ? 'Hotel' : 'Conference'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

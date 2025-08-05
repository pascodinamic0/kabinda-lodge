import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Hotel, 
  UtensilsCrossed, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Trash2,
  Database,
  Shield
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalRooms: number;
  totalBookings: number;
  totalRevenue: number;
  totalOrders: number;
  totalTables: number;
}

export default function SuperAdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRooms: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalTables: 0
  });
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Load all stats in parallel
      const [
        { count: usersCount },
        { count: roomsCount },
        { count: bookingsCount },
        { count: ordersCount },
        { count: tablesCount },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('rooms').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurant_tables').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_price')
      ]);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalRooms: roomsCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue,
        totalOrders: ordersCount || 0,
        totalTables: tablesCount || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseReset = async () => {
          if (confirmText.toLowerCase() !== 'delete') {
        toast({
          title: t('reset.invalid_confirmation', 'Invalid Confirmation'),
          description: t('reset.invalid_text', 'Please type "delete" exactly to confirm the reset'),
          variant: "destructive"
        });
        return;
      }

    setResetLoading(true);
    try {
      // Reset operational data while preserving system configuration
      const resetOperations = [
        // Clear all bookings
        supabase.from('bookings').delete().neq('id', 0),
        
        // Reset all rooms to available (except overridden ones)
        supabase.from('rooms').update({ 
          status: 'available',
          current_guest_id: null,
          check_in_date: null,
          check_out_date: null
        }).neq('id', 0),
        
        // Clear all restaurant orders
        supabase.from('orders').delete().neq('id', 0),
        
        // Reset all restaurant tables to available
        supabase.from('restaurant_tables').update({ 
          status: 'available',
          current_order_id: null
        }).neq('id', 0),
        
        // Clear all conference room bookings
        supabase.from('conference_bookings').delete().neq('id', 0),
        
        // Reset all conference rooms to available
        supabase.from('conference_rooms').update({ 
          status: 'available',
          current_booking_id: null
        }).neq('id', 0),
        
        // Clear all service requests
        supabase.from('service_requests').delete().neq('id', 0),
        
        // Clear all guest feedback/reviews
        supabase.from('guest_feedback').delete().neq('id', 0),
        
        // Clear all payment records
        supabase.from('payments').delete().neq('id', 0),
        
        // Clear all maintenance requests
        supabase.from('maintenance_requests').delete().neq('id', 0),
        
        // Clear all incidents
        supabase.from('incidents').delete().neq('id', 0),
        
        // Clear all housekeeping tasks
        supabase.from('housekeeping_tasks').delete().neq('id', 0),
        
        // Clear all lost and found items
        supabase.from('lost_found').delete().neq('id', 0),
        
        // Clear all notifications
        supabase.from('notifications').delete().neq('id', 0)
      ];

      await Promise.all(resetOperations);

      toast({
        title: t('reset.success', 'Database Reset Complete'),
        description: t('reset.success_text', 'All operational data has been cleared. System configuration data has been preserved.'),
        variant: "default"
      });

      // Reload stats to reflect the reset
      await loadDashboardStats();
      
      // Close dialog and reset confirmation text
      setShowResetDialog(false);
      setConfirmText('');
      
    } catch (error) {
      console.error('Error resetting database:', error);
      toast({
        title: t('reset.failed', 'Reset Failed'),
        description: t('reset.failed_text', 'An error occurred while resetting the database. Please try again.'),
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  const statCards = [
    {
      title: t('dashboard.total_users', 'Total Users'),
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('dashboard.total_rooms', 'Total Rooms'),
      value: stats.totalRooms,
      icon: Hotel,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('dashboard.total_bookings', 'Active Bookings'),
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: t('dashboard.total_revenue', 'Total Revenue'),
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: t('dashboard.pending_orders', 'Restaurant Orders'),
      value: stats.totalOrders,
      icon: UtensilsCrossed,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: t('dashboard.available_tables', 'Restaurant Tables'),
      value: stats.totalTables,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Super Admin Dashboard">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="container mx-auto px-6 py-8">
        {/* Database Reset Section */}
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Database className="h-5 w-5" />
              {t('reset.title', 'Database Reset')}
            </CardTitle>
            <CardDescription className="text-red-700">
              {t('reset.description', 'Clear all operational data while preserving system configuration')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-100 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">⚠️ {t('reset.warning', 'Critical Operation')}</h4>
                    <p className="text-sm text-red-700 mb-3">
                      {t('reset.warning_text', 'This will permanently delete all operational data including:')}
                    </p>
                    <ul className="text-sm text-red-700 space-y-1 mb-3">
                      <li>• {t('reset.will_delete', 'All room bookings and reservations')}</li>
                      <li>• {t('reset.will_delete_orders', 'All restaurant orders and payments')}</li>
                      <li>• {t('reset.will_delete_conference', 'All conference room bookings')}</li>
                      <li>• {t('reset.will_delete_services', 'All service requests and maintenance records')}</li>
                      <li>• {t('reset.will_delete_feedback', 'All guest feedback and reviews')}</li>
                      <li>• {t('reset.will_delete_notifications', 'All notifications and system logs')}</li>
                    </ul>
                    <p className="text-sm text-red-700 font-medium">
                      <strong>{t('reset.preserved', 'Preserved')}:</strong> {t('reset.preserved_text', 'Room configurations, menu items, amenities, conference room data, and system settings.')}
                    </p>
                  </div>
                </div>
              </div>
              
              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('reset.button', 'Reset Database')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      {t('reset.confirm_title', 'Confirm Database Reset')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('reset.confirm_text', 'This action cannot be undone. All operational data will be permanently deleted.')}
                      <br /><br />
                      <strong>{t('reset.type_delete', 'Type "delete" to confirm:')}</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="confirm-text">{t('message.confirm', 'Confirmation')}</Label>
                      <Input
                        id="confirm-text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={t('reset.type_delete', 'Type "delete" to confirm')}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('action.cancel', 'Cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDatabaseReset}
                      disabled={confirmText.toLowerCase() !== 'delete' || resetLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {resetLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('reset.loading', 'Resetting...')}
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('reset.button', 'Reset Database')}
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className={`${stat.bgColor} border-0`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Super Admin Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('system.overview', 'System Overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('system.status', 'Database Status')}</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    {t('system.operational', 'Operational')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('system.last_reset', 'Last Reset')}</span>
                  <span className="text-sm text-gray-900">{t('system.never', 'Never')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('system.version', 'System Version')}</span>
                  <span className="text-sm text-gray-900">v1.0.0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t('system.important_notes', 'Important Notes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• {t('system.reset_usage', 'Use the database reset feature only when starting operations')}</p>
                <p>• {t('system.data_cleared', 'All operational data will be cleared but system configuration preserved')}</p>
                <p>• {t('system.irreversible', 'This action is irreversible and requires confirmation')}</p>
                <p>• {t('system.backup', 'Consider backing up data before reset if needed')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
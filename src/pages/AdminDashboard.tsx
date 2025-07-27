
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Bed, 
  Calendar, 
  BarChart3, 
  TrendingUp,
  DoorClosed,
  VideoIcon,
  UtensilsCrossed,
  CreditCard,
  Clock,
  ChefHat
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useLanguage } from '@/contexts/LanguageContext';


export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { totalRooms, pendingPayments, occupiedRooms, activeBookings, staffMembers, todayRevenue, loading, error } = useDashboardStats();

  const quickStats = [
    {
      title: t('pending_payments', 'Pending Payments'),
      value: loading ? '...' : pendingPayments.toString(),
      change: t('require_verification', 'Require verification'),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: t('occupied_rooms', 'Occupied Rooms'),
      value: loading ? '...' : occupiedRooms.toString(),
      change: `${loading ? '...' : Math.round((occupiedRooms / Math.max(totalRooms, 1)) * 100)}% ${t('occupancy', 'occupancy')}`,
      icon: DoorClosed,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: t('active_bookings', 'Active Bookings'),
      value: loading ? '...' : activeBookings.toString(),
      change: t('current_future_bookings', 'Current and future bookings'),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('revenue_today', 'Revenue Today'),
      value: loading ? '...' : `$${todayRevenue.toFixed(2)}`,
      change: t('todays_completed_payments', "Today's completed payments"),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];


  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {error ? (
              <div className="col-span-full text-center text-red-500">
                Error loading dashboard stats: {error}
              </div>
            ) : (
              quickStats.map((stat) => {
                const Icon = stat.icon;
                
                return (
                  <Card key={stat.title} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        {loading ? (
                          <Skeleton className="h-8 w-16 mt-1" />
                        ) : (
                          <p className="text-2xl font-bold">{stat.value}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('quick_actions', 'Quick Actions')}</CardTitle>
              <CardDescription>{t('common_management_tasks', 'Common management tasks')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/users')}
              >
                <Users className="h-8 w-8" />
                <span>{t('manage_users', 'Manage Users')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/rooms')}
              >
                <Bed className="h-8 w-8" />
                <span>{t('manage_rooms', 'Manage Rooms')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                  onClick={() => navigate('/admin/bookings')}
              >
                <Calendar className="h-8 w-8" />
                <span>{t('view_bookings', 'View Bookings')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/reports')}
              >
                <BarChart3 className="h-8 w-8" />
                <span>{t('analytics', 'Analytics')}</span>
              </Button>
            </CardContent>
          </Card>

          {/* Additional Management Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('advanced_management', 'Advanced Management')}</CardTitle>
              <CardDescription>{t('specialized_management_tools', 'Specialized management tools')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/conference-rooms')}
              >
                <VideoIcon className="h-8 w-8" />
                <span>{t('conference_rooms', 'Conference Rooms')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/menu')}
              >
                <UtensilsCrossed className="h-8 w-8" />
                <span>{t('menu_management', 'Menu Management')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/payments')}
              >
                <CreditCard className="h-8 w-8" />
                <span>{t('payment_verification', 'Payment Verification')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/content')}
              >
                <BarChart3 className="h-8 w-8" />
                <span>{t('content_management', 'Content Management')}</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

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
  DoorOpen,
  DoorClosed
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useDashboardStats } from '@/hooks/useDashboardStats';


export default function AdminDashboard() {
  const navigate = useNavigate();
  const { totalRooms, availableRooms, occupiedRooms, activeBookings, staffMembers, todayRevenue, loading, error } = useDashboardStats();

  const quickStats = [
    {
      title: 'Available Rooms',
      value: loading ? '...' : availableRooms.toString(),
      change: `${loading ? '...' : totalRooms} total rooms`,
      icon: DoorOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Occupied Rooms',
      value: loading ? '...' : occupiedRooms.toString(),
      change: `${loading ? '...' : Math.round((occupiedRooms / Math.max(totalRooms, 1)) * 100)}% occupancy`,
      icon: DoorClosed,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Active Bookings',
      value: loading ? '...' : activeBookings.toString(),
      change: 'Current and future bookings',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Revenue Today',
      value: loading ? '...' : `$${todayRevenue.toFixed(2)}`,
      change: 'Today\'s completed payments',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const recentActivities = [
    { action: 'New booking created', time: '2 minutes ago', user: 'Room 101' },
    { action: 'Payment verified', time: '5 minutes ago', user: 'John Doe' },
    { action: 'Menu item updated', time: '10 minutes ago', user: 'Chef Special' },
    { action: 'Staff member added', time: '1 hour ago', user: 'Sarah Smith' },
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Common management tasks</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Button 
                    variant="outline" 
                    className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 text-sm"
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="h-6 w-6" />
                    <span>Manage Users</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 text-sm"
                    onClick={() => navigate('/admin/rooms')}
                  >
                    <Bed className="h-6 w-6" />
                    <span>Manage Rooms</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 text-sm"
                    onClick={() => {
                      console.log('Navigating to bookings');
                      navigate('/admin/bookings');
                    }}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>View Bookings</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 text-sm"
                    onClick={() => navigate('/admin/reports')}
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span>Analytics</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest system updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.user}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <Button variant="ghost" className="w-full text-sm">
                  View all activity
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
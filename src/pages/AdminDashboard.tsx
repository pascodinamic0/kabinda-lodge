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
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common management tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/users')}
              >
                <Users className="h-8 w-8" />
                <span>Manage Users</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/rooms')}
              >
                <Bed className="h-8 w-8" />
                <span>Manage Rooms</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => {
                  console.log('Navigating to bookings');
                  navigate('/admin/bookings');
                }}
              >
                <Calendar className="h-8 w-8" />
                <span>View Bookings</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-sm hover-scale"
                onClick={() => navigate('/admin/reports')}
              >
                <BarChart3 className="h-8 w-8" />
                <span>Analytics</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
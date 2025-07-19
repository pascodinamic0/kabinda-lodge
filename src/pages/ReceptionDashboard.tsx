import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  CreditCard, 
  UserCheck, 
  Receipt,
  Upload,
  Download,
  Hotel,
  DollarSign,
  CheckCircle,
  LogOut
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function ReceptionDashboard() {
  const { 
    totalRooms, 
    availableRooms, 
    activeBookings, 
    todayRevenue, 
    loading, 
    error 
  } = useDashboardStats();

  const dashboardItems = [
    {
      title: 'New Booking',
      description: 'Create a new room reservation',
      icon: Calendar,
      href: '/book-room',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Check In/Out',
      description: 'Manage guest arrivals and departures',
      icon: UserCheck,
      href: '/admin/booking-overview',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Guest Management',
      description: 'Manage guest profiles and information',
      icon: UserCheck,
      href: '/reception/guest-management',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Room Status',
      description: 'Monitor and update room availability',
      icon: Hotel,
      href: '/reception/room-status',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Process Payment',
      description: 'Handle booking payments and billing',
      icon: CreditCard,
      href: '/admin/payment-verification',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Guest Services',
      description: 'Handle requests and complaints',
      icon: Receipt,
      href: '/reception/guest-services',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Maintenance Requests',
      description: 'Log and track room maintenance',
      icon: Upload,
      href: '/reception/maintenance',
      gradient: 'from-red-500 to-red-600'
    },
    {
      title: 'Daily Reports',
      description: 'Generate occupancy and revenue reports',
      icon: Download,
      href: '/admin/reports',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Restaurant Orders',
      description: 'Review and approve dining orders',
      icon: Receipt,
      href: '/reception/orders',
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      title: 'Conference Booking',
      description: 'Manage conference room reservations',
      icon: Calendar,
      href: '/book-conference-room',
      gradient: 'from-violet-500 to-violet-600'
    },
    {
      title: 'Lost & Found',
      description: 'Manage lost and found items',
      icon: Upload,
      href: '/reception/lost-found',
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Phone Directory',
      description: 'Access hotel contact information',
      icon: Receipt,
      href: '/reception/directory',
      gradient: 'from-pink-500 to-pink-600'
    }
  ];

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Error loading dashboard: {error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reception Dashboard</h1>
          <p className="text-muted-foreground">Manage hotel operations and guest services</p>
        </div>

        {/* Today's Summary */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-foreground">Today's Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Bookings</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{activeBookings}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Current reservations</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Available Rooms</CardTitle>
                  <Hotel className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{availableRooms}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Out of {totalRooms} total rooms</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
                  <LogOut className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">
                    {totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0}%
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{totalRooms - availableRooms} occupied</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">
                    ${todayRevenue.toLocaleString()}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Payments collected</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/20 cursor-pointer">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${item.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {item.title}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
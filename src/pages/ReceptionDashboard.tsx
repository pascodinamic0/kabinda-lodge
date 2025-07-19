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
  LogOut,
  MessageSquare,
  Star
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
      title: 'Process Payment',
      description: 'Handle booking payments and billing',
      icon: CreditCard,
      href: '/admin/payment-verification',
      gradient: 'from-purple-500 to-purple-600'
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
    },
    {
      title: 'Review Management',
      description: 'Send review requests to guests',
      icon: Star,
      href: '/reception/reviews',
      gradient: 'from-green-500 to-green-600'
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
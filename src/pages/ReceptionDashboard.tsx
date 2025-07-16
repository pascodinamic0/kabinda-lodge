import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  CreditCard, 
  UserCheck, 
  Receipt,
  Upload,
  Download
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function ReceptionDashboard() {

  const dashboardItems = [
    {
      title: 'New Booking',
      description: 'Create a new room reservation',
      icon: Calendar,
      href: '/reception/booking',
      color: 'bg-blue-500'
    },
    {
      title: 'Check In/Out',
      description: 'Manage guest arrivals and departures',
      icon: UserCheck,
      href: '/reception/checkin',
      color: 'bg-green-500'
    },
    {
      title: 'Process Payment',
      description: 'Handle booking payments',
      icon: CreditCard,
      href: '/reception/payment',
      color: 'bg-purple-500'
    },
    {
      title: 'Generate Receipt',
      description: 'Print guest receipts',
      icon: Receipt,
      href: '/reception/receipt',
      color: 'bg-orange-500'
    },
    {
      title: 'Import Data',
      description: 'Upload booking and payment CSV files',
      icon: Upload,
      href: '/reception/import',
      color: 'bg-indigo-500'
    },
    {
      title: 'Export Data',
      description: 'Download booking and payment reports',
      icon: Download,
      href: '/reception/export',
      color: 'bg-pink-500'
    },
    {
      title: 'Order Management',
      description: 'Review and approve restaurant orders',
      icon: UserCheck,
      href: '/reception/orders',
      color: 'bg-teal-500'
    }
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} to={item.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      {item.title}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Today's Summary */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Today's Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">3 completed, 2 pending</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Check-outs Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">6 completed, 2 pending</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Out of 24 total rooms</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Payments Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,800</div>
                <p className="text-xs text-muted-foreground">12 transactions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
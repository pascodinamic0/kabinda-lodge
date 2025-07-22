import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UtensilsCrossed, 
  ShoppingCart, 
  Printer, 
  CheckCircle,
  Gift,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function RestaurantDashboard() {

  const dashboardItems = [
    {
      title: 'Menu Editor',
      description: 'Manage menu items and availability',
      icon: UtensilsCrossed,
      href: '/restaurant/menu',
      color: 'bg-blue-500'
    },
    {
      title: 'Take Order',
      description: 'Create new orders for tables',
      icon: ShoppingCart,
      href: '/restaurant/order',
      color: 'bg-green-500'
    },
    {
      title: 'Print Orders',
      description: 'Print order tickets for kitchen',
      icon: Printer,
      href: '/restaurant/print',
      color: 'bg-purple-500'
    },
    {
      title: 'Approve Orders',
      description: 'Review and approve online orders',
      icon: CheckCircle,
      href: '/restaurant/orders',
      color: 'bg-orange-500'
    },
    {
      title: 'Promotions',
      description: 'Apply discounts and promotions',
      icon: Gift,
      href: '/restaurant/promotions',
      color: 'bg-indigo-500'
    },
    {
      title: 'Sales Analytics',
      description: 'View sales reports and top items',
      icon: BarChart3,
      href: '/restaurant/analytics',
      color: 'bg-pink-500'
    }
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Items */}
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

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/restaurant/order">
                <ShoppingCart className="h-4 w-4 mr-2" />
                New Order
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/restaurant/orders">
                <CheckCircle className="h-4 w-4 mr-2" />
                Manage Orders
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/restaurant/menu">
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Update Menu
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
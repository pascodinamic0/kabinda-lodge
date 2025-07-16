import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Bed, 
  Calendar, 
  UtensilsCrossed, 
  BarChart3, 
  Gift,
  CreditCard,
  LogOut 
} from 'lucide-react';

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardItems = [
    {
      title: 'User Management',
      description: 'Manage staff accounts and roles',
      icon: Users,
      color: 'bg-blue-500',
      path: '/admin/users'
    },
    {
      title: 'Room Management',
      description: 'Add, edit, and manage hotel rooms',
      icon: Bed,
      color: 'bg-green-500',
      path: '/admin/rooms'
    },
    {
      title: 'Booking Overview',
      description: 'View and manage all bookings',
      icon: Calendar,
      color: 'bg-purple-500',
      path: '/admin/bookings'
    },
    {
      title: 'Menu Management',
      description: 'Manage restaurant menu items',
      icon: UtensilsCrossed,
      color: 'bg-orange-500',
      path: '/admin/menu'
    },
    {
      title: 'Reports Dashboard',
      description: 'View analytics and reports',
      icon: BarChart3,
      color: 'bg-indigo-500',
      path: '/admin/reports'
    },
    {
      title: 'Promotions',
      description: 'Manage offers and promotions',
      icon: Gift,
      color: 'bg-pink-500',
      path: '/admin/promotions'
    },
    {
      title: 'Payment Verification',
      description: 'Verify mobile money payments',
      icon: CreditCard,
      color: 'bg-red-500',
      path: '/admin/payments'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats - Now at the top */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+5 from yesterday</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">2 new this month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,400</div>
                <p className="text-xs text-muted-foreground">+12% from yesterday</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Management Tools - Now below stats */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(item.path)}>
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Access {item.title}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
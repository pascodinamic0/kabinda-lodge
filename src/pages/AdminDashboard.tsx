import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Bed, 
  Calendar, 
  UtensilsCrossed, 
  BarChart3, 
  Gift,
  CreditCard,
  LogOut,
  Settings,
  TrendingUp,
  Activity,
  Bell,
  ChevronRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const quickStats = [
    {
      title: 'Total Rooms',
      value: '24',
      change: '+2 from last month',
      changeType: 'positive',
      icon: Bed,
    },
    {
      title: 'Active Bookings',
      value: '12',
      change: '+5 from yesterday',
      changeType: 'positive',
      icon: Calendar,
    },
    {
      title: 'Staff Members',
      value: '8',
      change: '2 new this month',
      changeType: 'neutral',
      icon: Users,
    },
    {
      title: 'Revenue Today',
      value: '$2,400',
      change: '+12% from yesterday',
      changeType: 'positive',
      icon: TrendingUp,
    }
  ];

  const dashboardItems = [
    {
      title: 'User Management',
      description: 'Manage staff accounts and roles',
      icon: Users,
      category: 'Core Management',
      path: '/admin/users',
      priority: 'high'
    },
    {
      title: 'Room Management',
      description: 'Add, edit, and manage hotel rooms',
      icon: Bed,
      category: 'Core Management',
      path: '/admin/rooms',
      priority: 'high'
    },
    {
      title: 'Booking Overview',
      description: 'View and manage all bookings',
      icon: Calendar,
      category: 'Operations',
      path: '/admin/bookings',
      priority: 'high'
    },
    {
      title: 'Payment Verification',
      description: 'Verify mobile money payments',
      icon: CreditCard,
      category: 'Operations',
      path: '/admin/payments',
      priority: 'high'
    },
    {
      title: 'Menu Management',
      description: 'Manage restaurant menu items',
      icon: UtensilsCrossed,
      category: 'Restaurant',
      path: '/admin/menu',
      priority: 'medium'
    },
    {
      title: 'Reports Dashboard',
      description: 'View analytics and reports',
      icon: BarChart3,
      category: 'Analytics',
      path: '/admin/reports',
      priority: 'medium'
    },
    {
      title: 'Promotions',
      description: 'Manage offers and promotions',
      icon: Gift,
      category: 'Marketing',
      path: '/admin/promotions',
      priority: 'low'
    },
    {
      title: 'Content Management',
      description: 'Manage website content and customization',
      icon: Settings,
      category: 'System',
      path: '/admin/content',
      priority: 'low'
    }
  ];

  const menuCategories = [
    { name: 'Core Management', items: dashboardItems.filter(item => item.category === 'Core Management') },
    { name: 'Operations', items: dashboardItems.filter(item => item.category === 'Operations') },
    { name: 'Restaurant', items: dashboardItems.filter(item => item.category === 'Restaurant') },
    { name: 'Analytics', items: dashboardItems.filter(item => item.category === 'Analytics') },
    { name: 'Marketing', items: dashboardItems.filter(item => item.category === 'Marketing') },
    { name: 'System', items: dashboardItems.filter(item => item.category === 'System') }
  ].filter(category => category.items.length > 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getIconBg = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-br from-primary to-primary/80';
      case 'medium': return 'bg-gradient-to-br from-warning to-warning/80';
      case 'low': return 'bg-gradient-to-br from-muted-foreground to-muted-foreground/80';
      default: return 'bg-gradient-to-br from-primary to-primary/80';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Enhanced Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Enhanced Quick Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Performance Overview</h2>
            <Badge variant="secondary" className="text-xs">Live Data</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              const isPositive = stat.changeType === 'positive';
              
              return (
                <Card key={stat.title} className="relative overflow-hidden border-0 shadow-sm bg-card/50 backdrop-blur">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className={`text-xs flex items-center ${
                      isPositive ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {isPositive && <TrendingUp className="h-3 w-3 mr-1" />}
                      {stat.change}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Management Tools with Categories */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-foreground">Management Hub</h2>
            <Badge variant="outline" className="text-xs">
              {dashboardItems.length} Tools Available
            </Badge>
          </div>
          
          <div className="space-y-8">
            {menuCategories.map((category) => (
              <div key={category.name} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-foreground">{category.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {category.items.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    
                    return (
                      <Card 
                        key={item.title} 
                        className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-card/50 backdrop-blur hover:scale-[1.02]" 
                        onClick={() => navigate(item.path)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-xl ${getIconBg(item.priority)} flex items-center justify-center shadow-lg`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(item.priority)}`}
                            >
                              {item.priority}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-base group-hover:text-primary transition-colors">
                              {item.title}
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-between group-hover:bg-primary/10 transition-colors"
                          >
                            <span>Open {item.title.split(' ')[0]}</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
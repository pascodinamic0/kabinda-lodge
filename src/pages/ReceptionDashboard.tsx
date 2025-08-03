
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
  Star,
  Users,
  Bed,
  ClipboardList,
  AlertTriangle,
  Sparkles,
  KeyRound,
  Wrench,
  Search,
  Phone,
  ShoppingCart
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ReceptionDashboard() {
  const { 
    loading, 
    error 
  } = useDashboardStats();
  const { t } = useLanguage();

  const dashboardItems = [
    {
      title: "Guest Management",
      description: "Manage guest profiles and information",
      icon: Users,
      href: '/reception/guests',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: "Room Status",
      description: "Monitor and update room availability",
      icon: Bed,
      href: '/reception/rooms',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: "Guest Services",
      description: "Handle guest requests and services",
      icon: ClipboardList,
      href: '/reception/services',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: "Incident Reporting",
      description: "Report and manage security incidents",
      icon: AlertTriangle,
      href: '/reception/incidents',
      gradient: 'from-red-500 to-red-600'
    },
    {
      title: "Housekeeping",
      description: "Coordinate housekeeping tasks",
      icon: Sparkles,
      href: '/reception/housekeeping',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      title: "Key Card Management",
      description: "Manage room key cards and access",
      icon: KeyRound,
      href: '/reception/key-cards',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      title: "Maintenance Requests",
      description: "Track facility maintenance issues",
      icon: Wrench,
      href: '/reception/maintenance',
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      title: "Lost & Found",
      description: "Manage lost and found items",
      icon: Search,
      href: '/reception/lost-found',
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      title: "Phone Directory",
      description: "Access hotel contact information",
      icon: Phone,
      href: '/reception/directory',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      title: "Order Approval",
      description: "Review and approve guest orders",
      icon: ShoppingCart,
      href: '/reception/orders',
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      title: "Review Management",
      description: "Send review requests to guests",
      icon: Star,
      href: '/reception/reviews',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      title: "Payment Verification",
      description: "Verify guest payments and transactions",
      icon: CreditCard,
      href: '/reception/payments',
      gradient: 'from-slate-500 to-slate-600'
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
          <h2 className="text-xl font-semibold mb-6 text-foreground">{t('quick_actions', 'Quick Actions')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardItems.map((item, index) => {
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

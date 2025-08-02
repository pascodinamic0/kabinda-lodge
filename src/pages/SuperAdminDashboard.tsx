import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const superAdminFeatures = [
    {
      title: "User Management",
      description: "Add, edit, and delete user accounts across all roles",
      icon: Users,
      action: () => navigate('/admin/users'),
      color: "text-blue-600"
    },
    {
      title: "Payment Management", 
      description: "Manage payment methods and bank account details",
      icon: DollarSign,
      action: () => navigate('/admin/payment-management'),
      color: "text-green-600"
    },
    {
      title: "Room Override Control",
      description: "Lock/unlock rooms and manage manual overrides",
      icon: Shield,
      action: () => navigate('/admin/rooms'),
      color: "text-orange-600"
    },
    {
      title: "System Reports",
      description: "Access comprehensive system reports and analytics",
      icon: FileText,
      action: () => navigate('/admin/reports'),
      color: "text-purple-600"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage critical system functions and user accounts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {superAdminFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-muted ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm text-muted-foreground mb-4">
                  {feature.description}
                </CardDescription>
                <Button 
                  onClick={feature.action}
                  className="w-full"
                  variant="outline"
                >
                  Access
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Super Admin Privileges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              You have access to system-critical functions. Use these privileges responsibly and ensure proper security protocols are followed.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
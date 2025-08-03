import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, Shield, FileText, Database, UserCheck, TrendingUp, Settings } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
import { useLanguage } from '@/contexts/LanguageContext';
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const {
    t
  } = useLanguage();
  const {
    totalUsers,
    totalAdmins,
    totalRevenue,
    systemTables,
    loading,
    error
  } = useSuperAdminStats();
  const quickStats = [{
    title: t('total_users', 'Total Users'),
    value: loading ? '...' : totalUsers.toString(),
    change: t('all_system_users', 'All system users'),
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  }, {
    title: t('admin_users', 'Admin Users'),
    value: loading ? '...' : totalAdmins.toString(),
    change: t('administrators_count', 'Administrators count'),
    icon: UserCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }, {
    title: t('total_revenue', 'Total Revenue'),
    value: loading ? '...' : `$${totalRevenue.toFixed(2)}`,
    change: t('all_completed_payments', 'All completed payments'),
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  }, {
    title: t('system_tables', 'System Tables'),
    value: loading ? '...' : systemTables.toString(),
    change: t('database_tables', 'Database tables'),
    icon: Database,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }];
  const superAdminFeatures = [{
    title: t('user_management', 'User Management'),
    description: t('manage_user_accounts', 'Add, edit, and delete user accounts across all roles'),
    icon: Users,
    action: () => navigate('/kabinda-lodge/admin/users')
  }, {
    title: t('payment_management', 'Payment Management'),
    description: t('manage_payment_methods', 'Manage payment methods and bank account details'),
    icon: DollarSign,
    action: () => navigate('/kabinda-lodge/admin/payment-management')
  }, {
    title: t('room_override_control', 'Room Override Control'),
    description: t('lock_unlock_rooms', 'Lock/unlock rooms and manage manual overrides'),
    icon: Shield,
    action: () => navigate('/kabinda-lodge/admin/rooms')
  }, {
    title: t('system_reports', 'System Reports'),
    description: t('system_reports_analytics', 'Access comprehensive system reports and analytics'),
    icon: FileText,
    action: () => navigate('/kabinda-lodge/admin/reports')
  }];
  return <DashboardLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('super_admin_dashboard', 'Super Admin Dashboard')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('manage_critical_system_functions', 'Manage critical system functions and user accounts')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {error ? <div className="col-span-full text-center text-red-500">
                Error loading dashboard stats: {error}
              </div> : quickStats.map(stat => {
            const Icon = stat.icon;
            return <Card key={stat.title} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold">{stat.value}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                  </Card>;
          })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('super_admin_actions', 'Super Admin Actions')}</CardTitle>
              <CardDescription>{t('critical_system_management', 'Critical system management tasks')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {superAdminFeatures.map((feature, index) => <Button key={index} variant="outline" className="h-20 flex-col space-y-2 text-sm hover-scale" onClick={feature.action}>
                  <feature.icon className="h-8 w-8" />
                  <span>{feature.title}</span>
                </Button>)}
            </CardContent>
          </Card>

          {/* Warning Card */}
          
        </div>
      </div>
    </DashboardLayout>;
}
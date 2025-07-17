import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Settings as SettingsIcon, 
  Bell, 
  Database,
  Lock,
  Plug,
  FileText,
  Download,
  Monitor,
  Printer,
  UserCheck,
  ChefHat,
  CreditCard,
  UtensilsCrossed,
  Volume2
} from 'lucide-react';

// Import all settings components
import ProfileSettings from '@/components/settings/ProfileSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import PreferencesSettings from '@/components/settings/PreferencesSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import SecurityPolicies from '@/components/settings/SecurityPolicies';
import IntegrationSettings from '@/components/settings/IntegrationSettings';
import AuditLogs from '@/components/settings/AuditLogs';
import BackupSettings from '@/components/settings/BackupSettings';
import DisplaySettings from '@/components/settings/DisplaySettings';
import PrintSettings from '@/components/settings/PrintSettings';
import CheckInSettings from '@/components/settings/CheckInSettings';
import KitchenDisplay from '@/components/settings/KitchenDisplay';
import POSSettings from '@/components/settings/POSSettings';
import MenuDisplay from '@/components/settings/MenuDisplay';
import OrderNotifications from '@/components/settings/OrderNotifications';

export default function Settings() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const getAvailableTabs = () => {
    const commonTabs = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'security', label: 'Security', icon: Shield },
      { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    const adminTabs = [
      { id: 'system', label: 'System', icon: Database },
      { id: 'security-policies', label: 'Security Policies', icon: Lock },
      { id: 'integrations', label: 'Integrations', icon: Plug },
      { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
      { id: 'backup', label: 'Backup & Export', icon: Download },
    ];

    const receptionistTabs = [
      { id: 'display', label: 'Display', icon: Monitor },
      { id: 'print', label: 'Print Settings', icon: Printer },
      { id: 'checkin', label: 'Check-in/out', icon: UserCheck },
    ];

    const restaurantTabs = [
      { id: 'kitchen', label: 'Kitchen Display', icon: ChefHat },
      { id: 'pos', label: 'POS Config', icon: CreditCard },
      { id: 'menu-display', label: 'Menu Display', icon: UtensilsCrossed },
      { id: 'order-notifications', label: 'Order Alerts', icon: Volume2 },
    ];

    let tabs = [...commonTabs];

    if (userRole === 'Admin') {
      tabs = [...tabs, ...adminTabs, ...receptionistTabs, ...restaurantTabs];
    } else if (userRole === 'Receptionist') {
      tabs = [...tabs, ...receptionistTabs];
    } else if (userRole === 'RestaurantLead') {
      tabs = [...tabs, ...restaurantTabs];
    }

    return tabs;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'system':
        return <SystemSettings />;
      case 'security-policies':
        return <SecurityPolicies />;
      case 'integrations':
        return <IntegrationSettings />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'backup':
        return <BackupSettings />;
      case 'display':
        return <DisplaySettings />;
      case 'print':
        return <PrintSettings />;
      case 'checkin':
        return <CheckInSettings />;
      case 'kitchen':
        return <KitchenDisplay />;
      case 'pos':
        return <POSSettings />;
      case 'menu-display':
        return <MenuDisplay />;
      case 'order-notifications':
        return <OrderNotifications />;
      default:
        return <ProfileSettings />;
    }
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2 text-xs"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {availableTabs.find(tab => tab.id === activeTab)?.icon && (
                  React.createElement(availableTabs.find(tab => tab.id === activeTab)!.icon, { className: "h-5 w-5" })
                )}
                {availableTabs.find(tab => tab.id === activeTab)?.label}
              </CardTitle>
              <Badge variant="outline">{userRole}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {renderTabContent()}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
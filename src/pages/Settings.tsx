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
  Building,
  Lock,
  Plug,
  FileText,
  Palette
} from 'lucide-react';

// Import core settings components
import ProfileSettings from '@/components/settings/ProfileSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import PreferencesSettings from '@/components/settings/PreferencesSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import SecurityPolicies from '@/components/settings/SecurityPolicies';
import IntegrationSettings from '@/components/settings/IntegrationSettings';
import AuditLogs from '@/components/settings/AuditLogs';

export default function Settings() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const getAvailableTabs = () => {
    const commonTabs = [
      { id: 'profile', label: 'Profile', icon: User, description: 'Manage your account and personal information' },
      { id: 'security', label: 'Security', icon: Shield, description: 'Password and authentication settings' },
      { id: 'preferences', label: 'Preferences', icon: Palette, description: 'Theme, language and display preferences' },
      { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure notification preferences' },
    ];

    const adminTabs = [
      { id: 'system', label: 'System', icon: Building, description: 'Hotel information and operating hours' },
      { id: 'security-policies', label: 'Security Policies', icon: Lock, description: 'System-wide security settings' },
      { id: 'integrations', label: 'Integrations', icon: Plug, description: 'Third-party service configurations' },
      { id: 'audit-logs', label: 'Audit Logs', icon: FileText, description: 'Security and activity logs' },
    ];

    let tabs = [...commonTabs];

    if (userRole === 'Admin') {
      tabs = [...tabs, ...adminTabs];
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
      default:
        return <ProfileSettings />;
    }
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Configure your account and system preferences
              </p>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {userRole}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="xl:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-lg' 
                          : 'hover:bg-accent/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                            {tab.label}
                          </div>
                          <div className={`text-xs ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'} truncate`}>
                            {tab.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3">
            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-card to-accent/5">
                <div className="flex items-center gap-3">
                  {availableTabs.find(tab => tab.id === activeTab)?.icon && (
                    React.createElement(availableTabs.find(tab => tab.id === activeTab)!.icon, { 
                      className: "h-6 w-6 text-primary" 
                    })
                  )}
                  <div>
                    <CardTitle className="text-xl">
                      {availableTabs.find(tab => tab.id === activeTab)?.label}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {availableTabs.find(tab => tab.id === activeTab)?.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="animate-fade-in">
                  {renderTabContent()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
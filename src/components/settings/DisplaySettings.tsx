import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor } from 'lucide-react';

export default function DisplaySettings() {
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [dashboardLayout, setDashboardLayout] = useState('default');
  const [showNotifications, setShowNotifications] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Dashboard Layout
          </CardTitle>
          <CardDescription>
            Customize your dashboard appearance and layout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Layout Style</Label>
            <Select value={dashboardLayout} onValueChange={setDashboardLayout}>
              <SelectTrigger>
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="expanded">Expanded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Quick Actions</Label>
              <p className="text-sm text-muted-foreground">Display quick action buttons on dashboard</p>
            </div>
            <Switch checked={showQuickActions} onCheckedChange={setShowQuickActions} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Notifications</Label>
              <p className="text-sm text-muted-foreground">Display notification panel</p>
            </div>
            <Switch checked={showNotifications} onCheckedChange={setShowNotifications} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
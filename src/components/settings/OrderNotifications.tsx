import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2 } from 'lucide-react';

export default function OrderNotifications() {
  const [newOrderSound, setNewOrderSound] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Order Notification Settings
          </CardTitle>
          <CardDescription>
            Configure order alerts and notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>New Order Sound</Label>
              <p className="text-sm text-muted-foreground">Play sound for new orders</p>
            </div>
            <Switch checked={newOrderSound} onCheckedChange={setNewOrderSound} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Refresh</Label>
              <p className="text-sm text-muted-foreground">Automatically refresh order list</p>
            </div>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UserCheck } from 'lucide-react';

export default function CheckInSettings() {
  const [autoCheckOut, setAutoCheckOut] = useState(true);
  const [requireId, setRequireId] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Check-in/out Settings
          </CardTitle>
          <CardDescription>
            Configure check-in and check-out workflow settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Check-out</Label>
              <p className="text-sm text-muted-foreground">Automatically check out guests at checkout time</p>
            </div>
            <Switch checked={autoCheckOut} onCheckedChange={setAutoCheckOut} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require ID Verification</Label>
              <p className="text-sm text-muted-foreground">Require ID verification during check-in</p>
            </div>
            <Switch checked={requireId} onCheckedChange={setRequireId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
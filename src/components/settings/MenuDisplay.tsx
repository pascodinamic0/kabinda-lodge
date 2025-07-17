import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UtensilsCrossed } from 'lucide-react';

export default function MenuDisplay() {
  const [showImages, setShowImages] = useState(true);
  const [showPrices, setShowPrices] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Menu Display Settings
          </CardTitle>
          <CardDescription>
            Configure how menu items are displayed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Images</Label>
              <p className="text-sm text-muted-foreground">Display item images in menu</p>
            </div>
            <Switch checked={showImages} onCheckedChange={setShowImages} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Prices</Label>
              <p className="text-sm text-muted-foreground">Display prices in menu</p>
            </div>
            <Switch checked={showPrices} onCheckedChange={setShowPrices} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
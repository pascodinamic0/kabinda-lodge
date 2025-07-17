import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';

export default function POSSettings() {
  const [taxRate, setTaxRate] = useState('10');
  const [serviceCharge, setServiceCharge] = useState('15');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            POS Configuration
          </CardTitle>
          <CardDescription>
            Configure point of sale and payment settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="Enter tax rate"
            />
          </div>

          <div className="space-y-2">
            <Label>Service Charge (%)</Label>
            <Input
              type="number"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
              placeholder="Enter service charge"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
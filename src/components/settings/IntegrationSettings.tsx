import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plug, CreditCard, Mail, Key, CheckCircle, XCircle } from 'lucide-react';

export default function IntegrationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [paymentGateway, setPaymentGateway] = useState({
    stripeEnabled: true,
    stripePublicKey: 'pk_test_...',
    stripeSecretKey: '••••••••••••••••',
    paypalEnabled: false,
    paypalClientId: '',
    testMode: true,
  });

  const [emailService, setEmailService] = useState({
    provider: 'sendgrid',
    apiKey: '••••••••••••••••',
    fromEmail: 'noreply@kabidalodge.com',
    fromName: 'Kabinda Lodge',
    enabled: true,
  });

  const [smsService, setSmsService] = useState({
    provider: 'twilio',
    accountSid: '',
    authToken: '••••••••••••••••',
    fromNumber: '',
    enabled: false,
  });

  const handleTestConnection = async (service: string) => {
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Connection successful",
        description: `${service} integration is working correctly.`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${service}.`,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Integration settings saved",
        description: "All integration configurations have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save integration settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Gateway
          </CardTitle>
          <CardDescription>
            Configure payment processing integrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="font-medium">Stripe</h4>
                <p className="text-sm text-muted-foreground">Credit card processing</p>
              </div>
              {paymentGateway.stripeEnabled && (
                <Badge variant="outline" className="ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection('Stripe')}
              >
                Test
              </Button>
              <Switch
                checked={paymentGateway.stripeEnabled}
                onCheckedChange={(checked) => setPaymentGateway(prev => ({ ...prev, stripeEnabled: checked }))}
              />
            </div>
          </div>

          {paymentGateway.stripeEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <Input
                    value={paymentGateway.stripePublicKey}
                    onChange={(e) => setPaymentGateway(prev => ({ ...prev, stripePublicKey: e.target.value }))}
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <Input
                    type="password"
                    value={paymentGateway.stripeSecretKey}
                    onChange={(e) => setPaymentGateway(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                    placeholder="sk_test_..."
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Test Mode</Label>
                <Switch
                  checked={paymentGateway.testMode}
                  onCheckedChange={(checked) => setPaymentGateway(prev => ({ ...prev, testMode: checked }))}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="font-medium">PayPal</h4>
                <p className="text-sm text-muted-foreground">Alternative payment method</p>
              </div>
              {!paymentGateway.paypalEnabled && (
                <Badge variant="outline" className="ml-2">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
            <Switch
              checked={paymentGateway.paypalEnabled}
              onCheckedChange={(checked) => setPaymentGateway(prev => ({ ...prev, paypalEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Service
          </CardTitle>
          <CardDescription>
            Configure email delivery for notifications and confirmations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Integration</h4>
              <p className="text-sm text-muted-foreground">
                {emailService.provider.charAt(0).toUpperCase() + emailService.provider.slice(1)} SMTP
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection('Email Service')}
              >
                Test
              </Button>
              <Switch
                checked={emailService.enabled}
                onCheckedChange={(checked) => setEmailService(prev => ({ ...prev, enabled: checked }))}
              />
            </div>
          </div>

          {emailService.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={emailService.apiKey}
                      onChange={(e) => setEmailService(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="pl-10"
                      placeholder="Enter API key"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    type="email"
                    value={emailService.fromEmail}
                    onChange={(e) => setEmailService(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="noreply@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={emailService.fromName}
                    onChange={(e) => setEmailService(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="Your Hotel Name"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Integration Settings"}
        </Button>
      </div>
    </div>
  );
}
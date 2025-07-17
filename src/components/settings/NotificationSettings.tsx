import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/hooks/useSettings';
import { Bell, Mail, Smartphone, Volume2, Calendar, Save, Loader2 } from 'lucide-react';

export default function NotificationSettings() {
  const { getSetting, updateMultipleSettings, loading, saving } = useSettings('notifications');
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState('daily');

  useEffect(() => {
    if (!loading) {
      setEmailNotifications(getSetting('email_enabled', true));
      setPushNotifications(getSetting('push_enabled', true));
      setSoundEnabled(getSetting('sound_enabled', true));
      setBookingAlerts(getSetting('booking_alerts', true));
      setOrderAlerts(getSetting('order_alerts', true));
      setPaymentAlerts(getSetting('payment_alerts', true));
      setSystemAlerts(getSetting('system_alerts', true));
      setEmailFrequency(getSetting('email_frequency', 'daily'));
    }
  }, [loading, getSetting]);

  const handleSave = async () => {
    const settingsToUpdate = [
      { key: 'email_enabled', value: emailNotifications },
      { key: 'push_enabled', value: pushNotifications },
      { key: 'sound_enabled', value: soundEnabled },
      { key: 'booking_alerts', value: bookingAlerts },
      { key: 'order_alerts', value: orderAlerts },
      { key: 'payment_alerts', value: paymentAlerts },
      { key: 'system_alerts', value: systemAlerts },
      { key: 'email_frequency', value: emailFrequency },
    ];

    await updateMultipleSettings(settingsToUpdate);
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive in-app notifications
                </p>
              </div>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>Sound Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound for important notifications
                </p>
              </div>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Notifications
          </CardTitle>
          <CardDescription>
            Configure notifications for specific events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Booking Alerts</Label>
              <p className="text-sm text-muted-foreground">
                New bookings, check-ins, and cancellations
              </p>
            </div>
            <Switch
              checked={bookingAlerts}
              onCheckedChange={setBookingAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Order Alerts</Label>
              <p className="text-sm text-muted-foreground">
                New orders and status changes
              </p>
            </div>
            <Switch
              checked={orderAlerts}
              onCheckedChange={setOrderAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Payment Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Payment confirmations and failures
              </p>
            </div>
            <Switch
              checked={paymentAlerts}
              onCheckedChange={setPaymentAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>System Alerts</Label>
              <p className="text-sm text-muted-foreground">
                System maintenance and security alerts
              </p>
            </div>
            <Switch
              checked={systemAlerts}
              onCheckedChange={setSystemAlerts}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency</CardTitle>
          <CardDescription>
            Control how often you receive digest emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Digest Frequency</Label>
            <Select value={emailFrequency} onValueChange={setEmailFrequency}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4 border-t">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
          className="gap-2 px-8"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Notification Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
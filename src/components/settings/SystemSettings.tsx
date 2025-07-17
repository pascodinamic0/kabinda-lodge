import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { Building, Clock, Globe, DollarSign, Save, Loader2 } from 'lucide-react';

export default function SystemSettings() {
  const { getSetting, updateMultipleSettings, loading, saving } = useSettings('system');
  
  const [hotelInfo, setHotelInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
  });
  
  const [operatingHours, setOperatingHours] = useState({
    checkIn: '',
    checkOut: '',
    currency: '',
    timezone: '',
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const timezones = [
    'UTC', 'EST', 'PST', 'CET', 'GMT', 'JST', 'AEST', 'IST'
  ];

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' },
  ];

  useEffect(() => {
    if (!loading) {
      setHotelInfo({
        name: getSetting('hotel_name', 'Kabinda Lodge'),
        address: getSetting('hotel_address', '123 Main Street, City, Country'),
        phone: getSetting('hotel_phone', '+1 (555) 123-4567'),
        email: getSetting('hotel_email', 'info@kabidalodge.com'),
        description: getSetting('hotel_description', 'A luxury hotel experience in the heart of the city.'),
      });
      
      setOperatingHours({
        checkIn: getSetting('check_in_time', '15:00'),
        checkOut: getSetting('check_out_time', '11:00'),
        currency: getSetting('currency', 'USD'),
        timezone: getSetting('timezone', 'UTC'),
      });
      
      setMaintenanceMode(getSetting('maintenance_mode', false));
    }
  }, [loading, getSetting]);

  const handleSave = async () => {
    const settingsToUpdate = [
      { key: 'hotel_name', value: hotelInfo.name },
      { key: 'hotel_address', value: hotelInfo.address },
      { key: 'hotel_phone', value: hotelInfo.phone },
      { key: 'hotel_email', value: hotelInfo.email },
      { key: 'hotel_description', value: hotelInfo.description },
      { key: 'check_in_time', value: operatingHours.checkIn },
      { key: 'check_out_time', value: operatingHours.checkOut },
      { key: 'currency', value: operatingHours.currency },
      { key: 'timezone', value: operatingHours.timezone },
      { key: 'maintenance_mode', value: maintenanceMode },
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Hotel Information
          </CardTitle>
          <CardDescription>
            Configure basic hotel information and contact details displayed throughout the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hotel-name" className="text-sm font-medium">Hotel Name</Label>
              <Input
                id="hotel-name"
                value={hotelInfo.name}
                onChange={(e) => setHotelInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter hotel name"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-phone" className="text-sm font-medium">Phone</Label>
              <Input
                id="hotel-phone"
                value={hotelInfo.phone}
                onChange={(e) => setHotelInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-email" className="text-sm font-medium">Email</Label>
              <Input
                id="hotel-email"
                type="email"
                value={hotelInfo.email}
                onChange={(e) => setHotelInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotel-address" className="text-sm font-medium">Address</Label>
            <Input
              id="hotel-address"
              value={hotelInfo.address}
              onChange={(e) => setHotelInfo(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter hotel address"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotel-description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="hotel-description"
              value={hotelInfo.description}
              onChange={(e) => setHotelInfo(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your hotel..."
              rows={3}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Operating Configuration
          </CardTitle>
          <CardDescription>
            Set operating hours, timezone, and currency settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="check-in" className="text-sm font-medium">Check-in Time</Label>
              <Input
                id="check-in"
                type="time"
                value={operatingHours.checkIn}
                onChange={(e) => setOperatingHours(prev => ({ ...prev, checkIn: e.target.value }))}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="check-out" className="text-sm font-medium">Check-out Time</Label>
              <Input
                id="check-out"
                type="time"
                value={operatingHours.checkOut}
                onChange={(e) => setOperatingHours(prev => ({ ...prev, checkOut: e.target.value }))}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </Label>
              <Select 
                value={operatingHours.currency} 
                onValueChange={(value) => setOperatingHours(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Timezone
              </Label>
              <Select 
                value={operatingHours.timezone} 
                onValueChange={(value) => setOperatingHours(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-orange-200 dark:border-orange-800">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Building className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            System Controls
          </CardTitle>
          <CardDescription>
            Control system-wide settings and maintenance mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex-1">
              <Label className="font-medium text-amber-900 dark:text-amber-100">Maintenance Mode</Label>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Enable maintenance mode to restrict public access to the system
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
              className="ml-4"
            />
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
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
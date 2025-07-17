import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Building, Clock, FileText, Settings } from 'lucide-react';

export default function SystemSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hotelInfo, setHotelInfo] = useState({
    name: 'Kabinda Lodge',
    address: '123 Main Street, City, Country',
    phone: '+1 (555) 123-4567',
    email: 'info@kabidalodge.com',
    description: 'A luxury hotel experience in the heart of the city.',
  });
  
  const [operatingHours, setOperatingHours] = useState({
    checkIn: '15:00',
    checkOut: '11:00',
    restaurant: '06:00-23:00',
    reception: '24/7',
  });

  const [policies, setPolicies] = useState({
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    smokingPolicy: 'No smoking allowed in rooms.',
    petPolicy: 'Pets are not allowed.',
    childrenPolicy: 'Children are welcome.',
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSaveHotelInfo = async () => {
    setLoading(true);
    try {
      // Here you would save to your database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Hotel information updated",
        description: "The hotel information has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update hotel information.",
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
            <Building className="h-5 w-5" />
            Hotel Information
          </CardTitle>
          <CardDescription>
            Configure basic hotel information and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotel-name">Hotel Name</Label>
              <Input
                id="hotel-name"
                value={hotelInfo.name}
                onChange={(e) => setHotelInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-phone">Phone</Label>
              <Input
                id="hotel-phone"
                value={hotelInfo.phone}
                onChange={(e) => setHotelInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-email">Email</Label>
              <Input
                id="hotel-email"
                type="email"
                value={hotelInfo.email}
                onChange={(e) => setHotelInfo(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotel-address">Address</Label>
            <Input
              id="hotel-address"
              value={hotelInfo.address}
              onChange={(e) => setHotelInfo(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotel-description">Description</Label>
            <Textarea
              id="hotel-description"
              value={hotelInfo.description}
              onChange={(e) => setHotelInfo(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <Button onClick={handleSaveHotelInfo} disabled={loading}>
            {loading ? "Saving..." : "Save Hotel Information"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operating Hours
          </CardTitle>
          <CardDescription>
            Set the operating hours for different services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check-in">Check-in Time</Label>
              <Input
                id="check-in"
                type="time"
                value={operatingHours.checkIn}
                onChange={(e) => setOperatingHours(prev => ({ ...prev, checkIn: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="check-out">Check-out Time</Label>
              <Input
                id="check-out"
                type="time"
                value={operatingHours.checkOut}
                onChange={(e) => setOperatingHours(prev => ({ ...prev, checkOut: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant-hours">Restaurant Hours</Label>
              <Input
                id="restaurant-hours"
                value={operatingHours.restaurant}
                onChange={(e) => setOperatingHours(prev => ({ ...prev, restaurant: e.target.value }))}
                placeholder="e.g., 06:00-23:00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reception-hours">Reception Hours</Label>
              <Input
                id="reception-hours"
                value={operatingHours.reception}
                onChange={(e) => setOperatingHours(prev => ({ ...prev, reception: e.target.value }))}
                placeholder="e.g., 24/7"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hotel Policies
          </CardTitle>
          <CardDescription>
            Configure hotel policies and terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(policies).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Label>
              <Textarea
                id={key}
                value={value}
                onChange={(e) => setPolicies(prev => ({ ...prev, [key]: e.target.value }))}
                rows={2}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Controls
          </CardTitle>
          <CardDescription>
            System-wide settings and controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable maintenance mode to restrict access
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
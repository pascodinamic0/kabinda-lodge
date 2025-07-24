import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, ArrowLeft, Users, Clock, MapPin, Table, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Restaurant, RestaurantTable } from '@/types/restaurant';

const DiningReservation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: '',
    date: undefined as Date | undefined,
    time: '',
    restaurant: '',
    deliveryType: 'table',
    tableId: '',
    deliveryAddress: '',
    specialRequests: ''
  });

  const timeSlots = [
    '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
    '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'
  ];

  const deliveryFee = 5.00; // Fixed delivery fee for address delivery

  useEffect(() => {
    fetchRestaurants();
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (formData.restaurant) {
      fetchTables(parseInt(formData.restaurant));
    }
  }, [formData.restaurant]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurants. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchTables = async (restaurantId: number) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'available')
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
      
      const restaurant = restaurants.find(r => r.id === restaurantId);
      setSelectedRestaurant(restaurant);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Error",
        description: "Failed to load tables. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.guests || 
        !formData.date || !formData.time || !formData.restaurant) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.deliveryType === 'table' && !formData.tableId) {
      toast({
        title: "Error",
        description: "Please select a table",
        variant: "destructive",
      });
      return;
    }

    if (formData.deliveryType === 'address' && !formData.deliveryAddress) {
      toast({
        title: "Error",
        description: "Please provide delivery address",
        variant: "destructive",
      });
      return;
    }

    try {
      const reservationData = {
        user_id: user?.id || null,
        restaurant_id: parseInt(formData.restaurant),
        reservation_date: format(formData.date, 'yyyy-MM-dd'),
        reservation_time: formData.time,
        party_size: parseInt(formData.guests),
        delivery_type: formData.deliveryType,
        table_id: formData.deliveryType === 'table' ? parseInt(formData.tableId) : null,
        delivery_address: formData.deliveryType === 'address' ? formData.deliveryAddress : null,
        delivery_fee: formData.deliveryType === 'address' ? deliveryFee : 0,
        total_amount: formData.deliveryType === 'address' ? deliveryFee : 0,
        special_requests: formData.specialRequests,
        guest_name: formData.name,
        guest_email: formData.email,
        guest_phone: formData.phone
      };

      const { error } = await supabase
        .from('dining_reservations')
        .insert([reservationData]);

      if (error) throw error;

      toast({
        title: "Reservation Request Submitted!",
        description: "We'll contact you shortly to confirm your reservation.",
      });

      // Clear form
      setFormData({
        name: user?.user_metadata?.name || '',
        email: user?.email || '',
        phone: '',
        guests: '',
        date: undefined,
        time: '',
        restaurant: '',
        deliveryType: 'table',
        tableId: '',
        deliveryAddress: '',
        specialRequests: ''
      });

      // Navigate back to dining page
      navigate('/restaurant-dashboard');
    } catch (error) {
      console.error('Error submitting reservation:', error);
      toast({
        title: "Error",
        description: "Failed to submit reservation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/restaurant-dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Restaurant
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Reservation Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guests">Number of Guests *</Label>
                        <Select value={formData.guests} onValueChange={(value) => updateFormData('guests', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of guests" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'Guest' : 'Guests'}
                              </SelectItem>
                            ))}
                            <SelectItem value="10+">10+ Guests</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Restaurant & Time */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Restaurant & Time</h3>
                    
                    <div>
                      <Label htmlFor="restaurant">Restaurant *</Label>
                      <Select value={formData.restaurant} onValueChange={(value) => updateFormData('restaurant', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a restaurant" />
                        </SelectTrigger>
                        <SelectContent>
                          {restaurants.map(restaurant => (
                            <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                              {restaurant.name} - {restaurant.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Preferred Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.date ? format(formData.date, 'PPP') : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.date}
                              onSelect={(date) => updateFormData('date', date)}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <Label htmlFor="time">Preferred Time *</Label>
                        <Select value={formData.time} onValueChange={(value) => updateFormData('time', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map(time => (
                              <SelectItem key={time} value={time}>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{time}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Delivery Options</h3>
                    
                    <RadioGroup 
                      value={formData.deliveryType} 
                      onValueChange={(value) => updateFormData('deliveryType', value)}
                      className="space-y-4"
                    >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="table" id="table" />
                        <Label htmlFor="table" className="flex-1 cursor-pointer">
                          <div className="flex items-center space-x-2">
                            <Table className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Table Service</p>
                              <p className="text-sm text-muted-foreground">Select your table and dine at the restaurant</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="address" id="address" />
                        <Label htmlFor="address" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">Delivery Service</p>
                                <p className="text-sm text-muted-foreground">Delivery to your address</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 text-primary">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-semibold">{deliveryFee}</span>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Table Selection */}
                    {formData.deliveryType === 'table' && formData.restaurant && (
                      <div>
                        <Label htmlFor="table">Select Table *</Label>
                        <Select value={formData.tableId} onValueChange={(value) => updateFormData('tableId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose your table" />
                          </SelectTrigger>
                          <SelectContent>
                            {tables.map(table => (
                              <SelectItem key={table.id} value={table.id.toString()}>
                                Table {table.table_number} - {table.capacity} seats
                                {table.location_description && ` (${table.location_description})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Delivery Address */}
                    {formData.deliveryType === 'address' && (
                      <div>
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Textarea
                          id="address"
                          placeholder="Enter your full delivery address..."
                          value={formData.deliveryAddress}
                          onChange={(e) => updateFormData('deliveryAddress', e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  {/* Special Requests */}
                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any dietary restrictions, special occasions, or other requests..."
                      value={formData.specialRequests}
                      onChange={(e) => updateFormData('specialRequests', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-4">
                    <Button type="submit" className="flex-1">
                      Submit Reservation Request
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate('/restaurant-dashboard')}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Reservation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRestaurant && (
                  <div>
                    <h4 className="font-semibold">{selectedRestaurant.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedRestaurant.type}</p>
                    <p className="text-sm text-muted-foreground">{selectedRestaurant.location}</p>
                  </div>
                )}
                
                {formData.date && formData.time && (
                  <div>
                    <h4 className="font-semibold">Date & Time</h4>
                    <p className="text-sm">{format(formData.date, 'PPP')}</p>
                    <p className="text-sm">{formData.time}</p>
                  </div>
                )}
                
                {formData.guests && (
                  <div>
                    <h4 className="font-semibold">Party Size</h4>
                    <p className="text-sm">{formData.guests} {formData.guests === '1' ? 'Guest' : 'Guests'}</p>
                  </div>
                )}
                
                {formData.deliveryType === 'address' && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Delivery Fee</span>
                      <span className="font-semibold">${deliveryFee}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiningReservation;
import React, { useState } from 'react';
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
import { CalendarIcon, ArrowLeft, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

const DiningReservation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: '',
    date: undefined as Date | undefined,
    time: '',
    restaurant: '',
    specialRequests: ''
  });

  const restaurants = [
    { value: 'grand-terrace', label: 'The Grand Terrace - Fine Dining' },
    { value: 'sunrise-cafe', label: 'Sunrise Café - Casual Dining' },
    { value: 'lounge-bar', label: 'The Lounge Bar - Bar & Lounge' },
    { value: 'pool-deck', label: 'Pool Deck Grill - Outdoor Dining' }
  ];

  const timeSlots = [
    '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
    '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'
  ];

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

    try {
      // For now, we'll just show a success message
      // In a real implementation, you'd save this to a database
      toast({
        title: "Reservation Request Submitted!",
        description: "We'll contact you shortly to confirm your reservation.",
      });

      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        guests: '',
        date: undefined,
        time: '',
        restaurant: '',
        specialRequests: ''
      });

      // Navigate back to dining page
      navigate('/dining');
    } catch (error) {
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/dining')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dining
          </Button>
          <div>
            <h1 className="font-elegant text-3xl font-bold">Make a Reservation</h1>
            <p className="text-muted-foreground">Reserve your table at one of our restaurants</p>
          </div>
        </div>

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

              {/* Reservation Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Reservation Details</h3>
                
                <div>
                  <Label htmlFor="restaurant">Restaurant *</Label>
                  <Select value={formData.restaurant} onValueChange={(value) => updateFormData('restaurant', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map(restaurant => (
                        <SelectItem key={restaurant.value} value={restaurant.value}>
                          {restaurant.label}
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
                  onClick={() => navigate('/dining')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiningReservation;
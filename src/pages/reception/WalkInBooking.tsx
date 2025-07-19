import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Receipt, CreditCard, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  status: string;
}

interface BookingData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  roomId: number | null;
  notes: string;
  paymentMethod: string;
}

export default function WalkInBooking() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    startDate: new Date(),
    endDate: undefined,
    roomId: null,
    notes: '',
    paymentMethod: ''
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available')
        .order('type', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available rooms",
        variant: "destructive"
      });
    }
  };

  const calculateNights = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0;
    const diffTime = Math.abs(bookingData.endDate.getTime() - bookingData.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!selectedRoom) return 0;
    return selectedRoom.price * calculateNights();
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setBookingData(prev => ({ ...prev, roomId: room.id }));
  };

  const handleBookingSubmit = async () => {
    if (!selectedRoom || !bookingData.guestName || !bookingData.guestEmail || 
        !bookingData.startDate || !bookingData.endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user (receptionist)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          room_id: selectedRoom.id,
          user_id: user.id, // Receptionist's ID for tracking
          start_date: format(bookingData.startDate, 'yyyy-MM-dd'),
          end_date: format(bookingData.endDate, 'yyyy-MM-dd'),
          total_price: calculateTotal(),
          status: 'booked',
          notes: `Walk-in guest: ${bookingData.guestName}, Email: ${bookingData.guestEmail}, Phone: ${bookingData.guestPhone}. ${bookingData.notes}`
        })
        .select()
        .single();

      if (bookingError) throw bookingError;
      
      setBookingId(booking.id);
      setStep(2);
      
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!bookingData.paymentMethod || !bookingId) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          amount: calculateTotal(),
          method: bookingData.paymentMethod,
          status: bookingData.paymentMethod === 'cash' ? 'completed' : 'pending',
          transaction_ref: bookingData.paymentMethod === 'cash' ? `CASH-${Date.now()}` : null
        });

      if (error) throw error;

      setStep(3);
      
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const startNewBooking = () => {
    setStep(1);
    setSelectedRoom(null);
    setBookingId(null);
    setBookingData({
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      startDate: new Date(),
      endDate: undefined,
      roomId: null,
      notes: '',
      paymentMethod: ''
    });
    fetchAvailableRooms();
  };

  return (
    <DashboardLayout title="Walk-in Booking">
      <div className="max-w-4xl mx-auto space-y-6">
        {step === 1 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guestName">Guest Name *</Label>
                    <Input
                      id="guestName"
                      value={bookingData.guestName}
                      onChange={(e) => setBookingData(prev => ({ ...prev, guestName: e.target.value }))}
                      placeholder="Enter guest name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guestEmail">Email *</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={bookingData.guestEmail}
                      onChange={(e) => setBookingData(prev => ({ ...prev, guestEmail: e.target.value }))}
                      placeholder="guest@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guestPhone">Phone</Label>
                    <Input
                      id="guestPhone"
                      value={bookingData.guestPhone}
                      onChange={(e) => setBookingData(prev => ({ ...prev, guestPhone: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Check-in Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !bookingData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {bookingData.startDate ? format(bookingData.startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={bookingData.startDate}
                          onSelect={(date) => setBookingData(prev => ({ ...prev, startDate: date }))}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Check-out Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !bookingData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {bookingData.endDate ? format(bookingData.endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={bookingData.endDate}
                          onSelect={(date) => setBookingData(prev => ({ ...prev, endDate: date }))}
                          disabled={(date) => date <= (bookingData.startDate || new Date())}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special requests or notes"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <Card 
                      key={room.id} 
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted",
                        selectedRoom?.id === room.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handleRoomSelect(room)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{room.name}</h3>
                        <p className="text-sm text-muted-foreground">{room.type}</p>
                        <p className="text-lg font-bold">${room.price}/night</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedRoom && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Booking Summary</h3>
                    <div className="space-y-1 text-sm">
                      <p>Room: {selectedRoom.name} ({selectedRoom.type})</p>
                      <p>Nights: {calculateNights()}</p>
                      <p>Rate: ${selectedRoom.price}/night</p>
                      <p className="font-semibold">Total: ${calculateTotal()}</p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleBookingSubmit} 
                  disabled={!selectedRoom || loading}
                  className="w-full mt-4"
                >
                  {loading ? "Creating Booking..." : "Create Booking"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted",
                    bookingData.paymentMethod === 'cash' && "ring-2 ring-primary"
                  )}
                  onClick={() => setBookingData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                >
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <Banknote className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">Cash</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted",
                    bookingData.paymentMethod === 'card' && "ring-2 ring-primary"
                  )}
                  onClick={() => setBookingData(prev => ({ ...prev, paymentMethod: 'card' }))}
                >
                  <CardContent className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <CreditCard className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">Card</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Payment Summary</h3>
                <div className="space-y-1 text-sm">
                  <p>Guest: {bookingData.guestName}</p>
                  <p>Room: {selectedRoom?.name}</p>
                  <p>Total Amount: ${calculateTotal()}</p>
                </div>
              </div>

              <Button 
                onClick={handlePaymentSubmit} 
                disabled={!bookingData.paymentMethod || loading}
                className="w-full"
              >
                {loading ? "Processing Payment..." : "Process Payment"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Booking Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-muted rounded-lg print:bg-white print:shadow-none">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">Hotel Booking Receipt</h2>
                  <p className="text-muted-foreground">Booking ID: {bookingId}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2">Guest Information</h3>
                    <p>Name: {bookingData.guestName}</p>
                    <p>Email: {bookingData.guestEmail}</p>
                    {bookingData.guestPhone && <p>Phone: {bookingData.guestPhone}</p>}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Booking Details</h3>
                    <p>Room: {selectedRoom?.name}</p>
                    <p>Check-in: {bookingData.startDate ? format(bookingData.startDate, "PPP") : ''}</p>
                    <p>Check-out: {bookingData.endDate ? format(bookingData.endDate, "PPP") : ''}</p>
                    <p>Nights: {calculateNights()}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Paid:</span>
                    <span className="text-xl font-bold">${calculateTotal()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Payment Method: {bookingData.paymentMethod === 'cash' ? 'Cash' : 'Card'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={printReceipt} variant="outline" className="flex-1">
                  Print Receipt
                </Button>
                <Button onClick={startNewBooking} className="flex-1">
                  New Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
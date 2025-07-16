import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Users, MapPin, Phone, CreditCard, CheckCircle } from "lucide-react";

const BookRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: booking details, 2: payment instructions, 3: payment verification
  const [bookingId, setBookingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    guests: 1,
    notes: "",
    contactPhone: "",
    transactionRef: "",
    paymentMethod: ""
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchRoom();
  }, [user, roomId]);

  const fetchRoom = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', parseInt(roomId!))
        .single();

      if (error) throw error;
      setRoom(data);
    } catch (error) {
      console.error('Error fetching room:', error);
      toast({
        title: "Error",
        description: "Failed to load room details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    return nights * (room?.price || 0);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const totalPrice = calculateTotal();
      
      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: user?.id,
            room_id: parseInt(roomId!),
            start_date: formData.startDate,
            end_date: formData.endDate,
            total_price: totalPrice,
            notes: `Guests: ${formData.guests}, Phone: ${formData.contactPhone}, Notes: ${formData.notes}`,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (bookingError) throw bookingError;

      setBookingId(booking.id);
      setStep(2);
      
      toast({
        title: "Booking Created",
        description: "Please proceed with payment to confirm your booking",
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            booking_id: bookingId,
            amount: calculateTotal(),
            method: formData.paymentMethod,
            transaction_ref: formData.transactionRef,
            status: 'pending_verification'
          }
        ]);

      if (paymentError) throw paymentError;

      setStep(3);
      
      toast({
        title: "Payment Submitted",
        description: "Your payment is being verified. You'll receive confirmation shortly.",
      });
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Error",
        description: "Failed to submit payment information",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!room) {
    return <div className="text-center">Room not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Your Stay</h1>
          <div className="flex items-center gap-2">
            <Badge variant={step === 1 ? "default" : step > 1 ? "secondary" : "outline"}>
              1. Booking Details
            </Badge>
            <Badge variant={step === 2 ? "default" : step > 2 ? "secondary" : "outline"}>
              2. Payment
            </Badge>
            <Badge variant={step === 3 ? "default" : "outline"}>
              3. Confirmation
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Room Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Room Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-xl">{room.name}</h3>
                  <p className="text-muted-foreground">{room.type}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{room.description}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="font-semibold">Price per night:</span>
                  <span className="text-xl font-bold">${room.price}</span>
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Nights:</span>
                      <span>{calculateNights()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>${calculateTotal()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Check-in Date</Label>
                        <Input
                          type="date"
                          id="startDate"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">Check-out Date</Label>
                        <Input
                          type="date"
                          id="endDate"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          required
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="guests" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Number of Guests
                      </Label>
                      <Input
                        type="number"
                        id="guests"
                        min={1}
                        max={6}
                        value={formData.guests}
                        onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactPhone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Phone Number
                      </Label>
                      <Input
                        type="tel"
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+243 xxx xxx xxx"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Special Requests (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any special requests or notes..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Creating Booking..." : "Continue to Payment"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Total Amount to Pay: ${calculateTotal()}</h3>
                    <p className="text-blue-800 text-sm">Please use one of the mobile money services below to complete your payment.</p>
                  </div>

                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-red-600 mb-2">Vodacom M-Pesa</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 99X XXX XXX</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-orange-600 mb-2">Orange Money</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 81X XXX XXX</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-red-500 mb-2">Airtel Money</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 97X XXX XXX</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-6 border-t">
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method Used</Label>
                      <select
                        id="paymentMethod"
                        className="w-full p-2 border rounded-lg"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        required
                      >
                        <option value="">Select payment method</option>
                        <option value="vodacom_mpesa">Vodacom M-Pesa</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="airtel_money">Airtel Money</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="transactionRef">Transaction Reference Number</Label>
                      <Input
                        type="text"
                        id="transactionRef"
                        value={formData.transactionRef}
                        onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                        placeholder="Enter the transaction ID/reference from your mobile money"
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        This is the confirmation code you received after sending the money
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Payment Information"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Booking Submitted Successfully!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">What happens next?</h3>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Our team will verify your payment within 2-4 hours</li>
                      <li>• You'll receive a confirmation email once verified</li>
                      <li>• Your booking reference is: <span className="font-mono font-semibold">HOTEL-{bookingId}</span></li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Important:</strong> Please keep your transaction reference number safe. 
                      You may need it if there are any issues with payment verification.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      If you don't receive confirmation within 4 hours, please contact us with your booking reference.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => navigate('/rooms')} variant="outline">
                      Browse More Rooms
                    </Button>
                    <Button onClick={() => navigate('/')}>
                      Return Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRoom;
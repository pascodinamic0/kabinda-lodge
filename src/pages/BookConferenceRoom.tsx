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
import { Calendar, Users, MapPin, Phone, CreditCard, CheckCircle, Clock } from "lucide-react";
import { ReceiptGenerator } from "@/components/ReceiptGenerator";


const BookConferenceRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [room, setRoom] = useState<{ id: number; name: string; hourly_rate: number; capacity: number; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: booking details, 2: payment instructions, 3: payment verification
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    attendees: 1,
    notes: "",
    contactPhone: "",
    transactionRef: "",
    paymentMethod: "",
    guestName: "",
    guestEmail: ""
  });



  useEffect(() => {
    if (!user) {
      navigate('/kabinda-lodge/client-auth');
      return;
    }
    fetchRoom();
  }, [user, id]);

  const fetchRoom = async () => {
    try {
      const { data, error } = await supabase
        .from('conference_rooms')
        .select('*')
        .eq('id', parseInt(id!))
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Conference room not found');
      setRoom(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load conference room details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
    return Math.max(1, diffDays); // Minimum 1 day
  };

  const calculateTotal = () => {
    const days = calculateDays();
    return days * (room?.hourly_rate || 0); // hourly_rate now represents daily rate
  };



  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const totalPrice = calculateTotal();
      const startDateTime = new Date(`${formData.startDate}T00:00:00`);
      const endDateTime = new Date(`${formData.endDate}T23:59:59`);
      
      // Create conference booking
      const { data: booking, error: bookingError } = await supabase
        .from('conference_bookings')
        .insert([
          {
            user_id: user?.id,
            conference_room_id: parseInt(id!),
            start_datetime: startDateTime.toISOString(),
            end_datetime: endDateTime.toISOString(),
            total_price: totalPrice,
            attendees: formData.attendees,
            notes: `Guest: ${formData.guestName}, Email: ${formData.guestEmail}, Attendees: ${formData.attendees}, Phone: ${formData.contactPhone}, Notes: ${formData.notes}`,
            status: 'booked'
          }
        ])
        .select()
        .single();

      if (bookingError) throw bookingError;



      setBookingId(booking.id);
      setStep(2);
      
      toast({
        title: "Booking Created",
        description: "Please proceed with payment to confirm your conference room booking",
      });
    } catch (error) {
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
      // For cash payments by receptionists, mark as verified immediately
      const paymentStatus = (formData.paymentMethod === 'cash' && userRole === 'Receptionist') 
        ? 'verified' 
        : 'pending_verification';

      // Persist method to satisfy DB check constraint; map cash to an allowed label
      const persistedMethod = formData.paymentMethod === 'cash' ? 'Equity BCDC' : formData.paymentMethod;

      // Create payment record (reusing existing payments table)
      if (!bookingId) throw new Error('Missing booking reference for payment.');
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            conference_booking_id: bookingId,
            amount: calculateTotal(),
            method: persistedMethod,
            transaction_ref: formData.paymentMethod === 'cash' 
              ? `CASH-CONF-${Date.now()}` 
              : formData.transactionRef,
            status: paymentStatus
          }
        ]);

      if (paymentError) throw paymentError;

      // For cash payments, also update the booking status to confirmed immediately
      if (formData.paymentMethod === 'cash' && userRole === 'Receptionist') {
        const { error: bookingUpdateError } = await supabase
          .from('conference_bookings')
          .update({ status: 'booked' })
          .eq('id', bookingId);
        
        if (bookingUpdateError) throw bookingUpdateError;
      }

      setStep(3);
      
      toast({
        title: formData.paymentMethod === 'cash' && userRole === 'Receptionist' 
          ? "Cash Payment Confirmed" 
          : "Payment Submitted",
        description: formData.paymentMethod === 'cash' && userRole === 'Receptionist'
          ? "Cash payment has been processed successfully."
          : "Your payment is being verified. You'll receive confirmation shortly.",
      });

      // Show receipt for completed payments (cash) or for receptionists
      if (formData.paymentMethod === 'cash' && userRole === 'Receptionist') {
        setShowReceipt(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit payment information';
      console.error('Conference payment error:', error);
      toast({
        title: "Payment Error",
        description: message,
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
    return <div className="text-center">Conference room not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Conference Room</h1>
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
                <CardTitle className="text-lg">Conference Room Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-xl">{room.name}</h3>
                  <p className="text-muted-foreground">Capacity: {room.capacity} people</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{room.description}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="font-semibold">Price per day:</span>
                  <span className="text-xl font-bold">${room.hourly_rate}</span>
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Days:</span>
                      <span>{calculateDays()}</span>
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
                        <Label htmlFor="startDate">Start Date</Label>
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
                        <Label htmlFor="endDate">End Date</Label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guestName">Guest Name</Label>
                        <Input
                          type="text"
                          id="guestName"
                          value={formData.guestName}
                          onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                          placeholder="Full name of the guest"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="guestEmail">Guest Email</Label>
                        <Input
                          type="email"
                          id="guestEmail"
                          value={formData.guestEmail}
                          onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                          placeholder="guest@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="attendees" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Number of Attendees
                      </Label>
                      <Input
                        type="number"
                        id="attendees"
                        min={1}
                        max={room.capacity}
                        value={formData.attendees}
                        onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) })}
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
                      <Label htmlFor="notes">Meeting Purpose / Special Requests (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Brief description of your meeting or any special requirements..."
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
                      <p className="font-mono font-semibold">+243 998 765 432</p>
                      <p className="text-sm text-muted-foreground">Reference: CONF-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-orange-600 mb-2">Orange Money</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 816 543 210</p>
                      <p className="text-sm text-muted-foreground">Reference: CONF-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-red-500 mb-2">Airtel Money</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 970 123 456</p>
                      <p className="text-sm text-muted-foreground">Reference: CONF-{bookingId}</p>
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
                        <option value="Vodacom M-Pesa DRC">Vodacom M-Pesa DRC</option>
                        <option value="Airtel Money DRC">Airtel Money DRC</option>
                        <option value="Equity BCDC">Equity BCDC</option>
                        <option value="Pepele Mobile">Pepele Mobile</option>
                        {userRole === 'Receptionist' && (
                          <option value="cash">Cash Payment</option>
                        )}
                      </select>
                    </div>

                    {formData.paymentMethod !== 'cash' && (
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
                    )}

                    {formData.paymentMethod === 'cash' && userRole === 'Receptionist' && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-800 text-sm">
                          ✅ You are processing a cash payment as reception staff. 
                          This payment will be marked as verified immediately upon submission.
                        </p>
                      </div>
                    )}

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
                    Conference Room Booking Submitted!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">What happens next?</h3>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Our team will verify your payment within 2-4 hours</li>
                      <li>• You'll receive a confirmation email once verified</li>
                      <li>• Your booking reference is: <span className="font-mono font-semibold">CONF-{bookingId}</span></li>
                      <li>• Conference room will be prepared before your meeting time</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Important:</strong> Please arrive 15 minutes before your scheduled time for setup. 
                    </p>
                    <p className="text-sm text-muted-foreground">
                      If you need to cancel or modify your booking, please contact us at least 2 hours in advance.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => navigate('/kabinda-lodge/conference')} variant="outline">
                      Book Another Conference Room
                    </Button>
                    <Button onClick={() => navigate('/kabinda-lodge')}>
                      Return Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && room && bookingId && (
        <ReceiptGenerator
          receiptData={{
            bookingId,
            guestName: formData.guestName,
            guestEmail: formData.guestEmail,
            guestPhone: formData.contactPhone,
            roomName: room.name,
            roomType: "Conference Room",
            checkIn: formData.startDate,
            checkOut: formData.endDate,
            nights: calculateDays(),
            roomPrice: room.hourly_rate, // treated as per-day rate
            totalAmount: calculateTotal(),
            paymentMethod: formData.paymentMethod,
            transactionRef: formData.transactionRef,
            createdAt: new Date().toISOString()
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};

export default BookConferenceRoom;
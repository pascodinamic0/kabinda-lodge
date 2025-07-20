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
import { ReceiptGenerator } from "@/components/ReceiptGenerator";
import { Calendar, Users, MapPin, Phone, CreditCard, CheckCircle } from "lucide-react";

const BookRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: booking details, 2: payment instructions, 3: payment verification
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [activePromotion, setActivePromotion] = useState<any>(null);
  const [dateConflict, setDateConflict] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    guests: 1,
    notes: "",
    contactPhone: "",
    transactionRef: "",
    paymentMethod: "",
    guestName: "",
    guestEmail: ""
  });

  useEffect(() => {
    if (!user) {
      navigate('/client-auth');
      return;
    }
    fetchRoom();
    fetchActivePromotion();
  }, [user, roomId]);

  const fetchRoom = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', parseInt(roomId!))
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Room not found');
      setRoom(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load room details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePromotion = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .lte('start_date', new Date().toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActivePromotion(data);
    } catch (error) {
      // No active promotion found
    }
  };

  const checkDateConflict = async (startDate: string, endDate: string) => {
    if (!startDate || !endDate || !roomId) return;

    try {
      const { data: conflicts, error } = await supabase
        .from('bookings')
        .select('start_date, end_date, notes')
        .eq('room_id', parseInt(roomId))
        .eq('status', 'booked')
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (error) throw error;

      if (conflicts && conflicts.length > 0) {
        const conflictInfo = conflicts.map(c => 
          `${c.start_date} to ${c.end_date}`
        ).join(', ');
        setDateConflict(`This room is already booked for: ${conflictInfo}`);
        return true;
      } else {
        setDateConflict(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking date conflicts:', error);
      return false;
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
    
    // Check for conflicts before submitting
    if (dateConflict) {
      toast({
        title: "Cannot Create Booking",
        description: "Please select different dates to avoid conflicts.",
        variant: "destructive",
      });
      return;
    }

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
            notes: `Guest: ${formData.guestName}, Email: ${formData.guestEmail}, Guests: ${formData.guests}, Phone: ${formData.contactPhone}, Notes: ${formData.notes}`,
            status: 'booked'
          }
        ])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Manually trigger room status update to ensure immediate effect
      await supabase.rpc('check_expired_bookings');

      setBookingId(booking.id);
      setStep(2);
      
      toast({
        title: "Booking Created",
        description: "Please proceed with payment to confirm your booking",
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

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            booking_id: bookingId,
            amount: calculateTotal(),
            method: formData.paymentMethod,
            transaction_ref: formData.paymentMethod === 'cash' 
              ? `CASH-${Date.now()}` 
              : formData.transactionRef,
            status: paymentStatus
          }
        ]);

      if (paymentError) throw paymentError;

      // For cash payments, also update the booking status to confirmed immediately
      if (formData.paymentMethod === 'cash' && userRole === 'Receptionist') {
        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
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
                           onChange={async (e) => {
                             const newStartDate = e.target.value;
                             setFormData({ ...formData, startDate: newStartDate });
                             if (newStartDate && formData.endDate) {
                               await checkDateConflict(newStartDate, formData.endDate);
                             }
                           }}
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
                           onChange={async (e) => {
                             const newEndDate = e.target.value;
                             setFormData({ ...formData, endDate: newEndDate });
                             if (formData.startDate && newEndDate) {
                               await checkDateConflict(formData.startDate, newEndDate);
                             }
                           }}
                           required
                           min={formData.startDate || new Date().toISOString().split('T')[0]}
                         />
                       </div>
                     </div>

                     {/* Date Conflict Warning */}
                     {dateConflict && (
                       <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                         <p className="text-red-800 font-medium">⚠️ Booking Conflict</p>
                         <p className="text-sm text-red-700 mt-1">{dateConflict}</p>
                       </div>
                     )}

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
                      <p className="font-mono font-semibold">+243 998 765 432</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-orange-600 mb-2">Orange Money</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 816 543 210</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-red-500 mb-2">Airtel Money</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 970 123 456</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-blue-600 mb-2">Equity BCDC</h4>
                      <p className="text-sm text-muted-foreground mb-2">Bank transfer to:</p>
                      <p className="font-mono font-semibold">Account: XXXX-XXXX-XXXX</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-green-600 mb-2">Pepele Mobile</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 821 987 654</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>
                   </div>

                   {/* Cash Payment Option - Only for Receptionists */}
                   {userRole === 'Receptionist' && (
                     <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                       <h4 className="font-semibold text-green-600 mb-2">💵 Cash Payment</h4>
                       <p className="text-sm text-green-700 mb-2">Accept cash payment directly from guest</p>
                       <p className="text-sm text-muted-foreground">Available only for reception staff</p>
                     </div>
                   )}

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
                         <option value="Vodacom M-Pesa DRC">Vodacom M-Pesa</option>
                         <option value="Airtel Money DRC">Airtel Money</option>
                         <option value="Equity BCDC">Equity BCDC Bank</option>
                         <option value="Pepele Mobile">Pepele Mobile</option>
                         {userRole === 'Receptionist' && (
                           <option value="cash">💵 Cash Payment</option>
                         )}
                      </select>
                    </div>

                    {/* Only show transaction ref field for non-cash payments */}
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

                    {/* Cash payment confirmation for receptionists */}
                    {formData.paymentMethod === 'cash' && userRole === 'Receptionist' && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-800 font-medium">
                          💵 Cash Payment Selected
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          This payment will be marked as completed immediately upon submission.
                        </p>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Processing..." : 
                       formData.paymentMethod === 'cash' && userRole === 'Receptionist' 
                         ? "Complete Cash Payment" 
                         : "Submit Payment Information"}
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
                     <h3 className="font-semibold text-green-900 mb-2">
                       {formData.paymentMethod === 'cash' && userRole === 'Receptionist' 
                         ? "Cash Payment Completed!" 
                         : "What happens next?"}
                     </h3>
                     {formData.paymentMethod === 'cash' && userRole === 'Receptionist' ? (
                       <ul className="text-green-800 text-sm space-y-1">
                         <li>• Cash payment has been processed and confirmed</li>
                         <li>• Your booking is now active and confirmed</li>
                         <li>• Guest can proceed to their room</li>
                         <li>• Your booking reference is: <span className="font-mono font-semibold">HOTEL-{bookingId}</span></li>
                       </ul>
                     ) : (
                       <ul className="text-green-800 text-sm space-y-1">
                         <li>• Our team will verify your payment within 2-4 hours</li>
                         <li>• You'll receive a confirmation email once verified</li>
                         <li>• Your booking reference is: <span className="font-mono font-semibold">HOTEL-{bookingId}</span></li>
                       </ul>
                     )}
                  </div>

                   <div className="space-y-2">
                     {formData.paymentMethod === 'cash' && userRole === 'Receptionist' ? (
                       <p className="text-sm text-muted-foreground">
                         <strong>Cash Payment Confirmed:</strong> The booking is now active and ready for guest check-in.
                       </p>
                     ) : (
                       <>
                         <p className="text-sm text-muted-foreground">
                           <strong>Important:</strong> Please keep your transaction reference number safe. 
                           You may need it if there are any issues with payment verification.
                         </p>
                         <p className="text-sm text-muted-foreground">
                           If you don't receive confirmation within 4 hours, please contact us with your booking reference.
                         </p>
                       </>
                     )}
                  </div>

                    <div className="flex gap-3 pt-4">
                      {formData.paymentMethod === 'cash' && userRole === 'Receptionist' && (
                        <Button onClick={() => setShowReceipt(true)} className="flex-1">
                          Generate Receipt
                        </Button>
                      )}
                      {(userRole === 'Receptionist' || userRole === 'Admin') && (
                        <Button onClick={() => navigate('/book-room')} className="flex-1">
                          New Booking
                        </Button>
                      )}
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

       {/* Receipt Modal */}
       {showReceipt && room && bookingId && (
         <ReceiptGenerator
            receiptData={{
              bookingId,
              guestName: formData.guestName,
              guestEmail: formData.guestEmail,
              guestPhone: formData.contactPhone,
             roomName: room.name,
             roomType: room.type,
             checkIn: formData.startDate,
             checkOut: formData.endDate,
             nights: calculateNights(),
             roomPrice: room.price,
             totalAmount: calculateTotal(),
             paymentMethod: formData.paymentMethod,
             transactionRef: formData.transactionRef,
             promotion: activePromotion,
             createdAt: new Date().toISOString()
           }}
           onClose={() => setShowReceipt(false)}
         />
       )}
    </div>
  );
};

export default BookRoom;
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { Calendar, Users, MapPin, Phone, CreditCard, CheckCircle, Clock, Landmark } from "lucide-react";
import { ReceiptGenerator } from "@/components/ReceiptGenerator";


const BookConferenceRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const { paymentMethods, loading: paymentMethodsLoading } = usePaymentMethods();
  const { bankAccounts, loading: bankAccountsLoading } = useBankAccounts();
  const [room, setRoom] = useState<{ id: number; name: string; daily_rate: number; capacity: number; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: booking details, 2: payment instructions, 3: payment verification
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [formData, setFormData] = useState({
    startDate: "",
    startTime: "",
    attendees: 1,
    notes: "",
    contactPhone: "",
    transactionRef: "",
    paymentMethod: "",
    guestName: "",
    guestEmail: "",
    guestCompany: "",
    eventType: "",
    eventDurationHours: "",
    buffetRequired: false,
    buffetPackage: "",
    specialRequirements: "",
    eventTheme: ""
  });
  const [availabilityConflict, setAvailabilityConflict] = useState<string | null>(null);



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



  const calculateHours = () => {
    if (!formData.eventDurationHours) return 0;
    const hours = parseFloat(formData.eventDurationHours);
    return Math.max(0.5, hours); // Minimum 0.5 hours
  };

  const calculateTotal = () => {
    // Fixed rate regardless of duration
    return room?.daily_rate || 0;
  };

  const checkConferenceAvailability = async () => {
    if (!formData.startDate || !formData.startTime || !formData.eventDurationHours || !id) {
      setAvailabilityConflict(null);
      return;
    }

    try {
      const hours = calculateHours();
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (hours * 60 * 60 * 1000));

      // Fetch existing bookings for this conference room that overlap with the proposed time
      const { data: existingBookings, error } = await supabase
        .from('conference_bookings')
        .select('start_datetime, end_datetime, status')
        .eq('conference_room_id', parseInt(id))
        .in('status', ['booked', 'confirmed', 'pending_verification']);

      if (error) throw error;

      // Check for time overlap conflicts
      const conflicts = (existingBookings || []).filter(booking => {
        const existingStart = new Date(booking.start_datetime);
        const existingEnd = new Date(booking.end_datetime);
        
        // Check if time ranges overlap
        // Conflict exists if: startDateTime < existingEnd AND endDateTime > existingStart
        return startDateTime < existingEnd && endDateTime > existingStart;
      });

      if (conflicts.length > 0) {
        const conflictInfo = conflicts.map(c => {
          const start = new Date(c.start_datetime).toLocaleString();
          const end = new Date(c.end_datetime).toLocaleString();
          return `${start} to ${end}`;
        }).join(', ');
        setAvailabilityConflict(`This conference room is already booked: ${conflictInfo}`);
      } else {
        setAvailabilityConflict(null);
      }
    } catch (error) {
      console.error('Error checking conference availability:', error);
      setAvailabilityConflict(null);
    }
  };



  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.startDate || !formData.startTime || !formData.eventDurationHours) {
        toast({
          title: "Error",
          description: "Please fill in start date, start time, and event duration",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const totalPrice = calculateTotal();
      const hours = calculateHours();
      
      // Check availability before creating booking
      if (availabilityConflict) {
        toast({
          title: "Availability Conflict",
          description: availabilityConflict,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Prepare notes with event theme
      let notesWithTheme = formData.notes || '';
      if (formData.eventTheme) {
        notesWithTheme = `Event Theme: ${formData.eventTheme}\n${notesWithTheme}`;
      }

      // Create conference booking with proper field separation
      // Event organizer information goes in guest_name, guest_email, guest_phone
      // Actual notes go in notes field
      const { data: booking, error: bookingError} = await supabase
        .from('conference_bookings')
        .insert([
          {
            user_id: user?.id,
            conference_room_id: parseInt(id!),
            start_datetime: new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString(),
            end_datetime: new Date(new Date(`${formData.startDate}T${formData.startTime}:00`).getTime() + (hours * 60 * 60 * 1000)).toISOString(),
            total_price: totalPrice,
            attendees: 1, // Default to 1 as requested
            event_type: formData.eventType || null,
            event_duration_hours: hours,
            buffet_required: formData.buffetRequired,
            buffet_package: formData.buffetRequired ? formData.buffetPackage : null,
            guest_company: formData.guestCompany || null,
            special_requirements: formData.specialRequirements || null,
            // Use proper database fields for organizer information
            guest_name: formData.guestName || null,
            guest_email: formData.guestEmail || null,
            guest_phone: formData.contactPhone || null,
            // Notes field should only contain actual notes, not all booking information
            notes: notesWithTheme || null,
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

      // Use the actual payment method from our database
      const persistedMethod = formData.paymentMethod;

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

      // Update booking status based on payment method
      // For cash/receptionist: 'booked' (confirmed)
      // For others: 'pending_verification'
      const newStatus = (formData.paymentMethod === 'cash' && userRole === 'Receptionist')
        ? 'booked'
        : 'pending_verification';

      const { error: bookingUpdateError } = await supabase
        .from('conference_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      
      if (bookingUpdateError) throw bookingUpdateError;

      // For cash payments, we already updated status above.
      // Keeping this check for receipt generation logic below.
      if (formData.paymentMethod === 'cash' && userRole === 'Receptionist') {
        // Status update handled above
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
                  <span className="font-semibold">Daily Rate:</span>
                  <span className="text-xl font-bold">${room.daily_rate}</span>
                </div>

                {formData.startDate && formData.startTime && formData.eventDurationHours && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Event Duration:</span>
                      <span>{calculateHours()} {calculateHours() === 1 ? 'hour' : 'hours'}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Pricing:</span>
                      <span>Fixed Event Rate</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
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
                        <Label htmlFor="startDate">Event Date</Label>
                        <Input
                          type="date"
                          id="startDate"
                          value={formData.startDate}
                          onChange={(e) => {
                            setFormData({ ...formData, startDate: e.target.value });
                            // Check availability when date changes
                            if (e.target.value && formData.startTime && formData.eventDurationHours) {
                              checkConferenceAvailability();
                            }
                          }}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor="startTime">Event Start Time</Label>
                        <Input
                          type="time"
                          id="startTime"
                          value={formData.startTime}
                          onChange={(e) => {
                            setFormData({ ...formData, startTime: e.target.value });
                            // Check availability when time changes
                            if (formData.startDate && e.target.value && formData.eventDurationHours) {
                              checkConferenceAvailability();
                            }
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guestName">Event Organizer Name</Label>
                        <Input
                          type="text"
                          id="guestName"
                          value={formData.guestName}
                          onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                          placeholder="Full name of the event organizer"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="guestEmail">Event Organizer Email</Label>
                        <Input
                          type="email"
                          id="guestEmail"
                          value={formData.guestEmail}
                          onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                          placeholder="organizer@example.com (optional)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guestCompany">Company/Organization</Label>
                        <Input
                          type="text"
                          id="guestCompany"
                          value={formData.guestCompany}
                          onChange={(e) => setFormData({ ...formData, guestCompany: e.target.value })}
                          placeholder="Company or organization name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="eventTheme" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Event Theme
                        </Label>
                        <Input
                          type="text"
                          id="eventTheme"
                          value={formData.eventTheme}
                          onChange={(e) => setFormData({ ...formData, eventTheme: e.target.value })}
                          placeholder="e.g. Annual Planning Meeting"
                          required
                        />
                      </div>
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

                    {/* NEW EVENT-SPECIFIC FIELDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="eventType">Event Type</Label>
                        <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value })}>
                          <SelectTrigger id="eventType">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Wedding">Wedding</SelectItem>
                            <SelectItem value="Corporate Meeting">Corporate Meeting</SelectItem>
                            <SelectItem value="Workshop">Workshop</SelectItem>
                            <SelectItem value="Seminar">Seminar</SelectItem>
                            <SelectItem value="Training Session">Training Session</SelectItem>
                            <SelectItem value="Conference">Conference</SelectItem>
                            <SelectItem value="Product Launch">Product Launch</SelectItem>
                            <SelectItem value="Team Building">Team Building</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="eventDurationHours">Event Duration (Hours) *</Label>
                        <Input
                          type="number"
                          id="eventDurationHours"
                          step="0.5"
                          min="0.5"
                          value={formData.eventDurationHours}
                          onChange={(e) => {
                            setFormData({ ...formData, eventDurationHours: e.target.value });
                            // Check availability when duration changes
                            if (formData.startDate && formData.startTime && e.target.value) {
                              checkConferenceAvailability();
                            }
                          }}
                          placeholder="e.g., 3.5 hours"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum 0.5 hours
                        </p>
                        {availabilityConflict && (
                          <p className="text-xs text-red-600 mt-2 font-medium">
                            ⚠️ {availabilityConflict}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* BUFFET OPTIONS */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="buffetRequired" 
                          checked={formData.buffetRequired}
                          onCheckedChange={(checked) => setFormData({ ...formData, buffetRequired: checked as boolean, buffetPackage: checked ? formData.buffetPackage : '' })}
                        />
                        <Label htmlFor="buffetRequired" className="font-semibold">
                          Buffet Service Required
                        </Label>
                      </div>

                      {formData.buffetRequired && (
                        <div>
                          <Label htmlFor="buffetPackage">Select Buffet Package</Label>
                          <Select value={formData.buffetPackage} onValueChange={(value) => setFormData({ ...formData, buffetPackage: value })}>
                            <SelectTrigger id="buffetPackage">
                              <SelectValue placeholder="Choose a buffet menu" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard Continental">Standard Continental - Coffee, Tea, Pastries</SelectItem>
                              <SelectItem value="Business Lunch">Business Lunch - Salads, Main Course, Dessert</SelectItem>
                              <SelectItem value="Premium Package">Premium Package - Full Breakfast/Lunch with Drinks</SelectItem>
                              <SelectItem value="Cocktail Reception">Cocktail Reception - Appetizers, Drinks, Dessert</SelectItem>
                              <SelectItem value="Custom Menu">Custom Menu - To Be Discussed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="specialRequirements">Special Requirements (Optional)</Label>
                      <Textarea
                        id="specialRequirements"
                        value={formData.specialRequirements}
                        onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                        placeholder="e.g., Projector, Whiteboard, Specific seating arrangement, Dietary restrictions, Decorations"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Brief description of your meeting or any special requirements..."
                        rows={3}
                      />
                    </div>



                    <Button type="submit" className="w-full" disabled={submitting || !!availabilityConflict}>
                      {submitting ? "Creating Booking..." : availabilityConflict ? "Time Slot Unavailable" : "Continue to Payment"}
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
                    <p className="text-blue-800 text-sm">
                      {paymentMethods.length > 0 
                        ? 'Please use one of the available payment methods below to complete your payment.'
                        : 'Please contact reception for payment instructions.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Bank Accounts Section */}
                    {bankAccountsLoading ? (
                      <div className="p-4 border rounded-lg bg-gray-50 text-center text-muted-foreground">
                        Loading bank details...
                      </div>
                    ) : bankAccounts.length > 0 ? (
                      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-4 border-b bg-muted/30">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Landmark className="h-4 w-4" />
                            Bank Account Details
                          </h3>
                        </div>
                        <div className="p-4 grid gap-4 sm:grid-cols-2">
                          {bankAccounts.map((account) => (
                            <div key={account.id} className="p-3 rounded-lg border bg-background text-sm space-y-1.5">
                              <p className="font-medium text-primary">{account.bank_name}</p>
                              <div className="space-y-0.5 text-muted-foreground">
                                <p><span className="font-medium text-foreground">Account Name:</span> {account.account_name}</p>
                                <p><span className="font-medium text-foreground">Account Number:</span> {account.account_number}</p>
                                {account.branch && <p><span className="font-medium text-foreground">Branch:</span> {account.branch}</p>}
                                {account.swift_code && <p><span className="font-medium text-foreground">SWIFT:</span> {account.swift_code}</p>}
                                {account.routing_number && <p><span className="font-medium text-foreground">Routing:</span> {account.routing_number}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Payment Methods Section */}
                    {paymentMethodsLoading ? (
                      <div className="p-4 border rounded-lg bg-gray-50 text-center text-muted-foreground">
                        Loading payment methods...
                      </div>
                    ) : paymentMethods.length > 0 ? (
                      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-4 border-b bg-muted/30">
                          <h3 className="font-semibold flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Accepted Payment Methods
                          </h3>
                        </div>
                        <div className="p-4 grid gap-3">
                          {paymentMethods.map((method) => (
                            <div key={method.id} className="flex items-start gap-3 p-3 rounded-lg border bg-background">
                              <div className="flex-1">
                                <p className="font-medium">{method.name}</p>
                                {method.description && (
                                  <p className="text-sm text-muted-foreground mt-0.5">{method.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                      <p className="text-blue-900 font-medium mb-2">Instructions</p>
                      <p className="text-sm text-blue-800">
                        Please make your payment using one of the methods above, then fill out the form below to confirm your transaction.
                      </p>
                      <p className="text-sm text-blue-700 mt-2">
                        Your booking reference: <span className="font-mono font-semibold">CONF-{bookingId}</span>
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-6 border-t">
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method Used</Label>
                      {paymentMethodsLoading ? (
                        <div className="w-full p-2 border rounded-lg text-muted-foreground">
                          Loading payment methods...
                        </div>
                      ) : (
                        <select
                          id="paymentMethod"
                          className="w-full p-2 border rounded-lg"
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          required
                        >
                          <option value="">Select payment method</option>
                          {paymentMethods.map((method) => (
                            <option key={method.id} value={method.code}>
                              {method.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {formData.paymentMethod && formData.paymentMethod !== 'cash' && (
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
            guestCompany: formData.guestCompany || undefined,
            roomName: room.name,
            roomType: "Conference Room",
            checkIn: formData.startDate,
            checkOut: formData.startDate, // Same day for hour-based bookings
            days: 1, // Always 1 day for hour-based bookings
            roomPrice: room.daily_rate,
            totalAmount: calculateTotal(),
            paymentMethod: formData.paymentMethod,
            transactionRef: formData.transactionRef,
            bookingType: 'conference', // Mark as conference booking
            // Conference-specific fields
            eventType: formData.eventType || undefined,
            eventDurationHours: formData.eventDurationHours ? parseFloat(formData.eventDurationHours) : undefined,
            attendees: formData.attendees,
            buffetRequired: formData.buffetRequired,
            buffetPackage: formData.buffetPackage || undefined,
            specialRequirements: formData.specialRequirements || undefined,
            eventTheme: formData.eventTheme || undefined,
            eventStartTime: formData.startTime || undefined,
            createdAt: new Date().toISOString()
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};

export default BookConferenceRoom;

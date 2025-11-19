import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PartnerPromotionSelector } from '@/components/reception/PartnerPromotionSelector';
import { ReceiptGenerator } from '@/components/ReceiptGenerator';
import { 
  Calendar, 
  Users, 
  Phone, 
  Mail,
  DollarSign,
  MapPin,
  Clock,
  FileText,
  Printer,
  Tag,
  CreditCard
} from 'lucide-react';
import { formatGuestInfo } from '@/utils/paymentUtils';

interface BookingDetailsDialogProps {
  bookingId: number | null;
  bookingType: 'hotel' | 'conference' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingUpdated?: () => void;
}

export function BookingDetailsDialog({
  bookingId,
  bookingType,
  open,
  onOpenChange,
  onBookingUpdated
}: BookingDetailsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [guestInfo, setGuestInfo] = useState<any>(null);
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);

  useEffect(() => {
    if (open && bookingId && bookingType) {
      fetchBookingDetails();
    }
  }, [open, bookingId, bookingType]);

  const fetchBookingDetails = async () => {
    if (!bookingId || !bookingType) return;

    try {
      setLoading(true);

      if (bookingType === 'hotel') {
        // Fetch hotel booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            room:rooms(name, type),
            users!bookings_user_id_fkey(name, email, phone, company)
          `)
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;

        setBooking(bookingData);

        // Extract guest info (NEVER use booking creator's email/phone for guest)
        const extractedGuestInfo = {
          name: bookingData.guest_name || bookingData.users?.name || 'Guest',
          email: bookingData.guest_email || 'Not provided',
          phone: bookingData.guest_phone || 'Not provided',
          company: bookingData.guest_company || bookingData.users?.company || 'Not provided',
          id_type: bookingData.guest_id_type || 'N/A',
          id_number: bookingData.guest_id_number || 'N/A'
        };
        setGuestInfo(extractedGuestInfo);

        // Fetch payments for hotel booking
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false });
        
        setPayments(paymentsData || []);

        // Fetch promotion if applied
        if (bookingData.promotion_id) {
          const { data: promotionData } = await supabase
            .from('promotions')
            .select('*')
            .eq('id', bookingData.promotion_id)
            .single();
          
          if (promotionData) setAppliedPromotion(promotionData);
        }

      } else {
        // Fetch conference booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('conference_bookings')
          .select(`
            *,
            conference_room:conference_rooms(name)
          `)
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;

        setBooking(bookingData);

        // Fetch user info
        if (bookingData.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('name, email, phone, company')
            .eq('id', bookingData.user_id)
            .single();

          // For conference bookings, only use user data if they are the actual guest
          // Don't show staff email as guest email
          setGuestInfo({
            name: userData?.name || 'Guest',
            email: 'Not provided', // Conference bookings may not have guest email
            phone: userData?.phone || 'Not provided',
            company: bookingData.guest_company || userData?.company || 'Not provided'
          });
        }

        // Fetch payments for conference booking
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('conference_booking_id', bookingId)
          .order('created_at', { ascending: false });
        
        setPayments(paymentsData || []);
      }

    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionApplied = async (promotionData: {
    promotionId: number;
    discountAmount: number;
    finalAmount: number;
    promotionTitle: string;
  }) => {
    try {
      if (bookingType === 'hotel') {
        const { error } = await supabase
          .from('bookings')
          .update({
            promotion_id: promotionData.promotionId,
            original_price: booking.total_price,
            discount_amount: promotionData.discountAmount,
            total_price: promotionData.finalAmount
          })
          .eq('id', bookingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('conference_bookings')
          .update({
            promotion_id: promotionData.promotionId,
            original_price: booking.total_price,
            discount_amount: promotionData.discountAmount,
            total_price: promotionData.finalAmount
          })
          .eq('id', bookingId);

        if (error) throw error;
      }

      // Update local state
      setBooking((prev: any) => ({
        ...prev,
        promotion_id: promotionData.promotionId,
        original_price: prev.total_price,
        discount_amount: promotionData.discountAmount,
        total_price: promotionData.finalAmount
      }));

      setAppliedPromotion({
        id: promotionData.promotionId,
        title: promotionData.promotionTitle
      });

      toast({
        title: "Promotion Applied Successfully",
        description: `${promotionData.promotionTitle} has been applied to this booking`,
      });

      if (onBookingUpdated) onBookingUpdated();

    } catch (error) {
      console.error('Error updating booking with promotion:', error);
      toast({
        title: "Error",
        description: "Failed to update booking with promotion",
        variant: "destructive",
      });
    }
  };

  const handlePrintReceipt = () => {
    if (!booking) return;
    setShowReceiptGenerator(true);
  };

  const getReceiptData = () => {
    if (!booking || !guestInfo) return null;

    const latestPayment = payments.length > 0 ? payments[0] : null;

    if (bookingType === 'hotel') {
      return {
        bookingId: booking.id,
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        guestCompany: guestInfo.company,
        roomName: booking.room?.name || `Room ${booking.room_id}`,
        roomType: booking.room?.type || 'Standard',
        checkIn: booking.start_date,
        checkOut: booking.end_date,
        nights: Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)),
        roomPrice: booking.original_price || booking.total_price,
        totalAmount: booking.total_price,
        paymentMethod: latestPayment?.method || 'Pending',
        transactionRef: latestPayment?.transaction_ref,
        bookingType: 'hotel' as const,
        promotion: appliedPromotion ? {
          title: appliedPromotion.title,
          description: appliedPromotion.description || '',
          discount_percent: appliedPromotion.discount_percent,
          discount_type: appliedPromotion.discount_type || 'percentage',
          discount_amount: appliedPromotion.discount_amount,
          promotion_type: appliedPromotion.promotion_type || 'partner'
        } : undefined,
        createdAt: booking.created_at || new Date().toISOString()
      };
    } else {
      // Conference booking - calculate days from start to end datetime
      const days = Math.ceil(
        (new Date(booking.end_datetime).getTime() - new Date(booking.start_datetime).getTime()) / 
        (1000 * 60 * 60 * 24)
      ) || 1;

      return {
        bookingId: booking.id,
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        guestCompany: guestInfo.company,
        roomName: booking.conference_room?.name || `Conference Room ${booking.conference_room_id}`,
        roomType: 'Conference Room',
        checkIn: booking.start_datetime,
        checkOut: booking.end_datetime,
        days: days,
        roomPrice: booking.original_price || booking.total_price,
        totalAmount: booking.total_price,
        paymentMethod: latestPayment?.method || 'Pending',
        transactionRef: latestPayment?.transaction_ref,
        bookingType: 'conference' as const,
        // Conference-specific fields
        eventType: booking.event_type,
        eventDurationHours: booking.event_duration_hours,
        attendees: booking.attendees,
        buffetRequired: booking.buffet_required,
        buffetPackage: booking.buffet_package,
        specialRequirements: booking.special_requirements,
        createdAt: booking.created_at || new Date().toISOString()
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'booked':
        return 'bg-green-500';
      case 'pending':
      case 'pending_payment':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
      case 'checked_out':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading booking details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="h-6 w-6" />
              {bookingType === 'hotel' ? 'Hotel' : 'Conference'} Booking #{bookingId}
              <Badge className={getStatusColor(booking.status)}>
                {booking.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Main Booking Info */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {bookingType === 'hotel' ? 'Room Details' : 'Conference Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {bookingType === 'hotel' ? 'Room:' : 'Conference Room:'}
                    </span>
                    <span className="font-semibold">
                      {bookingType === 'hotel' 
                        ? booking.room?.name || `Room ${booking.room_id}`
                        : booking.conference_room?.name || `Conf ${booking.conference_room_id}`}
                    </span>
                  </div>
                  
                  {bookingType === 'hotel' && booking.room?.type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{booking.room.type}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {bookingType === 'hotel' ? 'Check-in:' : 'Start:'}
                    </span>
                    <span>
                      {bookingType === 'hotel' 
                        ? new Date(booking.start_date).toLocaleDateString()
                        : new Date(booking.start_datetime).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {bookingType === 'hotel' ? 'Check-out:' : 'End:'}
                    </span>
                    <span>
                      {bookingType === 'hotel' 
                        ? new Date(booking.end_date).toLocaleDateString()
                        : new Date(booking.end_datetime).toLocaleString()}
                    </span>
                  </div>

                  {bookingType === 'hotel' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nights:</span>
                      <span>
                        {Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                  )}

                  <Separator />

                  {booking.original_price && booking.discount_amount ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Original Price:</span>
                        <span>${booking.original_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-${booking.discount_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Final Price:</span>
                        <span className="text-green-600">${booking.total_price.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-5 w-5" />
                        Total:
                      </span>
                      <span>${booking.total_price.toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column: Guest Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Guest Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-semibold">{guestInfo?.name || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email:
                    </span>
                    <span className="text-sm">{guestInfo?.email || 'Not provided'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone:
                    </span>
                    <span>{guestInfo?.phone || 'Not provided'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Company:</span>
                    <span>{guestInfo?.company || 'Not provided'}</span>
                  </div>

                  {guestInfo?.id_type && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID Type:</span>
                        <span>{guestInfo.id_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID Number:</span>
                        <span className="font-mono">{guestInfo.id_number || 'N/A'}</span>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Date:</span>
                    <span className="text-sm">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Special Notes */}
            {booking.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Special Requests / Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {booking.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Promotions Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Partner Promotions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appliedPromotion ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Applied Promotion
                        </h4>
                        <p className="text-sm text-green-700 mt-1">{appliedPromotion.title}</p>
                        {appliedPromotion.partner_name && (
                          <p className="text-xs text-green-600 mt-1">
                            Partner: {appliedPromotion.partner_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Apply a partner promotion to this booking
                      </p>
                      {booking && guestInfo && (
                        <PartnerPromotionSelector
                          bookingAmount={booking.total_price}
                          onPromotionApplied={handlePromotionApplied}
                          bookingId={bookingType === 'hotel' ? booking.id : undefined}
                          conferenceBookingId={bookingType === 'conference' ? booking.id : undefined}
                          userId={booking.user_id}
                          disabled={!!appliedPromotion}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((payment) => (
                        <div key={payment.id} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">${payment.amount.toFixed(2)}</span>
                            <Badge variant={payment.status === 'verified' || payment.status === 'completed' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <div>Method: {payment.method}</div>
                            {payment.transaction_ref && (
                              <div>Ref: {payment.transaction_ref}</div>
                            )}
                            <div>{new Date(payment.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payments recorded yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button onClick={handlePrintReceipt} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Generator */}
      {showReceiptGenerator && getReceiptData() && (
        <ReceiptGenerator
          isOpen={showReceiptGenerator}
          onClose={() => setShowReceiptGenerator(false)}
          bookingData={getReceiptData()!}
        />
      )}
    </>
  );
}


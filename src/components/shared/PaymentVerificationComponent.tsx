import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Check, 
  X, 
  Phone, 
  Calendar, 
  Users, 
  CreditCard,
  Clock,
  AlertCircle,
  RefreshCw,
  Printer
} from "lucide-react";
import { PaymentData } from '@/types/payment';
import { 
  getPaymentMethodDisplay, 
  shouldShowVerificationButtons,
  formatCurrency 
} from '@/utils/paymentUtils';
import { useRealtimePayments, useRealtimeBookings } from '@/hooks/useRealtimeData';
import { handleError, handleSuccess } from '@/utils/errorHandling';
import { ReceiptGenerator } from '@/components/ReceiptGenerator';
import { extractGuestInfo, determinePaymentMethod, formatGuestInfo } from "@/utils/guestInfoExtraction";
import { useNavigate } from 'react-router-dom';
interface PaymentVerificationComponentProps {
  title: string;
  description?: string;
}

const PaymentVerificationComponent: React.FC<PaymentVerificationComponentProps> = ({ 
  title, 
  description = "Review and verify payment submissions"
}) => {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);
const [retryAttempts, setRetryAttempts] = useState<Record<number, number>>({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set up real-time subscriptions for payments and bookings
  useRealtimePayments(() => {
    fetchPayments();
  });

  useRealtimeBookings(() => {
    fetchPayments();
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(
            id,
            start_date,
            end_date,
            total_price,
            notes,
            status,
            user_id,
            guest_name,
            guest_email,
            guest_phone,
            room:rooms(name, type)
          ),
          conference_booking:conference_bookings(
            id,
            start_datetime,
            end_datetime,
            total_price,
            notes,
            status,
            user_id,
            attendees,
            conference_room:conference_rooms(name, capacity)
          )
        `)
        .in('status', ['pending_verification','pending','verified','rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const paymentsRaw: PaymentData[] = data || [];

      // Collect unique user IDs from bookings and conference bookings
      const userIds = Array.from(new Set(
        paymentsRaw.flatMap(p => [p.booking?.user_id, p.conference_booking?.user_id].filter(Boolean)) as string[]
      ));

      let usersMap: Record<string, { id: string; name: string; email?: string; phone?: string }> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .in('id', userIds);
        if (!usersError && usersData) {
          usersMap = usersData.reduce((acc, u) => { acc[u.id] = u; return acc; }, {} as Record<string, any>);
        }
      }

      // Attach user info into nested objects
      const enriched = paymentsRaw.map(p => {
        if (p.booking?.user_id && usersMap[p.booking.user_id]) {
          p.booking.user = usersMap[p.booking.user_id];
        }
        if (p.conference_booking?.user_id && usersMap[p.conference_booking.user_id]) {
          p.conference_booking.user = usersMap[p.conference_booking.user_id];
        }
        return p;
      });

      setPayments(enriched);
    } catch (error: unknown) {
      handleError(error, 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = (startIso?: string, endIso?: string): number => {
    if (!startIso || !endIso) return 1;
    try {
      const start = new Date(startIso);
      const end = new Date(endIso);
      const msInDay = 24 * 60 * 60 * 1000;
      const diff = Math.ceil((end.getTime() - start.getTime()) / msInDay);
      return Math.max(1, diff);
    } catch {
      return 1;
    }
  };

  const openReceipt = (e: React.MouseEvent, payment: PaymentData) => {
    e.stopPropagation();
    const isHotel = !!payment.booking_id;

    // Extract guest info from booking data (native columns for hotel, notes for conference)
    const notes = payment.booking?.notes || payment.conference_booking?.notes || '';
    const bookingData = isHotel ? payment.booking : payment.conference_booking;
    const guestInfoExtracted = extractGuestInfo(
      notes, 
      bookingData?.user,
      bookingData
    );
    const formattedGuest = formatGuestInfo(guestInfoExtracted);

    const roomName = isHotel
      ? (payment.booking?.room?.name || 'Room')
      : (payment.conference_booking?.conference_room?.name || 'Conference Room');
    const roomType = isHotel
      ? (payment.booking?.room?.type || 'Room')
      : 'Conference Room';
    const checkIn = isHotel
      ? (payment.booking?.start_date || new Date().toISOString())
      : (payment.conference_booking?.start_datetime || new Date().toISOString());
    const checkOut = isHotel
      ? (payment.booking?.end_date || new Date().toISOString())
      : (payment.conference_booking?.end_datetime || new Date().toISOString());

    const nights = calculateNights(checkIn, checkOut);
    const totalAmount = payment.amount;
    const estimatedRate = nights > 0 ? Math.round(totalAmount / nights) : totalAmount;

    // Detect payment method - check for cash from transaction reference
    let actualPaymentMethod = payment.method;
    if (payment.transaction_ref?.toUpperCase().includes('CASH')) {
      actualPaymentMethod = 'cash';
    }
    
    // Use the properly formatted payment method
    const paymentMethodInfo = getPaymentMethodDisplay(actualPaymentMethod);

    setReceiptData({
      bookingId: payment.booking_id || payment.conference_booking_id,
      guestName: formattedGuest.displayName,
      guestEmail: formattedGuest.displayEmail,
      guestPhone: formattedGuest.displayPhone,
      roomName,
      roomType,
      checkIn,
      checkOut,
      nights,
      roomPrice: estimatedRate,
      totalAmount,
      paymentMethod: paymentMethodInfo.name, // Use formatted payment method name
      transactionRef: payment.transaction_ref,
      createdAt: new Date().toISOString(),
    });
    setShowReceipt(true);
  };

  const handleVerifyPayment = async (
    paymentId: number,
    bookingId: number | null,
    approved: boolean,
    conferenceBookingId?: number | null
  ) => {
    setVerifying(paymentId);
    try {
      // 1) Update payment status first
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: approved ? 'verified' : 'rejected' })
        .eq('id', paymentId);

      if (paymentError) throw new Error(`Failed to update payment: ${paymentError.message}`);

      // 2) Update the related booking depending on type
      if (bookingId) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ status: approved ? 'confirmed' : 'cancelled' })
          .eq('id', bookingId);
        if (bookingError) {
          await supabase.from('payments').update({ status: 'pending_verification' }).eq('id', paymentId);
          throw new Error(`Failed to update booking: ${bookingError.message}`);
        }
      } else if (conferenceBookingId) {
        // For conference bookings: keep 'booked' on approval; cancel on rejection
        if (!approved) {
          const { error: confErr } = await supabase
            .from('conference_bookings')
            .update({ status: 'cancelled' })
            .eq('id', conferenceBookingId);
          if (confErr) {
            await supabase.from('payments').update({ status: 'pending_verification' }).eq('id', paymentId);
            throw new Error(`Failed to update conference booking: ${confErr.message}`);
          }
        }
      }

      // 3) Audit log (booking id may be hotel or conference)
      try {
        const { error: logError } = await supabase.rpc('log_payment_verification', {
          p_payment_id: paymentId,
          p_booking_id: bookingId ?? conferenceBookingId ?? null,
          p_verified_by: (await supabase.auth.getUser()).data.user?.id,
          p_approved: approved
        });
        if (logError) console.warn('Failed to log verification:', logError);
      } catch (logErr) {
        console.warn('Audit logging failed:', logErr);
      }

      handleSuccess(approved ? 'Payment verified successfully!' : 'Payment rejected.');

      setRetryAttempts(prev => { const u = { ...prev }; delete u[paymentId]; return u; });
      setTimeout(() => fetchPayments(), 1000);
    } catch (error: unknown) {
      const currentAttempts = retryAttempts[paymentId] || 0;
      setRetryAttempts(prev => ({ ...prev, [paymentId]: currentAttempts + 1 }));
      handleError(error, `Failed to ${approved ? 'verify' : 'reject'} payment. ${currentAttempts < 2 ? 'Please try again.' : 'Please contact system administrator.'}`);
    } finally {
      setVerifying(null);
    }
  };

  // Retry function for failed verifications
  const retryVerification = (paymentId: number, bookingId: number, approved: boolean) => {
    const attempts = retryAttempts[paymentId] || 0;
    if (attempts < 3) {
      handleVerifyPayment(paymentId, bookingId, approved);
    } else {
      toast({
        title: "Maximum Retries Exceeded",
        description: "Please contact system administrator for assistance.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {payments.length > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {payments.length} Total
          </Badge>
        )}
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payments Found</h3>
            <p className="text-muted-foreground">
              No payments have been recorded yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {payments.map((payment) => {
            const paymentMethod = getPaymentMethodDisplay(payment.method);
            const isHotel = !!payment.booking_id;
            const targetPath = isHotel
              ? (payment.booking_id ? `/kabinda-lodge/reception/booking/${payment.booking_id}` : '')
              : (payment.conference_booking_id ? `/kabinda-lodge/reception/conference-booking/${payment.conference_booking_id}` : '');

            return (
              <Card 
                key={payment.id} 
                className={`overflow-hidden ${targetPath ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                onClick={() => targetPath && navigate(targetPath)}
                role={targetPath ? 'button' : undefined}
                aria-label={targetPath ? `Open ${isHotel ? 'hotel' : 'conference'} booking details` : undefined}
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment #{payment.id}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Submitted {new Date(payment.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={payment.status === 'verified' ? 'default' : payment.status === 'pending' ? 'secondary' : payment.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {payment.status}
                      </Badge>
                      <Badge className={paymentMethod.color}>
                        {paymentMethod.name}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Payment Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-semibold text-lg">{formatCurrency(payment.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transaction Ref:</span>
                          <span className="font-mono font-semibold">{payment.transaction_ref}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reference:</span>
                          <span>{isHotel ? `HOTEL-${payment.booking_id}` : payment.conference_booking_id ? `CONF-${payment.conference_booking_id}` : '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details (Hotel or Conference) */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {isHotel ? 'Hotel Booking Details' : 'Conference Booking Details'}
                      </h3>

                      {payment.booking ? (
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold">{payment.booking.room?.name}</p>
                            <p className="text-sm text-muted-foreground">{payment.booking.room?.type}</p>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Check-in:</span>
                            <span>{new Date(payment.booking.start_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Check-out:</span>
                            <span>{new Date(payment.booking.end_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Guests:</span>
                            <span>
                              {(() => {
                                const notes = payment.booking?.notes || '';
                                const guestInfo = extractGuestInfo(notes, payment.booking?.user, payment.booking);
                                const formatted = formatGuestInfo(guestInfo);
                                return formatted.displayGuests;
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4" /> Phone:</span>
                            <span>
                              {(() => {
                                const notes = payment.booking?.notes || '';
                                const guestInfo = extractGuestInfo(notes, payment.booking?.user, payment.booking);
                                const formatted = formatGuestInfo(guestInfo);
                                return formatted.displayPhone;
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer:</span>
                            <span>
                              {(() => {
                                const notes = payment.booking?.notes || '';
                                const guestInfo = extractGuestInfo(notes, payment.booking?.user, payment.booking);
                                const formatted = formatGuestInfo(guestInfo);
                                return formatted.displayName;
                              })()}
                            </span>
                          </div>
                        </div>
                      ) : payment.conference_booking ? (
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold">{payment.conference_booking.conference_room?.name}</p>
                            <p className="text-sm text-muted-foreground">Capacity: {payment.conference_booking.conference_room?.capacity}</p>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Start:</span>
                            <span>{new Date(payment.conference_booking.start_datetime).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">End:</span>
                            <span>{new Date(payment.conference_booking.end_datetime).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Attendees:</span>
                            <span>{payment.conference_booking.attendees}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4" /> Phone:</span>
                            <span>
                              {(() => {
                                const notes = payment.conference_booking?.notes || '';
                                const guestInfo = extractGuestInfo(notes, payment.conference_booking?.user, payment.conference_booking);
                                const formatted = formatGuestInfo(guestInfo);
                                return formatted.displayPhone;
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer:</span>
                            <span>
                              {(() => {
                                const notes = payment.conference_booking?.notes || '';
                                const guestInfo = extractGuestInfo(notes, payment.conference_booking?.user, payment.conference_booking);
                                const formatted = formatGuestInfo(guestInfo);
                                return formatted.displayName;
                              })()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No booking details available.</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Only show for non-cash payments that need verification */}
                  {shouldShowVerificationButtons(payment.status, payment.method) && (
                    <div className="space-y-3 mt-6 pt-6 border-t">
                      {retryAttempts[payment.id] > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            {retryAttempts[payment.id]} attempt{retryAttempts[payment.id] > 1 ? 's' : ''} failed. 
                            {retryAttempts[payment.id] < 3 ? ' You can try again.' : ' Contact admin if issues persist.'}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleVerifyPayment(payment.id, payment.booking_id ?? null, true, payment.conference_booking_id ?? null); }}
                          disabled={verifying === payment.id || retryAttempts[payment.id] >= 3}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {verifying === payment.id ? "Verifying..." : "Verify & Approve"}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={(e) => { e.stopPropagation(); handleVerifyPayment(payment.id, payment.booking_id ?? null, false, payment.conference_booking_id ?? null); }}
                          disabled={verifying === payment.id || retryAttempts[payment.id] >= 3}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject Payment
                        </Button>
                        {retryAttempts[payment.id] > 0 && retryAttempts[payment.id] < 3 && (
                          <Button
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); retryVerification(payment.id, payment.booking_id, true); }}
                            disabled={verifying === payment.id}
                            size="sm"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Receipt / Print - visible once verified */}
                  {payment.status === 'verified' && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          onClick={(e) => openReceipt(e, payment)}
                          className="gap-2"
                        >
                          <Printer className="h-4 w-4" />
                          View / Print Receipt
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showReceipt && receiptData && (
        <ReceiptGenerator
          receiptData={receiptData}
          onClose={() => { setShowReceipt(false); setReceiptData(null); }}
        />
      )}
    </div>
  );
};

export default PaymentVerificationComponent;
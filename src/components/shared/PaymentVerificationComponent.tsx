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
  RefreshCw
} from "lucide-react";
import { PaymentData } from '@/types/payment';
import { 
  getPaymentMethodDisplay, 
  extractContactInfo, 
  shouldShowVerificationButtons,
  formatCurrency 
} from '@/utils/paymentUtils';
import { useRealtimePayments, useRealtimeBookings } from '@/hooks/useRealtimeData';
import { handleError, handleSuccess } from '@/utils/errorHandling';

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
  const { toast } = useToast();

  // Set up real-time subscriptions for payments and bookings
  useRealtimePayments(() => {
    console.log('Real-time payment update detected, refreshing...');
    fetchPayments();
  });

  useRealtimeBookings(() => {
    console.log('Real-time booking update detected, refreshing...');
    fetchPayments();
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      console.log('Fetching payments...');
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
            room:rooms(name, type)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      console.log('Payments fetched successfully:', data?.length || 0, 'payments');
      setPayments(data || []);
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
      handleError(error, 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: number, bookingId: number, approved: boolean) => {
    setVerifying(paymentId);
    
    try {
      console.log(`Attempting to ${approved ? 'verify' : 'reject'} payment ${paymentId} for booking ${bookingId}`);
      
      // Start a transaction-like approach by updating payment first
      const { data: paymentUpdate, error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: approved ? 'verified' : 'rejected' 
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (paymentError) {
        console.error('Payment update error:', paymentError);
        throw new Error(`Failed to update payment: ${paymentError.message}`);
      }

      console.log('Payment updated successfully:', paymentUpdate);

      // Update booking status - this will trigger room status update via our new trigger
      const { data: bookingUpdate, error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: approved ? 'confirmed' : 'cancelled' 
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (bookingError) {
        console.error('Booking update error:', bookingError);
        
        // Rollback payment status
        await supabase
          .from('payments')
          .update({ status: 'pending_verification' })
          .eq('id', paymentId);
          
        throw new Error(`Failed to update booking: ${bookingError.message}`);
      }

      console.log('Booking updated successfully:', bookingUpdate);

      // Log the verification for audit purposes
      try {
        const { error: logError } = await supabase.rpc('log_payment_verification', {
          p_payment_id: paymentId,
          p_booking_id: bookingId,
          p_verified_by: (await supabase.auth.getUser()).data.user?.id,
          p_approved: approved
        });

        if (logError) {
          console.warn('Failed to log verification:', logError);
        }
      } catch (logErr) {
        console.warn('Audit logging failed:', logErr);
        // Don't fail the main operation for logging issues
      }

      handleSuccess(approved 
        ? "Payment verified successfully! The booking has been confirmed and room status updated."
        : "Payment rejected. The booking has been cancelled."
      );

      // Reset retry attempts on success
      setRetryAttempts(prev => {
        const updated = { ...prev };
        delete updated[paymentId];
        return updated;
      });

      // Refresh the list (real-time should handle this, but fallback)
      setTimeout(() => fetchPayments(), 1000);
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      
      // Track retry attempts
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
            const contactInfo = extractContactInfo(payment.booking?.notes || '');
            
            return (
              <Card key={payment.id} className="overflow-hidden">
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
                      <Badge variant={payment.status === 'verified' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
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
                          <span className="font-mono font-semibold">
                            {payment.transaction_ref}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Booking ID:</span>
                          <span>HOTEL-{payment.booking_id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Booking Details
                      </h3>
                      
                      {payment.booking && (
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold">{payment.booking.room?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.booking.room?.type}
                            </p>
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
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Guests:
                            </span>
                            <span>{contactInfo.guests}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              Phone:
                            </span>
                            <span>{contactInfo.phone}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer:</span>
                            <span>User ID: {payment.booking.user_id}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Only show for non-cash payments that need verification */}
                  {shouldShowVerificationButtons(payment.status, payment.method) && (
                    <div className="space-y-3 mt-6 pt-6 border-t">
                      {/* Show retry info if there have been attempts */}
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
                          onClick={() => handleVerifyPayment(payment.id, payment.booking_id, true)}
                          disabled={verifying === payment.id || retryAttempts[payment.id] >= 3}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {verifying === payment.id ? "Verifying..." : "Verify & Approve"}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => handleVerifyPayment(payment.id, payment.booking_id, false)}
                          disabled={verifying === payment.id || retryAttempts[payment.id] >= 3}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject Payment
                        </Button>
                        
                        {/* Retry button for failed attempts */}
                        {retryAttempts[payment.id] > 0 && retryAttempts[payment.id] < 3 && (
                          <Button
                            variant="outline"
                            onClick={() => retryVerification(payment.id, payment.booking_id, true)}
                            disabled={verifying === payment.id}
                            size="sm"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationComponent;
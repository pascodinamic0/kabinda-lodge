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
  Clock
} from "lucide-react";
import { PaymentData } from '@/types/payment';
import { 
  getPaymentMethodDisplay, 
  extractContactInfo, 
  shouldShowVerificationButtons,
  formatCurrency 
} from '@/utils/paymentUtils';

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
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
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

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: number, bookingId: number, approved: boolean) => {
    setVerifying(paymentId);
    
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: approved ? 'verified' : 'rejected' 
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: approved ? 'confirmed' : 'cancelled' 
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      toast({
        title: approved ? "Payment Verified" : "Payment Rejected",
        description: approved 
          ? "The booking has been confirmed and customer will be notified"
          : "The payment has been rejected and booking cancelled",
      });

      // Refresh the list
      fetchPayments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setVerifying(null);
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
                    <div className="flex gap-3 mt-6 pt-6 border-t">
                      <Button
                        onClick={() => handleVerifyPayment(payment.id, payment.booking_id, true)}
                        disabled={verifying === payment.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {verifying === payment.id ? "Verifying..." : "Verify & Approve"}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={() => handleVerifyPayment(payment.id, payment.booking_id, false)}
                        disabled={verifying === payment.id}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject Payment
                      </Button>
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
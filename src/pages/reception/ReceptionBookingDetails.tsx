import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/utils/errorHandling";
import { Calendar, CreditCard, Phone, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerPromotionSelector } from "@/components/reception/PartnerPromotionSelector";
import { ReceiptGenerator } from "@/components/ReceiptGenerator";
import { useToast } from "@/hooks/use-toast";


const ReceptionBookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<any | null>(null);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    document.title = `Booking ${id} · Payment Details`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Reception booking payment details and history');
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try fetching with extended fields (newer schema)
        let bookingData: any | null = null;
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('id, user_id, room:rooms(name, type), start_date, end_date, total_price, notes, status, promotion_id, original_price, discount_amount')
            .eq('id', Number(id))
            .maybeSingle();
          if (error) throw error;
          bookingData = data;
        } catch (err) {
          // Fallback for older schemas without promotion fields
          const { data, error } = await supabase
            .from('bookings')
            .select('id, user_id, room:rooms(name, type), start_date, end_date, total_price, notes, status')
            .eq('id', Number(id))
            .maybeSingle();
          if (error) throw error;
          bookingData = data;
        }

        setBooking(bookingData);

        if (bookingData?.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email, phone')
            .eq('id', bookingData.user_id)
            .maybeSingle();
          setUser(userData);
        }

        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('booking_id', Number(id))
          .order('created_at', { ascending: false });
        setPayments(paymentsData || []);

        // If booking has a promotion, fetch promotion details (best-effort; support older schema)
        if (bookingData?.promotion_id) {
          try {
            const { data: promotionData } = await supabase
              .from('promotions')
              .select('id, title, description, discount_percent, partner_name')
              .eq('id', bookingData.promotion_id)
              .single();
            if (promotionData) setAppliedPromotion(promotionData);
          } catch (_) {
            const { data: promotionData } = await supabase
              .from('promotions')
              .select('id, title, description, discount_percent')
              .eq('id', bookingData.promotion_id)
              .single();
            if (promotionData) setAppliedPromotion(promotionData);
          }
        }

      } catch (e) {
        handleError(e, 'Failed to load booking details');
      }
    };
    fetchData();
  }, [id]);

  const bookingDates = useMemo(() => {
    if (!booking) return '';
    const start = new Date(booking.start_date).toLocaleDateString();
    const end = new Date(booking.end_date).toLocaleDateString();
    return `${start} → ${end}`;
  }, [booking]);

  const handlePromotionApplied = async (promotionData: {
    promotionId: number;
    discountAmount: number;
    finalAmount: number;
    promotionTitle: string;
  }) => {
    try {
      // Update the booking with promotion information
      const { error } = await supabase
        .from('bookings')
        .update({
          promotion_id: promotionData.promotionId,
          original_price: booking.total_price,
          discount_amount: promotionData.discountAmount,
          total_price: promotionData.finalAmount
        })
        .eq('id', Number(id));

      if (error) throw error;

      // Update local state
      setBooking((prev: any) => ({
        ...prev,
        promotion_id: promotionData.promotionId,
        original_price: prev.total_price,
        discount_amount: promotionData.discountAmount,
        total_price: promotionData.finalAmount
      }));

      // Set the applied promotion for display
      setAppliedPromotion({
        id: promotionData.promotionId,
        title: promotionData.promotionTitle
      });

      toast({
        title: "Promotion Applied Successfully",
        description: `${promotionData.promotionTitle} has been applied to this booking`,
      });

    } catch (error) {
      console.error('Error updating booking with promotion:', error);
      toast({
        title: "Error",
        description: "Failed to update booking with promotion",
        variant: "destructive",
      });
    }
  };

  const generateReceipt = () => {
    if (!booking || !user) return;

    const receiptData = {
      bookingId: booking.id,
      guestName: user.name,
      guestEmail: user.email,
      guestPhone: user.phone,
      roomName: booking.room.name,
      roomType: booking.room.type,
      checkIn: booking.start_date,
      checkOut: booking.end_date,
      nights: Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)),
      roomPrice: booking.original_price || booking.total_price,
      totalAmount: booking.total_price,
      paymentMethod: payments.length > 0 ? payments[0].method : 'Pending',
      transactionRef: payments.length > 0 ? payments[0].transaction_ref : undefined,
      bookingType: 'hotel' as const,
      promotion: appliedPromotion ? {
        title: appliedPromotion.title,
        description: appliedPromotion.description || '',
        discount_percent: appliedPromotion.discount_percent
      } : undefined,
      createdAt: booking.created_at || new Date().toISOString()
    };

    setShowReceiptGenerator(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">Review booking and payment history</p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              HOTEL-{id}
              {booking?.status && (
                <Badge variant="secondary" className="ml-2">{booking.status}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="font-semibold">{booking?.room?.name}</p>
                <p className="text-sm text-muted-foreground">{booking?.room?.type}</p>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dates:</span><span>{bookingDates}</span></div>
              {booking?.original_price && booking?.discount_amount ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Original Price:</span><span>${booking.original_price}</span></div>
                  <div className="flex justify-between text-green-600"><span>Discount:</span><span>-${booking.discount_amount}</span></div>
                  <div className="flex justify-between font-semibold"><span>Final Price:</span><span>${booking.total_price}</span></div>
                </>
              ) : (
                <div className="flex justify-between"><span className="text-muted-foreground">Total Price:</span><span>${booking?.total_price}</span></div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4"/>Customer</span><span>{user?.name || booking?.user_id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4"/>Phone</span><span>{user?.phone || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user?.email || 'N/A'}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Partner Promotion Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Partner Promotions</CardTitle>
            </CardHeader>
            <CardContent>
              {appliedPromotion ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800">Applied Promotion</h4>
                    <p className="text-sm text-green-700">{appliedPromotion.title}</p>
                    {appliedPromotion.partner_name && (
                      <p className="text-xs text-green-600">Partner: {appliedPromotion.partner_name}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Apply a partner promotion to this booking</p>
                  {booking && user && (
                    <PartnerPromotionSelector
                      bookingAmount={booking.total_price}
                      onPromotionApplied={handlePromotionApplied}
                      bookingId={booking.id}
                      userId={user.id}
                      disabled={!!appliedPromotion}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={generateReceipt}
                  className="w-full"
                  disabled={!booking || !user}
                >
                  📄 Generate Receipt
                </Button>
                <p className="text-xs text-muted-foreground">
                  Generate a professional receipt for this booking
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5"/>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground">No payments yet.</p>
            ) : (
              <Table>
                <TableCaption>All payments for this booking</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ref</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{p.amount}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell className="font-mono">{p.transaction_ref}</TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Receipt Generator Modal */}
        {showReceiptGenerator && booking && user && (
          <ReceiptGenerator
            receiptData={{
              bookingId: booking.id,
              guestName: user.name,
              guestEmail: user.email,
              guestPhone: user.phone,
              roomName: booking.room.name,
              roomType: booking.room.type,
              checkIn: booking.start_date,
              checkOut: booking.end_date,
              nights: Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)),
              roomPrice: booking.original_price || booking.total_price,
              totalAmount: booking.total_price,
              paymentMethod: payments.length > 0 ? payments[0].method : 'Pending',
              transactionRef: payments.length > 0 ? payments[0].transaction_ref : undefined,
              bookingType: 'hotel' as const,
              promotion: appliedPromotion ? {
                title: appliedPromotion.title,
                description: appliedPromotion.description || '',
                discount_percent: appliedPromotion.discount_percent
              } : undefined,
              createdAt: booking.created_at || new Date().toISOString()
            }}
            onClose={() => setShowReceiptGenerator(false)}
          />
        )}

      </div>
    </DashboardLayout>
  );
};

export default ReceptionBookingDetails;

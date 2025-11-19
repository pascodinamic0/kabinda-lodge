import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/utils/errorHandling";
import { Calendar, CreditCard, Phone, Users, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerPromotionSelector } from "@/components/reception/PartnerPromotionSelector";
import { ReceiptGenerator } from "@/components/ReceiptGenerator";
import { CardProgrammingDialog } from "@/components/reception/CardProgrammingDialog";
import { useToast } from "@/hooks/use-toast";
import { extractGuestInfo, determinePaymentMethod, formatGuestInfo } from "@/utils/guestInfoExtraction";
import { getPaymentMethodDisplay } from "@/utils/paymentUtils";
import type { BookingData } from "@/services/cardProgrammingService";


const ReceptionBookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<any | null>(null);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const [showCardProgramming, setShowCardProgramming] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    document.title = `Booking ${id} · Payment Details`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Reception booking payment details and history');
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch booking data - use SAME approach as PaymentVerificationComponent
        // Try with all fields first, fallback if some columns don't exist
        let bookingData: any | null = null;
        let bookingError: any = null;
        
        // Try fetching with all fields first
        let result = await supabase
          .from('bookings')
          .select('id, user_id, room:rooms(name, type), start_date, end_date, total_price, notes, status, promotion_id, original_price, discount_amount, guest_name, guest_email, guest_phone, guest_company')
          .eq('id', Number(id))
          .maybeSingle();
        
        bookingData = result.data;
        bookingError = result.error;
        
        // If error is about missing columns (like promotion_id or guest_company), try without optional fields
        if (bookingError && (bookingError.message?.includes('does not exist') || bookingError.message?.includes('column'))) {
          console.warn('Some columns missing, retrying without optional fields:', bookingError.message);
          result = await supabase
            .from('bookings')
            .select('id, user_id, room:rooms(name, type), start_date, end_date, total_price, notes, status, guest_name, guest_email, guest_phone')
            .eq('id', Number(id))
            .maybeSingle();
          
          bookingData = result.data;
          bookingError = result.error;
        }
        
        if (bookingError) throw bookingError;
        if (!bookingData) throw new Error('Booking not found');
        
        console.log('📦 Fetched booking data:', bookingData);

        // Fetch user data and attach to booking (like PaymentVerificationComponent)
        if (bookingData?.user_id) {
          const { data: userDataResult } = await supabase
            .from('users')
            .select('id, name, email, phone, company')
            .eq('id', bookingData.user_id)
            .maybeSingle();
          
          setUser(userDataResult);
          
          // Attach user data to booking object (CRITICAL - like PaymentVerificationComponent)
          if (userDataResult && bookingData) {
            bookingData.user = userDataResult;
          }
        }
        
        // DEBUG: Log what we fetched
        console.log('📦 ReceptionBookingDetails - Data Fetched:');
        console.log('Booking:', {
          id: bookingData?.id,
          guest_name: bookingData?.guest_name,
          guest_email: bookingData?.guest_email,
          guest_phone: bookingData?.guest_phone,
          guest_company: bookingData?.guest_company,
          notes: bookingData?.notes
        });
        console.log('User attached:', bookingData?.user);
        
        setBooking(bookingData);

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
              .select('id, title, description, discount_percent, discount_type, discount_amount, promotion_type, partner_name')
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
    if (!booking) return;

    // Extract guest info inline (like PaymentVerificationComponent)
    const notes = booking.notes || '';
    const guestInfo = extractGuestInfo(notes, booking.user, booking);
    const guest = formatGuestInfo(guestInfo);
    const latestPayment = payments.length > 0 ? payments[0] : null;
    const actualPaymentMethod = latestPayment 
      ? determinePaymentMethod(latestPayment.method, latestPayment.transaction_ref)
      : 'Pending';
    const paymentMethodInfo = getPaymentMethodDisplay(actualPaymentMethod);

    const receiptData = {
      bookingId: booking.id,
      guestName: guest.displayName,
      guestEmail: guest.displayEmail,
      guestPhone: guest.displayPhone,
      guestCompany: guest.displayCompany,
      roomName: booking.room.name,
      roomType: booking.room.type,
      checkIn: booking.start_date,
      checkOut: booking.end_date,
      nights: Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)),
      roomPrice: booking.original_price || booking.total_price,
      totalAmount: booking.total_price,
      paymentMethod: paymentMethodInfo.name,
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

    setShowReceiptGenerator(true);
  };

  const handleProgramCards = () => {
    setShowCardProgramming(true);
  };

  const handleCardProgrammingSuccess = async (results: any[]) => {
    toast({
      title: "Success!",
      description: `Successfully programmed ${results.length} key cards`,
    });

    // Log the programming to database
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      for (const result of results) {
        if (result.success) {
          await (supabase as any).from('card_programming_log').insert({
            booking_id: Number(id),
            card_type: result.cardType,
            card_uid: result.cardUID,
            status: 'success',
            programming_data: result.data,
            programmed_by: currentUser?.id,
          });
        }
      }
    } catch (error) {
      console.error('Error logging card programming:', error);
    }
  };

  const handleCardProgrammingError = (error: string) => {
    console.error('Card programming error:', error);
  };

  const getBookingDataForCards = (): BookingData | null => {
    if (!booking) return null;

    // Extract room number from room name (assuming format like "Room 101" or just "101")
    const roomNumber = booking.room?.name?.match(/\d+/)?.[0] || booking.room?.name || 'Unknown';

    return {
      bookingId: booking.id,
      roomNumber,
      guestId: booking.user_id || booking.user?.id || 'guest',
      checkInDate: booking.start_date,
      checkOutDate: booking.end_date,
      facilityId: 'KABINDA_LODGE',
    };
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
              {(() => {
                // EXACTLY like PaymentVerificationComponent - call extractGuestInfo inline
                if (!booking) {
                  return <p className="text-muted-foreground">Loading...</p>;
                }
                
                const notes = booking.notes || '';
                const guestInfo = extractGuestInfo(notes, booking.user, booking);
                const guest = formatGuestInfo(guestInfo);
                
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4"/>Customer
                      </span>
                      <span>{guest.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-4 w-4"/>Phone
                      </span>
                      <span>{guest.displayPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className={guest.displayEmail === 'Not provided' ? 'text-red-500' : ''}>
                        {guest.displayEmail}
                        {guest.displayEmail === 'Not provided' && booking?.guest_email === null && (
                          <span className="text-xs ml-2 text-red-600">(⚠️ Missing in database)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company</span>
                      <span className={guest.displayCompany === 'Not provided' ? 'text-red-500' : ''}>
                        {guest.displayCompany}
                        {guest.displayCompany === 'Not provided' && booking?.guest_company === null && (
                          <span className="text-xs ml-2 text-red-600">(⚠️ Missing in database)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Guests</span>
                      <span>{guest.displayGuests}</span>
                    </div>
                  </>
                );
              })()}
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
                  {booking && (
                    <PartnerPromotionSelector
                      bookingAmount={booking.total_price}
                      onPromotionApplied={handlePromotionApplied}
                      bookingId={booking.id}
                      userId={user?.id || booking.user_id}
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
                  onClick={handleProgramCards}
                  className="w-full"
                  disabled={!booking}
                  variant="default"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Program Key Cards
                </Button>
                <p className="text-xs text-muted-foreground">
                  Program all 5 key cards for this booking
                </p>
                <Button 
                  onClick={generateReceipt}
                  className="w-full"
                  disabled={!booking}
                  variant="outline"
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
                  {payments.map(p => {
                    const actualMethod = determinePaymentMethod(p.method, p.transaction_ref);
                    const methodInfo = getPaymentMethodDisplay(actualMethod);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{p.id}</TableCell>
                        <TableCell>${p.amount}</TableCell>
                        <TableCell>
                          <Badge className={methodInfo.color}>
                            {methodInfo.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'verified' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{p.transaction_ref}</TableCell>
                        <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Receipt Generator Modal */}
        {showReceiptGenerator && booking && (() => {
          // Extract guest info inline (like PaymentVerificationComponent)
          const notes = booking.notes || '';
          const guestInfo = extractGuestInfo(notes, booking.user, booking);
          const guest = formatGuestInfo(guestInfo);
          const latestPayment = payments.length > 0 ? payments[0] : null;
          const actualPaymentMethod = latestPayment 
            ? determinePaymentMethod(latestPayment.method, latestPayment.transaction_ref)
            : 'Pending';
          const paymentMethodInfo = getPaymentMethodDisplay(actualPaymentMethod);
          
          return (
            <ReceiptGenerator
              receiptData={{
                bookingId: booking.id,
                guestName: guest.displayName,
                guestEmail: guest.displayEmail,
                guestPhone: guest.displayPhone,
                guestCompany: guest.displayCompany,
                roomName: booking.room.name,
                roomType: booking.room.type,
                checkIn: booking.start_date,
                checkOut: booking.end_date,
                nights: Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)),
                roomPrice: booking.original_price || booking.total_price,
                totalAmount: booking.total_price,
                paymentMethod: paymentMethodInfo.name,
                transactionRef: latestPayment?.transaction_ref,
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
          );
        })()}

        {/* Card Programming Dialog */}
        {showCardProgramming && getBookingDataForCards() && (
          <CardProgrammingDialog
            open={showCardProgramming}
            onOpenChange={setShowCardProgramming}
            bookingData={getBookingDataForCards()!}
            onSuccess={handleCardProgrammingSuccess}
            onError={handleCardProgrammingError}
          />
        )}

      </div>
    </DashboardLayout>
  );
};

export default ReceptionBookingDetails;

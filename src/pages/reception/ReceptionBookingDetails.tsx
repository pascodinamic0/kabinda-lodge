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

const ReceptionBookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    document.title = `Booking ${id} · Payment Details`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Reception booking payment details and history');
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: bookingData, error: bookingErr } = await supabase
          .from('bookings')
          .select('id, user_id, room:rooms(name, type), start_date, end_date, total_price, notes, status')
          .eq('id', Number(id))
          .maybeSingle();
        if (bookingErr) throw bookingErr;
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
              <div className="flex justify-between"><span className="text-muted-foreground">Total Price:</span><span>{booking?.total_price}</span></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4"/>Customer</span><span>{user?.name || booking?.user_id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4"/>Phone</span><span>{user?.phone || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user?.email || 'N/A'}</span></div>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </DashboardLayout>
  );
};

export default ReceptionBookingDetails;

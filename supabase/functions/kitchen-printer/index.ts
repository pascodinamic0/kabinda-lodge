// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderPrintData {
  orderId: number;
  trackingNumber: string;
  tableNumber: number;
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
  }>;
  totalPrice: number;
  paymentMethod: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create an auth-aware client using the caller's JWT to identify the user
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    // Service client for privileged DB operations (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authenticated user
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      console.warn('Unauthorized kitchen-printer call');
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;

    // Fetch role and authorize
    const { data: roleRow, error: roleErr } = await serviceClient
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (roleErr || !roleRow) {
      console.error('Failed to fetch user role:', roleErr);
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowedRoles = ['Admin', 'RestaurantLead'];
    if (!allowedRoles.includes(roleRow.role)) {
      console.warn(`Access denied for user ${userId} with role ${roleRow.role}`);
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId, printerIds } = await req.json();

    if (typeof orderId !== 'number' || !Array.isArray(printerIds)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing kitchen print for order ${orderId} by user ${userId}`);

    // Fetch order details with items
    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          notes,
          menu_items (
            name,
            category
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return new Response(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format order data for printing
    const printData: OrderPrintData = {
      orderId: order.id,
      trackingNumber: order.tracking_number,
      tableNumber: order.table_number,
      items: order.order_items.map((item: any) => ({
        name: item.menu_items.name,
        quantity: item.quantity,
        notes: item.notes,
      })),
      totalPrice: order.total_price,
      paymentMethod: order.payment_method,
      timestamp: new Date().toISOString(),
    };

    // Log the print request for audit purposes
    console.log('Kitchen print data:', JSON.stringify(printData, null, 2));

    // Simulate successful printing
    const printResults = (printerIds as string[]).map((printerId) => ({
      printerId,
      status: 'success',
      message: 'Order sent to kitchen printer successfully',
    }));

    // Record status change in order history
    await serviceClient
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: 'sent_to_kitchen',
        notes: `Sent to kitchen printers: ${printerIds.join(', ')}`,
        changed_by: userId,
      });

    return new Response(
      JSON.stringify({ success: true, printResults, orderData: printData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in kitchen-printer function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
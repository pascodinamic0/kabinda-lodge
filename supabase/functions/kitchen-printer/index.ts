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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, printerIds } = await req.json();

    console.log(`Processing kitchen print for order ${orderId}`);

    // Fetch order details with items
    const { data: order, error: orderError } = await supabase
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

    if (orderError) {
      console.error('Error fetching order:', orderError);
      throw orderError;
    }

    // Format order data for printing
    const printData: OrderPrintData = {
      orderId: order.id,
      trackingNumber: order.tracking_number,
      tableNumber: order.table_number,
      items: order.order_items.map((item: any) => ({
        name: item.menu_items.name,
        quantity: item.quantity,
        notes: item.notes
      })),
      totalPrice: order.total_price,
      paymentMethod: order.payment_method,
      timestamp: new Date().toISOString()
    };

    // Log the print request for audit purposes
    console.log('Kitchen print data:', JSON.stringify(printData, null, 2));

    // In a real implementation, this would integrate with actual kitchen printer APIs
    // For now, we'll simulate successful printing
    const printResults = (printerIds as string[]).map(printerId => ({
      printerId,
      status: 'success',
      message: 'Order sent to kitchen printer successfully'
    }));

    // Record status change in order history
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: 'sent_to_kitchen',
        notes: `Sent to kitchen printers: ${printerIds.join(', ')}`
      });

    return new Response(JSON.stringify({
      success: true,
      printResults,
      orderData: printData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in kitchen-printer function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
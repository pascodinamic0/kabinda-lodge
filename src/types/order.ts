// Order Types
export interface Order {
  id: number;
  tracking_number: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  table_number?: number;
  waiter_id?: string;
  total_price: number;
  created_at: string;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  notes?: string;
}
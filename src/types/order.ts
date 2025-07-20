// Order Types
export interface Order {
  id: number;
  tracking_number: string;
  status: string;
  table_number?: number | null;
  waiter_id?: string | null;
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
  menu_items?: {
    name: string;
    price: number;
  };
}
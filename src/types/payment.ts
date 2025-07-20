// Shared Payment Types
export interface PaymentData {
  id: number;
  amount: number;
  method: string;
  transaction_ref: string;
  status: string;
  created_at: string;
  booking_id: number;
  order_id?: number;
  booking?: {
    id: number;
    start_date: string;
    end_date: string;
    total_price: number;
    notes: string;
    status: string;
    user_id: string;
    room?: {
      name: string;
      type: string;
    };
  };
}

export interface PaymentMethodInfo {
  name: string;
  color: string;
}

export interface ContactInfo {
  phone: string;
  guests: string;
}

export type PaymentStatus = 'pending' | 'pending_verification' | 'verified' | 'rejected' | 'completed';
export type PaymentMethod = 'cash' | 'vodacom_mpesa' | 'orange_money' | 'airtel_money' | string;
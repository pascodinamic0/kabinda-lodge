export interface BookingFieldConfig {
  id: number;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  is_required: boolean;
  is_active: boolean;
  applies_to: ('room' | 'conference_room')[];
  display_order: number;
  options?: string[]; // For select fields
  placeholder?: string;
  validation_rules?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface BookingFieldValue {
  id?: number;
  booking_id: number;
  field_id: number;
  field_value: string;
  created_at?: string;
}

export interface DynamicFieldData {
  [fieldName: string]: string | number | boolean;
}





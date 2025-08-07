import { PaymentMethodInfo, ContactInfo, PaymentMethod } from '@/types/payment';

export const getPaymentMethodDisplay = (method: PaymentMethod): PaymentMethodInfo => {
  switch (method.toLowerCase()) {
    case 'vodacom_mpesa':
      return { name: 'Vodacom M-Pesa', color: 'bg-red-100 text-red-800' };
    case 'orange_money':
      return { name: 'Orange Money', color: 'bg-orange-100 text-orange-800' };
    case 'airtel_money':
    case 'airtel money drc':
      return { name: 'Airtel Money', color: 'bg-blue-100 text-blue-800' };
    case 'cash':
      return { name: 'Cash Payment', color: 'bg-green-100 text-green-800' };
    default:
      return { 
        name: method.charAt(0).toUpperCase() + method.slice(1), 
        color: 'bg-gray-100 text-gray-800' 
      };
  }
};

export const extractContactInfo = (notes: string): ContactInfo => {
  const phoneMatch = notes.match(/(?:Phone|Contact|Tel)[\s:]+([^,]+)/i);
  const guestsMatch = notes.match(/(?:Guests|Guest|Attendees)[\s:]+([^,]+)/i);
  return {
    phone: phoneMatch ? phoneMatch[1].trim() : 'Not provided',
    guests: guestsMatch ? guestsMatch[1].trim() : 'Not specified'
  };
};

export const shouldShowVerificationButtons = (status: string, method: string): boolean => {
  return (status === 'pending_verification' || status === 'pending') && method !== 'cash';
};

export const formatCurrency = (amount: number): string => {
  return `$${Number(amount).toFixed(2)}`;
};
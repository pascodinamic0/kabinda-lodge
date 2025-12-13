import { PaymentMethodInfo, ContactInfo, PaymentMethod } from '@/types/payment';

export const getPaymentMethodDisplay = (method: PaymentMethod): PaymentMethodInfo => {
  const methodLower = method.toLowerCase().trim();
  
  // Handle various formats that might be stored in the database
  switch (methodLower) {
    case 'vodacom_mpesa':
    case 'vodacom m-pesa drc':
    case 'vodacom m-pesa':
      return { name: 'Vodacom M-Pesa', color: 'bg-red-100 text-red-800' };
    case 'orange_money':
    case 'orange money':
      return { name: 'Orange Money', color: 'bg-orange-100 text-orange-800' };
    case 'airtel_money':
    case 'airtel money drc':
    case 'airtel money':
      return { name: 'Airtel Money', color: 'bg-blue-100 text-blue-800' };
    case 'cash':
      return { name: 'Cash Payment', color: 'bg-green-100 text-green-800' };
    case 'bank_transfer':
    case 'equity bcdc':
      return { name: 'Bank Transfer', color: 'bg-purple-100 text-purple-800' };
    case 'tmb_bank':
    case 'tmb bank':
      return { name: 'TMB Bank', color: 'bg-blue-100 text-blue-800' };
    case 'pepele mobile':
      return { name: 'Pepele Mobile', color: 'bg-indigo-100 text-indigo-800' };
    default: {
      // For any other payment method, format it nicely
      const formattedName = method
        .split(/[_\s-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return { 
        name: formattedName || method, 
        color: 'bg-gray-100 text-gray-800' 
      };
    }
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
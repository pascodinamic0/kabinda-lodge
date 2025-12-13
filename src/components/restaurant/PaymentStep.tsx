import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Smartphone, Landmark } from 'lucide-react';
import { useBankAccounts } from '@/hooks/useBankAccounts';

interface PaymentStepProps {
  paymentMethod: string;
  totalAmount: number;
  onSubmitPayment: (paymentData: { transactionRef: string }) => void;
  onBack: () => void;
  submitting: boolean;
}

export default function PaymentStep({ 
  paymentMethod, 
  totalAmount, 
  onSubmitPayment, 
  onBack, 
  submitting 
}: PaymentStepProps) {
  const [transactionRef, setTransactionRef] = useState('');
  const { bankAccounts, loading: bankAccountsLoading } = useBankAccounts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitPayment({ transactionRef });
  };

  const getPaymentInstructions = () => {
    if (paymentMethod === 'tmb_bank' || paymentMethod === 'bank_transfer') {
      return {
        title: '🏦 Bank Transfer',
        instructions: 'Please transfer the total amount to our bank account',
        details: 'Ask staff for account details or check the reception desk',
        inputLabel: 'Bank Reference Number',
        inputPlaceholder: 'Enter bank transaction reference',
        inputHelper: 'Reference number from your bank transfer'
      };
    }

    switch (paymentMethod) {
      case 'card':
        return {
          title: '💳 Card Payment',
          instructions: 'Please use your card to complete the payment',
          details: 'Insert or tap your card on the payment terminal',
          inputLabel: 'Card Transaction Reference',
          inputPlaceholder: 'Enter card transaction ID',
          inputHelper: 'Transaction ID from your card payment receipt'
        };
      case 'mobile_money':
        return {
          title: '📱 Mobile Money',
          instructions: 'Send money using your mobile money service',
          details: 'Use your mobile money provider app or USSD code',
          inputLabel: 'Transaction Reference Number',
          inputPlaceholder: 'Enter mobile money transaction ID',
          inputHelper: 'SMS confirmation number you received after sending money'
        };
      case 'cash':
        return {
          title: '💵 Cash Payment',
          instructions: 'Pay with cash at the counter',
          details: 'Please hand the cash to the staff member',
          inputLabel: 'Receipt Number',
          inputPlaceholder: 'Enter receipt number',
          inputHelper: 'Receipt number provided by staff'
        };
      default: {
        // Fallback for any dynamic payment method
        const formattedName = paymentMethod
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
          
        const isMobileMoney = ['vodacom_mpesa', 'orange_money', 'airtel_money'].includes(paymentMethod);

        return {
          title: `Payment via ${formattedName}`,
          instructions: `Complete payment using ${formattedName}`,
          details: 'Please follow standard payment procedures for this method',
          inputLabel: isMobileMoney ? 'Transaction Reference Number' : 'Transaction Reference',
          inputPlaceholder: isMobileMoney ? 'Enter mobile money transaction ID' : 'Enter transaction reference',
          inputHelper: isMobileMoney ? 'SMS confirmation number you received after sending money' : 'Reference number for this payment'
        };
      }
    }
  };

  const paymentInfo = getPaymentInstructions();

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {['tmb_bank', 'bank_transfer'].includes(paymentMethod) 
              ? <CreditCard className="h-5 w-5" /> 
              : paymentMethod === 'card' 
                ? <CreditCard className="h-5 w-5" /> 
                : <Smartphone className="h-5 w-5" />
            }
            {paymentInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Amount */}
          <div className="text-center p-6 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
          </div>

          {/* Payment Instructions */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">{paymentInfo.instructions}</h4>
            <p className="text-sm text-muted-foreground">{paymentInfo.details}</p>
            
            {/* Show Bank Details if applicable */}
            {(['tmb_bank', 'bank_transfer'].includes(paymentMethod) || paymentMethod.includes('bank')) && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium">Bank Account Details:</p>
                {bankAccountsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading bank details...</p>
                ) : bankAccounts.length > 0 ? (
                  <div className="grid gap-3">
                    {bankAccounts.map((account) => (
                      <div key={account.id} className="p-3 rounded border bg-muted/30 text-sm">
                        <p className="font-semibold">{account.bank_name}</p>
                        <div className="text-muted-foreground mt-1 space-y-0.5">
                          <p>Account: {account.account_name}</p>
                          <p>Number: {account.account_number}</p>
                          {account.branch && <p>Branch: {account.branch}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bank account details available.</p>
                )}
              </div>
            )}

            {['mobile_money', 'vodacom_mpesa', 'orange_money', 'airtel_money'].includes(paymentMethod) && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Available Services:</p>
                <p className="text-sm text-muted-foreground">
                  Contact reception for specific payment method details and phone numbers.
                </p>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="transactionRef">
                {paymentInfo.inputLabel}
              </Label>
              <Input
                id="transactionRef"
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder={paymentInfo.inputPlaceholder}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {paymentInfo.inputHelper}
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Order
              </Button>
              <Button type="submit" disabled={submitting || !transactionRef} className="flex-1">
                {submitting ? 'Processing...' : 'Submit Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
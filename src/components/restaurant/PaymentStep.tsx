import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Smartphone } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitPayment({ transactionRef });
  };

  const getPaymentInstructions = () => {
    switch (paymentMethod) {
      case 'card':
        return {
          title: '💳 Card Payment',
          instructions: 'Please use your card to complete the payment',
          details: 'Insert or tap your card on the payment terminal'
        };
      case 'mobile_money':
        return {
          title: '📱 Mobile Money',
          instructions: 'Send money using your mobile money service',
          details: 'Use Vodacom M-Pesa, Orange Money, or Airtel Money'
        };
      default:
        return {
          title: 'Payment Required',
          instructions: 'Please complete the payment',
          details: 'Follow the instructions below'
        };
    }
  };

  const paymentInfo = getPaymentInstructions();

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paymentMethod === 'card' ? <CreditCard className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
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
            
            {paymentMethod === 'mobile_money' && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Available Services:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vodacom M-Pesa: Send to +243 XXX XXX XXX</li>
                  <li>• Orange Money: Send to +243 XXX XXX XXX</li>
                  <li>• Airtel Money: Send to +243 XXX XXX XXX</li>
                </ul>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="transactionRef">
                {paymentMethod === 'card' ? 'Card Transaction Reference' : 'Transaction Reference Number'}
              </Label>
              <Input
                id="transactionRef"
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder={paymentMethod === 'card' ? 'Enter card transaction ID' : 'Enter mobile money transaction ID'}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {paymentMethod === 'card' 
                  ? 'Transaction ID from your card payment receipt'
                  : 'SMS confirmation number you received after sending money'
                }
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
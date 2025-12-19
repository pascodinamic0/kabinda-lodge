import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ConfirmationStepProps {
  orderId: number | null;
  paymentMethod: string;
  onNewOrder: () => void;
}

export default function ConfirmationStep({ 
  orderId, 
  paymentMethod, 
  onNewOrder 
}: ConfirmationStepProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Submitted!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Our team will verify your payment within 30 minutes</li>
              <li>• Once verified, your order will be sent to the kitchen</li>
              <li>• You'll be notified when your order is ready</li>
              <li>• Your order reference is: <span className="font-mono font-semibold">ORD-{orderId}</span></li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">Payment Method: {paymentMethod === 'card' ? 'Card Payment' : 'Mobile Money'}</h3>
            <p className="text-amber-800 text-sm">
              Your payment information has been received and is being processed.
            </p>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={onNewOrder} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Create New Order
            </Button>
            <Button onClick={() => navigate('/restaurant-dashboard')} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
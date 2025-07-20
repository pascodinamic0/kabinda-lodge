import React from "react";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PaymentVerificationComponent from '@/components/shared/PaymentVerificationComponent';

const PaymentVerification = () => {
  return (
    <DashboardLayout>
      <PaymentVerificationComponent 
        title="Payment Verification"
        description="Review and verify payment submissions for hotel bookings"
      />
    </DashboardLayout>
  );
};

export default PaymentVerification;
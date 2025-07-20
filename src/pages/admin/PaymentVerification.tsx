import React from "react";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PaymentVerificationComponent from '@/components/shared/PaymentVerificationComponent';

const PaymentVerification = () => {
  return (
    <DashboardLayout>
      <PaymentVerificationComponent 
        title="All Payments"
        description="Review and verify payment submissions from customers"
      />
    </DashboardLayout>
  );
};

export default PaymentVerification;
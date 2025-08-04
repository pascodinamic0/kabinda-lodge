import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ReceiptData {
  bookingId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomPrice: number;
  totalAmount: number;
  paymentMethod: string;
  transactionRef?: string;
  promotion?: {
    title: string;
    description: string;
    discount_percent: number;
  };
  createdAt: string;
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onClose?: () => void;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ 
  receiptData, 
  onClose 
}) => {
  const [activePromotion, setActivePromotion] = useState<{
    title: string;
    description: string;
    discount_percent: number;
  } | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('');

  useEffect(() => {
    fetchActivePromotion();
    fetchCompanyLogo();
  }, []);

  const fetchActivePromotion = async () => {
    try {
      // Fetch the active promotion setting
      const { data: settingData, error: settingError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'receipt_promotion')
        .eq('category', 'restaurant')
        .maybeSingle();

      if (settingError || !settingData) return;

      const setting = settingData.value as any;
      if (!setting.enabled || !setting.promotion_id) return;

      // Fetch the actual promotion details
      const { data: promotionData, error: promotionError } = await supabase
        .from('promotions')
        .select('title, description, discount_percent, start_date, end_date')
        .eq('id', setting.promotion_id)
        .single();

      if (promotionError || !promotionData) return;

      // Check if promotion is currently active
      const now = new Date();
      const startDate = new Date(promotionData.start_date);
      const endDate = new Date(promotionData.end_date);
      
      if (now >= startDate && now <= endDate) {
        setActivePromotion({
          title: promotionData.title,
          description: promotionData.description || '',
          discount_percent: promotionData.discount_percent
        });
      }
    } catch (error) {
      console.error('Error fetching active promotion:', error);
    }
  };

  const fetchCompanyLogo = async () => {
    try {
      const { data: logoData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('category', 'branding')
        .eq('key', 'company_logo_url')
        .maybeSingle();

      if (logoData?.value) {
        const logoUrl = JSON.parse(logoData.value as string);
        if (logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '') {
          setCompanyLogoUrl(logoUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching company logo:', error);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPos = 20;

    // Company Logo (if available)
    if (companyLogoUrl) {
      // Add logo (note: jsPDF requires base64 or proper image handling for production)
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Company Logo', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
    }

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('HOTEL BOOKING RECEIPT', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt Date: ${format(new Date(), 'PPP')}`, pageWidth / 2, yPos, { align: 'center' });
    doc.text(`Booking ID: HOTEL-${receiptData.bookingId}`, pageWidth / 2, yPos + 10, { align: 'center' });

    yPos += 30;

    // Guest Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GUEST INFORMATION', margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${receiptData.guestName}`, margin, yPos);
    doc.text(`Email: ${receiptData.guestEmail}`, margin, yPos + 10);
    if (receiptData.guestPhone) {
      doc.text(`Phone: ${receiptData.guestPhone}`, margin, yPos + 20);
      yPos += 10;
    }
    yPos += 30;

    // Booking Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING DETAILS', margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Room: ${receiptData.roomName} (${receiptData.roomType})`, margin, yPos);
    doc.text(`Check-in: ${format(new Date(receiptData.checkIn), 'PPP')}`, margin, yPos + 10);
    doc.text(`Check-out: ${format(new Date(receiptData.checkOut), 'PPP')}`, margin, yPos + 20);
    doc.text(`Number of Nights: ${receiptData.nights}`, margin, yPos + 30);
    doc.text(`Rate per Night: $${receiptData.roomPrice}`, margin, yPos + 40);

    yPos += 60;

    // Payment Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INFORMATION', margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${receiptData.paymentMethod === 'cash' ? 'Cash Payment' : receiptData.paymentMethod}`, margin, yPos);
    if (receiptData.transactionRef) {
      doc.text(`Transaction Reference: ${receiptData.transactionRef}`, margin, yPos + 10);
      yPos += 10;
    }
    yPos += 20;

    // Promotion (if any)
    const promotionToShow = activePromotion || receiptData.promotion;
    if (promotionToShow) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SPECIAL PROMOTION', margin, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${promotionToShow.title}`, margin, yPos);
      doc.text(`${promotionToShow.description}`, margin, yPos + 10);
      doc.text(`Discount: ${promotionToShow.discount_percent}% OFF`, margin, yPos + 20);
      yPos += 40;
    }

    // Total Amount
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL AMOUNT: $${receiptData.totalAmount}`, margin, yPos);
    
    yPos += 30;

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing our hotel. We hope you enjoy your stay!', pageWidth / 2, yPos, { align: 'center' });
    doc.text('For any inquiries, please contact our reception desk.', pageWidth / 2, yPos + 10, { align: 'center' });

    // Save the PDF
    doc.save(`receipt-${receiptData.bookingId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Booking Receipt</h2>
            <Button variant="outline" onClick={onClose}>×</Button>
          </div>

          {/* Receipt Preview */}
          <div className="receipt-content bg-white p-8 border border-gray-200 rounded-lg mb-6">
            <div className="text-center mb-8">
              {companyLogoUrl && (
                <div className="mb-4">
                  <img 
                    src={companyLogoUrl} 
                    alt="Company Logo" 
                    className="h-16 w-auto mx-auto object-contain"
                    onError={(e) => {
                      console.error('Failed to load company logo:', companyLogoUrl);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <h1 className="text-3xl font-bold mb-2">HOTEL BOOKING RECEIPT</h1>
              <p className="text-sm text-gray-600">Receipt Date: {format(new Date(), 'PPP')}</p>
              <p className="text-sm text-gray-600">Booking ID: HOTEL-{receiptData.bookingId}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-3">GUEST INFORMATION</h3>
                <p><strong>Name:</strong> {receiptData.guestName}</p>
                <p><strong>Email:</strong> {receiptData.guestEmail}</p>
                {receiptData.guestPhone && <p><strong>Phone:</strong> {receiptData.guestPhone}</p>}
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">BOOKING DETAILS</h3>
                <p><strong>Room:</strong> {receiptData.roomName} ({receiptData.roomType})</p>
                <p><strong>Check-in:</strong> {format(new Date(receiptData.checkIn), 'PPP')}</p>
                <p><strong>Check-out:</strong> {format(new Date(receiptData.checkOut), 'PPP')}</p>
                <p><strong>Nights:</strong> {receiptData.nights}</p>
                <p><strong>Rate per Night:</strong> ${receiptData.roomPrice}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-lg mb-3">PAYMENT INFORMATION</h3>
              <p><strong>Payment Method:</strong> {receiptData.paymentMethod === 'cash' ? 'Cash Payment' : receiptData.paymentMethod}</p>
              {receiptData.transactionRef && (
                <p><strong>Transaction Reference:</strong> {receiptData.transactionRef}</p>
              )}
            </div>

            {(activePromotion || receiptData.promotion) && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-green-800">SPECIAL PROMOTION</h3>
                <p className="font-semibold text-green-700">{(activePromotion || receiptData.promotion)?.title}</p>
                <p className="text-green-600">{(activePromotion || receiptData.promotion)?.description}</p>
                <p className="font-bold text-green-800">Discount: {(activePromotion || receiptData.promotion)?.discount_percent}% OFF</p>
              </div>
            )}

            <div className="border-t-2 border-gray-300 pt-4">
              <div className="text-right">
                <p className="text-2xl font-bold">TOTAL AMOUNT: ${receiptData.totalAmount}</p>
              </div>
            </div>

            <div className="text-center mt-8 text-sm text-gray-600">
              <p>Thank you for choosing our hotel. We hope you enjoy your stay!</p>
              <p>For any inquiries, please contact our reception desk.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={generatePDF} className="flex-1">
              Download PDF
            </Button>
            <Button onClick={printReceipt} variant="outline" className="flex-1">
              Print Receipt
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
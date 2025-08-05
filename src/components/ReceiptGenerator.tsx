import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AppSettingValue } from '../types/common';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
      const { data: settingData, error: settingError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'receipt_promotion')
        .eq('category', 'restaurant')
        .maybeSingle();

      if (settingError || !settingData) return;

      const setting = settingData.value as AppSettingValue;
      if (!setting.enabled || !setting.promotion_id) return;

      // Fetch the actual promotion details
      const { data: promotionData, error: promotionError } = await supabase
        .from('promotions')
        .select('title, description, discount_percent, start_date, end_date')
        .eq('id', parseInt(setting.promotion_id))
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

  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPos = 20;

    // Company Logo (if available)
    if (companyLogoUrl) {
      try {
        // Try to load and add the actual logo image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Create a promise to handle image loading
        const loadImage = () => new Promise((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load logo'));
          img.src = companyLogoUrl;
        });

        try {
          const logoImg = await loadImage() as HTMLImageElement;
          
          // Calculate logo dimensions (max width 60, maintain aspect ratio)
          const maxWidth = 60;
          const maxHeight = 30;
          let logoWidth = logoImg.width;
          let logoHeight = logoImg.height;
          
          // Scale down if too large
          if (logoWidth > maxWidth) {
            const ratio = maxWidth / logoWidth;
            logoWidth = maxWidth;
            logoHeight = logoHeight * ratio;
          }
          if (logoHeight > maxHeight) {
            const ratio = maxHeight / logoHeight;
            logoHeight = maxHeight;
            logoWidth = logoWidth * ratio;
          }
          
          // Center the logo
          const logoX = (pageWidth - logoWidth) / 2;
          
          // Add the logo to PDF
          doc.addImage(logoImg, 'JPEG', logoX, yPos, logoWidth, logoHeight);
          yPos += logoHeight + 10;
        } catch (error) {
          console.warn('Could not add logo image to PDF, using text fallback:', error);
          // Fallback to text
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('COMPANY LOGO', pageWidth / 2, yPos, { align: 'center' });
          yPos += 15;
        }
      } catch (error) {
        console.warn('Logo processing failed:', error);
        // Final fallback
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPANY LOGO', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
      }
    }

    // Company Name Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(t('receipt.company_name', 'KABINDA LODGE'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Receipt Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t('receipt.booking_receipt', 'BOOKING RECEIPT'), pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('receipt.receipt_date', 'Receipt Date')}: ${format(new Date(), 'PPP')}`, pageWidth / 2, yPos, { align: 'center' });
    doc.text(`${t('receipt.booking_id', 'Booking ID')}: KABINDA-${receiptData.bookingId}`, pageWidth / 2, yPos + 10, { align: 'center' });

    yPos += 30;

    // Guest Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('receipt.guest_information', 'GUEST INFORMATION'), margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('receipt.guest_name', 'Name')}: ${receiptData.guestName}`, margin, yPos);
    doc.text(`${t('receipt.guest_email', 'Email')}: ${receiptData.guestEmail}`, margin, yPos + 10);
    if (receiptData.guestPhone) {
      doc.text(`${t('receipt.guest_phone', 'Phone')}: ${receiptData.guestPhone}`, margin, yPos + 20);
      yPos += 10;
    }
    yPos += 30;

    // Booking Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('receipt.booking_details', 'BOOKING DETAILS'), margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('receipt.room_name', 'Room')}: ${receiptData.roomName} (${receiptData.roomType})`, margin, yPos);
    doc.text(`${t('receipt.check_in', 'Check-in')}: ${format(new Date(receiptData.checkIn), 'PPP')}`, margin, yPos + 10);
    doc.text(`${t('receipt.check_out', 'Check-out')}: ${format(new Date(receiptData.checkOut), 'PPP')}`, margin, yPos + 20);
    doc.text(`${t('receipt.nights', 'Number of Nights')}: ${receiptData.nights}`, margin, yPos + 30);
    doc.text(`${t('receipt.room_price', 'Rate per Night')}: $${receiptData.roomPrice}`, margin, yPos + 40);

    yPos += 60;

    // Payment Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('receipt.payment_information', 'PAYMENT INFORMATION'), margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('receipt.payment_method', 'Payment Method')}: ${receiptData.paymentMethod === 'cash' ? t('restaurant.cash', 'Cash Payment') : receiptData.paymentMethod}`, margin, yPos);
    if (receiptData.transactionRef) {
      doc.text(`${t('receipt.transaction_ref', 'Transaction Reference')}: ${receiptData.transactionRef}`, margin, yPos + 10);
      yPos += 10;
    }
    yPos += 20;

    // Promotion (if any)
    const promotionToShow = activePromotion || receiptData.promotion;
    if (promotionToShow) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t('receipt.promotion', 'SPECIAL PROMOTION'), margin, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${promotionToShow.title}`, margin, yPos);
      doc.text(`${promotionToShow.description}`, margin, yPos + 10);
      doc.text(`${t('receipt.discount', 'Discount')}: ${promotionToShow.discount_percent}% OFF`, margin, yPos + 20);
      yPos += 40;
    }

    // Total Amount
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${t('receipt.total_amount', 'TOTAL AMOUNT')}: $${receiptData.totalAmount}`, margin, yPos);
    
    yPos += 30;

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(t('receipt.thank_you', 'Thank you for choosing Kabinda Lodge. We hope you enjoy your stay!'), pageWidth / 2, yPos, { align: 'center' });
    doc.text(t('receipt.contact_info', 'For any inquiries, please contact our reception desk.'), pageWidth / 2, yPos + 10, { align: 'center' });
    doc.text(t('receipt.company_tagline', 'Kabinda Lodge - Luxury Hospitality Experience'), pageWidth / 2, yPos + 20, { align: 'center' });

    // Save the PDF
    doc.save(`receipt-${receiptData.bookingId}.pdf`);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t('receipt.booking_receipt', 'Booking Receipt')}</h2>
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
              <h1 className="text-2xl font-bold mb-1 text-primary">{t('receipt.company_name', 'KABINDA LODGE')}</h1>
              <h2 className="text-xl font-bold mb-2">{t('receipt.booking_receipt', 'BOOKING RECEIPT')}</h2>
              <p className="text-sm text-gray-600">{t('receipt.receipt_date', 'Receipt Date')}: {format(new Date(), 'PPP')}</p>
              <p className="text-sm text-gray-600">{t('receipt.booking_id', 'Booking ID')}: KABINDA-{receiptData.bookingId}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-3">{t('receipt.guest_information', 'GUEST INFORMATION')}</h3>
                <p><strong>{t('receipt.guest_name', 'Name')}:</strong> {receiptData.guestName}</p>
                <p><strong>{t('receipt.guest_email', 'Email')}:</strong> {receiptData.guestEmail}</p>
                {receiptData.guestPhone && <p><strong>{t('receipt.guest_phone', 'Phone')}:</strong> {receiptData.guestPhone}</p>}
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">{t('receipt.booking_details', 'BOOKING DETAILS')}</h3>
                <p><strong>{t('receipt.room_name', 'Room')}:</strong> {receiptData.roomName} ({receiptData.roomType})</p>
                <p><strong>{t('receipt.check_in', 'Check-in')}:</strong> {format(new Date(receiptData.checkIn), 'PPP')}</p>
                <p><strong>{t('receipt.check_out', 'Check-out')}:</strong> {format(new Date(receiptData.checkOut), 'PPP')}</p>
                <p><strong>{t('receipt.nights', 'Nights')}:</strong> {receiptData.nights}</p>
                <p><strong>{t('receipt.room_price', 'Rate per Night')}:</strong> ${receiptData.roomPrice}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-lg mb-3">{t('receipt.payment_information', 'PAYMENT INFORMATION')}</h3>
              <p><strong>{t('receipt.payment_method', 'Payment Method')}:</strong> {receiptData.paymentMethod === 'cash' ? t('restaurant.cash', 'Cash Payment') : receiptData.paymentMethod}</p>
              {receiptData.transactionRef && (
                <p><strong>{t('receipt.transaction_ref', 'Transaction Reference')}:</strong> {receiptData.transactionRef}</p>
              )}
            </div>

            {(activePromotion || receiptData.promotion) && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-green-800">{t('receipt.promotion', 'SPECIAL PROMOTION')}</h3>
                <p className="font-semibold text-green-700">{(activePromotion || receiptData.promotion)?.title}</p>
                <p className="text-green-600">{(activePromotion || receiptData.promotion)?.description}</p>
                <p className="font-bold text-green-800">{t('receipt.discount', 'Discount')}: {(activePromotion || receiptData.promotion)?.discount_percent}% OFF</p>
              </div>
            )}

            <div className="border-t-2 border-gray-300 pt-4">
              <div className="text-right">
                <p className="text-2xl font-bold">{t('receipt.total_amount', 'TOTAL AMOUNT')}: ${receiptData.totalAmount}</p>
              </div>
            </div>

            <div className="text-center mt-8 text-sm text-gray-600">
              <p>{t('receipt.thank_you', 'Thank you for choosing Kabinda Lodge. We hope you enjoy your stay!')}</p>
              <p>{t('receipt.contact_info', 'For any inquiries, please contact our reception desk.')}</p>
              <p className="font-medium text-primary mt-2">{t('receipt.company_tagline', 'Kabinda Lodge - Luxury Hospitality Experience')}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={() => generatePDF().catch(console.error)} className="flex-1">
              {t('action.download', 'Download PDF')}
            </Button>
            <Button onClick={printReceipt} variant="outline" className="flex-1">
              {t('action.print', 'Print Receipt')}
            </Button>
            <Button onClick={onClose} variant="outline">
              {t('action.close', 'Close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
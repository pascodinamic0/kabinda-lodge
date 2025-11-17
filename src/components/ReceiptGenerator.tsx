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
  guestCompany?: string;
  roomName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights?: number; // For hotel bookings
  days?: number; // For conference bookings
  roomPrice: number;
  totalAmount: number;
  paymentMethod: string;
  transactionRef?: string;
  bookingType?: 'hotel' | 'conference'; // To differentiate booking types
  // Conference-specific fields
  eventType?: string;
  eventDurationHours?: number;
  attendees?: number;
  buffetRequired?: boolean;
  buffetPackage?: string;
  specialRequirements?: string;
  promotion?: {
    title: string;
    description: string;
    discount_percent: number;
    discount_type?: 'percentage' | 'fixed';
    discount_amount?: number;
    promotion_type?: 'general' | 'partner';
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
  const FALLBACK_LOGO = '/lovable-uploads/f8b6a78a-996e-4b21-b11f-1e782e469f24.png';

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
      const { data: settings, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'branding')
        .in('key', ['receipt_logo_url', 'company_logo_url']);

      if (error) throw error;

      const parseValue = (raw: unknown): string | null => {
        try {
          if (typeof raw === 'string') {
            let parsed: unknown = null;
            try { parsed = JSON.parse(raw); } catch {}
            if (typeof parsed === 'string') return parsed;
            if (parsed && typeof parsed === 'object' && (parsed as { url?: string }).url) return (parsed as { url?: string }).url || null;
            if (/^(https?:)?\//.test(raw)) return raw;
          } else if (raw && typeof raw === 'object' && (raw as { url?: string }).url) {
            return (raw as { url?: string }).url || null;
          }
        } catch {}
        return null;
      };

      const map = Object.fromEntries((settings || []).map((s: any) => [s.key, s.value]));
      const receiptUrl = parseValue(map['receipt_logo_url']);
      const companyUrl = parseValue(map['company_logo_url']);

      setCompanyLogoUrl(receiptUrl || companyUrl || FALLBACK_LOGO);
    } catch (error) {
      console.error('Error fetching logo settings:', error);
      setCompanyLogoUrl(FALLBACK_LOGO);
    }
  };

  const generatePDF = async () => {
    // A4 dimensions: 210 x 297 mm
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20; // Reduced margin for better centering
    const contentWidth = pageWidth - (2 * margin);
    let yPos = margin + 5;

    // Professional border frame - perfectly centered
    doc.setLineWidth(0.5);
    const borderMargin = 15;
    doc.rect(borderMargin, borderMargin, pageWidth - (2 * borderMargin), pageHeight - (2 * borderMargin));

    // Convert image to base64 for security (no URL exposure)
    const convertImageToBase64 = async (url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> => {
      try {
        // Create a canvas to convert image to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise((resolve, reject) => {
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/png');
            resolve({ dataUrl, format: 'PNG' });
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });
      } catch (e) {
        return null;
      }
    };

    // Professional logo handling with proper A4 scaling - fixed positioning
    const candidateLogos = [companyLogoUrl, FALLBACK_LOGO].filter(Boolean) as string[];
    let addedLogo = false;
    
    for (const url of candidateLogos) {
      // eslint-disable-next-line no-await-in-loop
      const loaded = await convertImageToBase64(url);
      if (loaded) {
        const maxLogoWidth = 35; // mm - reduced for better fit
        const maxLogoHeight = 18; // mm - reduced for better fit
        
        // Create temporary image to get dimensions
        const tmp = new Image();
        tmp.src = loaded.dataUrl;
        // eslint-disable-next-line no-loop-func
        await new Promise((r) => {
          if (tmp.complete) return r(null);
          tmp.onload = () => r(null);
          tmp.onerror = () => r(null);
        });
        
        let logoWidth = maxLogoWidth;
        let logoHeight = maxLogoHeight;
        
        // Maintain aspect ratio with better scaling
        const aspectRatio = tmp.naturalWidth / tmp.naturalHeight;
        if (aspectRatio > 1) {
          logoHeight = logoWidth / aspectRatio;
          if (logoHeight > maxLogoHeight) {
            logoHeight = maxLogoHeight;
            logoWidth = logoHeight * aspectRatio;
          }
        } else {
          logoWidth = logoHeight * aspectRatio;
          if (logoWidth > maxLogoWidth) {
            logoWidth = maxLogoWidth;
            logoHeight = logoWidth / aspectRatio;
          }
        }
        
        // Center logo on page with proper margins
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = yPos;
        doc.addImage(loaded.dataUrl, loaded.format, logoX, logoY, logoWidth, logoHeight);
        yPos += logoHeight + 10;
        addedLogo = true;
        break;
      }
    }
    
    if (!addedLogo) {
      // Professional placeholder
      doc.setFillColor(240, 240, 240);
      doc.rect((pageWidth - 40) / 2, yPos, 40, 20, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('LOGO', pageWidth / 2, yPos + 12, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 28;
    }

    // Professional header with company name
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 64, 175); // Professional blue
    doc.text(t('receipt.company_name', 'KABINDA LODGE'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Receipt title with professional styling
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(t('receipt.booking_receipt', 'OFFICIAL BOOKING RECEIPT'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    // Professional separator line
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    // Receipt metadata
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`${t('receipt.receipt_date', 'Receipt Date')}: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth / 2, yPos, { align: 'center' });
    doc.text(`${t('receipt.receipt_number', 'Receipt No')}: KL-${receiptData.bookingId.toString().padStart(6, '0')}`, pageWidth / 2, yPos + 5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 18;

    // Guest Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('receipt.guest_information', 'GUEST INFORMATION'), margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('receipt.guest_name', 'Name')}: ${receiptData.guestName}`, margin, yPos);
    
    let emailPhoneOffset = 10;
    if (receiptData.guestEmail && receiptData.guestEmail !== 'Not provided') {
      doc.text(`${t('receipt.guest_email', 'Email')}: ${receiptData.guestEmail}`, margin, yPos + emailPhoneOffset);
      emailPhoneOffset += 10;
    }
    
    if (receiptData.guestPhone && receiptData.guestPhone !== 'Not provided') {
      doc.text(`${t('receipt.guest_phone', 'Phone')}: ${receiptData.guestPhone}`, margin, yPos + emailPhoneOffset);
      emailPhoneOffset += 10;
    }
    
    if (receiptData.guestCompany && receiptData.guestCompany !== 'Not provided') {
      doc.text(`${t('receipt.guest_company', 'Company')}: ${receiptData.guestCompany}`, margin, yPos + emailPhoneOffset);
      emailPhoneOffset += 10;
    }
    
    yPos += emailPhoneOffset + 20;

    // Booking Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('receipt.booking_details', 'BOOKING DETAILS'), margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${receiptData.bookingType === 'conference' ? t('receipt.venue', 'Venue') : t('receipt.room_name', 'Room')}: ${receiptData.roomName} (${receiptData.roomType})`, margin, yPos);
    let yOffset = 10;
    if (receiptData.bookingType === 'conference') {
      doc.text(`${t('receipt.event_date', 'Event Date')}: ${format(new Date(receiptData.checkIn), 'PPP')}`, margin, yPos + yOffset);
      yOffset += 10;
      if (receiptData.eventType) {
        doc.text(`${t('receipt.event_type', 'Event Type')}: ${receiptData.eventType}`, margin, yPos + yOffset);
        yOffset += 10;
      }
      if (receiptData.attendees) {
        doc.text(`${t('receipt.attendees', 'Attendees')}: ${receiptData.attendees}`, margin, yPos + yOffset);
        yOffset += 10;
      }
      if (receiptData.eventDurationHours) {
        doc.text(`${t('receipt.duration', 'Duration')}: ${receiptData.eventDurationHours} hours`, margin, yPos + yOffset);
        yOffset += 10;
      }
      doc.text(`${t('receipt.days', 'Number of Days')}: ${receiptData.days || receiptData.nights}`, margin, yPos + yOffset);
      yOffset += 10;
      doc.text(`${t('receipt.daily_rate', 'Rate per Day')}: $${receiptData.roomPrice}`, margin, yPos + yOffset);
    } else {
      doc.text(`${t('receipt.check_in', 'Check-in')}: ${format(new Date(receiptData.checkIn), 'PPP')}`, margin, yPos + 10);
      doc.text(`${t('receipt.check_out', 'Check-out')}: ${format(new Date(receiptData.checkOut), 'PPP')}`, margin, yPos + 20);
      doc.text(`${t('receipt.nights', 'Number of Nights')}: ${receiptData.nights}`, margin, yPos + 30);
      doc.text(`${t('receipt.room_price', 'Rate per Night')}: $${receiptData.roomPrice}`, margin, yPos + 40);
    }

    yPos += 60;

    // Payment Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('receipt.payment_information', 'PAYMENT INFORMATION'), margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('receipt.payment_method', 'Payment Method')}: ${receiptData.paymentMethod}`, margin, yPos);
    if (receiptData.transactionRef) {
      doc.text(`${t('receipt.transaction_ref', 'Transaction Reference')}: ${receiptData.transactionRef}`, margin, yPos + 10);
      yPos += 10;
    }
    yPos += 20;

    // Promotion (only for partner bookings with applied promotions)
    const shouldShowPromotion = receiptData.promotion; // Only show if promotion was specifically applied to booking
    if (shouldShowPromotion) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t('receipt.promotion', 'PARTNER PROMOTION'), margin, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${shouldShowPromotion.title}`, margin, yPos);
      doc.text(`${shouldShowPromotion.description}`, margin, yPos + 10);
      doc.text(`${t('receipt.discount', 'Discount')}: ${shouldShowPromotion.discount_percent}% OFF`, margin, yPos + 20);
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
    doc.text(t('receipt.thank_you', 'Thank you for choosing Kabinda Lodge. We hope you enjoy your stay!'), margin, yPos);
    doc.text(t('receipt.contact_info', 'For any inquiries, please contact our reception desk.'), margin, yPos + 10);
    doc.text(t('receipt.company_tagline', 'Kabinda Lodge - Luxury Hospitality Experience'), margin, yPos + 20);

    // Professional footer with QR code (base64 encoded for security) - fixed for printing
    const footerY = pageHeight - margin - 20;
    
    // Add QR Code for reviews in bottom right (secure base64) - improved for print visibility
    try {
      const qrImage = await convertImageToBase64('/lovable-uploads/06fe353e-dd15-46a5-bd6b-a33b2fd981c3.png');
      if (qrImage) {
        const qrSize = 18; // mm - increased size for better print visibility
        const qrX = pageWidth - qrSize - margin - 5;
        const qrY = footerY - qrSize - 10;
        
        // Professional QR code with white background for print visibility
        doc.setFillColor(255, 255, 255);
        doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 'F');
        
        // Professional QR code border
        doc.setLineWidth(0.3);
        doc.setDrawColor(0, 0, 0);
        doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);
        
        // Add QR image with high quality settings for print
        doc.addImage(qrImage.dataUrl, qrImage.format, qrX, qrY, qrSize, qrSize);
        
        // Professional QR text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(t('receipt.scan_review', 'Scan to Review'), qrX + qrSize/2, qrY + qrSize + 6, { align: 'center' });
      }
    } catch (error) {
      console.error('Failed to add QR code to PDF:', error);
    }
    
    // Professional terms footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('This is an official receipt. Keep for your records.', margin, footerY);
    doc.text('© Kabinda Lodge. All rights reserved.', margin, footerY + 4);

    // Save the PDF
    doc.save(`receipt-${receiptData.bookingId}.pdf`);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t('receipt.booking_receipt', 'Professional Receipt')}</h2>
            <Button variant="outline" onClick={onClose}>×</Button>
          </div>

          {/* Professional Receipt Preview - A4 Styled with Perfect Centering */}
          <div className="receipt-content bg-white shadow-lg border-2 border-gray-300 rounded-lg mb-6 print:shadow-none print:border-none print:rounded-none print:m-0" 
               style={{
                 width: '210mm',
                 minHeight: '297mm',
                 maxWidth: '100%',
                 margin: '0 auto',
                 padding: '20mm',
                 position: 'relative'
               }}>
            {/* Professional border frame - perfectly centered */}
            <div className="absolute" style={{
              top: '15mm',
              left: '15mm',
              right: '15mm',
              bottom: '15mm',
              border: '1px solid #666',
              borderRadius: '2px'
            }}></div>
            
            {/* Content with proper A4 spacing */}
            <div className="relative z-10">
            {/* Professional Header */}
            <div className="text-center mb-8">
              {companyLogoUrl && (
                <div className="mb-6 flex justify-center" style={{ minHeight: '80px' }}>
                  <img 
                    src={companyLogoUrl} 
                    alt="Company Logo" 
                    className="object-contain mx-auto print:max-h-24"
                    style={{ 
                      maxHeight: '80px', 
                      maxWidth: '150px', 
                      width: 'auto', 
                      height: 'auto' 
                    }}
                    onError={(e) => {
                      console.error('Failed to load company logo:', companyLogoUrl);
                      (e.target as HTMLImageElement).src = FALLBACK_LOGO;
                    }}
                  />
                </div>
              )}
              <h1 className="text-3xl font-bold mb-2 text-blue-900">{t('receipt.company_name', 'KABINDA LODGE')}</h1>
              <h2 className="text-xl font-bold mb-4 text-gray-800">{t('receipt.booking_receipt', 'OFFICIAL BOOKING RECEIPT')}</h2>
              <hr className="border-gray-400 mb-4 mx-8" />
              <div className="text-sm text-gray-600 space-y-1">
                <p>{t('receipt.receipt_date', 'Receipt Date')}: {format(new Date(), 'dd/MM/yyyy')}</p>
                <p className="font-semibold">{t('receipt.receipt_number', 'Receipt No')}: KL-{receiptData.bookingId.toString().padStart(6, '0')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-3">{t('receipt.guest_information', 'GUEST INFORMATION')}</h3>
                <p><strong>{t('receipt.guest_name', 'Name')}:</strong> {receiptData.guestName}</p>
                {receiptData.guestEmail && receiptData.guestEmail !== 'Not provided' && <p><strong>{t('receipt.guest_email', 'Email')}:</strong> {receiptData.guestEmail}</p>}
                {receiptData.guestPhone && receiptData.guestPhone !== 'Not provided' && <p><strong>{t('receipt.guest_phone', 'Phone')}:</strong> {receiptData.guestPhone}</p>}
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">{receiptData.bookingType === 'conference' ? t('receipt.event_details', 'EVENT DETAILS') : t('receipt.booking_details', 'BOOKING DETAILS')}</h3>
                <p><strong>{receiptData.bookingType === 'conference' ? t('receipt.venue', 'Venue') : t('receipt.room_name', 'Room')}:</strong> {receiptData.roomName} ({receiptData.roomType})</p>
                {receiptData.bookingType === 'conference' ? (
                  <>
                    <p><strong>{t('receipt.event_date', 'Event Date')}:</strong> {format(new Date(receiptData.checkIn), 'PPP')}</p>
                    {receiptData.eventType && <p><strong>{t('receipt.event_type', 'Event Type')}:</strong> {receiptData.eventType}</p>}
                    {receiptData.attendees && <p><strong>{t('receipt.attendees', 'Number of Attendees')}:</strong> {receiptData.attendees}</p>}
                    {receiptData.eventDurationHours && <p><strong>{t('receipt.duration', 'Duration')}:</strong> {receiptData.eventDurationHours} hours</p>}
                    <p><strong>{t('receipt.days', 'Booking Days')}:</strong> {receiptData.days || receiptData.nights}</p>
                    <p><strong>{t('receipt.daily_rate', 'Rate per Day')}:</strong> ${receiptData.roomPrice}</p>
                  </>
                ) : (
                  <>
                    <p><strong>{t('receipt.check_in', 'Check-in')}:</strong> {format(new Date(receiptData.checkIn), 'PPP')}</p>
                    <p><strong>{t('receipt.check_out', 'Check-out')}:</strong> {format(new Date(receiptData.checkOut), 'PPP')}</p>
                    <p><strong>{t('receipt.nights', 'Nights')}:</strong> {receiptData.nights}</p>
                    <p><strong>{t('receipt.room_price', 'Rate per Night')}:</strong> ${receiptData.roomPrice}</p>
                  </>
                )}
              </div>
            </div>

            {/* Conference-specific sections */}
            {receiptData.bookingType === 'conference' && (
              <>
                {/* Buffet Information */}
                {receiptData.buffetRequired && (
                  <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-lg mb-3 text-blue-800">{t('receipt.buffet_service', 'BUFFET SERVICE')}</h3>
                    <p><strong>{t('receipt.buffet_included', 'Buffet Included')}:</strong> Yes</p>
                    {receiptData.buffetPackage && <p><strong>{t('receipt.buffet_package', 'Selected Package')}:</strong> {receiptData.buffetPackage}</p>}
                  </div>
                )}

                {/* Special Requirements */}
                {receiptData.specialRequirements && receiptData.specialRequirements.trim() && (
                  <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-bold text-lg mb-3">{t('receipt.special_requirements', 'SPECIAL REQUIREMENTS')}</h3>
                    <p className="whitespace-pre-wrap">{receiptData.specialRequirements}</p>
                  </div>
                )}
              </>
            )}

            <div className="mb-8">
              <h3 className="font-bold text-lg mb-3">{t('receipt.payment_information', 'PAYMENT INFORMATION')}</h3>
              <p><strong>{t('receipt.payment_method', 'Payment Method')}:</strong> {receiptData.paymentMethod}</p>
              {receiptData.transactionRef && (
                <p><strong>{t('receipt.transaction_ref', 'Transaction Reference')}:</strong> {receiptData.transactionRef}</p>
              )}
            </div>

            {/* Display promotion ONLY if guest is a PARTNER CLIENT (has company) and promotion is partner type */}
            {receiptData.promotion && 
             receiptData.promotion.promotion_type === 'partner' && 
             receiptData.guestCompany && 
             receiptData.guestCompany.trim() !== '' && 
             receiptData.guestCompany !== 'Not provided' && (
              <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-yellow-800">{t('receipt.promotion', 'PARTNER PROMOTION')}</h3>
                <p className="font-semibold text-yellow-700">{receiptData.promotion.title}</p>
                <p className="text-yellow-600">{receiptData.promotion.description}</p>
                <p className="font-bold text-yellow-800">
                  {t('receipt.discount', 'Discount')}: {
                    receiptData.promotion.discount_type === 'fixed' && receiptData.promotion.discount_amount
                      ? `$${receiptData.promotion.discount_amount} OFF`
                      : `${receiptData.promotion.discount_percent}% OFF`
                  }
                </p>
              </div>
            )}

            <div className="border-t-2 border-gray-300 pt-4">
              <div className="text-right">
                <p className="text-2xl font-bold">{t('receipt.total_amount', 'TOTAL AMOUNT')}: ${receiptData.totalAmount}</p>
              </div>
            </div>

            {/* Professional Footer */}
            <div className="flex justify-between items-end mt-12 pt-6 border-t border-gray-300">
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">{t('receipt.thank_you', 'Thank you for choosing Kabinda Lodge.')}</p>
                <p>{t('receipt.contact_info', 'For inquiries, contact our reception.')}</p>
                <p className="text-xs text-gray-500 mt-3">This is an official receipt. Keep for your records.</p>
                <p className="text-xs text-gray-500">© Kabinda Lodge. All rights reserved.</p>
              </div>
              {/* QR Code for reviews - Enhanced for Print Visibility */}
              <div className="text-center bg-white p-3 border-2 border-black rounded print:bg-white print:border-black">
                <img 
                  src="/lovable-uploads/06fe353e-dd15-46a5-bd6b-a33b2fd981c3.png" 
                  alt="Review QR Code" 
                  className="w-16 h-16 mx-auto mb-1 print:opacity-100 print:contrast-more print:brightness-100"
                  style={{ 
                    filter: 'contrast(1.3) brightness(1.2)',
                    imageRendering: 'crisp-edges'
                  }}
                />
                <p className="text-xs font-bold text-black print:text-black">{t('receipt.scan_review', 'Scan to Review')}</p>
              </div>
            </div>
          </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button onClick={() => generatePDF().catch(console.error)} className="flex-1 bg-blue-600 hover:bg-blue-700">
              📄 {t('receipt.download_pdf', 'Download PDF')}
            </Button>
            <Button onClick={printReceipt} variant="outline" className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50">
              🖨️ {t('receipt.print', 'Print Receipt')}
            </Button>
            <Button onClick={onClose} variant="outline">
              {t('action.close', 'Close')}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Print-specific CSS */}
      <style>{`
          @media print {
            .receipt-content {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 20mm !important;
              box-shadow: none !important;
              border: none !important;
            }
            
            @page {
              size: A4;
              margin: 0;
            }
            
            body * {
              visibility: hidden;
            }
            
            .receipt-content, .receipt-content * {
              visibility: visible;
            }
            
            .receipt-content {
              position: absolute;
              left: 0;
              top: 0;
            }
            
            /* Ensure QR code prints well */
            img[alt="Review QR Code"] {
              opacity: 1 !important;
              filter: contrast(1.5) brightness(1.3) !important;
              image-rendering: crisp-edges !important;
            }
          }
      `}</style>
    </div>
  );
};
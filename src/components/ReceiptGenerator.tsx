import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AppSettingValue } from '../types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin } from 'lucide-react';

interface ReceiptData {
  bookingId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCompany?: string;
  guestIdType?: string;
  guestIdNumber?: string;
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
    let yPos = margin + 15; // Lowered logo position for better visibility

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
        const maxLogoWidth = 60; // mm - increased for better visibility
        const maxLogoHeight = 40; // mm - increased for better visibility
        
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

    // Professional header with company name - Brand burgundy color
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    // Brand primary color: hsl(345, 70%, 35%) = rgb(89, 27, 45)
    doc.setTextColor(89, 27, 45);
    doc.text(t('receipt.company_name', 'KABINDA LODGE'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Receipt title with brand accent color
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    // Brand accent color: hsl(40, 85%, 60%) = rgb(255, 200, 77)
    doc.setTextColor(255, 200, 77);
    // Draw background box for title
    const titleWidth = doc.getTextWidth(t('receipt.booking_receipt', 'OFFICIAL BOOKING RECEIPT'));
    doc.setFillColor(255, 200, 77);
    doc.roundedRect((pageWidth - titleWidth - 20) / 2, yPos - 4, titleWidth + 20, 8, 2, 2, 'F');
    doc.setTextColor(30, 15, 15); // Dark text on gold background
    doc.text(t('receipt.booking_receipt', 'OFFICIAL BOOKING RECEIPT'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    // Receipt metadata with brand styling
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`${t('receipt.receipt_date', 'Receipt Date')}: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth / 2, yPos, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(89, 27, 45); // Brand primary
    doc.text(`${t('receipt.receipt_number', 'Receipt No')}: KL-${receiptData.bookingId.toString().padStart(6, '0')}`, pageWidth / 2, yPos + 5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 18;

    // Guest Information - Brand styled section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(89, 27, 45); // Brand primary
    doc.text(t('receipt.guest_information', 'GUEST INFORMATION'), margin, yPos);
    // Draw underline
    doc.setDrawColor(89, 27, 45);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, margin + 60, yPos + 2);
    doc.setTextColor(0, 0, 0);
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
    
    if (receiptData.guestIdType && receiptData.guestIdType !== 'N/A') {
      doc.text(`${t('receipt.id_type', 'ID Type')}: ${receiptData.guestIdType}`, margin, yPos + emailPhoneOffset);
      emailPhoneOffset += 10;
    }
    
    if (receiptData.guestIdNumber && receiptData.guestIdNumber !== 'N/A') {
      doc.text(`${t('receipt.id_number', 'ID Number')}: ${receiptData.guestIdNumber}`, margin, yPos + emailPhoneOffset);
      emailPhoneOffset += 10;
    }
    
    yPos += emailPhoneOffset + 20;

    // Booking Details - Brand styled section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    // Brand accent color for booking details
    doc.setTextColor(255, 200, 77);
    doc.text(t('receipt.booking_details', 'BOOKING DETAILS'), margin, yPos);
    // Draw underline
    doc.setDrawColor(255, 200, 77);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, margin + 60, yPos + 2);
    doc.setTextColor(0, 0, 0);
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

    // Payment Information - Brand styled section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(89, 27, 45); // Brand primary
    doc.text(t('receipt.payment_information', 'PAYMENT INFORMATION'), margin, yPos);
    // Draw underline
    doc.setDrawColor(89, 27, 45);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, margin + 60, yPos + 2);
    doc.setTextColor(0, 0, 0);
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

    // Total Amount - Prominent brand styling
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    // Draw background box with brand primary gradient effect
    const totalText = `${t('receipt.total_amount', 'TOTAL AMOUNT')}: $${receiptData.totalAmount}`;
    const totalTextWidth = doc.getTextWidth(totalText);
    doc.setFillColor(89, 27, 45); // Brand primary
    doc.roundedRect(margin - 5, yPos - 8, totalTextWidth + 10, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); // White text on burgundy background
    doc.text(totalText, margin, yPos);
    
    yPos += 30;

    // Footer - Text on left side (50% width)
    const footerTextWidth = (pageWidth - (2 * margin)) / 2; // 50% of content width
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(t('receipt.thank_you', 'Thank you for choosing Kabinda Lodge. We hope you enjoy your stay!'), margin, yPos, { maxWidth: footerTextWidth });
    yPos += 10;
    
    // Internet access message
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const internetMessage = t('receipt.internet_access', 'Tous les clients séjournant dans notre hôtel ont accès à un internet super rapide basé sur satellite. Présentez simplement vos appareils à l\'un de nos membres du personnel pour obtenir l\'accès à la connexion.');
    // Split long text into multiple lines if needed (constrained to 50% width)
    const splitText = doc.splitTextToSize(internetMessage, footerTextWidth);
    doc.text(splitText, margin, yPos, { maxWidth: footerTextWidth });
    yPos += splitText.length * 6;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(t('receipt.contact_info', 'For any inquiries, please contact our reception desk.'), margin, yPos, { maxWidth: footerTextWidth });
    doc.text(t('receipt.company_tagline', 'Kabinda Lodge - Luxury Hospitality Experience'), margin, yPos + 10, { maxWidth: footerTextWidth });

    // Professional footer with QR code (base64 encoded for security) - fixed for printing
    const footerY = pageHeight - margin - 20;
    
    // Add QR Code for reviews in bottom right (secure base64) - improved for print visibility
    try {
      // Try QR code image with multiple fallback paths
      let qrImage = await convertImageToBase64('/lovable-uploads/Kaninda Lodge QR Code.jpg');
      if (!qrImage) {
        // Try URL encoded version
        qrImage = await convertImageToBase64('/lovable-uploads/Kaninda%20Lodge%20QR%20Code.jpg');
      }
      if (!qrImage) {
        qrImage = await convertImageToBase64('/lovable-uploads/qr-code-review.png');
      }
      if (!qrImage) {
        qrImage = await convertImageToBase64('/lovable-uploads/06fe353e-dd15-46a5-bd6b-a33b2fd981c3.png');
      }
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
        doc.text(t('receipt.scan_review', 'Scanner'), qrX + qrSize/2, qrY + qrSize + 6, { align: 'center' });
        
        // Contact information below QR code
        const contactY = qrY + qrSize + 15;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(t('receipt.reception_phone', 'Réception'), qrX + qrSize/2, contactY, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text('+243 97 405 58 70', qrX + qrSize/2, contactY + 5, { align: 'center' });
        doc.text('kabindalodge@gmail.com', qrX + qrSize/2, contactY + 10, { align: 'center' });
        const addressText = doc.splitTextToSize(t('receipt.address', 'Avenue Lumuba, Kabinda, DRC Congo'), qrSize + 4);
        doc.text(addressText, qrX + qrSize/2, contactY + 15, { align: 'center' });
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

          {/* Professional Receipt Preview - A4 Styled with Brand Colors */}
          <div className="receipt-content bg-white shadow-elegant mb-6 print:shadow-none print:m-0" 
               style={{
                 width: '210mm',
                 height: '297mm',
                 maxWidth: '100%',
                 margin: '0 auto',
                 padding: '5mm',
                 position: 'relative',
                 border: '2px solid hsl(var(--primary))',
                 borderRadius: '8px',
                 background: 'linear-gradient(to bottom, hsl(var(--background)), white)',
                 boxSizing: 'border-box',
                 overflow: 'hidden'
               }}>
            {/* Content with proper A4 spacing */}
            <div className="relative z-10 print:pt-1" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Professional Header with Brand Styling */}
            <div className="text-center mb-2 print:mb-1 relative">
              {companyLogoUrl && (
                <div className="mb-1 flex justify-center print:mb-0.5 receipt-logo-container" style={{ minHeight: '50px', marginTop: '2px' }}>
                  <img 
                    src={companyLogoUrl} 
                    alt="Company Logo" 
                    className="object-contain mx-auto print:max-h-12 receipt-logo drop-shadow-warm"
                    style={{ 
                      maxHeight: '50px', 
                      maxWidth: '150px', 
                      width: 'auto', 
                      height: 'auto',
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                    }}
                    onError={(e) => {
                      console.error('Failed to load company logo:', companyLogoUrl);
                      (e.target as HTMLImageElement).src = FALLBACK_LOGO;
                    }}
                  />
                </div>
              )}
              
              {/* Company Name with Brand Colors */}
              <h1 className="text-lg print:text-base font-bold mb-1 tracking-wide" style={{ 
                color: 'hsl(var(--primary))',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                letterSpacing: '0.05em'
              }}>
                {t('receipt.company_name', 'KABINDA LODGE')}
              </h1>
              
              {/* Receipt Title with Accent */}
              <div className="inline-block px-2 py-0.5 mb-1 rounded-full" style={{ 
                background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))',
                boxShadow: '0 2px 8px hsl(var(--accent) / 0.3)'
              }}>
                <h2 className="text-xs print:text-[10px] font-bold text-white tracking-wide">
                  {t('receipt.booking_receipt', 'OFFICIAL BOOKING RECEIPT')}
                </h2>
              </div>
              
              {/* Receipt Metadata with Brand Styling */}
              <div className="flex justify-center gap-2 mt-1 print:mt-0.5">
                <div className="px-4 py-2 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">{t('receipt.receipt_date', 'Receipt Date')}</p>
                  <p className="text-sm font-semibold text-foreground">{format(new Date(), 'dd/MM/yyyy')}</p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">{t('receipt.receipt_number', 'Receipt No')}</p>
                  <p className="text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>
                    KL-{receiptData.bookingId.toString().padStart(6, '0')}
                  </p>
                </div>
              </div>
            </div>

            {/* Information Sections with Brand Styling */}
            <div className="grid grid-cols-2 gap-2 mb-2 print:mb-1">
              {/* Guest Information Card */}
              <div className="p-1.5 print:p-1 rounded-lg border-2" style={{ 
                borderColor: 'hsl(var(--primary) / 0.2)',
                background: 'linear-gradient(to bottom right, hsl(var(--secondary)), white)',
                boxShadow: '0 2px 8px hsl(var(--primary) / 0.1)'
              }}>
                <h3 className="font-bold text-xs print:text-[10px] mb-1 pb-0.5 border-b-2" style={{ 
                  borderColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary))',
                  letterSpacing: '0.05em'
                }}>
                  {t('receipt.guest_information', 'GUEST INFORMATION')}
                </h3>
                <div className="space-y-0.5 text-[10px] print:text-[9px]">
                  <div className="flex justify-between">
                    <span className="font-semibold text-muted-foreground">{t('receipt.guest_name', 'Name')}:</span>
                    <span className="font-medium text-foreground">{receiptData.guestName}</span>
                  </div>
                  {receiptData.guestEmail && receiptData.guestEmail !== 'Not provided' && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-muted-foreground">{t('receipt.guest_email', 'Email')}:</span>
                      <span className="text-foreground break-all text-right">{receiptData.guestEmail}</span>
                    </div>
                  )}
                  {receiptData.guestPhone && receiptData.guestPhone !== 'Not provided' && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-muted-foreground">{t('receipt.guest_phone', 'Phone')}:</span>
                      <span className="text-foreground">{receiptData.guestPhone}</span>
                    </div>
                  )}
                  {receiptData.guestCompany && receiptData.guestCompany !== 'Not provided' && receiptData.guestCompany.trim() !== '' && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-muted-foreground">{t('receipt.guest_company', 'Company')}:</span>
                      <span className="text-foreground">{receiptData.guestCompany}</span>
                    </div>
                  )}
                  {receiptData.guestIdType && receiptData.guestIdType !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-muted-foreground">{t('receipt.id_type', 'ID Type')}:</span>
                      <span className="text-foreground">{receiptData.guestIdType}</span>
                    </div>
                  )}
                  {receiptData.guestIdNumber && receiptData.guestIdNumber !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-muted-foreground">{t('receipt.id_number', 'ID Number')}:</span>
                      <span className="text-foreground font-mono text-xs">{receiptData.guestIdNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details Card */}
              <div className="p-1.5 print:p-1 rounded-lg border-2" style={{ 
                borderColor: 'hsl(var(--accent) / 0.3)',
                background: 'linear-gradient(to bottom left, hsl(var(--secondary)), white)',
                boxShadow: '0 2px 8px hsl(var(--accent) / 0.1)'
              }}>
                <h3 className="font-bold text-xs print:text-[10px] mb-1 pb-0.5 border-b-2" style={{ 
                  borderColor: 'hsl(var(--accent))',
                  color: 'hsl(var(--accent-foreground))',
                  letterSpacing: '0.05em'
                }}>
                  {receiptData.bookingType === 'conference' ? t('receipt.event_details', 'EVENT DETAILS') : t('receipt.booking_details', 'BOOKING DETAILS')}
                </h3>
                <div className="space-y-0.5 text-[10px] print:text-[9px]">
                  <div className="flex justify-between">
                    <span className="font-semibold text-muted-foreground">
                      {receiptData.bookingType === 'conference' ? t('receipt.venue', 'Venue') : t('receipt.room_name', 'Room')}:
                    </span>
                    <span className="font-medium text-foreground">{receiptData.roomName} ({receiptData.roomType})</span>
                  </div>
                {receiptData.bookingType === 'conference' ? (
                  <>
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">{t('receipt.event_date', 'Event Date')}:</span>
                        <span className="text-foreground">{format(new Date(receiptData.checkIn), 'PPP')}</span>
                      </div>
                      {receiptData.eventType && (
                        <div className="flex justify-between">
                          <span className="font-semibold text-muted-foreground">{t('receipt.event_type', 'Event Type')}:</span>
                          <span className="text-foreground">{receiptData.eventType}</span>
                        </div>
                      )}
                      {receiptData.attendees && (
                        <div className="flex justify-between">
                          <span className="font-semibold text-muted-foreground">{t('receipt.attendees', 'Number of Attendees')}:</span>
                          <span className="text-foreground">{receiptData.attendees}</span>
                        </div>
                      )}
                      {receiptData.eventDurationHours && (
                        <div className="flex justify-between">
                          <span className="font-semibold text-muted-foreground">{t('receipt.duration', 'Duration')}:</span>
                          <span className="text-foreground">{receiptData.eventDurationHours} hours</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">{t('receipt.days', 'Booking Days')}:</span>
                        <span className="text-foreground">{receiptData.days || receiptData.nights}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">{t('receipt.daily_rate', 'Rate per Day')}:</span>
                        <span className="font-semibold text-foreground">${receiptData.roomPrice}</span>
                      </div>
                  </>
                ) : (
                  <>
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">{t('receipt.check_in', 'Check-in')}:</span>
                        <span className="text-foreground">{format(new Date(receiptData.checkIn), 'PPP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">{t('receipt.check_out', 'Check-out')}:</span>
                        <span className="text-foreground">{format(new Date(receiptData.checkOut), 'PPP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">{t('receipt.nights', 'Nights')}:</span>
                        <span className="text-foreground">{receiptData.nights}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">{t('receipt.room_price', 'Rate per Night')}:</span>
                        <span className="font-semibold text-foreground">${receiptData.roomPrice}</span>
                      </div>
                  </>
                )}
                </div>
              </div>
            </div>

            {/* Conference-specific sections */}
            {receiptData.bookingType === 'conference' && (
              <>
                {/* Buffet Information */}
                {receiptData.buffetRequired && (
                  <div className="mb-2 print:mb-1 p-1.5 print:p-1 rounded-lg border-2" style={{ 
                    borderColor: 'hsl(var(--accent) / 0.3)',
                    background: 'linear-gradient(to bottom right, hsl(var(--accent) / 0.1), white)',
                    boxShadow: '0 2px 8px hsl(var(--accent) / 0.15)'
                  }}>
                    <h3 className="font-bold text-xs print:text-[10px] mb-1 pb-0.5 border-b-2" style={{ 
                      borderColor: 'hsl(var(--accent))',
                      color: 'hsl(var(--accent-foreground))',
                      letterSpacing: '0.05em'
                    }}>
                      {t('receipt.buffet_service', 'BUFFET SERVICE')}
                    </h3>
                    <div className="space-y-0.5 text-[10px] print:text-[9px]">
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">{t('receipt.buffet_included', 'Buffet Included')}:</span>
                        <span className="font-medium text-foreground">Yes</span>
                      </div>
                      {receiptData.buffetPackage && (
                        <div className="flex justify-between">
                          <span className="font-semibold text-muted-foreground">{t('receipt.buffet_package', 'Selected Package')}:</span>
                          <span className="font-medium text-foreground">{receiptData.buffetPackage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Special Requirements */}
                {receiptData.specialRequirements && receiptData.specialRequirements.trim() && (
                  <div className="mb-2 print:mb-1 p-1.5 print:p-1 rounded-lg border-2" style={{ 
                    borderColor: 'hsl(var(--muted-foreground) / 0.2)',
                    background: 'hsl(var(--muted))',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h3 className="font-bold text-xs print:text-[10px] mb-1 pb-0.5 border-b-2" style={{ 
                      borderColor: 'hsl(var(--muted-foreground) / 0.3)',
                      color: 'hsl(var(--foreground))',
                      letterSpacing: '0.05em'
                    }}>
                      {t('receipt.special_requirements', 'SPECIAL REQUIREMENTS')}
                    </h3>
                    <p className="whitespace-pre-wrap text-[10px] print:text-[9px] text-foreground">{receiptData.specialRequirements}</p>
                  </div>
                )}
              </>
            )}

            {/* Payment Information Card */}
            <div className="mb-2 print:mb-1 p-1.5 print:p-1 rounded-lg border-2" style={{ 
              borderColor: 'hsl(var(--primary) / 0.2)',
              background: 'hsl(var(--muted))',
              boxShadow: '0 2px 8px hsl(var(--primary) / 0.1)'
            }}>
              <h3 className="font-bold text-xs print:text-[10px] mb-1 pb-0.5 border-b-2" style={{ 
                borderColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary))',
                letterSpacing: '0.05em'
              }}>
                {t('receipt.payment_information', 'PAYMENT INFORMATION')}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[10px] print:text-[9px]">
                <div>
                  <span className="font-semibold text-muted-foreground">{t('receipt.payment_method', 'Payment Method')}:</span>
                  <p className="font-medium text-foreground mt-1">{receiptData.paymentMethod}</p>
                </div>
              {receiptData.transactionRef && (
                  <div>
                    <span className="font-semibold text-muted-foreground">{t('receipt.transaction_ref', 'Transaction Reference')}:</span>
                    <p className="font-mono text-xs text-foreground mt-1">{receiptData.transactionRef}</p>
                  </div>
              )}
              </div>
            </div>

            {/* Display promotion ONLY if guest is a PARTNER CLIENT (has company) and promotion is partner type */}
            {receiptData.promotion && 
             receiptData.promotion.promotion_type === 'partner' && 
             receiptData.guestCompany && 
             receiptData.guestCompany.trim() !== '' && 
             receiptData.guestCompany !== 'Not provided' && (
              <div className="mb-2 print:mb-1 p-1.5 print:p-1 rounded-lg border-2" style={{ 
                borderColor: 'hsl(var(--accent) / 0.4)',
                background: 'linear-gradient(135deg, hsl(var(--accent) / 0.15), hsl(var(--accent) / 0.05))',
                boxShadow: '0 4px 12px hsl(var(--accent) / 0.2)'
              }}>
                <h3 className="font-bold text-xs print:text-[10px] mb-1 pb-0.5 border-b-2" style={{ 
                  borderColor: 'hsl(var(--accent))',
                  color: 'hsl(var(--accent-foreground))',
                  letterSpacing: '0.05em'
                }}>
                  {t('receipt.promotion', 'PARTNER PROMOTION')}
                </h3>
                <div className="space-y-0.5 text-[10px] print:text-[9px]">
                  <p className="font-semibold text-foreground">{receiptData.promotion.title}</p>
                  <p className="text-muted-foreground">{receiptData.promotion.description}</p>
                  <div className="pt-2 mt-2 border-t" style={{ borderColor: 'hsl(var(--accent) / 0.3)' }}>
                    <p className="font-bold text-lg" style={{ color: 'hsl(var(--accent-foreground))' }}>
                  {t('receipt.discount', 'Discount')}: {
                    receiptData.promotion.discount_type === 'fixed' && receiptData.promotion.discount_amount
                      ? `$${receiptData.promotion.discount_amount} OFF`
                      : `${receiptData.promotion.discount_percent}% OFF`
                  }
                </p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Amount - Prominent Display */}
            <div className="mb-2 print:mb-1 p-2 print:p-1.5 rounded-lg text-right" style={{ 
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
              boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)'
            }}>
              <p className="text-base print:text-sm font-bold text-white tracking-wide">
                {t('receipt.total_amount', 'TOTAL AMOUNT')}: ${receiptData.totalAmount}
              </p>
            </div>

            {/* Professional Footer */}
            <div className="flex flex-col mt-2 print:mt-1 pt-1 print:pt-0.5 border-t-2 gap-1 print:gap-0.5" style={{ borderColor: 'hsl(var(--primary) / 0.2)', flex: '1', minHeight: '0' }}>
              {/* Text Section - Full Width */}
              <div className="text-[10px] print:text-[9px] space-y-0.5 print:space-y-0 p-1 print:p-0.5 rounded-lg w-full" style={{ 
                background: 'hsl(var(--secondary))',
                border: '1px solid hsl(var(--border))'
              }}>
                <p className="font-semibold print:text-[9px]" style={{ color: 'hsl(var(--primary))' }}>
                  {t('receipt.thank_you', 'Thank you for choosing Kabinda Lodge.')}
                </p>
                <p className="text-[8px] print:text-[7px] text-muted-foreground leading-tight">
                  {t('receipt.internet_access', 'Tous les clients séjournant dans notre hôtel ont accès à un internet super rapide basé sur satellite. Présentez simplement vos appareils à l\'un de nos membres du personnel pour obtenir l\'accès à la connexion.')}
                </p>
                <p className="text-[8px] print:text-[7px] text-muted-foreground mt-0.5">{t('receipt.contact_info', 'For inquiries, contact our reception.')}</p>
                <div className="pt-0.5 mt-0.5 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                  <p className="text-[7px] print:text-[6px] text-muted-foreground">This is an official receipt. Keep for your records.</p>
                  <p className="text-[7px] print:text-[6px] text-muted-foreground">© Kabinda Lodge. All rights reserved.</p>
                </div>
              </div>
              
              {/* QR Code - Centered */}
              <div className="flex justify-center">
                <div className="text-center bg-white rounded-lg border-2" style={{ 
                  borderColor: 'hsl(var(--primary) / 0.3)',
                  boxShadow: '0 2px 8px hsl(var(--primary) / 0.1)',
                  width: '120px',
                  maxWidth: '100%'
                }}>
                  <div className="bg-white w-full flex items-center justify-center rounded" style={{ height: '80px', padding: '4px', boxSizing: 'border-box' }}>
                    <img 
                      src="/lovable-uploads/Kaninda%20Lodge%20QR%20Code.jpg"
                  alt="Review QR Code" 
                      className="print:opacity-100 print:contrast-more print:brightness-100"
                  style={{ 
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                    filter: 'contrast(1.3) brightness(1.2)',
                        imageRendering: 'crisp-edges',
                        display: 'block'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error('QR code image failed to load:', target.src);
                        // Try fallback paths with different encodings and names
                        if (target.src.includes('Kaninda') || target.src.includes('QR')) {
                          // Try with spaces (unencoded)
                          target.src = '/lovable-uploads/Kaninda Lodge QR Code.jpg';
                        } else if (target.src.includes('Kaninda Lodge')) {
                          // Try lowercase version
                          target.src = '/lovable-uploads/kaninda lodge qr code.jpg';
                        } else if (target.src.includes('qr-code-review.png')) {
                          // Try old QR code path
                          target.src = '/lovable-uploads/06fe353e-dd15-46a5-bd6b-a33b2fd981c3.png';
                        } else {
                          // Show helpful placeholder with instructions
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.qr-placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'qr-placeholder';
                            placeholder.style.cssText = 'width: 100%; height: 100%; background: #f0f0f0; border: 1px dashed #999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 9px; color: #666; text-align: center; padding: 4px;';
                            placeholder.innerHTML = 'QR Code<br/>Image Not Found<br/><span style="font-size: 8px;">Check file name</span>';
                            parent.appendChild(placeholder);
                          }
                        }
                      }}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Remove placeholder if image loads successfully
                        const parent = target.parentElement;
                        const placeholder = parent?.querySelector('.qr-placeholder');
                        if (placeholder) {
                          placeholder.remove();
                        }
                        console.log('QR code image loaded successfully:', target.src);
                      }}
                    />
                  </div>
                  <p className="text-[10px] print:text-[9px] font-bold py-0.5 px-1" style={{ color: 'hsl(var(--primary))' }}>
                    {t('receipt.scan_review', 'Scanner')}
                  </p>
                </div>
              </div>
              
              {/* Contact Information - Horizontal, Centered */}
              <div className="flex justify-center items-center gap-2 print:gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 text-[9px] print:text-[8px]">
                  <Phone className="h-2.5 w-2.5 print:h-2 print:w-2 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                  <p className="text-[7px] print:text-[6px] text-foreground">+243 97 405 58 70</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] print:text-[8px]">
                  <Mail className="h-2.5 w-2.5 print:h-2 print:w-2 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                  <p className="text-[7px] print:text-[6px] text-foreground break-words">kabindalodge@gmail.com</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] print:text-[8px]">
                  <MapPin className="h-2.5 w-2.5 print:h-2 print:w-2 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                  <p className="text-[7px] print:text-[6px] text-foreground break-words">{t('receipt.address', 'Avenue Lumuba, Kabinda, DRC Congo')}</p>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-8 pt-6 border-t border-gray-200">
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
            @page {
              size: A4;
              margin: 10mm 5mm;
            }
            
            .receipt-content {
              width: 200mm !important;
              min-height: 277mm !important;
              margin: 0 auto !important;
              padding: 15mm 20mm !important;
              padding-top: 20mm !important;
              box-shadow: none !important;
              border: none !important;
              position: relative !important;
              left: auto !important;
              top: auto !important;
            }
            
            body * {
              visibility: hidden;
            }
            
            .receipt-content, .receipt-content * {
              visibility: visible;
            }
            
            /* Prevent logo from being cut off */
            .receipt-logo-container {
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              margin-top: 5mm !important;
            }
            
            /* Ensure logo has proper spacing and doesn't get cut */
            .receipt-logo {
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              max-height: 100px !important;
            }
            
            /* Ensure header section doesn't break */
            .receipt-content > div.relative.z-10 > div:first-child {
              page-break-inside: avoid !important;
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
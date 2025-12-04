import React, { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Helper Functions ---

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date);
};

const formatInvoiceNumber = (id: number) => `KL-${id.toString().padStart(6, '0')}`;

// --- Type Definition ---
interface ReceiptData {
  bookingId: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCompany?: string;
  guestIdType?: string;
  guestIdNumber?: string;
  roomName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights?: number;
  days?: number;
  roomPrice: number;
  totalAmount: number;
  paymentMethod: string;
  transactionRef?: string;
  bookingType?: 'hotel' | 'conference';
  createdAt: string;
  promotion?: {
    title: string;
    description: string;
    discount_percent: number;
    discount_type?: 'percentage' | 'fixed';
    discount_amount?: number;
    promotion_type?: 'general' | 'partner';
  };
}

interface InvoiceProps {
  receiptData: ReceiptData;
  onClose?: () => void;
}

// --- PDF Generation Function ---
const generatePDF = async (previewRef: React.RefObject<HTMLDivElement>) => {
  if (!previewRef.current) {
    console.error('Preview element not found');
    return;
  }

  try {
    // Configure html2canvas to capture exactly like it looks
    const canvas = await html2canvas(previewRef.current, {
      scale: 2, // Higher resolution for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: previewRef.current.offsetWidth,
      height: previewRef.current.offsetHeight,
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
    });

    // Create PDF with A4 dimensions
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions to fit the canvas in the PDF
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    // Fill the page with minimal margins
    const margin = 0;
    const finalWidth = pdfWidth;
    const finalHeight = pdfHeight;

    // Convert canvas to base64 and add to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);

    // Generate filename
    const data = previewRef.current?.dataset?.receiptData;
    let invoiceNum = 'unknown';
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        invoiceNum = formatInvoiceNumber(parsedData.bookingId || 'unknown');
      } catch (e) {
        console.warn('Could not parse receipt data for filename');
      }
    }
    const fileName = `Receipt_${invoiceNum}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Save the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to basic PDF generation if html2canvas fails
    console.warn('Falling back to basic PDF generation');
    // You could implement a fallback here if needed
  }
};

// --- Presentational Component (Accepts props) ---
const Invoice: React.FC<InvoiceProps> = ({ receiptData, onClose }) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    await generatePDF(previewRef);
  };

  const handlePrint = async () => {
    if (!previewRef.current) return;
    
    try {
      // Capture the receipt as an image using html2canvas (same as PDF)
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: previewRef.current.offsetWidth,
        height: previewRef.current.offsetHeight,
        logging: false,
        imageTimeout: 0,
      });

      // Convert canvas to image data URL
      const imgData = canvas.toDataURL('image/png');
      
      // Open a new window with the image for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the receipt');
        return;
      }

      // Create print-friendly HTML with the captured image
      const printHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${formatInvoiceNumber(receiptData.bookingId)}</title>
            <style>
              @media print {
                @page {
                  margin: 0;
                  size: A4;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                img {
                  width: 100%;
                  height: auto;
                  page-break-inside: avoid;
                }
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" alt="Receipt" />
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 250);
              };
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(printHTML);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to print receipt. Please try downloading the PDF instead.');
    }
  };

  if (!receiptData) return <div className="p-8 text-center text-gray-500">No invoice data available.</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-8">
      {/* Action Buttons */}
      <div className="mb-6 flex justify-end gap-3">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-white border-2 border-slate-800 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Printer size={18} />
          Print
        </button>
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Download size={18} />
          Download PDF
        </button>
      </div>

      {/* Preview Section */}
      <div
        ref={previewRef}
        className="border-2 border-dashed border-gray-300 rounded-lg p-0 bg-white"
        data-receipt-data={JSON.stringify(receiptData)}
      >
        <div className="p-6 text-center mb-6">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Kabinda Lodge Logo" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-red-900 tracking-wide uppercase mb-1">Kabinda Lodge</h1>
          <h2 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-4">Facture</h2>
          
          <div className="flex justify-center gap-8 text-xs">
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-800">Date de Reçu</span>
              <span className="text-gray-500 font-medium">{formatDate(receiptData.createdAt)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-800">No</span>
              <span className="text-red-800 font-bold">{formatInvoiceNumber(receiptData.bookingId)}</span>
            </div>
          </div>
        </div>

        <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-2">
              Guest Information
            </h3>
            <div className="space-y-1 text-xs">
              <div><span className="font-bold text-gray-700">Nom du Client: </span>{receiptData.guestName}</div>
              {receiptData.guestPhone && <div><span className="font-bold text-gray-700">Téléphone: </span>{receiptData.guestPhone}</div>}
              {receiptData.guestCompany && <div><span className="font-bold text-gray-700">Company: </span>{receiptData.guestCompany}</div>}
              {receiptData.guestIdNumber && <div><span className="font-bold text-gray-700">ID ({receiptData.guestIdType || 'Ref'}): </span>{receiptData.guestIdNumber}</div>}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-2">
              Booking Details
            </h3>
            <div className="space-y-1 text-xs">
              <div><span className="font-bold text-gray-700">Nom de la Chambre: </span>{receiptData.roomName}</div>
              <div><span className="font-bold text-gray-700">Arrivée: </span>{formatDate(receiptData.checkIn)}</div>
              <div><span className="font-bold text-gray-700">Départ: </span>{formatDate(receiptData.checkOut)}</div>
              {(receiptData.nights !== undefined || receiptData.days !== undefined) && (
                <div><span className="font-bold text-gray-700">{receiptData.days ? 'Jours' : 'Nuits'}: </span>{receiptData.days || receiptData.nights}</div>
              )}
              <div><span className="font-bold text-gray-700">Prix de la Chambre: </span>{formatCurrency(receiptData.roomPrice)}</div>
            </div>
          </div>
        </div>

        <div className="px-6 mb-4">
          <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-2">
            Payment Information
          </h3>
          <div className="text-xs space-y-1">
            <div><span className="font-bold text-gray-700">Méthode de Paiement: </span>{receiptData.paymentMethod}</div>
            {receiptData.transactionRef && <div><span className="font-bold text-gray-700">Référence Transaction: </span>{receiptData.transactionRef}</div>}
          </div>
        </div>

        {receiptData.promotion && (
          <div className="mx-6 bg-orange-50 border border-orange-100 rounded p-2 mb-4 text-xs">
            <div className="flex justify-between text-orange-800">
              <span className="font-bold">{receiptData.promotion.title}</span>
              <span>-{formatCurrency(receiptData.promotion.discount_amount || 0)}</span>
            </div>
          </div>
        )}

        <div className="mx-6 bg-gray-50 rounded p-3 flex justify-end items-center mb-6">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-3">Montant Total:</span>
          <span className="text-lg font-bold text-gray-800">{formatCurrency(receiptData.totalAmount)}</span>
        </div>

        <div className="px-6 flex justify-between items-start pt-4 border-t border-dashed border-gray-300">
          <div className="text-left text-xs text-gray-500 flex-1">
            <p className="font-bold text-red-900 mb-1">Merci d'avoir choisi Kabinda Lodge.</p>
            <p className="mb-1">Nous espérons que vous apprécierez votre séjour !</p>
            <p className="text-[10px]">Document officiel. © Kabinda Lodge. Tous droits réservés.</p>
          </div>
          <div className="flex flex-col items-center flex-shrink-0 ml-4">
            <div className="bg-white p-1 border border-gray-300 rounded">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://www.google.com/search?q=Kabinda+Lodge+review')}`}
                alt="QR Code" 
                className="w-16 h-16"
              />
            </div>
            <span className="text-[9px] mt-1 font-medium text-gray-400">Avis Google</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Modal Wrapper Component ---
export const ReceiptGenerator: React.FC<InvoiceProps> = ({ receiptData, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6 flex justify-between items-center border-b mb-4">
          <h2 className="text-2xl font-bold">Receipt</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          )}
        </div>
        <div className="px-6 pb-6">
          <Invoice receiptData={receiptData} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default Invoice;

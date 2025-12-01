import React from 'react';
import { Phone, Mail, MapPin, Printer } from 'lucide-react';

// --- Helper Functions ---

const formatCurrency = (amount: number) => `$${amount}`;

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
  data: ReceiptData;
  onClose?: () => void;
}

// --- Presentational Component (Accepts props) ---
const Invoice: React.FC<InvoiceProps> = ({ data, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!data) return <div className="p-8 text-center text-gray-500">No invoice data available.</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans text-gray-800 print:bg-white print:p-0 print:m-0">
      {/* Print Scaling Styles */}
      <style>{`
        @media print {
          @page { 
            margin: 10mm;
            size: A4;
          }
          body { 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-container {
            box-shadow: none !important;
            border: none !important;
            max-width: none !important;
            width: 190mm !important;
            height: 277mm !important;
            margin: 0 !important;
            padding: 8mm !important;
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>

      {/* Print Button */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-end print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Printer size={18} />
          Print Invoice
        </button>
      </div>

      {/* Close Button for Modal */}
      {onClose && (
        <div className="max-w-3xl mx-auto mb-6 flex justify-end print:hidden">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ✕ Close
          </button>
        </div>
      )}

      {/* Main Invoice Sheet */}
      <div className="print-container max-w-3xl mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none print:w-full">
        <div className="p-8 md:p-10">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center print:border-orange-200">
                <div className="text-orange-600 font-bold text-[10px] flex flex-col items-center">
                  <span>LOGO</span>
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-red-900 tracking-wide uppercase mb-1">Kabinda Lodge</h1>
            <h2 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-6">Facture</h2>
            
            <div className="flex justify-center gap-8 text-xs">
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-800">Date de Reçu</span>
                <span className="text-gray-500 font-medium">{formatDate(data.createdAt)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-800">No</span>
                <span className="text-red-800 font-bold">{formatInvoiceNumber(data.bookingId)}</span>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Column 1: Guest Info */}
            <div>
              <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-2">
                Guest Information
              </h3>
              <div className="grid grid-cols-[1fr,1.5fr] gap-y-1 text-xs">
                <span className="font-bold text-gray-700">Nom du Client:</span>
                <span className="text-right">{data.guestName}</span>
                
                {data.guestPhone && (
                  <>
                    <span className="font-bold text-gray-700">Téléphone:</span>
                    <span className="text-right">{data.guestPhone}</span>
                  </>
                )}
                
                {data.guestCompany && (
                  <>
                    <span className="font-bold text-gray-700">Company:</span>
                    <span className="text-right">{data.guestCompany}</span>
                  </>
                )}
                
                {data.guestIdNumber && (
                  <>
                    <span className="font-bold text-gray-700">ID ({data.guestIdType || 'Ref'}):</span>
                    <span className="text-right text-[10px]">{data.guestIdNumber}</span>
                  </>
                )}
              </div>
            </div>

            {/* Column 2: Booking Details */}
            <div>
              <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-2">
                Booking Details
              </h3>
              <div className="grid grid-cols-[1fr,1.5fr] gap-y-1 text-xs">
                <span className="font-bold text-gray-700">Nom de la Chambre:</span>
                <span className="text-right">{data.roomName}</span>
                
                <span className="font-bold text-gray-700">Arrivée:</span>
                <span className="text-right">{formatDate(data.checkIn)}</span>
                
                <span className="font-bold text-gray-700">Départ:</span>
                <span className="text-right">{formatDate(data.checkOut)}</span>
                
                {(data.nights !== undefined || data.days !== undefined) && (
                  <>
                    <span className="font-bold text-gray-700">
                       {data.days ? 'Jours' : 'Nuits'}:
                    </span>
                    <span className="text-right">{data.days || data.nights}</span>
                  </>
                )}
                
                <span className="font-bold text-gray-700">Prix de la Chambre:</span>
                <span className="text-right font-medium">{formatCurrency(data.roomPrice)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-2">
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-gray-700">Méthode de Paiement:</span>
                <span>{data.paymentMethod}</span>
              </div>
              
              {data.transactionRef && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Référence Transaction:</span>
                  <span className="text-[10px]">{data.transactionRef}</span>
                </div>
              )}
            </div>
          </div>

          {/* Promotion Section */}
          {data.promotion && (
             <div className="bg-orange-50 border border-orange-100 rounded p-2 mb-4 text-xs">
               <div className="flex justify-between text-orange-800">
                  <span className="font-bold">{data.promotion.title}</span>
                  <span>-{formatCurrency(data.promotion.discount_amount || 0)}</span>
               </div>
             </div>
          )}

          {/* Total Section */}
          <div className="bg-gray-50 rounded p-3 flex justify-end items-center mb-6 print:bg-transparent print:border-t print:border-gray-300 print:rounded-none">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-3">Montant Total:</span>
            <span className="text-lg font-bold text-gray-800">{formatCurrency(data.totalAmount)}</span>
          </div>

          {/* Footer / QR */}
          <div className="mt-auto pt-6 border-t border-dashed border-gray-300">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              
              <div className="text-xs text-gray-500 max-w-xs text-center md:text-left flex-1">
                <p className="font-bold text-red-900 mb-1">Merci d'avoir choisi Kabinda Lodge.</p>
                <p className="mb-1 text-[11px]">Nous espérons que vous apprécierez votre séjour !</p>
                <p className="text-[9px] leading-tight">
                  Tous les clients ont accès à un internet satellite rapide. Présentez vos appareils à la réception.<br/>
                  Document officiel. © Kabinda Lodge. Tous droits réservés.
                </p>
              </div>

              {/* QR Code Simulation */}
              <div className="flex flex-col items-center flex-shrink-0">
                 <div className="bg-white p-1 border border-gray-300 rounded">
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-gray-800" fill="currentColor">
                        <rect x="0" y="0" width="100" height="100" fill="white"/>
                        <rect x="0" y="0" width="25" height="25" fill="black"/>
                        <rect x="75" y="0" width="25" height="25" fill="black"/>
                        <rect x="0" y="75" width="25" height="25" fill="black"/>
                        <rect x="5" y="5" width="15" height="15" fill="white"/>
                        <rect x="80" y="5" width="15" height="15" fill="white"/>
                        <rect x="5" y="80" width="15" height="15" fill="white"/>
                        <rect x="10" y="10" width="5" height="5" fill="black"/>
                        <rect x="85" y="10" width="5" height="5" fill="black"/>
                        <rect x="10" y="85" width="5" height="5" fill="black"/>
                        <rect x="30" y="30" width="10" height="10" fill="black"/>
                        <rect x="50" y="30" width="10" height="10" fill="black"/>
                        <rect x="70" y="50" width="10" height="10" fill="black"/>
                        <rect x="30" y="70" width="10" height="10" fill="black"/>
                        <rect x="50" y="50" width="10" height="10" fill="black"/>
                        <rect x="50" y="10" width="10" height="10" fill="black"/>
                        <rect x="30" y="10" width="10" height="10" fill="black"/>
                        <rect x="30" y="50" width="15" height="15" fill="black"/>
                    </svg>
                 </div>
                 <span className="text-[9px] mt-1 font-medium text-gray-400">Avis Google</span>
              </div>
            </div>

            {/* Bottom Contact Bar */}
            <div className="mt-6 flex flex-col md:flex-row justify-center items-center gap-2 text-[10px] text-gray-500 border-t border-gray-200 pt-3">
              <div className="flex items-center gap-1">
                <Phone size={12} className="text-red-900" />
                <span>+243 97 405 58 70</span>
              </div>
              <div className="hidden md:block text-gray-300">•</div>
              <div className="flex items-center gap-1">
                <Mail size={12} className="text-red-900" />
                <span>kabindalodge@gmail.com</span>
              </div>
              <div className="hidden md:block text-gray-300">•</div>
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-red-900" />
                <span>Avenue Lumumba, Kabinda, DRC Congo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Modal Wrapper Component ---
export const ReceiptGenerator: React.FC<InvoiceProps> = ({ data, onClose }) => {
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
          <Invoice data={data} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default Invoice;

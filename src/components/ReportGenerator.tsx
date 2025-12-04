import React, { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

// --- Helper Functions ---

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

const formatDate = (date: Date) => {
  return format(date, 'MMMM dd, yyyy');
};

const formatDateShort = (date: Date) => {
  return format(date, 'MMM dd, yyyy');
};

// --- Type Definitions ---

export type ReportType = 'super-admin' | 'conference-rooms';

interface ReportData {
  // Financial Metrics
  totalRevenue: number;
  roomRevenue: number;
  restaurantRevenue: number;
  conferenceRevenue: number;
  revenueGrowth: number;
  averageDailyRate: number;
  revenuePerGuest: number;
  
  // Booking Metrics
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  bookingGrowth: number;
  averageLengthOfStay: number;
  occupancyRate: number;
  leadTime: number;
  
  // Restaurant Metrics
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topSellingItems: Array<{name: string, quantity: number, revenue: number}>;
  
  // Guest Metrics
  totalGuests: number;
  newGuests: number;
  repeatGuests: number;
  customerSatisfaction: number;
  repeatCustomerRate: number;
  averageRating: number;
  
  // Conference Metrics
  totalConferenceBookings: number;
  averageConferenceDuration: number;
  
  // Operational Metrics
  totalRooms: number;
  availableRooms: number;
  maintenanceRequests: number;
  serviceRequests: number;
  
  // Payments
  paymentMethods: Array<{ method: string; count: number; amount: number }>;
  
  // Conference-specific data
  conferenceRoomPerformance?: Array<{
    roomName: string;
    bookings: number;
    revenue: number;
    occupancy: number;
  }>;
  
  conferenceBookings?: Array<{
    id: number;
    roomName: string;
    clientName: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
  }>;
}

interface ReportGeneratorProps {
  reportType: ReportType;
  reportData: ReportData;
  startDate: Date;
  endDate: Date;
  onClose?: () => void;
}

// --- PDF Generation Function ---
const generatePDF = async (
  previewRef: React.RefObject<HTMLDivElement>,
  reportType: ReportType,
  startDate: Date,
  endDate: Date
) => {
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

    // Fill the page with minimal margins
    const margin = 0;
    const finalWidth = pdfWidth;
    const finalHeight = pdfHeight;

    // Convert canvas to base64 and add to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);

    // Generate filename
    const reportTypeName = reportType === 'super-admin' ? 'super-admin' : 'conference-rooms';
    const fileName = `kabinda-lodge-${reportTypeName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

    // Save the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// --- Super Admin Report Template ---
const SuperAdminReport: React.FC<{ reportData: ReportData; startDate: Date; endDate: Date }> = ({ 
  reportData, 
  startDate, 
  endDate 
}) => {
  return (
    <div className="p-6 text-center mb-6">
      <div className="flex justify-center mb-4">
        <img src="/logo.png" alt="Kabinda Lodge Logo" className="h-20 w-20 object-contain" />
      </div>
      <h1 className="text-2xl font-bold text-red-900 tracking-wide uppercase mb-1">Kabinda Lodge</h1>
      <h2 className="text-xs font-bold text-gray-700 tracking-[0.2em] uppercase mb-4">Rapport d'Administration</h2>
      
      <div className="flex justify-center gap-8 text-xs mb-6">
        <div className="flex flex-col items-center">
          <span className="font-bold text-gray-800">Période</span>
          <span className="text-gray-700 font-medium">{formatDateShort(startDate)} - {formatDateShort(endDate)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-gray-800">Date de Génération</span>
          <span className="text-gray-700 font-medium">{formatDate(new Date())}</span>
        </div>
      </div>

      {/* Financial Performance */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
          Performance Financière
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Revenu Total</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(reportData.totalRevenue)}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Croissance</div>
            <div className={`text-lg font-bold ${reportData.revenueGrowth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {reportData.revenueGrowth >= 0 ? '+' : ''}{reportData.revenueGrowth.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Revenu Chambres</div>
            <div className="text-base font-bold text-gray-900">{formatCurrency(reportData.roomRevenue)}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Revenu Restaurant</div>
            <div className="text-base font-bold text-gray-900">{formatCurrency(reportData.restaurantRevenue)}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Revenu Conférence</div>
            <div className="text-base font-bold text-gray-900">{formatCurrency(reportData.conferenceRevenue)}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Taux Quotidien Moyen</div>
            <div className="text-base font-bold text-gray-900">{formatCurrency(reportData.averageDailyRate)}</div>
          </div>
        </div>
      </div>

      {/* Booking Metrics */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
          Métriques de Réservation
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-bold text-gray-700 mb-1">Total Réservations:</div>
            <div className="text-gray-800 font-medium">{reportData.totalBookings}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Réservations Confirmées:</div>
            <div className="text-gray-800 font-medium">{reportData.confirmedBookings}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Taux d'Occupation:</div>
            <div className="text-gray-800 font-medium">{reportData.occupancyRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Séjour Moyen:</div>
            <div className="text-gray-800 font-medium">{reportData.averageLengthOfStay.toFixed(1)} jours</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Réservations Annulées:</div>
            <div className="text-gray-800 font-medium">{reportData.cancelledBookings}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Croissance Réservations:</div>
            <div className={`font-medium ${reportData.bookingGrowth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {reportData.bookingGrowth >= 0 ? '+' : ''}{reportData.bookingGrowth.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Guest Metrics */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
          Métriques Clients
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-bold text-gray-700 mb-1">Total Clients:</div>
            <div className="text-gray-800 font-medium">{reportData.totalGuests}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Nouveaux Clients:</div>
            <div className="text-gray-800 font-medium">{reportData.newGuests}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Clients Récurrents:</div>
            <div className="text-gray-800 font-medium">{reportData.repeatGuests}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Note Moyenne:</div>
            <div className="text-gray-800 font-medium">{reportData.averageRating.toFixed(1)} / 5.0</div>
          </div>
        </div>
      </div>

      {/* Restaurant Metrics */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
          Métriques Restaurant
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-bold text-gray-700 mb-1">Total Commandes:</div>
            <div className="text-gray-800 font-medium">{reportData.totalOrders}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Commandes Complétées:</div>
            <div className="text-gray-800 font-medium">{reportData.completedOrders}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Valeur Moyenne Commande:</div>
            <div className="text-gray-800 font-medium">{formatCurrency(reportData.averageOrderValue)}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Commandes en Attente:</div>
            <div className="text-gray-800 font-medium">{reportData.pendingOrders}</div>
          </div>
        </div>
        {reportData.topSellingItems && reportData.topSellingItems.length > 0 && (
          <div className="mt-3">
            <div className="font-bold text-gray-800 mb-2 text-[10px]">Articles les Plus Vendus:</div>
            <div className="space-y-1">
              {reportData.topSellingItems.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between text-[10px]">
                  <span className="text-gray-800">{item.name}</span>
                  <span className="text-gray-900 font-medium">{item.quantity} unités - {formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conference Metrics */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
          Métriques Conférence
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-bold text-gray-700 mb-1">Total Réservations Conférence:</div>
            <div className="text-gray-800 font-medium">{reportData.totalConferenceBookings}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 mb-1">Durée Moyenne:</div>
            <div className="text-gray-800 font-medium">{reportData.averageConferenceDuration.toFixed(1)} jours</div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {reportData.paymentMethods && reportData.paymentMethods.length > 0 && (
        <div className="px-6 mb-6">
          <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
            Méthodes de Paiement
          </h3>
          <div className="space-y-2 text-xs">
            {reportData.paymentMethods.map((method, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="font-bold text-gray-800">{method.method}:</span>
                <span className="text-gray-900">{method.count} transactions - {formatCurrency(method.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 flex justify-between items-start pt-4 border-t border-dashed border-gray-300">
        <div className="text-left text-xs text-gray-700 flex-1">
          <p className="font-bold text-red-900 mb-1">Rapport Officiel - Kabinda Lodge</p>
          <p className="mb-1 text-gray-800">Document confidentiel à usage administratif uniquement.</p>
          <p className="text-[10px] text-gray-700">© Kabinda Lodge. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

// --- Conference Rooms Report Template ---
const ConferenceRoomsReport: React.FC<{ reportData: ReportData; startDate: Date; endDate: Date }> = ({ 
  reportData, 
  startDate, 
  endDate 
}) => {
  return (
    <div className="p-6 text-center mb-6">
      <div className="flex justify-center mb-4">
        <img src="/logo.png" alt="Kabinda Lodge Logo" className="h-20 w-20 object-contain" />
      </div>
      <h1 className="text-2xl font-bold text-red-900 tracking-wide uppercase mb-1">Kabinda Lodge</h1>
      <h2 className="text-xs font-bold text-gray-700 tracking-[0.2em] uppercase mb-4">Rapport des Salles de Conférence</h2>
      
      <div className="flex justify-center gap-8 text-xs mb-6">
        <div className="flex flex-col items-center">
          <span className="font-bold text-gray-800">Période</span>
          <span className="text-gray-700 font-medium">{formatDateShort(startDate)} - {formatDateShort(endDate)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-gray-800">Date de Génération</span>
          <span className="text-gray-700 font-medium">{formatDate(new Date())}</span>
        </div>
      </div>

      {/* Conference Summary */}
      <div className="px-6 mb-6">
        <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
          Résumé des Réservations
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Total Réservations</div>
            <div className="text-lg font-bold text-gray-900">{reportData.totalConferenceBookings}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Revenu Total</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(reportData.conferenceRevenue)}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Durée Moyenne</div>
            <div className="text-base font-bold text-gray-900">{reportData.averageConferenceDuration.toFixed(1)} jours</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Revenu Moyen</div>
            <div className="text-base font-bold text-gray-900">
              {reportData.totalConferenceBookings > 0 
                ? formatCurrency(reportData.conferenceRevenue / reportData.totalConferenceBookings)
                : formatCurrency(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Room Performance */}
      {reportData.conferenceRoomPerformance && reportData.conferenceRoomPerformance.length > 0 && (
        <div className="px-6 mb-6">
          <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
            Performance par Salle
          </h3>
          <div className="space-y-3 text-xs">
            {reportData.conferenceRoomPerformance.map((room, idx) => (
              <div key={idx} className="bg-gray-50 rounded p-3">
                <div className="font-bold text-gray-800 mb-2">{room.roomName}</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[10px] text-gray-700 uppercase mb-1">Réservations</div>
                    <div className="font-medium text-gray-900">{room.bookings}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-700 uppercase mb-1">Revenu</div>
                    <div className="font-medium text-gray-900">{formatCurrency(room.revenue)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-700 uppercase mb-1">Occupation</div>
                    <div className="font-medium text-gray-900">{room.occupancy.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Details */}
      {reportData.conferenceBookings && reportData.conferenceBookings.length > 0 && (
        <div className="px-6 mb-6">
          <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
            Détails des Réservations
          </h3>
          <div className="space-y-2 text-xs">
            {reportData.conferenceBookings.slice(0, 10).map((booking, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-2">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-bold text-gray-800">{booking.roomName}</div>
                    <div className="text-gray-700 text-[10px]">Client: {booking.clientName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatCurrency(booking.totalPrice)}</div>
                    <div className={`text-[10px] ${
                      booking.status === 'confirmed' ? 'text-green-700' :
                      booking.status === 'cancelled' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {booking.status}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-700">
                  {formatDateShort(new Date(booking.startDate))} - {formatDateShort(new Date(booking.endDate))}
                </div>
              </div>
            ))}
            {reportData.conferenceBookings.length > 10 && (
              <div className="text-[10px] text-gray-700 italic pt-2">
                ... et {reportData.conferenceBookings.length - 10} autres réservations
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {reportData.paymentMethods && reportData.paymentMethods.length > 0 && (
        <div className="px-6 mb-6">
          <h3 className="text-xs font-bold text-red-900 uppercase border-b border-red-900 pb-1 mb-3 text-left">
            Méthodes de Paiement
          </h3>
          <div className="space-y-2 text-xs">
            {reportData.paymentMethods.map((method, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="font-bold text-gray-800">{method.method}:</span>
                <span className="text-gray-900">{method.count} transactions - {formatCurrency(method.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 flex justify-between items-start pt-4 border-t border-dashed border-gray-300">
        <div className="text-left text-xs text-gray-700 flex-1">
          <p className="font-bold text-red-900 mb-1">Rapport Officiel - Kabinda Lodge</p>
          <p className="mb-1 text-gray-800">Document confidentiel à usage administratif uniquement.</p>
          <p className="text-[10px] text-gray-700">© Kabinda Lodge. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

// --- Main Report Component ---
const Report: React.FC<ReportGeneratorProps> = ({ reportType, reportData, startDate, endDate, onClose }) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    try {
      await generatePDF(previewRef, reportType, startDate, endDate);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = async () => {
    if (!previewRef.current) return;
    
    try {
      // Capture the report as an image using html2canvas (same as PDF)
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
        alert('Please allow popups to print the report');
        return;
      }

      // Generate report title for print window
      const reportTitle = reportType === 'super-admin' 
        ? 'Super Admin Report' 
        : 'Conference Rooms Report';

      // Create print-friendly HTML with the captured image
      const printHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportTitle} - Kabinda Lodge</title>
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
            <img src="${imgData}" alt="${reportTitle}" />
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
      console.error('Error printing report:', error);
      alert('Failed to print report. Please try downloading the PDF instead.');
    }
  };

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
        data-report-type={reportType}
        data-report-data={JSON.stringify({ startDate, endDate })}
      >
        {reportType === 'super-admin' ? (
          <SuperAdminReport reportData={reportData} startDate={startDate} endDate={endDate} />
        ) : (
          <ConferenceRoomsReport reportData={reportData} startDate={startDate} endDate={endDate} />
        )}
      </div>
    </div>
  );
};

// --- Modal Wrapper Component ---
export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ reportType, reportData, startDate, endDate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6 flex justify-between items-center border-b mb-4">
          <h2 className="text-2xl font-bold">
            {reportType === 'super-admin' ? 'Super Admin Report' : 'Conference Rooms Report'}
          </h2>
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
          <Report 
            reportType={reportType} 
            reportData={reportData} 
            startDate={startDate} 
            endDate={endDate} 
            onClose={onClose} 
          />
        </div>
      </div>
    </div>
  );
};

export default Report;


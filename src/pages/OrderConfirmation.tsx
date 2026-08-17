import React from 'react';
import { useApp } from '../context/AppContext';
import { jsPDF } from 'jspdf';
import { CheckCircle, Download, Share2, ClipboardList, ShoppingBag } from 'lucide-react';
import { dbService } from '../services/db';
import { BUSINESS_INFO } from '../config/business';

export const OrderConfirmation: React.FC = () => {
  const { activeOrder, setView } = useApp();

  if (!activeOrder) {
    setView('catalog');
    return null;
  }

  // --- WHATSAPP SHARE GENERATOR ---
  const handleWhatsAppShare = () => {
    const methodStr = activeOrder.paymentMethod === 'pay_now' ? 'Pay Now (UPI)' : 'Pay Later';
    const statusStr = activeOrder.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending';
    
    let itemsText = '';
    activeOrder.items?.forEach((item, idx) => {
      itemsText += `${idx + 1}. ${item.productName} (${item.packSize}) — Qty ${item.quantity} (₹${item.price * item.quantity})\n`;
    });

    const message = `*NEW ORDER SUBMITTED* 🌾\n\n` +
      `*Order No:* ${activeOrder.id}\n` +
      `*Dealer:* ${activeOrder.dealerName}\n` +
      `*Shop:* ${activeOrder.shopName}\n` +
      `*Date:* ${activeOrder.date}\n\n` +
      `*Products:*\n${itemsText}\n` +
      `*Total Amount:* ₹${activeOrder.total}\n` +
      `*Payment Method:* ${methodStr}\n` +
      `*Payment Status:* ${statusStr}\n\n` +
      `Please check the wholesale portal to confirm receipt.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- PDF GENERATOR ---
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Document styling helpers
      doc.setFillColor(22, 163, 74); // Forest green header
      doc.rect(0, 0, 210, 30, 'F');
      
      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      
      const settings = dbService.getSettings();
      doc.text(BUSINESS_INFO.name, 15, 18);
      
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text("AUTHORIZED DEALER ORDER SUMMARY PDF", 15, 25);
      
      // Wholesaler info
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text(`${BUSINESS_INFO.name}, ${BUSINESS_INFO.address}`, 130, 15);
      doc.text(`Contact: ${BUSINESS_INFO.phone} | ${settings.companyEmail || 'orders@shubhamkrishisewa.com'}`, 130, 20);

      // Section title: Order summary
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text("ORDER SUMMARY", 15, 45);
      
      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(15, 48, 195, 48);

      // Order info details
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Order Number:`, 15, 56);
      doc.text(`Order Date:`, 15, 62);
      doc.text(`Payment Method:`, 15, 68);
      doc.text(`Payment Status:`, 15, 74);
      
      doc.setFont('Helvetica', 'normal');
      doc.text(activeOrder.id, 50, 56);
      doc.text(activeOrder.date, 50, 62);
      doc.text(activeOrder.paymentMethod === 'pay_now' ? 'Pay Now (UPI)' : 'Pay Later', 50, 68);
      doc.text(activeOrder.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending', 50, 74);
      
      // Dealer details (right column)
      doc.setFont('Helvetica', 'bold');
      doc.text(`Dealer Shop:`, 110, 56);
      doc.text(`Dealer Name:`, 110, 62);
      
      doc.setFont('Helvetica', 'normal');
      doc.text(activeOrder.shopName, 140, 56);
      doc.text(activeOrder.dealerName, 140, 62);

      // Table Headers
      let startY = 88;
      doc.setFillColor(240, 240, 240);
      doc.rect(15, startY, 180, 8, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("Sr.", 18, startY + 5);
      doc.text("Product Description", 30, startY + 5);
      doc.text("Brand & Pack", 95, startY + 5);
      doc.text("Rate", 145, startY + 5);
      doc.text("Qty", 165, startY + 5);
      doc.text("Amount", 178, startY + 5);
      
      // Table Content
      doc.setFont('Helvetica', 'normal');
      let currentY = startY + 8;
      
      activeOrder.items?.forEach((item, idx) => {
        currentY += 8;
        // background highlight every alternate row
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, currentY - 5, 180, 8, 'F');
        }
        
        doc.text((idx + 1).toString(), 18, currentY);
        // Shorten long product names
        let shortName = item.productName;
        if (shortName.length > 32) shortName = shortName.substring(0, 29) + "...";
        doc.text(shortName, 30, currentY);
        
        doc.text(`${item.brand} (${item.packSize})`, 95, currentY);
        doc.text(`₹${item.price}`, 145, currentY);
        doc.text(item.quantity.toString(), 165, currentY);
        doc.text(`₹${item.price * item.quantity}`, 178, currentY);
      });
      
      // Bottom divider
      currentY += 6;
      doc.line(15, currentY, 195, currentY);
      
      // Calculations
      currentY += 10;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("Gross Subtotal:", 135, currentY);
      doc.setFont('Helvetica', 'normal');
      doc.text(`₹${activeOrder.subtotal}`, 175, currentY);
      
      currentY += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text("Net Total Payable:", 135, currentY);
      doc.setTextColor(22, 163, 74);
      doc.text(`₹${activeOrder.total}`, 175, currentY);
      
      // Footer notice
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'normal');
      doc.text("Note: This is an automatically generated electronic order receipt. For query, contact wholesale helpline.", 15, 275);
      
      doc.save(`Shubham_Krishi_Sewa_Kendra_Order_Summary_${activeOrder.id}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Error generating PDF. Please check file configurations.");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 bg-slate-50 pb-20">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-150 p-6 text-center space-y-6 animate-fade-in">
        
        {/* Animated Check */}
        <div className="flex justify-center">
          <div className="bg-green-50 p-4 rounded-full border border-green-100 shadow-inner animate-bounce">
            <CheckCircle className="w-16 h-16 text-[#12873A]" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-xl xs:text-2xl font-black text-slate-800">Order Placed Successfully!</h2>
          <p className="text-xs text-slate-400 font-medium">Thank you for ordering. Your order details are registered.</p>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 text-left text-xs space-y-3.5">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2 font-bold text-slate-850">
            <span>Order Reference</span>
            <span className="font-mono text-[#12873A] font-extrabold">{activeOrder.id}</span>
          </div>

          {/* Product lines */}
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {activeOrder.items?.map(item => (
              <div key={item.id} className="flex justify-between text-slate-600 font-medium">
                <span className="truncate max-w-[200px]">{item.productName} ({item.packSize})</span>
                <span className="font-bold flex-shrink-0 text-slate-800">
                  {item.quantity} × ₹{item.price}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-2.5 space-y-2 font-medium text-slate-500">
            <div className="flex justify-between">
              <span>Payment Mode</span>
              <span className="text-slate-800 font-bold">
                {activeOrder.paymentMethod === 'pay_now' ? 'Pay Now (UPI)' : 'Pay Later'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Status</span>
              <span className={`font-bold ${
                activeOrder.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {activeOrder.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-extrabold text-slate-850 pt-2 border-t border-slate-100">
              <span>Total Amount</span>
              <span className="text-[#12873A] text-base font-black">₹{activeOrder.total}</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center space-x-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#12873A]" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center space-x-1.5 bg-[#12873A] hover:bg-[#16A34A] text-white font-bold py-3.5 rounded-xl text-xs transition shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>Share WhatsApp</span>
          </button>
        </div>

        {/* Footer link CTAs */}
        <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2.5">
          <button
            onClick={() => setView('orders')}
            className="text-[#12873A] hover:text-[#16A34A] text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-[#12873A]" />
            <span>View My Order History</span>
          </button>
          
          <button
            onClick={() => setView('catalog')}
            className="text-slate-500 hover:text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-slate-400" />
            <span>Continue Shopping</span>
          </button>
        </div>

      </div>
    </div>
  );
};

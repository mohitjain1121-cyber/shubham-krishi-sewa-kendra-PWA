import React from 'react';
import type { DeliveryChallan } from '../services/db';
import { jsPDF } from 'jspdf';
import { FileText } from 'lucide-react';

interface DeliveryChallanProps {
  challan: DeliveryChallan;
}

export async function downloadChallanPDF(challan: DeliveryChallan) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let fontName = 'Helvetica';
  
  // Try loading Mukta font for Hindi and Rupee symbol
  try {
    const cachedFont = localStorage.getItem('ad_mukta_font');
    let base64Font = cachedFont || '';
    if (!base64Font) {
      const url = 'https://fonts.gstatic.com/s/mukta/v14/Pxi3ypK1jN2lhbH6HYoDECg.ttf';
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const binary = String.fromCharCode.apply(null, new Uint8Array(buffer) as any);
        base64Font = btoa(binary);
        try {
          localStorage.setItem('ad_mukta_font', base64Font);
        } catch (e) {
          console.warn('Failed to cache font in localStorage:', e);
        }
      }
    }
    if (base64Font) {
      doc.addFileToVFS('Mukta.ttf', base64Font);
      doc.addFont('Mukta.ttf', 'Mukta', 'normal');
      fontName = 'Mukta';
    }
  } catch (err) {
    console.error('Failed to load Mukta font, falling back to Helvetica:', err);
  }

  doc.setFont(fontName);
  
  // Helper to replace Rupee symbol and Devanagari characters if using Helvetica
  const clean = (text: string) => {
    if (fontName === 'Helvetica') {
      return text.replace(/₹/g, 'Rs.').replace(/[\u0900-\u097F]/g, '');
    }
    return text;
  };

  // Draw Page Borders
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);
  doc.rect(7, 7, 196, 283); // outer border

  // Header Details
  const settings = challan.businessSnapshot;
  
  // Logo
  if (settings.companyLogo) {
    try {
      doc.addImage(settings.companyLogo, 'PNG', 12, 12, 18, 18);
    } catch (e) {
      console.error("Failed to render logo in PDF: ", e);
    }
  }
  
  // Business Name and Address
  doc.setFont(fontName, 'bold');
  doc.setFontSize(15);
  doc.text(clean(settings.companyName), 35, 17);
  
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.text(clean(settings.companyAddress || '—'), 35, 22);
  
  let contactInfo = `Phone: ${settings.companyContact || '—'}`;
  contactInfo += ` | WhatsApp: ${settings.companyWhatsapp || '—'}`;
  contactInfo += ` | Email: ${settings.companyEmail || '—'}`;
  doc.text(clean(contactInfo), 35, 26);

  let licInfo = `GSTIN: ${settings.companyGst || '—'}`;
  licInfo += ` | License/Reg: ${settings.companyRegistration || '—'}`;
  doc.text(clean(licInfo), 35, 30);

  // Line separator
  doc.line(7, 34, 203, 34);

  // Title: DELIVERY CHALLAN
  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.text(clean("DELIVERY CHALLAN / वितरण चालान"), 105, 40, { align: 'center' });
  doc.line(7, 44, 203, 44);

  // Party Details & Challan Info Table
  doc.setFontSize(8.5);
  doc.setFont(fontName, 'bold');
  doc.text(clean("TO (PARTY / DEALER):"), 12, 49);
  doc.text(clean("CHALLAN & TRANSPORT DETAILS:"), 112, 49);

  doc.setFont(fontName, 'normal');
  doc.text(clean(`Shop Name: ${challan.dealerSnapshot.shopName || '—'}`), 12, 54);
  doc.text(clean(`Dealer Name: ${challan.dealerSnapshot.name || '—'}`), 12, 59);
  doc.text(clean(`Address: ${challan.dealerSnapshot.address || '—'}`), 12, 64);
  doc.text(clean(`Place: ${challan.dealerSnapshot.address.split(',').pop()?.trim() || '—'}`), 12, 69);
  doc.text(clean(`Mobile: ${challan.dealerSnapshot.mobile || '—'}`), 12, 74);
  doc.text(clean(`GSTIN: ${challan.dealerSnapshot.gstNumber || '—'}`), 12, 79);

  // Challan Info
  doc.text(clean(`Challan No: ${challan.challanNumber}`), 112, 54);
  doc.text(clean(`Date: ${new Date(challan.dispatchDate).toLocaleDateString('en-IN')}`), 112, 59);
  doc.text(clean(`Order Ref: ${challan.orderId}`), 112, 64);
  
  const transport = challan.transportDetails || {};
  doc.text(clean(`Transport Through: ${transport.transportThrough || '—'}`), 112, 69);
  doc.text(clean(`Vehicle No: ${transport.vehicleNumber || '—'}`), 112, 74);
  doc.text(clean(`Driver: ${transport.driverName || '—'}`), 112, 79);
  
  const fromLoc = transport.dispatchLocation || '—';
  const toLoc = transport.deliveryLocation || '—';
  doc.text(clean(`Route: ${fromLoc} -> ${toLoc}`), 112, 84);

  // Grid vertical separator
  doc.line(108, 44, 108, 88);
  doc.line(7, 88, 203, 88);

  // Product Table headers
  let tableY = 93;
  doc.setFillColor(245, 245, 245);
  doc.rect(7, tableY, 196, 7, 'F');
  doc.setFont(fontName, 'bold');
  doc.text(clean("Sr."), 9, tableY + 5);
  doc.text(clean("Product Name & Brand"), 18, tableY + 5);
  doc.text(clean("Pack Size"), 90, tableY + 5);
  doc.text(clean("Qty"), 128, tableY + 5);
  doc.text(clean("Rate"), 152, tableY + 5);
  doc.text(clean("Amount"), 178, tableY + 5);

  doc.line(7, tableY + 7, 203, tableY + 7);

  doc.setFont(fontName, 'normal');
  let currentY = tableY + 7;
  let subtotal = 0;

  challan.itemsSnapshot.forEach((item, idx) => {
    currentY += 7;
    doc.text((idx + 1).toString(), 9, currentY - 2);
    
    let prodDesc = `${item.productName} (${item.brand})`;
    if (prodDesc.length > 42) prodDesc = prodDesc.substring(0, 39) + "...";
    doc.text(clean(prodDesc), 18, currentY - 2);
    
    doc.text(clean(item.packSize), 90, currentY - 2);
    doc.text(item.quantity.toString(), 128, currentY - 2);
    doc.text(clean(`₹${item.price}`), 152, currentY - 2);
    
    const amt = item.price * item.quantity;
    subtotal += amt;
    doc.text(clean(`₹${amt}`), 178, currentY - 2);
    doc.line(7, currentY, 203, currentY);
  });

  // Vertical lines of table
  doc.line(14, tableY, 14, currentY);
  doc.line(85, tableY, 85, currentY);
  doc.line(120, tableY, 120, currentY);
  doc.line(145, tableY, 145, currentY);
  doc.line(172, tableY, 172, currentY);

  // Bottom charges block
  currentY += 5;
  doc.setFont(fontName, 'bold');
  doc.text(clean("Subtotal:"), 140, currentY);
  doc.text(clean(`₹${subtotal}`), 178, currentY);

  currentY += 6;
  doc.text(clean("Hamali:"), 140, currentY);
  doc.text(clean(challan.hamali ? `₹${challan.hamali}` : "—"), 178, currentY);

  currentY += 6;
  doc.text(clean("Bhada (Freight):"), 140, currentY);
  doc.text(clean(challan.bhada ? `₹${challan.bhada}` : "—"), 178, currentY);

  currentY += 6;
  doc.text(clean("Other Charges:"), 140, currentY);
  doc.text(clean(challan.otherCharges ? `₹${challan.otherCharges}` : "—"), 178, currentY);

  const grandTotal = subtotal + Number(challan.hamali || 0) + Number(challan.bhada || 0) + Number(challan.otherCharges || 0);
  currentY += 7;
  doc.line(135, currentY - 4, 203, currentY - 4);
  doc.setFontSize(10.5);
  doc.text(clean("Net Total Amount:"), 140, currentY);
  doc.text(clean(`₹${grandTotal}`), 178, currentY);
  doc.line(135, currentY + 2, 203, currentY + 2);

  // Signatures Area
  currentY += 23;
  doc.setFontSize(8.5);
  doc.text(clean("Receiver / Dealer Signature"), 15, currentY);
  doc.text(clean("Authorized Signature"), 150, currentY);
  doc.setFont(fontName, 'normal');
  doc.text(clean("(Stamp & Sign)"), 15, currentY + 4);
  doc.text(clean(`For ${settings.companyName}`), 145, currentY + 4);

  // Acknowledgement Box
  currentY += 15;
  doc.rect(7, currentY, 196, 25);
  doc.setFont(fontName, 'bold');
  doc.text(clean("ACKNOWLEDGEMENT / पावती"), 12, currentY + 5);
  doc.setFont(fontName, 'normal');
  doc.text(clean(`Received the material in good condition against Delivery Challan No: ${challan.challanNumber}`), 12, currentY + 12);
  doc.text(clean("Received By: _____________________    Signature: _____________________    Date: ___________"), 12, currentY + 18);

  doc.save(`Delivery-Challan-${challan.challanNumber}.pdf`);
}

export const DeliveryChallanComponent: React.FC<DeliveryChallanProps> = ({ challan }) => {
  const settings = challan.businessSnapshot;
  const transport = challan.transportDetails || {};
  const items = challan.itemsSnapshot || [];
  
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + Number(challan.hamali || 0) + Number(challan.bhada || 0) + Number(challan.otherCharges || 0);

  return (
    <div className="relative">
      {/* Stylesheet specifically to format browser native print view */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          #delivery-challan-print {
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            width: 210mm !important;
            height: auto !important;
            overflow: visible !important;
            opacity: 0.01 !important;
            pointer-events: none !important;
          }
        }
        @media print {
          /* Hide all screen-based application elements */
          body * {
            visibility: hidden !important;
          }
          
          /* Show print target container and all its descendants */
          #delivery-challan-print,
          #delivery-challan-print * {
            visibility: visible !important;
          }
          
          /* Position print container at top-left of printed page */
          #delivery-challan-print {
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            height: auto !important;
            background: white !important;
          }
          
          /* Format target print container to match A4 canvas */
          #delivery-challan-print-area {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: static !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 10mm !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            border: 1px solid #000 !important;
            background: white !important;
            color: black !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Force browser background colors/graphics to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* A4 portrait layout with standard margins */
          @page {
            size: A4 portrait;
            margin: 0;
          }

          /* Support multi-page breaking inside table rows */
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      ` }} />

      {/* A4 Document Visual Layout Page */}
      <div 
        id="delivery-challan-print-area" 
        className="a4-page mx-auto bg-white border border-slate-300 text-slate-900 shadow-xl p-6 flex flex-col justify-between select-none text-[11px] leading-relaxed relative"
        style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
      >
        {/* Border frame */}
        <div className="absolute inset-4 border border-slate-900 pointer-events-none"></div>

        {/* Content wrapper */}
        <div className="relative p-2 space-y-4">
          
          {/* Header Block: Logo & Wholesaler details */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-900">
            <div className="flex items-center space-x-4">
              {settings.companyLogo ? (
                <img 
                  src={settings.companyLogo} 
                  alt="Business Logo" 
                  className="w-16 h-16 object-contain rounded border border-slate-100 p-1"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-100 border border-slate-350 flex items-center justify-center font-bold text-slate-500 rounded text-center leading-tight">
                  No Logo
                </div>
              )}
              <div className="space-y-0.5">
                <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                  {settings.companyName || '—'}
                </h2>
                <p className="text-[10px] text-slate-650 max-w-md font-medium leading-tight">
                  {settings.companyAddress || '—'}
                </p>
                <div className="text-[9.5px] text-slate-500 font-medium">
                  <span>Phone: {settings.companyContact || '—'}</span>
                  <span className="ml-2.5">| WhatsApp: {settings.companyWhatsapp || '—'}</span>
                  <span className="ml-2.5">| Email: {settings.companyEmail || '—'}</span>
                </div>
                <div className="text-[9.5px] text-slate-500 font-bold">
                  <span>GSTIN: {settings.companyGst || '—'}</span>
                  <span className="ml-2.5">| License: {settings.companyRegistration || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center py-1.5 border-b border-slate-900">
            <h1 className="text-xs font-black uppercase tracking-wider text-slate-900">
              DELIVERY CHALLAN / वितरण चालान
            </h1>
          </div>

          {/* Two-Column Grid: Party / Dealer Details & Challan Metadata */}
          <div className="grid grid-cols-2 divide-x divide-slate-900 text-[10px] border-b border-slate-900 -mx-2">
            
            {/* Dealer/Party column */}
            <div className="pl-4 pr-3 py-2 space-y-1">
              <h3 className="font-extrabold uppercase text-[9.5px] text-slate-800 tracking-wider">
                TO (PARTY / DEALER):
              </h3>
              <div className="font-medium space-y-0.5 text-slate-700">
                <p><span className="font-bold text-slate-900">Shop:</span> {challan.dealerSnapshot.shopName || '—'}</p>
                <p><span className="font-bold text-slate-900">Proprietor:</span> {challan.dealerSnapshot.name || '—'}</p>
                <p><span className="font-bold text-slate-900">Address:</span> {challan.dealerSnapshot.address || '—'}</p>
                <p><span className="font-bold text-slate-900">Place:</span> {challan.dealerSnapshot.address.split(',').pop()?.trim() || '—'}</p>
                <p><span className="font-bold text-slate-900">Mobile:</span> {challan.dealerSnapshot.mobile || '—'}</p>
                <p><span className="font-bold text-slate-900">GSTIN:</span> {challan.dealerSnapshot.gstNumber || '—'}</p>
              </div>
            </div>

            {/* Challan & Transport details column */}
            <div className="pl-4 pr-3 py-2 space-y-1.5">
              <h3 className="font-extrabold uppercase text-[9.5px] text-slate-800 tracking-wider">
                CHALLAN & TRANSPORT DETAILS:
              </h3>
              <div className="font-medium space-y-0.5 text-slate-700">
                <p><span className="font-bold text-slate-900">Challan No:</span> {challan.challanNumber}</p>
                <p><span className="font-bold text-slate-900">Date:</span> {new Date(challan.dispatchDate).toLocaleDateString('en-IN')}</p>
                <p><span className="font-bold text-slate-900">Order Reference:</span> {challan.orderId}</p>
                <p><span className="font-bold text-slate-900">Transport Through:</span> {transport.transportThrough || '—'}</p>
                <p><span className="font-bold text-slate-900">Vehicle Number:</span> {transport.vehicleNumber || '—'}</p>
                <p><span className="font-bold text-slate-900">Driver Name:</span> {transport.driverName || '—'}</p>
                <p><span className="font-bold text-slate-900">Route:</span> {transport.dispatchLocation || '—'} &rarr; {transport.deliveryLocation || '—'}</p>
              </div>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="space-y-1.5">
            <div className="border border-slate-900 overflow-hidden">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-900 text-slate-900 font-extrabold text-[9.5px]">
                    <th className="py-1 px-2 border-r border-slate-900 w-10 text-center">Sr.</th>
                    <th className="py-1 px-3 border-r border-slate-900">Product Description</th>
                    <th className="py-1 px-3 border-r border-slate-900 w-28 text-center">Pack Size</th>
                    <th className="py-1 px-2 border-r border-slate-900 w-16 text-center">Qty</th>
                    <th className="py-1 px-3 border-r border-slate-900 w-24 text-right">Rate</th>
                    <th className="py-1 px-3 w-28 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-medium">
                  {items.map((item, index) => (
                    <tr key={item.id} className="text-slate-800">
                      <td className="py-1.5 px-2 border-r border-slate-900 text-center font-bold">{index + 1}</td>
                      <td className="py-1.5 px-3 border-r border-slate-900 font-bold">
                        {item.productName}
                        <span className="block text-[8.5px] font-normal text-slate-450 uppercase">{item.brand}</span>
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-900 text-center text-slate-650">{item.packSize}</td>
                      <td className="py-1.5 px-2 border-r border-slate-900 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="py-1.5 px-3 border-r border-slate-900 text-right text-slate-650">₹{item.price}</td>
                      <td className="py-1.5 px-3 text-right font-bold text-slate-900">₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Charges breakdown & computational sums */}
            <div className="flex justify-end pr-2 text-[10px]">
              <div className="w-56 space-y-1 py-1 font-semibold text-slate-650">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-slate-900 font-bold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hamali:</span>
                  <span className="text-slate-900 font-bold">{challan.hamali ? `₹${challan.hamali}` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bhada (Freight):</span>
                  <span className="text-slate-900 font-bold">{challan.bhada ? `₹${challan.bhada}` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Charges:</span>
                  <span className="text-slate-900 font-bold">{challan.otherCharges ? `₹${challan.otherCharges}` : "—"}</span>
                </div>
                <div className="flex justify-between border-t border-slate-350 pt-1 font-black text-slate-950 text-xs">
                  <span>Net Total Amount:</span>
                  <span className="text-green-755 font-bold">₹{total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Areas */}
          <div className="grid grid-cols-2 pt-10 text-[9.5px]">
            <div className="text-left pl-6">
              <div className="h-10"></div>
              <p className="border-t border-slate-900 border-dashed pt-1.5 inline-block w-48 font-bold text-slate-800">
                Receiver / Dealer Signature
              </p>
              <p className="text-[8px] text-slate-400 mt-0.5">(Stamp & Physical Signature)</p>
            </div>
            <div className="text-right pr-6 flex flex-col items-end">
              <div className="h-10 flex items-end"></div>
              <p className="border-t border-slate-900 border-dashed pt-1.5 w-48 font-bold text-slate-800">
                Authorized Signature
              </p>
              <p className="text-[8.5px] text-slate-500 font-semibold mt-1">
                For {settings.companyName}
              </p>
            </div>
          </div>

        </div>

        {/* Acknowledgement Slip Segment */}
        <div className="border border-slate-900 p-3 bg-slate-50/40 rounded space-y-2 mt-4 relative">
          <h4 className="font-extrabold uppercase text-[9px] text-slate-800 tracking-wider flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>ACKNOWLEDGEMENT / पावती</span>
          </h4>
          <p className="text-[10px] text-slate-700 leading-normal">
            Received the material in good condition against Delivery Challan No: <span className="font-bold text-slate-900">{challan.challanNumber}</span>.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1.5 text-[9.5px] text-slate-650 font-medium">
            <p>Received By: __________________</p>
            <p>Signature: __________________</p>
            <p>Date: __________________</p>
          </div>
        </div>

      </div>
    </div>
  );
};

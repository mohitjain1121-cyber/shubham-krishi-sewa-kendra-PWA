import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import { Save, AlertCircle, Sparkles, Building, Phone, Mail, QrCode, CreditCard, Percent } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { settings, reloadSettings } = useApp();
  const [upiId, setUpiId] = useState(settings.upiId);
  const [upiName, setUpiName] = useState(settings.upiName);
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress);
  const [companyContact, setCompanyContact] = useState(settings.companyContact);
  const [companyEmail, setCompanyEmail] = useState(settings.companyEmail || 'orders@shubhamkrishisewa.com');
  const [companyGst, setCompanyGst] = useState(settings.companyGst || '23ABCDE1234F1Z5');
  const [allowPayNow, setAllowPayNow] = useState(settings.allowPayNow !== false); // default to true
  const [allowPayLater, setAllowPayLater] = useState(settings.allowPayLater !== false); // default to true
  const [upiQrCode, setUpiQrCode] = useState(settings.upiQrCode || '');
  
  const [companyLogo, setCompanyLogo] = useState(settings.companyLogo || '');
  const [companyWhatsapp, setCompanyWhatsapp] = useState(settings.companyWhatsapp || '');
  const [companyRegistration, setCompanyRegistration] = useState(settings.companyRegistration || '');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCompanyLogo(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setCompanyLogo('');
  };
  
  const [success, setSuccess] = useState(false);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUpiQrCode(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCustomQr = () => {
    setUpiQrCode('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowPayNow && !allowPayLater) {
      alert("Please enable at least one payment method (Pay Now or Pay Later) so dealers can checkout.");
      return;
    }

    dbService.updateSettings({
      upiId,
      upiName,
      companyName,
      companyAddress,
      companyContact,
      companyEmail,
      companyGst,
      allowPayNow,
      allowPayLater,
      upiQrCode,
      companyLogo,
      companyWhatsapp,
      companyRegistration
    });
    
    reloadSettings();
    setSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccess(false), 2500);
  };

  // Default fallback QR mockup string
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=0&cu=INR`;
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiString)}`;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {success && (
        <div className="bg-green-50 text-green-700 border border-green-100 rounded-2xl p-4 text-xs font-bold flex items-center space-x-1.5 animate-slide-in">
          <Sparkles className="w-4.5 h-4.5 text-green-600" />
          <span>Wholesaler system configurations updated and synchronized successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Wholesaler Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center">
            <Building className="w-4.5 h-4.5 text-green-700 mr-2" />
            <span>Wholesaler Business Identity</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Name */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">Company Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs font-medium"
                />
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">GSTIN Registration *</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyGst}
                    onChange={(e) => setCompanyGst(e.target.value.toUpperCase())}
                    placeholder="e.g. 06ABCDE1234F1Z5"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-850 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Office Address */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">Head Office Address *</label>
              <textarea
                required
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                rows={2}
                placeholder="Enter official street, sector and state address"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs resize-none font-medium leading-relaxed"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Helpline Contact */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">Helpline Contact Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyContact}
                    onChange={(e) => setCompanyContact(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Billing Email */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">Wholesale Support Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* WhatsApp number */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={companyWhatsapp}
                    onChange={(e) => setCompanyWhatsapp(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Registration / License details */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">License / Registration details</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={companyRegistration}
                    onChange={(e) => setCompanyRegistration(e.target.value)}
                    placeholder="e.g. LIC-12345/KNL"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Company Logo Upload */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">Business Logo (Delivery Challan Header)</label>
              <div className="flex items-center space-x-4 border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/50">
                {companyLogo ? (
                  <div className="relative w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden group">
                    <img src={companyLogo} alt="Business logo" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="absolute inset-0 bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-bold text-center">
                    No Logo
                  </div>
                )}
                <div className="flex-1 text-xxs text-slate-450 leading-normal">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-55 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                  />
                  <p className="mt-1 text-slate-400">PNG or JPG logo to print at the top of generated delivery challans.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Payment Methods Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center">
            <CreditCard className="w-4.5 h-4.5 text-green-700 mr-2" />
            <span>Order Fulfillment Settings</span>
          </h3>

          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-start space-x-2 text-slate-500 text-[10.5px] leading-relaxed">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p>
              Toggle the order payment methods allowed on checkout. Disabling a method hides it from the dealer checkout layout.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {/* Pay Now checkbox */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPayNow}
                onChange={(e) => setAllowPayNow(e.target.checked)}
                className="w-4.5 h-4.5 rounded text-green-600 border-slate-350 focus:ring-green-500 mt-0.5"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Allow Pay Now (UPI Scan-to-pay)</span>
                <span className="text-[10px] text-slate-450 font-medium">Dealers scan a dynamic/static UPI QR code and submit immediate proof of payment.</span>
              </div>
            </label>

            {/* Pay Later checkbox */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPayLater}
                onChange={(e) => setAllowPayLater(e.target.checked)}
                className="w-4.5 h-4.5 rounded text-green-600 border-slate-350 focus:ring-green-500 mt-0.5"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Allow Pay Later (Consignment Credit)</span>
                <span className="text-[10px] text-slate-450 font-medium">Dealers place orders with a pending payment status, settled according to wholesale credit guidelines.</span>
              </div>
            </label>
          </div>
        </div>

        {/* UPI Merchant & QR upload parameters Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center">
            <QrCode className="w-4.5 h-4.5 text-green-700 mr-2" />
            <span>UPI Merchant QR Code Configurations</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left inputs */}
            <div className="md:col-span-2 space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">Merchant VPA / UPI ID *</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. wholesale@upi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">Registered Merchant Payee Name *</label>
                <input
                  type="text"
                  required
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  placeholder="e.g. Shubham Krishi Sewa Kendra Wholesale"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800 text-xs font-semibold"
                />
              </div>

              {/* Upload QR File picker */}
              <div className="space-y-1.5">
                <label className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Upload Custom Merchant QR Code Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="w-full text-xs text-slate-500 border border-slate-200 rounded-xl p-2 bg-slate-50 cursor-pointer"
                />
                <p className="text-[9.5px] text-slate-400 leading-normal">
                  Upload the Wholesaler's official static UPI QR image. In the dealer checkout portal, this image will replace the default auto-generated QR code layout.
                </p>
              </div>
            </div>

            {/* QR preview column */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-150 rounded-2xl relative">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2 text-center">QR Code Live Preview</span>
              
              <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-150 relative flex items-center justify-center w-40 h-40">
                <img
                  src={upiQrCode || fallbackQrUrl}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
                {!upiQrCode && (
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center border border-dashed border-green-500/20 rounded-xl">
                    <span className="bg-emerald-650 text-white font-bold px-2 py-1 rounded text-[8px] tracking-wider uppercase shadow-xs">
                      DEMO UPI QR
                    </span>
                  </div>
                )}
              </div>

              {upiQrCode ? (
                <button
                  type="button"
                  onClick={clearCustomQr}
                  className="text-rose-600 hover:text-rose-700 text-[10px] font-bold mt-2.5 underline"
                >
                  Clear Custom QR
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold text-center mt-2.5">
                  Showing default merchant QR
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition text-xs shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save configurations</span>
        </button>
      </form>

    </div>
  );
};

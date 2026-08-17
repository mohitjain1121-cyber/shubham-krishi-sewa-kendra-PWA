import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import { User, Store, Smartphone, Mail, MapPin, Percent, LogOut, Edit, Check, X } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

export const Profile: React.FC = () => {
  const { user, logout, setView } = useApp();
  const { canInstall, installApp } = usePwaInstall();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing state inputs
  const [name, setName] = useState(user?.name || '');
  const [shopName, setShopName] = useState(user?.shopName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || '');

  if (!user) {
    setView('login');
    return null;
  }

  const handleSave = () => {
    if (!name || !shopName || !mobile || !address) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    const dealers = dbService.getDealers();
    const idx = dealers.findIndex((d: any) => d.id === user.id);
    
    if (idx !== -1) {
      const updatedDealer = {
        ...dealers[idx],
        name,
        shopName,
        mobile,
        email,
        address,
        gstNumber
      };
      dealers[idx] = updatedDealer;
      localStorage.setItem('ad_dealers', JSON.stringify(dealers));
      localStorage.setItem('ad_session', JSON.stringify(updatedDealer));
      
      // Reload session in context by calling simulated login with new values
      dbService.login(updatedDealer.mobile); // updates active session in storage
      window.location.reload(); // Quick refresh to reload all contexts nicely
    } else {
      setError("Failed to update profile. Dealer record not found.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-20">
      
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-br from-[#12873A] to-[#16A34A] text-white px-6 py-9 text-center rounded-b-[2.5rem] shadow-md flex flex-col items-center">
        <div className="bg-white text-[#12873A] p-4 rounded-full border border-white/20 mb-3.5 shadow-lg">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">{user.shopName}</h2>
        <p className="text-green-100 text-xs mt-1.5 font-semibold">Dealer Code: {user.id.toUpperCase()}</p>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
              Profile details
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[#12873A] hover:text-[#16A34A] text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            ) : (
              <div className="flex space-x-2.5">
                <button
                  onClick={handleSave}
                  className="text-[#12873A] hover:text-[#16A34A] text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-500 text-xs font-bold flex items-center space-x-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 text-xs">
            {/* Dealer Contact Name */}
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-1">Dealer Name</span>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12873A]"
                />
              ) : (
                <div className="flex items-center space-x-2.5 text-slate-700 font-medium">
                  <User className="w-4.5 h-4.5 text-slate-400" />
                  <span className="text-slate-800">{user.name}</span>
                </div>
              )}
            </div>

            {/* Shop Name */}
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-1">Shop / Business Name</span>
              {isEditing ? (
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12873A]"
                />
              ) : (
                <div className="flex items-center space-x-2.5 text-slate-700 font-medium">
                  <Store className="w-4.5 h-4.5 text-slate-400" />
                  <span className="text-slate-800">{user.shopName}</span>
                </div>
              )}
            </div>

            {/* Mobile Contact */}
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-1">Mobile Number</span>
              {isEditing ? (
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12873A]"
                />
              ) : (
                <div className="flex items-center space-x-2.5 text-slate-700 font-medium">
                  <Smartphone className="w-4.5 h-4.5 text-slate-400" />
                  <span className="text-slate-800 font-semibold">{user.mobile}</span>
                </div>
              )}
            </div>

            {/* Email Contact */}
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-1">Email Address</span>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12873A]"
                />
              ) : (
                <div className="flex items-center space-x-2.5 text-slate-700 font-medium">
                  <Mail className="w-4.5 h-4.5 text-slate-400" />
                  <span className="text-slate-800">{user.email || 'Not configured'}</span>
                </div>
              )}
            </div>

            {/* Delivery address */}
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-1">Shop Address</span>
              {isEditing ? (
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12873A] resize-none"
                ></textarea>
              ) : (
                <div className="flex items-start space-x-2.5 text-slate-700 font-medium">
                  <MapPin className="w-4.5 h-4.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed text-slate-800">{user.address}</span>
                </div>
              )}
            </div>

            {/* GST Details */}
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mb-1">GST Identification Number</span>
              {isEditing ? (
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12873A]"
                />
              ) : (
                <div className="flex items-center space-x-2.5 text-slate-700 font-medium">
                  <Percent className="w-4.5 h-4.5 text-slate-400" />
                  <span className="font-mono text-slate-800">{user.gstNumber || 'Not configured'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PWA Manual Install Button (if installable) */}
        {canInstall && (
          <button
            onClick={installApp}
            className="w-full bg-green-50 border border-green-250 hover:bg-green-100 text-[#12873A] font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition text-xs shadow-sm cursor-pointer"
          >
            <Smartphone className="w-4.5 h-4.5 text-[#12873A]" />
            <span>Install Shubham Krishi App</span>
          </button>
        )}

        {/* Action Logout */}
        <button
          onClick={logout}
          className="w-full bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition text-xs shadow-sm cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Log Out Account</span>
        </button>

      </div>
    </div>
  );
};

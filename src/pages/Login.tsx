import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, Smartphone, Store, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register, setView } = useApp();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration Fields
  const [regName, setRegName] = useState('');
  const [regShopName, setRegShopName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regGst, setRegGst] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginVal) {
      setError("Please enter your registered mobile number or email");
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const res = await login(loginVal, password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Login failed");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "An unexpected error occurred during login");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regShopName || !regMobile || !regAddress) {
      setError("Please fill in all required fields marked with *");
      return;
    }

    if (regMobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await register({
        name: regName,
        shopName: regShopName,
        mobile: regMobile,
        email: regEmail,
        address: regAddress,
        gstNumber: regGst
      });
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Registration failed");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "An unexpected error occurred during registration");
    }
  };

  // Quick autofills for testing
  const autofillAdmin = () => {
    setLoginVal('admin@shubhamkrishisewa.com');
    setPassword('admin123');
    setIsRegisterMode(false);
    setError(null);
  };

  const autofillDealer = () => {
    setLoginVal('9876543211');
    setPassword('');
    setIsRegisterMode(false);
    setError(null);
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-8 bg-slate-50">
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-150 overflow-hidden">
        
        {/* Banner header */}
        <div className="bg-gradient-to-br from-[#12873A] to-[#16A34A] text-white px-6 py-9 text-center">
          <h2 className="text-xl xs:text-2xl font-extrabold tracking-tight">
            {isRegisterMode ? 'Dealer Registration' : 'Partner Portal Login'}
          </h2>
          <p className="text-green-100 text-xs mt-2 font-medium">
            {isRegisterMode 
              ? 'Register now to view wholesale pricing and order products' 
              : 'Log in using your registered mobile number or email'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-750 text-xs p-3.5 rounded-xl border border-red-100 mb-4 animate-shake font-bold">
              {error}
            </div>
          )}

          {!isRegisterMode ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">
                  Mobile Number or Email
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginVal}
                    onChange={(e) => setLoginVal(e.target.value)}
                    placeholder="Enter mobile or email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-sm text-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Optional password for admin, passwordless for dealers */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">
                  Password <span className="text-slate-400 font-normal">(Required only for Admin login)</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (if admin)"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-sm text-slate-800 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#12873A] hover:bg-[#16A34A] text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider mt-6 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Proceed to Access</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">
                    Dealer Contact Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g., Ramesh Patel"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">
                    Shop / Business Name *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regShopName}
                      onChange={(e) => setRegShopName(e.target.value)}
                      placeholder="e.g., Kisan Agro Agencies"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, '').slice(0,10))}
                      placeholder="10-digit number"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">
                    Shop Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Enter complete delivery and billing address"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-sm text-slate-800 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">
                    GSTIN Details <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={regGst}
                    onChange={(e) => setRegGst(e.target.value.toUpperCase())}
                    placeholder="e.g., 22AAAAA1111A1Z1"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#12873A] text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-150 mt-3.5">
                <ShieldCheck className="w-5 h-5 text-[#12873A] flex-shrink-0" />
                <span className="text-[10px] leading-snug font-medium">
                  Registration instantly activates your profile. Wholesaler approval is not required.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#12873A] hover:bg-[#16A34A] text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-xs uppercase tracking-wider mt-4 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Create & Activate Account</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle Modes */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError(null);
              }}
              className="text-[#12873A] hover:text-[#16A34A] text-xs font-bold underline cursor-pointer"
            >
              {isRegisterMode 
                ? 'Already registered? Log in here' 
                : 'Need an account? Register as New Dealer'}
            </button>
          </div>

          {/* Continue as Guest */}
          <div className="mt-3 text-center">
            <button
              onClick={() => setView('catalog')}
              className="text-slate-550 hover:text-slate-700 text-xs font-bold cursor-pointer"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        {/* Demo helpers box */}
        <div className="bg-amber-50/70 border-t border-amber-100 p-4 font-sans text-xs">
          <p className="font-bold text-amber-850 mb-2.5 flex items-center">
            🧪 Demo Credentials (Click to Autofill)
          </p>
          <div className="flex flex-col gap-2">
            <button 
              onClick={autofillAdmin}
              className="bg-amber-100/50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl font-bold transition text-left cursor-pointer"
            >
              Admin: <span className="font-mono font-normal">admin@shubhamkrishisewa.com / admin123</span>
            </button>
            <button 
              onClick={autofillDealer}
              className="bg-amber-100/50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl font-bold transition text-left cursor-pointer"
            >
              Dealer: <span className="font-mono font-normal">Vijay Kumar (Mobile: 9876543211)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

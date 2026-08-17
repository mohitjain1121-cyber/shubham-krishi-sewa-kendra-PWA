import React, { useState, useEffect } from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { X, Download, Share2 } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const { 
    showPrompt, 
    showIosPrompt, 
    installApp, 
    dismissPrompt 
  } = usePwaInstall();

  const [isVisible, setIsVisible] = useState(false);

  // Trigger entering animation
  useEffect(() => {
    if (showPrompt || showIosPrompt) {
      const timer = setTimeout(() => setIsVisible(true), 1500); // short delay after mount
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [showPrompt, showIosPrompt]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for slide-down animation before triggering state dismissal
    setTimeout(() => {
      dismissPrompt();
    }, 300);
  };

  if (!showPrompt && !showIosPrompt) return null;

  return (
    <div
      className={`absolute left-4 right-4 z-40 bg-white border border-slate-150 rounded-2xl shadow-xl p-4 transition-all duration-300 transform max-w-[448px] mx-auto ${
        isVisible 
          ? 'bottom-[74px] opacity-100 translate-y-0' 
          : 'bottom-0 opacity-0 translate-y-8 pointer-events-none'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* App Icon Container */}
        <div className="w-[48px] h-[48px] bg-green-50 text-[#12873A] flex items-center justify-center rounded-2xl border border-green-100 shrink-0 shadow-inner">
          <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8.8a7 7 0 0 1-9 9.2z"/>
            <path d="M12 11.5V20"/>
          </svg>
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-tight text-slate-800 uppercase">
              Install App
            </h3>
            <button 
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors focus:outline-none cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-[13px] font-bold text-slate-800 leading-tight mt-0.5">
            Shubham Krishi Sewa Kendra
          </h4>
          
          {showIosPrompt ? (
            // iOS instruction description
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5 flex flex-wrap items-center">
              Tap the Safari Share button{' '}
              <Share2 className="w-3.5 h-3.5 mx-1 inline text-blue-500" />
              {' '}then choose{' '}
              <span className="font-bold text-slate-800 mx-1">Add to Home Screen</span>
              {' '}to install on iPhone.
            </p>
          ) : (
            // Android/Chrome/Desktop prompt description
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
              Install the app for faster access and a better ordering experience.
            </p>
          )}

          {/* Prompt Buttons */}
          {!showIosPrompt && (
            <div className="flex items-center space-x-2 mt-3.5">
              <button
                onClick={handleInstall}
                className="flex-1 bg-[#12873A] hover:bg-[#16A34A] active:bg-[#0f6c2e] text-white text-[11px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl shadow-sm transition duration-150 transform hover:scale-[1.02] flex items-center justify-center space-x-1.5 focus:outline-none cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider py-2.5 px-3 rounded-xl transition duration-150 focus:outline-none cursor-pointer"
              >
                Not Now
              </button>
            </div>
          )}

          {showIosPrompt && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleDismiss}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition focus:outline-none cursor-pointer"
              >
                Got It
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

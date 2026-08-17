import React, { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';
import { BUSINESS_CONFIG } from '../config/business';

export const Splash: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 text-white p-6">
      <div className="text-center animate-fade-in flex flex-col items-center">
        {/* Animated Leaf/Sprout Icon */}
        <div className="bg-white/10 p-5 rounded-full border border-white/20 shadow-2xl mb-6 animate-pulse">
          <Sprout className="w-16 h-16 text-green-200" />
        </div>
        
        {/* Logo Text */}
        <h1 className="text-2xl font-extrabold tracking-wider mb-2 font-sans px-2 text-center max-w-sm">
          {BUSINESS_CONFIG.displayName}
        </h1>
        
        {/* Tagline */}
        <p className="text-green-100 text-xs font-medium tracking-wide max-w-xs mx-auto mb-8 uppercase">
          Wholesale Pesticides & Fertilizer Distribution Portal
        </p>
        
        {/* Loading Spinner and Text */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3"></div>
          <p className="text-green-200 text-xs font-mono tracking-widest">
            LOADING PLATFORM{dots}
          </p>
        </div>
      </div>
      
      {/* Footer copyright */}
      <div className="absolute bottom-6 text-green-300/60 text-xxs font-mono text-center px-4">
        © 2026 {BUSINESS_CONFIG.displayName}. ALL RIGHTS RESERVED.
      </div>
    </div>
  );
};

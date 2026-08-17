import { useState, useEffect } from 'react';

// Global state for PWA install prompt
let globalDeferredPrompt: any = null;
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(l => l());
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    notifyListeners();
  });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [dismissCount, setDismissCount] = useState<number>(0);
  const [lastDismissed, setLastDismissed] = useState<number>(0);

  useEffect(() => {
    // Check if running in standalone mode
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true ||
                         document.referrer.includes('android-app://');
      setIsInstalled(standalone);
    };

    // Check user agent for iOS (specifically Safari or WebKit based browsers)
    const checkIOS = () => {
      const ua = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
      setIsIOS(iosDevice);
    };

    checkStandalone();
    checkIOS();

    // Load dismissal state from localStorage
    const savedCount = localStorage.getItem('ad_pwa_dismiss_count');
    const savedTime = localStorage.getItem('ad_pwa_dismiss_time');
    if (savedCount) setDismissCount(parseInt(savedCount, 10));
    if (savedTime) setLastDismissed(parseInt(savedTime, 10));

    // Register listener for changes to globalDeferredPrompt
    const handleUpdate = () => {
      setDeferredPrompt(globalDeferredPrompt);
      checkStandalone();
    };

    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.warn("Installation prompt not available yet.");
      return false;
    }

    // Show the native browser prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      // Clear the deferred prompt, it can only be used once
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      notifyListeners();
      return true;
    }

    return false;
  };

  const dismissPrompt = () => {
    const newCount = dismissCount + 1;
    const now = Date.now();
    setDismissCount(newCount);
    setLastDismissed(now);
    localStorage.setItem('ad_pwa_dismiss_count', newCount.toString());
    localStorage.setItem('ad_pwa_dismiss_time', now.toString());
  };

  const resetDismissal = () => {
    setDismissCount(0);
    setLastDismissed(0);
    localStorage.removeItem('ad_pwa_dismiss_count');
    localStorage.removeItem('ad_pwa_dismiss_time');
  };

  // Logic to determine if we should show the custom banner prompt
  const canInstall = !!deferredPrompt && !isInstalled;
  
  // Show prompt if:
  // 1. App is not installed.
  // 2. We can trigger installation (beforeinstallprompt has fired).
  // 3. User has dismissed it fewer than 3 times total.
  // 4. It has been at least 24 hours (86400000 ms) since the last dismissal.
  const timeSinceLastDismiss = Date.now() - lastDismissed;
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
  const showPrompt = canInstall && 
                      dismissCount < 3 && 
                      (lastDismissed === 0 || timeSinceLastDismiss > cooldownPeriod);

  // iOS prompt logic (only show if iOS device, not standalone, and not dismissed)
  const showIosPrompt = isIOS && 
                        !isInstalled && 
                        dismissCount < 3 && 
                        (lastDismissed === 0 || timeSinceLastDismiss > cooldownPeriod);

  return {
    canInstall,
    isInstalled,
    isIOS,
    showPrompt,
    showIosPrompt,
    installApp,
    dismissPrompt,
    resetDismissal
  };
}

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useSomiti();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running inside installed standalone PWA, hide install prompts
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General fallback guide for desktop Chrome / Firefox / Safari
      setShowIOSGuide(true);
    }
  };

  // If install succeeded recently
  if (installSuccess) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>{language === 'bn' ? 'অ্যাপ ইনস্টল সম্পন্ন!' : 'App Installed!'}</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        title={
          language === 'bn'
            ? 'মোবাইল বা কম্পিউটারে অ্যাপ হিসেবে ইনস্টল করুন'
            : 'Install App on Mobile or Desktop'
        }
        className={
          className ||
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer'
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0 animate-bounce" />
        <span className="hidden sm:inline">
          {language === 'bn' ? 'অ্যাপ ইনস্টল' : 'Install App'}
        </span>
        <span className="sm:hidden">
          {language === 'bn' ? 'ইনস্টল' : 'Install'}
        </span>
      </button>

      {/* Guided Modal for iOS Safari and Unsupported Desktop Browsers */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-neutral-200 text-neutral-900 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  {language === 'bn'
                    ? 'অ্যাপ হিসেবে যুক্ত করুন (PWA)'
                    : 'Install as Web App (PWA)'}
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Friend Initiative Organization
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-neutral-700">
              {isIOS ? (
                <>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <div className="font-semibold text-neutral-900">
                      {language === 'bn' ? 'আইফোন / আইপ্যাড ইনস্টলেশন ধাপ:' : 'iPhone / iPad Installation:'}
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-emerald-700 bg-emerald-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        ১
                      </span>
                      <span>
                        {language === 'bn'
                          ? 'সাফারি ব্রাউজারের নিচে বা উপরে শেয়ার (Share)'
                          : 'Tap the Share icon'} <Share className="w-3.5 h-3.5 inline text-blue-600 mx-1" /> {language === 'bn' ? 'বাটনে চাপ দিন।' : 'in Safari toolbar.'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-emerald-700 bg-emerald-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        ২
                      </span>
                      <span>
                        {language === 'bn'
                          ? 'মেনু থেকে নিচে স্ক্রল করে "Add to Home Screen" (হোম স্ক্রিনে যোগ) নির্বাচন করুন।'
                          : 'Scroll down and tap "Add to Home Screen".'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-emerald-700 bg-emerald-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        ৩
                      </span>
                      <span>
                        {language === 'bn'
                          ? 'উপরে ডানে "Add" এ চাপ দিন। আপনার ফোনে সরাসরি অ্যাপ আইকন যোগ হয়ে যাবে!'
                          : 'Tap "Add" in the top right. The app will appear on your home screen!'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <div className="font-semibold text-neutral-900">
                      {language === 'bn' ? 'ব্রাউজার ইনস্টলেশন নির্দেশিকা:' : 'Browser Installation Guide:'}
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-emerald-700 bg-emerald-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        ১
                      </span>
                      <span>
                        {language === 'bn'
                          ? 'ব্রাউজারের ঠিকানা বার (Address bar) এর ডানপাশে থাকা "Install" আইকনে চাপ দিন অথবা মেনু (⋮) খুলুন।'
                          : 'Click the "Install" icon in your browser address bar or open the browser menu (⋮).'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-emerald-700 bg-emerald-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        ২
                      </span>
                      <span>
                        {language === 'bn'
                          ? '"Install Friend Initiative Organization" বা "Add to Home Screen" এ ক্লিক করুন।'
                          : 'Select "Install Friend Initiative Organization" or "Add to Home Screen".'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white py-2 text-xs font-bold transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বুঝেছি / বন্ধ করুন' : 'Got it / Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

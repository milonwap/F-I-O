import React, { useState } from 'react';
import { X, User, Lock, Eye, EyeOff, AlertCircle, LogOut, ArrowRight, ShieldCheck, KeyRound, Fingerprint } from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { BiometricAuthModal } from './BiometricAuthModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, logout, currentMember, language } = useSomiti();

  const [idOrPhone, setIdOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetQuery = idOrPhone.trim();

    if (!targetQuery) {
      setError(
        language === 'bn'
          ? 'সদস্য আইডি অথবা মোবাইল নম্বর দিন'
          : 'Please enter Member ID or Mobile number'
      );
      return;
    }

    if (!password.trim()) {
      setError(
        language === 'bn'
          ? 'পাসওয়ার্ড দিন (ইউজার আইডি ও পাসওয়ার্ড ছাড়া লগইন করা যাবে না)'
          : 'Password is required (Cannot login without User ID and Password)'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(targetQuery, password);
      setIsSubmitting(false);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || (language === 'bn' ? 'লগইন ব্যর্থ হয়েছে' : 'Login failed'));
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || (language === 'bn' ? 'লগইন ব্যর্থ হয়েছে' : 'Login failed'));
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden text-neutral-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight text-white">
                Friend Initiative Organization
              </h3>
              <div className="text-[11px] text-blue-300 font-medium">
                {language === 'bn' ? 'সদস্য পোর্টাল সুইচ / লগইন' : 'Member Portal Switch / Sign In'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner if logged in */}
        {currentMember && (
          <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-600">{language === 'bn' ? 'বর্তমানে সক্রিয়:' : 'Active User:'}</span>
              <strong className="text-emerald-950 font-bold">
                {language === 'bn' ? currentMember.nameBn : currentMember.nameEn} ({currentMember.memberNo})
              </strong>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-800 bg-red-100/80 hover:bg-red-200/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        )}

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 p-3 text-xs bg-red-50 text-red-800 border border-red-200 rounded-xl font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form with User ID + Password */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200">
            {/* User ID - User enters manually */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">
                {language === 'bn' ? 'ইউজার আইডি / মোবাইল নম্বর' : 'User ID / Phone'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: FIO-101 বা 107' : 'e.g. FIO-101 or 107'}
                  value={idOrPhone}
                  onChange={(e) => setIdOrPhone(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-neutral-900 font-medium"
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Password - Hidden/Masked */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={language === 'bn' ? 'পাসওয়ার্ড দিন' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-9 py-2 text-sm border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-neutral-900 font-medium"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 active:scale-[0.99] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'লগইন করুন ও প্রবেশ করুন' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Biometric Quick Login Button */}
            <button
              type="button"
              onClick={() => setIsBiometricOpen(true)}
              className="w-full py-2.5 px-4 text-xs font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 active:scale-[0.99] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-emerald-700 dark:text-emerald-400 animate-pulse" />
              <span>{language === 'bn' ? '🔑 ফিঙ্গারপ্রিন্ট / ফেস আইডি দিয়ে লগইন (Biometric)' : '🔑 Biometric Quick Login (Fingerprint / Face ID)'}</span>
            </button>
          </form>
        </div>
      </div>

      <BiometricAuthModal
        isOpen={isBiometricOpen}
        onClose={() => setIsBiometricOpen(false)}
        onSuccess={() => {
          if (onSuccess) onSuccess();
          onClose();
        }}
      />
    </div>
  );
};

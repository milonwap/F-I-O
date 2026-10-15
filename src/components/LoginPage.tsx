import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Globe,
  MapPin,
  ShieldCheck,
  KeyRound,
  Fingerprint,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { Member } from '../types/somiti';
import { BiometricAuthModal } from './BiometricAuthModal';

interface LoginPageProps {
  onLoginSuccess: (member: Member) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { members, login, language, setLanguage } = useSomiti();

  const [idOrPhone, setIdOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetQuery = idOrPhone.trim();

    if (!targetQuery) {
      setError(
        language === 'bn'
          ? 'ইউজার আইডি অথবা মোবাইল নম্বর দিন'
          : 'Please enter User ID or Mobile number'
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

    setIsLoading(true);
    try {
      const res = await login(targetQuery, password);
      setIsLoading(false);
      if (res.success) {
        const raw = targetQuery.trim().toLowerCase();
        const cleanPhone = raw.replace(/[^0-9]/g, '');
        const logged = members.find((m) => {
          const memNo = (m.memberNo || '').toLowerCase();
          return (
            memNo === raw ||
            memNo === `fio-${raw}` ||
            (cleanPhone.length >= 5 && (m.phone || '').replace(/[^0-9]/g, '').includes(cleanPhone)) ||
            (m.nameBn && m.nameBn.trim().toLowerCase() === raw) ||
            (m.nameEn && m.nameEn.trim().toLowerCase() === raw)
          );
        });
        if (logged) {
          onLoginSuccess(logged);
        }
      } else {
        setError(
          res.error ||
            (language === 'bn'
              ? 'ইউজার আইডি অথবা পাসওয়ার্ড সঠিক নয়'
              : 'Invalid User ID or Password')
        );
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || (language === 'bn' ? 'লগইন ব্যর্থ হয়েছে' : 'Login failed'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting in rich blue */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language Switch */}
      <div className="w-full max-w-md mx-auto flex justify-end relative z-10 pt-2">
        <button
          onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-blue-300 text-xs font-semibold border border-blue-800/60 shadow-xs transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>
      </div>

      {/* Main Centered Login Card */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10 py-6">
        <div className="bg-white text-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-100/50">
          
          {/* Welcome Header with Somiti Name */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md border-2 border-blue-500/30">
              FIO
            </div>
            
            <div className="text-xs uppercase tracking-widest font-bold text-blue-700 pt-1">
              {language === 'bn' ? 'স্বাগতম' : 'Welcome'}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight leading-snug">
              Friend Initiative Organization
            </h1>

            <p className="text-xs text-neutral-500 flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'bn' ? 'সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : 'Sitaikunda, Kotalipara, Gopalgonj'}</span>
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Option Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID Field - User types manually */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                {language === 'bn' ? 'ইউজার আইডি / সদস্য নম্বর' : 'User ID / Member No'}
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
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-neutral-900 font-medium transition-all"
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Field - Hidden/Masked */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={language === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-neutral-900 font-medium transition-all"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer transition-colors"
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

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 text-sm font-bold text-white bg-blue-700 hover:bg-blue-600 active:bg-blue-800 rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <span>{language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{language === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Biometric Quick Login Button */}
            <button
              type="button"
              onClick={() => setIsBiometricOpen(true)}
              className="w-full py-2.5 px-4 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span>{language === 'bn' ? '🔑 ফিঙ্গারপ্রিন্ট / ফেস আইডি দিয়ে লগইন (Biometric)' : '🔑 Biometric Quick Login (Fingerprint / Face ID)'}</span>
            </button>
          </form>

          {/* Simple Trust / Security Note */}
          <div className="mt-6 pt-4 border-t border-neutral-100 text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'bn' ? 'নিরাপদ সমবায় পোর্টাল · রেজি: FIO-7412' : 'Secure Member Portal · Reg: FIO-7412'}</span>
          </div>

        </div>
      </div>

      {/* Biometric Authentication & Device Binding Modal */}
      <BiometricAuthModal
        isOpen={isBiometricOpen}
        onClose={() => setIsBiometricOpen(false)}
        onSuccess={() => {
          // If login succeeded through biometric, active user is set
          const activeId = localStorage.getItem('somiti_current_member_id');
          const found = members.find((m) => m.id === activeId || m.memberNo === activeId);
          if (found) {
            onLoginSuccess(found);
          } else if (members[0]) {
            onLoginSuccess(members[0]);
          }
        }}
      />

      {/* Clean Bottom Footer */}
      <footer className="w-full max-w-md mx-auto text-center text-xs text-blue-200/60 py-2 relative z-10">
        © 2026 Friend Initiative Organization
      </footer>
    </div>
  );
};

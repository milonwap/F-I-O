import React from 'react';
import {
  LogOut,
  Shield,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Lock,
  KeyRound,
  Users,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { Member } from '../types/somiti';
import { formatCurrency, formatDate } from '../utils/formatters';

interface LogoutPageProps {
  onCancel: () => void;
  onLoggedOut: () => void;
  onSwitchMember?: (member: Member) => void;
}

export const LogoutPage: React.FC<LogoutPageProps> = ({
  onCancel,
  onLoggedOut,
  onSwitchMember,
}) => {
  const { currentMember, members, logout, login, language } = useSomiti();

  if (!currentMember) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-neutral-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">
          {language === 'bn' ? 'কোনো সক্রিয় লগইন সেশন নেই' : 'No Active Session'}
        </h2>
        <p className="text-xs text-neutral-500">
          {language === 'bn' ? 'আপনি বর্তমানে লগআউট অবস্থায় আছেন।' : 'You are currently logged out.'}
        </p>
        <button
          onClick={onLoggedOut}
          className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl"
        >
          {language === 'bn' ? 'লগইন পেজে যান' : 'Go to Login Page'}
        </button>
      </div>
    );
  }

  const handleConfirmLogout = () => {
    logout();
    onLoggedOut();
  };

  const isCashier = currentMember.role === 'lead_executive' || currentMember.role === 'cashier';

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 sm:py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 shadow-xs">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                {language === 'bn' ? 'অ্যাকাউন্ট লগআউট কনফার্মেশন' : 'Session Sign-Out'}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
                {language === 'bn' ? 'লগআউট নিশ্চিতকরণ' : 'Confirm Logout'}
              </h1>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'bn' ? 'অ্যাকাউন্টে ফিরে যান' : 'Back to Account'}</span>
          </button>
        </div>

        {/* Current Logged In Member Profile Card */}
        <div className="my-6 p-5 rounded-xl bg-neutral-50 border border-neutral-200">
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'বর্তমানে সক্রিয় অ্যাকাউন্ট তথ্য:' : 'Currently Active Member Account:'}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-emerald-800 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-xs border-2 border-emerald-100">
                {currentMember.nameEn.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-neutral-900">
                    {language === 'bn' ? currentMember.nameBn : currentMember.nameEn}
                  </h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-neutral-800 border border-neutral-300">
                    {currentMember.memberNo}
                  </span>
                </div>
                <div className="text-xs text-neutral-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    {currentMember.phone}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {currentMember.address || 'সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                  isCashier
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-neutral-200 text-neutral-800 border-neutral-300'
                }`}
              >
                {isCashier
                  ? language === 'bn'
                    ? '👑 কোষাধ্যক্ষ ও প্রধান নিয়ন্ত্রক'
                    : '👑 Chief Cashier'
                  : language === 'bn'
                  ? '🔒 সাধারণ সদস্য (কেবল নিজের তথ্য)'
                  : '🔒 General Member'}
              </span>
              <div className="text-xs text-neutral-500 font-mono mt-1">
                {language === 'bn' ? 'মোট সঞ্চয় জমা:' : 'Total Savings:'}{' '}
                <strong className="text-neutral-900">{formatCurrency(currentMember.totalSavingsDeposited, language)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Security Alert & Explanation */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <Shield className="w-4 h-4 text-amber-700" />
            <span>{language === 'bn' ? 'সদস্য গোপনীয়তা ও সেশন নিরাপত্তা নোটিশ:' : 'Session Security Notice:'}</span>
          </div>
          <p className="leading-relaxed text-amber-800">
            {language === 'bn'
              ? 'লগআউট করলে আপনার পাসবই, কিস্তির তথ্য ও লেনদেন নিরাপদে বন্ধ হবে। পরবর্তী সময়ে পুনরায় তথ্য দেখতে আপনার সদস্য আইডি ও পাসওয়ার্ড দিয়ে লগইন করতে হবে।'
              : 'Signing out safely closes your session. You will need your Member ID and password to access your passbook again.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            {language === 'bn' ? 'বাতিল করুন (লগইন থাকুন)' : 'Cancel & Stay Logged In'}
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 active:bg-red-900 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{language === 'bn' ? 'নিরাপদে লগআউট করুন' : 'Log Out Safely'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

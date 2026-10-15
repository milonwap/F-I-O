import React, { useState, useEffect } from 'react';
import { X, KeyRound, Shield, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, User, Copy, Check } from 'lucide-react';
import { Member } from '../types/somiti';
import { useSomiti } from '../context/SomitiContext';
import { updateCredentialsInCloudDb } from '../services/cloudDb';

export interface ManageCredentialsModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSave?: (memberId: string, memberNo: string, pass: string) => Promise<{ success: boolean; error?: string }> | void;
  onUpdate?: (memberId: string, memberNo: string, pass: string) => Promise<{ success: boolean; error?: string }> | void;
}

export const ManageCredentialsModal: React.FC<ManageCredentialsModalProps> = ({
  member,
  isOpen,
  onClose,
  onSuccess,
  onSave,
  onUpdate,
}) => {
  const somitiContext = useSomiti();
  const language = somitiContext?.language || 'bn';
  const members = somitiContext?.members || [];
  const updateMemberCredentials = somitiContext?.updateMemberCredentials;
  const updateMember = somitiContext?.updateMember;

  const [memberNo, setMemberNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (member) {
      setMemberNo(member.memberNo || '');
      setPassword(member.password || '');
      setError('');
      setSuccess('');
      setCopied(false);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleGenerateRandomPassword = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPassword(randomPin);
    setShowPassword(true);
  };

  const handleCopyCredentials = () => {
    const text = `সমিতি লগইন ক্রেডেনশিয়াল:\nসদস্য নাম: ${member.nameBn || member.nameEn}\nইউজার আইডি: ${memberNo}\nপাসওয়ার্ড: ${password}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanMemberNo = memberNo.trim().toUpperCase();
    const cleanPassword = password.trim();

    if (!cleanMemberNo) {
      setError(language === 'bn' ? 'ইউজার আইডি দিন' : 'User ID is required');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 3) {
      setError(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৩ অক্ষরের হতে হবে' : 'Password must be at least 3 characters');
      return;
    }

    // Check duplicate User ID among other members
    const duplicate = members.find(
      (m) => m.id !== member.id && (m.memberNo || '').toUpperCase() === cleanMemberNo
    );
    if (duplicate) {
      setError(
        language === 'bn'
          ? `ইউজার আইডি '${cleanMemberNo}' ইতোমধ্যে ${duplicate.nameBn || duplicate.nameEn}-এর জন্য ব্যবহৃত হচ্ছে!`
          : `User ID '${cleanMemberNo}' is already taken by another member!`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let handled = false;

      // 1. Try prop handler if passed: onSave or onUpdate
      if (typeof onSave === 'function') {
        const res = await onSave(member.id, cleanMemberNo, cleanPassword);
        if (res && res.error) {
          setIsSubmitting(false);
          setError(res.error);
          return;
        }
        handled = true;
      } else if (typeof onUpdate === 'function') {
        const res = await onUpdate(member.id, cleanMemberNo, cleanPassword);
        if (res && res.error) {
          setIsSubmitting(false);
          setError(res.error);
          return;
        }
        handled = true;
      }

      // 2. Safely call context updateMemberCredentials if available
      if (typeof updateMemberCredentials === 'function') {
        const res = await updateMemberCredentials(member.id, cleanMemberNo, cleanPassword);
        if (!res?.success && res?.error) {
          // If server reported error, also attempt cloud DB directly as fallback
          const cloudRes = await updateCredentialsInCloudDb(member.id, cleanMemberNo, cleanPassword);
          if (!cloudRes.success) {
            setIsSubmitting(false);
            setError(res.error);
            return;
          }
        }
        handled = true;
      } else {
        // Fallback: direct cloud DB update + local updateMember
        await updateCredentialsInCloudDb(member.id, cleanMemberNo, cleanPassword);
        if (typeof updateMember === 'function') {
          updateMember({
            ...member,
            memberNo: cleanMemberNo,
            password: cleanPassword,
          });
        }
        handled = true;
      }

      setIsSubmitting(false);
      setSuccess(
        language === 'bn'
          ? 'ইউজার আইডি ও পাসওয়ার্ড কেন্দ্রীয় ডাটাবেসে সফলভাবে আপডেট হয়েছে!'
          : 'Credentials updated successfully in central database!'
      );

      setTimeout(() => {
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || (language === 'bn' ? 'ডাটাবেস সংরক্ষণ ত্রুটি' : 'Error updating credentials'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700/80 text-white flex items-center justify-center font-bold shadow-xs">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight text-white">
                {language === 'bn' ? 'সদস্য ক্রেডেনশিয়াল ব্যবস্থাপনা' : 'Manage Member Credentials'}
              </h3>
              <div className="text-[11px] text-emerald-200 font-medium">
                {language === 'bn' ? 'ইউজার আইডি ও গোপন পাসওয়ার্ড নিয়ন্ত্রণ' : 'Admin User ID & Password Control'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Preview Strip */}
        <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-500" />
            <span className="font-bold text-neutral-900">
              {language === 'bn' ? member.nameBn : member.nameEn}
            </span>
            <span className="text-neutral-500 font-mono">({member.memberNo})</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700 uppercase">
            {member.role}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* User ID (Member No) */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
              {language === 'bn' ? 'সদস্য ইউজার আইডি (Member ID)' : 'Member User ID'}
            </label>
            <input
              type="text"
              value={memberNo}
              onChange={(e) => setMemberNo(e.target.value.toUpperCase())}
              placeholder="e.g. FIO-101"
              className="w-full px-3.5 py-2.5 text-sm font-mono font-bold uppercase tracking-wider border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <span className="text-[11px] text-neutral-500 mt-1 block">
              {language === 'bn' ? 'সদস্য এই আইডি দিয়ে সিস্টেমে লগইন করবেন' : 'Member uses this ID to log in'}
            </span>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-neutral-700 uppercase">
                {language === 'bn' ? 'লগইন পাসওয়ার্ড (Password)' : 'Login Password'}
              </label>
              <button
                type="button"
                onClick={handleGenerateRandomPassword}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-emerald-600" />
                <span>{language === 'bn' ? 'নতুন পিন তৈরি' : 'Generate PIN'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="গোপন পাসওয়ার্ড দিন"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono font-bold border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-neutral-500">
                {language === 'bn' ? 'কমপক্ষে ৩ অক্ষরের গোপন পাসওয়ার্ড' : 'At least 3 characters'}
              </span>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-500" />}
                <span>{copied ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied!') : (language === 'bn' ? 'কপি করুন' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Central database persistence note */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {language === 'bn'
                ? 'সংরক্ষণ করার সাথে সাথে কেন্দ্রীয় ডাটাবেসে সেভ হবে এবং যেকোনো ডিভাইস হতে সদস্য নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।'
                : 'Saves immediately to central database. The member can log in on any device with this updated credential.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                  : (language === 'bn' ? 'কেন্দ্রীয় ডাটাবেসে সেভ করুন' : 'Save to Central DB')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

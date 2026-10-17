import React, { useState, useEffect } from 'react';
import { X, Edit3, Calendar, AlertTriangle, CheckCircle, DollarSign, FileText, ArrowRight } from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { KistiTransaction } from '../types/somiti';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';

interface EditKistiModalProps {
  transaction: KistiTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditKistiModal: React.FC<EditKistiModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { members, editKistiTransaction, language } = useSomiti();

  const [date, setDate] = useState('');
  const [targetMonth, setTargetMonth] = useState('');
  const [kistiAmount, setKistiAmount] = useState<number>(0);
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Synchronize state when modal opens or transaction changes
  useEffect(() => {
    if (transaction) {
      const origPrincipal = transaction.principalAmount !== undefined
        ? transaction.principalAmount
        : (transaction.type === 'savings' ? Math.max(0, transaction.amount - (transaction.fineAmount || 0)) : transaction.amount);
      const origFine = Number(transaction.fineAmount || (transaction.type === 'fine_fee' ? transaction.amount : 0));

      setDate(transaction.date ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setTargetMonth(transaction.targetMonth || transaction.periodMonth || new Date().toISOString().slice(0, 7));
      setKistiAmount(origPrincipal);
      setFineAmount(origFine);
      setCorrectionReason(transaction.correctionReason || '');
      setError(null);
      setSuccess(false);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const member = members.find((m) => m.id === transaction.memberId);

  // Original amounts
  const oldKisti = transaction.principalAmount !== undefined
    ? transaction.principalAmount
    : (transaction.type === 'savings' ? Math.max(0, transaction.amount - (transaction.fineAmount || 0)) : transaction.amount);
  const oldFine = Number(transaction.fineAmount || (transaction.type === 'fine_fee' ? transaction.amount : 0));
  const oldTotal = oldKisti + oldFine;

  // New amounts
  const newKistiNum = Math.max(0, Number(kistiAmount) || 0);
  const newFineNum = Math.max(0, Number(fineAmount) || 0);
  const newTotal = newKistiNum + newFineNum;

  // Differences
  const kistiDiff = newKistiNum - oldKisti;
  const fineDiff = newFineNum - oldFine;
  const totalCashDiff = kistiDiff + fineDiff;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError(language === 'bn' ? 'অনুগ্রহ করে সঠিক তারিখ দিন' : 'Please select a valid date');
      return;
    }
    if (!targetMonth) {
      setError(language === 'bn' ? 'অনুগ্রহ করে কিস্তির মাস নির্বাচন করুন' : 'Please select target month');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await editKistiTransaction({
        transactionId: transaction.id,
        newKistiAmount: newKistiNum,
        newFineAmount: newFineNum,
        newDate: date,
        newTargetMonth: targetMonth,
        correctionReason: correctionReason.trim(),
      });

      if (!result.success) {
        setError(result.error || (language === 'bn' ? 'সংশোধন ব্যর্থ হয়েছে' : 'Failed to edit transaction'));
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || (language === 'bn' ? 'অপ্রত্যাশিত ত্রুটি ঘটেছে' : 'Unexpected error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-900 via-amber-950 to-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {language === 'bn' ? 'কিস্তি লেনদেন সংশোধন / এডিট' : 'Edit Kisti Collection Record'}
              </h3>
              <p className="text-[11px] text-amber-200/80 font-mono">
                {transaction.receiptNo} · {member ? (language === 'bn' ? member.nameBn : member.nameEn) : ''} ({member?.memberNo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-neutral-700">
            <span className="font-semibold text-amber-900 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'লেনদেন রিয়েল-টাইম প্রভাব (Financial Impact):' : 'Financial Impact Preview:'}</span>
            </span>
            <span className="font-mono text-[11px] text-neutral-500">
              {language === 'bn' ? 'স্বয়ংক্রিয় রি-ক্যালকুলেশন' : 'Auto Recalculation'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
              <div className="text-[10px] text-neutral-500 uppercase font-medium">
                {language === 'bn' ? 'মূল কিস্তি পরিবর্তন' : 'Kisti Change'}
              </div>
              <div className="font-mono font-bold text-xs mt-0.5">
                <span className="text-neutral-500 line-through mr-1">৳{toBengaliNumber(oldKisti)}</span>
                <span className="text-emerald-800">৳{toBengaliNumber(newKistiNum)}</span>
              </div>
              <div className="text-[10px] font-mono mt-0.5">
                {kistiDiff > 0 ? (
                  <span className="text-emerald-700 font-bold">+{formatCurrency(kistiDiff, language)}</span>
                ) : kistiDiff < 0 ? (
                  <span className="text-rose-600 font-bold">{formatCurrency(kistiDiff, language)}</span>
                ) : (
                  <span className="text-neutral-400">০ ৳</span>
                )}
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
              <div className="text-[10px] text-neutral-500 uppercase font-medium">
                {language === 'bn' ? 'জরিমানা পরিবর্তন' : 'Fine Change'}
              </div>
              <div className="font-mono font-bold text-xs mt-0.5">
                <span className="text-neutral-500 line-through mr-1">৳{toBengaliNumber(oldFine)}</span>
                <span className="text-amber-900">৳{toBengaliNumber(newFineNum)}</span>
              </div>
              <div className="text-[10px] font-mono mt-0.5">
                {fineDiff > 0 ? (
                  <span className="text-amber-800 font-bold">+{formatCurrency(fineDiff, language)}</span>
                ) : fineDiff < 0 ? (
                  <span className="text-rose-600 font-bold">{formatCurrency(fineDiff, language)}</span>
                ) : (
                  <span className="text-neutral-400">০ ৳</span>
                )}
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
              <div className="text-[10px] text-neutral-500 uppercase font-medium">
                {language === 'bn' ? 'নগদ ক্যাশ পরিবর্তন' : 'Cash In Hand Diff'}
              </div>
              <div className="font-mono font-bold text-xs mt-0.5">
                <span className="text-neutral-500 line-through mr-1">৳{toBengaliNumber(oldTotal)}</span>
                <span className="text-neutral-900 font-black">৳{toBengaliNumber(newTotal)}</span>
              </div>
              <div className="text-[10px] font-mono mt-0.5">
                {totalCashDiff > 0 ? (
                  <span className="text-emerald-700 font-bold">+{formatCurrency(totalCashDiff, language)}</span>
                ) : totalCashDiff < 0 ? (
                  <span className="text-rose-600 font-bold">{formatCurrency(totalCashDiff, language)}</span>
                ) : (
                  <span className="text-neutral-400">০ ৳</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                {language === 'bn'
                  ? 'লেনদেন সফলভাবে আপডেট ও রিয়েল-টাইমে ব্যালেন্স সমন্বয় করা হয়েছে!'
                  : 'Transaction and financial balances successfully updated in Firestore!'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Payment Date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                {language === 'bn' ? 'পরিশোধের তারিখ (Payment Date)' : 'Payment Date'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white"
                />
              </div>
            </div>

            {/* Target Month */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                {language === 'bn' ? 'কিস্তির মাস (Target Month)' : 'Target Month'}
              </label>
              <input
                type="month"
                required
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Kisti Principal Amount */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                {language === 'bn' ? 'মূল কিস্তি সঞ্চয় আমানত (৳)' : 'Kisti Amount (Principal ৳)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={kistiAmount}
                  onChange={(e) => setKistiAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold bg-white text-emerald-800"
                />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                {language === 'bn' ? 'সরাসরি সদস্যের সঞ্চয় ভল্টে যোগ হবে' : 'Adds directly to member savings'}
              </p>
            </div>

            {/* Late Fee / Fine Amount */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                {language === 'bn' ? 'বিলম্ব জরিমানা / লেট ফি (৳)' : 'Late Fee / Fine (৳)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold bg-white text-amber-900"
                />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                {language === 'bn' ? 'সমিতির প্রশাসনিক ফান্ডের জরিমানা' : 'Administrative revenue'}
              </p>
            </div>
          </div>

          {/* Total Collected Display Strip */}
          <div className="p-3 bg-neutral-100/80 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-700">
              {language === 'bn' ? 'সর্বমোট গৃহীত টাকা (Total Paid):' : 'Total Collected:'}
            </span>
            <span className="font-mono font-black text-sm text-neutral-900">
              {formatCurrency(newTotal, language)}
            </span>
          </div>

          {/* Correction Reason / Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {language === 'bn' ? 'সংশোধনের কারণ / মন্তব্য (Correction Reason / Notes)' : 'Correction Reason / Notes'}
            </label>
            <input
              type="text"
              placeholder={language === 'bn' ? 'যেমন: ভুল এন্ট্রি সংশোধন, তারিখ পরিবর্তন...' : 'e.g. Corrected typo in kisti amount...'}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-amber-700 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{language === 'bn' ? 'সংরক্ষণ ও ব্যালেন্স আপডেট' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

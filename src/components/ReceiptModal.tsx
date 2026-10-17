import React, { useEffect } from 'react';
import { Printer, X, CheckCircle, FileText } from 'lucide-react';
import { KistiTransaction, Member, Language } from '../types/somiti';
import { formatCurrency, formatDate, numberToWords } from '../utils/formatters';

interface ReceiptModalProps {
  transaction: KistiTransaction | null;
  member: Member | undefined;
  language: Language;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  member,
  language,
  onClose,
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Inject A5 print stylesheet and body class when receipt is open
  useEffect(() => {
    if (transaction) {
      document.body.classList.add('receipt-open');
      const styleId = 'receipt-a5-print-style';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
          @page {
            size: A5 portrait;
            margin: 6mm 8mm;
          }
          @media print {
            body {
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `;
        document.head.appendChild(styleEl);
      }

      return () => {
        document.body.classList.remove('receipt-open');
        const el = document.getElementById(styleId);
        if (el) el.remove();
      };
    }
  }, [transaction]);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'savings':
        return language === 'bn' ? 'মাসিক সঞ্চয় কিস্তি' : 'Monthly Savings Kisti';
      case 'loan_repayment':
        return language === 'bn' ? 'ঋণের কিস্তি পরিশোধ' : 'Loan Repayment Installment';
      case 'project_share':
        return language === 'bn' ? 'প্রকল্প শেয়ার / বিনিয়োগ চাঁদা' : 'Project Investment Share';
      case 'fine_fee':
        return language === 'bn' ? 'ভর্তি ফি / অন্যান্য ফি' : 'Admission / Other Fee';
      default:
        return type;
    }
  };

  return (
    <div
      onClick={onClose}
      className="receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="printable-receipt relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-y-auto max-h-[92vh] print:max-h-none print:overflow-visible print:border print:border-neutral-800 print:shadow-none print:rounded-lg text-neutral-900 my-auto flex flex-col"
      >
        {/* Header (hidden in print, sticky top so close button is always visible) */}
        <div className="no-print sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-blue-900/50 shadow-xs">
          <div className="flex items-center gap-2 pr-10">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold tracking-wide">
              {language === 'bn' ? 'টাকা জমার অফিসিয়াল মানি রসিদ' : 'Official Money Receipt'}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              <FileText className="w-3 h-3" /> A5 1-Page
            </span>
          </div>

          {/* Top-Right Floating Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label={language === 'bn' ? 'রসিদ বন্ধ করুন' : 'Close'}
            title={language === 'bn' ? 'রসিদ বন্ধ করুন (Esc)' : 'Close Receipt (Esc)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper (Strictly 1-Page A5 Optimized) */}
        <div className="p-5 sm:p-6 print:p-3.5 bg-white flex-1 print:flex-none text-neutral-900">
          {/* Somiti Header */}
          <div className="text-center pb-2.5 border-b-2 border-neutral-800">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
              Friend Initiative Organization
            </h2>
            <div className="text-[11px] font-bold text-emerald-800 print:text-neutral-800">
              {language === 'bn' ? 'রেজিস্ট্রেশন নং: FIO-7412 · যেহেতু ২০২৪ (Since 2024)' : 'Reg No: FIO-7412 · Since 2024'}
            </div>
            <div className="text-[10px] text-neutral-600 mt-0.5">
              <span>{language === 'bn' ? 'সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : 'Sitaikunda, Kotalipara, Gopalgonj'}</span>
            </div>
            <div className="mt-2 inline-block px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-neutral-100 border border-neutral-300 rounded print:border-neutral-700">
              {language === 'bn' ? 'টাকা জমার মানি রসিদ (গ্রাহক কপি)' : 'Money Receipt (Customer Copy)'}
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 py-2 text-xs border-b border-neutral-200">
            <div>
              <span className="text-neutral-500">{language === 'bn' ? 'রসিদ নং:' : 'Receipt No:'}</span>{' '}
              <strong className="font-mono tabular-nums text-neutral-950 font-bold">{transaction.receiptNo}</strong>
            </div>
            <div className="text-right">
              <span className="text-neutral-500">{language === 'bn' ? 'তারিখ:' : 'Date:'}</span>{' '}
              <strong className="font-mono tabular-nums text-neutral-950 font-bold">{formatDate(transaction.date, language)}</strong>
            </div>
            <div>
              <span className="text-neutral-500">{language === 'bn' ? 'সদস্য আইডি:' : 'Member ID:'}</span>{' '}
              <strong className="font-mono text-neutral-950 font-bold">{member?.memberNo || '-'}</strong>
            </div>
            <div className="text-right">
              <span className="text-neutral-500">{language === 'bn' ? 'পরিশোধ মাধ্যম:' : 'Payment Mode:'}</span>{' '}
              <strong className="capitalize text-neutral-950 font-bold">{transaction.paymentMethod}</strong>
            </div>
          </div>

          {/* Body */}
          <div className="py-2.5 space-y-1 text-xs">
            <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 print:border-neutral-200">
              <span className="text-neutral-600">{language === 'bn' ? 'সদস্যের পূর্ণ নাম:' : "Member's Full Name:"}</span>
              <span className="font-bold text-neutral-950">
                {language === 'bn' ? member?.nameBn || member?.nameEn : member?.nameEn}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 print:border-neutral-200">
              <span className="text-neutral-600">{language === 'bn' ? 'মোবাইল নম্বর:' : 'Mobile Phone:'}</span>
              <span className="font-mono text-neutral-950 font-semibold">{member?.phone || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 print:border-neutral-200">
              <span className="text-neutral-600">{language === 'bn' ? 'জমার বিবরণ / খাত:' : 'Payment Purpose:'}</span>
              <span className="font-semibold text-neutral-950">{getTypeName(transaction.type)}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 print:border-neutral-200">
              <span className="text-neutral-600">{language === 'bn' ? 'চলতি মাস / কিস্তির মেয়াদ:' : 'Period / Month:'}</span>
              <span className="font-mono tabular-nums text-neutral-950 font-bold">{transaction.targetMonth || transaction.periodMonth}</span>
            </div>
            {transaction.fineAmount !== undefined && transaction.fineAmount > 0 && (
              <>
                <div className="flex justify-between items-center py-1 text-emerald-900 bg-emerald-50/80 px-2 rounded print:border print:border-neutral-300">
                  <span className="font-medium text-[11px]">{language === 'bn' ? 'মূল কিস্তি / সঞ্চয় জমা:' : 'Principal Savings Deposit:'}</span>
                  <span className="font-mono font-bold text-[11px]">
                    {formatCurrency(transaction.principalAmount !== undefined ? transaction.principalAmount : Math.max(0, transaction.amount - transaction.fineAmount), language)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 text-amber-900 bg-amber-50/80 px-2 rounded print:border print:border-neutral-300">
                  <span className="font-medium text-[11px]">{language === 'bn' ? 'বিলম্ব ফি / জরিমানা:' : 'Late Fee / Fine:'}</span>
                  <span className="font-mono font-bold text-[11px]">
                    +{formatCurrency(transaction.fineAmount, language)}
                  </span>
                </div>
              </>
            )}
            {transaction.remarks && (
              <div className="flex justify-between items-start py-0.5">
                <span className="text-neutral-600 text-[11px]">{language === 'bn' ? 'মন্তব্য:' : 'Remarks:'}</span>
                <span className="text-neutral-800 text-[11px] italic max-w-xs text-right">{transaction.remarks}</span>
              </div>
            )}
          </div>

          {/* Amount Box */}
          <div className="p-2.5 sm:p-3 bg-neutral-50 print:bg-neutral-100 border border-neutral-300 rounded-lg flex items-center justify-between my-2">
            <div>
              <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                {language === 'bn' ? 'মোট গৃহীত টাকার পরিমাণ (কথায়)' : 'Total Amount Received'}
              </div>
              <div className="text-[11px] text-neutral-700 mt-0.5 italic">
                ({numberToWords(transaction.totalPaid !== undefined ? transaction.totalPaid : transaction.amount, language)})
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-700 print:text-neutral-950">
              {formatCurrency(transaction.totalPaid !== undefined ? transaction.totalPaid : transaction.amount, language)}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 sm:pt-8 grid grid-cols-2 gap-8 text-center text-xs text-neutral-700">
            <div>
              <div className="h-4" />
              <div className="border-t border-dashed border-neutral-500 pt-1.5 font-semibold text-neutral-800">
                {language === 'bn' ? 'সদস্যের স্বাক্ষর' : "Depositor's Signature"}
              </div>
            </div>
            <div>
              <div className="font-semibold text-neutral-950 mb-0.5 text-xs">{transaction.collectedBy || 'ক্যাশিয়ার'}</div>
              <div className="border-t border-dashed border-neutral-500 pt-1.5 font-semibold text-neutral-800">
                {language === 'bn' ? 'ক্যাশিয়ার / আদায়কারীর স্বাক্ষর' : 'Authorized Cashier Signature'}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-neutral-200 text-center text-[9px] text-neutral-500">
            {language === 'bn'
              ? 'এটি একটি কম্পিউটার জেনারেটেড অফিসিয়াল মানি রসিদ · ফ্রেন্ড ইনিশিয়েটিভ অর্গানাইজেশন (FIO) · A5 Size Print'
              : 'Official System Generated Money Receipt · Friend Initiative Organization (FIO) · A5 Size Print'}
          </div>
        </div>

        {/* Accessible Sticky Action Bar (hidden in print) */}
        <div className="no-print sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-neutral-200 p-3.5 px-5 flex items-center justify-between gap-3 z-10 shadow-sm">
          <div className="text-xs text-neutral-500 hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{language === 'bn' ? 'A5 সাইজে ১ পেইজে প্রিন্ট হবে' : 'Optimized for 1-Page A5 Print'}</span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'রসিদ বন্ধ করুন' : 'Close Receipt'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'bn' ? 'প্রিন্ট করুন (A5)' : 'Print Receipt (A5)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


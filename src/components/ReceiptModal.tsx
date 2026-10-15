import React from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';
import { KistiTransaction, Member, Language } from '../types/somiti';
import { formatCurrency, formatDate, numberToWords, toBengaliNumber } from '../utils/formatters';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="printable-receipt relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900">
        {/* Header Actions (hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-blue-900/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold tracking-wide">
              {language === 'bn' ? 'টাকা জমার অফিসিয়াল রসিদ' : 'Official Money Receipt'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print Receipt'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 bg-white print:p-0">
          {/* Somiti Header */}
          <div className="text-center pb-5 border-b border-neutral-300">

            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Friend Initiative Organization
            </h2>
            <div className="text-xs font-semibold text-emerald-800">
              {language === 'bn' ? 'রেজিস্ট্রেশন নং: FIO-7412 · যেহেতু ২০২৪ (Since 2024)' : 'Reg No: FIO-7412 · Since 2024'}
            </div>
            <div className="text-xs text-neutral-600 mt-1">
              <span>{language === 'bn' ? 'সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : 'Sitaikunda, Kotalipara, Gopalgonj'}</span>
            </div>
            <div className="mt-3 inline-block px-4 py-1 text-xs font-bold uppercase tracking-wider bg-neutral-100 border border-neutral-300 rounded">
              {language === 'bn' ? 'টাকা জমার মানি রসিদ (গ্রাহক কপি)' : 'Money Receipt (Customer Copy)'}
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-neutral-200">
            <div>
              <span className="text-neutral-500">{language === 'bn' ? 'রসিদ নং:' : 'Receipt No:'}</span>{' '}
              <strong className="font-mono tabular-nums text-neutral-900">{transaction.receiptNo}</strong>
            </div>
            <div className="text-right">
              <span className="text-neutral-500">{language === 'bn' ? 'তারিখ:' : 'Date:'}</span>{' '}
              <strong className="font-mono tabular-nums text-neutral-900">{formatDate(transaction.date, language)}</strong>
            </div>
            <div>
              <span className="text-neutral-500">{language === 'bn' ? 'সদস্য আইডি:' : 'Member ID:'}</span>{' '}
              <strong className="font-mono text-neutral-900">{member?.memberNo || '-'}</strong>
            </div>
            <div className="text-right">
              <span className="text-neutral-500">{language === 'bn' ? 'পরিশোধ মাধ্যম:' : 'Payment Mode:'}</span>{' '}
              <strong className="capitalize text-neutral-900">{transaction.paymentMethod}</strong>
            </div>
          </div>

          {/* Body */}
          <div className="py-4 space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-600">{language === 'bn' ? 'সদস্যের পূর্ণ নাম:' : "Member's Full Name:"}</span>
              <span className="font-semibold text-neutral-900">
                {language === 'bn' ? member?.nameBn || member?.nameEn : member?.nameEn}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-600">{language === 'bn' ? 'মোবাইল নম্বর:' : 'Mobile Phone:'}</span>
              <span className="font-mono text-neutral-900">{member?.phone || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-600">{language === 'bn' ? 'জমার বিবরণ / খাত:' : 'Payment Purpose:'}</span>
              <span className="font-medium text-neutral-900">{getTypeName(transaction.type)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-600">{language === 'bn' ? 'চলতি মাস / কিস্তির মেয়াদ:' : 'Period / Month:'}</span>
              <span className="font-mono tabular-nums text-neutral-900 font-semibold">{transaction.targetMonth || transaction.periodMonth}</span>
            </div>
            {transaction.fineAmount !== undefined && transaction.fineAmount > 0 && (
              <>
                <div className="flex justify-between items-center py-1 text-emerald-800 bg-emerald-50/50 px-2 rounded">
                  <span className="font-medium">{language === 'bn' ? 'মূল কিস্তি / সঞ্চয় জমা:' : 'Principal Savings Deposit:'}</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(transaction.principalAmount !== undefined ? transaction.principalAmount : Math.max(0, transaction.amount - transaction.fineAmount), language)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 text-amber-900 bg-amber-50/50 px-2 rounded">
                  <span className="font-medium">{language === 'bn' ? 'বিলম্ব ফি / জরিমানা:' : 'Late Fee / Fine:'}</span>
                  <span className="font-mono font-bold">
                    +{formatCurrency(transaction.fineAmount, language)}
                  </span>
                </div>
              </>
            )}
            {transaction.remarks && (
              <div className="flex justify-between items-start py-1">
                <span className="text-neutral-600">{language === 'bn' ? 'বিশেষ দ্রষ্টব্য:' : 'Remarks:'}</span>
                <span className="text-neutral-800 text-xs italic max-w-xs text-right">{transaction.remarks}</span>
              </div>
            )}
          </div>

          {/* Amount Box */}
          <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-lg flex items-center justify-between my-3">
            <div>
              <div className="text-xs text-neutral-500 uppercase font-semibold">
                {language === 'bn' ? 'মোট গৃহীত টাকার পরিমাণ' : 'Total Amount Received'}
              </div>
              <div className="text-xs text-neutral-600 mt-1 italic">
                ({numberToWords(transaction.totalPaid !== undefined ? transaction.totalPaid : transaction.amount, language)})
              </div>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {formatCurrency(transaction.totalPaid !== undefined ? transaction.totalPaid : transaction.amount, language)}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs text-neutral-600">
            <div>
              <div className="border-t border-dashed border-neutral-400 pt-2 font-medium">
                {language === 'bn' ? 'সদস্যের স্বাক্ষর' : "Depositor's Signature"}
              </div>
            </div>
            <div>
              <div className="font-medium text-neutral-900 mb-1">{transaction.collectedBy}</div>
              <div className="border-t border-dashed border-neutral-400 pt-2 font-medium">
                {language === 'bn' ? 'ক্যাশিয়ার / আদায়কারীর স্বাক্ষর' : 'Authorized Cashier Signature'}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-neutral-200 text-center text-[10px] text-neutral-400">
            {language === 'bn'
              ? 'এটি একটি কম্পিউটার জেনারেটেড মানি রসিদ। কোনো গরমিল থাকলে ৭ কার্যদিবসের মধ্যে ক্যাশিয়ারের সাথে যোগাযোগ করুন।'
              : 'This is a system generated receipt. For any discrepancy, contact the Cashier within 7 working days.'}
          </div>
        </div>
      </div>
    </div>
  );
};

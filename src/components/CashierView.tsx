import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Printer,
  Calendar,
  Building2,
  FileSpreadsheet,
  CheckCircle,
  Receipt,
  User,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { PaymentMethod, CashbookEntry } from '../types/somiti';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';
import { DateInput } from './DateInput';

export const CashierView: React.FC = () => {
  const { cashbook, members, addCashbookEntry, language } = useSomiti();

  const [filterType, setFilterType] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

  // New Voucher State
  const [vDate, setVDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [vType, setVType] = useState<'inflow' | 'outflow'>('outflow');
  const [vCategory, setVCategory] = useState<any>('office_expense');
  const [vTitle, setVTitle] = useState('');
  const [vAmount, setVAmount] = useState<number>(500);
  const [vMethod, setVMethod] = useState<PaymentMethod>('cash');
  const [vNotes, setVNotes] = useState('');

  // Calculate Balances
  const totalInflow = cashbook
    .filter((e) => e.type === 'inflow')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOutflow = cashbook
    .filter((e) => e.type === 'outflow')
    .reduce((sum, e) => sum + e.amount, 0);

  const cashInHand = Math.max(0, totalInflow - totalOutflow);

  // Today's Date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = cashbook.filter((e) => e.date === todayStr);
  const todayInflow = todayEntries
    .filter((e) => e.type === 'inflow')
    .reduce((sum, e) => sum + e.amount, 0);
  const todayOutflow = todayEntries
    .filter((e) => e.type === 'outflow')
    .reduce((sum, e) => sum + e.amount, 0);

  // Bank vs Cash Breakdown
  const cashOnlyInflow = cashbook
    .filter((e) => e.type === 'inflow' && e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);
  const cashOnlyOutflow = cashbook
    .filter((e) => e.type === 'outflow' && e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);
  const physicalCashInDrawer = Math.max(0, cashOnlyInflow - cashOnlyOutflow);

  // Filtered Cashbook list
  const filteredEntries = cashbook
    .filter((entry) => {
      if (filterType !== 'all' && entry.type !== filterType) return false;
      if (filterDate && entry.date !== filterDate) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vTitle.trim() || vAmount <= 0) return;

    addCashbookEntry({
      date: vDate || new Date().toISOString().split('T')[0],
      type: vType,
      category: vCategory,
      title: vTitle.trim(),
      amount: Number(vAmount),
      paymentMethod: vMethod,
      recordedByCashier: 'Milon Talukder (Cashier)',
      notes: vNotes.trim(),
    });

    setVTitle('');
    setVAmount(500);
    setVNotes('');
    setIsVoucherModalOpen(false);
  };

  const cashierMember = members.find((m) => m.role === 'cashier' || m.role === 'lead_executive') || members[0];
  const presidentMember = members.find((m) => m.role === 'lead_executive' || m.role === 'president') || members[0];

  return (
    <div className="space-y-6">
      {/* Cashier Desk Hero Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                  {language === 'bn' ? 'ক্যাশিয়ার ব্যবস্থাপনা ও ক্যাশবুক' : 'Cashier Management & Cashbook'}
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  {language === 'bn' ? 'দৈনিক হিসাব ও ক্লোজিং' : 'Daily Vault & Closing'}
                </span>
              </div>
              <div className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  {language === 'bn' ? 'দায়িত্বপ্রাপ্ত প্রধান ক্যাশিয়ার:' : 'Designated Cashier:'}{' '}
                  <strong className="text-neutral-800 font-semibold">
                    {language === 'bn' ? cashierMember?.nameBn : cashierMember?.nameEn}
                  </strong>
                </span>
                <span>·</span>
                <span className="font-mono">মোবাইল: {cashierMember?.phone}</span>
                <span>·</span>
                <span>{language === 'bn' ? 'ব্যাংক হিসাব: সোনালী ব্যাংক, শাখা: কোটালীপাড়া' : 'Bank A/C: Sonali Bank, Kotalipara Branch'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoucherModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? '+ নতুন ক্যাশ ভাউচার' : '+ New Cash Voucher'}</span>
            </button>
            <button
              onClick={() => setIsClosingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-300" />
              <span>{language === 'bn' ? 'দৈনিক ক্লোজিং শিট' : 'Daily Closing Sheet'}</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Vault KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100">
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-xl">
            <div className="text-xs font-medium text-emerald-800 uppercase tracking-wider">
              {language === 'bn' ? 'ড্রয়ারে নগদ ক্যাশ (Cash-in-Drawer)' : 'Physical Cash in Hand'}
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1">
              {formatCurrency(physicalCashInDrawer, language)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">
              {language === 'bn' ? 'ক্যাশিয়ারের কাছে রক্ষিত তরল অর্থ' : 'Liquid cash available for payments'}
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {language === 'bn' ? 'সমিতির সর্বমোট ব্যালেন্স' : 'Net Somiti Cash Balance'}
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
              {formatCurrency(cashInHand, language)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {language === 'bn' ? 'নগদ + ব্যাংক + মোবাইল ব্যাংকিং' : 'Cash + Bank + MFS balances'}
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>{language === 'bn' ? 'আজকের মোট জমা (Today Inflow)' : "Today's Inflow"}</span>
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              {formatCurrency(todayInflow, language)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {language === 'bn'
                ? `আজকের এন্ট্রি: ${toBengaliNumber(todayEntries.filter((e) => e.type === 'inflow').length)} টি`
                : `${todayEntries.filter((e) => e.type === 'inflow').length} collections today`}
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>{language === 'bn' ? 'আজকের মোট খরচ (Today Outflow)' : "Today's Outflow"}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-red-600 mt-1">
              {formatCurrency(todayOutflow, language)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {language === 'bn'
                ? `আজকের খরচ ভাউচার: ${toBengaliNumber(todayEntries.filter((e) => e.type === 'outflow').length)} টি`
                : `${todayEntries.filter((e) => e.type === 'outflow').length} expense vouchers today`}
            </div>
          </div>
        </div>
      </div>

      {/* Cashbook Ledger Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {language === 'bn' ? 'ক্যাশিয়ারের দৈনিক ক্যাশবুক খতিয়ান' : 'Cashier Daily Cashbook Register'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {language === 'bn'
                ? 'কিস্তি আদায়, ঋণ বিতরণ ও প্রকল্প খরচের স্বয়ংক্রিয় ক্যাশ এন্ট্রি'
                : 'Automated cash register of all inflows, disbursements & operational vouchers'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  filterType === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {language === 'bn' ? 'সকল' : 'All'}
              </button>
              <button
                onClick={() => setFilterType('inflow')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  filterType === 'inflow' ? 'bg-white text-emerald-800 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {language === 'bn' ? 'জমা (In)' : 'Inflow'}
              </button>
              <button
                onClick={() => setFilterType('outflow')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  filterType === 'outflow' ? 'bg-white text-red-800 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {language === 'bn' ? 'খরচ (Out)' : 'Outflow'}
              </button>
            </div>

            {/* Date filter (DD/MM/YYYY) */}
            <div className="w-56">
              <DateInput
                value={filterDate}
                onChange={(val) => setFilterDate(val)}
              />
            </div>
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className="text-xs text-neutral-500 hover:text-neutral-900 underline whitespace-nowrap cursor-pointer"
              >
                {language === 'bn' ? 'রিসেট' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-sm">
            {language === 'bn' ? 'কোনো ক্যাশ ভাউচার পাওয়া যায়নি।' : 'No cashbook entries found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4"># {language === 'bn' ? 'ভাউচার' : 'Voucher'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'বিবরণ ও খাত' : 'Description & Category'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'মাধ্যম' : 'Method'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'রেকর্ডকারী ক্যাশিয়ার' : 'Recorded By'}</th>
                  <th className="py-3 px-4 text-right">{language === 'bn' ? 'পরিমাণ (৳)' : 'Amount (BDT)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredEntries.map((entry) => {
                  const isInflow = entry.type === 'inflow';
                  return (
                    <tr key={entry.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-800">{entry.voucherNo}</td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{formatDate(entry.date, language)}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          {isInflow ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          )}
                          <span>{entry.title}</span>
                        </div>
                        {entry.notes && (
                          <div className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-sm">{entry.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          {entry.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{entry.recordedByCashier}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-sm">
                        <span className={isInflow ? 'text-emerald-700' : 'text-red-600'}>
                          {isInflow ? '+' : '-'} {formatCurrency(entry.amount, language)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Record New Cash Voucher */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden text-neutral-900">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold">
                  {language === 'bn' ? 'ক্যাশ ভাউচার এন্ট্রি (ক্যাশিয়ার)' : 'Record Cash Voucher'}
                </h3>
              </div>
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVoucher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVType('inflow')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      vType === 'inflow'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    + {language === 'bn' ? 'ক্যাশ জমা (Inflow)' : 'Cash Inflow'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVType('outflow')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      vType === 'outflow'
                        ? 'bg-red-50 border-red-600 text-red-800'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    - {language === 'bn' ? 'ক্যাশ খরচ (Outflow)' : 'Cash Outflow'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <DateInput
                    label={language === 'bn' ? 'ভাউচারের তারিখ' : 'Voucher Date'}
                    value={vDate}
                    onChange={(val) => setVDate(val)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    {language === 'bn' ? 'খরচ / জমার খাত (Category)' : 'Category'}
                  </label>
                  <select
                    value={vCategory}
                    onChange={(e) => setVCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="office_expense">{language === 'bn' ? 'অফিস খরচ ও স্টেশনারি' : 'Office Expense & Stationery'}</option>
                    <option value="bank_deposit">{language === 'bn' ? 'ব্যাংকে জমা প্রদান' : 'Bank Deposit'}</option>
                    <option value="bank_withdrawal">{language === 'bn' ? 'ব্যাংক থেকে উত্তোলন' : 'Bank Withdrawal'}</option>
                    <option value="project_expense">{language === 'bn' ? 'প্রকল্পের খরচ' : 'Project Expense'}</option>
                    <option value="kisti_collection">{language === 'bn' ? 'কিস্তি সংগ্রহ' : 'Kisti Collection'}</option>
                    <option value="loan_disbursement">{language === 'bn' ? 'ঋণ বিতরণ' : 'Loan Disbursement'}</option>
                    <option value="other">{language === 'bn' ? 'অন্যান্য বিবিধ খরচ' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'ভাউচারের শিরোনাম / বিবরণ *' : 'Voucher Title / Description *'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: মাসিক অডিট ফি বা অফিস নাস্তা খরচ' : 'e.g. Audit fee or Office supplies'}
                  value={vTitle}
                  onChange={(e) => setVTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    {language === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (BDT) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={vAmount}
                    onChange={(e) => setVAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    {language === 'bn' ? 'পরিশোধের মাধ্যম' : 'Method'}
                  </label>
                  <select
                    value={vMethod}
                    onChange={(e) => setVMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cash">{language === 'bn' ? 'নগদ ক্যাশ' : 'Cash'}</option>
                    <option value="bkash">{language === 'bn' ? 'বিকাশ' : 'bKash'}</option>
                    <option value="nagad">{language === 'bn' ? 'নগদ' : 'Nagad'}</option>
                    <option value="bank">{language === 'bn' ? 'ব্যাংক' : 'Bank'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'মন্তব্য বা মানি রিসিট নম্বর' : 'Remarks / Receipt Reference'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বিল নং #৪২৯"
                  value={vNotes}
                  onChange={(e) => setVNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-xs"
                >
                  {language === 'bn' ? 'ভাউচার সংরক্ষণ' : 'Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Daily Cashier Closing Sheet (Printable) */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden text-neutral-900 my-8">
            <div className="no-print flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-blue-900/50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-semibold">
                  {language === 'bn' ? 'ক্যাশিয়ারের দৈনিক হিসাব ক্লোজিং রিপোর্ট' : 'Daily Cashier Closing Report'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'bn' ? 'রিপোর্ট প্রিন্ট করুন' : 'Print Sheet'}</span>
                </button>
                <button
                  onClick={() => setIsClosingModalOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 bg-white print:p-0">
              {/* Header */}
              <div className="text-center pb-4 border-b border-neutral-300">
                <div className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-1">
                  {language === 'bn' ? 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার নিবন্ধিত' : 'Govt. Approved Cooperative Society'}
                </div>
                <h2 className="text-xl font-bold text-neutral-900">
                  Friend Initiative Organization
                </h2>
                <div className="text-xs font-semibold text-emerald-800">
                  {language === 'bn' ? 'রেজিস্ট্রেশন নং: FIO-7412 · যেহেতু ২০২৪ (Since 2024)' : 'Reg No: FIO-7412 · Since 2024'}
                </div>
                <div className="text-xs text-neutral-600 mt-1">
                  <span>{language === 'bn' ? 'সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : 'Sitaikunda, Kotalipara, Gopalgonj'}</span>
                  <span className="mx-2">·</span>
                  <span>{language === 'bn' ? 'ক্যাশিয়ার দৈনিক ক্যাশ রেজিস্টার ও ক্লোজিং স্টেটমেন্ট' : 'Daily Cashier Vault Closing Statement'}</span>
                </div>
                <div className="mt-2 text-xs font-mono font-medium text-neutral-700">
                  {language === 'bn' ? 'তারিখ:' : 'Date:'} {formatDate(todayStr, language)}
                </div>
              </div>

              {/* Summary table */}
              <div className="my-6 border border-neutral-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-neutral-200">
                    <tr className="bg-neutral-50">
                      <td className="py-2.5 px-4 font-semibold text-neutral-700">
                        {language === 'bn' ? '১. ড্রয়ারে প্রাথমিক নগদ স্থিতি (Opening Cash Balance)' : '1. Opening Cash Balance'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums text-neutral-900">
                        {formatCurrency(50000, language)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-emerald-800">
                        {language === 'bn' ? '২. আজকের মোট কিস্তি ও সঞ্চয় জমা (+ Inflow)' : "2. Today's Total Collections (+)"}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums text-emerald-700">
                        + {formatCurrency(todayInflow, language)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-red-800">
                        {language === 'bn' ? '৩. আজকের ঋণ বিতরণ ও খরচ ভাউচার (- Outflow)' : "3. Today's Total Disbursements (-)"}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums text-red-700">
                        - {formatCurrency(todayOutflow, language)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50 text-sm">
                      <td className="py-3 px-4 font-bold text-emerald-950">
                        {language === 'bn' ? '৪. দিন শেষে ড্রয়ারে নগদ ক্যাশ (Closing Cash-in-Drawer)' : '4. Closing Cash in Drawer'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-950">
                        {formatCurrency(physicalCashInDrawer, language)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Today entries list */}
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase text-neutral-600 mb-2">
                  {language === 'bn' ? 'আজকের লেনদেনসমূহ:' : "Today's Individual Vouchers:"}
                </h4>
                <div className="border border-neutral-200 rounded text-xs divide-y divide-neutral-200">
                  {todayEntries.map((e) => (
                    <div key={e.id} className="py-2 px-3 flex justify-between items-center">
                      <div>
                        <span className="font-mono font-medium text-neutral-700">{e.voucherNo}</span>
                        <span className="mx-2 text-neutral-300">·</span>
                        <span className="text-neutral-900 font-medium">{e.title}</span>
                      </div>
                      <span className={`font-mono font-bold tabular-nums ${e.type === 'inflow' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {e.type === 'inflow' ? '+' : '-'} {formatCurrency(e.amount, language)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-center text-xs text-neutral-600">
                <div>
                  <div className="font-semibold text-neutral-900 mb-1">
                    {language === 'bn' ? cashierMember?.nameBn : cashierMember?.nameEn}
                  </div>
                  <div className="border-t border-dashed border-neutral-400 pt-1 font-medium">
                    {language === 'bn' ? 'প্রধান ক্যাশিয়ার / কোষাধ্যক্ষের স্বাক্ষর' : 'Chief Cashier Signature'}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 mb-1">
                    {language === 'bn' ? presidentMember?.nameBn : presidentMember?.nameEn}
                  </div>
                  <div className="border-t border-dashed border-neutral-400 pt-1 font-medium">
                    {language === 'bn' ? 'সভাপতির প্রতিস্বাক্ষর' : 'President Counter-Signature'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

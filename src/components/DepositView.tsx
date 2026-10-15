import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  PlusCircle,
  Search,
  ExternalLink,
  CreditCard,
  Check,
  Layers,
  X,
  Users,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { KistiTransaction } from '../types/somiti';
import { formatCurrency, toBengaliNumber, formatDate } from '../utils/formatters';
import { DateInput } from './DateInput';

interface DepositViewProps {
  onOpenCollectModal: (
    memberId?: string,
    type?: any,
    periodMonth?: string,
    defaultAmount?: number
  ) => void;
  onOpenReceipt: (tx: KistiTransaction) => void;
}

export const DepositView: React.FC<DepositViewProps> = ({
  onOpenCollectModal,
  onOpenReceipt,
}) => {
  const { members, transactions, language, collectKisti, currentMember } = useSomiti();
  const isCashier = currentMember?.role === 'lead_executive' || currentMember?.role === 'cashier';

  const [activeSubTab, setActiveSubTab] = useState<'sheet' | 'transactions'>('sheet');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => transactions[0]?.periodMonth || '2024-09');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [swipedMemberId, setSwipedMemberId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number>(0);

  // Bulk Deposit Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAmount, setBulkAmount] = useState<number>(1000);
  const [bulkPeriodMonth, setBulkPeriodMonth] = useState<string>(selectedMonth);
  const [bulkDate, setBulkDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Month-wise savings/deposit transactions
  const monthTransactions = transactions.filter((tx) => tx.periodMonth === selectedMonth);

  const memberCollectionRows = members.map((member) => {
    const memberMonthTxs = monthTransactions.filter((tx) => tx.memberId === member.id);
    const savingsPaid = memberMonthTxs
      .filter((tx) => tx.type === 'savings' || tx.type === 'project_share')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const targetSavings = member.monthlySavingsCommitment;
    const isSavingsPaid = savingsPaid >= targetSavings;
    const isPartial = savingsPaid > 0 && savingsPaid < targetSavings;

    return {
      member,
      targetSavings,
      savingsPaid,
      isSavingsPaid,
      isPartial,
      dueSavings: Math.max(0, targetSavings - savingsPaid),
      recentTx: memberMonthTxs[0] || null,
    };
  });

  const totalTargetMonth = members.reduce((sum, m) => sum + m.monthlySavingsCommitment, 0);
  const totalCollectedMonth = memberCollectionRows.reduce((sum, r) => sum + r.savingsPaid, 0);
  const monthCollectionRate = totalTargetMonth > 0 ? Math.round((totalCollectedMonth / totalTargetMonth) * 100) : 0;
  const paidCount = memberCollectionRows.filter((r) => r.isSavingsPaid).length;

  const filteredTxs = transactions
    .filter((tx) => {
      const mem = members.find((m) => m.id === tx.memberId);
      const matchesSearch =
        tx.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mem && (mem.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || mem.nameBn.includes(searchTerm)));

      const matchesType = filterType === 'all' || tx.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenBulkModal = () => {
    setBulkPeriodMonth(selectedMonth);
    setBulkAmount(1000);
    // Select members who haven't fully paid yet by default
    const unpaidIds = memberCollectionRows
      .filter((r) => !r.isSavingsPaid)
      .map((r) => r.member.id);
    setSelectedMemberIds(unpaidIds.length > 0 ? unpaidIds : members.map((m) => m.id));
    setBulkSuccessMsg(null);
    setIsBulkModalOpen(true);
  };

  const handleToggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllMembers = () => {
    setSelectedMemberIds(members.map((m) => m.id));
  };

  const handleDeselectAllMembers = () => {
    setSelectedMemberIds([]);
  };

  const handleProcessBulkDeposit = () => {
    if (selectedMemberIds.length === 0) return;
    const depositDate = bulkDate || new Date().toISOString().split('T')[0];

    selectedMemberIds.forEach((memberId) => {
      collectKisti({
        memberId,
        type: 'savings',
        amount: Number(bulkAmount) || 1000,
        periodMonth: bulkPeriodMonth,
        date: depositDate,
        paymentMethod: 'cash',
        collectedBy: currentMember?.nameEn || 'Cashier / Admin',
        remarks: language === 'bn' ? `বাল্ক ডিপোজিট (${bulkAmount}৳)` : `Bulk Deposit (${bulkAmount}৳)`,
      });
    });

    const msg =
      language === 'bn'
        ? `সফলভাবে ${selectedMemberIds.length} জন সদস্যের জন্য প্রতিজন ${formatCurrency(bulkAmount, language)} করে ডিপোজিট গ্রহণ করা হয়েছে!`
        : `Successfully recorded ${formatCurrency(bulkAmount, language)} deposit for ${selectedMemberIds.length} members!`;

    setBulkSuccessMsg(msg);
    setTimeout(() => {
      setIsBulkModalOpen(false);
      setBulkSuccessMsg(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header and Sub-tabs */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              {language === 'bn' ? 'ডিপোজিট ও সঞ্চয় হিসাব (Deposit)' : 'Deposit & Savings Ledger'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {language === 'bn'
                ? 'সদস্যদের মাসিক সঞ্চয় ডিপোজিট, কালেকশন শিট ও বাল্ক এন্ট্রি'
                : 'Member monthly savings deposits, collection matrix & bulk entry'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isCashier && (
              <>
                <button
                  onClick={handleOpenBulkModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-xs"
                >
                  <Layers className="w-4 h-4" />
                  <span>{language === 'bn' ? 'বাল্ক ডিপোজিট (১০০০৳)' : 'Bulk Deposit (1000৳)'}</span>
                </button>
                <button
                  onClick={() => onOpenCollectModal(undefined, 'savings', selectedMonth, 1000)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{language === 'bn' ? '+ ডিপোজিট গ্রহণ' : '+ Collect Deposit'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub-nav tabs */}
        <div className="flex border-b border-neutral-200 mt-5 -mb-5 pt-2">
          <button
            onClick={() => setActiveSubTab('sheet')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeSubTab === 'sheet'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {language === 'bn' ? 'মাসের কালেকশন শিট (Sheet)' : 'Monthly Deposit Sheet'}
          </button>
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeSubTab === 'transactions'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {language === 'bn' ? `সকল ডিপোজিট রসিদ (${toBengaliNumber(transactions.length)})` : `All Deposit Receipts (${transactions.length})`}
          </button>
        </div>
      </div>

      {activeSubTab === 'sheet' && (
        <div className="space-y-4">
          {/* Bylaws Notice Banner */}
          <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3.5 sm:p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <div className="font-bold text-emerald-950 flex items-center gap-2">
                  <span>{language === 'bn' ? 'নিয়মাবলী (Rules 2 & 3):' : 'Rules 2 & 3 Notice:'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                    {language === 'bn' ? 'সময়সীমা: ৫-১০ তারিখ' : 'Window: 5th-10th'}
                  </span>
                </div>
                <div className="text-emerald-900 mt-0.5 text-[11px] sm:text-xs">
                  {language === 'bn'
                    ? 'প্রতি মাসের ৫-১০ তারিখের মধ্যে সঞ্চয় ডিপোজিট পরিশোধ বাধ্যতামূলক। বর্তমানে কোনো বিলম্ব জরিমানা প্রযোজ্য নয় (বিলম্ব ফি সম্পূর্ণ বন্ধ)।'
                    : 'Savings deposits due between 5th-10th. Late fees are completely disabled (৳0).'}
                </div>
              </div>
            </div>
          </div>

          {/* Controls & Monthly Snapshot */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-neutral-700 uppercase">
                {language === 'bn' ? 'হিসাবের মাস:' : 'Billing Month:'}
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono font-semibold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <span className="text-neutral-500">{language === 'bn' ? 'লক্ষ্যমাত্রা:' : 'Target:'}</span>{' '}
                <strong className="font-mono text-neutral-900">{formatCurrency(totalTargetMonth, language)}</strong>
              </div>
              <div>
                <span className="text-neutral-500">{language === 'bn' ? 'সংগৃহীত:' : 'Collected:'}</span>{' '}
                <strong className="font-mono text-emerald-700">{formatCurrency(totalCollectedMonth, language)}</strong>
              </div>
              <div>
                <span className="text-neutral-500">{language === 'bn' ? 'পরিশোধ হার:' : 'Rate:'}</span>{' '}
                <strong className="font-mono text-emerald-800">{toBengaliNumber(monthCollectionRate)}%</strong>
              </div>
              <div>
                <span className="text-neutral-500">{language === 'bn' ? 'পরিশোধকারী:' : 'Paid Members:'}</span>{' '}
                <strong className="font-mono text-neutral-900">
                  {toBengaliNumber(paidCount)} / {toBengaliNumber(members.length)}
                </strong>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4"># {language === 'bn' ? 'আইডি' : 'ID'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'সদস্যের নাম' : 'Member Name'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'ধার্য সঞ্চয়' : 'Monthly Savings'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'জমা হয়েছে' : 'Deposited'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'বকেয়া' : 'Due'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'অবস্থা' : 'Status'}</th>
                    <th className="py-3 px-4 text-center">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {memberCollectionRows.map((row) => (
                    <tr key={row.member.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-800">{row.member.memberNo}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">
                          {language === 'bn' ? row.member.nameBn : row.member.nameEn}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono">{row.member.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium tabular-nums text-neutral-800">
                        {formatCurrency(row.targetSavings, language)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold tabular-nums text-emerald-700">
                        {formatCurrency(row.savingsPaid, language)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-neutral-600">
                        {row.dueSavings > 0 ? (
                          <span className="text-amber-700 font-bold">{formatCurrency(row.dueSavings, language)}</span>
                        ) : (
                          <span className="text-neutral-400">০</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.isSavingsPaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</span>
                          </span>
                        ) : row.isPartial ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'আংশিক জমা' : 'Partial'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'বকেয়া' : 'Unpaid'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isCashier ? (
                            <button
                              onClick={() =>
                                onOpenCollectModal(
                                  row.member.id,
                                  'savings',
                                  selectedMonth,
                                  row.dueSavings > 0 ? row.dueSavings : (row.targetSavings || 1000)
                                )
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded transition-colors"
                            >
                              {row.isSavingsPaid
                                ? language === 'bn' ? '+ অতিরিক্ত' : '+ Extra'
                                : language === 'bn' ? 'জমা নিন' : 'Deposit'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-400">
                              {language === 'bn' ? 'ক্যাশিয়ার অনলি' : 'Cashier Only'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'রসিদ নম্বর বা সদস্যের নাম দিয়ে খুঁজুন...' : 'Search receipt or member name...'}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
              >
                <option value="all">{language === 'bn' ? 'সকল লেনদেন' : 'All Types'}</option>
                <option value="savings">{language === 'bn' ? 'সঞ্চয় কিস্তি' : 'Savings Deposit'}</option>
                <option value="project_share">{language === 'bn' ? 'প্রকল্প শেয়ার' : 'Project Share'}</option>
                <option value="fine_fee">{language === 'bn' ? 'জরিমানা ও ফি' : 'Fine / Fee'}</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-3"># {language === 'bn' ? 'রসিদ নং' : 'Receipt #'}</th>
                    <th className="py-3 px-3">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                    <th className="py-3 px-3">{language === 'bn' ? 'সদস্য' : 'Member'}</th>
                    <th className="py-3 px-3">{language === 'bn' ? 'কিস্তির মাস' : 'Target Month'}</th>
                    <th className="py-3 px-3 text-right">{language === 'bn' ? 'মূল জমা (৳)' : 'Principal (৳)'}</th>
                    <th className="py-3 px-3 text-right">{language === 'bn' ? 'জরিমানা (৳)' : 'Fine (৳)'}</th>
                    <th className="py-3 px-3 text-right">{language === 'bn' ? 'মোট আদায় (৳)' : 'Total Collected (৳)'}</th>
                    <th className="py-3 px-3 text-center">{language === 'bn' ? 'রসিদ' : 'Receipt'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredTxs.map((tx) => {
                    const mem = members.find((m) => m.id === tx.memberId);
                    const principal = tx.principalAmount !== undefined ? tx.principalAmount : (tx.type === 'savings' ? Math.max(0, tx.amount - (tx.fineAmount || 0)) : tx.amount);
                    const fine = tx.fineAmount || 0;
                    const total = tx.totalPaid !== undefined ? tx.totalPaid : tx.amount;

                    return (
                      <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-emerald-800">{tx.receiptNo}</td>
                        <td className="py-3 px-3 font-mono text-neutral-700">{formatDate(tx.date, language)}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-neutral-900">
                            {mem ? (language === 'bn' ? mem.nameBn : mem.nameEn) : tx.memberId}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">{mem?.memberNo}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-neutral-700">
                          {tx.targetMonth || tx.periodMonth}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatCurrency(principal, language)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {fine > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              +{formatCurrency(fine, language)}
                            </span>
                          ) : (
                            <span className="text-neutral-400">০ ৳</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black tabular-nums text-neutral-900 text-sm">
                          {formatCurrency(total, language)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onOpenReceipt(tx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition-colors cursor-pointer"
                          >
                            <span>{language === 'bn' ? 'রসিদ' : 'Receipt'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Deposit Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-semibold">
                  {language === 'bn' ? 'বাল্ক ডিপোজিট এন্ট্রি (স্ট্যান্ডার্ড ১০০০৳)' : 'Bulk Deposit Entry (Standard 1000৳)'}
                </span>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {bulkSuccessMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-emerald-800 font-bold text-sm">
                  {bulkSuccessMsg}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        {language === 'bn' ? 'ডিপোজিটের পরিমাণ (টাকা):' : 'Deposit Amount (TK):'}
                      </label>
                      <input
                        type="number"
                        value={bulkAmount}
                        onChange={(e) => setBulkAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        {language === 'bn' ? 'হিসাবের মাস (Period Month):' : 'Period Month:'}
                      </label>
                      <input
                        type="month"
                        value={bulkPeriodMonth}
                        onChange={(e) => setBulkPeriodMonth(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono font-semibold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <DateInput
                        label={language === 'bn' ? 'জমার তারিখ (Date)' : 'Deposit Date'}
                        value={bulkDate}
                        onChange={(val) => setBulkDate(val)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-neutral-600 font-medium">
                      {language === 'bn' ? 'সদস্য নির্বাচন করুন:' : 'Select Members:'}{' '}
                      <strong className="text-indigo-700">
                        {toBengaliNumber(selectedMemberIds.length)} / {toBengaliNumber(members.length)}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAllMembers}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                      >
                        {language === 'bn' ? 'সকলকে সিলেক্ট করুন' : 'Select All'}
                      </button>
                      <button
                        onClick={handleDeselectAllMembers}
                        className="px-2.5 py-1 text-[11px] font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded border border-neutral-300 transition-colors"
                      >
                        {language === 'bn' ? 'সব বাদ দিন' : 'Deselect All'}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-100 bg-neutral-50/50">
                    {members.map((member) => {
                      const isSelected = selectedMemberIds.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => handleToggleSelectMember(member.id)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50/80' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500"
                            />
                            <div>
                              <div className="text-xs font-bold text-neutral-900">
                                {language === 'bn' ? member.nameBn : member.nameEn}
                              </div>
                              <div className="text-[10px] font-mono text-neutral-500">
                                ID: {member.memberNo} · {member.phone}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-medium text-neutral-700">
                            {formatCurrency(member.monthlySavingsCommitment, language)} /mo
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                    <button
                      onClick={() => setIsBulkModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleProcessBulkDeposit}
                      disabled={selectedMemberIds.length === 0}
                      className="px-5 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
                    >
                      {language === 'bn'
                        ? `নির্বাচিত ${toBengaliNumber(selectedMemberIds.length)} জনের জন্য ${formatCurrency(bulkAmount * selectedMemberIds.length, language)} জমা করুন`
                        : `Process Bulk Deposit (${selectedMemberIds.length} members)`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

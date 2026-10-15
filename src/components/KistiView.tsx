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
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { KistiTransaction, Loan, Member } from '../types/somiti';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';
import { DateInput } from './DateInput';

interface KistiViewProps {
  onOpenCollectModal: (
    memberId?: string,
    type?: any,
    periodMonth?: string,
    defaultAmount?: number
  ) => void;
  onOpenReceipt: (tx: KistiTransaction) => void;
}

export const KistiView: React.FC<KistiViewProps> = ({
  onOpenCollectModal,
  onOpenReceipt,
}) => {
  const { members, transactions, loans, disburseLoan, language } = useSomiti();

  const [activeSubTab, setActiveSubTab] = useState<'sheet' | 'transactions' | 'loans'>('sheet');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => transactions[0]?.periodMonth || '2024-09');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);

  // New Loan Form State
  const [loanMemberId, setLoanMemberId] = useState(members[0]?.id || '');
  const [loanPrincipal, setLoanPrincipal] = useState<number>(25000);
  const [loanRate, setLoanRate] = useState<number>(8);
  const [loanInstallments, setLoanInstallments] = useState<number>(10);
  const [loanPurpose, setLoanPurpose] = useState<string>('');
  const [loanDueDate, setLoanDueDate] = useState<string>('2026-12-31');

  // Month-wise transactions
  const monthTransactions = transactions.filter((tx) => tx.periodMonth === selectedMonth);

  // Compute collection status per member for the selected month
  const memberCollectionRows = members.map((member) => {
    const memberMonthTxs = monthTransactions.filter((tx) => tx.memberId === member.id);
    const savingsPaid = memberMonthTxs
      .filter((tx) => tx.type === 'savings')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const activeLoan = loans.find((l) => l.memberId === member.id && l.status === 'active');
    const loanPaid = memberMonthTxs
      .filter((tx) => tx.type === 'loan_repayment')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const targetSavings = member.monthlySavingsCommitment;
    const isSavingsPaid = savingsPaid >= targetSavings;
    const isPartial = savingsPaid > 0 && savingsPaid < targetSavings;

    return {
      member,
      targetSavings,
      savingsPaid,
      activeLoan,
      loanPaid,
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

  // Filtered transactions for Tab 2
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

  // Handle Disburse Loan
  const handleDisburseLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanMemberId || loanPrincipal <= 0) return;

    const totalPayable = Math.round(loanPrincipal * (1 + loanRate / 100));
    const installmentAmount = Math.round(totalPayable / loanInstallments);

    disburseLoan({
      memberId: loanMemberId,
      principalAmount: Number(loanPrincipal),
      profitServiceRatePercent: Number(loanRate),
      totalPayable,
      totalInstallments: Number(loanInstallments),
      installmentAmount,
      disbursedDate: new Date().toISOString().split('T')[0],
      dueDate: loanDueDate,
      purpose: loanPurpose.trim() || 'Small Business Expansion',
    });

    setIsDisburseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Sub-tabs */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              {language === 'bn' ? 'কিস্তি সংগ্রহ ও ঋণ খতিয়ান' : 'Kisti Collection & Loans Ledger'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {language === 'bn'
                ? 'মাসিক কিস্তি কালেকশন শিট, মানি রসিদ ও ঋণ হিসাব'
                : 'Monthly collection matrix, receipt history & member loan installments'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCollectModal(undefined, 'savings', selectedMonth, 1000)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? '+ কিস্তি গ্রহণ' : '+ Collect Kisti'}</span>
            </button>
            <button
              onClick={() => setIsDisburseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
            >
              <CreditCard className="w-4 h-4 text-blue-300" />
              <span>{language === 'bn' ? 'নতুন ঋণ বিতরণ' : 'Disburse Loan'}</span>
            </button>
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
            {language === 'bn' ? 'মাসের কালেকশন শিট (Sheet)' : 'Monthly Collection Sheet'}
          </button>
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeSubTab === 'transactions'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {language === 'bn' ? `সকল জমার ইতিহাস (${toBengaliNumber(transactions.length)})` : `All Receipts (${transactions.length})`}
          </button>
          <button
            onClick={() => setActiveSubTab('loans')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeSubTab === 'loans'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {language === 'bn' ? `বিতরণকৃত ঋণ হিসাব (${toBengaliNumber(loans.length)})` : `Loans Accounts (${loans.length})`}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: MONTHLY COLLECTION SHEET */}
      {activeSubTab === 'sheet' && (
        <div className="space-y-4">
          {/* Rule 2 & 3 Notice Banner */}
          <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3.5 sm:p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <div className="font-bold text-emerald-950 flex items-center gap-2">
                  <span>{language === 'bn' ? '২নং ও ৩নং নিয়মাবলী:' : 'Bylaws Rule 2 & 3 Reminder:'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                    {language === 'bn' ? 'সময়সীমা: ৫-১০ তারিখ' : 'Window: 5th-10th'}
                  </span>
                </div>
                <div className="text-emerald-900 mt-0.5 text-[11px] sm:text-xs">
                  {language === 'bn'
                    ? 'প্রতি মাসের ৫-১০ তারিখের মধ্যে কিস্তি পরিশোধ বাধ্যতামূলক। বর্তমানে কোনো বিলম্ব জরিমানা নেই (বিলম্ব ফি বন্ধ)। একটানা চারমাস টাকা দিতে ব্যর্থ হলে নোটিশ ব্যতিত সদস্যপদ বাতিল ও জমাকৃত টাকা অফেরতযোগ্য।'
                    : 'Installments due between 5th-10th. Late fines are currently disabled (৳0). Failing 4 consecutive months leads to expulsion without notice & non-refundable savings.'}
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-1 rounded border border-emerald-300">
                {language === 'bn' ? 'বিলম্ব ফি: বন্ধ (০৳)' : 'Late Fee: Off (৳0)'}
              </span>
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

            {/* Monthly KPI pill stats */}
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

          {/* Collection Matrix Table */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4"># {language === 'bn' ? 'আইডি' : 'ID'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'সদস্যের নাম' : 'Member Name'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'ধার্য সঞ্চয় কিস্তি' : 'Savings Target'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'পরিশোধকৃত জমা' : 'Paid Amount'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'বকেয়া' : 'Due'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'চলমান ঋণ কিস্তি' : 'Loan Due'}</th>
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
                        {row.activeLoan ? (
                          <div>
                            <span className="font-mono font-bold text-neutral-800">
                              {formatCurrency(row.activeLoan.installmentAmount, language)}
                            </span>
                            <div className="text-[10px] text-neutral-500">
                              {row.activeLoan.loanNo} ({row.activeLoan.paidInstallments}/{row.activeLoan.totalInstallments})
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-400">-</span>
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
                              : language === 'bn' ? 'জমা নিন' : 'Collect'}
                          </button>
                          {!row.isSavingsPaid && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenCollectModal(
                                  row.member.id,
                                  'savings',
                                  selectedMonth,
                                  1000
                                )
                              }
                              title={language === 'bn' ? 'সরাসরি ১,০০০ ৳ কিস্তি জমা নিন' : 'Quick 1,000 BDT'}
                              className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors"
                            >
                              ১,০০০৳
                            </button>
                          )}
                          {row.recentTx && (
                            <button
                              onClick={() => onOpenReceipt(row.recentTx!)}
                              className="p-1 text-neutral-400 hover:text-neutral-800"
                              title={language === 'bn' ? 'রসিদ দেখুন' : 'View Receipt'}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
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

      {/* SUB-TAB 2: ALL TRANSACTIONS */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={language === 'bn' ? 'রসিদ নং বা সদস্যের নাম...' : 'Search by receipt # or name...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">{language === 'bn' ? 'সকল খাত (All Types)' : 'All Types'}</option>
                <option value="savings">{language === 'bn' ? 'সঞ্চয় কিস্তি' : 'Savings Kisti'}</option>
                <option value="loan_repayment">{language === 'bn' ? 'ঋণের কিস্তি' : 'Loan Installment'}</option>
                <option value="project_share">{language === 'bn' ? 'প্রকল্প চাঁদা' : 'Project Share'}</option>
                <option value="fine_fee">{language === 'bn' ? 'ভর্তি / অন্যান্য ফি' : 'Admission / Other Fees'}</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-3"># {language === 'bn' ? 'রসিদ নং' : 'Receipt'}</th>
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
                    const memberObj = members.find((m) => m.id === tx.memberId);
                    const principal = tx.principalAmount !== undefined ? tx.principalAmount : (tx.type === 'savings' ? Math.max(0, tx.amount - (tx.fineAmount || 0)) : tx.amount);
                    const fine = tx.fineAmount || 0;
                    const total = tx.totalPaid !== undefined ? tx.totalPaid : tx.amount;

                    return (
                      <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-neutral-800">{tx.receiptNo}</td>
                        <td className="py-3 px-3 font-mono text-neutral-600">{formatDate(tx.date, language)}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-neutral-900">
                            {language === 'bn' ? memberObj?.nameBn || memberObj?.nameEn : memberObj?.nameEn}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">{memberObj?.memberNo}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-neutral-700">
                          {tx.targetMonth || tx.periodMonth}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-emerald-700">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
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

      {/* SUB-TAB 3: LOANS DIRECTORY */}
      {activeSubTab === 'loans' && (
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">
                {language === 'bn' ? 'সমিতিতে বর্তমানে কোনো ঋণ হিসাব নেই' : 'No Loan Accounts'}
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {language === 'bn'
                  ? 'বর্তমানে কোনো সদস্যের চলমান বা বকেয়া ঋণ নেই (০টি ঋণ হিসাব)। ভবিষ্যতে কোনো সদস্যকে নতুন ঋণ প্রদান করতে চাইলে উপরের "নতুন ঋণ বিতরণ" বাটনে ক্লিক করতে পারেন।'
                  : 'There are currently no active or pending loan accounts in the organization.'}
              </p>
              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
              >
                <CreditCard className="w-4 h-4 text-blue-300" />
                <span>{language === 'bn' ? '+ নতুন ঋণ বিতরণ' : '+ Disburse Loan'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.map((loan) => {
                const mem = members.find((m) => m.id === loan.memberId);
                const progressPercent = Math.min(
                  100,
                  Math.round((loan.paidAmount / loan.totalPayable) * 100)
                );

                return (
                  <div
                    key={loan.id}
                    className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded">
                          {loan.loanNo}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${
                            loan.status === 'repaid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {loan.status === 'repaid' ? (language === 'bn' ? 'পরিশোধিত' : 'Repaid') : (language === 'bn' ? 'চলমান ঋণ' : 'Active')}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-neutral-900">
                        {language === 'bn' ? mem?.nameBn || mem?.nameEn : mem?.nameEn}
                      </h3>
                      <div className="text-xs text-neutral-500 mt-0.5 mb-3">{loan.purpose}</div>

                      {/* Loan Financial details */}
                      <div className="space-y-1.5 text-xs bg-neutral-50 p-3 rounded-lg border border-neutral-200 mb-3">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">{language === 'bn' ? 'মূল ঋণ (Principal):' : 'Principal:'}</span>
                          <strong className="font-mono tabular-nums">{formatCurrency(loan.principalAmount, language)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">{language === 'bn' ? 'সার্ভিস চার্জ / লাভ:' : 'Service Rate:'}</span>
                          <span className="font-mono">{loan.profitServiceRatePercent}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">{language === 'bn' ? 'সর্বমোট পরিশোধযোগ্য:' : 'Total Payable:'}</span>
                          <strong className="font-mono tabular-nums">{formatCurrency(loan.totalPayable, language)}</strong>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-neutral-200">
                          <span className="text-neutral-500">{language === 'bn' ? 'প্রতি কিস্তিতে দেয়:' : 'Per Installment:'}</span>
                          <strong className="font-mono tabular-nums text-emerald-700">
                            {formatCurrency(loan.installmentAmount, language)}
                          </strong>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[11px] text-neutral-600 mb-1">
                          <span>
                            {language === 'bn' ? 'পরিশোধিত কিস্তি:' : 'Paid Installments:'}{' '}
                            <strong className="font-mono">
                              {toBengaliNumber(loan.paidInstallments)}/{toBengaliNumber(loan.totalInstallments)}
                            </strong>
                          </span>
                          <span className="font-mono font-bold text-emerald-700">{toBengaliNumber(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-neutral-500 mt-1.5 font-mono">
                          <span>জমা: {formatCurrency(loan.paidAmount, language)}</span>
                          <span className="text-red-600 font-semibold">বকেয়া: {formatCurrency(loan.remainingAmount, language)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {language === 'bn' ? 'শেষ তারিখ:' : 'Due:'} {formatDate(loan.dueDate, language)}
                      </span>
                      {loan.remainingAmount > 0 && (
                        <button
                          onClick={() => onOpenCollectModal(loan.memberId, 'loan_repayment', selectedMonth, loan.installmentAmount)}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded transition-colors"
                        >
                          {language === 'bn' ? 'কিস্তি জমা নিন' : 'Collect Installment'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Disburse New Loan */}
      {isDisburseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden text-neutral-900">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold">
                  {language === 'bn' ? 'নতুন সমবায় ঋণ বিতরণ ফরম' : 'Disburse New Loan'}
                </h3>
              </div>
              <button onClick={() => setIsDisburseModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleDisburseLoanSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'ঋণগ্রহীতা সদস্য নির্বাচন' : 'Member Recipient'}
                </label>
                <select
                  value={loanMemberId}
                  onChange={(e) => setLoanMemberId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNo} - {language === 'bn' ? m.nameBn : m.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    {language === 'bn' ? 'ঋণের পরিমাণ (৳)' : 'Principal Amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    value={loanPrincipal}
                    onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    {language === 'bn' ? 'সার্ভিস চার্জ / লাভ (%)' : 'Service Fee (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={loanRate}
                    onChange={(e) => setLoanRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    {language === 'bn' ? 'কিস্তির সংখ্যা' : 'Installments Count'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={loanInstallments}
                    onChange={(e) => setLoanInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                    required
                  />
                </div>

                <div>
                  <DateInput
                    label={language === 'bn' ? 'পরিশোধের শেষ তারিখ' : 'Final Due Date'}
                    value={loanDueDate}
                    onChange={(val) => setLoanDueDate(val)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'ঋণের উদ্দেশ্য / বিবরণ' : 'Loan Purpose / Business'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মুদি দোকান স্টক বৃদ্ধি বা কৃষি যন্ত্রপাতি ক্রয়"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Calculated loan overview */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">মোট পরিশোধযোগ্য:</span>
                  <strong className="font-mono tabular-nums text-neutral-900">
                    {formatCurrency(Math.round(loanPrincipal * (1 + loanRate / 100)), language)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">প্রতি কিস্তির পরিমাণ:</span>
                  <strong className="font-mono tabular-nums text-emerald-700">
                    {formatCurrency(Math.round((loanPrincipal * (1 + loanRate / 100)) / (loanInstallments || 1)), language)}
                  </strong>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-xs"
                >
                  {language === 'bn' ? 'ঋণ মঞ্জুর ও বিতরণ' : 'Disburse Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

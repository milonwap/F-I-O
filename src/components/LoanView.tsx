import React, { useState } from 'react';
import {
  CreditCard,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  User,
  Users,
  ShieldCheck,
  Building,
  Phone,
  FileText,
  BadgeCheck,
  Search,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { Loan, KistiTransaction, BorrowerType } from '../types/somiti';
import { formatCurrency, toBengaliNumber, formatDate } from '../utils/formatters';
import { DateInput } from './DateInput';

interface LoanViewProps {
  onOpenCollectModal: (
    memberId?: string,
    type?: any,
    periodMonth?: string,
    defaultAmount?: number
  ) => void;
  onOpenReceipt: (tx: KistiTransaction) => void;
}

export const LoanView: React.FC<LoanViewProps> = ({
  onOpenCollectModal,
  onOpenReceipt,
}) => {
  const { members, loans, disburseLoan, transactions, language } = useSomiti();

  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'member' | 'external'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [borrowerType, setBorrowerType] = useState<BorrowerType>('member');
  const [loanMemberId, setLoanMemberId] = useState(members[0]?.id || '');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerAddress, setBorrowerAddress] = useState('');
  const [borrowerNid, setBorrowerNid] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [collateralDetails, setCollateralDetails] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');

  const [loanPrincipal, setLoanPrincipal] = useState<number>(25000);
  const [loanRate, setLoanRate] = useState<number>(8);
  const [loanInstallments, setLoanInstallments] = useState<number>(10);
  const [loanPurpose, setLoanPurpose] = useState<string>('');
  const [loanDueDate, setLoanDueDate] = useState<string>('2026-12-31');
  const [formError, setFormError] = useState('');

  // Summary calculations
  const totalPayable = Math.round(loanPrincipal * (1 + (loanRate || 0) / 100));
  const installmentAmount = Math.round(totalPayable / (loanInstallments || 1));
  const profitAmount = totalPayable - loanPrincipal;

  const handleOpenDisburseModal = () => {
    setBorrowerType('member');
    setLoanMemberId(members[0]?.id || '');
    setBorrowerName('');
    setBorrowerPhone('');
    setBorrowerAddress('');
    setBorrowerNid('');
    setGuarantorName('');
    setGuarantorPhone('');
    setCollateralDetails('');
    setFrequency('monthly');
    setLoanPrincipal(25000);
    setLoanRate(8);
    setLoanInstallments(10);
    setLoanPurpose('');
    setLoanDueDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormError('');
    setIsDisburseModalOpen(true);
  };

  const handleDisburseLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (loanPrincipal <= 0) {
      setFormError(language === 'bn' ? 'মূল ঋণের পরিমাণ সঠিক নয়' : 'Invalid principal amount');
      return;
    }

    if (borrowerType === 'member') {
      if (!loanMemberId) {
        setFormError(language === 'bn' ? 'দয়া করে একজন সদস্য নির্বাচন করুন' : 'Please select a member');
        return;
      }
      disburseLoan({
        borrowerType: 'member',
        memberId: loanMemberId,
        principalAmount: Number(loanPrincipal),
        profitServiceRatePercent: Number(loanRate),
        totalPayable,
        totalInstallments: Number(loanInstallments),
        installmentAmount,
        frequency,
        disbursedDate: new Date().toISOString().split('T')[0],
        dueDate: loanDueDate,
        purpose: loanPurpose.trim() || 'Member Business / Emergency Loan',
      });
    } else {
      if (!borrowerName.trim()) {
        setFormError(language === 'bn' ? 'ঋণগ্রহীতার নাম প্রদান করুন' : 'Borrower name is required');
        return;
      }
      if (!borrowerPhone.trim()) {
        setFormError(language === 'bn' ? 'ঋণগ্রহীতার ফোন নম্বর প্রদান করুন' : 'Borrower phone is required');
        return;
      }
      disburseLoan({
        borrowerType: 'external',
        borrowerName: borrowerName.trim(),
        borrowerPhone: borrowerPhone.trim(),
        borrowerAddress: borrowerAddress.trim(),
        borrowerNid: borrowerNid.trim(),
        guarantorName: guarantorName.trim(),
        guarantorPhone: guarantorPhone.trim(),
        collateralDetails: collateralDetails.trim(),
        principalAmount: Number(loanPrincipal),
        profitServiceRatePercent: Number(loanRate),
        totalPayable,
        totalInstallments: Number(loanInstallments),
        installmentAmount,
        frequency,
        disbursedDate: new Date().toISOString().split('T')[0],
        dueDate: loanDueDate,
        purpose: loanPurpose.trim() || 'External Micro / Business Loan',
      });
    }

    setIsDisburseModalOpen(false);
  };

  // Filtered loans
  const filteredLoans = loans.filter((loan) => {
    if (filterType === 'member' && loan.borrowerType === 'external') return false;
    if (filterType === 'external' && loan.borrowerType !== 'external') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = loan.loanNo.toLowerCase().includes(q);
      const matchPurpose = (loan.purpose || '').toLowerCase().includes(q);
      let matchName = false;
      if (loan.borrowerType === 'external') {
        matchName = (loan.borrowerName || '').toLowerCase().includes(q) || (loan.borrowerPhone || '').includes(q);
      } else {
        const mem = members.find((m) => m.id === loan.memberId);
        matchName = (mem?.nameBn || '').toLowerCase().includes(q) || (mem?.nameEn || '').toLowerCase().includes(q) || (mem?.memberNo || '').toLowerCase().includes(q);
      }
      return matchNo || matchPurpose || matchName;
    }
    return true;
  });

  const totalDisbursed = loans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalRemaining = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const activeCount = loans.filter((l) => l.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{language === 'bn' ? 'ঋণ ও লোন হিসাব খতিয়ান' : 'Loan Accounts & Ledger'}</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {language === 'bn'
                ? 'সমিতি সদস্য ও বহিরাগত ঋণগ্রহীতাদের ঋণ বিতরণ, জামানত ও কিস্তি আদায় খতিয়ান'
                : 'Registered member and external borrower loan disbursements & installment management'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenDisburseModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-200" />
              <span>{language === 'bn' ? '+ নতুন ঋণ বিতরণ' : '+ Disburse Loan'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              {language === 'bn' ? 'সর্বমোট বিতরণকৃত মূল ঋণ' : 'Total Disbursed Principal'}
            </div>
            <div className="text-base font-bold text-neutral-900 dark:text-white font-mono mt-0.5">
              {formatCurrency(totalDisbursed, language)}
            </div>
          </div>
          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200/80 dark:border-amber-800/50">
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              {language === 'bn' ? 'বর্তমান মোট বকেয়া ঋণ' : 'Total Outstanding Balance'}
            </div>
            <div className="text-base font-bold text-amber-900 dark:text-amber-200 font-mono mt-0.5">
              {formatCurrency(totalRemaining, language)}
            </div>
          </div>
          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200/80 dark:border-blue-800/50">
            <div className="text-[11px] text-blue-800 dark:text-blue-300 font-medium">
              {language === 'bn' ? 'সক্রিয় ঋণের সংখ্যা' : 'Active Loans Count'}
            </div>
            <div className="text-base font-bold text-blue-900 dark:text-blue-200 font-mono mt-0.5">
              {toBengaliNumber(activeCount)} {language === 'bn' ? 'টি' : 'Accounts'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-emerald-800 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            {language === 'bn' ? `সব ঋণ (${loans.length})` : `All Loans (${loans.length})`}
          </button>
          <button
            onClick={() => setFilterType('member')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterType === 'member'
                ? 'bg-emerald-800 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            {language === 'bn' ? 'সদস্য ঋণ' : 'Member Loans'}
          </button>
          <button
            onClick={() => setFilterType('external')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterType === 'external'
                ? 'bg-emerald-800 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            {language === 'bn' ? 'বহিরাগত ঋণ' : 'External Loans'}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'ঋণ নং, নাম বা ফোন নম্বর খুঁজুন...' : 'Search loans...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Loans Grid / Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
            {language === 'bn'
              ? `ঋণ হিসাব তালিকা (${toBengaliNumber(filteredLoans.length)})`
              : `Loan Accounts (${filteredLoans.length})`}
          </h2>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <CreditCard className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {language === 'bn' ? 'কোনো ঋণ হিসাব পাওয়া যায়নি' : 'No loan accounts found'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              {language === 'bn'
                ? 'নতুন ঋণ বিতরণ করতে উপরের "+ নতুন ঋণ বিতরণ" বাটনে ক্লিক করুন।'
                : 'Click "+ Disburse Loan" above to issue a new loan.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">{language === 'bn' ? 'ঋণ নং' : 'Loan #'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'ঋণগ্রহীতার বিবরণ' : 'Borrower Details'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'ধরন' : 'Type'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'মূল ঋণ' : 'Principal'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'সর্বমোট প্রদেয়' : 'Total Payable'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'কিস্তি' : 'Installment'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'বকেয়া বাকি' : 'Remaining'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'অবস্থা' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredLoans.map((loan) => {
                  const isExternal = loan.borrowerType === 'external';
                  const mem = !isExternal ? members.find((m) => m.id === loan.memberId) : null;

                  return (
                    <tr key={loan.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {loan.loanNo}
                      </td>
                      <td className="py-3 px-4">
                        {isExternal ? (
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                              <span>{loan.borrowerName}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                              📞 {loan.borrowerPhone}
                              {loan.guarantorName && <span> · জামিনদার: {loan.guarantorName}</span>}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white">
                              {mem ? (language === 'bn' ? mem.nameBn : mem.nameEn) : loan.memberId}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono">
                              {mem?.memberNo} · 📞 {mem?.phone}
                            </div>
                          </div>
                        )}
                        <div className="text-[10px] text-neutral-400 truncate max-w-[150px]">{loan.purpose}</div>
                      </td>
                      <td className="py-3 px-4">
                        {isExternal ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {language === 'bn' ? 'বহিরাগত' : 'External'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {language === 'bn' ? 'সদস্য' : 'Member'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {formatCurrency(loan.principalAmount, language)}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                        {formatCurrency(loan.totalPayable, language)}
                        <div className="text-[10px] text-neutral-400">+{toBengaliNumber(loan.profitServiceRatePercent)}% profit</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(loan.installmentAmount, language)}
                        <div className="text-[10px] text-neutral-400">
                          {loan.frequency === 'weekly'
                            ? (language === 'bn' ? 'সাপ্তাহিক' : 'Weekly')
                            : (language === 'bn' ? 'মাসিক' : 'Monthly')}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        {formatCurrency(loan.paidAmount, language)}
                        <div className="text-[10px] text-neutral-400">
                          ({toBengaliNumber(loan.paidInstallments)}/{toBengaliNumber(loan.totalInstallments)} কিস্তি)
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(loan.remainingAmount, language)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            loan.status === 'active'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {loan.status === 'active'
                            ? (language === 'bn' ? 'চলমান (Active)' : 'Active')
                            : (language === 'bn' ? 'পরিশোধিত (Repaid)' : 'Repaid')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {loan.status === 'active' && (
                          <button
                            onClick={() =>
                              onOpenCollectModal(
                                loan.borrowerType === 'external' ? undefined : loan.memberId,
                                'loan_repayment',
                                new Date().toISOString().slice(0, 7),
                                loan.installmentAmount
                              )
                            }
                            className="px-3 py-1 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded transition-colors cursor-pointer"
                          >
                            {language === 'bn' ? 'কিস্তি জমা' : 'Collect'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disburse Loan Modal (with Member / External toggle) */}
      {isDisburseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {language === 'bn' ? 'নতুন ঋণ বিতরণ (Disburse Loan)' : 'Disburse New Loan'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {language === 'bn' ? 'সদস্য অথবা বহিরাগত ব্যক্তির জন্য ঋণ মঞ্জুর' : 'Approve loan for member or external borrower'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDisburseModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs rounded-lg font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleDisburseLoanSubmit} className="space-y-4 text-xs">
              {/* Borrower Type Selector */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1.5">
                  {language === 'bn' ? 'ঋণগ্রহীতার ধরন (Borrower Category)' : 'Borrower Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBorrowerType('member')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      borrowerType === 'member'
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'সমিতি সদস্য ঋণ' : 'Registered Member'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowerType('external')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      borrowerType === 'external'
                        ? 'bg-purple-800 text-white border-purple-900 shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'বহিরাগত ঋণ (External)' : 'External Borrower'}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Borrower Fields */}
              {borrowerType === 'member' ? (
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    {language === 'bn' ? 'ঋণগ্রহীতা সদস্য নির্বাচন *' : 'Select Member *'}
                  </label>
                  <select
                    value={loanMemberId}
                    onChange={(e) => setLoanMemberId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                    required
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.memberNo} - {language === 'bn' ? m.nameBn : m.nameEn} ({m.phone})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-xl space-y-3">
                  <div className="font-bold text-purple-950 dark:text-purple-300 text-xs">
                    {language === 'bn' ? 'বহিরাগত ঋণগ্রহীতা ও জামিনদারের তথ্য' : 'External Borrower & Guarantor'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                        {language === 'bn' ? 'গ্রহীতার পূর্ণ নাম *' : 'Borrower Full Name *'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                        {language === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                      </label>
                      <input
                        type="text"
                        placeholder="017xxxxxxxx"
                        value={borrowerPhone}
                        onChange={(e) => setBorrowerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                        {language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)'}
                      </label>
                      <input
                        type="text"
                        placeholder="NID নম্বর"
                        value={borrowerNid}
                        onChange={(e) => setBorrowerNid(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                        {language === 'bn' ? 'ঠিকানা' : 'Address'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'bn' ? 'গ্রাম, ডাকঘর, উপজেলা' : 'Address'}
                        value={borrowerAddress}
                        onChange={(e) => setBorrowerAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200/60 dark:border-purple-800/40">
                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                        {language === 'bn' ? 'জামিনদারের নাম' : 'Guarantor Name'}
                      </label>
                      <input
                        type="text"
                        placeholder="জামিনদারের নাম"
                        value={guarantorName}
                        onChange={(e) => setGuarantorName(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                        {language === 'bn' ? 'জামিনদারের ফোন' : 'Guarantor Phone'}
                      </label>
                      <input
                        type="text"
                        placeholder="জামিনদারের ফোন"
                        value={guarantorPhone}
                        onChange={(e) => setGuarantorPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                      {language === 'bn' ? 'জামানত / বন্ধক বিবরণ (Collateral)' : 'Collateral / Security'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'bn' ? 'যেমন: চেক, স্বর্ণ বা জমির দলিল' : 'e.g. Cheque, gold, land deed'}
                      value={collateralDetails}
                      onChange={(e) => setCollateralDetails(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Financial Terms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    {language === 'bn' ? 'মূল ঋণ (৳) *' : 'Principal Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={loanPrincipal}
                    onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono font-bold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    {language === 'bn' ? 'সার্ভিস চার্জ / লাভ (%)' : 'Service Rate (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={loanRate}
                    onChange={(e) => setLoanRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    {language === 'bn' ? 'কিস্তির ধরন' : 'Frequency'}
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="monthly">{language === 'bn' ? 'মাসিক' : 'Monthly'}</option>
                    <option value="weekly">{language === 'bn' ? 'সাপ্তাহিক' : 'Weekly'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    {language === 'bn' ? 'মোট কিস্তি সংখ্যা' : 'Installments'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={loanInstallments}
                    onChange={(e) => setLoanInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <DateInput
                    label={language === 'bn' ? 'শেষ তারিখ' : 'Due Date'}
                    value={loanDueDate}
                    onChange={(val) => setLoanDueDate(val)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  {language === 'bn' ? 'ঋণের উদ্দেশ্য (Purpose)' : 'Loan Purpose'}
                </label>
                <input
                  type="text"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: ক্ষুদ্র ব্যবসা সম্প্রসারণ বা চিকিৎসা' : 'e.g. Small business'}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              {/* Real-time Summary Calculation Card */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 text-xs space-y-1.5 text-emerald-950 dark:text-emerald-200">
                <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800 pb-1 flex items-center justify-between">
                  <span>{language === 'bn' ? 'ঋণ হিসাব সামারি' : 'Loan Calculation Summary'}</span>
                  <span>{frequency === 'weekly' ? (language === 'bn' ? 'সাপ্তাহিক কিস্তি' : 'Weekly') : (language === 'bn' ? 'মাসিক কিস্তি' : 'Monthly')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'bn' ? 'মূল ঋণ:' : 'Principal:'}</span>
                  <strong className="font-mono">{formatCurrency(loanPrincipal, language)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'bn' ? 'মুনাফা / সার্ভিস চার্জ:' : 'Profit / Service Charge:'}</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-300">+{formatCurrency(profitAmount, language)} ({toBengaliNumber(loanRate)}%)</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100">
                  <span>{language === 'bn' ? 'সর্বমোট প্রদেয়:' : 'Total Payable:'}</span>
                  <span className="font-mono">{formatCurrency(totalPayable, language)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                  <span>{frequency === 'weekly' ? (language === 'bn' ? 'প্রতি সপ্তাহের কিস্তি:' : 'Per Week:') : (language === 'bn' ? 'প্রতি মাসের কিস্তি:' : 'Per Month:')}</span>
                  <span className="font-mono">{formatCurrency(installmentAmount, language)} ({toBengaliNumber(loanInstallments)} {language === 'bn' ? 'টি' : 'x'})</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-4 py-2 font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {language === 'bn' ? 'ঋণ অনুমোদন ও বিতরণ' : 'Confirm & Disburse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

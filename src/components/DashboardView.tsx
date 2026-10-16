import React, { useState, useMemo } from 'react';
import { useSomiti } from '../context/SomitiContext';
import { Member, KistiTransaction } from '../types/somiti';
import { formatCurrency, toBengaliNumber } from '../utils/formatters';
import { calculateSomitiMetrics, calculateMemberEquity } from '../utils/financialCalculations';
import {
  Coins,
  TrendingUp,
  Wallet,
  Landmark,
  Scale,
  PlusCircle,
  UserPlus,
  ArrowRight,
  Search,
  CheckCircle2,
  PieChart,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab?: (tab: any) => void;
  onOpenCollectModal?: (
    memberId?: string,
    type?: any,
    periodMonth?: string,
    defaultAmount?: number
  ) => void;
  onOpenReceipt?: (tx: KistiTransaction) => void;
  onOpenMemberProfile?: (member: Member) => void;
  onOpenAddMember?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenCollectModal,
  onOpenMemberProfile,
  onOpenAddMember,
}) => {
  const {
    members,
    transactions,
    loans,
    projects,
    cashbook,
    language,
    syncStatus,
    manualForceSync,
    lastSaved,
  } = useSomiti();

  const [searchTerm, setSearchTerm] = useState('');
  const [showMemberValuationTable, setShowMemberValuationTable] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Active/billing month for Dashboard metrics
  const currentMonth = useMemo(() => {
    const latestTx = transactions.find((t) => t.type === 'savings');
    return latestTx?.periodMonth || new Date().toISOString().slice(0, 7);
  }, [transactions]);

  // Comprehensive Financial Calculations based on official Somiti Business Logic:
  // 1. Total Asset = (সকল মেম্বারের মোট সঞ্চয়) + (ইনভেস্টমেন্ট থেকে অর্জিত মোট লাভ) + (মোট জরিমানা/লেট ফি) + অন্যান্য আয়
  // 2. সমিতির মোট শেয়ার সংখ্যা = ১০০ (ফিক্সড)
  // 3. প্রতি শেয়ারের ফেস ভ্যালু = Total Asset / 100
  // 4. মেম্বার প্রতি শেয়ার = 100 / N
  // 5. মেম্বার সম্পত্তি ও ইকুইটি = Shares per Member * Per Share Value = Total Asset / N
  const metrics = useMemo(() => {
    return calculateSomitiMetrics({
      members,
      transactions,
      loans,
      projects,
      cashbook,
    });
  }, [members, transactions, loans, projects, cashbook]);

  // Monthly Kisti Collection metrics
  const currentMonthTxs = useMemo(() => {
    return transactions.filter(
      (t) => t.periodMonth === currentMonth && t.type === 'savings'
    );
  }, [transactions, currentMonth]);

  const monthTarget = useMemo(() => {
    return members.reduce((sum, m) => sum + m.monthlySavingsCommitment, 0);
  }, [members]);

  const monthCollected = useMemo(() => {
    return currentMonthTxs.reduce(
      (sum, t) => sum + (t.principalAmount !== undefined ? t.principalAmount : t.amount),
      0
    );
  }, [currentMonthTxs]);

  const monthCollectionRate = monthTarget > 0 ? Math.round((monthCollected / monthTarget) * 100) : 0;
  const paidMembersCount = new Set(currentMonthTxs.map((t) => t.memberId)).size;

  const cashierMember = useMemo(() => {
    return members.find((m) => m.role === 'cashier' || m.role === 'lead_executive') || members[0];
  }, [members]);

  // Filtered members for the Live Valuation Breakdown table
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const term = searchTerm.toLowerCase();
    return members.filter(
      (m) =>
        m.nameBn.toLowerCase().includes(term) ||
        m.nameEn.toLowerCase().includes(term) ||
        m.memberNo.toLowerCase().includes(term) ||
        m.phone.includes(term)
    );
  }, [members, searchTerm]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await manualForceSync();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Organization Welcome Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Friend Initiative Organization
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {syncStatus === 'synced'
                    ? (language === 'bn' ? 'ফায়ারবেস লাইভ সিঙ্ক' : 'Firebase Live Sync')
                    : (language === 'bn' ? 'ক্লাউড কানেক্টেড' : 'Cloud Connected')}
                </span>
              </span>
            </div>

            <div className="text-xs font-semibold text-emerald-800 mt-1">
              {language === 'bn'
                ? 'রেজিস্ট্রেশন নং: FIO-7412 · প্রতিষ্ঠার সাল: ২০২৪ (Since 2024)'
                : 'Reg No: FIO-7412 · Since 2024'}
            </div>

            <p className="text-xs text-neutral-500 mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="font-medium text-neutral-700">
                {language === 'bn' ? '📍 সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : '📍 Sitaikunda, Kotalipara, Gopalgonj'}
              </span>
              <span>·</span>
              <span>
                {language === 'bn' ? 'মোট নিবন্ধিত সদস্য:' : 'Registered Members:'}{' '}
                <strong className="text-neutral-900 font-mono font-bold">
                  {toBengaliNumber(members.length)} জন
                </strong>
              </span>
              <span>·</span>
              <span>
                {language === 'bn' ? 'দায়িত্বপ্রাপ্ত ক্যাশিয়ার:' : 'Active Cashier:'}{' '}
                <strong className="text-neutral-800">
                  {language === 'bn' ? cashierMember?.nameBn : cashierMember?.nameEn}
                </strong>
              </span>
            </p>
          </div>

          {/* Quick Actions & Live Cloud Sync Trigger */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              title={language === 'bn' ? 'ফায়ারবেস ক্লাউডের সাথে রিয়েলটাইম সিঙ্ক' : 'Sync with Firebase Cloud'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-700' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncing
                  ? (language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...')
                  : (language === 'bn' ? 'ক্লাউড সিঙ্ক' : 'Cloud Sync')}
              </span>
            </button>

            {onOpenCollectModal && (
              <button
                onClick={() => onOpenCollectModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'bn' ? '+ কিস্তি কালেকশন' : '+ Collect Kisti'}</span>
              </button>
            )}

            {onOpenAddMember && (
              <button
                onClick={onOpenAddMember}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? '+ নতুন সদস্য' : '+ Add Member'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. HERO VALUATION BANNER: সমীকরণ ও ১০০ শেয়ার ভিত্তিক ফিনান্সিয়াল মডেল */}
        {/* ===================================================================== */}
        <div className="mt-6 pt-6 border-t border-neutral-100">
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              {/* Left Column: Total Asset Value & Formula */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/60 text-emerald-200 text-[11px] font-bold uppercase tracking-wider border border-emerald-600/60 flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    <span>{language === 'bn' ? 'লাইভ ফিনান্সিয়াল ভ্যালুয়েশন' : 'Live Valuation Model'}</span>
                  </span>
                  <span className="text-[11px] text-emerald-200/80">
                    {language === 'bn' ? 'ফিক্সড ১০০টি শেয়ার বণ্টন নীতি' : 'Fixed 100 Shares Equal Ratio'}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-3">
                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                    {formatCurrency(metrics.totalAssets, language)}
                  </div>
                  <span className="text-xs sm:text-sm text-emerald-200 font-medium">
                    {language === 'bn' ? '(সমিতির সর্বমোট সম্পত্তি)' : '(Total Organization Assets)'}
                  </span>
                </div>

                {/* Mathematical Equation Ribbon */}
                <div className="text-xs text-emerald-100/90 font-sans flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="font-semibold text-emerald-300">
                    {language === 'bn' ? 'গাণিতিক সমীকরণ:' : 'Formula:'}
                  </span>
                  <span className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-700/50 font-mono">
                    {language === 'bn' ? 'সদস্য সঞ্চয়' : 'Savings'} ({formatCurrency(metrics.totalMemberSavings, language)})
                  </span>
                  <span>+</span>
                  <span className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-700/50 font-mono">
                    {language === 'bn' ? 'বিনিয়োগ মুনাফা' : 'Profit'} ({formatCurrency(metrics.totalInvestmentProfits, language)})
                  </span>
                  <span>+</span>
                  <span className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-700/50 font-mono">
                    {language === 'bn' ? 'লেট ফি/জরিমানা' : 'Late Fees'} ({formatCurrency(metrics.totalLateFees, language)})
                  </span>
                  {metrics.otherIncome > 0 && (
                    <>
                      <span>+</span>
                      <span className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-700/50 font-mono">
                        {language === 'bn' ? 'অন্যান্য' : 'Other'} ({formatCurrency(metrics.otherIncome, language)})
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: 3 Pillar Valuation Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                {/* Pillar 1: প্রতি শেয়ারের ফেস ভ্যালু */}
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3.5">
                  <div className="text-[11px] text-emerald-200 font-bold uppercase tracking-wide">
                    {language === 'bn' ? 'প্রতি শেয়ার ফেস ভ্যালু' : 'Face Value / Share'}
                  </div>
                  <div className="text-xl font-black font-mono text-white mt-1">
                    {formatCurrency(metrics.faceValuePerShare, language)}
                  </div>
                  <div className="text-[10px] text-emerald-300 mt-0.5">
                    {language === 'bn' ? 'মোট ১০০টি ফিক্সড শেয়ার' : 'Total 100 Fixed Shares'}
                  </div>
                </div>

                {/* Pillar 2: সদস্য প্রতি সমান শেয়ার */}
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3.5">
                  <div className="text-[11px] text-emerald-200 font-bold uppercase tracking-wide">
                    {language === 'bn' ? 'সদস্য প্রতি শেয়ার' : 'Shares / Member'}
                  </div>
                  <div className="text-xl font-black font-mono text-white mt-1">
                    {toBengaliNumber(metrics.sharesPerMember)} {language === 'bn' ? 'টি' : 'Shares'}
                  </div>
                  <div className="text-[10px] text-emerald-300 mt-0.5">
                    {language === 'bn' ? `১০০ ÷ ${toBengaliNumber(members.length)} জন সদস্য` : `100 ÷ ${members.length} Members`}
                  </div>
                </div>

                {/* Pillar 3: সদস্য প্রতি সম্পত্তির মূল্য (Equity) */}
                <div className="bg-emerald-950/60 border border-emerald-400/30 rounded-xl p-3.5">
                  <div className="text-[11px] text-emerald-300 font-bold uppercase tracking-wide">
                    {language === 'bn' ? 'সদস্য প্রতি সম্পদ মূল্য' : 'Member Equity Valuation'}
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-100 mt-1">
                    {formatCurrency(metrics.equityPerMember, language)}
                  </div>
                  <div className="text-[10px] text-emerald-300 mt-0.5">
                    {language === 'bn' ? 'শেয়ার × প্রতি শেয়ার মূল্য' : 'Shares × Face Value'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. PRIMARY FINANCIAL SUMMARY STAT CARDS */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6">
          {/* Card 1: মোট সদস্য সঞ্চয় (Total Member Savings) */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              {language === 'bn' ? 'মোট সদস্য সঞ্চয়' : 'Total Member Savings'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-900 mt-1">
              {formatCurrency(metrics.totalMemberSavings, language)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              {language === 'bn' ? 'সদস্য মূল আমানত জমা' : 'Members Principal Deposit'}
            </div>
          </div>

          {/* Card 2: বিনিয়োগ থেকে অর্জিত লাভ (Total Investment Profit) */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl">
            <div className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">
              {language === 'bn' ? 'বিনিয়োগ মুনাফা' : 'Investment Profits'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-teal-950 mt-1">
              {formatCurrency(metrics.totalInvestmentProfits, language)}
            </div>
            <div className="text-[11px] text-teal-800 mt-1 font-medium">
              {language === 'bn' ? 'প্রকল্প হতে নগদ লাভ' : 'Net Venture Earnings'}
            </div>
          </div>

          {/* Card 3: মোট জরিমানা ও লেট ফি আদায় (Total Late Fees Collected) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              {language === 'bn' ? 'মোট লেট ফি / জরিমানা' : 'Total Late Fees'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-950 mt-1">
              {formatCurrency(metrics.totalLateFees, language)}
            </div>
            <div className="text-[11px] text-amber-800 mt-1 font-medium">
              {language === 'bn' ? 'সমিতির প্রশাসনিক আয়' : 'Administrative Revenue'}
            </div>
          </div>

          {/* Card 4: মাসিক কিস্তি আদায় (Monthly Kisti Collection) */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
              {language === 'bn' ? 'মাসিক কিস্তি আদায়' : 'Monthly Collection'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-neutral-900 mt-1">
              {toBengaliNumber(monthCollectionRate)}%
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
              <span>{formatCurrency(monthCollected, language)}</span>
              <span>
                ({toBengaliNumber(paidMembersCount)}/{toBengaliNumber(members.length)})
              </span>
            </div>
          </div>

          {/* Card 5: সক্রিয় ঋণ ও বকেয়া (Active Loans & Dues) */}
          <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl">
            <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
              {language === 'bn' ? 'সক্রিয় ঋণ ও বকেয়া' : 'Active Loans & Dues'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-800 mt-1">
              {formatCurrency(metrics.totalOutstandingLoanDues, language)}
            </div>
            <div className="text-[11px] text-rose-700 mt-1">
              {language === 'bn'
                ? `বিতরণ: ${formatCurrency(metrics.totalActiveLoansDisbursed, language)}`
                : `Disbursed: ${formatCurrency(metrics.totalActiveLoansDisbursed, language)}`}
            </div>
          </div>

          {/* Card 6: ক্যাশিয়ারের কাছে নগদ (Cash in Hand / Drawer) */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
            <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              {language === 'bn' ? 'ক্যাশ ইন হ্যান্ড (ড্রয়ার)' : 'Cash in Hand'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-blue-900 mt-1">
              {formatCurrency(metrics.cashInHand, language)}
            </div>
            <div className="text-[11px] text-blue-700 mt-1 font-medium">
              {language === 'bn' ? 'দৈনিক নগদ ক্যাশ ভল্ট' : 'Liquid Drawer Vault'}
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 4. QUICK WORKFLOW TOOLBAR */}
        {/* ===================================================================== */}
        {onNavigateTab && (
          <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-500 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>{language === 'bn' ? 'অটোমেটেড মডিউল দ্রুত লিংক:' : 'Automated Module Quick Links:'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigateTab('deposit')}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-800 font-medium transition-colors cursor-pointer"
              >
                {language === 'bn' ? '📥 কিস্তি রেজিস্টার' : '📥 Kisti Register'}
              </button>
              <button
                onClick={() => onNavigateTab('projects_tasks')}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-teal-500 hover:bg-teal-50 text-neutral-700 hover:text-teal-800 font-medium transition-colors cursor-pointer"
              >
                {language === 'bn' ? '💼 বিনিয়োগ ও মুনাফা' : '💼 Investments & Profit'}
              </button>
              <button
                onClick={() => onNavigateTab('cashier')}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-blue-500 hover:bg-blue-50 text-neutral-700 hover:text-blue-800 font-medium transition-colors cursor-pointer"
              >
                {language === 'bn' ? '💵 ক্যাশিয়ার খতিয়ান' : '💵 Cashier Ledger'}
              </button>
              <button
                onClick={() => onNavigateTab('reports')}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-purple-500 hover:bg-purple-50 text-neutral-700 hover:text-purple-800 font-medium transition-colors cursor-pointer"
              >
                {language === 'bn' ? '📊 ব্যালেন্স শিট ও রিপোর্ট' : '📊 Balance Sheet & Reports'}
              </button>
              <button
                onClick={() => setShowMemberValuationTable(!showMemberValuationTable)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{language === 'bn' ? '👥 মেম্বার শেয়ার ও সম্পদ তালিকা' : '👥 Member Equity Table'}</span>
                {showMemberValuationTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 5. COLLAPSIBLE MEMBER SHARE & ASSET VALUATION TABLE */}
      {/* ===================================================================== */}
      {showMemberValuationTable && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-neutral-900">
                  {language === 'bn'
                    ? 'সকল সদস্যের শেয়ার ও ব্যক্তিগত সম্পত্তির লাইভ হিসাব'
                    : 'All Members Share & Equity Live Valuation'}
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {language === 'bn'
                  ? `মোট ১০০টি শেয়ার সমান ${toBengaliNumber(metrics.sharesPerMember)} টি অনুপাতে বণ্টন · প্রতি শেয়ারের ফেস ভ্যালু ${formatCurrency(metrics.faceValuePerShare, language)}`
                  : `100 Shares split equally at ${metrics.sharesPerMember} shares each · Face value ${formatCurrency(metrics.faceValuePerShare, language)}`}
              </p>
            </div>

            {/* Member Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={language === 'bn' ? 'সদস্য খুঁজুন (নাম/নং)...' : 'Search member...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-neutral-50/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-3"># {language === 'bn' ? 'সদস্য' : 'Member'}</th>
                  <th className="py-3 px-3">{language === 'bn' ? 'পদবী ও মোবাইল' : 'Role & Phone'}</th>
                  <th className="py-3 px-3 text-right">{language === 'bn' ? 'মোট সঞ্চয় জমা' : 'Savings Deposit'}</th>
                  <th className="py-3 px-3 text-center">{language === 'bn' ? 'শেয়ার সংখ্যা' : 'Shares Count'}</th>
                  <th className="py-3 px-3 text-right">{language === 'bn' ? 'শেয়ার ফেস ভ্যালু' : 'Face Value / Share'}</th>
                  <th className="py-3 px-3 text-right">{language === 'bn' ? 'ব্যক্তিগত সম্পত্তির মূল্য' : 'Member Equity'}</th>
                  <th className="py-3 px-3 text-right">{language === 'bn' ? 'প্রাপ্য লাভ ও সারপ্লাস' : 'Profit & Surplus'}</th>
                  <th className="py-3 px-3 text-center">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {filteredMembers.map((member) => {
                  const memberEquity = calculateMemberEquity(member, metrics);
                  return (
                    <tr key={member.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 text-[11px]">
                            {member.memberNo}
                          </span>
                          <span className="font-bold text-neutral-900">
                            {language === 'bn' ? member.nameBn : member.nameEn}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-neutral-500">
                        <div className="text-[11px] font-mono">{member.phone}</div>
                        <div className="text-[10px] text-neutral-400 capitalize">{member.role}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        {formatCurrency(memberEquity.totalSavingsDeposited, language)}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-neutral-800">
                        <span className="bg-neutral-100 px-2 py-0.5 rounded">
                          {toBengaliNumber(memberEquity.sharesCount)} {language === 'bn' ? 'টি' : ''}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-neutral-700">
                        {formatCurrency(memberEquity.faceValuePerShare, language)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-900 bg-emerald-50/40">
                        {formatCurrency(memberEquity.totalEquityValue, language)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-800">
                        +{formatCurrency(memberEquity.profitAndSurplusShare, language)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onOpenCollectModal && (
                            <button
                              onClick={() => onOpenCollectModal(member.id, 'savings', undefined, member.monthlySavingsCommitment)}
                              className="px-2 py-1 text-[11px] font-bold bg-emerald-800 text-white rounded hover:bg-emerald-700 transition-colors cursor-pointer"
                              title={language === 'bn' ? 'কিস্তি জমা নিন' : 'Collect Kisti'}
                            >
                              {language === 'bn' ? 'জমা' : 'Pay'}
                            </button>
                          )}
                          {onOpenMemberProfile && (
                            <button
                              onClick={() => onOpenMemberProfile(member)}
                              className="px-2 py-1 text-[11px] font-medium bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors cursor-pointer"
                              title={language === 'bn' ? 'প্রোফাইল দেখুন' : 'View Profile'}
                            >
                              {language === 'bn' ? 'প্রোফাইল' : 'Profile'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

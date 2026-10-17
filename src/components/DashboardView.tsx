import React, { useMemo } from 'react';
import { useSomiti } from '../context/SomitiContext';
import { Member, KistiTransaction } from '../types/somiti';
import { formatCurrency, toBengaliNumber } from '../utils/formatters';
import { calculateSomitiMetrics } from '../utils/financialCalculations';
import { Scale } from 'lucide-react';

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

export const DashboardView: React.FC<DashboardViewProps> = () => {
  const {
    members,
    transactions,
    loans,
    projects,
    cashbook,
    language,
  } = useSomiti();

  // Active/billing month for Dashboard metrics
  const currentMonth = useMemo(() => {
    const latestTx = transactions.find((t) => t.type === 'savings');
    return latestTx?.periodMonth || new Date().toISOString().slice(0, 7);
  }, [transactions]);

  // Comprehensive Financial Calculations:
  // 1. Total Asset = (সদস্য সঞ্চয়) + (বিনিয়োগ লাভ) + (জরিমানা/লেট ফি) + অন্যান্য আয়
  // 2. মোট শেয়ার = ১০০ (ফিক্সড)
  // 3. প্রতি শেয়ার ফেস ভ্যালু = Total Asset / 100
  // 4. সদস্য প্রতি শেয়ার = 100 / N
  // 5. সদস্য ইকুইটি = Shares per Member * Per Share Value = Total Asset / N
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

  return (
    <div className="space-y-6">
      {/* 1. Organization Header Info */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Friend Initiative Organization
          </h1>
          <div className="text-xs font-semibold text-emerald-800">
            {language === 'bn'
              ? 'রেজিস্ট্রেশন নং: FIO-7412 · প্রতিষ্ঠার সাল: ২০২৪ (Since 2024)'
              : 'Reg No: FIO-7412 · Since 2024'}
          </div>
          <p className="text-xs text-neutral-500">
            {language === 'bn' ? '📍 সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : '📍 Sitaikunda, Kotalipara, Gopalgonj'}
          </p>
        </div>

        {/* ===================================================================== */}
        {/* 2. TOP SUMMARY CARDS (Placed directly below Header Info) */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-4 border-t border-neutral-100">
          {/* Card 1: মোট সদস্য সঞ্চয় (Total Member Savings) */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              {language === 'bn' ? 'মোট সদস্য সঞ্চয়' : 'TOTAL MEMBER SAVINGS'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-950 mt-1">
              {formatCurrency(metrics.totalMemberSavings, language)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-medium">
              {language === 'bn' ? 'সদস্য মূল আমানত জমা' : 'Members Principal Deposit'}
            </div>
          </div>

          {/* Card 2: বিনিয়োগ থেকে অর্জিত লাভ (Investment Profits) */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              {language === 'bn' ? 'বিনিয়োগ মুনাফা' : 'INVESTMENT PROFITS'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-950 mt-1">
              {formatCurrency(metrics.totalInvestmentProfits, language)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-medium">
              {language === 'bn' ? 'প্রকল্প হতে নগদ লাভ' : 'Net Venture Earnings'}
            </div>
          </div>

          {/* Card 3: মোট জরিমানা ও লেট ফি আদায় (Total Late Fees) */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              {language === 'bn' ? 'মোট লেট ফি' : 'TOTAL LATE FEES'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-950 mt-1">
              {formatCurrency(metrics.totalLateFees, language)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-medium">
              {language === 'bn' ? 'সমিতির প্রশাসনিক আয়' : 'Administrative Revenue'}
            </div>
          </div>

          {/* Card 4: মাসিক কিস্তি আদায় (Monthly Collection) */}
          <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-2xl">
            <div className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
              {language === 'bn' ? 'মাসিক কিস্তি আদায়' : 'MONTHLY COLLECTION'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-neutral-900 mt-1">
              {toBengaliNumber(monthCollectionRate)}%
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center justify-between font-mono">
              <span>{formatCurrency(monthCollected, language)}</span>
              <span>
                ({toBengaliNumber(paidMembersCount)}/{toBengaliNumber(members.length)})
              </span>
            </div>
          </div>

          {/* Card 5: সক্রিয় ঋণ ও বকেয়া (Active Loans & Dues) */}
          <div className="p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-2xl">
            <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              {language === 'bn' ? 'সক্রিয় ঋণ ও বকেয়া' : 'ACTIVE LOANS & DUES'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-950 mt-1">
              {formatCurrency(metrics.totalOutstandingLoanDues, language)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              {language === 'bn'
                ? `বিতরণ: ${formatCurrency(metrics.totalActiveLoansDisbursed, language)}`
                : `Disbursed: ${formatCurrency(metrics.totalActiveLoansDisbursed, language)}`}
            </div>
          </div>

          {/* Card 6: ক্যাশিয়ারের কাছে নগদ (Cash In Hand) */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-2xl">
            <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
              {language === 'bn' ? 'ক্যাশ ইন হ্যান্ড' : 'CASH IN HAND'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-blue-950 mt-1">
              {formatCurrency(metrics.cashInHand, language)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-medium">
              {language === 'bn' ? 'দৈনিক নগদ ক্যাশ ভল্ট' : 'Liquid Drawer Vault'}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. LIVE VALUATION MODEL (Re-ordered to the bottom) */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-medium text-emerald-200">
          <span className="inline-flex items-center gap-1.5 bg-emerald-800/70 border border-emerald-600/60 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider self-start">
            <Scale className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'লাইভ ভ্যালুয়েশন মডেল' : 'LIVE VALUATION MODEL'}</span>
          </span>
          <span className="text-emerald-200/90 text-xs">
            {language === 'bn' ? 'ফিক্সড ১০০টি শেয়ার বণ্টন নীতি' : 'Fixed 100 Shares Equal Ratio'}
          </span>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
            {formatCurrency(metrics.totalAssets, language)}
          </div>
          <p className="text-xs text-emerald-300 mt-0.5 font-medium">
            {language === 'bn' ? '(সমিতির সর্বমোট সম্পত্তি)' : '(Total Organization Assets)'}
          </p>
          <div className="text-[11px] text-emerald-200/90 font-sans flex flex-wrap items-center gap-1.5 pt-2">
            <span className="font-semibold text-emerald-300">
              {language === 'bn' ? 'গাণিতিক সমীকরণ:' : 'Formula:'}
            </span>
            <span className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-700/50 font-mono">
              {language === 'bn' ? 'সদস্য সঞ্চয়' : 'Savings'} ({formatCurrency(metrics.totalMemberSavings, language)})
            </span>
            <span>+</span>
            <span className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-700/50 font-mono">
              {language === 'bn' ? 'বিনিয়োগ লাভ' : 'Profit'} ({formatCurrency(metrics.totalInvestmentProfits, language)})
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

        {/* 3 Pillar Valuation Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Pillar 1: Face Value / Share */}
          <div className="bg-emerald-800/50 border border-emerald-700/50 p-4 rounded-2xl">
            <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">
              {language === 'bn' ? 'প্রতি শেয়ার ফেস ভ্যালু' : 'FACE VALUE / SHARE'}
            </p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {formatCurrency(metrics.faceValuePerShare, language)}
            </p>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">
              {language === 'bn' ? 'মোট ১০০টি ফিক্সড শেয়ার' : 'Total 100 Fixed Shares'}
            </p>
          </div>

          {/* Pillar 2: Shares / Member */}
          <div className="bg-emerald-800/50 border border-emerald-700/50 p-4 rounded-2xl">
            <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">
              {language === 'bn' ? 'সদস্য প্রতি শেয়ার' : 'SHARES / MEMBER'}
            </p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {toBengaliNumber(metrics.sharesPerMember)} {language === 'bn' ? 'টি' : 'Shares'}
            </p>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">
              {language === 'bn'
                ? `১০০ ÷ ${toBengaliNumber(members.length)} জন সদস্য`
                : `100 ÷ ${members.length} Members`}
            </p>
          </div>

          {/* Pillar 3: Member Equity Valuation */}
          <div className="bg-emerald-800/50 border border-emerald-700/50 p-4 rounded-2xl">
            <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">
              {language === 'bn' ? 'সদস্য প্রতি সম্পদ মূল্য' : 'MEMBER EQUITY VALUATION'}
            </p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {formatCurrency(metrics.equityPerMember, language)}
            </p>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">
              {language === 'bn' ? 'শেয়ার × প্রতি শেয়ার মূল্য' : 'Shares × Face Value'}
            </p>
          </div>
        </div>
      </div>

      {/* Clean Single Footer with Proper Spacing */}
      <footer className="mt-8 mb-6 text-center text-xs text-gray-500 space-y-1">
        <p className="font-medium">
          © 2026 Friend Initiative Organization · Reg: FIO-7412/2021
        </p>
        <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
          <span>📍</span> Sitaikunda, Kotalipara, Gopalgonj
        </p>
      </footer>
    </div>
  );
};

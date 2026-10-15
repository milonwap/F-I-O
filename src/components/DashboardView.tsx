import React, { useState } from 'react';
import { useSomiti } from '../context/SomitiContext';
import { Member, KistiTransaction } from '../types/somiti';
import { formatCurrency, toBengaliNumber } from '../utils/formatters';

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
  const { members, transactions, loans, cashbook, language } = useSomiti();

  // Active/billing month for Dashboard metrics
  const [selectedDashboardMonth] = useState<string>(() => {
    const latestTx = transactions.find((t) => t.type === 'savings');
    return latestTx?.periodMonth || new Date().toISOString().slice(0, 7);
  });
  const currentMonth = selectedDashboardMonth;

  // Financial Computations
  const totalMemberSavings = members.reduce((sum, m) => sum + (m.totalSavingsDeposited || 0), 0);
  const totalLateFeesCollected = transactions.reduce((sum, t) => sum + (t.fineAmount || 0), 0);
  const totalSharesValue = members.reduce((sum, m) => sum + m.shareCount * m.shareFaceValue, 0);
  const totalActiveLoansDisbursed = loans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + l.principalAmount, 0);
  const totalOutstandingLoanDues = loans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  // Cashier Cash In Hand
  const totalInflow = cashbook.filter((e) => e.type === 'inflow').reduce((sum, e) => sum + e.amount, 0);
  const totalOutflow = cashbook.filter((e) => e.type === 'outflow').reduce((sum, e) => sum + e.amount, 0);
  const cashInHand = Math.max(0, totalInflow - totalOutflow);

  // Monthly Kisti Collection metrics
  const currentMonthTxs = transactions.filter((t) => t.periodMonth === currentMonth && t.type === 'savings');
  const monthTarget = members.reduce((sum, m) => sum + m.monthlySavingsCommitment, 0);
  const monthCollected = currentMonthTxs.reduce((sum, t) => sum + t.amount, 0);
  const monthCollectionRate = monthTarget > 0 ? Math.round((monthCollected / monthTarget) * 100) : 0;
  const paidMembersCount = new Set(currentMonthTxs.map((t) => t.memberId)).size;

  const cashierMember = members.find((m) => m.role === 'cashier' || m.role === 'lead_executive') || members[0];

  return (
    <div className="space-y-6">
      {/* Organization Welcome Header & Primary Stat Cards */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Friend Initiative Organization
          </h1>
          <div className="text-xs font-semibold text-emerald-800 mt-0.5">
            {language === 'bn' ? 'রেজিস্ট্রেশন নং: FIO-7412 · প্রতিষ্ঠার সাল: ২০২৪ (Since 2024)' : 'Reg No: FIO-7412 · Since 2024'}
          </div>
          <p className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-neutral-700">
              {language === 'bn' ? '📍 সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : '📍 Sitaikunda, Kotalipara, Gopalgonj'}
            </span>
            <span>·</span>
            <span>
              {language === 'bn' ? 'মোট নিবন্ধিত সদস্য:' : 'Registered Members:'}{' '}
              <strong className="text-neutral-800 font-mono font-bold">{toBengaliNumber(members.length)} জন</strong>
            </span>
            <span>·</span>
            <span>
              {language === 'bn' ? 'দায়িত্বপ্রাপ্ত ক্যাশিয়ার:' : 'Active Cashier:'}{' '}
              <strong className="text-neutral-800">{language === 'bn' ? cashierMember?.nameBn : cashierMember?.nameEn}</strong>
            </span>
          </p>
        </div>

        {/* Primary Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-neutral-100">
          {/* Card 1: মোট সদস্য সঞ্চয় (Total Member Savings) */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {language === 'bn' ? 'মোট সদস্য সঞ্চয়' : 'Total Member Savings'}
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-emerald-900 mt-1">
              {formatCurrency(totalMemberSavings, language)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              {language === 'bn' ? 'শেয়ার মূলধন:' : 'Share Capital:'} {formatCurrency(totalSharesValue, language)}
            </div>
          </div>

          {/* Card 2: মোট জরিমানা ও লেট ফি আদায় (Total Late Fees Collected) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              {language === 'bn' ? 'মোট জরিমানা ও লেট ফি আদায়' : 'Total Late Fees Collected'}
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-amber-950 mt-1">
              {formatCurrency(totalLateFeesCollected, language)}
            </div>
            <div className="text-[11px] text-amber-800 mt-1 font-medium">
              {language === 'bn' ? 'সমিতির প্রশাসনিক আয়' : 'Administrative Revenue'}
            </div>
          </div>

          {/* Card 3: মাসিক কিস্তি আদায় (Monthly Kisti Collection) */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {language === 'bn' ? 'মাসিক কিস্তি আদায়' : 'Monthly Kisti Collection'}
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
              {toBengaliNumber(monthCollectionRate)}%
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
              <span>{formatCurrency(monthCollected, language)}</span>
              <span>
                ({toBengaliNumber(paidMembersCount)}/{toBengaliNumber(members.length)})
              </span>
            </div>
          </div>

          {/* Card 4: সক্রিয় ঋণ ও বকেয়া (Active Loans & Dues) */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {language === 'bn' ? 'সক্রিয় ঋণ ও বকেয়া' : 'Active Loans & Dues'}
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-700 mt-1">
              {formatCurrency(totalOutstandingLoanDues, language)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {language === 'bn'
                ? `বিতরণকৃত মোট: ${formatCurrency(totalActiveLoansDisbursed, language)}`
                : `Disbursed: ${formatCurrency(totalActiveLoansDisbursed, language)}`}
            </div>
          </div>

          {/* Card 5: ক্যাশিয়ারের কাছে নগদ (Cash in Hand) */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl col-span-2 md:col-span-1">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {language === 'bn' ? 'ক্যাশিয়ারের কাছে নগদ' : 'Cash in Hand (Drawer)'}
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
              {formatCurrency(cashInHand, language)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {language === 'bn' ? 'দৈনিক ক্যাশ ড্রয়ার ব্যালেন্স' : 'Current liquid vault balance'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

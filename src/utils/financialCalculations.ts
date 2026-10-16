import { Member, KistiTransaction, Loan, Project, CashbookEntry } from '../types/somiti';

export interface SomitiFinancialMetrics {
  totalMemberSavings: number;
  totalInvestmentProfits: number;
  totalLateFees: number;
  otherIncome: number;
  totalAssets: number;
  totalFixedShares: number; // 100 (Fixed)
  sharesPerMember: number; // 100 / N
  faceValuePerShare: number; // Total Asset / 100
  memberCount: number;
  equityPerMember: number; // Total Asset / N
  surplusPerMember: number; // (Investment Profit + Late Fees + Other Income) / N
  cashInHand: number;
  totalActiveLoansDisbursed: number;
  totalOutstandingLoanDues: number;
}

export interface MemberFinancialEquity {
  memberId: string;
  memberNo: string;
  nameBn: string;
  nameEn: string;
  sharesCount: number; // 100 / N
  faceValuePerShare: number; // Total Asset / 100
  totalEquityValue: number; // sharesCount * faceValuePerShare
  totalSavingsDeposited: number;
  profitAndSurplusShare: number;
  monthlyCommitment: number;
}

/**
 * Calculate authoritative financial metrics and share valuation based on somiti rules:
 * 1. Total Asset = (সকল মেম্বারের মোট সঞ্চয়) + (ইনভেস্টমেন্ট থেকে অর্জিত মোট লাভ) + (মোট জরিমানা/লেট ফি) + অন্যান্য আয়
 * 2. সমিতির মোট শেয়ার সংখ্যা = ১০০ (ফিক্সড)।
 * 3. প্রতি শেয়ারের ফেস ভ্যালু (Face Value per Share) = Total Asset / 100
 * 4. মেম্বার প্রতি শেয়ার (Shares per Member) = 100 / N
 * 5. প্রতি মেম্বারের সম্পত্তির মূল্য (Member Share & Equity) = Shares per Member × Per Share Value = Total Asset / N
 */
export function calculateSomitiMetrics(params: {
  members: Member[];
  transactions: KistiTransaction[];
  loans: Loan[];
  projects: Project[];
  cashbook: CashbookEntry[];
}): SomitiFinancialMetrics {
  const { members = [], transactions = [], loans = [], projects = [], cashbook = [] } = params;

  // 1. Total Member Savings
  const totalMemberSavings = members.reduce(
    (sum, m) => sum + (Number(m.totalSavingsDeposited) || 0),
    0
  );

  // 2. Total Investment Profit Earned across active & completed projects
  const totalInvestmentProfits = projects.reduce(
    (sum, p) => sum + (Number(p.totalProfit) || 0),
    0
  );

  // 3. Total Late Fees / Fines Collected (Administrative revenue pool)
  const totalLateFees = transactions.reduce(
    (sum, t) => sum + (Number(t.fineAmount) || 0),
    0
  );

  // 4. Other Inflow Income from Cashbook (excluding kisti collection and profit vouchers to prevent double counting)
  const otherIncome = cashbook
    .filter((e) => e.type === 'inflow' && e.category === 'other' && !e.relatedProjectId)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Equation: Total Asset = (সকল মেম্বারের মোট সঞ্চয়) + (ইনভেস্টমেন্ট থেকে অর্জিত মোট লাভ) + (মোট জরিমানা/লেট ফি) + অন্যান্য আয়
  const totalAssets = totalMemberSavings + totalInvestmentProfits + totalLateFees + otherIncome;

  // Total Fixed Shares = 100
  const totalFixedShares = 100;
  const memberCount = Math.max(1, members.length);

  // Shares per Member = 100 / N
  const sharesPerMember = Number((totalFixedShares / memberCount).toFixed(2));

  // Face Value per Share = Total Asset / 100
  const faceValuePerShare = totalFixedShares > 0 ? totalAssets / totalFixedShares : 0;

  // Equity per Member = Total Asset / N (or sharesPerMember * faceValuePerShare)
  const equityPerMember = memberCount > 0 ? totalAssets / memberCount : 0;

  // Surplus per Member = (totalInvestmentProfits + totalLateFees + otherIncome) / memberCount
  const surplusPerMember = memberCount > 0
    ? (totalInvestmentProfits + totalLateFees + otherIncome) / memberCount
    : 0;

  // Cash In Hand
  const totalInflow = cashbook
    .filter((e) => e.type === 'inflow')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalOutflow = cashbook
    .filter((e) => e.type === 'outflow')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const cashInHand = Math.max(0, totalInflow - totalOutflow);

  // Loans
  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalActiveLoansDisbursed = activeLoans.reduce(
    (sum, l) => sum + (Number(l.principalAmount) || 0),
    0
  );
  const totalOutstandingLoanDues = activeLoans.reduce(
    (sum, l) => sum + (Number(l.remainingAmount) || 0),
    0
  );

  return {
    totalMemberSavings,
    totalInvestmentProfits,
    totalLateFees,
    otherIncome,
    totalAssets,
    totalFixedShares,
    sharesPerMember,
    faceValuePerShare,
    memberCount: members.length,
    equityPerMember,
    surplusPerMember,
    cashInHand,
    totalActiveLoansDisbursed,
    totalOutstandingLoanDues,
  };
}

/**
 * Calculate a single member's financial equity and share valuation
 */
export function calculateMemberEquity(
  member: Member,
  metrics: SomitiFinancialMetrics
): MemberFinancialEquity {
  const sharesCount = metrics.sharesPerMember;
  const faceValuePerShare = metrics.faceValuePerShare;
  const totalEquityValue = sharesCount * faceValuePerShare;
  const profitAndSurplusShare = metrics.surplusPerMember;

  return {
    memberId: member.id,
    memberNo: member.memberNo,
    nameBn: member.nameBn,
    nameEn: member.nameEn,
    sharesCount,
    faceValuePerShare,
    totalEquityValue,
    totalSavingsDeposited: member.totalSavingsDeposited || 0,
    profitAndSurplusShare,
    monthlyCommitment: member.monthlySavingsCommitment || 0,
  };
}

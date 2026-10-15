import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  RotateCcw,
  ShieldCheck,
  Building,
  TrendingUp,
  Receipt,
  Users,
  Percent,
  Award,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  UserPlus,
  Search,
  Clock,
  Filter,
  ArrowUpDown,
  CalendarDays,
  ExternalLink,
  Wallet,
  CheckCircle2,
  DollarSign,
  User,
  Sliders,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { Member, KistiTransaction, Language } from '../types/somiti';
import { formatCurrency, formatDate, formatDateDMY, toBengaliNumber } from '../utils/formatters';
import { MemberAvatar } from './MemberAvatar';
import { DateInput } from './DateInput';

interface AuditActivity {
  id: string;
  date: string;
  category: 'deposit' | 'withdrawal' | 'profile_update' | 'expense' | 'loan';
  titleBn: string;
  titleEn: string;
  amount?: number;
  referenceNo: string;
  actor: string;
}

interface ReportsViewProps {
  onOpenReceipt?: (tx: KistiTransaction) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenReceipt }) => {
  const { members, transactions, loans, projects, cashbook, resetDemoData, language } = useSomiti();

  // Top level active sub-tab: 'member_statement' | 'somiti_statement' | 'audit_balance_sheet'
  const [statementSubTab, setStatementSubTab] = useState<'member_statement' | 'somiti_statement' | 'audit_balance_sheet'>('member_statement');

  // ==========================================
  // TAB 1: INDIVIDUAL MEMBER & ALL MEMBERS STATEMENT STATE
  // ==========================================
  const [memberViewMode, setMemberViewMode] = useState<'single' | 'all_summary'>('single');
  const [allMembersSearch, setAllMembersSearch] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => members[0]?.id || '');
  const [memberStartDate, setMemberStartDate] = useState<string>('');
  const [memberEndDate, setMemberEndDate] = useState<string>('');
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>('all');
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');
  const [memberSortOrder, setMemberSortOrder] = useState<'desc' | 'asc'>('desc');

  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || members[0];
  }, [members, selectedMemberId]);

  const memberTransactions = useMemo(() => {
    if (!selectedMember) return [];
    return transactions
      .filter((tx) => tx.memberId === selectedMember.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMember]);

  const filteredMemberTxs = useMemo(() => {
    return memberTransactions.filter((tx) => {
      if (memberStartDate && tx.date < memberStartDate) return false;
      if (memberEndDate && tx.date > memberEndDate) return false;
      if (memberTypeFilter !== 'all' && tx.type !== memberTypeFilter) return false;
      if (memberSearchQuery.trim()) {
        const q = memberSearchQuery.trim().toLowerCase();
        const matchReceipt = tx.receiptNo.toLowerCase().includes(q);
        const matchMonth = (tx.periodMonth || '').toLowerCase().includes(q);
        const matchRemarks = (tx.remarks || '').toLowerCase().includes(q);
        const matchAmount = String(tx.amount).includes(q);
        if (!matchReceipt && !matchMonth && !matchRemarks && !matchAmount) return false;
      }
      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return memberSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [memberTransactions, memberStartDate, memberEndDate, memberTypeFilter, memberSearchQuery, memberSortOrder]);

  const memberTotalCredit = useMemo(() => filteredMemberTxs.reduce((sum, tx) => sum + tx.amount, 0), [filteredMemberTxs]);
  const memberSavingsCredit = useMemo(() => filteredMemberTxs.filter((t) => t.type === 'savings').reduce((sum, tx) => sum + tx.amount, 0), [filteredMemberTxs]);
  const memberLoanCredit = useMemo(() => filteredMemberTxs.filter((t) => t.type === 'loan_repayment').reduce((sum, tx) => sum + tx.amount, 0), [filteredMemberTxs]);

  const handleSetMemberDatePreset = (preset: 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year') => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (preset === 'all') {
      setMemberStartDate('');
      setMemberEndDate('');
    } else if (preset === 'this_month') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      setMemberStartDate(`${year}-${month}-01`);
      setMemberEndDate(todayStr);
    } else if (preset === 'last_month') {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthNum = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      setMemberStartDate(`${lastMonthYear}-${lastMonthNum}-01`);
      setMemberEndDate(`${lastMonthYear}-${lastMonthNum}-${lastDayOfLastMonth}`);
    } else if (preset === 'last_3_months') {
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      setMemberStartDate(threeMonthsAgo.toISOString().slice(0, 10));
      setMemberEndDate(todayStr);
    } else if (preset === 'this_year') {
      setMemberStartDate(`${today.getFullYear()}-01-01`);
      setMemberEndDate(todayStr);
    }
  };

  const handleExportSelectedMemberCSV = () => {
    if (!selectedMember) return;
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += `=== STATEMENT FOR ${selectedMember.nameEn.toUpperCase()} (${selectedMember.memberNo}) ===\n`;
    csv += `Phone,${selectedMember.phone}\n`;
    csv += `Date Range,${memberStartDate || 'All'} to ${memberEndDate || 'All'}\n`;
    csv += `Total Transactions,${filteredMemberTxs.length}\n`;
    csv += `Total Deposited (BDT),${memberTotalCredit}\n\n`;
    csv += "Date (DD/MM/YYYY),Receipt No,Type,Period Month,Amount (BDT),Payment Method,Collected By,Remarks\n";
    filteredMemberTxs.forEach((tx) => {
      csv += `"${formatDateDMY(tx.date)}","${tx.receiptNo}","${tx.type}","${tx.periodMonth || ''}",${tx.amount},"${tx.paymentMethod}","${tx.collectedBy}","${tx.remarks || ''}"\n`;
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `statement_${selectedMember.memberNo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allMembersStatementSummaries = useMemo(() => {
    return members.map((m) => {
      const mTx = transactions.filter((t) => t.memberId === m.id);
      const totalSavings = mTx.filter((t) => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
      const totalLoanPaid = mTx.filter((t) => t.type === 'loan_repayment').reduce((sum, t) => sum + t.amount, 0);
      const totalOverall = mTx.reduce((sum, t) => sum + t.amount, 0);
      const activeLoan = loans.find((l) => l.memberId === m.id && l.status === 'active');
      const sortedTx = [...mTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastTx = sortedTx[0] || null;

      return {
        member: m,
        totalSavings,
        totalLoanPaid,
        totalOverall,
        activeLoanRemaining: activeLoan ? activeLoan.remainingAmount : 0,
        txCount: mTx.length,
        lastTxDate: lastTx ? lastTx.date : m.joinDate,
        lastReceipt: lastTx ? lastTx.receiptNo : '-',
      };
    });
  }, [members, transactions, loans]);

  const filteredAllMembersSummaries = useMemo(() => {
    if (!allMembersSearch.trim()) return allMembersStatementSummaries;
    const q = allMembersSearch.trim().toLowerCase();
    return allMembersStatementSummaries.filter((item) => {
      return (
        item.member.nameEn.toLowerCase().includes(q) ||
        item.member.nameBn.includes(q) ||
        item.member.memberNo.toLowerCase().includes(q) ||
        item.member.phone.includes(q)
      );
    });
  }, [allMembersStatementSummaries, allMembersSearch]);

  const handleExportAllMembersSummaryCSV = () => {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += "=== FRIEND INITIATIVE ORGANIZATION - ALL MEMBERS STATEMENT SUMMARY ===\n";
    csv += `Export Date,${new Date().toISOString().slice(0, 10)}\n`;
    csv += `Total Members,${members.length}\n\n`;
    csv += "Member No,Member Name,Phone,Share Count,Total Savings Deposited (BDT),Total Loan Repayments (BDT),Active Loan Balance (BDT),Total Transactions,Last Tx Date\n";
    filteredAllMembersSummaries.forEach((row) => {
      csv += `"${row.member.memberNo}","${row.member.nameEn}","${row.member.phone}",${row.member.shareCount},${row.totalSavings},${row.totalLoanPaid},${row.activeLoanRemaining},${row.txCount},"${formatDateDMY(row.lastTxDate)}"\n`;
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `all_members_statement_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // TAB 2: FULL SOMITI STATEMENT STATE
  // ==========================================
  const [somitiStartDate, setSomitiStartDate] = useState<string>('');
  const [somitiEndDate, setSomitiEndDate] = useState<string>('');
  const [somitiCategoryFilter, setSomitiCategoryFilter] = useState<'all' | 'inflow' | 'outflow' | 'savings' | 'loan_repayment' | 'expense'>('all');
  const [somitiSearchQuery, setSomitiSearchQuery] = useState<string>('');
  const [somitiSortOrder, setSomitiSortOrder] = useState<'desc' | 'asc'>('desc');

  // Combined master financial records: transactions (inflow) + cashbook entries
  interface MasterLedgerItem {
    id: string;
    date: string;
    refNo: string;
    flowType: 'inflow' | 'outflow';
    categoryLabel: string;
    title: string;
    partyName: string;
    amount: number;
    paymentMethod: string;
    operator: string;
    rawTx?: KistiTransaction;
  }

  const masterLedgerItems = useMemo<MasterLedgerItem[]>(() => {
    const list: MasterLedgerItem[] = [];

    // All Member Deposit Transactions (Inflows)
    transactions.forEach((tx) => {
      const mem = members.find((m) => m.id === tx.memberId);
      const party = mem ? `${mem.nameBn} (${mem.memberNo})` : tx.memberId;
      const catLabel = tx.type === 'savings' ? 'নিয়মিত সঞ্চয় জমা' : tx.type === 'loan_repayment' ? 'ঋণ কিস্তি পরিশোধ' : tx.type === 'project_share' ? 'প্রকল্প চাঁদা' : 'ফি / অন্যান্য জমা';
      list.push({
        id: `tx-${tx.id}`,
        date: tx.date,
        refNo: tx.receiptNo,
        flowType: 'inflow',
        categoryLabel: catLabel,
        title: `${catLabel} - ${tx.periodMonth || ''}`,
        partyName: party,
        amount: tx.amount,
        paymentMethod: tx.paymentMethod,
        operator: tx.collectedBy || 'Cashier',
        rawTx: tx,
      });
    });

    // Cashbook entries (Inflow & Outflows: loans disbursed, office expenses, profits, etc.)
    cashbook.forEach((cb) => {
      list.push({
        id: `cb-${cb.id}`,
        date: cb.date,
        refNo: cb.voucherNo,
        flowType: cb.type,
        categoryLabel: cb.category,
        title: cb.title,
        partyName: cb.notes || 'সমিতি সাধারণ তহবিল',
        amount: cb.amount,
        paymentMethod: cb.paymentMethod,
        operator: cb.recordedByCashier || 'Cashier',
      });
    });

    return list;
  }, [transactions, members, cashbook]);

  const filteredMasterLedger = useMemo(() => {
    return masterLedgerItems.filter((item) => {
      if (somitiStartDate && item.date < somitiStartDate) return false;
      if (somitiEndDate && item.date > somitiEndDate) return false;
      if (somitiCategoryFilter === 'inflow' && item.flowType !== 'inflow') return false;
      if (somitiCategoryFilter === 'outflow' && item.flowType !== 'outflow') return false;
      if (somitiCategoryFilter === 'savings' && !item.categoryLabel.includes('সঞ্চয়')) return false;
      if (somitiCategoryFilter === 'loan_repayment' && !item.categoryLabel.includes('ঋণ কিস্তি')) return false;
      if (somitiCategoryFilter === 'expense' && item.flowType !== 'outflow') return false;

      if (somitiSearchQuery.trim()) {
        const q = somitiSearchQuery.trim().toLowerCase();
        const mRef = item.refNo.toLowerCase().includes(q);
        const mTitle = item.title.toLowerCase().includes(q);
        const mParty = item.partyName.toLowerCase().includes(q);
        const mOp = item.operator.toLowerCase().includes(q);
        const mAmount = String(item.amount).includes(q);
        if (!mRef && !mTitle && !mParty && !mOp && !mAmount) return false;
      }
      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return somitiSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [masterLedgerItems, somitiStartDate, somitiEndDate, somitiCategoryFilter, somitiSearchQuery, somitiSortOrder]);

  const somitiFilteredInflow = useMemo(() => {
    return filteredMasterLedger.filter((i) => i.flowType === 'inflow').reduce((sum, i) => sum + i.amount, 0);
  }, [filteredMasterLedger]);

  const somitiFilteredOutflow = useMemo(() => {
    return filteredMasterLedger.filter((i) => i.flowType === 'outflow').reduce((sum, i) => sum + i.amount, 0);
  }, [filteredMasterLedger]);

  const somitiNetBalance = somitiFilteredInflow - somitiFilteredOutflow;

  const handleSetSomitiDatePreset = (preset: 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year') => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (preset === 'all') {
      setSomitiStartDate('');
      setSomitiEndDate('');
    } else if (preset === 'this_month') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      setSomitiStartDate(`${year}-${month}-01`);
      setSomitiEndDate(todayStr);
    } else if (preset === 'last_month') {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthNum = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      setSomitiStartDate(`${lastMonthYear}-${lastMonthNum}-01`);
      setSomitiEndDate(`${lastMonthYear}-${lastMonthNum}-${lastDayOfLastMonth}`);
    } else if (preset === 'last_3_months') {
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      setSomitiStartDate(threeMonthsAgo.toISOString().slice(0, 10));
      setSomitiEndDate(todayStr);
    } else if (preset === 'this_year') {
      setSomitiStartDate(`${today.getFullYear()}-01-01`);
      setSomitiEndDate(todayStr);
    }
  };

  const handleExportSomitiMasterCSV = () => {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += "=== FRIEND INITIATIVE ORGANIZATION - FULL CENTRAL FINANCIAL STATEMENT ===\n";
    csv += `Date Range,${somitiStartDate || 'All'} to ${somitiEndDate || 'All'}\n`;
    csv += `Total Inflow (BDT),${somitiFilteredInflow}\n`;
    csv += `Total Outflow (BDT),${somitiFilteredOutflow}\n`;
    csv += `Net Period Surplus (BDT),${somitiNetBalance}\n\n`;
    csv += "Date (DD/MM/YYYY),Ref No,Flow Type,Category,Title/Description,Party/Member,Amount (BDT),Payment Method,Operator\n";
    filteredMasterLedger.forEach((item) => {
      csv += `"${formatDateDMY(item.date)}","${item.refNo}","${item.flowType.toUpperCase()}","${item.categoryLabel}","${item.title.replace(/"/g, '""')}","${item.partyName.replace(/"/g, '""')}",${item.amount},"${item.paymentMethod}","${item.operator}"\n`;
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `somiti_full_statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // TAB 3: AUDIT & BALANCE SHEET CALCULATIONS
  // ==========================================
  const [dividendPool, setDividendPool] = useState<number>(150000);
  const [activityFilter, setActivityFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'profile'>('all');
  const [activitySearch, setActivitySearch] = useState<string>('');

  const totalSavings = members.reduce((sum, m) => sum + (m.totalSavingsDeposited || 0), 0);
  const totalSharesValue = members.reduce((sum, m) => sum + m.shareCount * m.shareFaceValue, 0);
  const totalLoanReceivable = loans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalProjectCapital = projects.reduce((sum, p) => sum + p.collectedCapital, 0);
  const totalProjectExpenses = projects.reduce((sum, p) => sum + p.totalExpenses, 0);

  const totalInflow = cashbook.filter((e) => e.type === 'inflow').reduce((sum, e) => sum + e.amount, 0);
  const totalOutflow = cashbook.filter((e) => e.type === 'outflow').reduce((sum, e) => sum + e.amount, 0);
  const cashInHand = Math.max(0, totalInflow - totalOutflow);

  const totalAssets = cashInHand + totalLoanReceivable + (totalProjectCapital - totalProjectExpenses) + 245000;
  const memberCount = members.length > 0 ? members.length : 1;
  const equalDividendPerMember = dividendPool / memberCount;

  // Activities for audit trail
  const activities: AuditActivity[] = [];
  transactions.forEach((t) => {
    const mem = members.find((m) => m.id === t.memberId);
    const memName = mem ? (language === 'bn' ? mem.nameBn : mem.nameEn) : 'Member';
    activities.push({
      id: `tx-${t.id}`,
      date: t.date,
      category: 'deposit',
      titleBn: `সঞ্চয়/কিস্তি জমা: ${memName} (${t.type})`,
      titleEn: `Deposit/Kisti Collected: ${memName} (${t.type})`,
      amount: t.amount,
      referenceNo: t.receiptNo,
      actor: t.collectedBy || 'Cashier',
    });
  });

  cashbook.forEach((c) => {
    if (c.type === 'outflow') {
      activities.push({
        id: `cb-${c.id}`,
        date: c.date,
        category: 'withdrawal',
        titleBn: `অর্থ উত্তোলন/খরচ: ${c.title}`,
        titleEn: `Withdrawal/Expense: ${c.title}`,
        amount: c.amount,
        referenceNo: c.voucherNo,
        actor: c.recordedByCashier || 'Cashier',
      });
    }
  });

  members.forEach((m) => {
    activities.push({
      id: `mem-${m.id}`,
      date: m.joinDate || '2024-01-01',
      category: 'profile_update',
      titleBn: `নতুন সদস্য নিবন্ধন ও প্রোফাইল: ${m.nameBn}`,
      titleEn: `Member Registration & Profile: ${m.nameEn}`,
      referenceNo: m.memberNo,
      actor: 'Admin / System',
    });
  });

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredActivities = activities.filter((act) => {
    const matchesFilter =
      activityFilter === 'all' ||
      (activityFilter === 'deposit' && act.category === 'deposit') ||
      (activityFilter === 'withdrawal' && act.category === 'withdrawal') ||
      (activityFilter === 'profile' && act.category === 'profile_update');

    const matchesSearch =
      act.titleEn.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.titleBn.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.referenceNo.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.actor.toLowerCase().includes(activitySearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Main Statement Header Banner */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-800 text-white shadow-xs">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  {language === 'bn' ? 'আর্থিক স্টেটমেন্ট ও অডিট সেন্টার' : 'Financial Statement & Audit Center'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  {language === 'bn' ? 'ক্যাশিয়ার ও অ্যাডমিন' : 'Admin & Cashier'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {language === 'bn'
                  ? 'সকল সদস্যের ব্যক্তিগত স্টেটমেন্ট, সমিতির সার্বিক লেনদেন এবং ব্যালেন্স শিট যাচাইকরণ।'
                  : 'Individual member statements, centralized somiti financial ledger, and balance sheet.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-300" />
            <span>{language === 'bn' ? 'প্রিন্ট স্টেটমেন্ট' : 'Print Statement'}</span>
          </button>
          <button
            onClick={resetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 hover:text-red-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
            title="Reset initial demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ডাটা রিসেট' : 'Reset Demo'}</span>
          </button>
        </div>
      </div>

      {/* 3 Main View Switcher Tabs */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-1.5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setStatementSubTab('member_statement')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statementSubTab === 'member_statement'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{language === 'bn' ? '১. সকল সদস্যের স্টেটমেন্ট (Member-Wise)' : '1. Member-Wise Statement'}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatementSubTab('somiti_statement')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statementSubTab === 'somiti_statement'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{language === 'bn' ? '২. সমিতির পূর্ণাঙ্গ স্টেটমেন্ট (Full Somiti)' : '2. Full Somiti Statement'}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatementSubTab('audit_balance_sheet')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statementSubTab === 'audit_balance_sheet'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{language === 'bn' ? '৩. স্থিতিপত্র ও অডিট (Balance Sheet)' : '3. Balance Sheet & Audit'}</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: ALL MEMBERS INDIVIDUAL STATEMENT (সদস্যভিত্তিক স্টেটমেন্ট) */}
      {/* ===================================================================== */}
      {statementSubTab === 'member_statement' && (
        <div className="space-y-6">
          {/* Member View Mode Switcher: Single Member vs All Members Matrix */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-2 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMemberViewMode('single')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  memberViewMode === 'single'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'একক সদস্যের পূর্ণ বিবরণী' : 'Single Member Detail'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMemberViewMode('all_summary')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  memberViewMode === 'all_summary'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'সকল সদস্যের সম্মিলিত স্টেটমেন্ট তালিকা' : 'All Members Statement Matrix'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                  {toBengaliNumber(members.length)}
                </span>
              </button>
            </div>

            {memberViewMode === 'all_summary' && (
              <button
                type="button"
                onClick={handleExportAllMembersSummaryCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-emerald-300" />
                <span>{language === 'bn' ? 'সকল সদস্যের CSV' : 'Export All Members CSV'}</span>
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* SUB-VIEW A: SINGLE INDIVIDUAL MEMBER STATEMENT */}
          {/* ======================================================== */}
          {memberViewMode === 'single' && (
            <div className="space-y-6">
              {/* Member Selector Strip */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'bn' ? 'সদস্য নির্বাচন করুন:' : 'Select Member for Statement:'}</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  {language === 'bn'
                    ? 'যেকোনো সদস্যকে নির্বাচন করে তার সম্পূর্ণ ব্যক্তিগত জমা ও কিস্তির তারিখভিত্তিক স্টেটমেন্ট দেখুন।'
                    : 'Select any member to review their isolated personal transaction ledger statement.'}
                </p>
              </div>

              <div className="w-full sm:w-80">
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNo} · {language === 'bn' ? m.nameBn : m.nameEn} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Member Hero Card */}
            {selectedMember && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <MemberAvatar member={selectedMember} sizeClassName="w-12 h-12 text-lg font-bold" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-neutral-900">
                        {language === 'bn' ? selectedMember.nameBn : selectedMember.nameEn}
                      </h4>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        {selectedMember.memberNo}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 flex flex-wrap items-center gap-2 mt-0.5 font-mono">
                      <span>মোবাইল: {selectedMember.phone}</span>
                      <span>·</span>
                      <span>শেয়ার: {toBengaliNumber(selectedMember.shareCount)} টি</span>
                      <span>·</span>
                      <span>মাসিক কিস্তি: ৳{toBengaliNumber(selectedMember.monthlySavingsCommitment)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportSelectedMemberCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{language === 'bn' ? 'সদস্য CSV ডাউনলোড' : 'Download Member CSV'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date Filter & Presets (Date / Month / Year Format) */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Quick Date Range Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-500 mr-1 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {language === 'bn' ? 'তারিখ প্রিসেট:' : 'Date Presets:'}
              </span>
              <button
                type="button"
                onClick={() => handleSetMemberDatePreset('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  !memberStartDate && !memberEndDate ? 'bg-emerald-800 text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {language === 'bn' ? 'সব সময় (All)' : 'All Time'}
              </button>
              <button
                type="button"
                onClick={() => handleSetMemberDatePreset('this_month')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  memberStartDate.startsWith('2026-03') ? 'bg-emerald-800 text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {language === 'bn' ? 'চলতি মাস (This Month)' : 'This Month'}
              </button>
              <button
                type="button"
                onClick={() => handleSetMemberDatePreset('last_month')}
                className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'গত মাস (Last Month)' : 'Last Month'}
              </button>
              <button
                type="button"
                onClick={() => handleSetMemberDatePreset('last_3_months')}
                className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'গত ৩ মাস' : 'Last 3 Months'}
              </button>
              <button
                type="button"
                onClick={() => handleSetMemberDatePreset('this_year')}
                className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'চলতি বছর (This Year)' : 'This Year'}
              </button>
            </div>

            {/* DD / MM / YYYY Date Inputs and Search Grid */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <DateInput
                  label={language === 'bn' ? 'শুরুর তারিখ (From Date)' : 'From Date'}
                  value={memberStartDate}
                  onChange={(val) => setMemberStartDate(val)}
                />
              </div>

              <div>
                <DateInput
                  label={language === 'bn' ? 'শেষের তারিখ (To Date)' : 'To Date'}
                  value={memberEndDate}
                  onChange={(val) => setMemberEndDate(val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {language === 'bn' ? 'লেনদেনের ধরন (Type)' : 'Transaction Type'}
                </label>
                <select
                  value={memberTypeFilter}
                  onChange={(e) => setMemberTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">{language === 'bn' ? 'সকল লেনদেন' : 'All Types'}</option>
                  <option value="savings">{language === 'bn' ? 'নিয়মিত সঞ্চয় জমা' : 'Savings Deposit'}</option>
                  <option value="loan_repayment">{language === 'bn' ? 'ঋণ কিস্তি পরিশোধ' : 'Loan Repayment'}</option>
                  <option value="project_share">{language === 'bn' ? 'প্রকল্প চাঁদা' : 'Project Share'}</option>
                  <option value="fine_fee">{language === 'bn' ? 'ফি / জরিমানা' : 'Fees'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {language === 'bn' ? 'খুঁজুন (Search)' : 'Search'}
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'রসিদ নং, মাস বা পরিমাণ...' : 'Receipt, month...'}
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setMemberSortOrder(memberSortOrder === 'desc' ? 'asc' : 'desc')}
                  className="flex-1 px-3 py-2 text-xs font-semibold bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title={language === 'bn' ? 'তারিখের ক্রমানুসারে সাজান' : 'Sort Date'}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{memberSortOrder === 'desc' ? (language === 'bn' ? 'নতুন আগে' : 'Newest') : (language === 'bn' ? 'পুরানো আগে' : 'Oldest')}</span>
                </button>
                {(memberStartDate || memberEndDate || memberTypeFilter !== 'all' || memberSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberStartDate('');
                      setMemberEndDate('');
                      setMemberTypeFilter('all');
                      setMemberSearchQuery('');
                    }}
                    className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                    title={language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset'}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* KPI Cards for the filtered member statement */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  {language === 'bn' ? 'ফিল্টারকৃত মোট লেনদেন' : 'Filtered Transactions'}
                </span>
                <span className="text-lg font-black text-neutral-900 font-mono mt-0.5 block">
                  {toBengaliNumber(filteredMemberTxs.length)} {language === 'bn' ? 'টি' : 'txns'}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-800 block">
                  {language === 'bn' ? 'মোট সংগৃহীত জমা' : 'Total Deposited'}
                </span>
                <span className="text-lg font-black text-emerald-950 font-mono mt-0.5 block">
                  {formatCurrency(memberTotalCredit, language)}
                </span>
              </div>
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="text-[11px] font-semibold text-blue-800 block">
                  {language === 'bn' ? 'সঞ্চয় কিস্তি জমা' : 'Savings Collections'}
                </span>
                <span className="text-lg font-black text-blue-950 font-mono mt-0.5 block">
                  {formatCurrency(memberSavingsCredit, language)}
                </span>
              </div>
              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200">
                <span className="text-[11px] font-semibold text-rose-800 block">
                  {language === 'bn' ? 'ঋণ কিস্তি পরিশোধ' : 'Loan Repayments'}
                </span>
                <span className="text-lg font-black text-rose-950 font-mono mt-0.5 block">
                  {formatCurrency(memberLoanCredit, language)}
                </span>
              </div>
            </div>

            {/* Member Date-wise Transactions Table */}
            {filteredMemberTxs.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-neutral-200 rounded-xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-neutral-700">
                  {language === 'bn' ? 'এই নির্বাচিত সদস্যের জন্য কোনো লেনদেন পাওয়া যায়নি' : 'No transactions recorded for this member'}
                </p>
                <button
                  type="button"
                  onClick={() => handleSetMemberDatePreset('all')}
                  className="px-4 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {language === 'bn' ? 'সকল লেনদেন দেখুন' : 'Show All Transactions'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="py-3 px-3.5">তারিখ (DD/MM/YYYY)</th>
                      <th className="py-3 px-3.5">রসিদ নং</th>
                      <th className="py-3 px-3.5 font-sans">লেনদেনের খাত</th>
                      <th className="py-3 px-3.5 font-sans">কিস্তির মাস / বিবরণ</th>
                      <th className="py-3 px-3.5 text-center font-sans">পেমেন্ট মাধ্যম</th>
                      <th className="py-3 px-3.5 font-sans">আদায়কারী</th>
                      <th className="py-3 px-3.5 text-right">জমা (৳)</th>
                      <th className="py-3 px-3.5 text-center font-sans">মানি রসিদ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredMemberTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-neutral-900 whitespace-nowrap">
                          {formatDateDMY(tx.date, language)}
                        </td>
                        <td className="py-3 px-3.5 text-emerald-800 font-bold whitespace-nowrap">
                          {tx.receiptNo}
                        </td>
                        <td className="py-3 px-3.5 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'savings'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {tx.type === 'savings'
                              ? (language === 'bn' ? 'নিয়মিত সঞ্চয়' : 'Savings')
                              : (language === 'bn' ? 'ঋণ কিস্তি' : 'Loan Installment')}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-sans text-neutral-700">
                          {tx.periodMonth ? (
                            <span className="font-mono text-neutral-900 font-semibold">{tx.periodMonth}</span>
                          ) : (
                            <span className="text-neutral-500">{tx.remarks || '-'}</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center font-sans uppercase text-[10px] text-neutral-600">
                          <span className="px-1.5 py-0.5 bg-neutral-100 rounded font-bold">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-sans text-neutral-700">
                          {tx.collectedBy}
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-emerald-950 text-sm">
                          {formatCurrency(tx.amount, language)}
                        </td>
                        <td className="py-3 px-3.5 text-center font-sans">
                          {onOpenReceipt && (
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(tx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-neutral-700 border border-neutral-200 rounded transition-colors text-[11px] cursor-pointer shadow-2xs"
                              title={language === 'bn' ? 'ডিজিটাল রসিদ ভাউচার দেখুন' : 'View receipt'}
                            >
                              <ExternalLink className="w-3 h-3 text-emerald-600" />
                              <span>{language === 'bn' ? 'রসিদ' : 'Receipt'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50 border-t-2 border-neutral-200 font-bold">
                    <tr>
                      <td colSpan={6} className="py-3 px-3.5 text-right text-xs text-neutral-700 font-sans">
                        {language === 'bn' ? 'নির্বাচিত সময়ের মোট জমা (Total Deposited):' : 'Total Deposited:'}
                      </td>
                      <td className="py-3 px-3.5 text-right text-base text-emerald-950 font-black">
                        {formatCurrency(memberTotalCredit, language)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-VIEW B: ALL MEMBERS STATEMENT SUMMARY TABLE (ম্যাট্রিক্স) */}
      {/* ======================================================== */}
      {memberViewMode === 'all_summary' && (
        <div className="space-y-6">
          {/* Highlights KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                {language === 'bn' ? 'মোট নিবন্ধিত সদস্য' : 'Total Members'}
              </span>
              <span className="text-xl font-black text-neutral-900 font-mono mt-1 block">
                {toBengaliNumber(members.length)} {language === 'bn' ? 'জন' : 'members'}
              </span>
            </div>
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-emerald-800 block">
                {language === 'bn' ? 'সকল সদস্যের মোট সঞ্চয়' : 'Total Savings Collected'}
              </span>
              <span className="text-xl font-black text-emerald-950 font-mono mt-1 block">
                {formatCurrency(totalSavings, language)}
              </span>
            </div>
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-blue-800 block">
                {language === 'bn' ? 'সকল ঋণ কিস্তি আদায়' : 'Total Loans Repaid'}
              </span>
              <span className="text-xl font-black text-blue-950 font-mono mt-1 block">
                {formatCurrency(
                  transactions.filter((t) => t.type === 'loan_repayment').reduce((s, t) => s + t.amount, 0),
                  language
                )}
              </span>
            </div>
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-rose-800 block">
                {language === 'bn' ? 'মোট বকেয়া ঋণ স্থিতি' : 'Total Loan Receivables'}
              </span>
              <span className="text-xl font-black text-rose-950 font-mono mt-1 block">
                {formatCurrency(totalLoanReceivable, language)}
              </span>
            </div>
          </div>

          {/* Search & Counter Bar */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={language === 'bn' ? 'সদস্যের নাম, আইডি (FIO-...) বা মোবাইল নম্বর দিয়ে খুঁজুন...' : 'Search members by name, ID, phone...'}
                value={allMembersSearch}
                onChange={(e) => setAllMembersSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="text-xs text-neutral-500 font-mono">
              {language === 'bn' ? 'প্রদর্শিত সদস্য:' : 'Showing:'}{' '}
              <strong className="text-neutral-900 font-bold">{toBengaliNumber(filteredAllMembersSummaries.length)}</strong> / {toBengaliNumber(members.length)}
            </div>
          </div>

          {/* All Members Statement Ledger Table */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-3.5 font-sans">সদস্য তথ্য</th>
                    <th className="py-3 px-3.5 font-sans">মোবাইল ও শেয়ার</th>
                    <th className="py-3 px-3.5 text-right font-sans">মোট সঞ্চয় জমা (৳)</th>
                    <th className="py-3 px-3.5 text-right font-sans">ঋণ কিস্তি আদায় (৳)</th>
                    <th className="py-3 px-3.5 text-right font-sans">সক্রিয় ঋণ স্থিতি (৳)</th>
                    <th className="py-3 px-3.5 text-center font-sans">মোট লেনদেন</th>
                    <th className="py-3 px-3.5 font-sans">সর্বশেষ লেনদেন</th>
                    <th className="py-3 px-3.5 text-center font-sans">স্টেটমেন্ট অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredAllMembersSummaries.map((row) => (
                    <tr key={row.member.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-sans">
                        <div className="flex items-center gap-3">
                          <MemberAvatar member={row.member} sizeClassName="w-8 h-8 text-xs font-bold" />
                          <div>
                            <div className="font-bold text-neutral-900">
                              {language === 'bn' ? row.member.nameBn : row.member.nameEn}
                            </div>
                            <div className="text-[11px] font-mono font-bold text-emerald-800">
                              {row.member.memberNo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-sans text-neutral-700">
                        <div>{row.member.phone}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          {toBengaliNumber(row.member.shareCount)} {language === 'bn' ? 'টি শেয়ার' : 'shares'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-emerald-900 text-sm">
                        {formatCurrency(row.totalSavings, language)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-blue-900 text-sm">
                        {formatCurrency(row.totalLoanPaid, language)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-rose-900 text-sm">
                        {row.activeLoanRemaining > 0 ? formatCurrency(row.activeLoanRemaining, language) : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-neutral-800">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-mono">
                          {toBengaliNumber(row.txCount)}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-neutral-700 text-[11px]">
                        {row.lastTxDate ? formatDateDMY(row.lastTxDate, language) : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberId(row.member.id);
                            setMemberViewMode('single');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                          title={language === 'bn' ? 'এই সদস্যের বিস্তারিত তারিখভিত্তিক স্টেটমেন্ট দেখুন' : 'View individual statement'}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'স্টেটমেন্ট দেখুন' : 'View Statement'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* ===================================================================== */}
      {/* SECTION 2: FULL SOMITI FINANCIAL STATEMENT (সমিতির সার্বিক স্টেটমেন্ট) */}
      {/* ===================================================================== */}
      {statementSubTab === 'somiti_statement' && (
        <div className="space-y-6">
          {/* Somiti Master Statement Overview Banner */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-800" />
                  <span>{language === 'bn' ? 'সমিতির কেন্দ্রীয় সার্বিক আর্থিক বিবরণী (Central Master Statement)' : 'Somiti Central Financial Statement'}</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {language === 'bn'
                    ? 'সমিতির সকল সদস্যের মোট সঞ্চয় কিস্তি, ঋণ বিতরণ, কিস্তি আদায় এবং ক্যাশবুক খরচের পূর্ণাঙ্গ মাস্টার লেজার।'
                    : 'Consolidated master transaction ledger of all member savings, loans, collections, and operating outflows.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportSomitiMasterCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'bn' ? 'সার্বিক স্টেটমেন্ট CSV' : 'Export Full Statement CSV'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-500 mr-1 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {language === 'bn' ? 'তারিখ প্রিসেট:' : 'Date Presets:'}
              </span>
              <button
                type="button"
                onClick={() => handleSetSomitiDatePreset('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  !somitiStartDate && !somitiEndDate ? 'bg-emerald-800 text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {language === 'bn' ? 'সব সময় (All)' : 'All Time'}
              </button>
              <button
                type="button"
                onClick={() => handleSetSomitiDatePreset('this_month')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  somitiStartDate.startsWith('2026-03') ? 'bg-emerald-800 text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {language === 'bn' ? 'চলতি মাস (This Month)' : 'This Month'}
              </button>
              <button
                type="button"
                onClick={() => handleSetSomitiDatePreset('last_month')}
                className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'গত মাস (Last Month)' : 'Last Month'}
              </button>
              <button
                type="button"
                onClick={() => handleSetSomitiDatePreset('last_3_months')}
                className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'গত ৩ মাস' : 'Last 3 Months'}
              </button>
              <button
                type="button"
                onClick={() => handleSetSomitiDatePreset('this_year')}
                className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'চলতি বছর (This Year)' : 'This Year'}
              </button>
            </div>

            {/* Filter Bar with DateInput */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <DateInput
                  label={language === 'bn' ? 'শুরুর তারিখ (From)' : 'Start Date'}
                  value={somitiStartDate}
                  onChange={(val) => setSomitiStartDate(val)}
                />
              </div>

              <div>
                <DateInput
                  label={language === 'bn' ? 'শেষের তারিখ (To)' : 'End Date'}
                  value={somitiEndDate}
                  onChange={(val) => setSomitiEndDate(val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {language === 'bn' ? 'লেনদেনের প্রবাহ (Flow)' : 'Transaction Flow'}
                </label>
                <select
                  value={somitiCategoryFilter}
                  onChange={(e) => setSomitiCategoryFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">{language === 'bn' ? 'সকল লেনদেন (ইনফ্লো ও আউটফ্লো)' : 'All Inflow & Outflow'}</option>
                  <option value="inflow">{language === 'bn' ? 'শুধুমাত্র জমা / ইনফ্লো (+)' : 'Only Inflow (+)'}</option>
                  <option value="outflow">{language === 'bn' ? 'শুধুমাত্র খরচ ও বিতরণ (-)' : 'Only Outflow (-)'}</option>
                  <option value="savings">{language === 'bn' ? 'সঞ্চয় কিস্তি জমা' : 'Savings Collections'}</option>
                  <option value="loan_repayment">{language === 'bn' ? 'ঋণ কিস্তি আদায়' : 'Loan Collections'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {language === 'bn' ? 'অনুসন্ধান (Search)' : 'Search'}
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'রসিদ, ভাউচার বা বিবরণ...' : 'Ref, title...'}
                    value={somitiSearchQuery}
                    onChange={(e) => setSomitiSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setSomitiSortOrder(somitiSortOrder === 'desc' ? 'asc' : 'desc')}
                  className="flex-1 px-3 py-2 text-xs font-semibold bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title={language === 'bn' ? 'তারিখের ক্রমানুসারে সাজান' : 'Sort Date'}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{somitiSortOrder === 'desc' ? (language === 'bn' ? 'নতুন আগে' : 'Newest') : (language === 'bn' ? 'পুরানো আগে' : 'Oldest')}</span>
                </button>
                {(somitiStartDate || somitiEndDate || somitiCategoryFilter !== 'all' || somitiSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSomitiStartDate('');
                      setSomitiEndDate('');
                      setSomitiCategoryFilter('all');
                      setSomitiSearchQuery('');
                    }}
                    className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                    title={language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset'}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Somiti Financial Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'মোট ইনফ্লো / জমা (+)' : 'Total Inflows (+)'}</span>
                </div>
                <div className="text-lg font-black font-mono text-emerald-950 mt-1">
                  {formatCurrency(somitiFilteredInflow, language)}
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                <div className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'মোট আউটফ্লো / খরচ (-)' : 'Total Outflows (-)'}</span>
                </div>
                <div className="text-lg font-black font-mono text-amber-950 mt-1">
                  {formatCurrency(somitiFilteredOutflow, language)}
                </div>
              </div>

              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                <div className="text-[11px] font-bold text-blue-800 uppercase">
                  {language === 'bn' ? 'পিরিয়ড নিট স্থিতি (Surplus)' : 'Net Period Balance'}
                </div>
                <div className="text-lg font-black font-mono text-blue-950 mt-1">
                  {formatCurrency(somitiNetBalance, language)}
                </div>
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                <div className="text-[11px] font-bold text-neutral-600 uppercase">
                  {language === 'bn' ? 'ক্যাশিয়ারের ড্রয়ারে ক্যাশ' : 'Cashier Vault In Hand'}
                </div>
                <div className="text-lg font-black font-mono text-neutral-900 mt-1">
                  {formatCurrency(cashInHand, language)}
                </div>
              </div>
            </div>

            {/* Master Statement Table */}
            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-3.5">তারিখ (DD/MM/YYYY)</th>
                    <th className="py-3 px-3.5">ভাউচার/রসিদ নং</th>
                    <th className="py-3 px-3.5 font-sans">খাত ও বিবরণ</th>
                    <th className="py-3 px-3.5 font-sans">সদস্য / সংশ্লিষ্ট ব্যক্তি</th>
                    <th className="py-3 px-3.5 text-center font-sans">মাধ্যম</th>
                    <th className="py-3 px-3.5 font-sans">অপারেটর</th>
                    <th className="py-3 px-3.5 text-center font-sans">ইনফ্লো / আউটফ্লো</th>
                    <th className="py-3 px-3.5 text-right">টাকার পরিমাণ (৳)</th>
                    <th className="py-3 px-3.5 text-center font-sans">রসিদ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredMasterLedger.map((item) => {
                    const isInflow = item.flowType === 'inflow';
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-neutral-900 whitespace-nowrap">
                          {formatDateDMY(item.date, language)}
                        </td>
                        <td className="py-3 px-3.5 text-emerald-800 font-bold whitespace-nowrap">
                          {item.refNo}
                        </td>
                        <td className="py-3 px-3.5 font-sans">
                          <div className="font-semibold text-neutral-900">{item.title}</div>
                          <div className="text-[10px] text-neutral-500">{item.categoryLabel}</div>
                        </td>
                        <td className="py-3 px-3.5 font-sans text-neutral-800">
                          {item.partyName}
                        </td>
                        <td className="py-3 px-3.5 text-center font-sans uppercase text-[10px] text-neutral-600">
                          <span className="px-1.5 py-0.5 bg-neutral-100 rounded font-bold">
                            {item.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-sans text-neutral-600 text-[11px]">
                          {item.operator}
                        </td>
                        <td className="py-3 px-3.5 text-center font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isInflow
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isInflow ? (language === 'bn' ? '+ জমা (Inflow)' : '+ Inflow') : (language === 'bn' ? '- খরচ (Outflow)' : '- Outflow')}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-3.5 text-right font-black text-sm tabular-nums ${
                            isInflow ? 'text-emerald-800' : 'text-amber-800'
                          }`}
                        >
                          {isInflow ? '+' : '-'}{formatCurrency(item.amount, language)}
                        </td>
                        <td className="py-3 px-3.5 text-center font-sans">
                          {item.rawTx && onOpenReceipt ? (
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(item.rawTx!)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-neutral-700 border border-neutral-200 rounded text-[10px] cursor-pointer"
                              title={language === 'bn' ? 'রসিদ দেখুন' : 'View receipt'}
                            >
                              <ExternalLink className="w-3 h-3 text-emerald-600" />
                              <span>{language === 'bn' ? 'রসিদ' : 'Receipt'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-400 font-sans">ভাউচার</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-neutral-50 border-t-2 border-neutral-200 font-bold">
                  <tr>
                    <td colSpan={7} className="py-3 px-3.5 text-right text-xs text-neutral-700 font-sans">
                      {language === 'bn' ? 'নিট পিরিয়ড সারপ্লাস (Net Balance):' : 'Net Period Balance:'}
                    </td>
                    <td className="py-3 px-3.5 text-right text-base text-emerald-950 font-black">
                      {formatCurrency(somitiNetBalance, language)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: BALANCE SHEET, DIVIDEND & AUDIT TRAIL                     */}
      {/* ===================================================================== */}
      {statementSubTab === 'audit_balance_sheet' && (
        <div className="space-y-6">
          {/* Somiti Balance Sheet / Statement of Affairs */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs print:border-none print:shadow-none">
            <div className="text-center pb-4 mb-4 border-b border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900">
                Friend Initiative Organization
              </h2>
              <div className="text-xs font-semibold text-emerald-800">
                {language === 'bn' ? 'রেজিস্ট্রেশন নং: FIO-7412 · যেহেতু ২০২৪ (Since 2024)' : 'Reg No: FIO-7412 · Since 2024'}
              </div>
              <div className="text-xs text-neutral-600 mt-0.5">
                {language === 'bn' ? 'সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : 'Sitaikunda, Kotalipara, Gopalgonj'}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1 font-medium">
                {language === 'bn' ? 'আর্থিক স্থিতিপত্র (ব্যালেন্স শিট)' : 'Statement of Financial Position (Balance Sheet)'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* ASSETS (সম্পদ সমূহ) */}
              <div className="space-y-3">
                <div className="pb-2 border-b-2 border-emerald-700 flex justify-between items-center">
                  <h3 className="font-bold text-neutral-900 uppercase">
                    {language === 'bn' ? 'সমিতির মোট সম্পদ (Assets)' : 'Total Assets'}
                  </h3>
                  <span className="text-[11px] text-neutral-500">চলতি ও বিনিয়োগ</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-700">{language === 'bn' ? '১. ক্যাশিয়ারের কাছে নগদ টাকা (Cash in Hand)' : '1. Cash in Vault / Drawer'}</span>
                    <strong className="font-mono tabular-nums">{formatCurrency(cashInHand, language)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-700">{language === 'bn' ? '২. সোনালী ব্যাংক হিসাব জমা (Bank Balance)' : '2. Bank Account Balance'}</span>
                    <strong className="font-mono tabular-nums">{formatCurrency(245000, language)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-700">{language === 'bn' ? '৩. সদস্যদের কাছে ঋণ পাওনা (Loans Outstanding)' : '3. Active Loans Receivable'}</span>
                    <strong className="font-mono tabular-nums">{formatCurrency(totalLoanReceivable, language)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-700">{language === 'bn' ? '৪. বিনিয়োগ প্রকল্প মূলধন (Project Capital)' : '4. Net Capital in Active Projects'}</span>
                    <strong className="font-mono tabular-nums">{formatCurrency(totalProjectCapital - totalProjectExpenses, language)}</strong>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-sm font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200">
                  <span className="text-neutral-900">{language === 'bn' ? 'সর্বমোট সম্পদ:' : 'Total Assets:'}</span>
                  <span className="font-mono tabular-nums text-emerald-800">
                    {formatCurrency(totalAssets, language)}
                  </span>
                </div>
              </div>

              {/* LIABILITIES & EQUITIES (দায় ও মূলধন) */}
              <div className="space-y-3">
                <div className="pb-2 border-b-2 border-neutral-800 flex justify-between items-center">
                  <h3 className="font-bold text-neutral-900 uppercase">
                    {language === 'bn' ? 'দায় ও সদস্য মূলধন (Liabilities & Equity)' : 'Liabilities & Member Equity'}
                  </h3>
                  <span className="text-[11px] text-neutral-500">দায় ও শেয়ার</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-700">{language === 'bn' ? '১. সদস্য সঞ্চয় আমানত (Member Savings Deposits)' : "1. Members' Savings Vault"}</span>
                    <strong className="font-mono tabular-nums">{formatCurrency(totalSavings, language)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-700">{language === 'bn' ? '২. সদস্য পরিশোধিত শেয়ার মূলধন (Share Capital)' : '2. Paid-up Share Capital'}</span>
                    <strong className="font-mono tabular-nums">{formatCurrency(totalSharesValue, language)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-700">{language === 'bn' ? '৩. সাধারণ জরুরি ও কল্যাণ তহবিল (Welfare Reserve)' : '3. Welfare & Emergency Reserve'}</span>
                    <strong className="font-mono tabular-nums">{formatCurrency(70000, language)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-700">{language === 'bn' ? '৪. অবণ্টিত লভ্যাংশ ও উদ্বৃত্ত (Retained Surplus)' : '4. Retained Operating Surplus'}</span>
                    <strong className="font-mono tabular-nums">{formatCurrency(56618, language)}</strong>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-sm font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200">
                  <span className="text-neutral-900">{language === 'bn' ? 'মোট দায় ও ইকুইটি:' : 'Total Liabilities & Equity:'}</span>
                  <span className="font-mono tabular-nums text-neutral-900">
                    {formatCurrency(totalSavings + totalSharesValue + 70000 + 56618, language)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Equal Dividend Distribution Section */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-neutral-900">
                    {language === 'bn' ? 'সকল সদস্যের সমান লভ্যাংশ বণ্টন (All Members Share Equal)' : 'Equal Dividend Distribution (All Members Share Equal)'}
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {language === 'bn'
                    ? 'গঠনতন্ত্র অনুযায়ী সমিতির সকল সদস্যের মধ্যে লভ্যাংশ সমানভাবে (Equal Share) বণ্টিত হয়'
                    : 'Annual dividend distributed equally among all enrolled members'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-neutral-700">
                  {language === 'bn' ? 'মোট লভ্যাংশ ফান্ড (টাকা):' : 'Dividend Pool (৳):'}
                </span>
                <input
                  type="number"
                  value={dividendPool}
                  onChange={(e) => setDividendPool(Number(e.target.value) || 0)}
                  className="w-36 px-3 py-1.5 text-xs font-mono font-bold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
                <div className="text-xs text-indigo-700 font-semibold uppercase">
                  {language === 'bn' ? 'মোট লভ্যাংশ ফান্ড' : 'Total Dividend Pool'}
                </div>
                <div className="text-xl font-bold font-mono text-indigo-900 mt-1">
                  {formatCurrency(dividendPool, language)}
                </div>
              </div>
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                <div className="text-xs text-emerald-700 font-semibold uppercase">
                  {language === 'bn' ? 'মোট সদস্য সংখ্যা' : 'Total Members Count'}
                </div>
                <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
                  {toBengaliNumber(members.length)} {language === 'bn' ? 'জন' : 'Members'}
                </div>
              </div>
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                <div className="text-xs text-blue-700 font-semibold uppercase">
                  {language === 'bn' ? 'প্রতি সদস্যের অংশ' : 'Equal Share per Member'}
                </div>
                <div className="text-xl font-bold font-mono text-blue-900 mt-1">
                  {formatCurrency(equalDividendPerMember, language)}
                </div>
              </div>
            </div>

            {/* Equal Distribution Table */}
            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4"># {language === 'bn' ? 'সদস্য নং' : 'Member No'}</th>
                    <th className="py-3 px-4">{language === 'bn' ? 'সদস্যের নাম' : 'Member Name'}</th>
                    <th className="py-3 px-4 text-right">{language === 'bn' ? 'মোট সঞ্চয় জমা' : 'Total Savings'}</th>
                    <th className="py-3 px-4 text-center">{language === 'bn' ? 'বণ্টন নীতি' : 'Distribution Rule'}</th>
                    <th className="py-3 px-4 text-right">{language === 'bn' ? 'প্রাপ্য লভ্যাংশ (সমান)' : 'Equal Dividend Amount'}</th>
                    <th className="py-3 px-4 text-right">{language === 'bn' ? 'কার্যকরী ROI %' : 'Effective ROI %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {members.map((m) => {
                    const savings = m.totalSavingsDeposited || 0;
                    const effectiveRoi = savings > 0 ? (equalDividendPerMember / savings) * 100 : 0;

                    return (
                      <tr key={m.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-neutral-800">{m.memberNo}</td>
                        <td className="py-3 px-4 font-semibold text-neutral-900">
                          {language === 'bn' ? m.nameBn : m.nameEn}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-700">
                          {formatCurrency(savings, language)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {language === 'bn' ? 'সমান অংশ (Equal)' : 'Equal Share'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-indigo-700">
                          {formatCurrency(equalDividendPerMember, language)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-blue-800">
                          {effectiveRoi.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Log / Audit Trail */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-base font-bold text-neutral-900">
                    {language === 'bn' ? 'অ্যাক্টিভিটি লগ ও অডিট ট্র্যাকিং' : 'Activity Log & Audit Trail'}
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {language === 'bn'
                    ? 'সকল ডিপোজিট, উত্তোলন এবং সদস্য প্রোফাইল আপডেটসমূহের কালানুক্রমিক ইতিহাস'
                    : 'Chronological audit trail of all deposits, withdrawals, and member profile updates'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'লগ অনুসন্ধান...' : 'Search logs...'}
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
                  />
                </div>

                <div className="flex bg-neutral-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActivityFilter('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activityFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {language === 'bn' ? 'সব' : 'All'}
                  </button>
                  <button
                    onClick={() => setActivityFilter('deposit')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activityFilter === 'deposit' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {language === 'bn' ? 'ডিপোজিট' : 'Deposits'}
                  </button>
                  <button
                    onClick={() => setActivityFilter('withdrawal')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activityFilter === 'withdrawal' ? 'bg-amber-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {language === 'bn' ? 'উত্তোলন' : 'Withdrawals'}
                  </button>
                  <button
                    onClick={() => setActivityFilter('profile')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activityFilter === 'profile' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {language === 'bn' ? 'প্রোফাইল' : 'Profiles'}
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Log List */}
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto pr-1">
              {filteredActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  {language === 'bn' ? 'কোনো অ্যাক্টিভিটি লগ পাওয়া যায়নি।' : 'No activity records found.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredActivities.map((act) => {
                    const isDeposit = act.category === 'deposit';
                    const isWithdrawal = act.category === 'withdrawal';
                    const isProfile = act.category === 'profile_update';

                    return (
                      <div
                        key={act.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-neutral-50/80 hover:bg-neutral-100/80 border border-neutral-200/70 rounded-xl transition-colors text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isDeposit
                                ? 'bg-emerald-100 text-emerald-800'
                                : isWithdrawal
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isDeposit && <ArrowUpRight className="w-4 h-4" />}
                            {isWithdrawal && <ArrowDownLeft className="w-4 h-4" />}
                            {isProfile && <UserPlus className="w-4 h-4" />}
                          </div>

                          <div className="space-y-0.5">
                            <div className="font-bold text-neutral-900">
                              {language === 'bn' ? act.titleBn : act.titleEn}
                            </div>
                            <div className="text-[11px] text-neutral-500 flex flex-wrap items-center gap-2">
                              <span className="font-mono bg-neutral-200/70 px-1.5 py-0.5 rounded text-neutral-700">
                                Ref: {act.referenceNo}
                              </span>
                              <span>·</span>
                              <span>{language === 'bn' ? 'অপারেটর:' : 'Operator:'} <strong className="text-neutral-700">{act.actor}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-200">
                          {act.amount !== undefined && (
                            <div className={`font-mono font-bold text-sm ${isDeposit ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {isDeposit ? '+' : '-'}{formatCurrency(act.amount, language)}
                            </div>
                          )}
                          <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>{formatDateDMY(act.date, language)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

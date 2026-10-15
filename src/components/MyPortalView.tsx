import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  Printer,
  Shield,
  CreditCard,
  Calendar,
  Phone,
  FileText,
  ExternalLink,
  CheckCircle2,
  Lock,
  ListTodo,
  AlertCircle,
  LogOut,
  FolderKanban,
  CheckSquare,
  Square,
  HeartHandshake,
  Edit3,
  Camera,
  X,
  Wallet,
  Download,
  Filter,
  ArrowUpDown,
  ArrowLeft,
  CalendarDays,
  Search,
  Receipt,
  ShieldCheck,
  Users,
  MapPin,
  DollarSign,
  TrendingUp,
  Briefcase,
  Layers,
  Sparkles,
  Clock,
  ChevronRight,
  Info,
  Percent,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { KistiTransaction, Language, isAdminRole } from '../types/somiti';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';
import { MemberAvatar } from './MemberAvatar';
import { PhotoCropModal } from './PhotoCropModal';
import { DateInput } from './DateInput';

interface MyPortalViewProps {
  onOpenReceipt: (tx: KistiTransaction) => void;
  onOpenLoginModal: () => void;
  onBackToAdmin?: () => void;
}

export const MyPortalView: React.FC<MyPortalViewProps> = ({
  onOpenReceipt,
  onOpenLoginModal,
  onBackToAdmin,
}) => {
  const {
    currentMember,
    transactions,
    loans,
    tasks,
    projects,
    members,
    cashbook,
    toggleTaskChecklist,
    updatePassword,
    updateMember,
    updateMemberCredentials,
    updateMemberPhoto,
    updateMemberProfile,
    activeMemberPortalSubTab,
    setActiveMemberPortalSubTab,
    logout,
    language,
    portalFeatureSettings,
  } = useSomiti();

  const activePortalSubTab = activeMemberPortalSubTab;
  const setActivePortalSubTab = setActiveMemberPortalSubTab;
  // When activePortalSubTab is null (or 'home'), the member sees the clean, minimal landing page.
  // When activePortalSubTab is set to any specific section, ONLY that section is rendered with a "← ব্যাক / মূল পেজ" button.
  const isSectionOpen = Boolean(activePortalSubTab);

  const perms = currentMember?.permissions || {};
  const isProfileEnabled = (portalFeatureSettings?.profile ?? true) && (perms.canViewProfile ?? true);
  const isPassbookEnabled = (portalFeatureSettings?.passbook ?? true) && (perms.canViewPassbook ?? perms.canViewSavings ?? true);
  const isDashboardEnabled = (portalFeatureSettings?.dashboard ?? true) && (perms.canViewDashboard ?? true);
  const isLoanEnabled = (portalFeatureSettings?.loan ?? true) && (perms.canViewLoans ?? true);
  const isInvestmentEnabled = (portalFeatureSettings?.investment ?? true) && (perms.canViewInvestments ?? true);
  const isStatementEnabled = (portalFeatureSettings?.statement ?? true) && (perms.canViewStatement ?? true);
  const isRulesEnabled = (portalFeatureSettings?.rules ?? true) && (perms.canViewRules ?? true);
  const isTasksEnabled = true;
  const isDirectoryEnabled = perms.canViewMembersDirectory ?? true;

  const myLoans = loans.filter((l) => l.memberId === currentMember?.id);
  const activeLoan = myLoans.find((l) => l.status === 'active');
  const repaidLoans = myLoans.filter((l) => l.status === 'repaid');
  const myLoanTransactions = transactions.filter(
    (t) => t.memberId === currentMember?.id && (t.type === 'loan_repayment' || t.loanId)
  );

  // Auto-close active section if Admin disables it
  useEffect(() => {
    if (activePortalSubTab === 'profile' && !isProfileEnabled) setActivePortalSubTab(null);
    if (activePortalSubTab === 'passbook' && !isPassbookEnabled) setActivePortalSubTab(null);
    if (activePortalSubTab === 'dashboard' && !isDashboardEnabled) setActivePortalSubTab(null);
    if (activePortalSubTab === 'loan' && !isLoanEnabled) setActivePortalSubTab(null);
    if (activePortalSubTab === 'investment' && !isInvestmentEnabled) setActivePortalSubTab(null);
    if (activePortalSubTab === 'statement' && !isStatementEnabled) setActivePortalSubTab(null);
    if (activePortalSubTab === 'rules' && !isRulesEnabled) setActivePortalSubTab(null);
  }, [activePortalSubTab, isProfileEnabled, isPassbookEnabled, isDashboardEnabled, isLoanEnabled, isInvestmentEnabled, isStatementEnabled, isRulesEnabled]);

  // Somiti Global Financial Metrics
  const totalMemberSavings = members.reduce((sum, m) => sum + (m.totalSavingsDeposited || 0), 0);
  const marchTxs = transactions.filter(t => (t.periodMonth === '2026-03' || t.date.startsWith('2026-03')) && t.type === 'savings');
  const marchCollection = marchTxs.reduce((sum, t) => sum + t.amount, 0);
  const activeLoansList = loans.filter(l => l.status === 'active');
  const activeLoansDues = activeLoansList.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalDisbursed = activeLoansList.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalInflow = cashbook.filter(e => e.type === 'inflow').reduce((sum, e) => sum + e.amount, 0);
  const totalOutflow = cashbook.filter(e => e.type === 'outflow').reduce((sum, e) => sum + e.amount, 0);
  const cashInHand = Math.max(0, totalInflow - totalOutflow);

  // Profile Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editNomineeName, setEditNomineeName] = useState('');
  const [editNomineeRelation, setEditNomineeRelation] = useState('');
  const [editNomineePhone, setEditNomineePhone] = useState('');
  const [editNomineeNid, setEditNomineeNid] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Self-Service State
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Photo Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');

  // Investment Portfolio Tab View & Detail State
  const [selectedInvestmentProjectId, setSelectedInvestmentProjectId] = useState<string | null>(null);
  const [selectedInvestmentTab, setSelectedInvestmentTab] = useState<'summary' | 'financials' | 'lessor' | 'supervisor'>('summary');
  const [selectedInvestmentForDetails, setSelectedInvestmentForDetails] = useState<any | null>(null);

  // Initialize edit inputs only when member ID changes, avoiding mid-typing resets
  useEffect(() => {
    if (currentMember) {
      setEditPhone(currentMember.phone || '');
      setEditDob(currentMember.dateOfBirth || '');
      setEditNomineeName(currentMember.nomineeName || '');
      setEditNomineeRelation(currentMember.nomineeRelation || '');
      setEditNomineePhone(currentMember.nomineePhone || '');
      setEditNomineeNid(currentMember.nomineeNid || '');
      setEditAddress(currentMember.address || '');
      setEditPhotoUrl(currentMember.photoUrl || '');
    }
  }, [currentMember?.id]);

  if (!currentMember) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center max-w-md mx-auto my-12 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">
          {language === 'bn' ? 'সদস্য প্রোফাইল দেখতে লগইন করুন' : 'Member Login Required'}
        </h2>
        <p className="text-xs text-neutral-500">
          {language === 'bn'
            ? 'আপনার নির্দিষ্ট সদস্য আইডি ও পাসওয়ার্ড দিয়ে লগইন করে নিজের পাসবই, কিস্তির হিসাব ও টাস্ক দেখুন।'
            : 'Sign in with your Member ID and password to view your digital passbook and dues.'}
        </p>
        <button
          onClick={onOpenLoginModal}
          className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          {language === 'bn' ? 'লগইন করুন' : 'Sign In Now'}
        </button>
      </div>
    );
  }

  // Personal transactions for this member
  const myTransactions = transactions
    .filter((tx) => tx.memberId === currentMember.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Personal loan
  const myLoan = loans.find((l) => l.memberId === currentMember.id && l.status === 'active');

  // Personal tasks
  const myTasks = tasks.filter((t) => t.assignedToMemberId === currentMember.id);

  // Statement Date-Wise Filter State
  const [statementStartDate, setStatementStartDate] = useState<string>('');
  const [statementEndDate, setStatementEndDate] = useState<string>('');
  const [statementTypeFilter, setStatementTypeFilter] = useState<string>('all');
  const [statementSortOrder, setStatementSortOrder] = useState<'desc' | 'asc'>('desc');
  const [statementSearchQuery, setStatementSearchQuery] = useState<string>('');

  const filteredStatementTxs = myTransactions.filter((tx) => {
    if (statementStartDate && tx.date < statementStartDate) return false;
    if (statementEndDate && tx.date > statementEndDate) return false;
    if (statementTypeFilter !== 'all' && tx.type !== statementTypeFilter) return false;
    if (statementSearchQuery.trim()) {
      const q = statementSearchQuery.trim().toLowerCase();
      const matchReceipt = tx.receiptNo.toLowerCase().includes(q);
      const matchMonth = (tx.periodMonth || '').toLowerCase().includes(q);
      const matchMethod = (tx.paymentMethod || '').toLowerCase().includes(q);
      const matchAmount = String(tx.amount).includes(q);
      if (!matchReceipt && !matchMonth && !matchMethod && !matchAmount) return false;
    }
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return statementSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const statementTotalCredit = filteredStatementTxs.reduce((sum, tx) => sum + (tx.totalPaid !== undefined ? tx.totalPaid : tx.amount), 0);
  const statementPrincipalSavings = filteredStatementTxs.filter((t) => t.type === 'savings').reduce((sum, tx) => sum + (tx.principalAmount !== undefined ? tx.principalAmount : Math.max(0, tx.amount - (tx.fineAmount || 0))), 0);
  const statementFineTotal = filteredStatementTxs.reduce((sum, tx) => sum + (tx.fineAmount || 0), 0);
  const statementLoanCredit = filteredStatementTxs.filter((t) => t.type === 'loan_repayment').reduce((sum, tx) => sum + (tx.principalAmount !== undefined ? tx.principalAmount : tx.amount), 0);

  const handleExportStatementCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += `=== STATEMENT FOR ${currentMember.nameEn.toUpperCase()} (${currentMember.memberNo}) ===\n`;
    csv += `Date Range,${statementStartDate || 'All'} to ${statementEndDate || 'All'}\n`;
    csv += `Total Transactions,${filteredStatementTxs.length}\n`;
    csv += `Total Principal Savings,৳${statementPrincipalSavings}\n`;
    csv += `Total Late Fees,৳${statementFineTotal}\n`;
    csv += `Total Collected,৳${statementTotalCredit}\n\n`;
    csv += "Date,Receipt No,Type,Target Month,Principal Deposit (BDT),Fine/Late Fee (BDT),Total Paid (BDT),Payment Method,Collector,Remarks\n";
    filteredStatementTxs.forEach((tx) => {
      const principal = tx.principalAmount !== undefined ? tx.principalAmount : (tx.type === 'savings' ? Math.max(0, tx.amount - (tx.fineAmount || 0)) : tx.amount);
      const fine = tx.fineAmount || 0;
      const total = tx.totalPaid !== undefined ? tx.totalPaid : tx.amount;
      csv += `"${tx.date}","${tx.receiptNo}","${tx.type}","${tx.targetMonth || tx.periodMonth || ''}",${principal},${fine},${total},"${tx.paymentMethod}","${tx.collectedBy}","${tx.remarks || ''}"\n`;
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `statement_${currentMember.memberNo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSetDatePreset = (preset: 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year') => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (preset === 'all') {
      setStatementStartDate('');
      setStatementEndDate('');
    } else if (preset === 'this_month') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      setStatementStartDate(`${year}-${month}-01`);
      setStatementEndDate(todayStr);
    } else if (preset === 'last_month') {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthNum = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      setStatementStartDate(`${lastMonthYear}-${lastMonthNum}-01`);
      setStatementEndDate(`${lastMonthYear}-${lastMonthNum}-${lastDayOfLastMonth}`);
    } else if (preset === 'last_3_months') {
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      setStatementStartDate(threeMonthsAgo.toISOString().slice(0, 10));
      setStatementEndDate(todayStr);
    } else if (preset === 'this_year') {
      setStatementStartDate(`${today.getFullYear()}-01-01`);
      setStatementEndDate(todayStr);
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;
    updateMemberProfile(currentMember.id, {
      phone: editPhone,
      dateOfBirth: editDob,
      nomineeName: editNomineeName,
      nomineeRelation: editNomineeRelation,
      nomineePhone: editNomineePhone,
      nomineeNid: editNomineeNid,
      address: editAddress,
      photoUrl: editPhotoUrl,
    });
    updateMember({
      ...currentMember,
      phone: editPhone,
      dateOfBirth: editDob,
      nomineeName: editNomineeName,
      nomineeRelation: editNomineeRelation,
      nomineePhone: editNomineePhone,
      nomineeNid: editNomineeNid,
      address: editAddress,
      photoUrl: editPhotoUrl,
    });
    setProfileSuccess(language === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' : 'Profile updated successfully!');
    setTimeout(() => {
      setProfileSuccess('');
      setIsEditModalOpen(false);
    }, 1200);
  };

  const handleGeneratePin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPassword(pin);
    setPasswordError('');
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;
    const clean = newPassword.trim();
    if (clean.length < 4) {
      setPasswordError(language === 'bn' ? 'পাসওয়ার্ড বা পিন কমপক্ষে ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    try {
      const res = await updateMemberCredentials(currentMember.id, currentMember.memberNo, clean);
      if (res.success) {
        updatePassword(currentMember.id, clean);
        setPasswordSuccess(language === 'bn' ? 'আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!' : 'Your new password has been saved successfully!');
        setNewPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      } else {
        setPasswordError(res.error || (language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' : 'Failed to change password.'));
      }
    } catch {
      setPasswordError(language === 'bn' ? 'নেটওয়ার্ক ত্রুটি হয়েছে।' : 'Network error occurred.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onOpenLoginModal();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'lead_executive':
        return language === 'bn' ? 'সভাপতি, সাধারণ সম্পাদক ও ক্যাশিয়ার' : 'President, Secretary & Cashier';
      case 'cashier':
        return language === 'bn' ? 'কোষাধ্যক্ষ / প্রধান ক্যাশিয়ার' : 'Chief Cashier';
      case 'president':
        return language === 'bn' ? 'সভাপতি' : 'President';
      case 'secretary':
        return language === 'bn' ? 'সাধারণ সম্পাদক' : 'General Secretary';
      case 'executive':
        return language === 'bn' ? 'কার্যনির্বাহী সদস্য' : 'Executive Member';
      default:
        return language === 'bn' ? 'সাধারণ সদস্য' : 'General Member';
    }
  };

  const rulesList = language === 'bn' ? [
    { title: '১. সমিতি প্রতিষ্ঠা ও শুরু', desc: 'বন্ধু উদ্যোক্তা সমবায় সমিতি (Friend Initiative Organization) আনুষ্ঠানিকভাবে ১০/০৯/২০২৪ তারিখে যাত্রা শুরু করে।' },
    { title: '২. মাসিক সঞ্চয় ও কিস্তি আদায়', desc: 'প্রতি মাসের ৫ থেকে ১০ তারিখের মধ্যে প্রতি সদস্যের নির্ধারিত মাসিক সঞ্চয় ১০০০৳ কিস্তি হিসেবে জমা দিতে হবে। ক্যাশিয়ার কোনো প্রকার অতিরিক্ত ফি বা চার্জ ছাড়াই এই কিস্তি সংগ্রহ করতে পারবেন।' },
    { title: '৩. শেয়ার ও আমানত', desc: 'সকল সদস্যের আমানত ও শেয়ার মূলধন ১০০% শেয়ার হোল্ডার সদস্য এবং তার মনোনীত নমিনির নামে সংরক্ষিত থাকবে।' },
    { title: '৪. জন্মতারিখ ও রিমাইন্ডার', desc: 'প্রতিটি সদস্যের জন্মতারিখ ও প্রোফাইল তথ্য ডাটাবেজে সংরক্ষিত থাকবে এবং ড্যাশবোর্ডে চলতি মাসের জন্মদিনের রিমাইন্ডার স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।' },
    { title: '৫. বিলম্বে জমা ও বিলম্ব ফি', desc: 'সমিতির সিদ্ধান্ত অনুযায়ী বর্তমানে কোনো প্রকার বিলম্ব জরিমানা প্রযোজ্য নয় (বিলম্ব ফি সম্পূর্ণ বন্ধ)।' },
    { title: '৬. ঋণ সুবিধা ও লাভ হার', desc: 'সদস্যগণ জামানত সাপেক্ষে সমিতির তহবিল থেকে সহজ শর্তে ঋণ গ্রহণ করতে পারবেন এবং নির্ধারিত লাভ হার প্রযোজ্য হবে।' },
    { title: '৭. প্রকল্প ও বিনিয়োগ', desc: 'সমিতির যৌথ উদ্যোগে জমি লিজ, কৃষি ও ব্যবসায়িক খাতে বিনিয়োগ পরিচালিত হবে এবং মুনাফা সদস্যদের মাঝে যথানিয়মে বণ্টিত হবে।' },
    { title: '৮. উপস্থিতি ও শৃঙ্খলা', desc: 'সকল সদস্যকে সমিতির নিয়মশৃঙ্খলা ও মাসিক মিটিংয়ে যথাসময়ে উপস্থিত থাকতে হবে।' },
    { title: '৯. ক্যাশিয়ার ও হিসাব রক্ষণ', desc: 'ক্যাশিয়ার প্রতিদিনের আয়-ব্যয় ক্যাশবুকে নিখুঁতভাবে লিপিবদ্ধ করবেন এবং যে কেউ যেকোনো সময় হিসাব যাচাই করতে পারবেন।' },
    { title: '১০. সদস্যপদ ও বাতিলকরণ', desc: 'টানা ৪ মাস কিস্তি বকেয়া থাকলে এবং নিয়ম অমান্য করলে কার্যনির্বাহী কমিটির সিদ্ধান্তে সদস্যপদ স্থগিত বা বাতিল হতে পারে।' }
  ] : [
    { title: '1. Somiti Establishment & Start Date', desc: 'Friend Initiative Organization officially started its journey on 10/09/2024.' },
    { title: '2. Monthly Savings & Kisti Collection', desc: 'Every member must deposit monthly savings of ৳1,000 between the 5th and 10th of each month. The Cashier can collect kisti without any extra fee or charge.' },
    { title: '3. Shares & Deposits 100%', desc: 'All member deposit amounts and share capital are 100% owned by the share members and their nominated nominee.' },
    { title: '4. Date of Birth & Reminders', desc: 'Member Date of Birth (DOB) is maintained in the schema, and upcoming birthdays for the current month are highlighted on the Dashboard.' },
    { title: '5. Late Penalty', desc: 'Late fine/penalty is currently disabled (৳0 late fee constraint).' },
    { title: '6. Loan Facilities', desc: 'Members can access emergency and project loans against share capital under fair terms.' },
    { title: '7. Project Investments', desc: 'Joint initiatives in land lease, agriculture, and trading distribute profits proportionally among members.' },
    { title: '8. Discipline & Attendance', desc: 'Active participation in monthly meetings and adherence to somiti bylaws is mandatory.' },
    { title: '9. Cashier & Transparency', desc: 'The Cashier records daily transactions transparently with zero fee constraints on collection.' },
    { title: '10. Membership Status', desc: 'Defaulting for 4 consecutive months may lead to membership review as per executive committee bylaws.' }
  ];

  return (
    <div className="space-y-6">
      {/* Prominent Admin-to-Personal-Member-Portal Switching Top Bar */}
      {isAdminRole(currentMember?.role) && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-emerald-600/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-900/80 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              ⚙️
            </span>
            <div>
              <div className="text-xs sm:text-sm font-black flex items-center gap-2">
                <span>
                  {language === 'bn' ? `ব্যক্তিগত মেম্বার পোর্টাল (${currentMember.nameBn})` : `Personal Member Portal (${currentMember.nameEn})`}
                </span>
                <span className="text-[10px] bg-emerald-950/60 text-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold border border-emerald-600/50">
                  {currentMember.memberNo}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                {language === 'bn'
                  ? 'আপনি বর্তমানে আপনার ব্যক্তিগত সঞ্চয়, পাসবই, শেয়ার ও স্টেটমেন্ট দেখছেন।'
                  : 'You are viewing your personal member savings, passbook, and ledger.'}
              </p>
            </div>
          </div>
          {onBackToAdmin && (
            <button
              type="button"
              onClick={onBackToAdmin}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-black shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>⚙️ {language === 'bn' ? 'অ্যাডমিন প্যানেলে ফিরুন' : 'Back to Admin Panel'}</span>
            </button>
          )}
        </div>
      )}

      {/* When Any Section is Active: Hide landing card, show clean "← মূল পেজে ফিরুন" Header */}
      {isSectionOpen && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActivePortalSubTab(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              title={language === 'bn' ? 'মূল পেজে ফিরে যান' : 'Back to Home'}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'bn' ? '← মূল পেজে ফিরুন' : '← Back to Main Page'}</span>
            </button>
            <div className="hidden sm:block h-5 w-px bg-neutral-200" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {language === 'bn' ? 'বর্তমান সেকশন' : 'Current Section'}:
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                {activePortalSubTab === 'dashboard' && (language === 'bn' ? '📊 ড্যাশবোর্ড' : '📊 Dashboard')}
                {activePortalSubTab === 'profile' && (language === 'bn' ? '👤 প্রোফাইল' : '👤 Profile')}
                {activePortalSubTab === 'passbook' && (language === 'bn' ? '📖 পাসবই' : '📖 Passbook')}
                {activePortalSubTab === 'loan' && (language === 'bn' ? '💳 ঋণ হিসাব' : '💳 Loans')}
                {activePortalSubTab === 'investment' && (language === 'bn' ? '💼 বিনিয়োগ' : '💼 Investments')}
                {activePortalSubTab === 'statement' && (language === 'bn' ? '📄 স্টেটমেন্ট' : '📄 Statement')}
                {activePortalSubTab === 'rules' && (language === 'bn' ? '📜 রুলস' : '📜 Rules')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">
              {currentMember.nameBn} <span className="font-mono text-emerald-700 font-bold">({currentMember.memberNo})</span>
            </span>
            <button
              type="button"
              onClick={() => setActivePortalSubTab(null)}
              className="text-xs font-semibold text-neutral-600 hover:text-red-700 hover:bg-neutral-100 p-2 rounded-lg transition-colors cursor-pointer sm:hidden"
              title={language === 'bn' ? 'মূল পেজে ফিরুন' : 'Back to Main Page'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Minimal Landing View on Login (when activePortalSubTab is null): ONLY show the Welcome Card + clean guideline */}
      {!isSectionOpen && (
        <div className="space-y-4">
          {/* Top Welcome Member Profile Card */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <MemberAvatar member={currentMember} sizeClassName="w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                    {language === 'bn' ? `স্বাগতম, ${currentMember.nameBn}` : `Welcome, ${currentMember.nameEn}`}
                  </h1>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {currentMember.memberNo}
                  </span>
                </div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mt-1">
                  Friend Initiative Organization
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {language === 'bn' ? 'সদস্য পোর্টাল (Member Portal)' : 'Member Portal'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{language === 'bn' ? 'সক্রিয় সদস্য' : 'Active Member'}</span>
              </span>
            </div>
          </div>

          {/* Clean minimal guide banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-4 text-emerald-950">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                ☰
              </span>
              <div>
                <p className="text-xs sm:text-sm font-bold text-neutral-900">
                  {language === 'bn' ? 'সকল হিসাব ও তথ্য দেখতে উপরে বাম পাশের ☰ মেন্যু বাটনে চাপ দিন।' : 'Click the ☰ menu icon at the top left to navigate.'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {language === 'bn'
                    ? 'ড্যাশবোর্ড, প্রোফাইল, পাসবই, ঋণ হিসাব, বিনিয়োগ, স্টেটমেন্ট ও রুলস দেখতে ড্রয়ার মেনু ব্যবহার করুন।'
                    : 'Access Dashboard, Profile, Passbook, Loans, Investments, Statement, and Rules via the drawer.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. PROFILE SUB-TAB */}
      {activePortalSubTab === 'profile' && (
        <div className="space-y-6">
          {/* Hero Profile Banner */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="relative group cursor-pointer" title={language === 'bn' ? 'প্রোফাইল ছবি ক্রপ ও পরিবর্তন করুন' : 'Click to crop and change profile picture'}>
                  <MemberAvatar member={currentMember} sizeClassName="w-16 h-16 text-2xl" />
                  <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold cursor-pointer p-1 text-center">
                    <span>{language === 'bn' ? 'ছবি ক্রপ' : 'Crop'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCropImageSrc(reader.result as string);
                            setIsCropModalOpen(true);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                      {language === 'bn' ? currentMember.nameBn : currentMember.nameEn}
                    </h1>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-bold border border-neutral-200">
                      {currentMember.memberNo}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      {getRoleLabel(currentMember.role)}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono">মোবাইল: {currentMember.phone}</span>
                    <span>·</span>
                    <span className="text-emerald-800 font-medium">📍 {currentMember.address || (language === 'bn' ? 'সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : 'Sitaikunda, Kotalipara, Gopalgonj')}</span>
                    <span>·</span>
                    <span>{language === 'bn' ? 'জন্মতারিখ:' : 'DOB:'} {currentMember.dateOfBirth ? formatDate(currentMember.dateOfBirth, language) : '-'}</span>
                    <span>·</span>
                    <span>{language === 'bn' ? 'যোগদান:' : 'Joined:'} {formatDate(currentMember.joinDate, language)}</span>
                    <span>·</span>
                    <span>{language === 'bn' ? 'নমিনি:' : 'Nominee:'} {currentMember.nomineeName || '-'} ({currentMember.nomineeRelation || '-'} - {currentMember.nomineePhone || '-'}{currentMember.nomineeNid ? ` · NID: ${currentMember.nomineeNid}` : ''})</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'প্রোফাইল এডিট' : 'Edit Profile'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Details Grid: Tasks & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Security & Password Change Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    {language === 'bn' ? 'পাসওয়ার্ড ও পিন পরিবর্তন (Password / PIN)' : 'Change Password / PIN'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase bg-neutral-100 px-2 py-0.5 rounded">
                  ID: {currentMember.memberNo}
                </span>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs flex items-center gap-2 animate-fadeIn font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleSavePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {language === 'bn' ? 'নতুন পাসওয়ার্ড বা পিন লিখুন' : 'Enter New Password or PIN'}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={language === 'bn' ? 'কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড বা ৬-ডিজিট পিন' : 'Min 4 chars or 6-digit PIN'}
                        className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs bg-white text-neutral-900"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-[11px] font-medium"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleGeneratePin}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer"
                      title={language === 'bn' ? 'স্বয়ংক্রিয়ভাবে একটি ৬-ডিজিট পিন তৈরি করুন' : 'Generate random 6-digit PIN'}
                    >
                      {language === 'bn' ? '🎲 নতুন পিন তৈরি' : '🎲 Generate PIN'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-neutral-500">
                    {language === 'bn'
                      ? 'সংরক্ষণ করার পর তাৎক্ষণিকভাবে ক্লাউড ডাটাবেসে সেভ হবে।'
                      : 'Syncs immediately to Cloud DB upon saving.'}
                  </p>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    {passwordLoading
                      ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                      : (language === 'bn' ? 'পাসওয়ার্ড সংরক্ষণ' : 'Save Password')}
                  </button>
                </div>
              </form>
            </div>

            {/* Tasks assigned to this member */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    {language === 'bn' ? 'আমার দায়িত্বপ্রাপ্ত টাস্কসমূহ' : 'My Assigned Project Tasks'}
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-neutral-100 rounded text-neutral-700">
                  {toBengaliNumber(myTasks.length)}
                </span>
              </div>

              {myTasks.length === 0 ? (
                <div className="text-center py-6 text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-lg">
                  {language === 'bn' ? 'আপনাকে কোনো টাস্ক বরাদ্দ করা হয়নি' : 'No tasks assigned currently'}
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((t) => (
                    <div key={t.id} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-neutral-900 leading-snug">{t.title}</h4>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                          t.status === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-800'
                        }`}>
                          {t.status}
                        </span>
                      </div>

                      {t.checklist.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-neutral-200">
                          {t.checklist.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleTaskChecklist(t.id, item.id)}
                              className="flex items-center gap-1.5 text-left text-[11px] text-neutral-700 hover:text-neutral-900 w-full cursor-pointer"
                            >
                              {item.done ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              )}
                              <span className={item.done ? 'line-through text-neutral-400' : ''}>{item.text}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] text-neutral-500 font-mono pt-1">
                        {language === 'bn' ? 'মেয়াদ:' : 'Due:'} {formatDate(t.dueDate, language)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Modal */}
          {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
              <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 flex flex-col max-h-[90vh] my-auto animate-scaleUp">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-emerald-300" />
                    <div>
                      <h3 className="text-sm sm:text-base font-bold leading-tight">
                        {language === 'bn' ? 'আমার প্রোফাইল তথ্য সম্পাদনা' : 'Edit Member Profile'}
                      </h3>
                      <p className="text-[11px] text-emerald-200/80 font-mono">
                        {currentMember.memberNo} · {language === 'bn' ? currentMember.nameBn : currentMember.nameEn}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Container with flexible scrollable body & sticky footer */}
                <form onSubmit={handleProfileUpdate} className="flex flex-col flex-1 min-h-0">
                  {/* Scrollable Form Body */}
                  <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {profileSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-850 border border-emerald-300 rounded-xl font-semibold text-center flex items-center justify-center gap-2 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{profileSuccess}</span>
                      </div>
                    )}

                    {/* Profile Photo & Crop Section */}
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1.5">
                        {language === 'bn' ? 'প্রোফাইল ছবি পরিবর্তন ও ক্রপ' : 'Profile Picture & Crop'}
                      </label>
                      <div className="flex items-center gap-3.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <div className="w-14 h-14 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xl overflow-hidden border-2 border-white shadow-xs shrink-0">
                          {editPhotoUrl ? (
                            <img src={editPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            currentMember.nameEn.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCropImageSrc(reader.result as string);
                                  setIsCropModalOpen(true);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full text-xs text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                          />
                          <p className="text-[10px] text-neutral-500 mt-1">
                            {language === 'bn' ? 'ছবি নির্বাচন করলে ফেস ক্রপ মোডাল ওপেন হবে।' : 'Select an image to frame and crop your face.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Phone & Date of Birth */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          {language === 'bn' ? 'মোবাইল নম্বর (Phone Number)' : 'Mobile Phone'}
                        </label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="017xxxxxxxx"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs bg-white text-neutral-900"
                        />
                      </div>

                      <div>
                        <DateInput
                          label={language === 'bn' ? 'জন্মতারিখ (Date of Birth)' : 'Date of Birth'}
                          value={editDob}
                          onChange={(val) => setEditDob(val)}
                        />
                      </div>
                    </div>

                    {/* Permanent Address */}
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        {language === 'bn' ? 'স্থায়ী ঠিকানা (Address)' : 'Address'}
                      </label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder={language === 'bn' ? 'আপনার গ্রাম, ডাকঘর, থানা ও জেলা লিখুন' : 'Enter village, post office, upazila, district'}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white text-neutral-900"
                      />
                    </div>

                    {/* Nominee Header */}
                    <div className="pt-2 border-t border-neutral-200">
                      <div className="flex items-center gap-1.5 mb-2">
                        <HeartHandshake className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">
                          {language === 'bn' ? 'নমিনি সম্পর্কিত তথ্য (Nominee Info)' : 'Nominee Information'}
                        </h4>
                      </div>
                    </div>

                    {/* Nominee Name & Relation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          {language === 'bn' ? 'নমিনির নাম (Nominee Name)' : 'Nominee Name'}
                        </label>
                        <input
                          type="text"
                          value={editNomineeName}
                          onChange={(e) => setEditNomineeName(e.target.value)}
                          placeholder={language === 'bn' ? 'নমিনির পূর্ণ নাম' : 'Full Name of Nominee'}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          {language === 'bn' ? 'সম্পর্ক (Relation)' : 'Relation'}
                        </label>
                        <input
                          type="text"
                          value={editNomineeRelation}
                          onChange={(e) => setEditNomineeRelation(e.target.value)}
                          placeholder={language === 'bn' ? 'যেমন: স্ত্রী / স্বামী / পুত্র / কন্যা' : 'e.g. Wife / Son / Mother'}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white text-neutral-900"
                        />
                      </div>
                    </div>

                    {/* Nominee Phone & NID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          {language === 'bn' ? 'নমিনির মোবাইল নম্বর' : 'Nominee Phone'}
                        </label>
                        <input
                          type="tel"
                          value={editNomineePhone}
                          onChange={(e) => setEditNomineePhone(e.target.value)}
                          placeholder="017xxxxxxxx"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs bg-white text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          {language === 'bn' ? 'নমিনির জাতীয় পরিচয়পত্র (NID) নং' : 'Nominee NID Number'}
                        </label>
                        <input
                          type="text"
                          value={editNomineeNid}
                          onChange={(e) => setEditNomineeNid(e.target.value)}
                          placeholder={language === 'bn' ? 'যেমন: 1990xxxxxxxxxx' : 'e.g. 1990xxxxxxxxxx'}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs bg-white text-neutral-900"
                        />
                      </div>
                    </div>

                    {/* Bottom safety notice */}
                    <p className="text-[11px] text-neutral-500 pt-1">
                      {language === 'bn'
                        ? 'তথ্য পরিবর্তন করার পর "পরিবর্তন সংরক্ষণ করুন" চাপুন। এটি সাথে সাথে সেন্ট্রাল ক্লাউডে সেভ হবে।'
                        : 'Changes will be saved immediately to the central cloud database.'}
                    </p>
                  </div>

                  {/* Sticky / Fixed Bottom Action Bar */}
                  <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-5 sm:px-6 py-3.5 z-10 shadow-lg flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PASSBOOK SUB-TAB */}
      {activePortalSubTab === 'passbook' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <div>
                  <h2 className="text-base font-bold text-neutral-900">
                    {language === 'bn' ? `সদস্য পাসবই খতিয়ান (${currentMember.nameBn})` : `Member Passbook Ledger (${currentMember.nameEn})`}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {language === 'bn' ? `সদস্য নং: ${currentMember.memberNo} · সঞ্চয় ও কিস্তির ব্যক্তিগত বিবরণী` : `Member No: ${currentMember.memberNo} · Personal Savings & Installment records`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'পাসবই প্রিন্ট' : 'Print Passbook'}</span>
              </button>
            </div>

            {/* 4 Financial Stat Cards for Passbook */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                <div className="text-[11px] font-medium text-emerald-800 uppercase tracking-wide">
                  {language === 'bn' ? 'আমার মোট জমা সঞ্চয়' : 'Total Savings Deposited'}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-emerald-800 mt-1">
                  {formatCurrency(currentMember.totalSavingsDeposited, language)}
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                  {language === 'bn' ? 'মাসিক ধার্য কিস্তি' : 'Monthly Savings Kisti'}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
                  {formatCurrency(currentMember.monthlySavingsCommitment, language)}
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                  {language === 'bn' ? 'মালিকানাধীন শেয়ার' : 'Owned Shares'}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
                  {language === 'bn' ? `${toBengaliNumber(currentMember.shareCount)} টি` : `${currentMember.shareCount} Shares`}
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80">
                <div className="text-[11px] font-medium text-blue-800 uppercase tracking-wide">
                  {language === 'bn' ? 'শেয়ারের মোট মূল্য' : 'Total Share Value'}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-blue-800 mt-1">
                  {formatCurrency(currentMember.shareCount * currentMember.shareFaceValue, language)}
                </div>
              </div>
            </div>
          </div>

          {/* Passbook Statement Table */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-neutral-900">
                  {language === 'bn' ? 'পাসবই লেনদেন বিবরণী' : 'Passbook Transaction Records'}
                </h3>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                {language === 'bn' ? `মোট লেনদেন: ${toBengaliNumber(myTransactions.length)} টি` : `${myTransactions.length} Entries`}
              </span>
            </div>

            {myTransactions.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-lg">
                {language === 'bn' ? 'আপনার কোনো স্টেটমেন্ট রেকর্ড পাওয়া যায়নি' : 'No statement records found for your account'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">রসিদ নং</th>
                      <th className="py-2.5 px-3 font-sans">কিস্তির মাস</th>
                      <th className="py-2.5 px-3 font-sans">খাত</th>
                      <th className="py-2.5 px-3 text-right">মূল জমা (৳)</th>
                      <th className="py-2.5 px-3 text-right">জরিমানা (৳)</th>
                      <th className="py-2.5 px-3 text-right">মোট পরিশোধ (৳)</th>
                      <th className="py-2.5 px-3 text-center font-sans">মাধ্যম</th>
                      <th className="py-2.5 px-3 text-center font-sans">রসিদ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {myTransactions.map((tx) => {
                      const principal = tx.principalAmount !== undefined ? tx.principalAmount : (tx.type === 'savings' ? Math.max(0, tx.amount - (tx.fineAmount || 0)) : tx.amount);
                      const fine = tx.fineAmount || 0;
                      const total = tx.totalPaid !== undefined ? tx.totalPaid : tx.amount;

                      return (
                        <tr key={tx.id} className="hover:bg-neutral-50/80">
                          <td className="py-2.5 px-3 text-neutral-700 font-semibold">{formatDate(tx.date, language)}</td>
                          <td className="py-2.5 px-3 font-semibold text-neutral-900">{tx.receiptNo}</td>
                          <td className="py-2.5 px-3 text-neutral-800 font-semibold">{tx.targetMonth || tx.periodMonth || '-'}</td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              tx.type === 'savings' ? 'bg-emerald-100 text-emerald-800' :
                              tx.type === 'loan_repayment' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {tx.type === 'savings' ? (language === 'bn' ? 'সঞ্চয় কিস্তি' : 'Savings Deposit') :
                               tx.type === 'loan_repayment' ? (language === 'bn' ? 'ঋণ পরিশোধ' : 'Loan Repayment') : (language === 'bn' ? 'প্রকল্প চাঁদা' : 'Project Contribution')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                            {formatCurrency(principal, language)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {fine > 0 ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                +{formatCurrency(fine, language)}
                              </span>
                            ) : (
                              <span className="text-neutral-400">০ ৳</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-neutral-900 text-sm">
                            {formatCurrency(total, language)}
                          </td>
                          <td className="py-2.5 px-3 text-center uppercase text-[10px] text-neutral-500 font-sans">
                            {tx.paymentMethod}
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            <button
                              onClick={() => onOpenReceipt(tx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 text-neutral-700 rounded transition-colors text-[11px] cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>রসিদ</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Loan Account if any */}
          {myLoan && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    {language === 'bn' ? 'আমার চলমান ঋণ হিসাব' : 'My Active Loan Account'}
                  </h3>
                </div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                  {myLoan.loanNo}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 block font-sans">মূল ঋণ:</span>
                  <strong>{formatCurrency(myLoan.principalAmount, language)}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block font-sans">পরিশোধিত:</span>
                  <strong className="text-emerald-700">{formatCurrency(myLoan.paidAmount, language)}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block font-sans">বকেয়া ঋণ:</span>
                  <strong className="text-red-600">{formatCurrency(myLoan.remainingAmount, language)}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block font-sans">প্রতি কিস্তি:</span>
                  <strong className="text-neutral-900">{formatCurrency(myLoan.installmentAmount, language)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. DASHBOARD / PERSONAL FINANCIAL SUB-TAB (Only shown when activePortalSubTab === 'dashboard') */}
      {activePortalSubTab === 'dashboard' && isDashboardEnabled && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-neutral-900">
                  {language === 'bn' ? `আমার আর্থিক ড্যাশবোর্ড (${currentMember.nameBn})` : `My Financial Dashboard (${currentMember.nameEn})`}
                </h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                {language === 'bn' ? 'ব্যক্তিগত হিসাব' : 'Personal Account'}
              </span>
            </div>

            {/* 4 Financial Stat Cards for this Member */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                <div className="text-[11px] font-medium text-emerald-800 uppercase tracking-wide">
                  {language === 'bn' ? 'আমার মোট জমা সঞ্চয়' : 'Total Savings Deposited'}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-emerald-800 mt-1">
                  {formatCurrency(currentMember.totalSavingsDeposited, language)}
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                  {language === 'bn' ? 'মাসিক ধার্য কিস্তি' : 'Monthly Savings Kisti'}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
                  {formatCurrency(currentMember.monthlySavingsCommitment, language)}
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                  {language === 'bn' ? 'মালিকানাধীন শেয়ার' : 'Owned Shares'}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
                  {language === 'bn' ? `${toBengaliNumber(currentMember.shareCount)} টি` : `${currentMember.shareCount} Shares`}
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80">
                <div className="text-[11px] font-medium text-blue-800 uppercase tracking-wide">
                  {language === 'bn' ? 'শেয়ারের মোট মূল্য' : 'Total Share Value'}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-blue-800 mt-1">
                  {formatCurrency(currentMember.shareCount * currentMember.shareFaceValue, language)}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Statement Table & Active Loan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-neutral-900">
                      {language === 'bn' ? `আমার আর্থিক স্টেটমেন্ট` : `My Personal Statement`}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    {language === 'bn' ? `রেকর্ড (${toBengaliNumber(myTransactions.length)} টি)` : `${myTransactions.length} Entries`}
                  </span>
                </div>

                {myTransactions.length === 0 ? (
                  <div className="text-center py-10 text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-lg">
                    {language === 'bn' ? 'আপনার কোনো স্টেটমেন্ট রেকর্ড পাওয়া যায়নি' : 'No statement records found'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold border-b border-neutral-200">
                        <tr>
                          <th className="py-2.5 px-3">তারিখ</th>
                          <th className="py-2.5 px-3">রসিদ নং</th>
                          <th className="py-2.5 px-3">বিবরণ</th>
                          <th className="py-2.5 px-3">মাস</th>
                          <th className="py-2.5 px-3 text-right">জমা</th>
                          <th className="py-2.5 px-3 text-center">রসিদ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {myTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-neutral-50/80">
                            <td className="py-2.5 px-3 text-neutral-600">{formatDate(tx.date, language)}</td>
                            <td className="py-2.5 px-3 font-semibold text-neutral-900">{tx.receiptNo}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                tx.type === 'savings' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {tx.type === 'savings' ? (language === 'bn' ? 'সঞ্চয় কিস্তি' : 'Savings Deposit') : (language === 'bn' ? 'ঋণ পরিশোধ' : 'Loan Repayment')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-neutral-600">{tx.periodMonth || '-'}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                              {formatCurrency(tx.amount, language)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <button
                                onClick={() => onOpenReceipt(tx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 text-neutral-700 rounded transition-colors text-[11px] cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>রসিদ</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Active Loan */}
            <div className="space-y-6">
              {myLoan && (
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <h3 className="text-sm font-bold text-neutral-900">{language === 'bn' ? 'চলমান ঋণ হিসাব' : 'Active Loan'}</h3>
                    </div>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">{myLoan.loanNo}</span>
                  </div>
                  <div className="space-y-2 bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">মূল ঋণ:</span>
                      <strong>{formatCurrency(myLoan.principalAmount, language)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">বকেয়া:</span>
                      <strong className="text-red-600">{formatCurrency(myLoan.remainingAmount, language)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. LOAN ACCOUNT SUB-TAB */}
      {activePortalSubTab === 'loan' && isLoanEnabled && (
        <div className="space-y-6">
          {activeLoan ? (
            <>
              {/* Active Loan Details Card */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-neutral-900">
                          {language === 'bn' ? 'আমার চলমান ঋণ হিসাব' : 'My Active Loan Account'}
                        </h2>
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full border border-rose-200">
                          {activeLoan.loanNo}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {language === 'bn' ? `ঋণের উদ্দেশ্য: ${activeLoan.purpose}` : `Purpose: ${activeLoan.purpose}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {language === 'bn' ? 'চলমান ঋণ (Active)' : 'Active Loan'}
                    </span>
                  </div>
                </div>

                {/* 4 Metric Boxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                      {language === 'bn' ? 'মূল ঋণ (Principal)' : 'Principal Amount'}
                    </div>
                    <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-1">
                      {formatCurrency(activeLoan.principalAmount, language)}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      {language === 'bn' ? `লাভ হার: ${toBengaliNumber(activeLoan.profitServiceRatePercent)}%` : `Profit Rate: ${activeLoan.profitServiceRatePercent}%`}
                    </div>
                  </div>

                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                      {language === 'bn' ? 'মোট পরিশোধযোগ্য' : 'Total Payable'}
                    </div>
                    <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-1">
                      {formatCurrency(activeLoan.totalPayable, language)}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      {language === 'bn' ? `মোট কিস্তি: ${toBengaliNumber(activeLoan.totalInstallments)} টি` : `Total Installments: ${activeLoan.totalInstallments}`}
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="text-[11px] font-medium text-emerald-800 uppercase tracking-wide">
                      {language === 'bn' ? 'পরিশোধিত টাকা' : 'Paid Amount'}
                    </div>
                    <div className="text-lg font-bold font-mono tabular-nums text-emerald-800 mt-1">
                      {formatCurrency(activeLoan.paidAmount, language)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      {language === 'bn' ? `পরিশোধিত: ${toBengaliNumber(activeLoan.paidInstallments)}/${toBengaliNumber(activeLoan.totalInstallments)} কিস্তি` : `Paid: ${activeLoan.paidInstallments}/${activeLoan.totalInstallments} Installments`}
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
                    <div className="text-[11px] font-medium text-rose-800 uppercase tracking-wide">
                      {language === 'bn' ? 'অবশিষ্ট বকেয়া ঋণ' : 'Remaining Due'}
                    </div>
                    <div className="text-lg font-bold font-mono tabular-nums text-rose-700 mt-1">
                      {formatCurrency(activeLoan.remainingAmount, language)}
                    </div>
                    <div className="text-[10px] text-neutral-600 mt-0.5">
                      {language === 'bn' ? `প্রতি কিস্তি: ${formatCurrency(activeLoan.installmentAmount, language)}` : `Per Installment: ${formatCurrency(activeLoan.installmentAmount, language)}`}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-600">
                      {language === 'bn' ? 'ঋণ পরিশোধের অগ্রগতি' : 'Repayment Progress'}
                    </span>
                    <span className="text-emerald-800 font-mono font-bold">
                      {toBengaliNumber(Math.min(100, Math.round((activeLoan.paidAmount / (activeLoan.totalPayable || 1)) * 100)))}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((activeLoan.paidAmount / (activeLoan.totalPayable || 1)) * 100))}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-500 pt-1 font-mono">
                    <span>{language === 'bn' ? 'প্রদানের তারিখ:' : 'Disbursed:'} {formatDate(activeLoan.disbursedDate, language)}</span>
                    <span>{language === 'bn' ? 'পরবর্তী কিস্তির তারিখ:' : 'Next Due:'} {formatDate(activeLoan.dueDate, language)}</span>
                  </div>
                </div>
              </div>

              {/* Loan Repayment Transactions Table */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-neutral-900">
                      {language === 'bn' ? 'ঋণ কিস্তি পরিশোধের রসিদ ও বিবরণী' : 'Loan Repayment History'}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 bg-rose-100 text-rose-800 rounded">
                    {language === 'bn' ? `${toBengaliNumber(myLoanTransactions.length)} টি কিস্তি পরিশোধ` : `${myLoanTransactions.length} Payments`}
                  </span>
                </div>

                {myLoanTransactions.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-lg">
                    {language === 'bn' ? 'এখনো কোনো ঋণ কিস্তি পরিশোধ রেকর্ড করা হয়নি' : 'No repayment transactions recorded yet'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold border-b border-neutral-200">
                        <tr>
                          <th className="py-2.5 px-3">তারিখ</th>
                          <th className="py-2.5 px-3">রসিদ নং</th>
                          <th className="py-2.5 px-3">মাস</th>
                          <th className="py-2.5 px-3 text-right">পরিশোধিত কিস্তি</th>
                          <th className="py-2.5 px-3 text-center">মাধ্যম</th>
                          <th className="py-2.5 px-3 text-center">রসিদ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {myLoanTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-neutral-50/80">
                            <td className="py-2.5 px-3 text-neutral-600">{formatDate(tx.date, language)}</td>
                            <td className="py-2.5 px-3 font-semibold text-neutral-900">{tx.receiptNo}</td>
                            <td className="py-2.5 px-3 text-neutral-600">{tx.periodMonth || '-'}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                              {formatCurrency(tx.amount, language)}
                            </td>
                            <td className="py-2.5 px-3 text-center uppercase text-[10px] text-neutral-500 font-sans">
                              {tx.paymentMethod}
                            </td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <button
                                onClick={() => onOpenReceipt(tx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 text-neutral-700 rounded transition-colors text-[11px] cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>{language === 'bn' ? 'রসিদ' : 'Receipt'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* No Active Loan Display */
            <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 shadow-xs text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-neutral-900">
                  {language === 'bn' ? 'আপনার বর্তমানে কোনো ঋণ বকেয়া বা সক্রিয় ঋণ নেই' : 'You currently have no active or outstanding loan'}
                </h3>
                <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                  {language === 'bn'
                    ? 'সমিতির গঠনতন্ত্র ও নীতিমালা অনুযায়ী শেয়ার আমানত ও সঞ্চয় স্থিতি সাপেক্ষে জরুরী প্রয়োজনে ঋণ সুবিধা গ্রহণের সুযোগ রয়েছে।'
                    : 'According to somiti bylaws, emergency loan facilities can be accessed against your share capital and savings balance.'}
                </p>
              </div>

              {/* Info strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2 text-left">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                  <span className="font-bold text-neutral-800 block">১. সঞ্চয় জামানত</span>
                  <span className="text-neutral-500 text-[11px]">জমা সঞ্চয় ও শেয়ারের বিপরীতে ঋণ প্রদান</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                  <span className="font-bold text-neutral-800 block">২. সহজ কিস্তি</span>
                  <span className="text-neutral-500 text-[11px]">সহজ মাসিক কিস্তিতে পরিশোধযোগ্য</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                  <span className="font-bold text-neutral-800 block">৩. আবেদন প্রক্রিয়া</span>
                  <span className="text-neutral-500 text-[11px]">ক্যাশিয়ার বা সভাপতি সমীপে আবেদন</span>
                </div>
              </div>
            </div>
          )}

          {/* Previous Repaid Loans Table if any */}
          {repaidLoans.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-neutral-900">
                  {language === 'bn' ? 'পূর্বের পরিশোধিত ঋণসমূহ' : 'Previously Repaid Loans'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">ঋণ নং</th>
                      <th className="py-2 px-3">উদ্দেশ্য</th>
                      <th className="py-2 px-3 text-right">মূল ঋণ</th>
                      <th className="py-2 px-3 text-right">পরিশোধিত</th>
                      <th className="py-2 px-3 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {repaidLoans.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 px-3 font-bold">{l.loanNo}</td>
                        <td className="py-2 px-3 font-sans text-neutral-700">{l.purpose}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatCurrency(l.principalAmount, language)}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-800">{formatCurrency(l.paidAmount, language)}</td>
                        <td className="py-2 px-3 text-center font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {language === 'bn' ? 'পরিশোধিত' : 'Repaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. INVESTMENT PORTFOLIO SUB-TAB (TRANSPARENT VIEW) */}
      {activePortalSubTab === 'investment' && (() => {
        const totalInvested = projects.reduce(
          (sum, p) => sum + (p.investedAmount || p.targetBudget || 0),
          0
        );
        const totalProfitEarned = projects.reduce(
          (sum, p) => sum + (p.totalProfit || 0),
          0
        );
        const overallRoiPercent =
          totalInvested > 0 ? ((totalProfitEarned / totalInvested) * 100).toFixed(1) : '0.0';

        return (
          <div className="space-y-6">
            {/* =========================================================================
                UNIFIED TWO-STAGE ARCHITECTURE (MEMBER PORTAL)
                Stage 1: Projects Directory & Selector (when selectedInvestmentProjectId === null)
                Stage 2: Selected Project Details & 4 Clean Tabs (when selectedInvestmentProjectId !== null)
                ========================================================================= */}

            {selectedInvestmentProjectId === null ? (
              /* ======================== STAGE 1: PROJECTS DIRECTORY & SELECTOR ======================== */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header & Overall Summary Banner */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <FolderKanban className="w-5 h-5 text-emerald-800" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                          <span>{language === 'bn' ? 'সংস্থার বিনিয়োগ ও পোর্টফোলিও' : 'Organization Investment & Portfolio'}</span>
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {language === 'bn'
                            ? 'সমিতির মূল তহবিল হতে সদস্যদের যৌথ কল্যাণে পরিচালিত কৃষি জমি লিজ ও অন্যান্য প্রকল্পের স্বচ্ছ হিসাব ও বিবরণী।'
                            : 'Transparent records, land lease agreements, lessor info, and profit ledger for all active Somiti investments.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top Summary KPIs (Single Instance, No Duplication) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200 shadow-2xs">
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase block">
                        {language === 'bn' ? 'মোট সক্রিয় প্রকল্প' : 'Active Projects'}
                      </span>
                      <div className="text-lg sm:text-xl font-black font-mono text-neutral-900 mt-1">
                        {language === 'bn' ? `${toBengaliNumber(projects.length)} টি` : `${projects.length}`}
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-0.5 block">
                        {language === 'bn' ? 'সকল প্রকল্প সুরক্ষিত' : 'Secure Somiti Assets'}
                      </span>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200 shadow-2xs">
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase block">
                        {language === 'bn' ? 'মোট মূলধন বিনিয়োগ' : 'Total Capital Invested'}
                      </span>
                      <div className="text-lg sm:text-xl font-black font-mono text-neutral-900 mt-1">
                        {formatCurrency(totalInvested, language)}
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-0.5 block">
                        {language === 'bn' ? 'সমিতির কেন্দ্রীয় সঞ্চয় তহবিল' : 'From Somiti Funds'}
                      </span>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 shadow-2xs">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase block flex items-center justify-between">
                        <span>{language === 'bn' ? 'মোট অর্জিত মুনাফা' : 'Total Profit Earned'}</span>
                        <span className="text-[9px] bg-emerald-800 text-white px-1.5 py-0.2 rounded-full font-mono">
                          +{toBengaliNumber(overallRoiPercent)}%
                        </span>
                      </span>
                      <div className="text-lg sm:text-xl font-black font-mono text-emerald-800 mt-1">
                        +{formatCurrency(totalProfitEarned, language)}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                        {language === 'bn' ? 'ক্যাশবুকে জমা ও সংরক্ষিত' : 'Credited to Cashbook'}
                      </span>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl bg-teal-50/90 border border-teal-300 shadow-2xs">
                      <span className="text-[11px] font-bold text-teal-900 uppercase block">
                        {language === 'bn' ? 'সদস্য অংশীদারিত্ব' : 'Member Equity'}
                      </span>
                      <div className="text-lg sm:text-xl font-black font-mono text-teal-900 mt-1">
                        ১০০%
                      </div>
                      <span className="text-[10px] text-teal-700 font-medium mt-0.5 block">
                        {language === 'bn' ? 'সঞ্চয়ের অনুপাতে সুরক্ষিত' : 'Proportional to Savings'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                {projects.length === 0 ? (
                  <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-12 text-center text-neutral-400">
                    <FolderKanban className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <p className="text-sm font-semibold text-neutral-600">
                      {language === 'bn' ? 'বর্তমানে কোনো বিনিয়োগ প্রকল্প রেকর্ড করা নেই।' : 'No investment projects recorded yet.'}
                    </p>
                  </div>
                ) : (
                  /* Projects Directory List (Compact Cards - STRICT: No inner details/long text stacked here) */
                  <div className="space-y-3">
                    {projects.map((project, idx) => {
                      const prjInvested = project.investedAmount || project.targetBudget || 0;
                      const prjProfit = project.totalProfit || 0;
                      const roiPercent = prjInvested > 0 ? Math.round((prjProfit / prjInvested) * 100) : 0;
                      const isLand = project.category === 'land_lease' || project.category === 'agriculture';
                      const isShare = project.category === 'share_partnership';
                      const icon = isLand ? '🌾' : isShare ? '🤝' : '💼';
                      const catLabel = isLand
                        ? (language === 'bn' ? 'কৃষি জমি লিজ' : 'Land Lease')
                        : isShare
                        ? (language === 'bn' ? 'শেয়ার অংশীদারিত্ব' : 'Share Partnership')
                        : (language === 'bn' ? 'সাধারণ বিনিয়োগ' : 'General Investment');
                      const ownerName = isLand
                        ? project.landownerName || project.contactName || 'হাজী মোকাররম হোসেন'
                        : isShare
                        ? project.partnerNames || project.contactName || 'পার্টনার্স'
                        : project.recipientName || project.contactName || 'উদ্যোক্তা';

                      return (
                        <div
                          key={project.id}
                          className="bg-white border border-neutral-200 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-neutral-900 text-white font-bold">
                                {project.code}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <span>{icon}</span>
                                <span>{catLabel}</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                <span>{project.status === 'in_progress' ? (language === 'bn' ? 'চলমান প্রকল্প' : 'Active Project') : (language === 'bn' ? 'সম্পন্ন' : 'Completed')}</span>
                              </span>
                            </div>

                            <div>
                              <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">
                                {language === 'bn' ? `প্রজেক্ট ${toBengaliNumber(idx + 1)}: ${project.titleBn}` : `Project ${idx + 1}: ${project.titleEn || project.titleBn}`}
                              </h3>
                              {project.titleEn && language === 'bn' && (
                                <p className="text-xs text-neutral-400 font-mono mt-0.5">{project.titleEn}</p>
                              )}
                            </div>

                            {/* Compact Metrics Row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-600 pt-1">
                              <div className="flex items-center gap-1 font-semibold text-neutral-900">
                                <span className="text-neutral-400 font-normal">মূলধন:</span>
                                <span className="font-mono">{formatCurrency(prjInvested, language)}</span>
                              </div>
                              <div className="flex items-center gap-1 font-bold text-emerald-800">
                                <span className="text-neutral-400 font-normal">লাভ:</span>
                                <span className="font-mono">+{formatCurrency(prjProfit, language)} ({toBengaliNumber(roiPercent)}%)</span>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-600">
                                <User className="w-3.5 h-3.5 text-neutral-400" />
                                <span>{ownerName}</span>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-500 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                <span>{project.startDate || '২০২৪'} - {project.targetEndDate || '২০২৬'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                            <button
                              onClick={() => {
                                setSelectedInvestmentProjectId(project.id);
                                setSelectedInvestmentTab('summary');
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              <span>{language === 'bn' ? 'বিস্তারিত দেখুন →' : 'View Details →'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ======================== STAGE 2: SELECTED PROJECT DETAILS ======================== */
              (() => {
                const proj = projects.find((p) => p.id === selectedInvestmentProjectId) || projects[0];
                if (!proj) return null;
                const leadMember = members.find((m) => m.id === proj.leadMemberId);
                const leadName = leadMember
                  ? (language === 'bn' ? leadMember.nameBn : leadMember.nameEn)
                  : 'মিলন তালুকদার (ক্যাশিয়ার)';
                const leadPhone = leadMember?.phone || '০১৭১১-২২৩৩৪৪';
                const investedAmount = proj.investedAmount || proj.targetBudget || 100000;
                const profit = proj.totalProfit || 0;
                const profitDate = proj.profitDate || '2025-08-24';
                const voucherNo = proj.profitVoucherNo || proj.profitHistory?.[0]?.voucherNo || 'CB-2025-081';
                const profitNotes = proj.profitHistory?.[0]?.notes || proj.description || '';
                const landOwnerName = proj.landownerName || proj.contactName || 'হাজী মোকাররম হোসেন';
                const contactPhone = proj.contactPhone || proj.recipientPhone || '০১৭১২-৩৪৫৬৭৮';
                const contactAddress = proj.contactAddress || proj.recipientAddress || 'সিতাইকুন্ড পূর্বপাড়া, কোটালীপাড়া, গোপালগঞ্জ';
                const landAreaDagNo = proj.landAreaDagNo || '৫০ শতক (দাগ নং: ৪১২, খতিয়ান নং: ৮৮)';
                const leaseDuration = proj.leaseDuration || '২ বছর (২০২৪ - ২০২৬)';
                const cleanPhone = contactPhone.replace(/[^0-9+]/g, '');

                const isLandLease = proj.category === 'land_lease' || proj.category === 'agriculture';
                const isShare = proj.category === 'share_partnership';
                const roi = investedAmount > 0 ? Math.round((profit / investedAmount) * 100) : 11;

                return (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Top Navigation Bar */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedInvestmentProjectId(null)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>{language === 'bn' ? '← সকল প্রজেক্টে ফিরুন' : '← Back to Projects List'}</span>
                        </button>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-neutral-900 text-white font-bold">
                              {proj.code}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <span>{isLandLease ? '🌾' : isShare ? '🤝' : '💼'}</span>
                              <span>
                                {isLandLease
                                  ? (language === 'bn' ? 'কৃষি জমি লিজ / বন্ধক' : 'Agricultural Land Lease')
                                  : isShare
                                  ? (language === 'bn' ? 'শেয়ার অংশীদারিত্ব' : 'Share Partnership')
                                  : (language === 'bn' ? 'সাধারণ বিনিয়োগ' : 'General Investment')}
                              </span>
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              proj.status === 'in_progress'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-blue-50 text-blue-800 border border-blue-300'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>{proj.status === 'in_progress' ? (language === 'bn' ? 'চলমান প্রকল্প' : 'Active Project') : (language === 'bn' ? 'সম্পন্ন' : 'Completed')}</span>
                            </span>
                          </div>
                          <h2 className="text-lg sm:text-xl font-black text-neutral-900 leading-tight">
                            {language === 'bn' ? proj.titleBn : proj.titleEn}
                          </h2>
                        </div>
                      </div>

                      {/* Quick Contact & Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {contactPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                            title={language === 'bn' ? 'মালিক/যোগাযোগ ব্যক্তির সাথে সরাসরি কথা বলুন' : 'Call Contact'}
                          >
                            <Phone className="w-4 h-4 text-emerald-200" />
                            <span>{language === 'bn' ? 'যোগাযোগ করুন (কল)' : 'Call Contact'}</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedInvestmentForDetails(proj)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-neutral-600" />
                          <span>{language === 'bn' ? 'পূর্ণ বিবরণ ও চুক্তি' : 'Full Agreement'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Project Header (Mini-Financial Bar - single instance, NO duplication!) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
                      <div>
                        <span className="text-[11px] text-emerald-200 font-semibold uppercase block">
                          {language === 'bn' ? 'বরাদ্দকৃত মূলধন' : 'Allocated Capital'}
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
                          {formatCurrency(investedAmount, language)}
                        </div>
                        <span className="text-[10px] text-emerald-300">সমিতির তহবিল হতে</span>
                      </div>

                      <div>
                        <span className="text-[11px] text-emerald-200 font-semibold uppercase block">
                          {language === 'bn' ? 'অর্জিত মোট নিট মুনাফা' : 'Net Profit Earned'}
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300 mt-0.5">
                          +{formatCurrency(profit, language)}
                        </div>
                        <span className="text-[10px] text-emerald-300">ক্যাশবুকে সংরক্ষিত</span>
                      </div>

                      <div>
                        <span className="text-[11px] text-emerald-200 font-semibold uppercase block">
                          {language === 'bn' ? 'মুনাফার শতকরা হার' : 'Return Yield (ROI)'}
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
                          {toBengaliNumber(roi)}%
                        </div>
                        <span className="text-[10px] text-emerald-300">প্রত্যাশিত: {toBengaliNumber(proj.expectedReturnPercent || 11)}%</span>
                      </div>

                      <div>
                        <span className="text-[11px] text-emerald-200 font-semibold uppercase block">
                          {language === 'bn' ? 'দায়িত্বপ্রাপ্ত তত্ত্বাবধায়ক' : 'Project Lead'}
                        </span>
                        <div className="text-sm sm:text-base font-bold mt-1 truncate">
                          {leadName}
                        </div>
                        <span className="text-[10px] text-emerald-300">ক্যাশিয়ারের তত্ত্বাবধানে</span>
                      </div>
                    </div>

                    {/* 4 Clean Segmented Tabs (Switcher) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setSelectedInvestmentTab('summary')}
                        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          selectedInvestmentTab === 'summary'
                            ? 'bg-emerald-800 text-white shadow-md border-b-2 border-emerald-950 font-black'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200'
                        }`}
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>{language === 'bn' ? '📑 সামারি ও বিবরণ' : 'Summary & Overview'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedInvestmentTab('financials')}
                        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          selectedInvestmentTab === 'financials'
                            ? 'bg-emerald-800 text-white shadow-md border-b-2 border-emerald-950 font-black'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200'
                        }`}
                      >
                        <DollarSign className="w-4 h-4 shrink-0" />
                        <span>{language === 'bn' ? '💰 আর্থিক বিবরণ ও মুনাফা' : 'Financials & Returns'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedInvestmentTab('lessor')}
                        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          selectedInvestmentTab === 'lessor'
                            ? 'bg-emerald-800 text-white shadow-md border-b-2 border-emerald-950 font-black'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200'
                        }`}
                      >
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{language === 'bn' ? '🌾 জমির মালিক / লিজদাতা' : 'Land Owner & Lessor'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedInvestmentTab('supervisor')}
                        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          selectedInvestmentTab === 'supervisor'
                            ? 'bg-emerald-800 text-white shadow-md border-b-2 border-emerald-950 font-black'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200'
                        }`}
                      >
                        <Users className="w-4 h-4 shrink-0" />
                        <span>{language === 'bn' ? '👥 তত্ত্বাবধায়ক ও অংশীদারিত্ব' : 'Supervisor & Equity'}</span>
                      </button>
                    </div>

                    {/* RENDER ONLY ACTIVE TAB'S CONTENT */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-xs">
                      {/* TAB 1: 📑 সামারি ও বিবরণ (Summary & Overview) */}
                      {selectedInvestmentTab === 'summary' && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                          {/* Narrative Callout */}
                          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-neutral-50 border border-emerald-200/80 text-neutral-800 text-xs sm:text-sm leading-relaxed">
                            <div className="flex items-start gap-2.5">
                              <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-emerald-950 block mb-1 text-sm">
                                  {language === 'bn' ? 'প্রকল্পের সারসংক্ষেপ ও বর্তমান চুক্তিপত্র:' : 'Project Summary & Current Agreement:'}
                                </span>
                                <p className="text-neutral-700 whitespace-pre-line">{proj.description}</p>
                              </div>
                            </div>
                          </div>

                          {/* Timeframe & Highlights Grid - NO duplicate capital/profit cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                              <span className="text-[11px] text-neutral-500 uppercase block font-semibold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                                <span>{language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}</span>
                              </span>
                              <div className="text-sm sm:text-base font-bold font-mono text-neutral-900 mt-1">
                                {formatDate(proj.startDate, language)}
                              </div>
                              <span className="text-[11px] text-neutral-500 mt-0.5 block">
                                {language === 'bn' ? 'চুক্তি কার্যকর হওয়ার দিন' : 'Effective date'}
                              </span>
                            </div>

                            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                              <span className="text-[11px] text-neutral-500 uppercase block font-semibold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-neutral-600" />
                                <span>{language === 'bn' ? 'মেয়াদ উত্তীর্ণের তারিখ' : 'Maturity / End Date'}</span>
                              </span>
                              <div className="text-sm sm:text-base font-bold font-mono text-neutral-900 mt-1">
                                {formatDate(proj.targetEndDate, language)}
                              </div>
                              <span className="text-[11px] text-neutral-500 mt-0.5 block">
                                {proj.leaseDuration || (language === 'bn' ? 'চুক্তি সমাপ্তি' : 'Target completion')}
                              </span>
                            </div>

                            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                              <span className="text-[11px] text-neutral-500 uppercase block font-semibold">
                                {language === 'bn' ? 'প্রকল্প ক্যাটাগরি' : 'Category'}
                              </span>
                              <div className="text-sm sm:text-base font-bold text-neutral-900 mt-1">
                                {isLandLease ? 'কৃষি জমি লিজ' : isShare ? 'শেয়ার অংশীদারিত্ব' : 'সাধারণ বিনিয়োগ'}
                              </div>
                              <span className="text-[11px] text-neutral-500 mt-0.5 block">
                                {proj.code}
                              </span>
                            </div>

                            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                              <span className="text-[11px] text-neutral-500 uppercase block font-semibold">
                                {language === 'bn' ? 'চুক্তির মেয়াদকাল' : 'Tenure / Duration'}
                              </span>
                              <div className="text-sm sm:text-base font-bold text-emerald-900 mt-1">
                                {leaseDuration}
                              </div>
                              <span className="text-[11px] text-emerald-700 mt-0.5 block">
                                {language === 'bn' ? 'নবায়নযোগ্য চুক্তি' : 'Renewable'}
                              </span>
                            </div>
                          </div>

                          {/* Verification Note */}
                          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>
                                {language === 'bn'
                                  ? 'এই প্রকল্পটি ফ্রেন্ড ইনিশিয়েটিভ অর্গানাইজেশন এর নির্বাহী পরিষদ কর্তৃক অনুমোদিত এবং সম্পূর্ণ স্বচ্ছ।'
                                  : 'This project is officially verified and audited by the Somiti Executive Board.'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedInvestmentTab('financials')}
                              className="text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>আর্থিক বিবরণ ও মুনাফা দেখুন</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: 💰 আর্থিক বিবরণ ও মুনাফা (Financial Breakdown & Returns) */}
                      {selectedInvestmentTab === 'financials' && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <DollarSign className="w-4 h-4 text-emerald-700" />
                              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-wider">
                                {language === 'bn' ? 'আর্থিক হিসাব ও অর্জিত লভ্যাংশ (Financial Breakdown)' : 'Financial Breakdown & Return'}
                              </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                              {/* Invested Capital */}
                              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase block">
                                  {language === 'bn' ? 'মোট বিনিয়োগকৃত অর্থ' : 'Capital Invested'}
                                </span>
                                <div className="text-xl sm:text-2xl font-black font-mono text-neutral-900 mt-1">
                                  {formatCurrency(investedAmount, language)}
                                </div>
                                <span className="text-[11px] text-neutral-500 mt-1 block">
                                  {language === 'bn' ? 'সমিতির মূল তহবিল হতে বিনিয়োগ' : 'Disbursed from Somiti Fund'}
                                </span>
                              </div>

                              {/* Profit Earned */}
                              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-emerald-900 uppercase">
                                    {language === 'bn' ? 'অর্জিত মোট লভ্যাংশ' : 'Total Profit Earned'}
                                  </span>
                                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-800 text-white">
                                    +{toBengaliNumber(roi)}% লাভ
                                  </span>
                                </div>
                                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 mt-1">
                                  +{formatCurrency(profit, language)}
                                </div>
                                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                                  {language === 'bn' ? 'নগদ নিট লাভ আদায় ও জমা' : 'Net Cash Profit Received'}
                                </span>
                              </div>

                              {/* Profit Date & Voucher */}
                              <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-300">
                                <span className="text-[11px] font-bold text-teal-900 uppercase block">
                                  {language === 'bn' ? 'লভ্যাংশের তারিখ ও ভাউচার' : 'Profit Date & Voucher'}
                                </span>
                                <div className="text-sm font-bold text-neutral-900 mt-1 flex items-center gap-1.5 font-mono">
                                  <Calendar className="w-4 h-4 text-teal-700" />
                                  <span>{formatDate(profitDate, language)}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-1.5">
                                  <span className="text-[11px] text-neutral-600 font-semibold">ভাউচার নং:</span>
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-teal-300 text-teal-900">
                                    {voucherNo}
                                  </span>
                                </div>
                              </div>

                              {/* Expected Return Rate */}
                              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase block">
                                  {language === 'bn' ? 'প্রত্যাশিত রিটার্ন ও স্থায়িত্ব' : 'Expected Return & Tenure'}
                                </span>
                                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 mt-1">
                                  {toBengaliNumber(proj.expectedReturnPercent || 11)}%
                                </div>
                                <span className="text-[11px] text-neutral-600 font-medium mt-1 block">
                                  {proj.leaseDuration || (language === 'bn' ? '২ বছর (২০২৪ - ২০২৬)' : '2 Years')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Profit Payout / Voucher Record Table */}
                          <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                              <span className="text-xs sm:text-sm text-emerald-950 uppercase font-bold tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                <span>{language === 'bn' ? 'অর্জিত মুনাফা আদায়ের বিবরণ ও ভাউচার খতিয়ান' : 'Recorded Profit Voucher Ledger'}</span>
                              </span>
                              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-800 text-white">
                                ভাউচার: {voucherNo}
                              </span>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs space-y-2 shadow-2xs">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-neutral-900 gap-1">
                                <span className="text-sm">
                                  {isLandLease
                                    ? (language === 'bn' ? 'জমি লিজ হতে বার্ষিক নগদ লভ্যাংশ আদায়' : 'Lease Profit Distribution')
                                    : (language === 'bn' ? 'বিনিয়োগ হতে মুনাফা আদায়' : 'Investment Returns')}
                                </span>
                                <span className="font-mono text-emerald-800 text-base font-black">
                                  +{formatCurrency(profit, language)}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-600 leading-relaxed">
                                {profitNotes || (language === 'bn' ? 'গত বছর ২৪/০৮/২০২৫ তারিখে জমি লিজ থেকে ১১,০০০ টাকা নিট লাভ সমিতিতে জমা হয়েছে।' : 'Net lease profit deposited to central Somiti funds.')}
                              </div>
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100 font-mono gap-2">
                                <div className="flex items-center gap-2">
                                  <span>আদায়ের তারিখ: {formatDate(profitDate, language)}</span>
                                  <span>·</span>
                                  <span>আদায়কারী: {leadName}</span>
                                </div>
                                <span className="text-emerald-700 font-semibold font-sans bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  ক্যাশবুকে জমা ও নিরীক্ষিত ✅
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Capital Security Note */}
                          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
                            <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                            <p>
                              {language === 'bn'
                                ? 'সমিতির কেন্দ্রীয় সঞ্চয় তহবিল হতে বিনিয়োগকৃত প্রতিটি টাকার সম্পূর্ণ হিসাব ক্যাশবুকে সংরক্ষিত। চুক্তি সমাপ্ত হলে মূলধন সম্পূর্ণ অক্ষত অবস্থায় সমিতির তহবিলে ফেরত আসবে।'
                                : 'All invested capital is fully accounted for in the Somiti cashbook. Upon completion, original capital is returned in full to the reserve fund.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: 🌾 জমির মালিক / লিজদাতা (Land Owner & Lessor) */}
                      {selectedInvestmentTab === 'lessor' && (
                        <div className="space-y-5 animate-in fade-in duration-150">
                          <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 rounded-2xl p-5 sm:p-6 border-2 border-emerald-300 space-y-5 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-4">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">🌿</span>
                                <div>
                                  <h4 className="text-sm sm:text-base font-bold text-emerald-950 uppercase tracking-wider">
                                    {isLandLease
                                      ? (language === 'bn' ? 'জমির মালিক / লিজদাতার তথ্য ও জমির অবস্থান' : 'Land Owner / Lessor Details')
                                      : isShare
                                      ? (language === 'bn' ? 'অংশীদার / পার্টনারদের বিবরণ' : 'Partnership Details')
                                      : (language === 'bn' ? 'প্রাপক ও বিনিয়োগের খাত' : 'Recipient Details')}
                                  </h4>
                                  <span className="text-xs text-emerald-800">
                                    {language === 'bn' ? 'সরাসরি যোগাযোগের নম্বর ও জমির রেজিস্ট্রি দাগ/খতিয়ান' : 'Direct contact details and plot records'}
                                  </span>
                                </div>
                              </div>

                              {contactPhone && (
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
                                >
                                  <Phone className="w-4 h-4" />
                                  <span>{contactPhone} (কল করুন)</span>
                                </a>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                              {/* Owner / Partner Name */}
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
                                <span className="text-[10px] text-neutral-500 uppercase font-semibold flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{isLandLease ? (language === 'bn' ? 'জমির মালিকের নাম' : 'Land Owner Name') : (language === 'bn' ? 'অংশীদার / প্রাপকের নাম' : 'Partner / Recipient')}</span>
                                </span>
                                <strong className="text-neutral-900 text-base mt-1.5 block">
                                  {landOwnerName}
                                </strong>
                                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                                  {language === 'bn' ? 'চুক্তিবদ্ধ মূল মালিক' : 'Primary Contract Party'}
                                </span>
                              </div>

                              {/* Contact Phone */}
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
                                <span className="text-[10px] text-neutral-500 uppercase font-semibold flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{language === 'bn' ? 'মোবাইল / যোগাযোগ নম্বর' : 'Phone Number'}</span>
                                </span>
                                <div className="flex items-center justify-between mt-1.5">
                                  <strong className="text-neutral-900 text-base font-mono">
                                    {contactPhone}
                                  </strong>
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    className="text-xs font-bold text-emerald-800 hover:underline inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                                  >
                                    <span>কল করুন</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>

                              {/* Land Location & Full Address */}
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs sm:col-span-2 lg:col-span-1">
                                <span className="text-[10px] text-neutral-500 uppercase font-semibold flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{language === 'bn' ? 'পূর্ণ ঠিকানা ও জমির অবস্থান' : 'Land Location & Address'}</span>
                                </span>
                                <strong className="text-neutral-900 text-xs mt-1.5 block leading-relaxed">
                                  {contactAddress}
                                </strong>
                              </div>

                              {/* Plot / Dag / Khatian Info */}
                              {isLandLease && (
                                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
                                  <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                                    {language === 'bn' ? 'জমির পরিমাণ ও দাগ/খতিয়ান' : 'Plot & Land Area'}
                                  </span>
                                  <strong className="text-emerald-950 text-sm mt-1.5 block font-bold">
                                    {landAreaDagNo}
                                  </strong>
                                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                                    {language === 'bn' ? 'সরকারি মৌজা ও খতিয়ান নম্বর' : 'Official Plot / Mouza Record'}
                                  </span>
                                </div>
                              )}

                              {/* Lease Duration */}
                              {isLandLease && (
                                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
                                  <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                                    {language === 'bn' ? 'লিজের সময়কাল / মেয়াদ' : 'Lease Duration'}
                                  </span>
                                  <strong className="text-neutral-900 text-sm mt-1.5 block font-bold">
                                    {leaseDuration}
                                  </strong>
                                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                                    {language === 'bn' ? 'চুক্তি অনুযায়ী নির্ধারিত সময়' : 'Standard Agreement Tenure'}
                                  </span>
                                </div>
                              )}

                              {/* Agreement Period Dates */}
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
                                <span className="text-[10px] text-neutral-500 uppercase font-semibold flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{language === 'bn' ? 'চুক্তির সময়কাল' : 'Agreement Period'}</span>
                                </span>
                                <div className="text-xs text-neutral-800 mt-1.5 font-mono space-y-0.5">
                                  <div>{language === 'bn' ? 'শুরু:' : 'Start:'} <strong>{formatDate(proj.startDate, language)}</strong></div>
                                  <div>{language === 'bn' ? 'মেয়াদ শেষ:' : 'End:'} <strong>{formatDate(proj.targetEndDate, language)}</strong></div>
                                </div>
                              </div>
                            </div>

                            {/* Legal & Agreement Status Seal */}
                            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-950 flex items-center gap-2.5">
                              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                              <p className="leading-relaxed">
                                {language === 'bn'
                                  ? 'উক্ত জমির লিজ চুক্তিপত্র সমিতির সাধারণ সভা ও নির্বাহী পরিষদ কর্তৃক স্বাক্ষরিত এবং মূল দলিল ও স্ট্যাম্প ক্যাশিয়ারের হেফাজতে সংরক্ষিত।'
                                  : 'The deed of lease agreement is signed by the executive committee and original stamped documents are held in the treasury.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 4: 👥 তত্ত্বাবধায়ক ও অংশীদারিত্ব (Supervisor & Equity) */}
                      {selectedInvestmentTab === 'supervisor' && (
                        <div className="space-y-5 animate-in fade-in duration-150">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Project In-Charge / Lead Member */}
                            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3">
                              <span className="text-[11px] text-neutral-500 uppercase font-bold tracking-wider block">
                                {language === 'bn' ? 'দায়িত্বপ্রাপ্ত সদস্য ও তত্ত্বাবধায়ক' : 'Project Lead & Supervisor'}
                              </span>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0">
                                  {leadName.slice(0, 1)}
                                </div>
                                <div>
                                  <strong className="text-neutral-900 text-base block">
                                    {leadName}
                                  </strong>
                                  <span className="text-xs text-emerald-800 font-semibold block">
                                    {language === 'bn' ? 'হিসাব তদারকি ও ক্যাশিয়ারের ক্যাশবুকে নিয়মিত এন্ট্রি' : 'Account Supervisor & Cashbook Lead'}
                                  </span>
                                  <span className="text-xs text-neutral-500 font-mono mt-0.5 block">
                                    মোবাইল: {leadPhone}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-neutral-600 leading-relaxed pt-2 border-t border-neutral-200">
                                {language === 'bn'
                                  ? 'সমিতির কার্যনির্বাহী পরিষদ কর্তৃক এই বিনিয়োগ ও এর লভ্যাংশ সরাসরি ক্যাশবুকে লিপিবদ্ধ ও নিরীক্ষিত।'
                                  : 'Supervised by the executive committee. Inflows recorded in the central verified cashbook.'}
                              </p>
                            </div>

                            {/* Member Equity Status */}
                            <div className="bg-teal-50/80 p-5 rounded-2xl border border-teal-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-teal-900 uppercase font-bold tracking-wider">
                                  {language === 'bn' ? 'সদস্য অংশীদারিত্ব ও মালিকানা' : 'Member Equity & Ownership'}
                                </span>
                                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-800 text-white">
                                  ১০০% Somiti Owned
                                </span>
                              </div>

                              <div className="text-2xl font-black text-teal-950 font-mono">
                                ১০০% যৌথ মালিকানা
                              </div>

                              <p className="text-xs text-teal-900 leading-relaxed">
                                {language === 'bn'
                                  ? 'সমিতির সকল বৈধ সদস্যদের মাসিক সঞ্চয় ও শেয়ারের অনুপাতে এই প্রকল্পের সার্বিক মালিকানা ও লভ্যাংশ বণ্টিত।'
                                  : 'Ownership is held proportionally based on monthly savings and shares across all verified Somiti members.'}
                              </p>

                              <div className="pt-2 border-t border-teal-200/80 flex items-center gap-2 text-[11px] text-teal-800 font-semibold">
                                <ShieldCheck className="w-4 h-4 text-teal-700" />
                                <span>{language === 'bn' ? 'সম্পূর্ণ নিরাপদ ও কেন্দ্রীয় রিজার্ভ ফান্ডের আওতাভুক্ত' : 'Protected under Somiti Reserve Fund'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}

            {/* FULL DETAILS MODAL FOR ANY SELECTED INVESTMENT PROJECT */}
            {selectedInvestmentForDetails && (() => {
              const p = selectedInvestmentForDetails;
              const leadMember = members.find((m) => m.id === p.leadMemberId);
              const leadName = leadMember
                ? (language === 'bn' ? leadMember.nameBn : leadMember.nameEn)
                : 'মিলন তালুকদার (ক্যাশিয়ার)';
              const leadPhone = leadMember?.phone || '০১৭১১-২২৩৩৪৪';
              const investedAmount = p.investedAmount || p.targetBudget || 100000;
              const profit = p.totalProfit || 0;
              const profitDate = p.profitDate || '2025-08-24';
              const voucherNo = p.profitVoucherNo || p.profitHistory?.[0]?.voucherNo || 'CB-2025-081';
              const landOwnerName = p.landownerName || p.contactName || 'হাজী মোকাররম হোসেন';
              const contactPhone = p.contactPhone || p.recipientPhone || '০১৭১২-৩৪৫৬৭৮';
              const contactAddress = p.contactAddress || p.recipientAddress || 'সিতাইকুন্ড পূর্বপাড়া, কোটালীপাড়া, গোপালগঞ্জ';
              const landAreaDagNo = p.landAreaDagNo || '৫০ শতক (দাগ নং: ৪১২, খতিয়ান নং: ৮৮)';
              const leaseDuration = p.leaseDuration || '২ বছর (২০২৪ - ২০২৬)';
              const cleanPhone = contactPhone.replace(/[^0-9+]/g, '');

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                  <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 my-8 max-h-[90vh] flex flex-col">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white shrink-0">
                      <div className="flex items-center gap-2.5">
                        <FolderKanban className="w-5 h-5 text-emerald-300" />
                        <div>
                          <h3 className="text-base font-bold">
                            {language === 'bn' ? 'বিনিয়োগ প্রকল্পের পূর্ণ বিবরণ ও চুক্তি' : 'Investment Contract & Full Statement'}
                          </h3>
                          <span className="text-xs text-emerald-200 font-mono">
                            {p.code} · Friend Initiative Organization
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedInvestmentForDetails(null)}
                        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Body (Scrollable) */}
                    <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
                      <div className="border-b border-neutral-200 pb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {p.category === 'land_lease' || p.category === 'agriculture'
                              ? '🌾 কৃষি জমি লিজ / বন্ধক'
                              : '💼 সাধারণ বিনিয়োগ'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-neutral-100 text-neutral-800">
                            {p.code}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-neutral-900">
                          {language === 'bn' ? p.titleBn : p.titleEn}
                        </h4>
                        <p className="text-neutral-600 text-xs mt-1 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      {/* Financials in Modal */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                          <span className="text-[10px] text-neutral-500 uppercase font-semibold block">বিনিয়োগকৃত মূলধন</span>
                          <span className="font-mono font-bold text-neutral-900 text-sm mt-1 block">
                            {formatCurrency(investedAmount, language)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                          <span className="text-[10px] text-emerald-900 uppercase font-semibold block">অর্জিত মুনাফা</span>
                          <span className="font-mono font-black text-emerald-800 text-sm mt-1 block">
                            +{formatCurrency(profit, language)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                          <span className="text-[10px] text-neutral-500 uppercase font-semibold block">লভ্যাংশের তারিখ</span>
                          <span className="font-mono font-bold text-neutral-800 text-xs mt-1 block">
                            {formatDate(profitDate, language)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                          <span className="text-[10px] text-neutral-500 uppercase font-semibold block">ক্যাশিয়ার ভাউচার</span>
                          <span className="font-mono font-bold text-emerald-900 text-xs mt-1 block">
                            {voucherNo}
                          </span>
                        </div>
                      </div>

                      {/* Lessor / Landowner Details */}
                      <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                          <strong className="text-emerald-950 font-bold flex items-center gap-1.5">
                            <User className="w-4 h-4 text-emerald-800" />
                            <span>জমির মালিক / লিজদাতার তথ্যাবলী:</span>
                          </strong>
                          {contactPhone && (
                            <a
                              href={`tel:${cleanPhone}`}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>কল করুন</span>
                            </a>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-neutral-500 block text-[11px]">মালিকের পূর্ণ নাম:</span>
                            <strong className="text-neutral-900">{landOwnerName}</strong>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[11px]">মোবাইল নম্বর:</span>
                            <strong className="text-neutral-900 font-mono">{contactPhone}</strong>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-neutral-500 block text-[11px]">জমির পূর্ণ অবস্থান ও ঠিকানা:</span>
                            <strong className="text-neutral-900">{contactAddress}</strong>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[11px]">জমির পরিমাণ ও দাগ/খতিয়ান:</span>
                            <strong className="text-neutral-900">{landAreaDagNo}</strong>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[11px]">লিজ চুক্তির মেয়াদ:</span>
                            <strong className="text-neutral-900">{leaseDuration} ({formatDate(p.startDate, language)} - {formatDate(p.targetEndDate, language)})</strong>
                          </div>
                        </div>
                      </div>

                      {/* Supervisor Info */}
                      <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase font-bold block">দায়িত্বপ্রাপ্ত সদস্য / তত্ত্বাবধায়ক</span>
                          <strong className="text-neutral-900 text-xs mt-0.5 block">{leadName}</strong>
                          <span className="text-[11px] text-neutral-500 font-mono">মোবাইল: {leadPhone}</span>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          অনুমোদিত বিনিয়োগ
                        </span>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between shrink-0">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3.5 py-1.5 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>প্রিন্ট করুন</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedInvestmentForDetails(null)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                      >
                        বন্ধ করুন
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* 6. STATEMENT (DATE-WISE LEDGER) SUB-TAB */}
      {activePortalSubTab === 'statement' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-800">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                    {language === 'bn' ? 'সদস্য নিজস্ব লেনদেন স্টেটমেন্ট' : 'Personal Member Statement'}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold border border-teal-200">
                      {currentMember.memberNo}
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {language === 'bn'
                      ? 'শুধুমাত্র আপনার ব্যক্তিগত জমা ও কিস্তির তারিখভিত্তিক হিসাব ও ভাউচার বিবরণী।'
                      : 'Itemized date-wise transaction ledger and vouchers for your member account only.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Export & Print Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportStatementCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                title={language === 'bn' ? 'CSV ফাইলে স্টেটমেন্ট ডাউনলোড' : 'Download statement as CSV'}
              >
                <Download className="w-3.5 h-3.5 text-teal-300" />
                <span>{language === 'bn' ? 'CSV এক্সপোর্ট' : 'Export CSV'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 rounded-xl transition-colors cursor-pointer"
                title={language === 'bn' ? 'স্টেটমেন্ট প্রিন্ট করুন' : 'Print Statement'}
              >
                <Printer className="w-3.5 h-3.5 text-neutral-600" />
                <span>{language === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
              </button>
            </div>
          </div>

          {/* Quick Date Range Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-neutral-500 mr-1 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {language === 'bn' ? 'তারিখ ফিল্টার:' : 'Date Presets:'}
            </span>
            <button
              type="button"
              onClick={() => handleSetDatePreset('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                !statementStartDate && !statementEndDate
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'bn' ? 'সব সময় (All)' : 'All Time'}
            </button>
            <button
              type="button"
              onClick={() => handleSetDatePreset('this_month')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statementStartDate.startsWith('2026-03')
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'bn' ? 'চলতি মাস (This Month)' : 'This Month'}
            </button>
            <button
              type="button"
              onClick={() => handleSetDatePreset('last_month')}
              className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'গত মাস (Last Month)' : 'Last Month'}
            </button>
            <button
              type="button"
              onClick={() => handleSetDatePreset('last_3_months')}
              className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'গত ৩ মাস' : 'Last 3 Months'}
            </button>
            <button
              type="button"
              onClick={() => handleSetDatePreset('this_year')}
              className="px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'চলতি বছর (This Year)' : 'This Year'}
            </button>
          </div>

          {/* Detailed Filters Bar: Start Date, End Date, Type Filter, Search, Sort */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <DateInput
                label={language === 'bn' ? 'শুরুর তারিখ (From)' : 'Start Date'}
                value={statementStartDate}
                onChange={(val) => setStatementStartDate(val)}
              />
            </div>
            <div>
              <DateInput
                label={language === 'bn' ? 'শেষের তারিখ (To)' : 'End Date'}
                value={statementEndDate}
                onChange={(val) => setStatementEndDate(val)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                {language === 'bn' ? 'লেনদেনের ধরন (Type)' : 'Transaction Type'}
              </label>
              <select
                value={statementTypeFilter}
                onChange={(e) => setStatementTypeFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="all">{language === 'bn' ? 'সকল লেনদেন' : 'All Types'}</option>
                <option value="savings">{language === 'bn' ? 'নিয়মিত সঞ্চয় জমা' : 'Savings Deposit'}</option>
                <option value="loan_repayment">{language === 'bn' ? 'ঋণ কিস্তি পরিশোধ' : 'Loan Repayment'}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                {language === 'bn' ? 'খুঁজুন (Search)' : 'Search'}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'রসিদ নং, মাস বা বিবরণ...' : 'Receipt, month...'}
                  value={statementSearchQuery}
                  onChange={(e) => setStatementSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setStatementSortOrder(statementSortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex-1 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title={language === 'bn' ? 'তারিখের ক্রমানুসারে সাজান' : 'Toggle Date Sort'}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                <span>{statementSortOrder === 'desc' ? (language === 'bn' ? 'নতুন আগে' : 'Newest') : (language === 'bn' ? 'পুরানো আগে' : 'Oldest')}</span>
              </button>
              {(statementStartDate || statementEndDate || statementTypeFilter !== 'all' || statementSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatementStartDate('');
                    setStatementEndDate('');
                    setStatementTypeFilter('all');
                    setStatementSearchQuery('');
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  title={language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset Filters'}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Summary KPI Cards for the filtered range */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[11px] font-semibold text-neutral-500 block">
                {language === 'bn' ? 'ফিল্টারকৃত মোট লেনদেন' : 'Filtered Transactions'}
              </span>
              <span className="text-lg font-black text-neutral-900 font-mono mt-0.5 block">
                {toBengaliNumber(filteredStatementTxs.length)} {language === 'bn' ? 'টি' : 'txns'}
              </span>
            </div>
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800 block">
                {language === 'bn' ? 'মোট মূল সঞ্চয় জমা' : 'Principal Savings'}
              </span>
              <span className="text-lg font-black text-emerald-900 font-mono mt-0.5 block">
                {formatCurrency(statementPrincipalSavings, language)}
              </span>
            </div>
            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
              <span className="text-[11px] font-semibold text-amber-900 block">
                {language === 'bn' ? 'মোট জরিমানা ও ফি' : 'Total Late Fees'}
              </span>
              <span className="text-lg font-black text-amber-900 font-mono mt-0.5 block">
                {formatCurrency(statementFineTotal, language)}
              </span>
            </div>
            <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200">
              <span className="text-[11px] font-semibold text-teal-800 block">
                {language === 'bn' ? 'মোট পরিশোধ / আদায়' : 'Total Deposited'}
              </span>
              <span className="text-lg font-black text-teal-900 font-mono mt-0.5 block">
                {formatCurrency(statementTotalCredit, language)}
              </span>
            </div>
          </div>

          {/* Date-wise Transactions Table */}
          {filteredStatementTxs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-200 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-700">
                {language === 'bn'
                  ? 'এই নির্বাচিত তারিখ বা ফিল্টারে কোনো লেনদেন পাওয়া যায়নি'
                  : 'No transactions found for the selected date range'}
              </p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'তারিখ পরিবর্তন করুন অথবা ফিল্টার রিসেট করে সকল লেনদেন দেখুন।'
                  : 'Adjust the date range or clear filters to view all recorded transactions.'}
              </p>
              <button
                type="button"
                onClick={() => handleSetDatePreset('all')}
                className="px-4 py-2 text-xs font-bold bg-teal-800 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                {language === 'bn' ? 'সকল লেনদেন দেখুন' : 'Show All Transactions'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-3">তারিখ</th>
                    <th className="py-3 px-3">রসিদ নং</th>
                    <th className="py-3 px-3 font-sans">কিস্তির মাস</th>
                    <th className="py-3 px-3 font-sans">খাত</th>
                    <th className="py-3 px-3 text-right">মূল জমা (৳)</th>
                    <th className="py-3 px-3 text-right">জরিমানা (৳)</th>
                    <th className="py-3 px-3 text-right">মোট জমা (৳)</th>
                    <th className="py-3 px-3 text-center font-sans">মাধ্যম</th>
                    <th className="py-3 px-3 text-center font-sans">রসিদ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredStatementTxs.map((tx) => {
                    const principal = tx.principalAmount !== undefined ? tx.principalAmount : (tx.type === 'savings' ? Math.max(0, tx.amount - (tx.fineAmount || 0)) : tx.amount);
                    const fine = tx.fineAmount || 0;
                    const total = tx.totalPaid !== undefined ? tx.totalPaid : tx.amount;

                    return (
                      <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-neutral-900 whitespace-nowrap">
                          {formatDate(tx.date, language)}
                        </td>
                        <td className="py-3 px-3 text-teal-800 font-bold whitespace-nowrap">
                          {tx.receiptNo}
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-800 font-semibold">
                          {tx.targetMonth || tx.periodMonth || '-'}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'savings'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {tx.type === 'savings'
                              ? (language === 'bn' ? 'নিয়মিত সঞ্চয়' : 'Monthly Savings')
                              : (language === 'bn' ? 'ঋণ কিস্তি' : 'Loan Installment')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-800">
                          {formatCurrency(principal, language)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          {fine > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              +{formatCurrency(fine, language)}
                            </span>
                          ) : (
                            <span className="text-neutral-400">০ ৳</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-neutral-900 text-sm">
                          {formatCurrency(total, language)}
                        </td>
                        <td className="py-3 px-3 text-center font-sans uppercase text-[10px] text-neutral-600">
                          <span className="px-1.5 py-0.5 bg-neutral-100 rounded font-bold">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-sans">
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(tx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-800 text-neutral-700 border border-neutral-200 rounded transition-colors text-[11px] cursor-pointer shadow-2xs"
                            title={language === 'bn' ? 'ডিজিটাল রসিদ দেখুন' : 'View receipt voucher'}
                          >
                            <ExternalLink className="w-3 h-3 text-teal-600" />
                            <span>{language === 'bn' ? 'রসিদ' : 'Receipt'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-neutral-50 border-t-2 border-neutral-200 font-bold">
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-right text-xs text-neutral-700 font-sans">
                      {language === 'bn' ? 'সর্বমোট (Total):' : 'Total:'}
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-emerald-800 font-black">
                      {formatCurrency(statementPrincipalSavings, language)}
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-amber-800 font-black">
                      {formatCurrency(statementFineTotal, language)}
                    </td>
                    <td className="py-3 px-3 text-right text-base text-teal-900 font-black">
                      {formatCurrency(statementTotalCredit, language)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Transparency footnote */}
          <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                {language === 'bn'
                  ? 'এই স্টেটমেন্টটি বন্ধু উদ্যোক্তা সমবায় সমিতির সেন্ট্রাল ডিজিটাল লেজারের সাথে সম্পূর্ণ সিঙ্কড।'
                  : 'This statement is synchronized in real-time with Friend Initiative Organization official ledger.'}
              </span>
            </span>
            <span className="font-mono text-[11px] text-neutral-400">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* 7. RULES SUB-TAB */}
      {activePortalSubTab === 'rules' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                {language === 'bn' ? 'বন্ধু উদ্যোক্তা সমবায় সমিতি - রুলস ও সংবিধান' : 'Friend Initiative Organization - Rules & Constitution'}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {language === 'bn' ? 'প্রতিষ্ঠার তারিখ: ১০/০৯/২০২৪ · ১০টি মৌলিক বিধিমালা' : 'Established: 10/09/2024 · 10 Core Rules'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rulesList.map((rule, idx) => (
              <div key={idx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {toBengaliNumber(idx + 1)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">{rule.title}</h3>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Crop Modal */}
      <PhotoCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        language={language}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={(croppedUrl) => {
          updateMemberPhoto(currentMember.id, croppedUrl);
          setEditPhotoUrl(croppedUrl);
        }}
      />
    </div>
  );
};

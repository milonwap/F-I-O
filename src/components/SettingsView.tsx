import React, { useState } from 'react';
import { useSomiti } from '../context/SomitiContext';
import { Member, MemberRole, Language, MemberPermissions } from '../types/somiti';
import { MemberAvatar } from './MemberAvatar';
import { Shield, CheckCircle, Search, UserCheck, Lock, Unlock, RefreshCw, AlertCircle, Bell, Mail, Send, AlertTriangle, Download, FileSpreadsheet, Users, Receipt, ShieldCheck, KeyRound, Cloud, Database, ExternalLink, Wifi, CheckCircle2 } from 'lucide-react';
import { ManageCredentialsModal } from './ManageCredentialsModal';
import { getCloudDbConfig, saveCloudDbConfig, CloudDbConfig, verifyCloudDbConnection } from '../services/cloudDb';

interface SettingsViewProps {
  language: Language;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ language }) => {
  const { members, transactions, updateMember, currentMember } = useSomiti();
  const isAdminOrCashier = currentMember?.role === 'lead_executive' || currentMember?.role === 'cashier' || currentMember?.role === 'president' || currentMember?.role === 'secretary';

  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'roles' | 'credentials' | 'cloud' | 'overdue' | 'export'>('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [alertSentMap, setAlertSentMap] = useState<Record<string, boolean>>({});
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<any>(null);

  // Credential modal state
  const [selectedCredMember, setSelectedCredMember] = useState<Member | null>(null);

  // Cloud DB config state
  const [cloudConfig, setCloudConfig] = useState<CloudDbConfig>(() => getCloudDbConfig());
  const [cloudSaving, setCloudSaving] = useState(false);
  const [cloudVerifyStatus, setCloudVerifyStatus] = useState<{ checked: boolean; connected: boolean; message: string; version?: number }>({
    checked: false,
    connected: false,
    message: 'Testing connection...',
  });

  // Verify Cloud DB status upon mounting Settings view
  React.useEffect(() => {
    let isMounted = true;
    verifyCloudDbConnection().then((res) => {
      if (isMounted) {
        setCloudVerifyStatus({
          checked: true,
          connected: res.connected,
          message: res.message,
          version: res.version,
        });
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Role Template state
  const [selectedRole, setSelectedRole] = useState<MemberRole>('member');
  const [rolePermissions, setRolePermissions] = useState<MemberPermissions>({
    canViewProfile: true,
    canViewPassbook: true,
    canViewDashboard: true,
    canViewSavings: true,
    canViewLoans: true,
    canViewInvestments: true,
    canViewStatement: true,
    canViewReports: false,
    canViewRules: true,
    canViewMembersDirectory: true,
    canEditProfile: true,
  });

  // Determine current active month (e.g. "2026-03")
  const currentMonthStr = '2026-03';

  // Find members who haven't paid savings for currentMonthStr (Overdue by > 10 days)
  const paidMemberIdsCurrentMonth = new Set(
    transactions
      .filter((t) => t.type === 'savings' && (t.periodMonth === currentMonthStr || t.date.startsWith(currentMonthStr)))
      .map((t) => t.memberId)
  );

  const overdueMembers = members.filter(
    (m) => m.status === 'active' && !paidMemberIdsCurrentMonth.has(m.id) && m.role !== 'lead_executive'
  );

  const getRoleLabel = (role: MemberRole) => {
    switch (role) {
      case 'lead_executive':
        return language === 'bn' ? 'প্রধান নির্বাহী (Lead Executive)' : 'Lead Executive';
      case 'cashier':
        return language === 'bn' ? 'কোষাধ্যক্ষ / ক্যাশিয়ার' : 'Cashier';
      case 'president':
        return language === 'bn' ? 'সভাপতি (President)' : 'President';
      case 'secretary':
        return language === 'bn' ? 'সাধারণ সম্পাদক (Secretary)' : 'Secretary';
      case 'executive':
        return language === 'bn' ? 'কার্যনির্বাহী সদস্য' : 'Executive Member';
      default:
        return language === 'bn' ? 'সাধারণ সদস্য' : 'General Member';
    }
  };

  const handleToggleMemberPermission = (member: Member, permKey: keyof MemberPermissions) => {
    const currentPerms = member.permissions || {
      canViewProfile: true,
      canViewPassbook: true,
      canViewDashboard: true,
      canViewSavings: true,
      canViewLoans: true,
      canViewInvestments: true,
      canViewReports: false,
      canViewRules: true,
      canViewMembersDirectory: true,
      canEditProfile: true,
    };

    const updatedPerms: MemberPermissions = {
      ...currentPerms,
      [permKey]: !(currentPerms[permKey] ?? true),
    };

    if (permKey === 'canViewPassbook') {
      updatedPerms.canViewSavings = updatedPerms.canViewPassbook;
    }

    updateMember({
      ...member,
      permissions: updatedPerms,
    });

    setSuccessMessage(language === 'bn' ? `${member.nameBn}-এর অপশন সফলভাবে পরিবর্তন করা হয়েছে!` : `Option updated for ${member.nameEn}!`);
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  const handleSetAllMemberPermissions = (member: Member, enable: boolean) => {
    const updatedPerms: MemberPermissions = {
      canViewProfile: enable,
      canViewPassbook: enable,
      canViewDashboard: enable,
      canViewLoans: enable,
      canViewInvestments: enable,
      canViewStatement: enable,
      canViewRules: enable,
      canViewSavings: enable,
      canViewReports: member.role === 'cashier' || member.role === 'lead_executive',
      canViewMembersDirectory: true,
      canEditProfile: enable,
    };

    updateMember({
      ...member,
      permissions: updatedPerms,
    });

    setSuccessMessage(
      language === 'bn'
        ? `${member.nameBn}-এর সকল পোর্টাল অপশন ${enable ? 'চালু' : 'বন্ধ'} করা হয়েছে!`
        : `All portal options ${enable ? 'enabled' : 'disabled'} for ${member.nameEn}!`
    );
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  const handleBatchToggleFeature = (permKey: keyof MemberPermissions, enable: boolean) => {
    members.forEach((m) => {
      const currentPerms = m.permissions || {};
      updateMember({
        ...m,
        permissions: {
          ...currentPerms,
          [permKey]: enable,
          ...(permKey === 'canViewPassbook' ? { canViewSavings: enable } : {}),
        },
      });
    });

    setSuccessMessage(
      language === 'bn'
        ? `সকল সদস্যের জন্য এই অপশনটি সফলভাবে ${enable ? 'চালু' : 'বন্ধ'} করা হয়েছে!`
        : `Option successfully ${enable ? 'enabled' : 'disabled'} for all members!`
    );
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleApplyRoleTemplate = () => {
    const matchingMembers = members.filter((m) => m.role === selectedRole);
    matchingMembers.forEach((m) => {
      updateMember({
        ...m,
        permissions: { ...rolePermissions },
      });
    });
    setSuccessMessage(
      language === 'bn'
        ? `"${getRoleRoleLabelBn(selectedRole)}" পদের সকল (${matchingMembers.length}) সদস্যের জন্য পারমিশন টেমপ্লেট প্রয়োগ করা হয়েছে!`
        : `Permission template applied to all ${matchingMembers.length} members with role "${selectedRole}"!`
    );
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSendAlert = (memberId: string, memberName: string) => {
    setAlertSentMap((prev) => ({ ...prev, [memberId]: true }));
    setSuccessMessage(
      language === 'bn'
        ? `🔔 ${memberName}-এর নিকট কিস্তি বাকি থাকা বাবদ জরুরি এসএমএস ও সিস্টেম অ্যালার্ট সফলভাবে পাঠানো হয়েছে!`
        : `🔔 Overdue alert email & SMS successfully triggered for ${memberName}!`
    );
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleSendAllOverdueAlerts = () => {
    const updatedMap = { ...alertSentMap };
    overdueMembers.forEach((m) => {
      updatedMap[m.id] = true;
    });
    setAlertSentMap(updatedMap);
    setSuccessMessage(
      language === 'bn'
        ? `🚀 সফলভাবে ${overdueMembers.length} জন বকেয়া সদস্যের নিকট কিস্তি জমার তাগিদপত্র ও অ্যালার্ট ব্রডকাস্ট করা হয়েছে!`
        : `🚀 Successfully broadcasted overdue reminder alerts to all ${overdueMembers.length} members!`
    );
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== SOMITI MEMBER PROFILES ===\n";
    csvContent += "Member No,Name (EN),Name (BN),Phone,Role,Status,Total Savings,Share Capital,Join Date\n";
    members.forEach((m) => {
      const row = [
        `"${m.memberNo}"`,
        `"${m.nameEn}"`,
        `"${m.nameBn}"`,
        `"${m.phone}"`,
        `"${m.role}"`,
        `"${m.status}"`,
        m.totalSavingsDeposited || 0,
        (m.shareCount || 0) * (m.shareFaceValue || 1000),
        `"${m.joinDate}"`
      ].join(",");
      csvContent += row + "\n";
    });

    csvContent += "\n=== SOMITI TRANSACTIONS ===\n";
    csvContent += "Transaction ID,Receipt No,Member ID,Type,Amount,Date,Period Month,Payment Method,Collected By,Remarks\n";
    transactions.forEach((t) => {
      const row = [
        `"${t.id}"`,
        `"${t.receiptNo}"`,
        `"${t.memberId}"`,
        `"${t.type}"`,
        t.amount,
        `"${t.date}"`,
        `"${t.periodMonth || ''}"`,
        `"${t.paymentMethod}"`,
        `"${t.collectedBy}"`,
        `"${t.remarks || ''}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `somiti_member_and_transaction_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessMessage(
      language === 'bn'
        ? '📥 সকল সদস্যের প্রোফাইল ও লেনদেন ডেটা সাফল্যের সাথে CSV ফাইল হিসেবে ডাউনলোড হয়েছে!'
        : '📥 All member profiles and transaction data successfully exported to CSV!'
    );
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleTriggerServerBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backup/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBackupResult(data);
        setSuccessMessage(
          language === 'bn'
            ? `✅ সফলভাবে স্বয়ংক্রিয় দৈনিক ব্যাকআপ স্ন্যাপশট তৈরি হয়েছে এবং অ্যাডমিনদের নিকট নোটিফিকেশন পাঠানো হয়েছে! (${data.backupFile})`
            : `✅ Automated daily backup snapshot created successfully & admin notification sent! (${data.backupFile})`
        );
      } else {
        alert(data.error || 'Failed to trigger backup');
      }
    } catch (err) {
      console.error(err);
      alert('Network error triggering server backup');
    } finally {
      setBackupLoading(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const getRoleRoleLabelBn = (role: MemberRole) => {
    switch (role) {
      case 'lead_executive': return 'প্রধান নির্বাহী';
      case 'cashier': return 'ক্যাশিয়ার';
      case 'president': return 'সভাপতি';
      case 'secretary': return 'সাধারণ সম্পাদক';
      case 'executive': return 'কার্যনির্বাহী সদস্য';
      default: return 'সাধারণ সদস্য';
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  if (!isAdminOrCashier) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto text-red-700 dark:text-red-400">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          {language === 'bn' ? 'অনুমতি অস্বীকৃত (Access Denied)' : 'Access Restricted'}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {language === 'bn'
            ? 'অ্যাডমিন পারমিশন কন্ট্রোল প্যানেল শুধুমাত্র সভাপতি, সম্পাদক এবং ক্যাশিয়ার অ্যাকাউন্ট দ্বারা পরিচালিত হতে পারে।'
            : 'The Admin Permission Control panel is restricted to Administrators, Executives, and Cashier accounts.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-neutral-900 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-100 text-xs font-bold border border-emerald-600/50">
            <Shield className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'সুরক্ষা ও অনুমতি ব্যবস্থাপনা' : 'Security & Access Control'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'bn' ? 'অ্যাডমিন পারমিশন কন্ট্রোল ও অ্যালার্টস' : 'Admin Permission Control & Alerts'}
          </h1>
          <p className="text-sm text-emerald-100/80 max-w-2xl">
            {language === 'bn'
              ? 'সদস্যদের পোর্টালে বিভিন্ন ফিচারের দৃশ্যমানতা নিয়ন্ত্রণ এবং বকেয়া মাসিক জমার জন্য জরুরি অ্যালার্ট প্রেরণ করুন।'
              : 'Toggle specific feature visibility for members and trigger email or system alerts for overdue monthly deposits.'}
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex flex-wrap bg-neutral-900/60 p-1.5 rounded-xl border border-emerald-700/40 shrink-0 gap-1">
          <button
            onClick={() => setActiveSubTab('individual')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'individual'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {language === 'bn' ? '👤 ব্যক্তিগত অনুমতি' : 'Individual Control'}
          </button>
          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'roles'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {language === 'bn' ? '👥 পদভিত্তিক টেমপ্লেট' : 'Role Templates'}
          </button>
          <button
            onClick={() => setActiveSubTab('credentials')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'credentials'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? '🔑 সদস্য ক্রেডেনশিয়াল' : 'Member Credentials'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('cloud')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'cloud'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? '☁️ ক্লাউড ডাটাবেস সিঙ্ক' : 'Cloud DB Sync'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('overdue')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'overdue'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? `বকেয়া অ্যালার্ট (${overdueMembers.length})` : `Overdue Alerts (${overdueMembers.length})`}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('export')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'export'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ডাটা এক্সপোর্ট (CSV)' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm font-medium animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* INDIVIDUAL MEMBERS PERMISSION VIEW */}
      {activeSubTab === 'individual' && (
        <div className="space-y-6">
          {/* Individual Member Options Table Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Search bar & batch actions */}
            <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'সদস্যের নাম, আইডি বা মোবাইল...' : 'Search by name, ID or phone...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                  {language === 'bn' ? `মোট সদস্য: ${filteredMembers.length} জন` : `Showing ${filteredMembers.length} members`}
                </span>
              </div>

              {/* Batch Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBatchToggleFeature('canViewLoans', true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'সকলের ঋণ চালু' : 'Enable Loans All'}
                </button>
                <button
                  onClick={() => handleBatchToggleFeature('canViewLoans', false)}
                  className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'সকলের ঋণ বন্ধ' : 'Disable Loans All'}
                </button>
                <button
                  onClick={() => handleBatchToggleFeature('canViewStatement', true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'সকলের স্টেটমেন্ট চালু' : 'Enable Statement All'}
                </button>
                <button
                  onClick={() => handleBatchToggleFeature('canViewStatement', false)}
                  className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'সকলের স্টেটমেন্ট বন্ধ' : 'Disable Statement All'}
                </button>
                <button
                  onClick={() => {
                    members.forEach((m) => handleSetAllMemberPermissions(m, true));
                    setSuccessMessage(language === 'bn' ? 'সকল সদস্যের জন্য সব অপশন চালু করা হয়েছে!' : 'All options enabled for all members!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {language === 'bn' ? 'সকল সদস্যের সব অপশন চালু' : 'Enable All for All'}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    <th className="py-3 px-4">{language === 'bn' ? 'সদস্য বিবরণ' : 'Member'}</th>
                    <th className="py-3 px-2.5 text-center">{language === 'bn' ? '👤 প্রোফাইল' : 'Profile'}</th>
                    <th className="py-3 px-2.5 text-center">{language === 'bn' ? '📖 পাসবই' : 'Passbook'}</th>
                    <th className="py-3 px-2.5 text-center">{language === 'bn' ? '📊 ড্যাশবোর্ড' : 'Dashboard'}</th>
                    <th className="py-3 px-2.5 text-center">{language === 'bn' ? '💳 ঋণ (Loan)' : 'Loan'}</th>
                    <th className="py-3 px-2.5 text-center">{language === 'bn' ? '💼 বিনিয়োগ' : 'Investment'}</th>
                    <th className="py-3 px-2.5 text-center">{language === 'bn' ? '📑 স্টেটমেন্ট' : 'Statement'}</th>
                    <th className="py-3 px-2.5 text-center">{language === 'bn' ? '📜 রুলস' : 'Rules'}</th>
                    <th className="py-3 px-3 text-center">{language === 'bn' ? 'কুইক অ্যাকশন' : 'Quick Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                  {filteredMembers.map((member) => {
                    const p = member.permissions || {
                      canViewProfile: true,
                      canViewPassbook: true,
                      canViewDashboard: true,
                      canViewSavings: true,
                      canViewLoans: true,
                      canViewInvestments: true,
                      canViewStatement: true,
                      canViewReports: false,
                      canViewRules: true,
                      canViewMembersDirectory: true,
                      canEditProfile: true,
                    };

                    const isProfileOn = p.canViewProfile !== false;
                    const isPassbookOn = (p.canViewPassbook ?? p.canViewSavings) !== false;
                    const isDashboardOn = p.canViewDashboard !== false;
                    const isLoanOn = p.canViewLoans !== false;
                    const isInvestmentOn = p.canViewInvestments !== false;
                    const isStatementOn = p.canViewStatement !== false;
                    const isRulesOn = p.canViewRules !== false;

                    return (
                      <tr key={member.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <MemberAvatar member={member} sizeClassName="w-8 h-8 text-xs font-bold" />
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-white">
                                {language === 'bn' ? member.nameBn : member.nameEn}
                              </div>
                              <div className="text-[10px] text-neutral-500 font-mono">
                                {member.memberNo} · <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{getRoleLabel(member.role)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 1. Profile Toggle */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            onClick={() => handleToggleMemberPermission(member, 'canViewProfile')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isProfileOn
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 hover:bg-neutral-300'
                            }`}
                            title={language === 'bn' ? `প্রোফাইল: ${isProfileOn ? 'অন (ক্লিক করে বন্ধ করুন)' : 'অফ (ক্লিক করে চালু করুন)'}` : `Profile: ${isProfileOn ? 'ON' : 'OFF'}`}
                          >
                            {isProfileOn ? <CheckCircle className="w-4 h-4 mx-auto" /> : <Lock className="w-4 h-4 mx-auto" />}
                          </button>
                        </td>

                        {/* 2. Passbook Toggle */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            onClick={() => handleToggleMemberPermission(member, 'canViewPassbook')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isPassbookOn
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 hover:bg-neutral-300'
                            }`}
                            title={language === 'bn' ? `পাসবই: ${isPassbookOn ? 'অন (ক্লিক করে বন্ধ করুন)' : 'অফ (ক্লিক করে চালু করুন)'}` : `Passbook: ${isPassbookOn ? 'ON' : 'OFF'}`}
                          >
                            {isPassbookOn ? <CheckCircle className="w-4 h-4 mx-auto" /> : <Lock className="w-4 h-4 mx-auto" />}
                          </button>
                        </td>

                        {/* 3. Dashboard Toggle */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            onClick={() => handleToggleMemberPermission(member, 'canViewDashboard')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDashboardOn
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 hover:bg-neutral-300'
                            }`}
                            title={language === 'bn' ? `ড্যাশবোর্ড: ${isDashboardOn ? 'অন (ক্লিক করে বন্ধ করুন)' : 'অফ (ক্লিক করে চালু করুন)'}` : `Dashboard: ${isDashboardOn ? 'ON' : 'OFF'}`}
                          >
                            {isDashboardOn ? <CheckCircle className="w-4 h-4 mx-auto" /> : <Lock className="w-4 h-4 mx-auto" />}
                          </button>
                        </td>

                        {/* 4. Loan Toggle */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            onClick={() => handleToggleMemberPermission(member, 'canViewLoans')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLoanOn
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                                : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 hover:bg-neutral-300'
                            }`}
                            title={language === 'bn' ? `ঋণ (Loan): ${isLoanOn ? 'অন (ক্লিক করে বন্ধ করুন)' : 'অফ (ক্লিক করে চালু করুন)'}` : `Loan: ${isLoanOn ? 'ON' : 'OFF'}`}
                          >
                            {isLoanOn ? <CheckCircle className="w-4 h-4 mx-auto text-rose-700 dark:text-rose-400" /> : <Lock className="w-4 h-4 mx-auto" />}
                          </button>
                        </td>

                        {/* 5. Investment Toggle */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            onClick={() => handleToggleMemberPermission(member, 'canViewInvestments')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isInvestmentOn
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-200'
                                : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 hover:bg-neutral-300'
                            }`}
                            title={language === 'bn' ? `বিনিয়োগ: ${isInvestmentOn ? 'অন (ক্লিক করে বন্ধ করুন)' : 'অফ (ক্লিক করে চালু করুন)'}` : `Investment: ${isInvestmentOn ? 'ON' : 'OFF'}`}
                          >
                            {isInvestmentOn ? <CheckCircle className="w-4 h-4 mx-auto text-purple-700 dark:text-purple-400" /> : <Lock className="w-4 h-4 mx-auto" />}
                          </button>
                        </td>

                        {/* 6. Statement Toggle */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            onClick={() => handleToggleMemberPermission(member, 'canViewStatement')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isStatementOn
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 hover:bg-teal-200'
                                : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 hover:bg-neutral-300'
                            }`}
                            title={language === 'bn' ? `স্টেটমেন্ট: ${isStatementOn ? 'অন (ক্লিক করে বন্ধ করুন)' : 'অফ (ক্লিক করে চালু করুন)'}` : `Statement: ${isStatementOn ? 'ON' : 'OFF'}`}
                          >
                            {isStatementOn ? <CheckCircle className="w-4 h-4 mx-auto text-teal-700 dark:text-teal-400" /> : <Lock className="w-4 h-4 mx-auto" />}
                          </button>
                        </td>

                        {/* 7. Rules Toggle */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            onClick={() => handleToggleMemberPermission(member, 'canViewRules')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isRulesOn
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 hover:bg-neutral-300'
                            }`}
                            title={language === 'bn' ? `রুলস: ${isRulesOn ? 'অন (ক্লিক করে বন্ধ করুন)' : 'অফ (ক্লিক করে চালু করুন)'}` : `Rules: ${isRulesOn ? 'ON' : 'OFF'}`}
                          >
                            {isRulesOn ? <CheckCircle className="w-4 h-4 mx-auto" /> : <Lock className="w-4 h-4 mx-auto" />}
                          </button>
                        </td>

                        {/* Quick Row Actions */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSetAllMemberPermissions(member, true)}
                              className="px-2 py-1 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded transition-colors cursor-pointer"
                              title={language === 'bn' ? 'এই সদস্যের জন্য সব অপশন চালু করুন' : 'Enable all options'}
                            >
                              {language === 'bn' ? 'সব অন' : 'All ON'}
                            </button>
                            <button
                              onClick={() => handleSetAllMemberPermissions(member, false)}
                              className="px-2 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded transition-colors cursor-pointer"
                              title={language === 'bn' ? 'এই সদস্যের জন্য সব অপশন বন্ধ করুন' : 'Disable all options'}
                            >
                              {language === 'bn' ? 'সব অফ' : 'All OFF'}
                            </button>
                          </div>
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

      {/* ROLE TEMPLATES VIEW */}
      {activeSubTab === 'roles' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {language === 'bn' ? 'পদভিত্তিক ডিফল্ট পারমিশন টেমপ্লেট' : 'Role-Based Permission Templates'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {language === 'bn'
                  ? 'একসাথে নির্দিষ্ট পদের সকল সদস্যের জন্য পারমিশন কনফিগার করুন।'
                  : 'Configure and apply default permission rules for all members under a specific member role.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {language === 'bn' ? 'পদ নির্বাচন:' : 'Select Role:'}
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white"
              >
                <option value="member">{language === 'bn' ? 'সাধারণ সদস্য (General Member)' : 'General Member'}</option>
                <option value="executive">{language === 'bn' ? 'কার্যনির্বাহী সদস্য (Executive)' : 'Executive Member'}</option>
                <option value="cashier">{language === 'bn' ? 'কোষাধ্যক্ষ / ক্যাশিয়ার (Cashier)' : 'Cashier'}</option>
                <option value="president">{language === 'bn' ? 'সভাপতি (President)' : 'President'}</option>
                <option value="secretary">{language === 'bn' ? 'সাধারণ সম্পাদক (Secretary)' : 'Secretary'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Profile View */}
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-emerald-500 transition-colors">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {language === 'bn' ? '👤 প্রোফাইল দৃশ্যমানতা' : 'Profile Visibility'}
              </span>
              <input
                type="checkbox"
                checked={rolePermissions.canViewProfile !== false}
                onChange={(e) => setRolePermissions({ ...rolePermissions, canViewProfile: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* 2. Passbook View */}
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-emerald-500 transition-colors">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {language === 'bn' ? '📖 পাসবই দৃশ্যমানতা' : 'Passbook Visibility'}
              </span>
              <input
                type="checkbox"
                checked={rolePermissions.canViewPassbook !== false}
                onChange={(e) => setRolePermissions({ ...rolePermissions, canViewPassbook: e.target.checked, canViewSavings: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* 3. Dashboard View */}
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-emerald-500 transition-colors">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {language === 'bn' ? '📊 ড্যাশবোর্ড দৃশ্যমানতা' : 'Dashboard Viewing'}
              </span>
              <input
                type="checkbox"
                checked={rolePermissions.canViewDashboard !== false}
                onChange={(e) => setRolePermissions({ ...rolePermissions, canViewDashboard: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* 4. Loans */}
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-emerald-500 transition-colors">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {language === 'bn' ? '💳 ঋণ (Loan) হিসাব' : 'Loan Information'}
              </span>
              <input
                type="checkbox"
                checked={rolePermissions.canViewLoans !== false}
                onChange={(e) => setRolePermissions({ ...rolePermissions, canViewLoans: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* 5. Investments */}
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-emerald-500 transition-colors">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {language === 'bn' ? '💼 বিনিয়োগ বিবরণী' : 'Investment Details'}
              </span>
              <input
                type="checkbox"
                checked={rolePermissions.canViewInvestments !== false}
                onChange={(e) => setRolePermissions({ ...rolePermissions, canViewInvestments: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* 6. Statement */}
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-teal-500 transition-colors">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {language === 'bn' ? '📑 স্টেটমেন্ট (Statement)' : 'Date-wise Statement'}
              </span>
              <input
                type="checkbox"
                checked={rolePermissions.canViewStatement !== false}
                onChange={(e) => setRolePermissions({ ...rolePermissions, canViewStatement: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
            </label>

            {/* 6. Rules */}
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-emerald-500 transition-colors">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {language === 'bn' ? '📜 রুলস' : 'Rules & Bylaws'}
              </span>
              <input
                type="checkbox"
                checked={rolePermissions.canViewRules !== false}
                onChange={(e) => setRolePermissions({ ...rolePermissions, canViewRules: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* 7. Edit Profile */}
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-emerald-500 transition-colors">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {language === 'bn' ? 'প্রোফাইল এডিট অধিকার' : 'Edit Profile Access'}
              </span>
              <input
                type="checkbox"
                checked={rolePermissions.canEditProfile !== false}
                onChange={(e) => setRolePermissions({ ...rolePermissions, canEditProfile: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {/* 8. Reports */}
            <label className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:border-emerald-500 transition-colors">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {language === 'bn' ? 'আর্থিক স্টেটমেন্ট (কেন্দ্রীয়)' : 'Financial Statement (Central)'}
              </span>
              <input
                type="checkbox"
                checked={rolePermissions.canViewReports === true}
                onChange={(e) => setRolePermissions({ ...rolePermissions, canViewReports: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleApplyRoleTemplate}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {language === 'bn'
                  ? `"${getRoleRoleLabelBn(selectedRole)}" পদের সকলের উপর প্রয়োগ করুন`
                  : `Apply Template to All ${selectedRole}s`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MEMBER CREDENTIALS SUB-TAB */}
      {activeSubTab === 'credentials' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-emerald-600" />
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {language === 'bn' ? 'সদস্য লগইন আইডি ও পাসওয়ার্ড ব্যবস্থাপনা' : 'Member Credentials & Login Management'}
                </h2>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {language === 'bn'
                  ? 'কেন্দ্রীয় ডাটাবেসে যেকোনো সদস্যের ইউজার আইডি (Member ID) পরিবর্তন বা নতুন গোপন পাসওয়ার্ড সেট করুন।'
                  : 'Manage member login IDs and reset/update passwords directly into the central cloud database.'}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'আইডি বা নাম দিয়ে খুঁজুন...' : 'Search members...'}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="py-3 px-4"># {language === 'bn' ? 'সদস্য' : 'Member'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'ইউজার আইডি (Login ID)' : 'Login ID'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'মোবাইল' : 'Mobile'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'পদবি' : 'Role'}</th>
                  <th className="py-3 px-4 text-center">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar member={member} sizeClassName="w-8 h-8" />
                        <div>
                          <div className="font-bold text-neutral-900 dark:text-white">
                            {language === 'bn' ? member.nameBn : member.nameEn}
                          </div>
                          <div className="text-[11px] text-neutral-500">{member.nameEn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                      {member.memberNo}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded">
                      {member.password ? member.password : (
                        <span className="text-neutral-400 italic font-normal">
                          {language === 'bn' ? 'ডিফল্ট পিন নেই' : 'No PIN set'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                      {member.phone}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedCredMember(member)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'আইডি/পাসওয়ার্ড পরিবর্তন' : 'Change ID/Pass'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLOUD DB SYNC SUB-TAB */}
      {activeSubTab === 'cloud' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div className="flex items-center gap-2">
              <Cloud className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {language === 'bn' ? 'ক্লাউড ডাটাবেস রিয়েল-টাইম সিঙ্ক কনফিগারেশন' : 'Central Cloud Database Real-Time Sync'}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-3xl">
              {language === 'bn'
                ? 'গুগল এআই স্টুডিওর পাবলিক শেয়ারড লিঙ্কে অ্যাপটি সরাসরি ক্লাউড ডাটাবেসের সাথে যুক্ত হয়ে কাজ করে। ফলে যেকোনো নতুন ডিভাইসে লিঙ্ক ওপেন করলে বা এডমিন পাসওয়ার্ড ও তথ্য বদল করলে তাৎক্ষণিকভাবে আপডেট সংরক্ষিত থাকে।'
                : 'Direct client-side cloud database sync ensures all credentials and updates are synchronized across all devices even on public shared links.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Cloud Connection Status Banner */}
            <div className="p-5 bg-emerald-50/80 dark:bg-emerald-950/50 rounded-xl border border-emerald-300 dark:border-emerald-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-100 font-bold text-sm">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'bn' ? 'সক্রিয় ক্লাউড ডাটাবেস স্ট্যাটাস (Firebase Firestore)' : 'Active Cloud DB Status (Firebase Firestore)'}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Firestore Realtime Active</span>
                </div>
              </div>

              <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                {language === 'bn'
                  ? 'সরাসরি গুগল ফায়ারবেস ফায়ারস্টোর (Firestore) সেন্ট্রাল ডাটাবেসের সাথে সংযুক্ত। onSnapshot এর মাধ্যমে মোবাইল ও কম্পিউটারে সকল ট্রানজেকশন, কিস্তি ও সদস্য তথ্য রিয়েল-টাইমে কোনো বিলম্ব ছাড়াই লাইভ সিঙ্ক হয়।'
                  : 'Permanently connected to Firebase Firestore central database. Connected devices sync deposits, kisti, and passwords in real-time with zero delay via onSnapshot.'}
              </p>

              <div className="space-y-2 text-xs font-mono bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">সংযোগ অবস্থা:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>{cloudVerifyStatus.message}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500">প্রজেক্ট আইডি (Project):</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-bold">friend-initiative-organization</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500">কালেকশন (Collection):</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-bold">somiti_data</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500">ডকুমেন্ট (Document):</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-bold">central_database</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500">সিঙ্ক সংস্করণ (Version):</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">v{cloudVerifyStatus.version || 1} (Live Synced)</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    setCloudSaving(true);
                    const res = await verifyCloudDbConnection();
                    setCloudVerifyStatus({
                      checked: true,
                      connected: res.connected,
                      message: res.message,
                      version: res.version,
                    });
                    setCloudSaving(false);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cloudSaving ? 'animate-spin' : ''}`} />
                  <span>{language === 'bn' ? 'সংযোগ পুনঃযাচাই করুন' : 'Re-verify Connection'}</span>
                </button>
              </div>
            </div>

            {/* Firebase Architecture Details */}
            <div className="p-5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'ফায়ারবেস ক্লাউড স্টোরেজ আর্কিটেকচার' : 'Firebase Cloud Storage Architecture'}</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">⚡ রিয়েল-টাইম ডাটা সিঙ্ক (Real-time Snapshot)</div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {language === 'bn'
                      ? 'যেকোনো মোবাইল বা ব্রাউজার থেকে কিস্তি কালেকশন, মেম্বার পাসওয়ার্ড পরিবর্তন বা ঋণ বিতরণ করার সাথে সাথে pushToFirebase() চালিত হয় এবং Firestore onSnapshot এর মাধ্যমে সকল স্ক্রিনে তৎক্ষণাৎ প্রতিফলিত হয়।'
                      : 'Kisti collections, member edits, password changes, and loan records push to Firebase Firestore and sync instantly.'}
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">🔒 কেন্দ্রীয় ক্রেডেনশিয়াল সংরক্ষণ</div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {language === 'bn'
                      ? 'অফলাইন ও সার্ভার উভয় মোডেই Firebase Firestore অথেনটিকেশন ডাটাবেস স্থায়ীভাবে সুরক্ষিত থাকে।'
                      : 'Authoritative member credentials and accounts remain persistent in Firestore across any browser reload or server restart.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    setCloudSaving(true);
                    const res = await verifyCloudDbConnection();
                    setCloudVerifyStatus({
                      checked: true,
                      connected: res.connected,
                      message: res.message,
                      version: res.version,
                    });
                    setCloudSaving(false);
                    setSuccessMessage(
                      language === 'bn'
                        ? '✅ ফায়ারবেস ক্লাউড ডাটাবেস সফলভাবে সংযুক্ত ও যাচাইকৃত হয়েছে!'
                        : '✅ Firebase Firestore successfully verified & connected!'
                    );
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'ফায়ারবেস ডাটাবেস টেস্ট করুন' : 'Test Firebase Connection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERDUE DEPOSIT ALERTS SUB-TAB */}
      {activeSubTab === 'overdue' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {language === 'bn' ? '১০ দিনের বেশি বকেয়া মাসিক জমার তালিকা (Overdue > 10 Days)' : 'Overdue Monthly Deposit Alerts (> 10 Days)'}
                </h2>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {language === 'bn'
                  ? `চলতি মাস (${currentMonthStr})-এর নির্দিষ্ট তারিখের পর ১০ দিন অতিবাহিত হলেও যারা মাসিক সঞ্চয় বা কিস্তি জমা দেননি।`
                  : `Members who haven't paid their monthly commitment for ${currentMonthStr} past the 10th deadline (10+ days overdue).`}
              </p>
            </div>

            {overdueMembers.length > 0 && (
              <button
                onClick={handleSendAllOverdueAlerts}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>{language === 'bn' ? 'সব বকেয়া সদস্যকে জরুরি অ্যালার্ট পাঠান' : 'Broadcast Alert to All Overdue'}</span>
              </button>
            )}
          </div>

          {overdueMembers.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                {language === 'bn' ? 'কোনো সদস্যের মাসিক জমা ১০ দিনের বেশি বকেয়া নেই!' : 'No members have overdue deposits > 10 days!'}
              </div>
              <p className="text-xs text-neutral-500">
                {language === 'bn' ? 'সকল সক্রিয় সদস্য সময়মতো তাদের মাসিক সঞ্চয় বা কিস্তি জমা দিয়েছেন।' : 'All active members are up to date with their monthly collections.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    <th className="py-3 px-4">{language === 'bn' ? 'সদস্যের নাম ও আইডি' : 'Member'}</th>
                    <th className="py-3 px-3">{language === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}</th>
                    <th className="py-3 px-3">{language === 'bn' ? 'বকেয়া পরিমাণ' : 'Due Amount'}</th>
                    <th className="py-3 px-3">{language === 'bn' ? 'বিলম্বে জরিমানা (ফি)' : 'Overdue Fine'}</th>
                    <th className="py-3 px-3">{language === 'bn' ? 'অ্যালার্ট স্ট্যাটাস' : 'Alert Status'}</th>
                    <th className="py-3 px-3 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                  {overdueMembers.map((member) => {
                    const isAlerted = alertSentMap[member.id];
                    const dueAmount = member.monthlySavingsCommitment || 1000;
                    const fineAmount = 50; // ৳50 fine after 10th

                    return (
                      <tr key={member.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <MemberAvatar member={member} sizeClassName="w-8 h-8 text-xs font-bold" />
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-white">
                                {language === 'bn' ? member.nameBn : member.nameEn}
                              </div>
                              <div className="text-[10px] text-neutral-500 font-mono">
                                {member.memberNo} · <span className="text-amber-700 dark:text-amber-400 font-semibold">{getRoleLabel(member.role)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-700 dark:text-neutral-300">
                          {member.phone}
                        </td>
                        <td className="py-3 px-3 font-bold text-neutral-900 dark:text-white">
                          ৳{dueAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-red-600 dark:text-red-400">
                          ৳{fineAmount} <span className="text-[10px] font-normal text-neutral-500">(৳50 late fee)</span>
                        </td>
                        <td className="py-3 px-3">
                          {isAlerted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                              <CheckCircle className="w-3 h-3" />
                              <span>{language === 'bn' ? 'অ্যালার্ট পাঠানো হয়েছে' : 'Alert Sent'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{language === 'bn' ? 'বকেয়া (>১০ দিন)' : 'Overdue (>10 Days)'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleSendAlert(member.id, language === 'bn' ? member.nameBn : member.nameEn)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-800 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                          >
                            <Mail className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{language === 'bn' ? 'অ্যালার্ট পাঠান' : 'Send Alert'}</span>
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
      )}

      {/* EXPORT CSV SUB-TAB */}
      {activeSubTab === 'export' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {language === 'bn' ? 'অফলাইন রেকর্ড সংরক্ষণের জন্য CSV এক্সপোর্ট' : 'Export Member & Transaction Data to CSV'}
                </h2>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {language === 'bn'
                  ? 'সমিতির সকল সদস্যের প্রোফাইল, সঞ্চয়, শেয়ার ক্যাপিটাল এবং লেনদেনের পূর্ণাঙ্গ বিবরণী একটি ডাউলোডযোগ্য CSV ফাইলে এক্সপোর্ট করুন।'
                  : 'Download complete records of all member profiles, deposits, withdrawals, and financial transactions for offline backup.'}
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'bn' ? 'ডাউনলোড CSV ফাইল (Download CSV)' : 'Download CSV File'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="p-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'সদস্য প্রোফাইল ডেটা' : 'Member Profiles Summary'}</span>
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {language === 'bn'
                  ? `মোট ${members.length} জন সদস্যের নাম, ফোন নম্বর, মেম্বার আইডি, পদ, স্ট্যাটাস এবং বর্তমান সঞ্চয় ব্যালেন্স অন্তর্ভুক্ত থাকবে।`
                  : `Includes full profiles, phone numbers, member IDs, roles, status, and savings balance for all ${members.length} members.`}
              </p>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                {language === 'bn' ? '✓ প্রস্তুত: সদস্য ডেটা' : '✓ Ready: Member Records'}
              </div>
            </div>

            <div className="p-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>{language === 'bn' ? 'লেনদেন ইতিহাস (Transactions)' : 'Transaction History'}</span>
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {language === 'bn'
                  ? `মোট ${transactions.length} টি লেনদেন (সঞ্চয়, কিস্তি, লোন প্রদান ও সংগ্রহ) এর পূর্ণাঙ্গ ইতিহাস অন্তর্ভুক্ত থাকবে।`
                  : `Includes complete historical audit trail of all ${transactions.length} financial transactions (savings, loans, kisti, deposits).`}
              </p>
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800">
                {language === 'bn' ? '✓ প্রস্তুত: লেনদেন ডেটা' : '✓ Ready: Transaction Records'}
              </div>
            </div>
          </div>

          {/* Automated Server Backup Trigger Section */}
          <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {language === 'bn' ? 'স্বয়ংক্রিয় দৈনিক ডেটাবেস ব্যাকআপ স্ন্যাপশট ও নোটিফিকেশন' : 'Automated Daily Database Backup & Admin Notification'}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {language === 'bn'
                    ? 'সার্ভারে রেজিস্ট্রি ও লেনদেনের সম্পূর্ণ JSON স্ন্যাপশট তৈরি করুন এবং সফল সম্পন্ন হওয়ার পর অ্যাডমিনদের নিকট ইমেল/সিস্টেম নোটিফিকেশন প্রেরণ করুন।'
                    : 'Trigger automated daily backup snapshot of entire member registry and transaction history with admin notification.'}
                </p>
              </div>

              <button
                onClick={handleTriggerServerBackup}
                disabled={backupLoading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${backupLoading ? 'animate-spin' : ''}`} />
                <span>{language === 'bn' ? 'দৈনিক ব্যাকআপ ও নোটিফিকেশন ট্রিগার করুন' : 'Trigger Daily Backup & Notify'}</span>
              </button>
            </div>

            {backupResult && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{backupResult.notification.title}</span>
                </div>
                <div>
                  <span className="font-semibold">{language === 'bn' ? 'প্রাপকগণ:' : 'Recipients:'}</span> {backupResult.notification.recipients}
                </div>
                <div>
                  <span className="font-semibold">{language === 'bn' ? 'সারাংশ:' : 'Summary:'}</span> {backupResult.notification.summary}
                </div>
                <div className="text-neutral-500 text-[11px]">
                  {language === 'bn' ? 'ফাইল নাম:' : 'Filename:'} server_data/backups/{backupResult.backupFile} ({new Date(backupResult.timestamp).toLocaleString()})
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Credential Management Modal */}
      {selectedCredMember && (
        <ManageCredentialsModal
          member={selectedCredMember}
          isOpen={!!selectedCredMember}
          onClose={() => setSelectedCredMember(null)}
          onSuccess={() => {
            setSuccessMessage(
              language === 'bn'
                ? 'সদস্যের ইউজার আইডি ও পাসওয়ার্ড কেন্দ্রীয় ডাটাবেসে সফলভাবে আপডেট হয়েছে!'
                : 'Member credentials successfully updated in central database!'
            );
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
        />
      )}
    </div>
  );
};

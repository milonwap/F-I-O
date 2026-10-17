import React, { useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  Phone,
  CreditCard,
  UserCheck,
  Building,
  CheckCircle2,
  FileText,
  Clock,
  ListTodo,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Edit3,
} from 'lucide-react';
import { Member, KistiTransaction, Language, Task, isAdminRole } from '../types/somiti';
import { useSomiti } from '../context/SomitiContext';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';
import { MemberAvatar } from './MemberAvatar';
import { ManageCredentialsModal } from './ManageCredentialsModal';

interface MemberProfileModalProps {
  member: Member | null;
  transactions: KistiTransaction[];
  tasks: Task[];
  language: Language;
  onClose: () => void;
  onOpenReceipt: (tx: KistiTransaction) => void;
  onCollectForMember: (memberId: string) => void;
  onEditMember: (member: Member) => void;
  onOpenEditTx?: (tx: KistiTransaction) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  transactions,
  tasks,
  language,
  onClose,
  onOpenReceipt,
  onCollectForMember,
  onEditMember,
  onOpenEditTx,
}) => {
  const { currentMember } = useSomiti();
  const isCashier = isAdminRole(currentMember?.role) || currentMember?.role === 'cashier';
  const [activeTab, setActiveTab] = useState<'passbook' | 'personal' | 'tasks'>('passbook');
  const [isManageCredsOpen, setIsManageCredsOpen] = useState(false);

  if (!member) return null;

  const memberTxs = transactions
    .filter((tx) => tx.memberId === member.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const memberObjFine = Number((member as any)?.total_fine_paid ?? (member as any)?.totalFinePaid ?? 0);
  const totalFinePaid = Math.max(
    memberObjFine,
    memberTxs.reduce((sum, tx) => {
      const fineFromField = Number(tx.fineAmount || 0);
      const fineFromType = tx.type === 'fine_fee' ? Number(tx.amount || 0) : 0;
      return sum + Math.max(fineFromField, fineFromType);
    }, 0)
  );

  const fineTxsCount = memberTxs.filter(
    (tx) => (tx.fineAmount && tx.fineAmount > 0) || tx.type === 'fine_fee'
  ).length;

  const memberTasks = tasks.filter((t) => t.assignedToMemberId === member.id);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'lead_executive':
        return language === 'bn' ? 'সভাপতি, সাধারণ সম্পাদক ও ক্যাশিয়ার' : 'President, Secretary & Cashier';
      case 'president':
        return language === 'bn' ? 'সভাপতি' : 'President';
      case 'secretary':
        return language === 'bn' ? 'সাধারণ সম্পাদক' : 'General Secretary';
      case 'cashier':
        return language === 'bn' ? 'ক্যাশিয়ার / কোষাধ্যক্ষ' : 'Cashier';
      case 'executive':
        return language === 'bn' ? 'কার্যনির্বাহী সদস্য' : 'Executive Member';
      default:
        return language === 'bn' ? 'সাধারণ সদস্য' : 'General Member';
    }
  };

  const handlePrintPassbook = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 my-8">
        {/* Header Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2 py-0.5 bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded">
              {member.memberNo}
            </span>
            <span className="text-sm font-semibold">
              {language === 'bn' ? 'সদস্য পূর্ণাঙ্গ প্রোফাইল ও পাসবই' : 'Member Profile & Passbook'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isCashier && (
              <button
                onClick={() => onCollectForMember(member.id)}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
              >
                {language === 'bn' ? '+ কিস্তি গ্রহণ' : '+ Collect Kisti'}
              </button>
            )}
            <button
              onClick={handlePrintPassbook}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'পাসবই প্রিন্ট' : 'Print Passbook'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Member Profile Hero Banner */}
        <div className="p-6 bg-neutral-50 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <MemberAvatar member={member} sizeClassName="w-16 h-16 text-2xl shadow-sm border-2 border-white" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-900">
                    {language === 'bn' ? member.nameBn : member.nameEn}
                  </h2>
                  <span className="text-xs px-2 py-0.5 font-medium rounded bg-emerald-100 text-emerald-800">
                    {getRoleLabel(member.role)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 mt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    {member.phone}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    {language === 'bn' ? 'যোগদান:' : 'Joined:'} {formatDate(member.joinDate, language)}
                  </span>
                  <span>·</span>
                  <span className="text-neutral-600">
                    {member.status === 'active' ? (
                      <span className="text-emerald-700 font-medium">● {language === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                    ) : (
                      <span className="text-neutral-400 font-medium">○ {language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="no-print">
              <button
                onClick={() => onEditMember(member)}
                className="px-3 py-1.5 text-xs font-medium border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                {language === 'bn' ? 'প্রোফাইল সম্পাদন' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Quick Financial Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-neutral-200">
            <div className="bg-white p-3 rounded-lg border border-neutral-200">
              <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                {language === 'bn' ? 'মোট সঞ্চয় জমা' : 'Total Savings'}
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                {formatCurrency(member.totalSavingsDeposited, language)}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-neutral-200">
              <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                {language === 'bn' ? 'মাসিক ধার্য কিস্তি' : 'Monthly Target'}
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-0.5">
                {formatCurrency(member.monthlySavingsCommitment, language)}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-neutral-200">
              <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                {language === 'bn' ? 'মালিকানাধীন শেয়ার' : 'Owned Shares'}
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-0.5">
                {language === 'bn'
                  ? `${toBengaliNumber(member.shareCount)} টি (মূল্য ৳ ${toBengaliNumber(member.shareCount * member.shareFaceValue)})`
                  : `${member.shareCount} Shares (৳ ${member.shareCount * member.shareFaceValue})`}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-neutral-200">
              <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                {language === 'bn' ? 'মোট গৃহীত কিস্তির সংখ্যা' : 'Kisti Collected'}
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-0.5">
                {language === 'bn' ? `${toBengaliNumber(memberTxs.length)} টি` : `${memberTxs.length} Times`}
              </div>
            </div>

            {/* 5. Total Late Fee / Jorimana Paid */}
            <div className={`p-3 rounded-lg border col-span-2 sm:col-span-1 ${
              totalFinePaid > 0
                ? 'bg-amber-50/90 border-amber-300'
                : 'bg-white border-neutral-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${
                  totalFinePaid > 0 ? 'text-amber-900' : 'text-neutral-500'
                }`}>
                  {language === 'bn' ? 'পরিশোধিত জরিমানা' : 'Total Late Fee'}
                </div>
                {totalFinePaid > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold font-mono">
                    ⚠️ {toBengaliNumber(fineTxsCount)} {language === 'bn' ? 'টি' : 'txs'}
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold font-sans">
                    ✓ {language === 'bn' ? '০৳' : '৳ 0'}
                  </span>
                )}
              </div>
              <div className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
                totalFinePaid > 0 ? 'text-amber-950' : 'text-neutral-900'
              }`}>
                {formatCurrency(totalFinePaid, language)}
              </div>
              <div className={`text-[10px] mt-0.5 ${
                totalFinePaid > 0 ? 'text-amber-800 font-medium' : 'text-neutral-400'
              }`}>
                {totalFinePaid > 0
                  ? (language === 'bn' ? 'বিলম্বিত কিস্তির মোট জরিমানা' : 'Delayed kisti late fees')
                  : (language === 'bn' ? 'কোনো জরিমানা বকেয়া বা আদায় নেই' : 'Clean late fee record')}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="no-print flex border-b border-neutral-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab('passbook')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'passbook'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {language === 'bn' ? 'পাসবই ও জমার খতিয়ান' : 'Passbook Ledger'}
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'personal'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {language === 'bn' ? 'ব্যক্তিগত ও নমিনি তথ্য' : 'Personal & Nominee Info'}
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {language === 'bn' ? `দায়িত্ব ও টাস্ক (${toBengaliNumber(memberTasks.length)})` : `Assigned Tasks (${memberTasks.length})`}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: PASSBOOK LEDGER */}
          {activeTab === 'passbook' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">
                    {language === 'bn' ? 'সদস্যের সকল কিস্তি ও জমার হিসাব' : 'Transaction History & Receipts'}
                  </h4>
                  <span className="text-xs text-neutral-500 mt-0.5 block">
                    {language === 'bn'
                      ? `সর্বমোট রেকর্ড: ${toBengaliNumber(memberTxs.length)} টি`
                      : `Total Records: ${memberTxs.length}`}
                  </span>
                </div>

                {/* Total Late Fee / Jorimana Paid Badge */}
                <div className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                  totalFinePaid > 0
                    ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-mono shadow-2xs'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <span className="font-sans font-medium text-[11px]">
                    {language === 'bn' ? 'পরিশোধিত মোট জরিমানা:' : 'Total Late Fee / Jorimana Paid:'}
                  </span>
                  <strong className="font-bold text-sm">
                    {formatCurrency(totalFinePaid, language)}
                  </strong>
                  {totalFinePaid > 0 ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold font-sans">
                      ⚠️ জরিমানা
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold font-sans">
                      ✓ {language === 'bn' ? 'জরিমানা নেই (০৳)' : 'No Fine (৳ 0)'}
                    </span>
                  )}
                </div>
              </div>

              {memberTxs.length === 0 ? (
                <div className="text-center py-10 text-neutral-500 text-sm">
                  {language === 'bn' ? 'এখনো কোনো জমার হিসাব নেই।' : 'No transactions recorded yet.'}
                </div>
              ) : (
                <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 text-neutral-700 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3"># {language === 'bn' ? 'রসিদ' : 'Receipt'}</th>
                        <th className="py-2.5 px-3">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                        <th className="py-2.5 px-3">{language === 'bn' ? 'খাত / ধরন' : 'Type'}</th>
                        <th className="py-2.5 px-3">{language === 'bn' ? 'মাধ্যম' : 'Method'}</th>
                        <th className="py-2.5 px-3 text-right">{language === 'bn' ? 'জরিমানা / লেট ফি' : 'Late Fee'}</th>
                        <th className="py-2.5 px-3 text-right">{language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}</th>
                        <th className="py-2.5 px-3 no-print text-center">{language === 'bn' ? 'রসিদ' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {memberTxs.map((tx) => {
                        const fine = tx.fineAmount || (tx.type === 'fine_fee' ? tx.amount : 0);
                        return (
                          <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-medium text-neutral-900">{tx.receiptNo}</td>
                            <td className="py-2.5 px-3 text-neutral-600 font-mono">{formatDate(tx.date, language)}</td>
                            <td className="py-2.5 px-3">
                              <span className="capitalize font-medium text-neutral-800">
                                {tx.type === 'savings'
                                  ? language === 'bn' ? 'সঞ্চয় কিস্তি' : 'Savings'
                                  : tx.type === 'loan_repayment'
                                  ? language === 'bn' ? 'ঋণের কিস্তি' : 'Loan Installment'
                                  : tx.type === 'project_share'
                                  ? language === 'bn' ? 'প্রকল্প চাঁদা' : 'Project Share'
                                  : language === 'bn' ? 'ভর্তি / জরিমানা ফি' : 'Fee'}
                              </span>
                              {tx.remarks && <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">{tx.remarks}</div>}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-600 capitalize">{tx.paymentMethod}</td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                              {fine > 0 ? (
                                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                  {formatCurrency(fine, language)}
                                </span>
                              ) : (
                                <span className="text-neutral-400 text-[11px]">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-emerald-700">
                              {formatCurrency(tx.amount, language)}
                            </td>
                            <td className="py-2.5 px-3 text-center no-print">
                              <div className="flex items-center justify-center gap-1.5">
                                {isCashier && onOpenEditTx && (
                                  <button
                                    onClick={() => onOpenEditTx(tx)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-300 transition-colors cursor-pointer"
                                    title={language === 'bn' ? 'সংশোধন / এডিট' : 'Edit'}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => onOpenReceipt(tx)}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>{language === 'bn' ? 'রসিদ' : 'View'}</span>
                                </button>
                              </div>
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

          {/* TAB 2: PERSONAL & NOMINEE INFO */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs uppercase font-bold text-neutral-500 tracking-wider mb-3">
                  {language === 'bn' ? 'ব্যক্তিগত পরিচিতি ও তথ্য' : 'Personal Details & Identity'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'ইংরেজি নাম:' : 'English Name:'}</span>
                    <div className="font-semibold text-neutral-900 mt-0.5">{member.nameEn}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'বাংলা নাম:' : 'Bangla Name:'}</span>
                    <div className="font-semibold text-neutral-900 mt-0.5">{member.nameBn}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'রক্তের গ্রুপ:' : 'Blood Group:'}</span>
                    <div className="font-bold text-rose-700 mt-0.5">{member.bloodGroup || '-'}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'পিতার নাম:' : "Father's Name:"}</span>
                    <div className="font-medium text-neutral-900 mt-0.5">{member.fatherName || '-'}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'মাতার নাম:' : "Mother's Name:"}</span>
                    <div className="font-medium text-neutral-900 mt-0.5">{member.motherName || '-'}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID):' : 'National ID (NID):'}</span>
                    <div className="font-mono text-neutral-900 font-bold mt-0.5">{member.nid || '-'}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'মোবাইল নম্বর:' : 'Phone Number:'}</span>
                    <div className="font-mono text-neutral-900 font-bold mt-0.5">{member.phone}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'বর্তমান ঠিকানা:' : 'Present Address:'}</span>
                    <div className="text-neutral-800 mt-0.5">{member.presentAddress || member.address || '-'}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'স্থায়ী ঠিকানা:' : 'Permanent Address:'}</span>
                    <div className="text-neutral-800 mt-0.5">{member.permanentAddress || member.address || '-'}</div>
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 pt-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200">
                    <div>
                      <span className="text-neutral-500 text-[11px] block">{language === 'bn' ? 'সদস্য লগইন ক্রেডেনশিয়াল (সরাসরি টু-ওয়ে সিঙ্ক):' : 'Member Login Credentials (Two-Way Cloud Sync):'}</span>
                      <div className="font-mono text-neutral-900 font-bold mt-0.5 text-xs flex items-center gap-2">
                        <span>আইডি: <strong className="text-emerald-700">{member.memberNo}</strong></span>
                        <span>·</span>
                        <span>পাসওয়ার্ড: {isCashier ? <span className="text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded">{member.password || 'সেট করা হয়নি'}</span> : '••••••••'}</span>
                      </div>
                    </div>
                    {isCashier && (
                      <button
                        onClick={() => setIsManageCredsOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'পাসওয়ার্ড / আইডি পরিবর্তন' : 'Change Credentials'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-neutral-500 tracking-wider mb-3">
                  {language === 'bn' ? 'নমিনি সংক্রান্ত তথ্য (Nominee Details)' : 'Nominee Information'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'নমিনির নাম:' : 'Nominee Name:'}</span>
                    <div className="font-semibold text-neutral-900 mt-0.5">{member.nomineeName || '-'}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'সম্পর্ক:' : 'Relationship:'}</span>
                    <div className="font-semibold text-neutral-900 mt-0.5">{member.nomineeRelation || '-'}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'নমিনির মোবাইল:' : 'Nominee Phone:'}</span>
                    <div className="font-mono text-neutral-900 mt-0.5">{member.nomineePhone || '-'}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'নমিনির এনআইডি (NID):' : 'Nominee NID:'}</span>
                    <div className="font-mono text-neutral-900 mt-0.5">{member.nomineeNid || '-'}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">{language === 'bn' ? 'নমিনির অংশের হার:' : 'Nominee Share:'}</span>
                    <div className="font-bold text-emerald-800 mt-0.5">{member.nomineeSharePercent ?? 100}%</div>
                  </div>
                </div>

                {/* Rule 5 & 10 Charter Note */}
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900">
                      {language === 'bn' ? '১০নং ও ৫নং ধারা সনদ সুরক্ষা:' : 'Charter Protection Guarantee:'}
                    </strong>{' '}
                    <span>
                      {language === 'bn'
                        ? '১০নং ধারা: সদস্য মৃত্যুবরণ করলে জমাকৃত সম্পূর্ণ সঞ্চয় লভ্যাংশ সহ মনোনীত নমিনিকে প্রদান করা হবে। ৫নং ধারা: ৫ বছরের পূর্বে প্রস্থান নিষেধ; ৫ বছর পর শুধু মূল টাকা ফেরতযোগ্য।'
                        : 'Rule 10: In demise, nominee receives all savings + dividends. Rule 5: 5-year lock-in applies; principal only refund on exit.'}
                    </span>
                  </div>
                </div>
              </div>

              {member.notes && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-neutral-500 tracking-wider mb-2">
                    {language === 'bn' ? 'কমিটির মন্তব্য' : 'Committee Remarks'}
                  </h4>
                  <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded border border-neutral-200">
                    {member.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSIGNED TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-neutral-900 mb-2">
                {language === 'bn' ? 'প্রকল্প সমূহে দায়িত্বপ্রাপ্ত টাস্কসমূহ' : 'Tasks Assigned in Projects'}
              </h4>

              {memberTasks.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  {language === 'bn' ? 'এই সদস্যকে এখনো কোনো টাস্ক বরাদ্দ করা হয়নি।' : 'No tasks currently assigned to this member.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {memberTasks.map((t) => (
                    <div key={t.id} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-neutral-900">{t.title}</div>
                          <div className="text-[11px] text-neutral-600 mt-0.5">{t.description}</div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                            t.status === 'done'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : t.status === 'review'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-neutral-500 mt-2 pt-2 border-t border-neutral-200">
                        <span>
                          {language === 'bn' ? 'মেয়াদ:' : 'Due:'} <strong className="font-mono">{formatDate(t.dueDate, language)}</strong>
                        </span>
                        <span>
                          {language === 'bn' ? 'অগ্রাধিকার:' : 'Priority:'} <strong className="capitalize">{t.priority}</strong>
                        </span>
                        <span>
                          {language === 'bn' ? 'চেকলিস্ট:' : 'Checklist:'} {t.checklist.filter((c) => c.done).length}/{t.checklist.length}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two-Way Member Credentials Modal */}
      <ManageCredentialsModal
        member={member}
        isOpen={isManageCredsOpen}
        onClose={() => setIsManageCredsOpen(false)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  CreditCard,
  Eye,
  PlusCircle,
  Edit2,
  Trash2,
  Calendar,
  ShieldCheck,
  Building,
  User,
  KeyRound,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { Member, MemberRole } from '../types/somiti';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';
import { MemberAvatar } from './MemberAvatar';
import { ManageCredentialsModal } from './ManageCredentialsModal';

interface MembersViewProps {
  onOpenProfile: (member: Member) => void;
  onOpenCollectModal: (
    memberId?: string,
    type?: any,
    periodMonth?: string,
    defaultAmount?: number
  ) => void;
  onOpenAddMember: () => void;
  onEditMember: (member: Member) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  onOpenProfile,
  onOpenCollectModal,
  onOpenAddMember,
  onEditMember,
}) => {
  const { members, transactions, deleteMember, language, currentMember } = useSomiti();
  const isCashier = currentMember?.role === 'lead_executive' || currentMember?.role === 'cashier';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [credMember, setCredMember] = useState<Member | null>(null);

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nameBn.includes(searchTerm) ||
      m.memberNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);

    const matchesRole =
      selectedRole === 'all' ||
      m.role === selectedRole ||
      (m.role === 'lead_executive' &&
        (selectedRole === 'cashier' ||
          selectedRole === 'president' ||
          selectedRole === 'secretary' ||
          selectedRole === 'executive'));
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: MemberRole) => {
    switch (role) {
      case 'lead_executive':
        return {
          label: language === 'bn' ? 'সভাপতি, সম্পাদক ও ক্যাশিয়ার' : 'President, Secretary & Cashier',
          className: 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300',
        };
      case 'president':
        return {
          label: language === 'bn' ? 'সভাপতি' : 'President',
          className: 'bg-purple-100 text-purple-900',
        };
      case 'secretary':
        return {
          label: language === 'bn' ? 'সাধারণ সম্পাদক' : 'General Secretary',
          className: 'bg-blue-100 text-blue-900',
        };
      case 'cashier':
        return {
          label: language === 'bn' ? 'ক্যাশিয়ার / কোষাধ্যক্ষ' : 'Cashier',
          className: 'bg-emerald-100 text-emerald-900',
        };
      case 'executive':
        return {
          label: language === 'bn' ? 'কার্যনির্বাহী সদস্য' : 'Executive Member',
          className: 'bg-amber-100 text-amber-900',
        };
      default:
        return {
          label: language === 'bn' ? 'সাধারণ সদস্য' : 'General Member',
          className: 'bg-neutral-100 text-neutral-800',
        };
    }
  };

  const totalMonthlyCommitment = members.reduce((sum, m) => sum + m.monthlySavingsCommitment, 0);
  const totalSavingsVault = members.reduce((sum, m) => sum + (m.totalSavingsDeposited || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                {language === 'bn' ? 'সদস্য তালিকা ও প্রোফাইল' : 'Members Directory & Profiles'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono tabular-nums">
                {language === 'bn' ? `${toBengaliNumber(members.length)} জন` : `${members.length} Members`}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {language === 'bn'
                ? 'সদস্যদের পূর্ণাঙ্গ পরিচিতি, মাসিক সঞ্চয় কিস্তি, শেয়ার ও ডিজিটাল পাসবই'
                : 'Manage member identities, monthly commitments, shareholdings & passbooks'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddMember}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'bn' ? '+ নতুন সদস্য নিবন্ধন' : '+ Add New Member'}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-neutral-100">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
              {language === 'bn' ? 'মোট মাসিক কিস্তি লক্ষ্যমাত্রা' : 'Monthly Savings Target'}
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-0.5">
              {formatCurrency(totalMonthlyCommitment, language)}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
              {language === 'bn' ? 'সদস্যদের মোট জমাকৃত সঞ্চয়' : 'Total Deposited Savings'}
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
              {formatCurrency(totalSavingsVault, language)}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
              {language === 'bn' ? 'মোট সংরক্ষিত শেয়ার সংখ্যা' : 'Total Shares Owned'}
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-0.5">
              {language === 'bn'
                ? `${toBengaliNumber(members.reduce((sum, m) => sum + m.shareCount, 0))} টি`
                : `${members.reduce((sum, m) => sum + m.shareCount, 0)} Shares`}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder={
              language === 'bn'
                ? 'নাম, মোবাইল নম্বর বা সদস্য আইডি দিয়ে খুঁজুন...'
                : 'Search by name, phone or SOM ID...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-neutral-700"
          >
            <option value="all">{language === 'bn' ? 'সকল পদবি (All Roles)' : 'All Roles'}</option>
            <option value="president">{language === 'bn' ? 'সভাপতি' : 'President'}</option>
            <option value="secretary">{language === 'bn' ? 'সাধারণ সম্পাদক' : 'Secretary'}</option>
            <option value="cashier">{language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}</option>
            <option value="executive">{language === 'bn' ? 'কার্যনির্বাহী সদস্য' : 'Executive Member'}</option>
            <option value="member">{language === 'bn' ? 'সাধারণ সদস্য' : 'General Member'}</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center p-0.5 bg-neutral-200/80 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                viewMode === 'cards' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {language === 'bn' ? 'কার্ড' : 'Cards'}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {language === 'bn' ? 'টেবিল' : 'Table'}
            </button>
          </div>
        </div>
      </div>

      {/* MEMBER CARDS VIEW */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const roleBadge = getRoleBadge(member.role);
            const memberTxCount = transactions.filter((t) => t.memberId === member.id).length;

            return (
              <div
                key={member.id}
                className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-neutral-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top line: ID, Role, and Login Credential */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded border border-neutral-200">
                        {member.memberNo}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCredMember(member)}
                        className="text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-mono px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                        title={language === 'bn' ? 'ইউজার আইডি ও পাসওয়ার্ড পরিবর্তন' : 'Manage User ID & Password'}
                      >
                        <KeyRound className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{member.password ? 'PW: ••••••' : 'PW: সেট করুন'}</span>
                      </button>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${roleBadge.className}`}>
                      {roleBadge.label}
                    </span>
                  </div>

                  {/* Name and Phone */}
                  <div className="flex items-center gap-3 mb-4">
                    <MemberAvatar member={member} sizeClassName="w-11 h-11" />
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm leading-tight">
                        {language === 'bn' ? member.nameBn : member.nameEn}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-50 p-3 rounded-lg border border-neutral-150 mb-4">
                    <div>
                      <span className="text-neutral-500 text-[11px] block">
                        {language === 'bn' ? 'মোট সঞ্চয় জমা' : 'Savings Balance'}
                      </span>
                      <strong className="text-emerald-700 font-mono tabular-nums text-sm">
                        {formatCurrency(member.totalSavingsDeposited, language)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[11px] block">
                        {language === 'bn' ? 'মাসিক ধার্য কিস্তি' : 'Monthly Target'}
                      </span>
                      <strong className="text-neutral-900 font-mono tabular-nums text-sm">
                        {formatCurrency(member.monthlySavingsCommitment, language)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[11px] block">
                        {language === 'bn' ? 'শেয়ার' : 'Shares'}
                      </span>
                      <span className="text-neutral-800 font-mono font-medium">
                        {language === 'bn' ? `${toBengaliNumber(member.shareCount)} টি` : `${member.shareCount} Shares`}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[11px] block">
                        {language === 'bn' ? 'জমা কিস্তির সংখ্যা' : 'Installments'}
                      </span>
                      <span className="text-neutral-800 font-mono font-medium">
                        {language === 'bn' ? `${toBengaliNumber(memberTxCount)} বার` : `${memberTxCount} Times`}
                      </span>
                    </div>
                  </div>

                  {/* Nominee Info preview */}
                  {member.nomineeName && (
                    <div className="text-[11px] text-neutral-500 mb-4 px-1">
                      <span>{language === 'bn' ? 'নমিনি:' : 'Nominee:'}</span>{' '}
                      <strong className="text-neutral-700">{member.nomineeName}</strong>{' '}
                      <span>({member.nomineeRelation})</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenProfile(member)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex-1 justify-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'প্রোফাইল ও পাসবই' : 'Profile & Passbook'}</span>
                  </button>

                  {isCashier && (
                    <button
                      onClick={() => onOpenCollectModal(member.id, 'savings', undefined, member.monthlySavingsCommitment || 1000)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? '১,০০০৳ কিস্তি' : 'Collect'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setCredMember(member)}
                    className="p-1.5 text-emerald-700 hover:text-emerald-950 rounded-lg hover:bg-emerald-50 transition-colors"
                    title={language === 'bn' ? 'ইউজার আইডি ও পাসওয়ার্ড পরিবর্তন' : 'Change User ID & Password'}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onEditMember(member)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition-colors"
                    title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(language === 'bn' ? `আপনি কি ${member.nameBn} সদস্যকে মুছে ফেলতে চান?` : `Are you sure you want to delete ${member.nameEn}?`)) {
                        deleteMember(member.id);
                      }
                    }}
                    className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100 transition-colors"
                    title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4"># {language === 'bn' ? 'আইডি' : 'ID'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'সদস্যের নাম' : 'Name'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'পদবি' : 'Role'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'মোবাইল' : 'Phone'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'শেয়ার' : 'Shares'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'ধার্য কিস্তি' : 'Monthly Target'}</th>
                  <th className="py-3 px-4 text-right">{language === 'bn' ? 'মোট সঞ্চয়' : 'Total Savings'}</th>
                  <th className="py-3 px-4 text-center">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredMembers.map((member) => {
                  const roleBadge = getRoleBadge(member.role);
                  return (
                    <tr key={member.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-800">{member.memberNo}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar member={member} sizeClassName="w-8 h-8" />
                          <div>
                            <div className="font-bold text-neutral-900">
                              {language === 'bn' ? member.nameBn : member.nameEn}
                            </div>
                            <div className="text-[11px] text-neutral-500">{member.nameEn}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{member.phone}</td>
                      <td className="py-3 px-4 font-mono">{member.shareCount}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-neutral-800">
                        {formatCurrency(member.monthlySavingsCommitment, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-700">
                        {formatCurrency(member.totalSavingsDeposited, language)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenProfile(member)}
                            className="px-2 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded"
                          >
                            {language === 'bn' ? 'প্রোফাইল' : 'Profile'}
                          </button>
                          {isCashier && (
                            <button
                              onClick={() => onOpenCollectModal(member.id, 'savings', undefined, member.monthlySavingsCommitment || 1000)}
                              className="px-2 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded"
                            >
                              {language === 'bn' ? '১,০০০৳ কিস্তি' : 'Collect'}
                            </button>
                          )}
                          <button
                            onClick={() => setCredMember(member)}
                            className="p-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded"
                            title={language === 'bn' ? 'ইউজার আইডি ও পাসওয়ার্ড' : 'Credentials'}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditMember(member)}
                            className="p-1 text-neutral-500 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(language === 'bn' ? `আপনি কি ${member.nameBn} সদস্যকে মুছে ফেলতে চান?` : `Are you sure you want to delete ${member.nameEn}?`)) {
                                deleteMember(member.id);
                              }
                            }}
                            className="p-1 text-neutral-500 hover:text-red-600 bg-neutral-100 hover:bg-neutral-200 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* Admin Credential Management Modal */}
      <ManageCredentialsModal
        member={credMember}
        isOpen={!!credMember}
        onClose={() => setCredMember(null)}
      />
    </div>
  );
};

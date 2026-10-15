import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Sparkles, Camera, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Member, MemberRole, Language } from '../types/somiti';
import { normalizeNumberInput, parseBengaliNumber } from '../utils/formatters';
import { useSomiti } from '../context/SomitiContext';
import { PhotoCropModal } from './PhotoCropModal';
import { DateInput } from './DateInput';

interface AddEditMemberModalProps {
  memberToEdit?: Member | null;
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const AddEditMemberModal: React.FC<AddEditMemberModalProps> = ({
  memberToEdit,
  isOpen,
  language,
  onClose,
  onSave,
}) => {
  const { currentMember, members } = useSomiti();
  const isAdmin = currentMember?.role === 'lead_executive';

  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const [monthlySavingsCommitment, setMonthlySavingsCommitment] = useState<string | number>(1000);
  const [shareCount, setShareCount] = useState<number | string>(12.5);
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [notes, setNotes] = useState('');

  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [nomineeNid, setNomineeNid] = useState('');
  const [nomineeSharePercent, setNomineeSharePercent] = useState<number | string>(100);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Portal Permissions
  const [canViewProfile, setCanViewProfile] = useState(true);
  const [canViewPassbook, setCanViewPassbook] = useState(true);
  const [canViewDashboard, setCanViewDashboard] = useState(true);
  const [canViewSavings, setCanViewSavings] = useState(true);
  const [canViewLoans, setCanViewLoans] = useState(true);
  const [canViewInvestments, setCanViewInvestments] = useState(true);
  const [canViewStatement, setCanViewStatement] = useState(true);
  const [canViewReports, setCanViewReports] = useState(false);
  const [canViewRules, setCanViewRules] = useState(true);
  const [canViewMembersDirectory, setCanViewMembersDirectory] = useState(true);

  // Crop Modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');

  useEffect(() => {
    if (memberToEdit) {
      setNameEn(memberToEdit.nameEn || '');
      setNameBn(memberToEdit.nameBn || '');
      setPhone(memberToEdit.phone || '');
      setNid(memberToEdit.nid || '');
      setRole(memberToEdit.role || 'member');
      setMonthlySavingsCommitment(memberToEdit.monthlySavingsCommitment || 1000);
      setShareCount(memberToEdit.shareCount ?? Number((100 / (members.length || 1)).toFixed(2)));
      setAddress(memberToEdit.address || memberToEdit.presentAddress || '');
      setPresentAddress(memberToEdit.presentAddress || memberToEdit.address || '');
      setPermanentAddress(memberToEdit.permanentAddress || memberToEdit.address || '');
      setFatherName(memberToEdit.fatherName || '');
      setMotherName(memberToEdit.motherName || '');
      setBloodGroup(memberToEdit.bloodGroup || '');
      setPhotoUrl(memberToEdit.photoUrl || '');
      setDateOfBirth(memberToEdit.dateOfBirth || '');
      setJoinDate(memberToEdit.joinDate || '');
      setNomineeName(memberToEdit.nomineeName || '');
      setNomineeRelation(memberToEdit.nomineeRelation || '');
      setNomineePhone(memberToEdit.nomineePhone || '');
      setNomineeNid(memberToEdit.nomineeNid || '');
      setNomineeSharePercent(memberToEdit.nomineeSharePercent ?? 100);
      setPassword(memberToEdit.password || '');
      setNotes(memberToEdit.notes || '');
      setCanViewProfile(memberToEdit.permissions?.canViewProfile ?? true);
      setCanViewPassbook(memberToEdit.permissions?.canViewPassbook ?? memberToEdit.permissions?.canViewSavings ?? true);
      setCanViewDashboard(memberToEdit.permissions?.canViewDashboard ?? true);
      setCanViewSavings(memberToEdit.permissions?.canViewSavings ?? true);
      setCanViewLoans(memberToEdit.permissions?.canViewLoans ?? true);
      setCanViewInvestments(memberToEdit.permissions?.canViewInvestments ?? true);
      setCanViewStatement(memberToEdit.permissions?.canViewStatement ?? true);
      setCanViewReports(memberToEdit.permissions?.canViewReports ?? false);
      setCanViewRules(memberToEdit.permissions?.canViewRules ?? true);
      setCanViewMembersDirectory(memberToEdit.permissions?.canViewMembersDirectory ?? true);
    } else {
      setNameEn('');
      setNameBn('');
      setPhone('');
      setNid('');
      setRole('member');
      setMonthlySavingsCommitment(1000);
      setShareCount(Number((100 / ((members.length || 0) + 1)).toFixed(2)));
      setAddress('');
      setPresentAddress('');
      setPermanentAddress('');
      setFatherName('');
      setMotherName('');
      setBloodGroup('');
      setPhotoUrl('');
      setDateOfBirth('');
      setJoinDate(new Date().toISOString().split('T')[0]);
      setNomineeName('');
      setNomineeRelation('');
      setNomineePhone('');
      setNomineeNid('');
      setNomineeSharePercent(100);
      setPassword(Math.floor(100000 + Math.random() * 900000).toString());
      setNotes('');
      setCanViewProfile(true);
      setCanViewPassbook(true);
      setCanViewDashboard(true);
      setCanViewSavings(true);
      setCanViewLoans(true);
      setCanViewInvestments(true);
      setCanViewReports(false);
      setCanViewRules(true);
      setCanViewMembersDirectory(true);
    }
  }, [memberToEdit, isOpen, members.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...(memberToEdit ? memberToEdit : {}),
      memberNo: memberToEdit ? memberToEdit.memberNo : `FIO-${100 + members.length + 1}`,
      nameEn: nameEn.trim(),
      nameBn: nameBn.trim(),
      phone: phone.trim(),
      nid: nid.trim(),
      role,
      monthlySavingsCommitment: Number(monthlySavingsCommitment) || 1000,
      shareCount: isAdmin ? (parseBengaliNumber(shareCount) || Number((100 / members.length).toFixed(2))) : (memberToEdit?.shareCount ?? 12.5),
      shareFaceValue: memberToEdit ? memberToEdit.shareFaceValue : 1000,
      totalSavingsDeposited: memberToEdit ? memberToEdit.totalSavingsDeposited : 0,
      status: memberToEdit ? memberToEdit.status : 'active',
      address: address.trim() || presentAddress.trim(),
      presentAddress: presentAddress.trim() || address.trim(),
      permanentAddress: permanentAddress.trim() || address.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      bloodGroup: bloodGroup.trim(),
      photoUrl: photoUrl.trim(),
      dateOfBirth,
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      nomineeName: nomineeName.trim(),
      nomineeRelation: nomineeRelation.trim(),
      nomineePhone: nomineePhone.trim(),
      nomineeNid: nomineeNid.trim(),
      nomineeSharePercent: Number(nomineeSharePercent) || 100,
      password: password.trim(),
      notes: notes.trim(),
      permissions: {
        canViewProfile,
        canViewPassbook,
        canViewDashboard,
        canViewSavings: canViewPassbook,
        canViewLoans,
        canViewInvestments,
        canViewStatement,
        canViewReports,
        canViewRules,
        canViewMembersDirectory,
        canEditProfile: canViewProfile,
      },
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-blue-900/50">
          <div className="flex items-center gap-2">
            {memberToEdit ? <Save className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            <h2 className="text-base font-bold">
              {memberToEdit
                ? (language === 'bn' ? 'সদস্য তথ্য সংশোধন' : 'Edit Member Details')
                : (language === 'bn' ? 'নতুন সমবায় সদস্য নিবন্ধন' : 'Register New Member')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Profile Photo Upload & Circular Crop Section */}
          <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="w-16 h-16 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Member" className="w-full h-full object-cover" />
              ) : (
                nameEn ? nameEn.charAt(0) : '?'
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'সদস্যের ছবি আপলোড ও ফেস ক্রপ' : 'Member Photo & Circular Crop'}
              </label>
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
                className="w-full text-xs text-neutral-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'নাম (ইংরেজি) *' : 'Name (English) *'}
              </label>
              <input
                type="text"
                placeholder="e.g. Milon Talukder"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'নাম (বাংলা) *' : 'Name (Bangla) *'}
              </label>
              <input
                type="text"
                placeholder="যেমন: মিলন তালুকদার"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
              </label>
              <input
                type="text"
                placeholder="01714868298"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'জাতীয় পরিচয়পত্র নম্বর (NID)' : 'NID Number'}
              </label>
              <input
                type="text"
                placeholder="198526954123..."
                value={nid}
                onChange={(e) => setNid(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'সদস্যের ভূমিকা (Role)' : 'Member Role'}
              </label>
              <select
                value={role}
                disabled={!isAdmin}
                onChange={(e) => setRole(e.target.value as MemberRole)}
                className={`w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${!isAdmin ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : ''}`}
              >
                <option value="lead_executive">{language === 'bn' ? 'সভাপতি, সম্পাদক ও ক্যাশিয়ার (প্রধান নিয়ন্ত্রক)' : 'President, Secretary & Cashier'}</option>
                <option value="member">{language === 'bn' ? 'সাধারণ সদস্য' : 'General Member'}</option>
                <option value="cashier">{language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}</option>
                <option value="president">{language === 'bn' ? 'সভাপতি' : 'President'}</option>
                <option value="secretary">{language === 'bn' ? 'সাধারণ সম্পাদক' : 'Secretary'}</option>
                <option value="executive">{language === 'bn' ? 'কার্যনির্বাহী সদস্য' : 'Executive Member'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1 flex items-center justify-between">
                <span>{language === 'bn' ? 'শেয়ার সংখ্যা (মোট ১০০ শেয়ার সমান)' : 'Share Count (Total 100 Equal)'}</span>
                {!isAdmin && <span className="text-[10px] text-amber-700 font-bold">🔒 Locked</span>}
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="100"
                disabled={!isAdmin}
                value={shareCount}
                onChange={(e) => setShareCount(Number(e.target.value))}
                className={`w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg font-mono tabular-nums ${!isAdmin ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-emerald-500'}`}
                required
              />
              {!isAdmin && (
                <p className="text-[10px] text-amber-700 mt-1 font-medium">
                  {language === 'bn' ? 'শেয়ার অপশন লক করা আছে (শুধুমাত্র অ্যাডমিন পরিবর্তন করতে পারবেন)' : 'Share option is locked (Admin only)'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'মাসিক ধার্য সঞ্চয় কিস্তি (৳) *' : 'Monthly Savings Kisti (BDT) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">৳</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1000"
                  value={monthlySavingsCommitment}
                  onChange={(e) => setMonthlySavingsCommitment(normalizeNumberInput(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tabular-nums font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'রক্তের গ্রুপ (Blood Group)' : 'Blood Group'}
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">{language === 'bn' ? 'বাছাই করুন' : 'Select Blood Group'}</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'পিতার নাম' : "Father's Name"}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'পিতার পূর্ণ নাম' : "Father's Name"}
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'মাতার নাম' : "Mother's Name"}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'মাতার পূর্ণ নাম' : "Mother's Name"}
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'বর্তমান ঠিকানা' : 'Present Address'}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: সিতাইকুন্ড, কোটালীপাড়া' : 'Present Address'}
                value={presentAddress || address}
                onChange={(e) => {
                  setPresentAddress(e.target.value);
                  setAddress(e.target.value);
                }}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
                value={permanentAddress || address}
                onChange={(e) => setPermanentAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label={language === 'bn' ? 'যোগদানের তারিখ' : 'Join Date'}
              value={joinDate}
              onChange={(val) => setJoinDate(val)}
            />

            <DateInput
              label={language === 'bn' ? 'জন্মতারিখ' : 'Date of Birth'}
              value={dateOfBirth}
              onChange={(val) => setDateOfBirth(val)}
            />
          </div>

          {/* Nominee Section */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-3">
            <div className="font-bold text-xs text-emerald-950 flex items-center justify-between">
              <span>{language === 'bn' ? '📋 নমিনী সংক্রান্ত তথ্য (Nominee Details)' : '📋 Nominee Details'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">{language === 'bn' ? 'ধারা ১০ অনুযায়ী সুরক্ষিত' : 'Protected under Bylaw 10'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'নমিনীর নাম' : 'Nominee Name'}
                </label>
                <input
                  type="text"
                  placeholder="নমিনীর নাম"
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'সম্পর্ক' : 'Relation'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: স্ত্রী / পুত্র"
                  value={nomineeRelation}
                  onChange={(e) => setNomineeRelation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'নমিনীর মোবাইল' : 'Nominee Phone'}
                </label>
                <input
                  type="text"
                  placeholder="নমিনীর ফোন"
                  value={nomineePhone}
                  onChange={(e) => setNomineePhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg font-mono bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'নমিনীর এনআইডি (NID)' : 'Nominee NID'}
                </label>
                <input
                  type="text"
                  placeholder="নমিনীর NID নম্বর"
                  value={nomineeNid}
                  onChange={(e) => setNomineeNid(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'নমিনীর অংশের হার (%)' : 'Nominee Share (%)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="100"
                  value={nomineeSharePercent}
                  onChange={(e) => setNomineeSharePercent(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg font-mono bg-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Member Login Credentials Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-700" />
                <span>{language === 'bn' ? 'লগইন পাসওয়ার্ড ও একাউন্ট সিকিউরিটি' : 'Login Password & Security'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
                  setPassword(randomPin);
                  setShowPassword(true);
                }}
                className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                {language === 'bn' ? '🎲 নতুন পিন তৈরি' : 'Generate PIN'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">
                  {language === 'bn' ? 'লগইন আইডি' : 'Login ID'}
                </label>
                <input
                  type="text"
                  disabled
                  value={memberToEdit ? memberToEdit.memberNo : `FIO-${100 + members.length + 1}`}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600 font-mono font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">
                  {language === 'bn' ? 'লগইন পাসওয়ার্ড *' : 'Login Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড বা পিন"
                    className="w-full pl-3 pr-10 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500">
              {language === 'bn'
                ? 'সংরক্ষণ করার পর এই পাসওয়ার্ডটি কেন্দ্রীয় ক্লাউড ডাটাবেসে সেভ হবে এবং সদস্য এই পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।'
                : 'Saving will persist credentials to cloud database for live member portal authentication.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
              {language === 'bn' ? 'বিশেষ নোট / মন্তব্য' : 'Notes'}
            </label>
            <textarea
              rows={2}
              placeholder="অন্যান্য তথ্য..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg"
            />
          </div>

          {/* Admin Member Portal Permissions Config */}
          <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-3">
            <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
              <span>🔒</span>
              <span>{language === 'bn' ? 'সদস্য পোর্টাল অ্যাক্সেস পারমিশন (Admin Permissions)' : 'Member Portal Access Permissions'}</span>
            </div>
            <p className="text-[11px] text-amber-800">
              {language === 'bn' ? 'অ্যাডমিন হিসেবে নির্ধারণ করুন এই সদস্য তার অ্যাপ পোর্টালের ভেতরে কি কি দেখতে পারবেন:' : 'Configure what sections this member is permitted to view inside their app portal:'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs text-neutral-800 font-medium">
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:border-emerald-500 transition-colors">
                <input
                  type="checkbox"
                  checked={canViewProfile}
                  onChange={(e) => setCanViewProfile(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{language === 'bn' ? '👤 প্রোফাইল' : '👤 Profile'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:border-emerald-500 transition-colors">
                <input
                  type="checkbox"
                  checked={canViewPassbook}
                  onChange={(e) => {
                    setCanViewPassbook(e.target.checked);
                    setCanViewSavings(e.target.checked);
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{language === 'bn' ? '📖 পাসবই' : '📖 Passbook'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:border-emerald-500 transition-colors">
                <input
                  type="checkbox"
                  checked={canViewDashboard}
                  onChange={(e) => setCanViewDashboard(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{language === 'bn' ? '📊 ড্যাশবোর্ড' : '📊 Dashboard'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:border-emerald-500 transition-colors">
                <input
                  type="checkbox"
                  checked={canViewLoans}
                  onChange={(e) => setCanViewLoans(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{language === 'bn' ? '💳 ঋণ হিসাব' : '💳 Loans'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:border-emerald-500 transition-colors">
                <input
                  type="checkbox"
                  checked={canViewInvestments}
                  onChange={(e) => setCanViewInvestments(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{language === 'bn' ? '💼 বিনিয়োগ' : '💼 Investment'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:border-teal-500 transition-colors">
                <input
                  type="checkbox"
                  checked={canViewStatement}
                  onChange={(e) => setCanViewStatement(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>{language === 'bn' ? '📑 স্টেটমেন্ট' : '📑 Statement'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:border-emerald-500 transition-colors">
                <input
                  type="checkbox"
                  checked={canViewRules}
                  onChange={(e) => setCanViewRules(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{language === 'bn' ? '📜 রুলস' : '📜 Rules'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:border-emerald-500 transition-colors">
                <input
                  type="checkbox"
                  checked={canViewReports}
                  onChange={(e) => setCanViewReports(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{language === 'bn' ? '📊 কেন্দ্রীয় স্টেটমেন্ট' : '📊 Central Statement'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-200 hover:border-emerald-500 transition-colors">
                <input
                  type="checkbox"
                  checked={canViewMembersDirectory}
                  onChange={(e) => setCanViewMembersDirectory(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{language === 'bn' ? 'সদস্য তালিকা' : 'Members Directory'}</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              {memberToEdit
                ? language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'
                : language === 'bn' ? 'সদস্য নিবন্ধন করুন' : 'Register Member'}
            </button>
          </div>
        </form>
      </div>

      {/* Photo Crop Modal */}
      <PhotoCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        language={language}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={(croppedUrl) => {
          setPhotoUrl(croppedUrl);
        }}
      />
    </div>
  );
};

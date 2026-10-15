import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, CheckCircle2, AlertCircle, Coins, Sparkles, Plus, Calculator, Calendar } from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { KistiType, PaymentMethod, KistiTransaction } from '../types/somiti';
import { formatCurrency, toBengaliNumber, normalizeNumberInput, parseBengaliNumber } from '../utils/formatters';

interface CollectKistiModalProps {
  initialMemberId?: string;
  initialType?: KistiType;
  initialPeriodMonth?: string;
  initialAmount?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: KistiTransaction) => void;
}

export const CollectKistiModal: React.FC<CollectKistiModalProps> = ({
  initialMemberId,
  initialType = 'savings',
  initialPeriodMonth,
  initialAmount,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { members, loans, projects, collectKisti, language, currentMember: loggedInMember } = useSomiti();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMemberId || '');
  const [kistiType, setKistiType] = useState<KistiType>(initialType);
  
  // Clean, isolated date inputs to allow complete backdated entry (e.g. 10/10/2024) without auto-reset
  const [dateDay, setDateDay] = useState<string>('');
  const [dateMonth, setDateMonth] = useState<string>('');
  const [dateYear, setDateYear] = useState<string>('');
  const [periodMonth, setPeriodMonth] = useState<string>('');
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [collectorName, setCollectorName] = useState<string>(loggedInMember?.nameEn || 'Milon Talukder (Cashier)');
  const [remarks, setRemarks] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [kistiCount, setKistiCount] = useState<number>(1);

  // Manual Principal Amount and Fine/Late Fee Amount inputs
  const [principalAmount, setPrincipalAmount] = useState<string | number>(initialAmount ?? 1000);
  const [fineAmount, setFineAmount] = useState<string | number>(0);

  // Dynamic Numeric totals
  const numericPrincipal = Math.max(0, parseBengaliNumber(principalAmount) || 0);
  const numericFine = Math.max(0, parseBengaliNumber(fineAmount) || 0);
  const totalCollectedAmount = numericPrincipal + numericFine;

  // Complete list of target months from 2024 to 2027
  const monthOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    const bMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    for (let y = 2024; y <= 2027; y++) {
      for (let m = 1; m <= 12; m++) {
        const val = `${y}-${String(m).padStart(2, '0')}`;
        const label = `${bMonths[m - 1]} ${toBengaliNumber(y)} (${val})`;
        list.push({ value: val, label });
      }
    }
    return list;
  }, []);

  // Track modal open transition so we ONLY initialize once when opened.
  // CRITICAL: We do NOT re-sync or reset dateDay/dateMonth/dateYear while the modal stays open!
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setError('');
      setKistiCount(1);
      setFineAmount(0);

      const targetMemberId = initialMemberId || (members.length > 0 ? members[0].id : '');
      setSelectedMemberId(targetMemberId);
      const targetType = initialType || 'savings';
      setKistiType(targetType);

      // Default date to today once upon opening
      const today = new Date();
      setDateDay(String(today.getDate()).padStart(2, '0'));
      setDateMonth(String(today.getMonth() + 1).padStart(2, '0'));
      setDateYear(String(today.getFullYear()));

      // Target Month strictly independent from Payment Date
      if (initialPeriodMonth) {
        setPeriodMonth(initialPeriodMonth);
      } else {
        const curY = today.getFullYear();
        const curM = String(today.getMonth() + 1).padStart(2, '0');
        setPeriodMonth(`${curY}-${curM}`);
      }

      // Base amount initialization
      const mem = members.find((m) => m.id === targetMemberId);
      let base = 1000;
      if (initialAmount !== undefined && initialAmount > 0) {
        base = initialAmount;
      } else if (targetType === 'savings') {
        base = mem?.monthlySavingsCommitment || 1000;
      } else if (targetType === 'loan_repayment') {
        const activeLoan = loans.find((l) => l.memberId === targetMemberId && l.status === 'active');
        if (activeLoan) {
          setSelectedLoanId(activeLoan.id);
          base = activeLoan.installmentAmount || 1000;
        }
      } else if (targetType === 'project_share') {
        base = 5000;
      }
      setPrincipalAmount(base);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // When selected member or kistiType changes while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const mem = members.find((m) => m.id === selectedMemberId);
    if (!mem) return;

    if (kistiType === 'savings') {
      if (initialAmount === undefined) {
        setPrincipalAmount((mem.monthlySavingsCommitment || 1000) * kistiCount);
      }
    } else if (kistiType === 'loan_repayment') {
      const activeLoan = loans.find((l) => l.memberId === mem.id && l.status === 'active');
      if (activeLoan) {
        setSelectedLoanId(activeLoan.id);
        if (initialAmount === undefined) {
          setPrincipalAmount(activeLoan.installmentAmount);
        }
      } else {
        setSelectedLoanId('');
        if (initialAmount === undefined) {
          setPrincipalAmount(1000);
        }
      }
    } else if (kistiType === 'project_share') {
      if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
      }
      if (initialAmount === undefined) {
        setPrincipalAmount(5000);
      }
    } else if (kistiType === 'fine_fee') {
      if (initialAmount === undefined) {
        setPrincipalAmount(100);
      }
    }
  }, [selectedMemberId, kistiType]);

  const handleKistiCountChange = (count: number) => {
    setKistiCount(count);
    const mem = members.find((m) => m.id === selectedMemberId);
    const unit = mem?.monthlySavingsCommitment || 1000;
    setPrincipalAmount(unit * count);
  };

  if (!isOpen) return null;

  const currentMember = members.find((m) => m.id === selectedMemberId);
  const memberLoans = loans.filter((l) => l.memberId === selectedMemberId && l.status === 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError(language === 'bn' ? 'দয়া করে একজন সদস্য নির্বাচন করুন' : 'Please select a member');
      return;
    }

    if (numericPrincipal <= 0 && numericFine <= 0) {
      setError(language === 'bn' ? 'সঠিক টাকার পরিমাণ দিন (যেমন: ১০০০ ৳)' : 'Please enter a valid amount (e.g. 1000 BDT)');
      return;
    }

    try {
      let finalRemarks = remarks.trim();
      const extraNotes = [];
      if (kistiCount > 1) {
        extraNotes.push(language === 'bn' ? `${toBengaliNumber(kistiCount)} মাসের কিস্তি একসাথে` : `${kistiCount} Months Kisti`);
      }
      if (numericFine > 0) {
        extraNotes.push(language === 'bn' ? `জরিমানা: ৳${toBengaliNumber(numericFine)}` : `Fine: ৳${numericFine}`);
      }
      if (extraNotes.length > 0) {
        finalRemarks = finalRemarks ? `${finalRemarks} (${extraNotes.join(', ')})` : extraNotes.join(', ');
      }

      // Assemble the exact date without any auto-reset or reversion to current timestamp
      const dStr = dateDay.trim().padStart(2, '0') || '01';
      const mStr = dateMonth.trim().padStart(2, '0') || '01';
      let yStr = dateYear.trim();
      if (yStr.length === 2) yStr = `20${yStr}`;
      else if (!yStr) yStr = '2026';
      const resolvedDate = `${yStr}-${mStr}-${dStr}`;

      const newTx = collectKisti({
        memberId: selectedMemberId,
        type: kistiType,
        principalAmount: numericPrincipal,
        fineAmount: numericFine,
        totalPaid: totalCollectedAmount,
        amount: totalCollectedAmount, // backwards-compatible total
        date: resolvedDate,
        actualPaymentDate: resolvedDate,
        periodMonth: periodMonth || `${yStr}-${mStr}`,
        targetMonth: periodMonth || `${yStr}-${mStr}`,
        paymentMethod,
        collectedBy: collectorName,
        collector: collectorName,
        remarks: finalRemarks,
        loanId: kistiType === 'loan_repayment' ? selectedLoanId : undefined,
        projectId: kistiType === 'project_share' ? selectedProjectId : undefined,
      });

      onSuccess(newTx);
      onClose();
    } catch {
      setError(language === 'bn' ? 'ট্রানজেকশন সংরক্ষণে ত্রুটি হয়েছে' : 'Failed to record transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden text-neutral-900 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-semibold">
              {language === 'bn' ? 'কিস্তি ও টাকা কালেকশন' : 'Collect Kisti & Dues'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Member Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
              {language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Select Member'}
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberNo} - {language === 'bn' ? m.nameBn : m.nameEn} ({m.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Kisti Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
              {language === 'bn' ? 'জমার ধরন (খাত)' : 'Collection Type'}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setKistiType('savings')}
                className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  kistiType === 'savings'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-xs ring-1 ring-emerald-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {language === 'bn' ? 'সঞ্চয় কিস্তি' : 'Savings'}
              </button>
              <button
                type="button"
                onClick={() => setKistiType('loan_repayment')}
                className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  kistiType === 'loan_repayment'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-xs ring-1 ring-emerald-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {language === 'bn' ? 'ঋণের কিস্তি' : 'Loan Installment'}
              </button>
              <button
                type="button"
                onClick={() => setKistiType('project_share')}
                className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  kistiType === 'project_share'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-xs ring-1 ring-emerald-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {language === 'bn' ? 'প্রকল্প চাঁদা' : 'Project Share'}
              </button>
              <button
                type="button"
                onClick={() => setKistiType('fine_fee')}
                className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  kistiType === 'fine_fee'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-xs ring-1 ring-emerald-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {language === 'bn' ? 'ভর্তি / অন্যান্য ফি' : 'Admission / Other Fee'}
              </button>
            </div>
          </div>

          {/* Conditional loan or project selector */}
          {kistiType === 'loan_repayment' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'চলমান ঋণ হিসাব' : 'Active Loan Account'}
              </label>
              {memberLoans.length > 0 ? (
                <select
                  value={selectedLoanId}
                  onChange={(e) => {
                    setSelectedLoanId(e.target.value);
                    const selected = memberLoans.find((l) => l.id === e.target.value);
                    if (selected) {
                      setPrincipalAmount(selected.installmentAmount);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {memberLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.loanNo} - বকেয়া: {formatCurrency(loan.remainingAmount, language)} (কিস্তি: {formatCurrency(loan.installmentAmount, language)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 text-xs text-amber-800 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                  <p className="font-semibold">{language === 'bn' ? 'এই সদস্যের কোনো চলমান সক্রিয় ঋণ নেই।' : 'This member has no active loan.'}</p>
                  <button
                    type="button"
                    onClick={() => setKistiType('savings')}
                    className="mt-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-colors"
                  >
                    {language === 'bn' ? '✓ সঞ্চয় কিস্তি জমা নিন' : '✓ Switch to Savings Kisti'}
                  </button>
                </div>
              )}
            </div>
          )}

          {kistiType === 'project_share' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'প্রকল্প নির্বাচন' : 'Target Project'}
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {language === 'bn' ? p.titleBn : p.titleEn}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Date & Target Month - Cleanly editable and strictly independent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            {/* Payment Date (প্রকৃত জমার তারিখ) - Isolated Day, Month, Year Inputs */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700 uppercase">
                  {language === 'bn' ? 'প্রকৃত জমার তারিখ' : 'Payment Date'} <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-neutral-500 font-mono">DD / MM / YYYY</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 bg-white border border-neutral-300 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 shadow-2xs">
                {/* Day Input */}
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="DD"
                    value={dateDay}
                    onChange={(e) => {
                      const clean = normalizeNumberInput(e.target.value).slice(0, 2);
                      setDateDay(clean);
                      if (error) setError('');
                    }}
                    className="w-9 text-center font-mono font-bold text-sm text-neutral-900 focus:outline-none"
                    title="দিন (Day 01-31)"
                  />
                  <span className="text-[9px] text-neutral-400">দিন</span>
                </div>
                <span className="text-neutral-400 font-bold">/</span>

                {/* Month Input */}
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM"
                    value={dateMonth}
                    onChange={(e) => {
                      const clean = normalizeNumberInput(e.target.value).slice(0, 2);
                      setDateMonth(clean);
                      if (error) setError('');
                    }}
                    className="w-9 text-center font-mono font-bold text-sm text-neutral-900 focus:outline-none"
                    title="মাস (Month 01-12)"
                  />
                  <span className="text-[9px] text-neutral-400">মাস</span>
                </div>
                <span className="text-neutral-400 font-bold">/</span>

                {/* Year Input */}
                <div className="flex flex-col items-center flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY"
                    value={dateYear}
                    onChange={(e) => {
                      const clean = normalizeNumberInput(e.target.value).slice(0, 4);
                      setDateYear(clean);
                      if (error) setError('');
                    }}
                    className="w-16 text-center font-mono font-bold text-sm text-neutral-900 focus:outline-none"
                    title="বছর (Year e.g. 2024)"
                  />
                  <span className="text-[9px] text-neutral-400">বছর</span>
                </div>

                {/* Quick Today Button */}
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setDateDay(String(today.getDate()).padStart(2, '0'));
                    setDateMonth(String(today.getMonth() + 1).padStart(2, '0'));
                    setDateYear(String(today.getFullYear()));
                  }}
                  className="px-2 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors shrink-0 cursor-pointer"
                  title="আজকের তারিখ বসান"
                >
                  {language === 'bn' ? 'আজ' : 'Today'}
                </button>
              </div>
            </div>

            {/* Target Month (কিস্তির মাস) - Strictly Independent Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700 uppercase">
                  <span>{language === 'bn' ? 'কিস্তির মাস (Target Month)' : 'Target Month'}</span>
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">
                  {periodMonth}
                </span>
              </div>
              <select
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
                required
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MONEY INPUTS BREAKDOWN (Principal + Manual Fine Entry) */}
          <div className="space-y-3">
            {/* 1. মূল কিস্তির পরিমাণ (Principal Kisti Amount) */}
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-950 uppercase">
                  {language === 'bn' ? 'মূল কিস্তির পরিমাণ (Principal Deposit) *' : 'Principal Kisti Amount *'}
                </label>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {language === 'bn' ? '(সদস্যের মূল সঞ্চয় তহবিলে যোগ হবে)' : '(Adds to Member Savings Capital)'}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 font-bold text-base">৳</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1000"
                  value={principalAmount}
                  onChange={(e) => {
                    const clean = normalizeNumberInput(e.target.value);
                    setPrincipalAmount(clean);
                    if (error) setError('');
                  }}
                  className="w-full pl-8 pr-3 py-2 text-base font-mono font-bold text-neutral-900 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 tabular-nums bg-white shadow-2xs"
                  required
                />
              </div>

              {/* Multiple Kistis Selector chips */}
              {kistiType === 'savings' && (
                <div className="pt-1 space-y-1.5">
                  <div className="text-[11px] font-semibold text-emerald-900 flex items-center justify-between">
                    <span>{language === 'bn' ? 'একাধিক কিস্তি একসাথে জমা:' : 'Multiple Kistis Entry:'}</span>
                    <span className="font-mono text-emerald-800 text-[11px] font-bold">
                      {language === 'bn' ? `${toBengaliNumber(kistiCount)} টি কিস্তি` : `${kistiCount} Kistis`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 6, 12].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleKistiCountChange(cnt)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          kistiCount === cnt
                            ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-500'
                            : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {language === 'bn' ? `${toBengaliNumber(cnt)} কিস্তি` : `${cnt} Kisti`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Amount Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPrincipalAmount(1000);
                    setKistiCount(1);
                    if (error) setError('');
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                    numericPrincipal === 1000
                      ? 'bg-emerald-700 text-white ring-1 ring-emerald-500'
                      : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{language === 'bn' ? '১,০০০ ৳ (ধার্য কিস্তি)' : '৳1,000 (Target)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrincipalAmount(2000);
                    setKistiCount(2);
                    if (error) setError('');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    numericPrincipal === 2000
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span>{language === 'bn' ? '২,০০০ ৳' : '৳2,000'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrincipalAmount(3000);
                    setKistiCount(3);
                    if (error) setError('');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    numericPrincipal === 3000
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span>{language === 'bn' ? '৩,০০০ ৳' : '৳3,000'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrincipalAmount(500);
                    setKistiCount(1);
                    if (error) setError('');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    numericPrincipal === 500
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span>{language === 'bn' ? '৫০০ ৳ (আংশিক)' : '৳500'}</span>
                </button>
              </div>
            </div>

            {/* 2. জরিমানা / লেট ফি (Cashier-Controlled Manual Fine / Late Fee) */}
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-amber-950 uppercase">
                  {language === 'bn' ? 'জরিমানা / লেট ফি (Manual Late Fee)' : 'Late Fee / Fine (Manual)'}
                </label>
                <span className="text-[11px] text-amber-800 font-medium">
                  {language === 'bn' ? '(ক্যাশিয়ারের নিয়ন্ত্রণে ঐচ্ছিক ফি)' : '(Cashier-controlled fee)'}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-800 font-bold text-base">৳</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={fineAmount}
                  onChange={(e) => {
                    const clean = normalizeNumberInput(e.target.value);
                    setFineAmount(clean);
                    if (error) setError('');
                  }}
                  className="w-full pl-8 pr-3 py-2 text-base font-mono font-bold text-amber-950 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums bg-white shadow-2xs"
                />
              </div>

              {/* Quick Fine Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setFineAmount(50);
                    if (error) setError('');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    numericFine === 50
                      ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-500'
                      : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? '+ ৳৫০ জরিমানা যোগ করুন' : '+ ৳50 Fine'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFineAmount(100);
                    if (error) setError('');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    numericFine === 100
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <span>{language === 'bn' ? '+ ৳১০০ জরিমানা' : '+ ৳100 Fine'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFineAmount(0);
                    if (error) setError('');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    numericFine === 0
                      ? 'bg-neutral-700 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span>{language === 'bn' ? '০ ৳ (জরিমানা নেই)' : '৳0 (No Fine)'}</span>
                </button>
              </div>

              <p className="text-[11px] text-amber-800/90 leading-relaxed pt-0.5">
                {language === 'bn'
                  ? 'বিলম্ব বা প্রয়োজন অনুযায়ী ক্যাশিয়ার সরাসরি জরিমানা নির্ধারণ করতে পারেন অথবা ০ টাকা রাখতে পারেন।'
                  : 'Cashier can freely enter any late fine or leave at ৳0. Fines are tracked as administrative income.'}
              </p>
            </div>

            {/* 3. মোট আদায় (Total Collected Amount Dynamic Card) */}
            <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'মোট আদায় (Total Collection)' : 'Total Collected Amount'}</span>
                </div>
                <div className="text-xs text-emerald-200 mt-1">
                  {language === 'bn' ? 'মূল জমা:' : 'Principal:'}{' '}
                  <span className="font-mono font-bold text-white">{formatCurrency(numericPrincipal, language)}</span>
                  {numericFine > 0 && (
                    <>
                      {' + '}{language === 'bn' ? 'জরিমানা:' : 'Fine:'}{' '}
                      <span className="font-mono font-bold text-amber-300">{formatCurrency(numericFine, language)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black font-mono tracking-tight text-white block">
                  {formatCurrency(totalCollectedAmount, language)}
                </span>
                <span className="text-[10px] text-emerald-300 font-mono">
                  {numericFine > 0
                    ? language === 'bn' ? '(মূল জমা + জরিমানা)' : '(Principal + Fine)'
                    : language === 'bn' ? '(শুধুমাত্র মূল জমা)' : '(Principal only)'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method & Collector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'পরিশোধের মাধ্যম' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="cash">{language === 'bn' ? 'নগদ টাকা (Cash)' : 'Cash'}</option>
                <option value="bkash">{language === 'bn' ? 'বিকাশ (bKash)' : 'bKash'}</option>
                <option value="nagad">{language === 'bn' ? 'নগদ (Nagad)' : 'Nagad'}</option>
                <option value="bank">{language === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                {language === 'bn' ? 'ক্যাশিয়ার / সংগ্রহকারী' : 'Collector'}
              </label>
              <input
                type="text"
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
              {language === 'bn' ? 'মন্তব্য বা ট্রানজেকশন আইডি (ঐচ্ছিক)' : 'Remarks / Txn ID (Optional)'}
            </label>
            <input
              type="text"
              placeholder={language === 'bn' ? 'যেমন: নিয়মিত কিস্তি জমা বা বিকাশ TrxID' : 'e.g. Regular monthly kisti or bKash TrxID'}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {language === 'bn'
                  ? `${totalCollectedAmount > 0 ? toBengaliNumber(totalCollectedAmount) + ' ৳ ' : ''}জমা নিন ও রসিদ দিন`
                  : `Confirm & Record ${totalCollectedAmount > 0 ? '৳' + totalCollectedAmount : ''}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

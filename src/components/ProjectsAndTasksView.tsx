import React, { useState } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  PieChart,
  Search,
  Filter,
  Sparkles,
  X,
  FileText,
  DollarSign,
  Briefcase,
  ChevronRight,
  Layers,
  Check,
  Building,
  Phone,
  MapPin,
  User,
  Edit2,
  Users2,
  Handshake,
  Percent,
  FolderKanban,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useSomiti } from '../context/SomitiContext';
import { Project, ProjectCategory, ProjectStatus } from '../types/somiti';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';
import { DateInput } from './DateInput';

export const ProjectsAndTasksView: React.FC = () => {
  const {
    projects,
    members,
    currentMember,
    language,
    addProject,
    updateProject,
    addInvestmentProfit,
  } = useSomiti();

  const isCashier =
    currentMember?.role === 'lead_executive' || currentMember?.role === 'cashier';

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [selectedProjectForProfit, setSelectedProjectForProfit] = useState<Project | null>(null);
  const [viewDetailsProject, setViewDetailsProject] = useState<Project | null>(null);

  // Unified Two-Stage Architecture State (Stage 1: Directory when null, Stage 2: Details when set)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectActiveTab, setProjectActiveTab] = useState<'summary' | 'financials' | 'lessor' | 'supervisor'>('summary');

  // New Investment Form State
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('land_lease');
  const [investedAmount, setInvestedAmount] = useState<number>(50000);
  const [expectedReturnPercent, setExpectedReturnPercent] = useState<number>(11);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [targetEndDate, setTargetEndDate] = useState<string>('2026-12-31');
  const [description, setDescription] = useState('');
  const [leadMemberId, setLeadMemberId] = useState<string>(members[0]?.id || 'mem-1');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('in_progress');

  // Dynamic Category Specific Fields for Add Form:
  // 1. Land Lease / Mortgage (land_lease)
  const [landownerName, setLandownerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [landAreaDagNo, setLandAreaDagNo] = useState('');
  const [leaseDuration, setLeaseDuration] = useState('');

  // 2. General Investment (general_investment)
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [investmentPurpose, setInvestmentPurpose] = useState('');

  // 3. Share Partnership (share_partnership)
  const [partnerNames, setPartnerNames] = useState('');
  const [shareRatio, setShareRatio] = useState('50%-50%');
  const [partnerContact, setPartnerContact] = useState('');

  // Form step / tab states for Add & Edit Modals (4 categorized sections)
  type ProjectFormTab = 'basic' | 'financials' | 'lessor' | 'supervisor';
  const [addModalTab, setAddModalTab] = useState<ProjectFormTab>('basic');
  const [addProfitEarned, setAddProfitEarned] = useState<number>(0);
  const [addProfitVoucher, setAddProfitVoucher] = useState<string>('');
  const [addProfitDate, setAddProfitDate] = useState<string>('');

  // Edit Investment Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editModalTab, setEditModalTab] = useState<ProjectFormTab>('basic');
  const [editTotalProfit, setEditTotalProfit] = useState<number>(0);
  const [editProfitVoucherNo, setEditProfitVoucherNo] = useState<string>('');
  const [editProfitDate, setEditProfitDate] = useState<string>('');
  const [editLeadMemberId, setEditLeadMemberId] = useState<string>('mem-1');
  const [editTitleBn, setEditTitleBn] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editCategory, setEditCategory] = useState<ProjectCategory>('land_lease');
  const [editInvestedAmount, setEditInvestedAmount] = useState<number>(0);
  const [editExpectedReturnPercent, setEditExpectedReturnPercent] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<ProjectStatus>('in_progress');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editTargetEndDate, setEditTargetEndDate] = useState('');

  // Edit Modal Dynamic Category Fields
  const [editLandownerName, setEditLandownerName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editContactAddress, setEditContactAddress] = useState('');
  const [editLandAreaDagNo, setEditLandAreaDagNo] = useState('');
  const [editLeaseDuration, setEditLeaseDuration] = useState('');

  const [editRecipientName, setEditRecipientName] = useState('');
  const [editRecipientPhone, setEditRecipientPhone] = useState('');
  const [editRecipientAddress, setEditRecipientAddress] = useState('');
  const [editInvestmentPurpose, setEditInvestmentPurpose] = useState('');

  const [editPartnerNames, setEditPartnerNames] = useState('');
  const [editShareRatio, setEditShareRatio] = useState('');
  const [editPartnerContact, setEditPartnerContact] = useState('');

  // Profit Entry Form State
  const [profitProjectId, setProfitProjectId] = useState<string>(projects[0]?.id || 'inv-1');
  const [profitAmount, setProfitAmount] = useState<number>(11000);
  const [profitDate, setProfitDate] = useState<string>('2025-08-24');
  const [profitTitle, setProfitTitle] = useState('জমির লিজের মুনাফা/লভ্যাংশ');
  const [profitNotes, setProfitNotes] = useState('জমির লিজ থেকে নিট লাভ আদায় ও সমিতিতে জমা');
  const [profitVoucher, setProfitVoucher] = useState('CB-2025-081');
  const [profitSuccessMsg, setProfitSuccessMsg] = useState('');

  // Calculations
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
  const activeCount = projects.filter((p) => p.status !== 'completed').length;

  // Filtered investments (supports both new categories and backward-compatible legacy ones)
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.titleBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.landownerName && p.landownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.recipientName && p.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.partnerNames && p.partnerNames.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.contactName && p.contactName.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesCat = selectedCategory === 'all';
    if (!matchesCat) {
      if (selectedCategory === 'land_lease') {
        matchesCat = p.category === 'land_lease' || p.category === 'agriculture';
      } else if (selectedCategory === 'general_investment') {
        matchesCat =
          p.category === 'general_investment' ||
          p.category === 'trading' ||
          p.category === 'welfare' ||
          p.category === 'retail' ||
          p.category === 'real_estate' ||
          p.category === 'fisheries';
      } else if (selectedCategory === 'share_partnership') {
        matchesCat = p.category === 'share_partnership';
      } else {
        matchesCat = p.category === selectedCategory;
      }
    }

    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Handle New Investment Submit with Dynamic Validation
  const handleAddInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim()) {
      alert(language === 'bn' ? 'অনুগ্রহ করে বিনিয়োগ প্রকল্পের নাম লিখুন।' : 'Please enter investment title.');
      return;
    }
    if (investedAmount <= 0) {
      alert(language === 'bn' ? 'অনুগ্রহ করে বিনিয়োগকৃত মূলধনের সঠিক পরিমাণ লিখুন।' : 'Please enter valid invested capital.');
      return;
    }

    // Dynamic Category Validation
    if (category === 'land_lease') {
      if (!landownerName.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে জমির মালিকের নাম লিখুন।' : 'Please enter landowner name.');
        return;
      }
      if (!contactPhone.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে জমির মালিকের মোবাইল নম্বর লিখুন।' : 'Please enter phone number.');
        return;
      }
      if (!contactAddress.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে ঠিকানা বা জমির অবস্থান লিখুন।' : 'Please enter land location/address.');
        return;
      }
      if (!leaseDuration.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে লিজের মেয়াদ/সময়কাল লিখুন (যেমন: ২ বছর)।' : 'Please enter lease duration.');
        return;
      }
    } else if (category === 'general_investment') {
      if (!recipientName.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে প্রাপক বা দায়িত্বপ্রাপ্ত ব্যক্তির নাম লিখুন।' : 'Please enter recipient name.');
        return;
      }
      if (!recipientPhone.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে মোবাইল নম্বর লিখুন।' : 'Please enter phone number.');
        return;
      }
      if (!recipientAddress.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে ঠিকানা লিখুন।' : 'Please enter address.');
        return;
      }
      if (!investmentPurpose.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে বিনিয়োগের উদ্দেশ্য বা খাত লিখুন।' : 'Please enter investment purpose.');
        return;
      }
    } else if (category === 'share_partnership') {
      if (!partnerNames.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে পার্টনার বা শেয়ারহোল্ডারদের নাম লিখুন।' : 'Please enter partner names.');
        return;
      }
      if (!shareRatio.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে শেয়ার অনুপাত বা শতকরা হার লিখুন (যেমন: 50%-50%)।' : 'Please enter share ratio.');
        return;
      }
      if (!partnerContact.trim()) {
        alert(language === 'bn' ? 'অনুগ্রহ করে পার্টনারের যোগাযোগ ও ঠিকানা লিখুন।' : 'Please enter partner contact info.');
        return;
      }
    }

    const resolvedContactName =
      category === 'land_lease'
        ? landownerName.trim()
        : category === 'general_investment'
        ? recipientName.trim()
        : partnerNames.trim();

    const resolvedContactPhone =
      category === 'land_lease'
        ? contactPhone.trim()
        : category === 'general_investment'
        ? recipientPhone.trim()
        : partnerContact.trim();

    const resolvedContactAddress =
      category === 'land_lease'
        ? contactAddress.trim()
        : category === 'general_investment'
        ? recipientAddress.trim()
        : partnerContact.trim();

    addProject({
      titleBn: titleBn.trim(),
      titleEn: titleEn.trim() || titleBn.trim(),
      category,
      targetBudget: Number(investedAmount),
      investedAmount: Number(investedAmount),
      expectedReturnPercent: Number(expectedReturnPercent),
      totalProfit: Number(addProfitEarned) || 0,
      profitDate: addProfitDate.trim() || undefined,
      profitVoucherNo: addProfitVoucher.trim() || undefined,
      startDate,
      targetEndDate,
      description: description.trim(),
      leadMemberId,
      status: formStatus,
      // Backward-compatible fields
      contactName: resolvedContactName || undefined,
      contactPhone: resolvedContactPhone || undefined,
      contactAddress: resolvedContactAddress || undefined,
      // Dynamic category-specific fields
      landownerName: category === 'land_lease' ? landownerName.trim() : undefined,
      landAreaDagNo: category === 'land_lease' ? landAreaDagNo.trim() : undefined,
      leaseDuration: category === 'land_lease' ? leaseDuration.trim() : undefined,
      recipientName: category === 'general_investment' ? recipientName.trim() : undefined,
      recipientPhone: category === 'general_investment' ? recipientPhone.trim() : undefined,
      recipientAddress: category === 'general_investment' ? recipientAddress.trim() : undefined,
      investmentPurpose: category === 'general_investment' ? investmentPurpose.trim() : undefined,
      partnerNames: category === 'share_partnership' ? partnerNames.trim() : undefined,
      shareRatio: category === 'share_partnership' ? shareRatio.trim() : undefined,
      partnerContact: category === 'share_partnership' ? partnerContact.trim() : undefined,
    });

    // Reset Form
    setTitleBn('');
    setTitleEn('');
    setDescription('');
    setLandownerName('');
    setContactPhone('');
    setContactAddress('');
    setLandAreaDagNo('');
    setLeaseDuration('');
    setRecipientName('');
    setRecipientPhone('');
    setRecipientAddress('');
    setInvestmentPurpose('');
    setPartnerNames('');
    setShareRatio('50%-50%');
    setPartnerContact('');
    setInvestedAmount(50000);
    setAddProfitEarned(0);
    setAddProfitVoucher('');
    setAddProfitDate('');
    setAddModalTab('basic');
    setIsAddModalOpen(false);
  };

  // Open Edit Investment Modal with dynamic values prefilled
  const openEditModalFor = (proj: Project) => {
    setEditingProject(proj);
    setEditTitleBn(proj.titleBn || '');
    setEditTitleEn(proj.titleEn || '');

    const effectiveCat: ProjectCategory =
      proj.category === 'agriculture'
        ? 'land_lease'
        : proj.category === 'trading' || proj.category === 'welfare'
        ? 'general_investment'
        : proj.category || 'land_lease';

    setEditCategory(effectiveCat);
    setEditInvestedAmount(proj.investedAmount || proj.targetBudget || 0);
    setEditExpectedReturnPercent(proj.expectedReturnPercent || 0);
    setEditTotalProfit(proj.totalProfit || 0);
    setEditProfitVoucherNo(proj.profitVoucherNo || proj.profitHistory?.[0]?.voucherNo || '');
    setEditProfitDate(proj.profitDate || '');
    setEditLeadMemberId(proj.leadMemberId || members[0]?.id || 'mem-1');
    setEditStatus(proj.status || 'in_progress');
    setEditDescription(proj.description || '');
    setEditStartDate(proj.startDate || '');
    setEditTargetEndDate(proj.targetEndDate || '');

    // Land Lease fields
    setEditLandownerName(proj.landownerName || proj.contactName || '');
    setEditContactPhone(proj.contactPhone || proj.recipientPhone || '');
    setEditContactAddress(proj.contactAddress || proj.recipientAddress || '');
    setEditLandAreaDagNo(proj.landAreaDagNo || '');
    setEditLeaseDuration(proj.leaseDuration || '');

    // General Investment fields
    setEditRecipientName(proj.recipientName || proj.contactName || '');
    setEditRecipientPhone(proj.recipientPhone || proj.contactPhone || '');
    setEditRecipientAddress(proj.recipientAddress || proj.contactAddress || '');
    setEditInvestmentPurpose(proj.investmentPurpose || proj.description || '');

    // Share Partnership fields
    setEditPartnerNames(proj.partnerNames || proj.contactName || '');
    setEditShareRatio(proj.shareRatio || '50%-50%');
    setEditPartnerContact(proj.partnerContact || proj.contactPhone || proj.contactAddress || '');

    setEditModalTab('basic');
    setIsEditModalOpen(true);
  };

  // Handle Edit Investment Submit
  const handleEditInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const resolvedContactName =
      editCategory === 'land_lease'
        ? editLandownerName.trim()
        : editCategory === 'general_investment'
        ? editRecipientName.trim()
        : editPartnerNames.trim();

    const resolvedContactPhone =
      editCategory === 'land_lease'
        ? editContactPhone.trim()
        : editCategory === 'general_investment'
        ? editRecipientPhone.trim()
        : editPartnerContact.trim();

    const resolvedContactAddress =
      editCategory === 'land_lease'
        ? editContactAddress.trim()
        : editCategory === 'general_investment'
        ? editRecipientAddress.trim()
        : editPartnerContact.trim();

    const updatedProj: Project = {
      ...editingProject,
      titleBn: editTitleBn.trim() || editingProject.titleBn,
      titleEn: editTitleEn.trim() || editingProject.titleEn,
      category: editCategory,
      startDate: editStartDate || editingProject.startDate,
      targetEndDate: editTargetEndDate || editingProject.targetEndDate,
      investedAmount: Number(editInvestedAmount) || editingProject.investedAmount,
      targetBudget: Number(editInvestedAmount) || editingProject.targetBudget,
      expectedReturnPercent: Number(editExpectedReturnPercent),
      totalProfit: Number(editTotalProfit) || 0,
      profitVoucherNo: editProfitVoucherNo.trim() || undefined,
      profitDate: editProfitDate.trim() || undefined,
      leadMemberId: editLeadMemberId || editingProject.leadMemberId,
      status: editStatus,
      description: editDescription.trim(),
      // Standard backward-compatible fields
      contactName: resolvedContactName || undefined,
      contactPhone: resolvedContactPhone || undefined,
      contactAddress: resolvedContactAddress || undefined,
      // Dynamic category specific fields
      landownerName: editCategory === 'land_lease' ? editLandownerName.trim() : undefined,
      landAreaDagNo: editCategory === 'land_lease' ? editLandAreaDagNo.trim() : undefined,
      leaseDuration: editCategory === 'land_lease' ? editLeaseDuration.trim() : undefined,
      recipientName: editCategory === 'general_investment' ? editRecipientName.trim() : undefined,
      recipientPhone: editCategory === 'general_investment' ? editRecipientPhone.trim() : undefined,
      recipientAddress: editCategory === 'general_investment' ? editRecipientAddress.trim() : undefined,
      investmentPurpose: editCategory === 'general_investment' ? editInvestmentPurpose.trim() : undefined,
      partnerNames: editCategory === 'share_partnership' ? editPartnerNames.trim() : undefined,
      shareRatio: editCategory === 'share_partnership' ? editShareRatio.trim() : undefined,
      partnerContact: editCategory === 'share_partnership' ? editPartnerContact.trim() : undefined,
    };

    updateProject(updatedProj);
    if (viewDetailsProject && viewDetailsProject.id === updatedProj.id) {
      setViewDetailsProject(updatedProj);
    }
    setIsEditModalOpen(false);
    setEditingProject(null);
  };

  // Handle Profit Submit
  const handleProfitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profitProjectId || profitAmount <= 0) return;

    addInvestmentProfit(profitProjectId, {
      amount: Number(profitAmount),
      date: profitDate,
      title: profitTitle.trim() || 'বিনিয়োগের লভ্যাংশ/লাভ',
      notes: profitNotes.trim(),
      voucherNo: profitVoucher.trim() || undefined,
      recordedBy: currentMember?.nameEn || 'Milon Talukder (Cashier)',
    });

    setProfitSuccessMsg(
      language === 'bn'
        ? `৳${toBengaliNumber(profitAmount)} টাকা মুনাফা সফলভাবে রেকর্ড ও ক্যাশবুকে যুক্ত করা হয়েছে!`
        : `৳${profitAmount} profit successfully recorded and synced to cashbook!`
    );

    setTimeout(() => {
      setProfitSuccessMsg('');
      setIsProfitModalOpen(false);
    }, 1500);
  };

  const openProfitModalFor = (project: Project) => {
    setSelectedProjectForProfit(project);
    setProfitProjectId(project.id);
    setProfitTitle(
      project.category === 'land_lease' || project.category === 'agriculture' || project.titleBn.includes('জমি লিজ')
        ? 'জমির লিজের মুনাফা/লভ্যাংশ'
        : `${project.titleBn} হতে মুনাফা`
    );
    setIsProfitModalOpen(true);
  };

  // Category Badge with distinct color coding
  const getCategoryBadge = (cat: ProjectCategory) => {
    switch (cat) {
      case 'land_lease':
      case 'agriculture':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-2xs">
            <span>🌾</span>
            <span>{language === 'bn' ? 'জমি লিজ / বন্ধক' : 'Land Lease'}</span>
          </span>
        );
      case 'share_partnership':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-700 text-white shadow-2xs">
            <span>🤝</span>
            <span>{language === 'bn' ? 'শেয়ার পার্টনারশিপ' : 'Share Partnership'}</span>
          </span>
        );
      case 'general_investment':
      case 'trading':
      case 'retail':
      case 'welfare':
      case 'fisheries':
      case 'real_estate':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-700 text-white shadow-2xs">
            <span>💼</span>
            <span>{language === 'bn' ? 'সাধারণ বিনিয়োগ' : 'General Investment'}</span>
          </span>
        );
    }
  };

  const getCategoryLabel = (cat: ProjectCategory) => {
    switch (cat) {
      case 'land_lease':
      case 'agriculture':
        return language === 'bn' ? '🌾 জমি লিজ / বন্ধক (Land Lease / Mortgage)' : '🌾 Land Lease / Mortgage';
      case 'share_partnership':
        return language === 'bn' ? '🤝 শেয়ার পার্টনারশিপ (Share Partnership)' : '🤝 Share Partnership';
      case 'general_investment':
      case 'trading':
      default:
        return language === 'bn' ? '💼 সাধারণ বিনিয়োগ (General Investment)' : '💼 General Investment';
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {language === 'bn' ? 'চলমান ও লাভজনক' : 'Active & Running'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            {language === 'bn' ? 'সমাপ্ত ও লাভ আদায়কৃত' : 'Completed'}
          </span>
        );
      case 'harvesting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            {language === 'bn' ? 'ফসল ফলন / লাভ সংগ্রহ' : 'Harvesting / Returns'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
            {language === 'bn' ? 'পরিকল্পনাধীন' : 'Planning'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Module Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সংস্থার বিনিয়োগ ও পোর্টফোলিও' : 'Organization Investment & Portfolio'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'bn' ? 'সংস্থার বিনিয়োগ ও পোর্টফোলিও' : 'Organization Investment & Portfolio'}
            </h1>
            <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
              {language === 'bn'
                ? 'জমি লিজ / বন্ধক, সাধারণ বিনিয়োগ ও শেয়ার পার্টনারশিপ প্রকল্পের সার্বিক হিসাব, মালিক/উদ্যোক্তার তথ্য এবং অর্জিত মুনাফার স্বচ্ছ বিবরণী।'
                : 'Management of somiti capital investments (Land Lease, General Investment & Share Partnership) with category-specific records and transparent dividend distributions.'}
            </p>
          </div>

          {/* Action CTAs */}
          {isCashier && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-700" />
                <span>{language === 'bn' ? '+ নতুন বিনিয়োগ' : '+ New Investment'}</span>
              </button>
              <button
                onClick={() => {
                  setSelectedProjectForProfit(projects[0] || null);
                  setIsProfitModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-400/40 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-emerald-300" />
                <span>{language === 'bn' ? '+ লাভ/মুনাফা এন্ট্রি' : '+ Record Profit'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          UNIFIED TWO-STAGE ARCHITECTURE
          Stage 1: Projects Directory & Selector (when selectedProjectId === null)
          Stage 2: Selected Project Details & 4 Clean Tabs (when selectedProjectId !== null)
          ========================================================================= */}

      {selectedProjectId === null ? (
        /* ======================== STAGE 1: PROJECTS DIRECTORY & SELECTOR ======================== */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Summary KPIs (Single Instance, No Duplication) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {language === 'bn' ? 'মোট বিনিয়োগকৃত মূলধন' : 'Total Capital Invested'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-neutral-900">
                {formatCurrency(totalInvested, language)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1 font-medium">
                {language === 'bn' ? `${toBengaliNumber(projects.length)} টি সক্রিয় বিনিয়োগ প্রকল্প` : `${projects.length} Investment Projects`}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between text-emerald-700 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {language === 'bn' ? 'মোট অর্জিত নিট মুনাফা' : 'Total Profit Earned'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-800">
                +{formatCurrency(totalProfitEarned, language)}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? `তহবিলে সফলভাবে জমা · গড় লাভ ${toBengaliNumber(overallRoiPercent)}%` : `Synced to Somiti Reserve · ${overallRoiPercent}% ROI`}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {language === 'bn' ? 'সক্রিয় বিনিয়োগ সংখ্যা' : 'Active Investments'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-neutral-900">
                {toBengaliNumber(activeCount)} {language === 'bn' ? 'টি' : 'Active'}
              </div>
              <div className="text-[11px] text-teal-700 mt-1 font-medium">
                {language === 'bn' ? 'সরেজমিনে চলমান ও সুরক্ষিত সম্পদ' : 'Actively generating yield'}
              </div>
            </div>
          </div>

          {/* Search & Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">
                {language === 'bn' ? `প্রকল্প ডিরেক্টরি (${toBengaliNumber(filteredProjects.length)}টি)` : `Projects Directory (${filteredProjects.length})`}
              </h2>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'প্রকল্প বা মালিকের নাম খুঁজুন...' : 'Search projects...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isCashier && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? '+ নতুন প্রজেক্ট' : '+ Add Project'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Projects Directory List (Compact Cards - STRICT: No inner details/long text stacked here) */}
          <div className="space-y-3">
            {filteredProjects.map((project, idx) => {
              const prjInvested = project.investedAmount || project.targetBudget || 0;
              const prjProfit = project.totalProfit || 0;
              const roiPercent = prjInvested > 0 ? Math.round((prjProfit / prjInvested) * 100) : 0;
              const ownerName =
                project.category === 'land_lease' || project.category === 'agriculture'
                  ? project.landownerName || project.contactName || 'হাজী মোকাররম হোসেন'
                  : project.category === 'share_partnership'
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
                      {getCategoryBadge(project.category)}
                      {getStatusBadge(project.status)}
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                    {isCashier && (
                      <button
                        onClick={() => openProfitModalFor(project)}
                        className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
                        title={language === 'bn' ? 'মুনাফা এন্ট্রি করুন' : 'Record Profit'}
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}
                    {isCashier && (
                      <button
                        onClick={() => openEditModalFor(project)}
                        className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl transition-colors cursor-pointer"
                        title={language === 'bn' ? 'প্রকল্প এডিট করুন' : 'Edit Project'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setProjectActiveTab('summary');
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

          {filteredProjects.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-8">
              <Briefcase className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-900">
                {language === 'bn' ? 'কোনো বিনিয়োগ প্রকল্প পাওয়া যায়নি' : 'No investment projects found'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">
                {language === 'bn'
                  ? 'নতুন বিনিয়োগ যুক্ত করতে "+ নতুন প্রজেক্ট" বাটনে ক্লিক করুন।'
                  : 'Click "+ Add Project" above to create a new investment.'}
              </p>
              {isCashier && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{language === 'bn' ? '+ নতুন প্রজেক্ট যোগ করুন' : '+ Add Project'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ======================== STAGE 2: SELECTED PROJECT DETAILS ======================== */
        (() => {
          const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
          if (!selectedProject) {
            setSelectedProjectId(null);
            return null;
          }

          const lead = members.find((m) => m.id === selectedProject.leadMemberId);
          const prjInvested = selectedProject.investedAmount || selectedProject.targetBudget || 0;
          const prjProfit = selectedProject.totalProfit || 0;
          const roiPercent = prjInvested > 0 ? Math.round((prjProfit / prjInvested) * 100) : 0;
          const isLandLease = selectedProject.category === 'land_lease' || selectedProject.category === 'agriculture';
          const isShare = selectedProject.category === 'share_partnership';

          const landownerName = selectedProject.landownerName || selectedProject.contactName || 'হাজী মোকাররম হোসেন';
          const contactPhone = selectedProject.contactPhone || selectedProject.recipientPhone || '০১৭১২-৩৪৫৬৭৮';
          const contactAddress = selectedProject.contactAddress || selectedProject.recipientAddress || 'সিতাইকুন্ড পূর্বপাড়া, কোটালীপাড়া, গোপালগঞ্জ';
          const landAreaDagNo = selectedProject.landAreaDagNo || '৫০ শতক (দাগ নং: ৪১২, খতিয়ান নং: ৮৮)';
          const leaseDuration = selectedProject.leaseDuration || '২ বছর (২০২৪ - ২০২৬)';
          const cleanPhone = contactPhone.replace(/[^0-9+]/g, '');

          return (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Navigation Bar */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProjectId(null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{language === 'bn' ? '← সকল প্রজেক্টে ফিরুন' : '← Back to Projects List'}</span>
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-neutral-900 text-white font-bold">
                        {selectedProject.code}
                      </span>
                      {getCategoryBadge(selectedProject.category)}
                      {getStatusBadge(selectedProject.status)}
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-neutral-900 leading-tight">
                      {language === 'bn' ? selectedProject.titleBn : selectedProject.titleEn}
                    </h2>
                  </div>
                </div>

                {/* Admin Actions in Selected View */}
                {isCashier && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openProfitModalFor(selectedProject)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-300" />
                      <span>{language === 'bn' ? '+ লাভ যোগ করুন' : '+ Record Profit'}</span>
                    </button>
                    <button
                      onClick={() => openEditModalFor(selectedProject)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                      <span>{language === 'bn' ? 'প্রকল্প এডিট করুন' : 'Edit Project'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Project Mini-Financial Header (Clean Single Instance, No Duplication) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
                <div>
                  <span className="text-[11px] text-emerald-200 font-semibold uppercase block">
                    {language === 'bn' ? 'বরাদ্দকৃত মূলধন' : 'Allocated Capital'}
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
                    {formatCurrency(prjInvested, language)}
                  </div>
                  <span className="text-[10px] text-emerald-300">সমিতির তহবিল হতে</span>
                </div>

                <div>
                  <span className="text-[11px] text-emerald-200 font-semibold uppercase block">
                    {language === 'bn' ? 'অর্জিত মোট নিট মুনাফা' : 'Net Profit Earned'}
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300 mt-0.5">
                    +{formatCurrency(prjProfit, language)}
                  </div>
                  <span className="text-[10px] text-emerald-300">ক্যাশবুকে সংরক্ষিত</span>
                </div>

                <div>
                  <span className="text-[11px] text-emerald-200 font-semibold uppercase block">
                    {language === 'bn' ? 'মুনাফার শতকরা হার' : 'Return Yield (ROI)'}
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
                    {toBengaliNumber(roiPercent)}%
                  </div>
                  <span className="text-[10px] text-emerald-300">প্রত্যাশিত: {toBengaliNumber(selectedProject.expectedReturnPercent || 11)}%</span>
                </div>

                <div>
                  <span className="text-[11px] text-emerald-200 font-semibold uppercase block">
                    {language === 'bn' ? 'দায়িত্বপ্রাপ্ত তত্ত্বাবধায়ক' : 'Project Lead'}
                  </span>
                  <div className="text-sm sm:text-base font-bold mt-1 truncate">
                    {lead ? (language === 'bn' ? lead.nameBn : lead.nameEn) : 'মিলন তালুকদার (ক্যাশিয়ার)'}
                  </div>
                  <span className="text-[10px] text-emerald-300">ক্যাশিয়ারের তত্ত্বাবধানে</span>
                </div>
              </div>

              {/* 4 Clean Segmented Tabs (Switcher) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setProjectActiveTab('summary')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    projectActiveTab === 'summary'
                      ? 'bg-emerald-800 text-white shadow-md border-b-2 border-emerald-950'
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/70'
                  }`}
                >
                  <span>📑</span>
                  <span>{language === 'bn' ? 'সামারি ও বিবরণ' : 'Summary & Overview'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectActiveTab('financials')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    projectActiveTab === 'financials'
                      ? 'bg-emerald-800 text-white shadow-md border-b-2 border-emerald-950'
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/70'
                  }`}
                >
                  <span>💰</span>
                  <span>{language === 'bn' ? 'আর্থিক বিবরণ ও মুনাফা' : 'Financials & Returns'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectActiveTab('lessor')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    projectActiveTab === 'lessor'
                      ? 'bg-emerald-800 text-white shadow-md border-b-2 border-emerald-950'
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/70'
                  }`}
                >
                  <span>🌾</span>
                  <span>{language === 'bn' ? 'জমির মালিক / লিজদাতা' : 'Land Owner & Lessor'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectActiveTab('supervisor')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    projectActiveTab === 'supervisor'
                      ? 'bg-emerald-800 text-white shadow-md border-b-2 border-emerald-950'
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/70'
                  }`}
                >
                  <span>👥</span>
                  <span>{language === 'bn' ? 'তত্ত্বাবধায়ক ও অংশীদারিত্ব' : 'Supervisor & Equity'}</span>
                </button>
              </div>

              {/* RENDER ONLY ACTIVE TAB'S CONTENT */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-xs">
                {/* TAB 1: 📑 সামারি ও বিবরণ */}
                {projectActiveTab === 'summary' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                        {language === 'bn' ? 'প্রকল্পের সারসংক্ষেপ ও উদ্দেশ্য' : 'Project Summary'}
                      </h4>
                      <p className="text-neutral-800 text-sm sm:text-base leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                        {selectedProject.description || (language === 'bn' ? 'কোনো বিস্তারিত বিবরণ যোগ করা হয়নি।' : 'No description provided.')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 uppercase block font-semibold">ক্যাটাগরি</span>
                        <div className="mt-1 font-bold text-neutral-900">{getCategoryLabel(selectedProject.category)}</div>
                      </div>

                      <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 uppercase block font-semibold">শুরুর তারিখ</span>
                        <div className="mt-1 font-bold font-mono text-neutral-900">{formatDate(selectedProject.startDate || '2024-01-01', language)}</div>
                      </div>

                      <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 uppercase block font-semibold">মেয়াদ শেষ / সমাপ্তি</span>
                        <div className="mt-1 font-bold font-mono text-neutral-900">{formatDate(selectedProject.targetEndDate || '2026-12-31', language)}</div>
                      </div>

                      <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 uppercase block font-semibold">চুক্তির মেয়াদকাল</span>
                        <div className="mt-1 font-bold text-emerald-900">{leaseDuration}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: 💰 আর্থিক বিবরণ ও মুনাফা */}
                {projectActiveTab === 'financials' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-xs text-neutral-500 font-semibold uppercase block">মোট বিনিয়োগকৃত মূলধন</span>
                        <div className="text-2xl font-black font-mono text-neutral-900 mt-1">
                          {formatCurrency(prjInvested, language)}
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-1 block">সমিতির তহবিল থেকে পরিশোধিত</span>
                      </div>

                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300">
                        <span className="text-xs text-emerald-800 font-bold uppercase block">মোট অর্জিত নিট মুনাফা</span>
                        <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
                          +{formatCurrency(prjProfit, language)}
                        </div>
                        <span className="text-[11px] text-emerald-700 mt-1 block font-semibold">মুনাফার হার: {toBengaliNumber(roiPercent)}%</span>
                      </div>

                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-xs text-neutral-500 font-semibold uppercase block">ক্যাশ ভাউচার / রশিদ নং</span>
                        <div className="text-xl font-black font-mono text-neutral-900 mt-1">
                          {selectedProject.profitVoucherNo || selectedProject.profitHistory?.[0]?.voucherNo || 'CB-2025-081'}
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-1 block">প্রাপ্তির তারিখ: {formatDate(selectedProject.profitDate || '2025-08-24', language)}</span>
                      </div>
                    </div>

                    {/* Recorded Profit Payout Vouchers List */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{language === 'bn' ? 'অর্জিত মুনাফা আদায়ের রেকর্ড ও ক্যাশ বুক ভাউচার' : 'Recorded Profit Payouts & Vouchers'}</span>
                        </h4>
                        {isCashier && (
                          <button
                            onClick={() => openProfitModalFor(selectedProject)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? '+ নতুন মুনাফা এন্ট্রি' : '+ Record Profit'}</span>
                          </button>
                        )}
                      </div>

                      {selectedProject.profitHistory && selectedProject.profitHistory.length > 0 ? (
                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100 text-xs">
                          {selectedProject.profitHistory.map((prof) => (
                            <div key={prof.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                                  ৳
                                </div>
                                <div>
                                  <div className="font-bold text-neutral-900 text-sm">{prof.title}</div>
                                  <div className="text-neutral-500 text-[11px] mt-0.5">{prof.notes || 'মুনাফা আদায় সম্পন্ন ও ক্যাশবুকে জমা'}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-bold text-emerald-700 text-base">
                                  +{formatCurrency(prof.amount, language)}
                                </div>
                                <div className="text-neutral-500 font-mono text-[11px] mt-0.5 flex items-center justify-end gap-1.5">
                                  <span>{formatDate(prof.date, language)}</span>
                                  {prof.voucherNo && (
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                      ভাউচার: {prof.voucherNo}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-xs text-neutral-500">
                          {language === 'bn' ? 'কোনো অতিরিক্ত মুনাফা ভাউচার পাওয়া যায়নি।' : 'No profit vouchers recorded yet.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: 🌾 জমির মালিক / লিজদাতা */}
                {projectActiveTab === 'lessor' && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-lg shrink-0">
                          {isLandLease ? '🌾' : isShare ? '🤝' : '💼'}
                        </div>
                        <div>
                          <div className="text-[11px] text-emerald-900 font-bold uppercase tracking-wider">
                            {isLandLease ? 'জমির মালিক / লিজদাতা' : isShare ? 'পার্টনার / অংশীদার' : 'প্রাপক / দায়িত্বপ্রাপ্ত ব্যক্তি'}
                          </div>
                          <div className="text-lg font-black text-neutral-900">{landownerName}</div>
                        </div>
                      </div>

                      {contactPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                        >
                          <Phone className="w-4 h-4 text-emerald-200" />
                          <span>{contactPhone} (সরাসরি কল করুন)</span>
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 font-semibold uppercase block flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>পূর্ণ ঠিকানা ও জমির অবস্থান</span>
                        </span>
                        <div className="mt-1 text-sm font-bold text-neutral-900">{contactAddress}</div>
                      </div>

                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 font-semibold uppercase block">
                          জমির পরিমাণ ও দাগ/খতিয়ান নম্বর
                        </span>
                        <div className="mt-1 text-sm font-bold text-emerald-900">{landAreaDagNo}</div>
                      </div>

                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 font-semibold uppercase block">
                          লিজের মেয়াদ / সময়কাল
                        </span>
                        <div className="mt-1 text-sm font-bold text-neutral-900">{leaseDuration}</div>
                      </div>

                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-[11px] text-neutral-500 font-semibold uppercase block">
                          চুক্তির ধরণ
                        </span>
                        <div className="mt-1 text-sm font-bold text-neutral-900">
                          {isLandLease ? 'দ্বিপাক্ষিক রেজিস্টার্ড কৃষি জমি লিজ' : 'বাণিজ্যিক অংশীদারিত্ব চুক্তি'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: 👥 তত্ত্বাবধায়ক ও অংশীদারিত্ব */}
                {projectActiveTab === 'supervisor' && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-emerald-200" />
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-500 uppercase font-semibold block">
                            দায়িত্বপ্রাপ্ত সুপারভাইজার / তত্ত্বাবধায়ক
                          </span>
                          <div className="text-base font-bold text-neutral-900">
                            {lead ? (language === 'bn' ? `${lead.nameBn} (${lead.role})` : `${lead.nameEn} (${lead.role})`) : 'মিলন তালুকদার (ক্যাশিয়ার)'}
                          </div>
                          <div className="text-xs text-neutral-500 font-mono mt-0.5">
                            মোবাইল: {lead?.phone || '০১৭১১-২২৩৩৪৪'}
                          </div>
                        </div>
                      </div>

                      {lead?.phone && (
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>কল করুন</span>
                        </a>
                      )}
                    </div>

                    <div className="p-4 bg-teal-50 border border-teal-300 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-950 uppercase tracking-wide mb-1">
                        <ShieldCheck className="w-4 h-4 text-teal-700" />
                        <span>সমিতির মালিকানা ও শেয়ারহোল্ডারদের অংশীদারিত্ব</span>
                      </div>
                      <p className="text-xs text-teal-900 leading-relaxed">
                        এই প্রকল্পের সমুদয় অর্থ সমিতির কেন্দ্রীয় সঞ্চয় তহবিল হতে বিনিয়োগ করা হয়েছে। সকল লাভ ও মূলধন সমিতির ১০০% সদস্যদের সঞ্চয় অনুপাতে সংরক্ষিত থাকে। ক্যাশবুকে প্রতিটি এন্ট্রি কোষাধ্যক্ষ ও সাধারণ সম্পাদক কর্তৃক অডিটকৃত।
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}

      {/* MODAL 1: Add New Investment Modal (Dynamic Category Fields) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden text-neutral-900 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white shrink-0">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-300" />
                <h3 className="text-base font-bold">
                  {language === 'bn' ? 'নতুন বিনিয়োগ প্রকল্প যুক্ত করুন' : 'Add New Investment Project'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInvestmentSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* 4 Categorized Tab Headers */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAddModalTab('basic')}
                  className={`py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                    addModalTab === 'basic'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  ১. বেসিক তথ্য
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalTab('financials')}
                  className={`py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                    addModalTab === 'financials'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  ২. আর্থিক হিসাব
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalTab('lessor')}
                  className={`py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                    addModalTab === 'lessor'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  ৩. লিজদাতা / জমি
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalTab('supervisor')}
                  className={`py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                    addModalTab === 'supervisor'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  ৪. তত্ত্বাবধায়ক ও শর্ত
                </button>
              </div>

              {/* TAB 1: BASIC INFO */}
              {addModalTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Category Selector Dropdown */}
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <label className="block text-xs font-bold text-neutral-800 uppercase mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'bn' ? 'বিনিয়োগের ধরণ / ক্যাটাগরি নির্বাচন করুন' : 'Select Investment Category'} *</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                      className="w-full px-3 py-2.5 text-sm font-semibold border-2 border-emerald-600 rounded-xl bg-white text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="land_lease">🌾 জমি লিজ / বন্ধক (Land Lease / Mortgage)</option>
                      <option value="general_investment">💼 সাধারণ বিনিয়োগ (General Investment)</option>
                      <option value="share_partnership">🤝 শেয়ার পার্টনারশিপ (Share Partnership)</option>
                    </select>
                    <p className="text-[11px] text-neutral-500 mt-1.5">
                      {category === 'land_lease' && 'কৃষি জমি লিজ, বন্ধক বা বর্গা চুক্তি ভিত্তিক বিনিয়োগ'}
                      {category === 'general_investment' && 'ব্যবসা, ট্রেডিং, দোকান বা সাধারণ ঋণ/বিনিয়োগ'}
                      {category === 'share_partnership' && 'ভাগাভাগি বা মুনাফার শতকরা হারে পার্টনারশিপ বিনিয়োগ'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                      {language === 'bn' ? 'প্রকল্পের নাম (বাংলায়)' : 'Project Title (Bengali)'} *
                    </label>
                    <input
                      type="text"
                      placeholder={
                        category === 'land_lease'
                          ? 'যেমন: সিতাইকুন্ড কৃষি জমি লিজ গ্রহণ'
                          : category === 'share_partnership'
                          ? 'যেমন: মেসার্স তালুকদার এগ্রো ফার্ম পার্টনারশিপ'
                          : 'যেমন: পাইকারি মুদি ব্যবসা বিনিয়োগ'
                      }
                      value={titleBn}
                      onChange={(e) => setTitleBn(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                      {language === 'bn' ? 'প্রকল্পের নাম (ইংরেজি/ঐচ্ছিক)' : 'Project Title (English)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Agricultural Land Lease Project 1"
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <DateInput
                        label={language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                        value={startDate}
                        onChange={(val) => setStartDate(val)}
                        required
                      />
                    </div>

                    <div>
                      <DateInput
                        label={language === 'bn' ? 'মেয়াদ শেষ / সমাপ্তির তারিখ' : 'Target End Date'}
                        value={targetEndDate}
                        onChange={(val) => setTargetEndDate(val)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                      {language === 'bn' ? 'বর্তমান স্ট্যাটাস' : 'Status'}
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="in_progress">{language === 'bn' ? 'চলমান ও কার্যকর' : 'Active / Running'}</option>
                      <option value="harvesting">{language === 'bn' ? 'ফসল ফলন / লাভ সংগ্রহ' : 'Harvesting / Returns'}</option>
                      <option value="planning">{language === 'bn' ? 'পরিকল্পনাধীন' : 'Planning'}</option>
                      <option value="completed">{language === 'bn' ? 'সমাপ্ত' : 'Completed'}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: FINANCIALS */}
              {addModalTab === 'financials' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-xs text-emerald-800 font-medium">
                      💡 বিনিয়োগকৃত মূলধন এবং অর্জিত লভ্যাংশের তথ্য এখানে প্রদান করুন। এটি সদস্য পোর্টালের আর্থিক বিবরণীতে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                        {language === 'bn' ? 'মোট বিনিয়োগকৃত মূলধন (৳)' : 'Invested Capital (BDT)'} *
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={investedAmount}
                        onChange={(e) => setInvestedAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono font-bold text-emerald-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                        {language === 'bn' ? 'প্রত্যাশিত লাভ (%)' : 'Expected ROI (%)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={expectedReturnPercent}
                        onChange={(e) => setExpectedReturnPercent(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                    <div className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'bn' ? 'অর্জিত লভ্যাংশ ও ক্যাশ বুক ভাউচার (যদি থাকে)' : 'Profit Earned & Voucher'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          মোট অর্জিত লভ্যাংশ (৳)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          placeholder="যেমন: 11000"
                          value={addProfitEarned}
                          onChange={(e) => setAddProfitEarned(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-emerald-800 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          লভ্যাংশ প্রাপ্তির তারিখ
                        </label>
                        <input
                          type="date"
                          value={addProfitDate}
                          onChange={(e) => setAddProfitDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          ক্যাশ ভাউচার / রশিদ নং
                        </label>
                        <input
                          type="text"
                          placeholder="CB-2025-081"
                          value={addProfitVoucher}
                          onChange={(e) => setAddProfitVoucher(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono uppercase border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LESSOR / PARTNER DETAILS */}
              {addModalTab === 'lessor' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {category === 'land_lease' && (
                    <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-3">
                      <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-700" />
                        <span>🌾 জমি লিজ / বন্ধকের নির্দিষ্ট তথ্যাবলী</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            জমির মালিকের নাম *
                          </label>
                          <input
                            type="text"
                            placeholder="যেমন: হাজী মোকাররম হোসেন"
                            value={landownerName}
                            onChange={(e) => setLandownerName(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required={category === 'land_lease'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            মোবাইল নম্বর *
                          </label>
                          <input
                            type="tel"
                            placeholder="017XX-XXXXXX"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required={category === 'land_lease'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          ঠিকানা / জমির অবস্থান *
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: সিতাইকুন্ড পূর্বপাড়া, কোটালীপাড়া, গোপালগঞ্জ"
                          value={contactAddress}
                          onChange={(e) => setContactAddress(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required={category === 'land_lease'}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            জমির পরিমাণ ও দাগ/খতিয়ান নম্বর (ঐচ্ছিক)
                          </label>
                          <input
                            type="text"
                            placeholder="যেমন: ৫০ শতক (দাগ নং: ৪১২, খতিয়ান নং: ৮৮)"
                            value={landAreaDagNo}
                            onChange={(e) => setLandAreaDagNo(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            লিজের মেয়াদ / সময়কাল *
                          </label>
                          <input
                            type="text"
                            placeholder="যেমন: ২ বছর (২০২৪ - ২০২৬)"
                            value={leaseDuration}
                            onChange={(e) => setLeaseDuration(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required={category === 'land_lease'}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {category === 'general_investment' && (
                    <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-300 space-y-3">
                      <div className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-blue-700" />
                        <span>💼 সাধারণ বিনিয়োগের বিবরণ ও প্রাপক</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            প্রাপক / দায়িত্বপ্রাপ্ত ব্যক্তির নাম *
                          </label>
                          <input
                            type="text"
                            placeholder="যেমন: মোহাম্মদ রফিকুল ইসলাম"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={category === 'general_investment'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            মোবাইল নম্বর *
                          </label>
                          <input
                            type="tel"
                            placeholder="018XX-XXXXXX"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={category === 'general_investment'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          ঠিকানা *
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: বাজার রোড, কোটালীপাড়া"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={category === 'general_investment'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          বিনিয়োগের উদ্দেশ্য / খাত *
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: মৌসুমি ধান ব্যবসা ও সরবরাহ"
                          value={investmentPurpose}
                          onChange={(e) => setInvestmentPurpose(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={category === 'general_investment'}
                        />
                      </div>
                    </div>
                  )}

                  {category === 'share_partnership' && (
                    <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-300 space-y-3">
                      <div className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Handshake className="w-4 h-4 text-purple-700" />
                        <span>🤝 শেয়ার পার্টনারশিপের তথ্যাবলী</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            পার্টনার / শেয়ারহোল্ডারদের নাম *
                          </label>
                          <input
                            type="text"
                            placeholder="যেমন: কালাম তালুকদার ও পার্টনার্স"
                            value={partnerNames}
                            onChange={(e) => setPartnerNames(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required={category === 'share_partnership'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            শেয়ার অনুপাত / শতকরা হার *
                          </label>
                          <input
                            type="text"
                            placeholder="যেমন: 50%-50% বা ৬০%-৪০%"
                            value={shareRatio}
                            onChange={(e) => setShareRatio(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required={category === 'share_partnership'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          পার্টনারের যোগাযোগ ও পূর্ণ ঠিকানা *
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: মোবাইল: 017XX-XXXXXX, গ্রাম: রামপাড়া"
                          value={partnerContact}
                          onChange={(e) => setPartnerContact(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required={category === 'share_partnership'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SUPERVISOR & TERMS */}
              {addModalTab === 'supervisor' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'bn' ? 'দায়িত্বপ্রাপ্ত তত্ত্বাবধায়ক সদস্য (Project Lead)' : 'Lead Supervisor'} *</span>
                    </label>
                    <select
                      value={leadMemberId}
                      onChange={(e) => setLeadMemberId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.memberNo} - {m.nameBn} ({m.role})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      সমিতির সদস্য যিনি এই প্রকল্পের সরেজমিন তদারকি ও হিসাব নিরীক্ষণের দায়িত্বে থাকবেন।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                      {language === 'bn' ? 'চুক্তিপত্র ও বিস্তারিত বিবরণ / শর্তাবলী' : 'Description & Terms'} *
                    </label>
                    <textarea
                      rows={4}
                      placeholder={
                        language === 'bn'
                          ? 'চুক্তির শর্তাবলী, লিজের মেয়াদ, মুনাফা ভাগাভাগি এবং আনুষঙ্গিক বিস্তারিত বিবরণ লিখুন...'
                          : 'Write details of lease or investment terms...'
                      }
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {addModalTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (addModalTab === 'financials') setAddModalTab('basic');
                        else if (addModalTab === 'lessor') setAddModalTab('financials');
                        else if (addModalTab === 'supervisor') setAddModalTab('lessor');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer"
                    >
                      ← পূর্ববর্তী
                    </button>
                  )}
                  {addModalTab !== 'supervisor' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (addModalTab === 'basic') setAddModalTab('financials');
                        else if (addModalTab === 'financials') setAddModalTab('lessor');
                        else if (addModalTab === 'lessor') setAddModalTab('supervisor');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-300 rounded-lg cursor-pointer"
                    >
                      পরবর্তী ধাপ →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {language === 'bn' ? 'সংরক্ষণ ও কেন্দ্রীয় ডাটাবেসে সেভ করুন' : 'Save Investment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Profit Modal */}
      {isProfitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden text-neutral-900">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
                <h3 className="text-base font-bold">
                  {language === 'bn' ? 'বিনিয়োগের মুনাফা/লাভ এন্ট্রি' : 'Record Investment Profit'}
                </h3>
              </div>
              <button
                onClick={() => setIsProfitModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfitSubmit} className="p-6 space-y-4">
              {profitSuccessMsg && (
                <div className="p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profitSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'কোন বিনিয়োগ হতে লাভ এসেছে?' : 'Select Investment Project'}
                </label>
                <select
                  value={profitProjectId}
                  onChange={(e) => setProfitProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.titleBn} ({formatCurrency(p.investedAmount || p.targetBudget || 0, language)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    {language === 'bn' ? 'মুনাফার পরিমাণ (৳)' : 'Profit Amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={profitAmount}
                    onChange={(e) => setProfitAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base font-mono font-bold text-emerald-800 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <DateInput
                    label={language === 'bn' ? 'লাভ আসার তারিখ' : 'Profit Date'}
                    value={profitDate}
                    onChange={(val) => setProfitDate(val)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'মুনাফার খাত বা শিরোনাম' : 'Profit Title / Source'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: গত বছরের জমির লিজ মুনাফা' : 'e.g. Land Lease Harvest Profit'}
                  value={profitTitle}
                  onChange={(e) => setProfitTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    {language === 'bn' ? 'ক্যাশিয়ার ভাউচার নং' : 'Voucher Ref'}
                  </label>
                  <input
                    type="text"
                    value={profitVoucher}
                    onChange={(e) => setProfitVoucher(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    {language === 'bn' ? 'আদায়কারী কোষাধ্যক্ষ' : 'Collector'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentMember?.nameBn || 'মিলন তালুকদার (ক্যাশিয়ার)'}
                    className="w-full px-3 py-2 text-sm bg-neutral-100 border border-neutral-300 rounded-lg text-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  {language === 'bn' ? 'মন্তব্য বা অডিট নোট' : 'Remarks / Audit Note'}
                </label>
                <textarea
                  rows={2}
                  value={profitNotes}
                  onChange={(e) => setProfitNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'মুনাফা প্রাপ্তি সংক্রান্ত বিস্তারিত মন্তব্য লিখুন...' : 'Notes regarding profit collection...'}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'এই এন্ট্রিটি স্বয়ংক্রিয়ভাবে সমিতির কোষাধ্যক্ষ ক্যাশবুকে নগদ ইনপুট (Inflow) হিসেবে সংরক্ষিত হবে।'
                    : 'This profit entry will automatically be logged as a cashbook inflow in the Cashier Ledger.'}
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfitModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'মুনাফা জমা নিন ও সেভ করুন' : 'Confirm & Save Profit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Full Details Modal (Organized Category Breakdown) */}
      {viewDetailsProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden text-neutral-900 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-300" />
                <div>
                  <div className="text-xs font-mono text-emerald-300">{viewDetailsProject.code}</div>
                  <h3 className="text-base font-bold leading-tight">
                    {language === 'bn' ? viewDetailsProject.titleBn : viewDetailsProject.titleEn}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setViewDetailsProject(null)}
                className="p-1 text-emerald-200 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(viewDetailsProject.category)}
                  <span className="text-xs text-neutral-500 font-medium">
                    {getCategoryLabel(viewDetailsProject.category)}
                  </span>
                </div>
                {getStatusBadge(viewDetailsProject.status)}
              </div>

              {/* Category-Specific Detailed Cards */}
              {(viewDetailsProject.category === 'land_lease' || viewDetailsProject.category === 'agriculture') && (
                <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 p-4 rounded-xl border border-emerald-300 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🌾</span>
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        জমির লিজ ও বন্ধক সংক্রান্ত বিস্তারিত বিবরণ
                      </h4>
                    </div>
                    {isCashier && (
                      <button
                        onClick={() => openEditModalFor(viewDetailsProject)}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer bg-white hover:bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300 shadow-2xs transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>তথ্য সম্পাদনা / যোগ</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        জমির মালিকের নাম
                      </span>
                      <strong className="text-neutral-900 text-sm mt-0.5 block">
                        {viewDetailsProject.landownerName || viewDetailsProject.contactName || 'হাজী মোকাররম হোসেন'}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        মোবাইল নম্বর
                      </span>
                      <strong className="text-neutral-900 text-sm mt-0.5 block font-mono">
                        {viewDetailsProject.contactPhone ? (
                          <a href={`tel:${viewDetailsProject.contactPhone}`} className="text-emerald-700 hover:underline flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{viewDetailsProject.contactPhone}</span>
                          </a>
                        ) : (
                          '০১৭১২-৩৪৫৬৭৮'
                        )}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-emerald-200 sm:col-span-2">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        ঠিকানা / জমির অবস্থান
                      </span>
                      <strong className="text-neutral-900 text-xs mt-0.5 block flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{viewDetailsProject.contactAddress || 'সিতাইকুন্ড পূর্বপাড়া, কোটালীপাড়া'}</span>
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        জমির পরিমাণ ও দাগ/খতিয়ান নম্বর
                      </span>
                      <strong className="text-neutral-900 text-xs mt-0.5 block">
                        {viewDetailsProject.landAreaDagNo || '৫০ শতক (দাগ নং: ৪১২, খতিয়ান নং: ৮৮)'}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        লিজের মেয়াদ / সময়কাল
                      </span>
                      <strong className="text-neutral-900 text-xs mt-0.5 block">
                        {viewDetailsProject.leaseDuration || '২ বছর (২০২৪ - ২০২৬)'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {viewDetailsProject.category === 'share_partnership' && (
                <div className="bg-gradient-to-br from-purple-50/80 via-white to-pink-50/40 p-4 rounded-xl border border-purple-300 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🤝</span>
                      <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                        শেয়ার পার্টনারশিপ সংক্রান্ত বিস্তারিত বিবরণ
                      </h4>
                    </div>
                    {isCashier && (
                      <button
                        onClick={() => openEditModalFor(viewDetailsProject)}
                        className="text-xs font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1.5 cursor-pointer bg-white hover:bg-purple-50 px-3 py-1 rounded-lg border border-purple-300 shadow-2xs transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-purple-700" />
                        <span>তথ্য সম্পাদনা / যোগ</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-purple-200 sm:col-span-2">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        পার্টনার / শেয়ারহোল্ডারদের নাম
                      </span>
                      <strong className="text-neutral-900 text-sm mt-0.5 block">
                        {viewDetailsProject.partnerNames || viewDetailsProject.contactName || '— নাম যুক্ত করা হয়নি —'}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        শেয়ার অনুপাত / শতকরা হার
                      </span>
                      <strong className="text-purple-900 text-sm mt-0.5 block font-mono font-bold">
                        {viewDetailsProject.shareRatio || '50%-50%'}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        পার্টনারের যোগাযোগ ও ঠিকানা
                      </span>
                      <strong className="text-neutral-900 text-xs mt-0.5 block">
                        {viewDetailsProject.partnerContact || viewDetailsProject.contactPhone || viewDetailsProject.contactAddress || '— যোগাযোগ যুক্ত করা হয়নি —'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {viewDetailsProject.category !== 'land_lease' &&
                viewDetailsProject.category !== 'agriculture' &&
                viewDetailsProject.category !== 'share_partnership' && (
                  <div className="bg-gradient-to-br from-blue-50/80 via-white to-sky-50/40 p-4 rounded-xl border border-blue-300 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">💼</span>
                        <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                          সাধারণ বিনিয়োগের বিস্তারিত ও প্রাপকের বিবরণ
                        </h4>
                      </div>
                      {isCashier && (
                        <button
                          onClick={() => openEditModalFor(viewDetailsProject)}
                          className="text-xs font-bold text-blue-800 hover:text-blue-950 flex items-center gap-1.5 cursor-pointer bg-white hover:bg-blue-50 px-3 py-1 rounded-lg border border-blue-300 shadow-2xs transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-700" />
                          <span>তথ্য সম্পাদনা / যোগ</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                          প্রাপক / দায়িত্বপ্রাপ্ত ব্যক্তির নাম
                        </span>
                        <strong className="text-neutral-900 text-sm mt-0.5 block">
                          {viewDetailsProject.recipientName || viewDetailsProject.contactName || '— নাম যুক্ত করা হয়নি —'}
                        </strong>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                          মোবাইল নম্বর
                        </span>
                        <strong className="text-neutral-900 text-sm mt-0.5 block font-mono">
                          {viewDetailsProject.recipientPhone || viewDetailsProject.contactPhone || '— নম্বর যুক্ত করা হয়নি —'}
                        </strong>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-blue-200 sm:col-span-2">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                          ঠিকানা
                        </span>
                        <strong className="text-neutral-900 text-xs mt-0.5 block">
                          {viewDetailsProject.recipientAddress || viewDetailsProject.contactAddress || '— ঠিকানা যুক্ত করা হয়নি —'}
                        </strong>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-blue-200 sm:col-span-2">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                          বিনিয়োগের উদ্দেশ্য / খাত
                        </span>
                        <strong className="text-neutral-900 text-xs mt-0.5 block">
                          {viewDetailsProject.investmentPurpose || viewDetailsProject.description || '— খাত যুক্ত করা হয়নি —'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

              <div>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase">
                  {language === 'bn' ? 'বিস্তারিত বিবরণ ও চুক্তিপত্র' : 'Description & Contract'}
                </h4>
                <p className="text-sm text-neutral-800 mt-1 leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  {viewDetailsProject.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-[10px] uppercase font-semibold text-neutral-500">
                    {language === 'bn' ? 'বিনিয়োগকৃত মূলধন' : 'Capital Invested'}
                  </div>
                  <div className="font-mono font-bold text-neutral-900 text-base mt-1">
                    {formatCurrency(viewDetailsProject.investedAmount || viewDetailsProject.targetBudget || 0, language)}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-[10px] uppercase font-semibold text-emerald-800">
                    {language === 'bn' ? 'অর্জিত মোট মুনাফা' : 'Total Profit'}
                  </div>
                  <div className="font-mono font-bold text-emerald-800 text-base mt-1">
                    {formatCurrency(viewDetailsProject.totalProfit || 0, language)}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-[10px] uppercase font-semibold text-neutral-500">
                    {language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                  </div>
                  <div className="font-mono text-neutral-800 text-xs mt-1">
                    {formatDate(viewDetailsProject.startDate, language)}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-[10px] uppercase font-semibold text-neutral-500">
                    {language === 'bn' ? 'মেয়াদ শেষ' : 'End Date'}
                  </div>
                  <div className="font-mono text-neutral-800 text-xs mt-1">
                    {formatDate(viewDetailsProject.targetEndDate, language)}
                  </div>
                </div>
              </div>

              {/* Profit History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    {language === 'bn' ? 'মুনাফা/লভ্যাংশ প্রাপ্তির ইতিহাস' : 'Profit Distribution History'}
                  </h4>
                  {isCashier && (
                    <button
                      onClick={() => {
                        setViewDetailsProject(null);
                        openProfitModalFor(viewDetailsProject);
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? '+ লাভ যোগ' : '+ Add Profit'}</span>
                    </button>
                  )}
                </div>

                {viewDetailsProject.profitHistory && viewDetailsProject.profitHistory.length > 0 ? (
                  <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden divide-y divide-neutral-100 text-xs">
                    {viewDetailsProject.profitHistory.map((prof) => (
                      <div key={prof.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-neutral-900">{prof.title}</div>
                          <div className="text-neutral-500 text-[11px]">{prof.notes}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-700">
                            +{formatCurrency(prof.amount, language)}
                          </div>
                          <div className="text-neutral-400 font-mono text-[11px]">
                            {formatDate(prof.date, language)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-neutral-50 rounded-lg text-center text-xs text-neutral-500 border border-neutral-200">
                    {language === 'bn'
                      ? 'এখনো কোনো অতিরিক্ত মুনাফা এন্ট্রি করা হয়নি।'
                      : 'No profit records recorded yet.'}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end shrink-0">
              <button
                onClick={() => setViewDetailsProject(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-700 hover:bg-neutral-800 rounded-lg cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Investment & Dynamic Category Details Modal */}
      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-300" />
                <h3 className="text-base font-bold">
                  {language === 'bn' ? 'বিনিয়োগ ও ক্যাটাগরি তথ্য সম্পাদনা' : 'Edit Investment & Category Details'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditInvestmentSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* 4 Categorized Tab Headers */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditModalTab('basic')}
                  className={`py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                    editModalTab === 'basic'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  ১. বেসিক তথ্য
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalTab('financials')}
                  className={`py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                    editModalTab === 'financials'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  ২. আর্থিক হিসাব
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalTab('lessor')}
                  className={`py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                    editModalTab === 'lessor'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  ৩. লিজদাতা / জমি
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalTab('supervisor')}
                  className={`py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                    editModalTab === 'supervisor'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  ৪. তত্ত্বাবধায়ক ও শর্ত
                </button>
              </div>

              {/* TAB 1: BASIC INFO */}
              {editModalTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Category Selector */}
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">
                      {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as ProjectCategory)}
                      className="w-full px-3 py-2 text-xs font-bold border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="land_lease">🌾 জমি লিজ / বন্ধক (Land Lease / Mortgage)</option>
                      <option value="general_investment">💼 সাধারণ বিনিয়োগ (General Investment)</option>
                      <option value="share_partnership">🤝 শেয়ার পার্টনারশিপ (Share Partnership)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                        {language === 'bn' ? 'বিনিয়োগের নাম (বাংলায়)' : 'Title (Bengali)'} *
                      </label>
                      <input
                        type="text"
                        value={editTitleBn}
                        onChange={(e) => setEditTitleBn(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                        {language === 'bn' ? 'বিনিয়োগের নাম (ইংরেজি)' : 'Title (English)'}
                      </label>
                      <input
                        type="text"
                        value={editTitleEn}
                        onChange={(e) => setEditTitleEn(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <DateInput
                        label={language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                        value={editStartDate}
                        onChange={(val) => setEditStartDate(val)}
                      />
                    </div>

                    <div>
                      <DateInput
                        label={language === 'bn' ? 'মেয়াদ শেষ' : 'Target End Date'}
                        value={editTargetEndDate}
                        onChange={(val) => setEditTargetEndDate(val)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                      {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="in_progress">{language === 'bn' ? 'চলমান ও কার্যকর' : 'Active / Running'}</option>
                      <option value="harvesting">{language === 'bn' ? 'ফসল / লাভ সংগ্রহ' : 'Harvesting / Return'}</option>
                      <option value="planning">{language === 'bn' ? 'পরিকল্পনাধীন' : 'Planning'}</option>
                      <option value="completed">{language === 'bn' ? 'সমাপ্ত' : 'Completed'}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: FINANCIALS & PROFIT */}
              {editModalTab === 'financials' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                        {language === 'bn' ? 'বিনিয়োগকৃত মূলধন (৳)' : 'Invested Capital (BDT)'} *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editInvestedAmount}
                        onChange={(e) => setEditInvestedAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                        {language === 'bn' ? 'প্রত্যাশিত লাভ (%)' : 'Expected ROI (%)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editExpectedReturnPercent}
                        onChange={(e) => setEditExpectedReturnPercent(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
                    <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      <span>{language === 'bn' ? 'অর্জিত মোট লভ্যাংশ ও ক্যাশ বুক ভাউচার' : 'Total Profit Earned & Voucher'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          অর্জিত লভ্যাংশ (৳)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={editTotalProfit}
                          onChange={(e) => setEditTotalProfit(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-emerald-900 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          লভ্যাংশ প্রাপ্তির তারিখ
                        </label>
                        <input
                          type="date"
                          value={editProfitDate}
                          onChange={(e) => setEditProfitDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          ক্যাশ ভাউচার / মেমো নং
                        </label>
                        <input
                          type="text"
                          placeholder="CB-2025-081"
                          value={editProfitVoucherNo}
                          onChange={(e) => setEditProfitVoucherNo(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono uppercase border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LESSOR / LAND DETAILS */}
              {editModalTab === 'lessor' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {editCategory === 'land_lease' && (
                    <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-300 space-y-3">
                      <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-700" />
                        <span>🌾 জমি লিজ / বন্ধকের তথ্যাবলী সম্পাদনা</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            জমির মালিকের নাম *
                          </label>
                          <input
                            type="text"
                            value={editLandownerName}
                            onChange={(e) => setEditLandownerName(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required={editCategory === 'land_lease'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            মোবাইল নম্বর *
                          </label>
                          <input
                            type="tel"
                            value={editContactPhone}
                            onChange={(e) => setEditContactPhone(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required={editCategory === 'land_lease'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          ঠিকানা / জমির অবস্থান *
                        </label>
                        <input
                          type="text"
                          value={editContactAddress}
                          onChange={(e) => setEditContactAddress(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required={editCategory === 'land_lease'}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            জমির পরিমাণ ও দাগ/খতিয়ান নম্বর
                          </label>
                          <input
                            type="text"
                            value={editLandAreaDagNo}
                            onChange={(e) => setEditLandAreaDagNo(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            লিজের মেয়াদ / সময়কাল *
                          </label>
                          <input
                            type="text"
                            value={editLeaseDuration}
                            onChange={(e) => setEditLeaseDuration(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required={editCategory === 'land_lease'}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {editCategory === 'general_investment' && (
                    <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-300 space-y-3">
                      <div className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-blue-700" />
                        <span>💼 সাধারণ বিনিয়োগ ও প্রাপকের বিবরণ</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            প্রাপক / দায়িত্বপ্রাপ্ত ব্যক্তির নাম *
                          </label>
                          <input
                            type="text"
                            value={editRecipientName}
                            onChange={(e) => setEditRecipientName(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={editCategory === 'general_investment'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            মোবাইল নম্বর *
                          </label>
                          <input
                            type="tel"
                            value={editRecipientPhone}
                            onChange={(e) => setEditRecipientPhone(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={editCategory === 'general_investment'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          ঠিকানা *
                        </label>
                        <input
                          type="text"
                          value={editRecipientAddress}
                          onChange={(e) => setEditRecipientAddress(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={editCategory === 'general_investment'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          বিনিয়োগের উদ্দেশ্য / খাত *
                        </label>
                        <input
                          type="text"
                          value={editInvestmentPurpose}
                          onChange={(e) => setEditInvestmentPurpose(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={editCategory === 'general_investment'}
                        />
                      </div>
                    </div>
                  )}

                  {editCategory === 'share_partnership' && (
                    <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-300 space-y-3">
                      <div className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Handshake className="w-4 h-4 text-purple-700" />
                        <span>🤝 শেয়ার পার্টনারশিপ বিবরণ সম্পাদনা</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            পার্টনার / শেয়ারহোল্ডারদের নাম *
                          </label>
                          <input
                            type="text"
                            value={editPartnerNames}
                            onChange={(e) => setEditPartnerNames(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required={editCategory === 'share_partnership'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                            শেয়ার অনুপাত / শতকরা হার *
                          </label>
                          <input
                            type="text"
                            value={editShareRatio}
                            onChange={(e) => setEditShareRatio(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required={editCategory === 'share_partnership'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          পার্টনারের যোগাযোগ ও ঠিকানা *
                        </label>
                        <input
                          type="text"
                          value={editPartnerContact}
                          onChange={(e) => setEditPartnerContact(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required={editCategory === 'share_partnership'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SUPERVISOR & TERMS */}
              {editModalTab === 'supervisor' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'bn' ? 'দায়িত্বপ্রাপ্ত তত্ত্বাবধায়ক সদস্য (Project Lead)' : 'Lead Supervisor'} *</span>
                    </label>
                    <select
                      value={editLeadMemberId}
                      onChange={(e) => setEditLeadMemberId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.memberNo} - {m.nameBn} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                      {language === 'bn' ? 'চুক্তিপত্র ও বিবরণ / শর্তাবলী' : 'Description & Terms'} *
                    </label>
                    <textarea
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {editModalTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (editModalTab === 'financials') setEditModalTab('basic');
                        else if (editModalTab === 'lessor') setEditModalTab('financials');
                        else if (editModalTab === 'supervisor') setEditModalTab('lessor');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer"
                    >
                      ← পূর্ববর্তী
                    </button>
                  )}
                  {editModalTab !== 'supervisor' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (editModalTab === 'basic') setEditModalTab('financials');
                        else if (editModalTab === 'financials') setEditModalTab('lessor');
                        else if (editModalTab === 'lessor') setEditModalTab('supervisor');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-300 rounded-lg cursor-pointer"
                    >
                      পরবর্তী ধাপ →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {language === 'bn' ? 'সংরক্ষণ ও কেন্দ্রীয় ডাটাবেসে আপডেট' : 'Save & Sync to Database'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

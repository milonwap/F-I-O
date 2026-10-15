import React, { useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Coins,
  CreditCard,
  Receipt,
  TrendingUp,
  FileText,
  BookOpen,
  Settings,
  User,
  Sun,
  Moon,
  RefreshCw,
  LogOut,
  ChevronRight,
  Plus,
  FolderKanban,
  Wallet,
} from 'lucide-react';
import { ActiveTab, Language, PortalSubTab, isAdminRole } from '../types/somiti';
import { useSomiti } from '../context/SomitiContext';
import { MemberAvatar } from './MemberAvatar';

interface NavbarProps {
  activeTab: ActiveTab;
  language: Language;
  onSelectTab: (tab: ActiveTab) => void;
  onToggleLanguage: () => void;
  onOpenCollectModal?: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  language,
  onSelectTab,
  onToggleLanguage,
  onOpenCollectModal,
  onOpenLoginModal,
}) => {
  const {
    currentMember,
    syncStatus,
    darkMode,
    toggleDarkMode,
    manualForceSync,
    logout,
    activeMemberPortalSubTab,
    setActiveMemberPortalSubTab,
  } = useSomiti();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  const handleForceSync = async () => {
    setIsForceSyncing(true);
    const success = await manualForceSync();
    setIsForceSyncing(false);
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2500);
  };

  const isAdmin = isAdminRole(currentMember?.role);

  const navigateTo = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsDrawerOpen(false);
  };

  const adminNavItems: {
    id: ActiveTab;
    labelBn: string;
    labelEn: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'members',
      labelBn: 'সদস্য তালিকা',
      labelEn: 'Members Directory',
      icon: Users,
    },
    {
      id: 'deposit',
      labelBn: 'সঞ্চয় ও জমা',
      labelEn: 'Savings & Deposits',
      icon: Coins,
    },
    {
      id: 'loan',
      labelBn: 'ঋণ ব্যবস্থাপনা',
      labelEn: 'Loan Management',
      icon: CreditCard,
    },
    {
      id: 'cashier',
      labelBn: 'ক্যাশিয়ার ডেস্ক',
      labelEn: 'Cashier Desk',
      icon: Receipt,
      badge: language === 'bn' ? '+ কিস্তি' : '+ Collect',
    },
    {
      id: 'projects_tasks',
      labelBn: 'বিনিয়োগ প্রকল্প',
      labelEn: 'Investments',
      icon: TrendingUp,
    },
    {
      id: 'reports',
      labelBn: 'আর্থিক স্টেটমেন্ট',
      labelEn: 'Statements & Audit',
      icon: FileText,
    },
    {
      id: 'rules',
      labelBn: 'রুলস',
      labelEn: 'Rules',
      icon: BookOpen,
    },
    {
      id: 'settings',
      labelBn: 'সেটিংস',
      labelEn: 'Settings',
      icon: Settings,
    },
  ];

  // Reordered Member Navigation Items (Dashboard First with Short Clean Labels)
  const memberNavItems: {
    id: PortalSubTab;
    labelBn: string;
    labelEn: string;
    icon: React.ElementType;
  }[] = [
    {
      id: 'dashboard',
      labelBn: '📊 ড্যাশবোর্ড',
      labelEn: '📊 Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'profile',
      labelBn: '👤 প্রোফাইল',
      labelEn: '👤 Profile',
      icon: User,
    },
    {
      id: 'passbook',
      labelBn: '📖 পাসবই',
      labelEn: '📖 Passbook',
      icon: BookOpen,
    },
    {
      id: 'loan',
      labelBn: '💳 ঋণ হিসাব',
      labelEn: '💳 Loans',
      icon: CreditCard,
    },
    {
      id: 'investment',
      labelBn: '💼 বিনিয়োগ',
      labelEn: '💼 Investments',
      icon: FolderKanban,
    },
    {
      id: 'statement',
      labelBn: '📄 স্টেটমেন্ট',
      labelEn: '📄 Statement',
      icon: FileText,
    },
    {
      id: 'rules',
      labelBn: '📜 রুলস',
      labelEn: '📜 Rules',
      icon: BookOpen,
    },
  ];

  const navigateToMemberPortal = (subTab: PortalSubTab) => {
    setActiveMemberPortalSubTab(subTab);
    onSelectTab('my_portal');
    setIsDrawerOpen(false);
  };

  // Active Tab Title for Header
  const getTabTitle = () => {
    if (activeTab === 'dashboard') return language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard';
    if (activeTab === 'members') return language === 'bn' ? 'সদস্য তালিকা' : 'Members';
    if (activeTab === 'deposit' || activeTab === 'kisti') return language === 'bn' ? 'সঞ্চয় ও জমা' : 'Savings & Deposits';
    if (activeTab === 'loan') return language === 'bn' ? 'ঋণ ব্যবস্থাপনা' : 'Loan Management';
    if (activeTab === 'cashier') return language === 'bn' ? 'ক্যাশিয়ার ডেস্ক' : 'Cashier Desk';
    if (activeTab === 'projects_tasks') return language === 'bn' ? 'বিনিয়োগ প্রকল্প' : 'Investments';
    if (activeTab === 'reports') return language === 'bn' ? 'আর্থিক স্টেটমেন্ট' : 'Statements & Audit';
    if (activeTab === 'rules') return language === 'bn' ? 'রুলস' : 'Rules';
    if (activeTab === 'settings') return language === 'bn' ? 'সেটিংস' : 'Settings';
    if (activeTab === 'my_portal') {
      if (activeMemberPortalSubTab === 'dashboard') return language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard';
      if (activeMemberPortalSubTab === 'profile') return language === 'bn' ? 'প্রোফাইল' : 'Profile';
      if (activeMemberPortalSubTab === 'passbook') return language === 'bn' ? 'পাসবই' : 'Passbook';
      if (activeMemberPortalSubTab === 'loan') return language === 'bn' ? 'ঋণ হিসাব' : 'Loans';
      if (activeMemberPortalSubTab === 'investment') return language === 'bn' ? 'বিনিয়োগ' : 'Investments';
      if (activeMemberPortalSubTab === 'statement') return language === 'bn' ? 'স্টেটমেন্ট' : 'Statement';
      if (activeMemberPortalSubTab === 'rules') return language === 'bn' ? 'রুলস' : 'Rules';
      return language === 'bn' ? 'সদস্য পোর্টাল' : 'My Portal';
    }
    return '';
  };

  return (
    <>
      {/* Top Header Navbar (Clean, Single Row, No Overflow) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 w-full">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-2.5 w-full">
          {/* Left: Hamburger Menu Button + Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer shadow-2xs"
              title={language === 'bn' ? 'ন্যাভিগেশন মেনু ড্রয়ার খুলুন' : 'Open Navigation Menu'}
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => onSelectTab(isAdmin ? 'dashboard' : 'my_portal')}
              className="flex items-center gap-2 text-left cursor-pointer select-none"
            >
              <span className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs">
                FIO
              </span>
              <div className="hidden sm:block">
                <div className="text-sm font-black tracking-tight text-neutral-900 dark:text-white leading-tight">
                  Friend Initiative Organization
                </div>
                <div className="text-[10px] text-neutral-500 font-medium">
                  {language === 'bn' ? 'সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : 'Sitaikunda, Kotalipara, Gopalgonj'}
                </div>
              </div>
              <span className="sm:hidden font-extrabold text-sm text-neutral-900 dark:text-white">FIO</span>
            </button>
          </div>

          {/* Center: Current View Indicator Pill (on md+ screens) */}
          <div className="hidden md:flex items-center">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {getTabTitle()}
            </span>
          </div>

          {/* Right: Clean Utilities (No red logout, no +Collect button) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 sm:p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLanguage}
              className="px-2 py-1 text-[11px] font-bold rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors whitespace-nowrap cursor-pointer"
              title="Toggle Bangla / English"
            >
              {language === 'bn' ? 'EN' : 'বাং'}
            </button>

            {/* Force Sync */}
            <button
              onClick={handleForceSync}
              disabled={isForceSyncing}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-300 transition-all cursor-pointer shadow-2xs"
              title={language === 'bn' ? 'ক্লাউড থেকে সরাসরি ডাটা সিঙ্ক করুন' : 'Force re-sync data directly from Cloud DB'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isForceSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
              <span className="hidden sm:inline">
                {isForceSyncing
                  ? (language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...')
                  : syncToast
                  ? (language === 'bn' ? 'সিঙ্কড!' : 'Synced!')
                  : (language === 'bn' ? 'সিঙ্ক' : 'Sync')}
              </span>
            </button>

            {/* Live Status Badge */}
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                syncStatus === 'saving' || isForceSyncing
                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300'
                  : syncStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300'
              }`}
              title={
                syncStatus === 'synced'
                  ? (language === 'bn' ? 'ফায়ারবেস ক্লাউড ডাটাবেসের সাথে সংযুক্ত' : 'Firebase Firestore Connected')
                  : (language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...')
              }
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="hidden sm:inline">{language === 'bn' ? 'ক্লাউড সংযুক্ত' : 'Live'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Slide-out Sidebar Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            {/* Drawer Top Header & Navigation */}
            <div className="overflow-y-auto flex-1">
              {/* Drawer Brand Header */}
              <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-800/40">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs">
                    FIO
                  </span>
                  <div>
                    <div className="font-extrabold text-xs text-neutral-900 dark:text-white leading-tight">
                      Friend Initiative Organization
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      Reg: FIO-7412/2021
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items List */}
              <div className="p-3 space-y-1">
                {isAdmin ? (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {language === 'bn' ? 'প্রশাসনিক মেনু (Admin Panel)' : 'Administration Navigation'}
                    </div>

                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        activeTab === item.id ||
                        (item.id === 'deposit' && activeTab === 'kisti');

                      return (
                        <div key={item.id} className="flex items-center gap-1">
                          <button
                            onClick={() => navigateTo(item.id)}
                            className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-emerald-800 text-white shadow-xs'
                                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-neutral-500 dark:text-neutral-400'}`} />
                              <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : 'text-neutral-400'}`} />
                          </button>

                          {/* Quick Collect Action inside Drawer next to Cashier Desk */}
                          {item.id === 'cashier' && onOpenCollectModal && (
                            <button
                              onClick={() => {
                                setIsDrawerOpen(false);
                                onOpenCollectModal();
                              }}
                              className="p-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-[10px] font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
                              title={language === 'bn' ? 'সরাসরি কিস্তি কালেকশন মডাল খুলুন' : 'Open Collect Modal'}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-3 pb-1 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        {language === 'bn' ? 'ব্যক্তিগত মেম্বার পোর্টাল (FIO-101)' : 'Personal Member Portal'}
                      </div>
                      <button
                        onClick={() => navigateToMemberPortal(null)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'my_portal' && !activeMemberPortalSubTab
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{language === 'bn' ? '👤 আমার মেম্বার পোর্টাল' : '👤 My Personal Member Portal'}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </button>

                      {/* Quick access to FIO-101's personal passbook, statement, loans, etc. */}
                      <div className="pl-2 pt-1 space-y-0.5">
                        {memberNavItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === 'my_portal' && activeMemberPortalSubTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => navigateToMemberPortal(item.id)}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-700 text-white font-bold'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5" />
                                <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {language === 'bn' ? 'সদস্য পোর্টাল (Member Portal)' : 'Member Portal'}
                    </div>

                    {memberNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        activeTab === 'my_portal' &&
                        activeMemberPortalSubTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => navigateToMemberPortal(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-neutral-500 dark:text-neutral-400'}`} />
                            <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : 'text-neutral-400'}`} />
                        </button>
                      );
                    })}

                    {isAdmin && activeTab === 'my_portal' && (
                      <div className="pt-3 pb-1 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                        <button
                          onClick={() => navigateTo('dashboard')}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                            <span>{language === 'bn' ? '🔙 এডমিন প্যানেলে ফিরুন' : '🔙 Back to Admin Panel'}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Drawer Bottom Footer Profile Card & Quick Actions */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-800/50">
              {currentMember && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MemberAvatar member={currentMember} sizeClassName="w-9 h-9 text-xs" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {language === 'bn' ? currentMember.nameBn : currentMember.nameEn}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {currentMember.memberNo} · <span className="text-emerald-700 dark:text-emerald-400 font-bold">{currentMember.role}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      logout();
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title={language === 'bn' ? 'লগআউট' : 'Logout'}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

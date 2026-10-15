import React, { useState } from 'react';
import { SomitiProvider, useSomiti } from './context/SomitiContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MembersView } from './components/MembersView';
import { DepositView } from './components/DepositView';
import { LoanView } from './components/LoanView';
import { CashierView } from './components/CashierView';
import { ProjectsAndTasksView } from './components/ProjectsAndTasksView';
import { ReportsView } from './components/ReportsView';
import { MyPortalView } from './components/MyPortalView';
import { ReceiptModal } from './components/ReceiptModal';
import { CollectKistiModal } from './components/CollectKistiModal';
import { MemberProfileModal } from './components/MemberProfileModal';
import { AddEditMemberModal } from './components/AddEditMemberModal';
import { LoginModal } from './components/LoginModal';
import { RulesView } from './components/RulesView';
import { SettingsView } from './components/SettingsView';
import { LoginPage } from './components/LoginPage';
import { LogoutPage } from './components/LogoutPage';
import { ActiveTab, Member, KistiTransaction, isAdminRole } from './types/somiti';
import { Shield, Lock, ArrowLeft, AlertTriangle, X } from 'lucide-react';

const SomitiApp: React.FC = () => {
  const {
    language,
    setLanguage,
    members,
    transactions,
    tasks,
    addMember,
    updateMember,
    currentMember,
    darkMode,
    isServerDataLoaded,
    cloudSaveError,
    dismissCloudSaveError,
  } = useSomiti();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectTargetMemberId, setCollectTargetMemberId] = useState<string | undefined>(undefined);
  const [collectTargetType, setCollectTargetType] = useState<any>('savings');
  const [collectTargetMonth, setCollectTargetMonth] = useState<string | undefined>(undefined);
  const [collectTargetAmount, setCollectTargetAmount] = useState<number | undefined>(undefined);

  const [receiptTx, setReceiptTx] = useState<KistiTransaction | null>(null);

  const [profileMember, setProfileMember] = useState<Member | null>(null);

  const [isAddEditMemberOpen, setIsAddEditMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Handlers
  const handleOpenCollectModal = (
    memberId?: string,
    type?: any,
    periodMonth?: string,
    defaultAmount?: number
  ) => {
    setCollectTargetMemberId(memberId);
    setCollectTargetType(type || 'savings');
    setCollectTargetMonth(periodMonth);
    setCollectTargetAmount(defaultAmount);
    setIsCollectModalOpen(true);
  };

  const handleKistiSuccess = (newTx: KistiTransaction) => {
    // Show receipt immediately upon successful collection!
    setReceiptTx(newTx);
  };

  const handleOpenProfile = (member: Member) => {
    setProfileMember(member);
  };

  const handleOpenAddMember = () => {
    setMemberToEdit(null);
    setIsAddEditMemberOpen(true);
  };

  const handleOpenEditMember = (member: Member) => {
    setMemberToEdit(member);
    setIsAddEditMemberOpen(true);
  };

  const handleSaveMember = (data: any) => {
    if (memberToEdit) {
      updateMember(data);
      if (profileMember && profileMember.id === data.id) {
        setProfileMember(data);
      }
    } else {
      const added = addMember(data);
      setProfileMember(added);
    }
  };

  const handleToggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const receiptMember = receiptTx ? members.find((m) => m.id === receiptTx.memberId) : undefined;
  const isAdmin = isAdminRole(currentMember?.role);
  const isCashier = currentMember?.role === 'lead_executive' || currentMember?.role === 'cashier';

  // Strict Routing Guard: Regular members cannot access Admin Panel tabs under any circumstances
  const ADMIN_TABS: ActiveTab[] = [
    'dashboard',
    'members',
    'deposit',
    'kisti',
    'loan',
    'cashier',
    'projects_tasks',
    'reports',
    'settings',
  ];
  const isAccessBlocked = !isAdmin && ADMIN_TABS.includes(activeTab);
  const currentTab: ActiveTab = isAccessBlocked ? 'my_portal' : activeTab;

  // Lightweight full-screen loader until initial cloud database fetch completes
  if (!isServerDataLoaded) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-900/50 mb-6 animate-pulse">
          FIO
        </div>
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">
          কেন্দ্রীয় ডাটাবেস থেকে তথ্য লোড হচ্ছে...
        </h2>
        <p className="text-xs text-neutral-400 max-w-sm">
          Friend Initiative Organization (FIO) ক্লাউড সার্ভারের সাথে দুইমুখী লাইভ সিঙ্ক্রোনাইজেশন হচ্ছে।
        </p>
      </div>
    );
  }

  // If not logged in, show dedicated Login Page
  if (!currentMember) {
    return (
      <LoginPage
        onLoginSuccess={(logged) => {
          if (isAdminRole(logged.role)) {
            setActiveTab('dashboard');
          } else {
            setActiveTab('my_portal');
          }
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 w-full overflow-x-hidden ${darkMode ? 'bg-neutral-950 text-neutral-100 dark' : 'bg-neutral-50 text-neutral-900'}`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={currentTab}
        language={language}
        onSelectTab={(tab) => {
          if (!isAdmin && ADMIN_TABS.includes(tab)) {
            setActiveTab('my_portal');
          } else {
            setActiveTab(tab);
          }
        }}
        onToggleLanguage={handleToggleLanguage}
        onOpenCollectModal={() => handleOpenCollectModal(undefined, 'savings', undefined, 1000)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8 pb-8">
        {/* Security Alert if a non-admin attempted to access admin tabs */}
        {isAccessBlocked && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                {language === 'bn'
                  ? '🔒 প্রবেশাধিকার সীমাবদ্ধ: আপনি একজন সাধারণ সদস্য। এডমিন বা ক্যাশিয়ার প্যানেলে প্রবেশের অনুমতি কেবল কার্যনির্বাহী কর্মকর্তাদের রয়েছে।'
                  : '🔒 Access Restricted: Regular members cannot access the Admin Management Panel.'}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('my_portal')}
              className="px-3 py-1 bg-red-700 text-white font-bold rounded-lg text-xs hover:bg-red-800 cursor-pointer"
            >
              {language === 'bn' ? 'আমার পোর্টালে যান' : 'Go to My Portal'}
            </button>
          </div>
        )}

        {isAdmin && currentTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={setActiveTab}
            onOpenCollectModal={handleOpenCollectModal}
            onOpenReceipt={(tx) => setReceiptTx(tx)}
            onOpenMemberProfile={handleOpenProfile}
            onOpenAddMember={handleOpenAddMember}
          />
        )}

        {currentTab === 'my_portal' && (
          <MyPortalView
            onOpenReceipt={(tx) => setReceiptTx(tx)}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onBackToAdmin={() => setActiveTab('dashboard')}
          />
        )}

        {isAdmin && currentTab === 'members' && (
          <MembersView
            onOpenProfile={handleOpenProfile}
            onOpenCollectModal={handleOpenCollectModal}
            onOpenAddMember={handleOpenAddMember}
            onEditMember={handleOpenEditMember}
          />
        )}

        {isAdmin && (currentTab === 'deposit' || currentTab === 'kisti') && (
          <DepositView
            onOpenCollectModal={handleOpenCollectModal}
            onOpenReceipt={(tx) => setReceiptTx(tx)}
          />
        )}

        {isAdmin && currentTab === 'loan' && (
          <LoanView
            onOpenCollectModal={handleOpenCollectModal}
            onOpenReceipt={(tx) => setReceiptTx(tx)}
          />
        )}

        {isAdmin && currentTab === 'cashier' && <CashierView />}

        {isAdmin && currentTab === 'projects_tasks' && <ProjectsAndTasksView />}

        {isAdmin && currentTab === 'reports' && <ReportsView onOpenReceipt={(tx) => setReceiptTx(tx)} />}

        {currentTab === 'rules' && <RulesView />}

        {isAdmin && currentTab === 'settings' && <SettingsView language={language} />}

        {/* LOGOUT PAGE: Dedicated Logout screen */}
        {currentTab === 'logout' && (
          <LogoutPage
            onCancel={() => setActiveTab(isAdmin ? 'dashboard' : 'my_portal')}
            onLoggedOut={() => {}}
            onSwitchMember={(m) => {
              setActiveTab(isAdmin ? 'dashboard' : 'my_portal');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 Friend Initiative Organization · Reg: FIO-7412/2021
          </div>
          <div className="text-neutral-500">
            <span className="font-semibold text-emerald-800">
              {language === 'bn' ? '📍 সিতাইকুন্ড, কোটালীপাড়া, গোপালগঞ্জ' : '📍 Sitaikunda, Kotalipara, Gopalgonj'}
            </span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Money Receipt Modal */}
      <ReceiptModal
        transaction={receiptTx}
        member={receiptMember}
        language={language}
        onClose={() => setReceiptTx(null)}
      />

      {/* 2. Collect Kisti Modal */}
      <CollectKistiModal
        initialMemberId={collectTargetMemberId}
        initialType={collectTargetType}
        initialPeriodMonth={collectTargetMonth}
        initialAmount={collectTargetAmount}
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        onSuccess={handleKistiSuccess}
      />

      {/* 3. Member Profile & Passbook Modal */}
      <MemberProfileModal
        member={profileMember}
        transactions={transactions}
        tasks={tasks}
        language={language}
        onClose={() => setProfileMember(null)}
        onOpenReceipt={(tx) => setReceiptTx(tx)}
        onCollectForMember={(memberId) => {
          const mem = members.find((m) => m.id === memberId);
          setProfileMember(null);
          handleOpenCollectModal(memberId, 'savings', undefined, mem?.monthlySavingsCommitment || 1000);
        }}
        onEditMember={(member) => {
          handleOpenEditMember(member);
        }}
      />

      {/* 4. Add/Edit Member Modal */}
      <AddEditMemberModal
        memberToEdit={memberToEdit}
        isOpen={isAddEditMemberOpen}
        language={language}
        onClose={() => setIsAddEditMemberOpen(false)}
        onSave={handleSaveMember}
      />

      {/* 5. Member Login & ID/Password Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setActiveTab('my_portal');
        }}
      />

      {/* 6. Floating Cloud Save Error Notification Toast */}
      {cloudSaveError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-red-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-red-700 flex items-center justify-between gap-3 text-xs animate-bounce">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{cloudSaveError}</span>
          </div>
          <button
            onClick={dismissCloudSaveError}
            className="p-1 hover:bg-red-800 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <SomitiProvider>
      <SomitiApp />
    </SomitiProvider>
  );
}

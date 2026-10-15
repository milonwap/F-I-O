import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Member,
  KistiTransaction,
  Loan,
  Project,
  ProjectExpense,
  InvestmentProfit,
  Task,
  CashbookEntry,
  Language,
  TaskStatus,
  PortalFeatureSettings,
  PortalSubTab,
} from '../types/somiti';
import {
  INITIAL_MEMBERS,
  INITIAL_TRANSACTIONS,
  INITIAL_LOANS,
  INITIAL_PROJECTS,
  INITIAL_PROJECT_EXPENSES,
  INITIAL_TASKS,
  INITIAL_CASHBOOK,
} from '../data/initialData';
import {
  fetchFromFirebase,
  pushToFirebase,
  subscribeToFirebase,
  SomitiCloudBundle,
} from '../services/firebase';

interface SomitiContextType {
  members: Member[];
  transactions: KistiTransaction[];
  loans: Loan[];
  projects: Project[];
  projectExpenses: ProjectExpense[];
  tasks: Task[];
  cashbook: CashbookEntry[];
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  portalFeatureSettings: PortalFeatureSettings;
  updatePortalFeatureSettings: (settings: Partial<PortalFeatureSettings>) => void;
  
  // Realtime Firebase Cloud Sync
  syncStatus: 'synced' | 'saving' | 'error' | 'local_only';
  lastSaved: string | null;
  isServerDataLoaded: boolean;
  saveToServer: (overrideData?: any) => Promise<boolean>;
  pushToFirebase: (data: Partial<SomitiCloudBundle>) => Promise<{ success: boolean; version?: number; error?: string }>;
  manualForceSync: () => Promise<boolean>;
  cloudSaveError: string | null;
  dismissCloudSaveError: () => void;

  // Auth & Profile Access
  currentMember: Member | null;
  currentMemberId: string | null;
  login: (idOrPhone: string, pass?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchMember: (memberId: string) => void;
  updatePassword: (memberId: string, newPass: string) => void;
  updateMemberCredentials: (memberId: string, newMemberNo?: string, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  updateMemberPhoto: (memberId: string, photoUrl: string) => void;
  updateMemberProfile: (memberId: string, profileData: Partial<Member>) => void;
  activeMemberPortalSubTab: PortalSubTab;
  setActiveMemberPortalSubTab: (subTab: PortalSubTab) => void;
  
  // Member actions
  addMember: (member: Omit<Member, 'id'>) => Member;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  
  // Kisti actions
  collectKisti: (tx: Omit<KistiTransaction, 'id' | 'receiptNo'>) => KistiTransaction;
  
  // Loan actions
  disburseLoan: (loan: Omit<Loan, 'id' | 'loanNo' | 'paidAmount' | 'remainingAmount' | 'paidInstallments' | 'status'>) => Loan;
  
  // Project & Investment actions
  addProject: (project: Omit<Project, 'id' | 'code' | 'collectedCapital' | 'totalExpenses'>) => Project;
  updateProject: (project: Project) => void;
  addProjectExpense: (expense: Omit<ProjectExpense, 'id'>) => void;
  addInvestmentProfit: (projectId: string, profit: Omit<InvestmentProfit, 'id' | 'projectId'>) => InvestmentProfit;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  toggleTaskChecklist: (taskId: string, checklistItemId: string) => void;
  deleteTask: (taskId: string) => void;

  // Cashier actions
  addCashbookEntry: (entry: Omit<CashbookEntry, 'id' | 'voucherNo'>) => CashbookEntry;
  
  // Data reset & Emergency Resync
  resetDemoData: () => void;
  emergencyResync: () => Promise<boolean>;
}

const SomitiContext = createContext<SomitiContextType | undefined>(undefined);

export const SomitiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('somiti_lang') as Language) || 'bn';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('somiti_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('somiti_dark_mode', String(next));
      return next;
    });
  };

  // Synchronize dynamically with device / OS theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Sync dynamically with system theme
      setDarkMode(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('somiti_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const DEFAULT_PORTAL_FEATURES: PortalFeatureSettings = {
    profile: true,
    passbook: true,
    dashboard: true,
    loan: true,
    investment: true,
    statement: true,
    rules: true,
  };

  const [portalFeatureSettings, setPortalFeatureSettings] = useState<PortalFeatureSettings>(() => {
    const saved = localStorage.getItem('somiti_portal_features');
    if (saved) {
      try {
        return { ...DEFAULT_PORTAL_FEATURES, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_PORTAL_FEATURES;
  });

  const updatePortalFeatureSettings = (newSettings: Partial<PortalFeatureSettings>) => {
    setPortalFeatureSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('somiti_portal_features', JSON.stringify(updated));
      return updated;
    });
  };

  const updateMembersWithEqualShares = (list: Member[]): Member[] => {
    if (!list || list.length === 0) return list;
    const sharePerMember = Number((100 / list.length).toFixed(2));
    return list.map((m) => ({ ...m, shareCount: sharePerMember }));
  };

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('somiti_members_fio_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return updateMembersWithEqualShares(parsed);
        }
      } catch {}
    }
    return updateMembersWithEqualShares(INITIAL_MEMBERS);
  });

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(() => {
    const saved = localStorage.getItem('somiti_current_member_id');
    return saved || null; // Require login with User ID and Password
  });

  const [activeMemberPortalSubTab, setActiveMemberPortalSubTab] = useState<PortalSubTab>(null);

  const [transactions, setTransactions] = useState<KistiTransaction[]>(() => {
    const saved = localStorage.getItem('somiti_transactions_fio_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t: KistiTransaction) => {
            if (t.id === 'tx-7' || (t.memberId === 'mem-7' && t.receiptNo === 'REC-2024-007')) {
              return { ...t, amount: 3000, date: '2025-06-09', periodMonth: '2025-06' };
            }
            if (t.id === 'tx-8' || (t.memberId === 'mem-8' && t.receiptNo === 'REC-2024-008')) {
              return { ...t, amount: 20000, date: '2026-04-10', periodMonth: '2026-04' };
            }
            return t;
          });
        }
      } catch {}
    }
    return INITIAL_TRANSACTIONS;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('somiti_loans_fio_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((l: Loan) => !['loan-1', 'loan-2', 'loan-3'].includes(l.id));
        }
      } catch {}
    }
    return INITIAL_LOANS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('somiti_projects_fio_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(
            (p: Project) =>
              p.id === 'inv-1' ||
              (!['prj-1', 'prj-2', 'prj-3', 'prj-4'].includes(p.id) &&
                !p.titleEn.toLowerCase().includes('fisheries') &&
                !p.titleEn.toLowerCase().includes('retail'))
          );
          if (clean.length > 0) return clean;
        }
      } catch {}
    }
    return INITIAL_PROJECTS;
  });

  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>(() => {
    const saved = localStorage.getItem('somiti_project_expenses_fio_v3');
    return saved ? JSON.parse(saved).filter((e: ProjectExpense) => e.projectId === 'inv-1') : INITIAL_PROJECT_EXPENSES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('somiti_tasks_fio_v3');
    return saved ? JSON.parse(saved).filter((t: Task) => t.projectId === 'inv-1') : INITIAL_TASKS;
  });

  const [cashbook, setCashbook] = useState<CashbookEntry[]>(() => {
    const saved = localStorage.getItem('somiti_cashbook_fio_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((c: CashbookEntry) => {
            if (c.id === 'cb-join-7' || (c.relatedMemberId === 'mem-7' && c.category === 'kisti_collection')) {
              return { ...c, amount: 3000, date: '2025-06-09' };
            }
            if (c.id === 'cb-join-8' || (c.relatedMemberId === 'mem-8' && c.category === 'kisti_collection')) {
              return { ...c, amount: 20000, date: '2026-04-10' };
            }
            return c;
          });
        }
      } catch {}
    }
    return INITIAL_CASHBOOK;
  });

  // Server sync state
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error' | 'local_only'>('saving');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isServerDataLoaded, setIsServerDataLoaded] = useState<boolean>(false);
  const [cloudSaveError, setCloudSaveError] = useState<string | null>(null);
  const dismissCloudSaveError = () => setCloudSaveError(null);

  const hasLoadedFromServerRef = useRef<boolean>(false);
  const isInitialLoad = useRef(true);
  const serverVersionRef = useRef<number>(0);
  const skipAutoSyncUntilRef = useRef<number>(0);

  // Authoritative server data applicator - updates all states without letting stale localStorage overwrite
  const applyServerData = (data: any) => {
    if (!data || !Array.isArray(data.members)) return;

    hasLoadedFromServerRef.current = true;
    setIsServerDataLoaded(true);
    // Block debounced auto-sync from echoing back data for 2 seconds after remote sync
    skipAutoSyncUntilRef.current = Date.now() + 2000;
    if (typeof data.version === 'number') {
      serverVersionRef.current = data.version;
    }

    // Direct clean assignment: any member's changed password, photo, phone, etc. takes effect immediately
    const formattedMembers = updateMembersWithEqualShares(data.members);
    setMembers(formattedMembers);

    if (Array.isArray(data.transactions)) {
      setTransactions(data.transactions);
    }
    if (Array.isArray(data.loans)) {
      setLoans(data.loans);
    }
    if (Array.isArray(data.projects)) {
      setProjects(data.projects);
    }
    if (Array.isArray(data.projectExpenses)) {
      setProjectExpenses(data.projectExpenses);
    }
    if (Array.isArray(data.tasks)) {
      setTasks(data.tasks);
    }
    if (Array.isArray(data.cashbook)) {
      setCashbook(data.cashbook);
    }

    setSyncStatus('synced');
    setLastSaved(data.lastUpdated || data.updatedAt || new Date().toISOString());
  };

  // Real-time synchronization: Firebase Firestore onSnapshot listener + Central Document Sync
  useEffect(() => {
    let isMounted = true;

    // 1. Hook up onSnapshot from Firebase Firestore for instantaneous real-time sync across all devices
    const unsubscribeFirestore = subscribeToFirebase(
      (firestoreData) => {
        if (!isMounted) return;
        if (firestoreData && Array.isArray(firestoreData.members) && firestoreData.members.length > 0) {
          applyServerData(firestoreData);
          setSyncStatus('synced');
          setCloudSaveError(null);
        }
      },
      (err) => {
        console.warn('Firestore onSnapshot listener notice:', err);
      }
    );

    // 2. Initial Firestore Fetch: Load authoritative cloud data directly
    const performInitialFirestoreCheck = async () => {
      try {
        const firestoreData = await fetchFromFirebase();
        if (!isMounted) return;
        if (firestoreData && Array.isArray(firestoreData.members) && firestoreData.members.length > 0) {
          applyServerData(firestoreData);
          setSyncStatus('synced');
        } else {
          // If Firestore document is brand new or not seeded yet, seed with initial baseline
          const seedPayload = {
            members: updateMembersWithEqualShares(INITIAL_MEMBERS),
            transactions: INITIAL_TRANSACTIONS,
            loans: INITIAL_LOANS,
            projects: INITIAL_PROJECTS,
            projectExpenses: INITIAL_PROJECT_EXPENSES,
            tasks: INITIAL_TASKS,
            cashbook: INITIAL_CASHBOOK,
            version: 1,
            updatedAt: new Date().toISOString(),
            updatedBy: 'initial_system_seed',
          };
          await pushToFirebase(seedPayload);
          if (isMounted) {
            applyServerData(seedPayload);
            setSyncStatus('synced');
          }
        }
      } catch (err) {
        console.warn('Initial Firestore sync warning:', err);
      } finally {
        if (isMounted) {
          hasLoadedFromServerRef.current = true;
          setIsServerDataLoaded(true);
        }
      }
    };

    // Safety timeout: Ensure app UI becomes interactive within 3.5s even if network is delayed
    const safetyTimer = setTimeout(() => {
      if (isMounted && !hasLoadedFromServerRef.current) {
        hasLoadedFromServerRef.current = true;
        setIsServerDataLoaded(true);
      }
    }, 3500);

    performInitialFirestoreCheck();

    // 3. Instant re-check when browser tab comes into focus / wakes up on mobile phone
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const freshCloud = await fetchFromFirebase();
          if (freshCloud && typeof freshCloud.version === 'number' && freshCloud.version > serverVersionRef.current) {
            applyServerData(freshCloud);
          }
        } catch {}
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      if (unsubscribeFirestore) unsubscribeFirestore();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  // Save all somiti data to Firebase Firestore (collection: somiti_data, document: central_database)
  const saveToServer = async (overrideData?: any): Promise<boolean> => {
    try {
      setSyncStatus('saving');
      const payload = {
        members: overrideData?.members ?? members,
        transactions: overrideData?.transactions ?? transactions,
        loans: overrideData?.loans ?? loans,
        projects: overrideData?.projects ?? projects,
        projectExpenses: overrideData?.projectExpenses ?? projectExpenses,
        tasks: overrideData?.tasks ?? tasks,
        cashbook: overrideData?.cashbook ?? cashbook,
        updatedBy: currentMember?.nameEn || 'auto_sync',
      };

      // Push to Firestore central document
      const cloudRes = await pushToFirebase(payload);

      // Keep local Express server updated in background if running
      try {
        fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch {}

      if (cloudRes.success) {
        if (cloudRes.version) serverVersionRef.current = cloudRes.version;
        setSyncStatus('synced');
        setLastSaved(new Date().toISOString());
        setCloudSaveError(null);
        return true;
      } else {
        setSyncStatus('error');
        setCloudSaveError('ফায়ারবেস ক্লাউডে তথ্য সংরক্ষণ করা যায়নি: ' + (cloudRes.error || 'নেটওয়ার্ক ত্রুটি'));
        return false;
      }
    } catch (err: any) {
      console.error('Failed to save to Firebase Firestore:', err);
      setSyncStatus('error');
      setCloudSaveError('ফায়ারবেস ক্লাউডে সেভ ত্রুটি হয়েছে');
      return false;
    }
  };

  // Manual Force Sync function for instant refresh button
  const manualForceSync = async (): Promise<boolean> => {
    setSyncStatus('saving');
    try {
      const freshCloud = await fetchFromFirebase();
      if (freshCloud && Array.isArray(freshCloud.members) && freshCloud.members.length > 0) {
        applyServerData(freshCloud);
        setSyncStatus('synced');
        setCloudSaveError(null);
        return true;
      } else {
        setSyncStatus('error');
        setCloudSaveError('ফায়ারবেস থেকে তথ্য লোড করা যায়নি, সংযোগ যাচাই করুন');
        return false;
      }
    } catch (err: any) {
      setSyncStatus('error');
      setCloudSaveError('সিঙ্ক ব্যর্থ হয়েছে: ' + (err?.message || 'ইন্টারনেট সমস্যা'));
      return false;
    }
  };

  // Debounced auto-sync whenever any state updates
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // CRITICAL: Do not auto-sync to Firebase until initial cloud data has finished loading!
    if (!hasLoadedFromServerRef.current) {
      return;
    }

    if (Date.now() < skipAutoSyncUntilRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      saveToServer();
    }, 400);

    return () => clearTimeout(timer);
  }, [members, transactions, loans, projects, projectExpenses, tasks, cashbook]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('somiti_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('somiti_members_fio_v6', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    if (currentMemberId) {
      localStorage.setItem('somiti_current_member_id', currentMemberId);
    } else {
      localStorage.removeItem('somiti_current_member_id');
    }
  }, [currentMemberId]);

  useEffect(() => {
    localStorage.setItem('somiti_transactions_fio_v4', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('somiti_loans_fio_v4', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('somiti_projects_fio_v3', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('somiti_project_expenses_fio_v3', JSON.stringify(projectExpenses));
  }, [projectExpenses]);

  useEffect(() => {
    localStorage.setItem('somiti_tasks_fio_v3', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('somiti_cashbook_fio_v4', JSON.stringify(cashbook));
  }, [cashbook]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Auth - Central Server Verified
  const currentMember = members.find((m) => m.id === currentMemberId) || null;

  const login = async (idOrPhone: string, pass?: string): Promise<{ success: boolean; error?: string }> => {
    const raw = idOrPhone.trim();
    const query = raw.toLowerCase();
    const cleanPhone = query.replace(/[^0-9]/g, '');

    if (!query) {
      return {
        success: false,
        error: language === 'bn' ? 'সদস্য আইডি অথবা মোবাইল নম্বর দিন' : 'Please enter Member ID or Mobile number',
      };
    }

    // Password is strictly required
    if (!pass || !pass.trim()) {
      return {
        success: false,
        error:
          language === 'bn'
            ? 'পাসওয়ার্ড দিন (ইউজার আইডি ও পাসওয়ার্ড ছাড়া লগইন করা যাবে না)'
            : 'Password is required (Cannot login without User ID and Password)',
      };
    }

    const cleanPass = pass.trim();

    // 1. Direct Central Cloud Firestore Verification (ensures latest passwords & all data on ANY new device)
    try {
      const freshCloud = await fetchFromFirebase();
      if (freshCloud && Array.isArray(freshCloud.members) && freshCloud.members.length > 0) {
        applyServerData(freshCloud);
        const cloudMember = freshCloud.members.find((m: Member) => {
          const memNo = (m.memberNo || '').toLowerCase();
          const matchExactId = memNo === query;
          const matchPrefixId = memNo === `fio-${query}`;
          const matchPhone = cleanPhone.length >= 5 && (m.phone || '').replace(/[^0-9]/g, '').includes(cleanPhone);
          const matchNameBn = m.nameBn && m.nameBn.trim().toLowerCase() === query;
          const matchNameEn = m.nameEn && m.nameEn.trim().toLowerCase() === query;
          return matchExactId || matchPrefixId || matchPhone || matchNameBn || matchNameEn;
        });

        if (cloudMember) {
          if (!cloudMember.password || cleanPass !== String(cloudMember.password).trim()) {
            return {
              success: false,
              error: language === 'bn' ? 'পাসওয়ার্ড সঠিক নয়' : 'Incorrect password',
            };
          }
          setCurrentMemberId(cloudMember.id);
          localStorage.setItem('somiti_current_member_id', cloudMember.id);
          return { success: true };
        }
      }
    } catch (networkErr) {
      console.warn('Firebase login verification notice:', networkErr);
    }

    // 2. Strict Offline Database Verification (strictly checks password without default fallbacks)
    const found = members.find((m) => {
      const memNo = m.memberNo.toLowerCase();
      const matchExactId = memNo === query;
      const matchPrefixId = memNo === `fio-${query}`;
      const matchPhone = cleanPhone.length >= 5 && m.phone.replace(/[^0-9]/g, '').includes(cleanPhone);
      const matchNameBn = m.nameBn && m.nameBn.trim().toLowerCase() === query;
      const matchNameEn = m.nameEn && m.nameEn.trim().toLowerCase() === query;
      return matchExactId || matchPrefixId || matchPhone || matchNameBn || matchNameEn;
    });

    if (!found) {
      return {
        success: false,
        error: language === 'bn' ? 'সদস্য আইডি বা মোবাইল নম্বর পাওয়া যায়নি' : 'Member ID or Mobile number not found',
      };
    }

    if (!found.password || cleanPass !== String(found.password).trim()) {
      return {
        success: false,
        error: language === 'bn' ? 'পাসওয়ার্ড সঠিক নয়' : 'Incorrect password',
      };
    }

    setCurrentMemberId(found.id);
    localStorage.setItem('somiti_current_member_id', found.id);
    return { success: true };
  };

  const logout = () => {
    setCurrentMemberId(null);
    localStorage.removeItem('somiti_current_member_id');
    setActiveMemberPortalSubTab('dashboard');
  };

  const switchMember = (memberId: string) => {
    setCurrentMemberId(memberId);
  };

  // Admin Credential Management: Change Member User ID and/or Password in Central Database
  const updateMemberCredentials = async (
    memberId: string,
    newMemberNo?: string,
    newPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setSyncStatus('saving');
      const cleanMemberNo = newMemberNo?.trim().toUpperCase();
      const cleanPassword = newPassword?.trim();

      const updatedMembers = members.map((m) => {
        if (m.id === memberId || m.memberNo === memberId) {
          return {
            ...m,
            memberNo: cleanMemberNo || m.memberNo,
            password: cleanPassword || m.password,
          };
        }
        return m;
      });

      setMembers(updatedMembers);

      // 1. Immediately push to Firebase Firestore central database
      const fbRes = await pushToFirebase({
        members: updatedMembers,
        updatedBy: currentMember?.nameEn || 'admin',
      });

      // 2. Also keep local Express server updated if running
      try {
        fetch(`/api/members/${encodeURIComponent(memberId)}/credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberNo: cleanMemberNo,
            password: cleanPassword,
            updatedBy: currentMember?.nameEn || 'admin',
          }),
        }).catch(() => {});
      } catch {}

      if (fbRes.success) {
        if (fbRes.version) serverVersionRef.current = fbRes.version;
        setSyncStatus('synced');
        setLastSaved(new Date().toISOString());
        return { success: true };
      } else {
        setSyncStatus('error');
        return { success: false, error: fbRes.error || 'Failed to update credentials in Firebase' };
      }
    } catch (err: any) {
      setSyncStatus('error');
      return { success: false, error: err?.message || 'Error updating credentials' };
    }
  };

  const updatePassword = async (memberId: string, newPass: string) => {
    const cleanPass = newPass.trim();
    const updatedMembers = members.map((m) => (m.id === memberId ? { ...m, password: cleanPass } : m));
    setMembers(updatedMembers);

    try {
      setSyncStatus('saving');
      // Immediate push to Firebase Firestore
      await pushToFirebase({
        members: updatedMembers,
        updatedBy: currentMember?.nameEn || memberId,
      });

      // Also notify local server if available
      try {
        fetch(`/api/members/${encodeURIComponent(memberId)}/password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: cleanPass,
            updatedBy: currentMember?.nameEn || memberId,
          }),
        }).catch(() => {});
      } catch {}

      setSyncStatus('synced');
      setLastSaved(new Date().toISOString());
    } catch {
      saveToServer({ members: updatedMembers });
    }
  };

  const updateMemberPhoto = async (memberId: string, photoUrl: string) => {
    const updatedMembers = members.map((m) => (m.id === memberId ? { ...m, photoUrl } : m));
    setMembers(updatedMembers);

    try {
      setSyncStatus('saving');
      // Immediate push to Firebase Firestore
      await pushToFirebase({
        members: updatedMembers,
        updatedBy: currentMember?.nameEn || memberId,
      });

      // Also notify local server if available
      try {
        fetch(`/api/members/${encodeURIComponent(memberId)}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoUrl,
            updatedBy: currentMember?.nameEn || memberId,
          }),
        }).catch(() => {});
      } catch {}

      setSyncStatus('synced');
      setLastSaved(new Date().toISOString());
    } catch {
      saveToServer({ members: updatedMembers });
    }
  };

  const updateMemberProfile = async (
    memberId: string,
    profileData: Partial<Member>
  ) => {
    const updatedMembers = members.map((m) => (m.id === memberId ? { ...m, ...profileData } : m));
    setMembers(updatedMembers);

    try {
      setSyncStatus('saving');
      // Immediate push to Firebase Firestore for permanent persistence
      await pushToFirebase({
        members: updatedMembers,
        updatedBy: currentMember?.nameEn || memberId,
      });

      // Also notify local server if available
      try {
        fetch(`/api/members/${encodeURIComponent(memberId)}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...profileData,
            updatedBy: currentMember?.nameEn || memberId,
          }),
        }).catch(() => {});
      } catch {}

      setSyncStatus('synced');
      setLastSaved(new Date().toISOString());
    } catch {
      saveToServer({ members: updatedMembers });
    }
  };

  // Member CRUD
  const addMember = (data: Omit<Member, 'id'>): Member => {
    const id = `mem-${Date.now()}`;
    const initialPassword = data.password && data.password.trim().length >= 3
      ? data.password.trim()
      : Math.floor(100000 + Math.random() * 900000).toString();
    const newMember: Member = { ...data, id, password: initialPassword };
    const updated = updateMembersWithEqualShares([...members, newMember]);
    setMembers(updated);
    saveToServer({ members: updated });
    return newMember;
  };

  const updateMember = (updatedMember: Member) => {
    setMembers((prev) => {
      const updated = updateMembersWithEqualShares(prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
      saveToServer({ members: updated });
      return updated;
    });
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => {
      const updated = updateMembersWithEqualShares(prev.filter((m) => m.id !== id));
      saveToServer({ members: updated });
      return updated;
    });
  };

  // Kisti Collect
  const collectKisti = (txData: Omit<KistiTransaction, 'id' | 'receiptNo'>): KistiTransaction => {
    const txCount = transactions.length + 1;
    const receiptNo = `REC-2026-${String(txCount).padStart(3, '0')}`;
    const id = `tx-${Date.now()}`;

    // Separate Principal Savings amount from Late Fine fee
    const enteredPrincipal = Number(
      txData.principalAmount !== undefined
        ? txData.principalAmount
        : txData.amount !== undefined
        ? txData.amount - (txData.fineAmount || 0)
        : 1000
    ) || 0;
    const enteredFine = Math.max(0, Number(txData.fineAmount || 0));
    const totalCollected = enteredPrincipal + enteredFine;

    const targetMonth = txData.targetMonth || txData.periodMonth || (txData.date ? txData.date.slice(0, 7) : '2026-10');
    const actualDate = txData.actualPaymentDate || txData.date || new Date().toISOString().split('T')[0];
    const collectorName = txData.collector || txData.collectedBy || currentMember?.nameEn || 'Cashier';

    const newTx: KistiTransaction = {
      ...txData,
      id,
      receiptNo,
      type: txData.type,
      principalAmount: enteredPrincipal,
      fineAmount: enteredFine,
      totalPaid: totalCollected,
      amount: totalCollected, // backwards compatible total
      targetMonth,
      periodMonth: targetMonth,
      date: actualDate,
      actualPaymentDate: actualDate,
      paymentMethod: txData.paymentMethod || 'cash',
      collectedBy: collectorName,
      collector: collectorName,
    };

    const updatedTransactions = [newTx, ...transactions];
    setTransactions(updatedTransactions);

    // Update member's savings if type === 'savings'
    // CRITICAL: Member's total savings capital increases ONLY by principalAmount (fines are administrative fee)
    let updatedMembers = members;
    if (txData.type === 'savings') {
      updatedMembers = members.map((m) =>
        m.id === txData.memberId
          ? { ...m, totalSavingsDeposited: (m.totalSavingsDeposited || 0) + enteredPrincipal }
          : m
      );
      setMembers(updatedMembers);
    }

    // Update loan if type === 'loan_repayment'
    let updatedLoans = loans;
    if (txData.type === 'loan_repayment' && txData.loanId) {
      updatedLoans = loans.map((loan) => {
        if (loan.id === txData.loanId) {
          const newPaid = loan.paidAmount + enteredPrincipal;
          const newRemaining = Math.max(0, loan.totalPayable - newPaid);
          const newPaidInstallments = Math.min(
            loan.totalInstallments,
            loan.paidInstallments + 1
          );
          return {
            ...loan,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            paidInstallments: newPaidInstallments,
            status: newRemaining <= 0 ? 'repaid' : 'active',
          };
        }
        return loan;
      });
      setLoans(updatedLoans);
    }

    // Update project if type === 'project_share'
    let updatedProjects = projects;
    if (txData.type === 'project_share' && txData.projectId) {
      updatedProjects = projects.map((p) =>
        p.id === txData.projectId
          ? { ...p, collectedCapital: p.collectedCapital + enteredPrincipal }
          : p
      );
      setProjects(updatedProjects);
    }

    // Auto-record to Cashier's Cashbook! Total cash inflow into drawer is totalCollected
    const memberObj = members.find((m) => m.id === txData.memberId);
    const cbVoucher = `CB-2026-${String(cashbook.length + 1).padStart(2, '0')}`;
    const fineNote = enteredFine > 0 ? ` [মূল জমা: ৳${enteredPrincipal} + জরিমানা: ৳${enteredFine}]` : '';
    const newCashbookEntry: CashbookEntry = {
      id: `cb-${Date.now()}`,
      voucherNo: cbVoucher,
      date: actualDate,
      type: 'inflow',
      category: 'kisti_collection',
      title: `${txData.type === 'savings' ? 'সঞ্চয় কিস্তি' : txData.type === 'loan_repayment' ? 'ঋণের কিস্তি' : 'প্রকল্প চাঁদা'} (${memberObj?.nameBn || memberObj?.nameEn || 'সদস্য'})${fineNote}`,
      amount: totalCollected,
      paymentMethod: txData.paymentMethod || 'cash',
      recordedByCashier: collectorName,
      relatedMemberId: txData.memberId,
      relatedProjectId: txData.projectId,
      notes: `রশিদ: ${receiptNo} - মাস: ${targetMonth} ${txData.remarks ? `- ${txData.remarks}` : ''}`,
    };
    const updatedCashbook = [newCashbookEntry, ...cashbook];
    setCashbook(updatedCashbook);

    // Immediately push to Firebase Firestore central database
    pushToFirebase({
      members: updatedMembers,
      transactions: updatedTransactions,
      loans: updatedLoans,
      projects: updatedProjects,
      cashbook: updatedCashbook,
      updatedBy: collectorName,
    });

    saveToServer({
      members: updatedMembers,
      transactions: updatedTransactions,
      loans: updatedLoans,
      projects: updatedProjects,
      cashbook: updatedCashbook,
    });

    return newTx;
  };

  // Loan Disburse
  const disburseLoan = (
    loanData: Omit<Loan, 'id' | 'loanNo' | 'paidAmount' | 'remainingAmount' | 'paidInstallments' | 'status'>
  ): Loan => {
    const loanNo = `LN-${100 + loans.length + 1}`;
    const id = `loan-${Date.now()}`;
    const newLoan: Loan = {
      ...loanData,
      id,
      loanNo,
      paidAmount: 0,
      remainingAmount: loanData.totalPayable,
      paidInstallments: 0,
      status: 'active',
    };

    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);

    // Attach active loan to member if member loan
    let updatedMembers = members;
    if (loanData.borrowerType !== 'external' && loanData.memberId) {
      updatedMembers = members.map((m) => (m.id === loanData.memberId ? { ...m, activeLoanId: id } : m));
      setMembers(updatedMembers);
    }

    // Cashier outflow record
    const memberObj = members.find((m) => m.id === loanData.memberId);
    const borrowerTitle = loanData.borrowerType === 'external'
      ? `${loanData.borrowerName || 'বাইরের ঋণগ্রহীতা'} (বাইরের গ্রহীতা)`
      : (memberObj?.nameBn || memberObj?.nameEn || 'সদস্য');

    const newCb: CashbookEntry = {
      id: `cb-${Date.now()}`,
      voucherNo: `CB-2026-${String(cashbook.length + 1).padStart(2, '0')}`,
      date: loanData.disbursedDate,
      type: 'outflow',
      category: 'loan_disbursement',
      title: `ঋণ বিতরণ (${borrowerTitle})`,
      amount: loanData.principalAmount,
      paymentMethod: 'cash',
      recordedByCashier: 'Milon Talukder (Cashier)',
      relatedMemberId: loanData.memberId,
      notes: `ঋণ নং: ${loanNo} - ${loanData.purpose}`,
    };
    const updatedCb = [newCb, ...cashbook];
    setCashbook(updatedCb);

    // Immediately push to Firebase Firestore central database
    pushToFirebase({
      loans: updatedLoans,
      members: updatedMembers,
      cashbook: updatedCb,
      updatedBy: currentMember?.nameEn || 'admin',
    });

    saveToServer({
      loans: updatedLoans,
      members: updatedMembers,
      cashbook: updatedCb,
    });

    return newLoan;
  };

  // Projects & Investments
  const addProject = (
    data: Omit<Project, 'id' | 'code' | 'collectedCapital' | 'totalExpenses'>
  ): Project => {
    const code = `FIO-INV-${String(projects.length + 1).padStart(2, '0')}`;
    const id = `inv-${Date.now()}`;
    const newProject: Project = {
      ...data,
      id,
      code,
      collectedCapital: data.investedAmount || 0,
      investedAmount: data.investedAmount || data.targetBudget || 0,
      totalExpenses: 0,
      totalProfit: data.totalProfit || 0,
      profitDate: data.profitDate,
      profitVoucherNo: data.profitVoucherNo,
      profitHistory:
        data.profitHistory && data.profitHistory.length > 0
          ? data.profitHistory
          : data.totalProfit && data.totalProfit > 0
          ? [
              {
                id: `prof-${Date.now()}`,
                projectId: id,
                amount: Number(data.totalProfit),
                date: data.profitDate || new Date().toISOString().split('T')[0],
                title: `${data.titleBn || data.titleEn} হতে প্রারম্ভিক মুনাফা`,
                voucherNo: data.profitVoucherNo || `CB-${(data.startDate || '2026').slice(0, 4)}-081`,
                recordedBy: currentMember?.nameEn || 'Milon Talukder (Cashier)',
              },
            ]
          : [],
    };
    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);

    // Record capital outflow in Cashbook if investedAmount > 0
    let updatedCashbook = cashbook;
    if (newProject.investedAmount && newProject.investedAmount > 0) {
      const yearStr = (data.startDate || '2026').slice(0, 4);
      const newCb: CashbookEntry = {
        id: `cb-${Date.now()}`,
        voucherNo: `CB-${yearStr}-INV${projects.length + 1}`,
        date: data.startDate || new Date().toISOString().split('T')[0],
        type: 'outflow',
        category: 'project_expense',
        title: `নতুন বিনিয়োগ মূলধন: ${data.titleBn || data.titleEn}`,
        amount: newProject.investedAmount,
        paymentMethod: 'bank',
        recordedByCashier: 'Milon Talukder (Cashier)',
        relatedProjectId: id,
        notes: data.description || 'বিনিয়োগ প্রকল্পের প্রারম্ভিক মূলধন বরাদ্দ',
      };
      updatedCashbook = [newCb, ...cashbook];
      setCashbook(updatedCashbook);
    }

    pushToFirebase({
      projects: updatedProjects,
      cashbook: updatedCashbook,
      updatedBy: currentMember?.nameEn || 'admin',
    });
    saveToServer({
      projects: updatedProjects,
      cashbook: updatedCashbook,
    });

    return newProject;
  };

  const updateProject = async (updated: Project) => {
    const updatedProjects = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(updatedProjects);

    // Immediately push to Firebase Firestore for multi-instance sync
    pushToFirebase({
      projects: updatedProjects,
      updatedBy: currentMember?.nameEn || 'admin',
    });

    saveToServer({ projects: updatedProjects });
  };

  const addInvestmentProfit = (
    projectId: string,
    profitData: Omit<InvestmentProfit, 'id' | 'projectId'>
  ): InvestmentProfit => {
    const id = `prof-${Date.now()}`;
    const newProfit: InvestmentProfit = {
      ...profitData,
      id,
      projectId,
    };

    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        const updatedHistory = [...(p.profitHistory || []), newProfit];
        const newTotalProfit = (p.totalProfit || 0) + Number(profitData.amount);
        return {
          ...p,
          totalProfit: newTotalProfit,
          profitDate: profitData.date,
          profitVoucherNo: profitData.voucherNo || p.profitVoucherNo,
          profitHistory: updatedHistory,
        };
      }
      return p;
    });
    setProjects(updatedProjects);

    // Auto-record profit inflow in Cashbook
    const targetPrj = projects.find((p) => p.id === projectId);
    const cbVoucher = profitData.voucherNo || `CB-${profitData.date.slice(0, 4)}-${String(cashbook.length + 1).padStart(3, '0')}`;
    const newCb: CashbookEntry = {
      id: `cb-${Date.now()}`,
      voucherNo: cbVoucher,
      date: profitData.date,
      type: 'inflow',
      category: 'other',
      title: `${targetPrj?.titleBn || targetPrj?.titleEn || 'বিনিয়োগ'} হতে অর্জিত মুনাফা/লাভ`,
      amount: Number(profitData.amount),
      paymentMethod: 'cash',
      recordedByCashier: profitData.recordedBy || 'Milon Talukder (Cashier)',
      relatedProjectId: projectId,
      notes: profitData.notes || 'বিনিয়োগ প্রকল্পের নিট মুনাফা নগদ আদায়',
    };
    const updatedCb = [newCb, ...cashbook];
    setCashbook(updatedCb);

    pushToFirebase({
      projects: updatedProjects,
      cashbook: updatedCb,
      updatedBy: currentMember?.nameEn || 'admin',
    });
    saveToServer({
      projects: updatedProjects,
      cashbook: updatedCb,
    });

    return newProfit;
  };

  const addProjectExpense = (expenseData: Omit<ProjectExpense, 'id'>) => {
    const id = `pe-${Date.now()}`;
    const newExpense: ProjectExpense = { ...expenseData, id };
    const updatedExpenses = [newExpense, ...projectExpenses];
    setProjectExpenses(updatedExpenses);

    // Update project totalExpenses
    const updatedProjects = projects.map((p) =>
      p.id === expenseData.projectId
        ? { ...p, totalExpenses: p.totalExpenses + expenseData.amount }
        : p
    );
    setProjects(updatedProjects);

    // Add cashier outflow
    const targetPrj = projects.find((p) => p.id === expenseData.projectId);
    const newCb: CashbookEntry = {
      id: `cb-${Date.now()}`,
      voucherNo: expenseData.voucherNo || `CB-2026-${String(cashbook.length + 1).padStart(2, '0')}`,
      date: expenseData.date,
      type: 'outflow',
      category: 'project_expense',
      title: `প্রকল্প খরচ: ${expenseData.title} (${targetPrj?.code || ''})`,
      amount: expenseData.amount,
      paymentMethod: 'cash',
      recordedByCashier: 'Milon Talukder (Cashier)',
      relatedProjectId: expenseData.projectId,
      notes: expenseData.notes,
    };
    const updatedCb = [newCb, ...cashbook];
    setCashbook(updatedCb);

    pushToFirebase({
      projectExpenses: updatedExpenses,
      projects: updatedProjects,
      cashbook: updatedCb,
      updatedBy: currentMember?.nameEn || 'admin',
    });
    saveToServer({
      projectExpenses: updatedExpenses,
      projects: updatedProjects,
      cashbook: updatedCb,
    });
  };

  // Tasks
  const addTask = (data: Omit<Task, 'id' | 'createdAt'>): Task => {
    const id = `tsk-${Date.now()}`;
    const newTask: Task = {
      ...data,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    pushToFirebase({ tasks: updatedTasks, updatedBy: currentMember?.nameEn || 'admin' });
    saveToServer({ tasks: updatedTasks });
    return newTask;
  };

  const updateTask = (updated: Task) => {
    const updatedTasks = tasks.map((t) => (t.id === updated.id ? updated : t));
    setTasks(updatedTasks);
    pushToFirebase({ tasks: updatedTasks, updatedBy: currentMember?.nameEn || 'admin' });
    saveToServer({ tasks: updatedTasks });
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status,
            completedAt: status === 'done' ? new Date().toISOString().split('T')[0] : undefined,
          }
        : t
    );
    setTasks(updatedTasks);
    pushToFirebase({ tasks: updatedTasks, updatedBy: currentMember?.nameEn || 'admin' });
    saveToServer({ tasks: updatedTasks });
  };

  const toggleTaskChecklist = (taskId: string, checklistItemId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const updatedChecklist = t.checklist.map((item) =>
        item.id === checklistItemId ? { ...item, done: !item.done } : item
      );
      return { ...t, checklist: updatedChecklist };
    });
    setTasks(updatedTasks);
    pushToFirebase({ tasks: updatedTasks, updatedBy: currentMember?.nameEn || 'admin' });
    saveToServer({ tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    pushToFirebase({ tasks: updatedTasks, updatedBy: currentMember?.nameEn || 'admin' });
    saveToServer({ tasks: updatedTasks });
  };

  // Cashier
  const addCashbookEntry = (entry: Omit<CashbookEntry, 'id' | 'voucherNo'>): CashbookEntry => {
    const voucherNo = `CB-2026-${String(cashbook.length + 1).padStart(2, '0')}`;
    const id = `cb-${Date.now()}`;
    const newEntry: CashbookEntry = { ...entry, id, voucherNo };
    const updatedCb = [newEntry, ...cashbook];
    setCashbook(updatedCb);
    pushToFirebase({ cashbook: updatedCb, updatedBy: currentMember?.nameEn || 'admin' });
    saveToServer({ cashbook: updatedCb });
    return newEntry;
  };

  const resetDemoData = () => {
    localStorage.removeItem('somiti_members_fio_v3');
    localStorage.removeItem('somiti_members_fio_v2');
    localStorage.removeItem('somiti_transactions_fio_v4');
    localStorage.removeItem('somiti_transactions_fio_v2');
    localStorage.removeItem('somiti_loans_fio_v4');
    localStorage.removeItem('somiti_loans_fio_v2');
    localStorage.removeItem('somiti_projects_fio_v2');
    localStorage.removeItem('somiti_project_expenses_fio_v2');
    localStorage.removeItem('somiti_tasks_fio_v2');
    localStorage.removeItem('somiti_cashbook_fio_v2');
    localStorage.removeItem('somiti_current_member_id');
    setMembers(INITIAL_MEMBERS);
    setCurrentMemberId('mem-1');
    setTransactions(INITIAL_TRANSACTIONS);
    setLoans(INITIAL_LOANS);
    setProjects(INITIAL_PROJECTS);
    setProjectExpenses(INITIAL_PROJECT_EXPENSES);
    setTasks(INITIAL_TASKS);
    setCashbook(INITIAL_CASHBOOK);

    const resetPayload = {
      members: updateMembersWithEqualShares(INITIAL_MEMBERS),
      transactions: INITIAL_TRANSACTIONS,
      loans: INITIAL_LOANS,
      projects: INITIAL_PROJECTS,
      projectExpenses: INITIAL_PROJECT_EXPENSES,
      tasks: INITIAL_TASKS,
      cashbook: INITIAL_CASHBOOK,
      version: Date.now(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'reset',
    };

    pushToFirebase(resetPayload);

    fetch('/api/data/reset', { method: 'POST' })
      .then(() => {
        setSyncStatus('synced');
        setLastSaved(new Date().toISOString());
      })
      .catch(() => {});
  };

  const emergencyResync = async (): Promise<boolean> => {
    try {
      setSyncStatus('saving');
      const freshCloud = await fetchFromFirebase();
      if (freshCloud && Array.isArray(freshCloud.members) && freshCloud.members.length > 0) {
        applyServerData(freshCloud);
        setSyncStatus('synced');
        setLastSaved(freshCloud.updatedAt || new Date().toISOString());
        return true;
      }
      return await manualForceSync();
    } catch (err) {
      console.warn('Emergency resync error:', err);
      return false;
    }
  };

  return (
    <SomitiContext.Provider
      value={{
        members,
        transactions,
        loans,
        projects,
        projectExpenses,
        tasks,
        cashbook,
        language,
        setLanguage,
        darkMode,
        toggleDarkMode,
        portalFeatureSettings,
        updatePortalFeatureSettings,
        isServerDataLoaded,
        syncStatus,
        lastSaved,
        saveToServer,
        pushToFirebase,
        manualForceSync,
        cloudSaveError,
        dismissCloudSaveError,
        currentMember,
        currentMemberId,
        login,
        logout,
        switchMember,
        updatePassword,
        updateMemberCredentials,
        updateMemberPhoto,
        updateMemberProfile,
        activeMemberPortalSubTab,
        setActiveMemberPortalSubTab,
        addMember,
        updateMember,
        deleteMember,
        collectKisti,
        disburseLoan,
        addProject,
        updateProject,
        addProjectExpense,
        addInvestmentProfit,
        addTask,
        updateTask,
        updateTaskStatus,
        toggleTaskChecklist,
        deleteTask,
        addCashbookEntry,
        resetDemoData,
        emergencyResync,
      }}
    >
      {children}
    </SomitiContext.Provider>
  );
};

export const useSomiti = () => {
  const context = useContext(SomitiContext);
  if (!context) {
    throw new Error('useSomiti must be used within a SomitiProvider');
  }
  return context;
};

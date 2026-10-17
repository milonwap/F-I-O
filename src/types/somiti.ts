export type MemberRole = 'president' | 'secretary' | 'cashier' | 'executive' | 'member' | 'lead_executive';

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank';

export type KistiType = 'savings' | 'loan_repayment' | 'project_share' | 'fine_fee';

export type LoanStatus = 'active' | 'repaid' | 'overdue';

export type ProjectCategory = 
  | 'land_lease' 
  | 'general_investment' 
  | 'share_partnership' 
  | 'agriculture' 
  | 'real_estate' 
  | 'retail' 
  | 'fisheries' 
  | 'welfare' 
  | 'trading';

export type ProjectStatus = 'planning' | 'in_progress' | 'harvesting' | 'completed' | 'on_hold';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface PortalFeatureSettings {
  profile: boolean;
  passbook: boolean;
  dashboard: boolean;
  loan: boolean;
  investment: boolean;
  statement: boolean;
  rules: boolean;
}

export interface MemberPermissions {
  canViewProfile?: boolean;
  canViewPassbook?: boolean;
  canViewDashboard?: boolean;
  canViewSavings?: boolean;
  canViewLoans?: boolean;
  canViewInvestments?: boolean;
  canViewStatement?: boolean;
  canViewReports?: boolean;
  canViewRules?: boolean;
  canViewMembersDirectory?: boolean;
  canEditProfile?: boolean;
}

export interface Member {
  id: string;
  memberNo: string; // e.g. "SOM-101"
  nameEn: string;
  nameBn: string;
  phone: string;
  nid?: string;
  role: MemberRole;
  joinDate: string;
  shareCount: number; // e.g. 5 shares
  shareFaceValue: number; // e.g. ৳1,000 each
  monthlySavingsCommitment: number; // e.g. ৳1,000 / month
  totalSavingsDeposited: number;
  activeLoanId?: string;
  status: 'active' | 'inactive';
  address?: string;
  presentAddress?: string;
  permanentAddress?: string;
  fatherName?: string;
  motherName?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhone?: string;
  nomineeNid?: string;
  nomineeSharePercent?: number;
  avatarSeed?: string;
  photoUrl?: string;
  notes?: string;
  password?: string;
  permissions?: MemberPermissions;
  total_deposited?: number;
  total_fine_paid?: number;
  current_equity_value?: number;
}

export interface KistiTransaction {
  id: string;
  receiptNo: string; // e.g. "REC-2026-018"
  memberId: string;
  type: KistiType;
  amount: number; // Total collected for backwards compatibility
  principalAmount?: number; // Principal deposit (adds to member's actual savings)
  fineAmount?: number; // Late fee/fine (somiti administrative revenue, not savings)
  totalPaid?: number; // principalAmount + fineAmount
  targetMonth?: string; // Target kisti period e.g. "2026-03"
  date: string; // YYYY-MM-DD
  periodMonth: string; // "2026-03"
  paymentMethod: PaymentMethod;
  collectedBy: string; // Cashier name or collector
  collector?: string;
  cashierId?: string;
  remarks?: string;
  projectId?: string;
  loanId?: string;
  actualPaymentDate?: string;
  isFineWaived?: boolean;
  isEdited?: boolean;
  is_edited?: boolean;
  correctionReason?: string;
  lastEditedAt?: string;
  last_edited_at?: any;
  editedBy?: string;
}

export interface CashbookEntry {
  id: string;
  voucherNo: string; // e.g. "VCH-2026-05"
  date: string;
  type: 'inflow' | 'outflow';
  category: 'kisti_collection' | 'loan_disbursement' | 'project_expense' | 'bank_deposit' | 'bank_withdrawal' | 'office_expense' | 'other';
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedByCashier: string;
  relatedMemberId?: string;
  relatedProjectId?: string;
  notes?: string;
}

export type BorrowerType = 'member' | 'external';

export interface Loan {
  id: string;
  loanNo: string;
  borrowerType?: BorrowerType; // 'member' | 'external'
  memberId?: string;
  // External borrower specific fields
  borrowerName?: string;
  borrowerPhone?: string;
  borrowerAddress?: string;
  borrowerNid?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  collateralDetails?: string;
  frequency?: 'monthly' | 'weekly';

  principalAmount: number;
  profitServiceRatePercent: number; // e.g. 8%
  totalPayable: number;
  totalInstallments: number; // e.g. 10
  paidInstallments: number; // e.g. 4
  installmentAmount: number; // e.g. ৳5,400
  paidAmount: number;
  remainingAmount: number;
  disbursedDate: string;
  dueDate: string;
  purpose: string;
  status: LoanStatus;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  spentByMemberId: string;
  voucherNo?: string;
  notes?: string;
}

export interface InvestmentProfit {
  id: string;
  projectId: string;
  amount: number;
  date: string; // e.g. "2025-08-24"
  title?: string;
  notes?: string;
  recordedBy?: string;
  voucherNo?: string;
}

export interface Project {
  id: string;
  code: string; // e.g. "PRJ-01" or "INV-01"
  titleEn: string;
  titleBn: string;
  description: string;
  category: ProjectCategory;
  targetBudget: number;
  collectedCapital: number;
  totalExpenses: number;
  expectedReturnPercent: number;
  startDate: string;
  targetEndDate: string;
  status: ProjectStatus;
  leadMemberId: string;
  contactName?: string; // উদ্যোক্তা বা প্রতিনিধির নাম / Partner Name
  contactPhone?: string; // যোগাযোগ বা মোবাইল নম্বর / Contact Phone
  contactAddress?: string; // প্রকল্পের ঠিকানা বা লোকেশন / Project Address
  // Dynamic category specific fields:
  // A. Land Lease / Mortgage (land_lease)
  landownerName?: string; // জমির মালিকের নাম
  landAreaDagNo?: string; // জমির পরিমাণ ও দাগ/খতিয়ান নম্বর
  leaseDuration?: string; // লিজের মেয়াদ / সময়কাল
  // B. General Investment (general_investment)
  recipientName?: string; // প্রাপক / দায়িত্বপ্রাপ্ত ব্যক্তির নাম
  recipientPhone?: string; // মোবাইল নম্বর
  recipientAddress?: string; // ঠিকানা
  investmentPurpose?: string; // বিনিয়োগের উদ্দেশ্য / খাত
  // C. Share Partnership (share_partnership)
  partnerNames?: string; // পার্টনার / শেয়ারহোল্ডারদের নাম
  shareRatio?: string; // শেয়ার অনুপাত / শতকরা হার (যেমন: 50%-50%)
  partnerContact?: string; // পার্টনারের যোগাযোগ ও ঠিকানা
  investedAmount?: number;
  totalProfit?: number;
  profitDate?: string;
  profitVoucherNo?: string; // লভ্যাংশের ক্যাশবুক ভাউচার নম্বর e.g. "CB-2025-081"
  profitHistory?: InvestmentProfit[];
  notes?: string;
}

export const isAdminRole = (role?: MemberRole | string): boolean => {
  if (!role) return false;
  const cleanRole = String(role).trim().toLowerCase();
  return (
    cleanRole === 'lead_executive' ||
    cleanRole === 'president' ||
    cleanRole === 'secretary' ||
    cleanRole === 'cashier' ||
    cleanRole === 'admin'
  );
};

export type Investment = Project;

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedToMemberId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  checklist: TaskChecklistItem[];
}

export type PortalSubTab = 'dashboard' | 'profile' | 'passbook' | 'loan' | 'investment' | 'statement' | 'rules' | 'tasks' | 'directory' | null;

export type ActiveTab = 'dashboard' | 'members' | 'deposit' | 'loan' | 'kisti' | 'cashier' | 'projects_tasks' | 'reports' | 'statement' | 'my_portal' | 'rules' | 'settings' | 'logout';

export type Language = 'bn' | 'en';


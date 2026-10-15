import { Language } from '../types/somiti';

export const formatCurrency = (amount: number, lang: Language = 'en'): string => {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount || 0);

  if (lang === 'bn') {
    return `৳ ${toBengaliNumber(formatted)}`;
  }
  return `৳ ${formatted}`;
};

export const toBengaliNumber = (numStr: string | number): string => {
  const bnDigits: { [key: string]: string } = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };
  return String(numStr).replace(/[0-9]/g, (digit) => bnDigits[digit] || digit);
};

export const normalizeNumberInput = (val: string | number): string => {
  if (val === undefined || val === null) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = String(val);
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(bnDigits[i], String(i));
  }
  return res.replace(/[^0-9.]/g, '');
};

export const parseBengaliNumber = (numStr: string | number): number => {
  const normalized = normalizeNumberInput(numStr);
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatDate = (dateString: string, lang: Language = 'en'): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (lang === 'bn') {
      const day = toBengaliNumber(date.getDate());
      const months = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
      const month = months[date.getMonth()];
      const year = toBengaliNumber(date.getFullYear());
      return `${day} ${month}, ${year}`;
    }

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatDateDMY = (dateString: string, lang: Language = 'en'): string => {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const formatted = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      return lang === 'bn' ? toBengaliNumber(formatted) : formatted;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const formatted = `${d}/${m}/${y}`;
    return lang === 'bn' ? toBengaliNumber(formatted) : formatted;
  } catch {
    return dateString;
  }
};

export const numberToWords = (num: number, lang: Language = 'en'): string => {
  if (!num || isNaN(num)) return lang === 'bn' ? 'শূন্য টাকা মাত্র' : 'Zero Taka only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertEnglish = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertEnglish(n % 100) : '');
    if (n < 100000) return convertEnglish(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertEnglish(n % 1000) : '');
    if (n < 10000000) return convertEnglish(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertEnglish(n % 100000) : '');
    return convertEnglish(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertEnglish(n % 10000000) : '');
  };

  if (lang === 'bn') {
    return `${toBengaliNumber(num)} টাকা মাত্র`;
  }

  return `${convertEnglish(num)} Taka only`;
};

export const translations = {
  en: {
    appName: 'Friend Initiative Organization',
    appSubtitle: 'Member Kisti, Loans & Project Task Manager',
    dashboard: 'Dashboard',
    members: 'Members',
    kistiLedger: 'Kisti & Loans',
    projectsTasks: 'Projects & Tasks',
    reports: 'Statement',
    collectKisti: 'Collect Kisti',
    newMember: 'Add Member',
    newProject: 'New Project',
    disburseLoan: 'Disburse Loan',
    newTask: 'Add Task',
    totalVault: 'Total Somiti Vault',
    totalSavings: 'Total Member Savings',
    monthlyCollectionRate: 'Monthly Kisti Rate',
    activeLoans: 'Active Loans Disbursed',
    activeProjects: 'Active Projects',
    outstandingLoan: 'Outstanding Dues',
    quickCollectionSheet: 'Monthly Collection Sheet',
    recentTransactions: 'Recent Kisti Receipts',
    viewAll: 'View All',
    searchPlaceholder: 'Search by name, ID or mobile...',
    allRoles: 'All Roles',
    president: 'President',
    secretary: 'General Secretary',
    cashier: 'Cashier',
    executive: 'Executive Member',
    member: 'General Member',
    status: 'Status',
    actions: 'Actions',
    shares: 'Shares',
    monthlyCommitment: 'Monthly Kisti',
    totalDeposited: 'Total Savings',
    passbook: 'Passbook',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    print: 'Print',
    printReceipt: 'Print Receipt',
    printPassbook: 'Print Passbook',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    bkash: 'bKash',
    nagad: 'Nagad',
    bank: 'Bank Transfer',
    savingsKisti: 'Monthly Savings Kisti',
    loanRepayment: 'Loan Installment',
    projectShare: 'Project Contribution',
    fineFee: 'Admission / Other Fee',
    receiptNo: 'Receipt No',
    date: 'Date',
    amount: 'Amount',
    memberId: 'Member ID',
    memberName: 'Member Name',
    collectedBy: 'Collected By',
    remarks: 'Remarks',
    paid: 'Paid',
    partial: 'Partial',
    due: 'Due',
    overdue: 'Overdue',
    projects: 'Projects',
    tasks: 'Tasks',
    kanbanView: 'Kanban Board',
    listView: 'List View',
    todo: 'To Do',
    inProgress: 'In Progress',
    review: 'Review',
    completed: 'Completed',
    priority: 'Priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    dueDate: 'Due Date',
    assignedTo: 'Assigned To',
    budget: 'Budget',
    capital: 'Capital',
    spent: 'Spent',
    exportCsv: 'Export CSV',
    resetData: 'Reset Demo Data',
    bylaws: 'Rules',
  },
  bn: {
    appName: 'ফ্রেন্ড ইনিশিয়েটিভ অর্গানাইজেশন',
    appSubtitle: 'সদস্য কিস্তি, ঋণ ও প্রজেক্ট টাস্ক ম্যানেজার',
    dashboard: 'ড্যাশবোর্ড',
    members: 'সদস্যবৃন্দ',
    kistiLedger: 'কিস্তি ও ঋণ হিসাব',
    projectsTasks: 'প্রকল্প ও টাস্ক',
    reports: 'স্টেটমেন্ট',
    bylaws: 'রুলস',
    collectKisti: 'কিস্তি গ্রহণ',
    newMember: 'নতুন সদস্য',
    newProject: 'নতুন প্রকল্প',
    disburseLoan: 'ঋণ বিতরণ',
    newTask: 'নতুন টাস্ক',
    totalVault: 'সমিতির মোট ফান্ড',
    totalSavings: 'মোট জমাকৃত সঞ্চয়',
    monthlyCollectionRate: 'চলতি মাসের কিস্তি আদায়',
    activeLoans: 'বিতরণকৃত মোট ঋণ',
    activeProjects: 'চলমান বিনিয়োগ প্রকল্প',
    outstandingLoan: 'বকেয়া ঋণ আদায়যোগ্য',
    quickCollectionSheet: 'চলতি মাসের কিস্তি কালেকশন শিট',
    recentTransactions: 'সাম্প্রতিক কিস্তির রসিদসমূহ',
    viewAll: 'সকল দেখুন',
    searchPlaceholder: 'নাম, সদস্য আইডি বা মোবাইল দিয়ে খুঁজুন...',
    allRoles: 'সকল পদবি',
    president: 'সভাপতি',
    secretary: 'সাধারণ সম্পাদক',
    cashier: 'ক্যাশিয়ার / কোষাধ্যক্ষ',
    executive: 'কার্যনির্বাহী সদস্য',
    member: 'সাধারণ সদস্য',
    status: 'অবস্থা',
    actions: 'অ্যাকশন',
    shares: 'শেয়ার সংখ্যা',
    monthlyCommitment: 'মাসিক সঞ্চয় কিস্তি',
    totalDeposited: 'মোট জমা সঞ্চয়',
    passbook: 'পাসবই ও হিসাব',
    edit: 'সম্পাদনা',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    print: 'প্রিন্ট',
    printReceipt: 'রসিদ প্রিন্ট',
    printPassbook: 'পাসবই প্রিন্ট',
    paymentMethod: 'পরিশোধের মাধ্যম',
    cash: 'নগদ টাকা (Cash)',
    bkash: 'বিকাশ (bKash)',
    nagad: 'নগদ (Nagad)',
    bank: 'ব্যাংক ট্রান্সফার',
    savingsKisti: 'মাসিক সঞ্চয় কিস্তি',
    loanRepayment: 'ঋণের কিস্তি পরিশোধ',
    projectShare: 'প্রকল্পের চাঁদা/শেয়ার',
    fineFee: 'ভর্তি ফি / বিবিধ ফি',
    receiptNo: 'রশিদ নম্বর',
    date: 'তারিখ',
    amount: 'পরিমাণ',
    memberId: 'সদস্য নং',
    memberName: 'সদস্যের নাম',
    collectedBy: 'আদায়কারী',
    remarks: 'মন্তব্য',
    paid: 'পরিশোধিত',
    partial: 'আংশিক',
    due: 'বকেয়া',
    overdue: 'মেয়াদোত্তীর্ণ',
    projects: 'বিনিয়োগ প্রকল্প',
    tasks: 'প্রকল্পের টাস্ক',
    kanbanView: 'কানবান বোর্ড',
    listView: 'তালিকা ভিউ',
    todo: 'করনীয় (To Do)',
    inProgress: 'চলমান (In Progress)',
    review: 'যাচাই (Review)',
    completed: 'সম্পন্ন (Done)',
    priority: 'অগ্রাধিকার',
    high: 'জরুরি (High)',
    medium: 'মাঝারি (Medium)',
    low: 'সাধারণ (Low)',
    dueDate: 'শেষ সময়',
    assignedTo: 'দায়িত্বপ্রাপ্ত সদস্য',
    budget: 'বাজেট',
    capital: 'সংগৃহীত মূলধন',
    spent: 'মোট খরচ',
    exportCsv: 'এক্সেল/সিএসভি ডাউনলোড',
    resetData: 'ডেমো ডাটা রিসেট',
  },
};

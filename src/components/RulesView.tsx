import React from 'react';
import { useSomiti } from '../context/SomitiContext';
import { FileText, CheckCircle2, ShieldCheck, Calendar, Users, Wallet } from 'lucide-react';
import { toBengaliNumber } from '../utils/formatters';

export const RulesView: React.FC = () => {
  const { language } = useSomiti();

  const rules = language === 'bn' ? [
    {
      title: '১. সমিতি প্রতিষ্ঠা ও শুরু',
      desc: 'বন্ধু উদ্যোক্তা সমবায় সমিতি (Friend Initiative Organization) আনুষ্ঠানিকভাবে ১০/০৯/২০২৪ তারিখে যাত্রা শুরু করে।'
    },
    {
      title: '২. মাসিক সঞ্চয় ও কিস্তি আদায়',
      desc: 'প্রতি মাসের ৫ থেকে ১০ তারিখের মধ্যে প্রতি সদস্যের নির্ধারিত মাসিক সঞ্চয় ১০০০৳ কিস্তি হিসেবে জমা দিতে হবে। ক্যাশিয়ার কোনো প্রকার অতিরিক্ত ফি বা চার্জ ছাড়াই এই কিস্তি সংগ্রহ করতে পারবেন।'
    },
    {
      title: '৩. শেয়ার ও আমানত',
      desc: 'সকল সদস্যের আমানত ও শেয়ার মূলধন ১০০% শেয়ার হোল্ডার সদস্য এবং তার মনোনীত নমিনির নামে সংরক্ষিত থাকবে।'
    },
    {
      title: '৪. জন্মতারিখ ও রিমাইন্ডার',
      desc: 'প্রতিটি সদস্যের জন্মতারিখ ও প্রোফাইল তথ্য ডাটাবেজে সংরক্ষিত থাকবে এবং ড্যাশবোর্ডে চলতি মাসের জন্মদিনের রিমাইন্ডার স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।'
    },
    {
      title: '৫. বিলম্বে জমা ও বিলম্ব ফি',
      desc: 'সমিতির সিদ্ধান্ত অনুযায়ী বর্তমানে কোনো প্রকার বিলম্ব জরিমানা প্রযোজ্য নয় (বিলম্ব ফি সম্পূর্ণ বন্ধ)।'
    },
    {
      title: '৬. ঋণ সুবিধা ও লাভ হার',
      desc: 'সদস্যগণ জামানত সাপেক্ষে সমিতির তহবিল থেকে সহজ শর্তে ঋণ গ্রহণ করতে পারবেন এবং নির্ধারিত লাভ হার প্রযোজ্য হবে।'
    },
    {
      title: '৭. প্রকল্প ও বিনিয়োগ',
      desc: 'সমিতির যৌথ উদ্যোগে জমি লিজ, কৃষি ও ব্যবসায়িক খাতে বিনিয়োগ পরিচালিত হবে এবং মুনাফা সদস্যদের মাঝে যথানিয়মে বণ্টিত হবে।'
    },
    {
      title: '৮. উপস্থিতি ও শৃঙ্খলা',
      desc: 'সকল সদস্যকে সমিতির নিয়মশৃঙ্খলা ও মাসিক মিটিংয়ে যথাসময়ে উপস্থিত থাকতে হবে।'
    },
    {
      title: '৯. ক্যাশিয়ার ও হিসাব রক্ষণ',
      desc: 'ক্যাশিয়ার প্রতিদিনের আয়-ব্যয় ক্যাশবুকে নিখুঁতভাবে লিপিবদ্ধ করবেন এবং যে কেউ যেকোনো সময় হিসাব যাচাই করতে পারবেন।'
    },
    {
      title: '১০. সদস্যপদ ও বাতিলকরণ',
      desc: 'টানা ৪ মাস কিস্তি বকেয়া থাকলে এবং নিয়ম অমান্য করলে কার্যনির্বাহী কমিটির সিদ্ধান্তে সদস্যপদ স্থগিত বা বাতিল হতে পারে।'
    }
  ] : [
    {
      title: '1. Somiti Establishment & Start Date',
      desc: 'Friend Initiative Organization officially started its journey on 10/09/2024.'
    },
    {
      title: '2. Monthly Savings & Kisti Collection',
      desc: 'Every member must deposit monthly savings of ৳1,000 between the 5th and 10th of each month. The Cashier can collect kisti without any extra fee or charge.'
    },
    {
      title: '3. Shares & Deposits 100%',
      desc: 'All member deposit amounts and share capital are 100% owned by the share members and their nominated nominee.'
    },
    {
      title: '4. Date of Birth & Reminders',
      desc: 'Member Date of Birth (DOB) is maintained in the schema, and upcoming birthdays for the current month are highlighted on the Dashboard.'
    },
    {
      title: '5. Late Penalty',
      desc: 'Late fine/penalty is currently disabled (৳0 late fee constraint).'
    },
    {
      title: '6. Loan Facilities',
      desc: 'Members can access emergency and project loans against share capital under fair terms.'
    },
    {
      title: '7. Project Investments',
      desc: 'Joint initiatives in land lease, agriculture, and trading distribute profits proportionally among members.'
    },
    {
      title: '8. Discipline & Attendance',
      desc: 'Active participation in monthly meetings and adherence to somiti bylaws is mandatory.'
    },
    {
      title: '9. Cashier & Transparency',
      desc: 'The Cashier records daily transactions transparently with zero fee constraints on collection.'
    },
    {
      title: '10. Membership Status',
      desc: 'Defaulting for 4 consecutive months may lead to membership review as per executive committee bylaws.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              {language === 'bn' ? 'বন্ধু উদ্যোক্তা সমবায় সমিতি - রুলস ও সংবিধান' : 'Friend Initiative Organization - Rules & Constitution'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {language === 'bn' ? 'প্রতিষ্ঠার তারিখ: ১০/০৯/২০২৪ · ১০টি মৌলিক বিধিমালা' : 'Established: 10/09/2024 · 10 Core Rules'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {rules.map((rule, idx) => (
            <div key={idx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {toBengaliNumber(idx + 1)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900">{rule.title}</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

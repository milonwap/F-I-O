import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { normalizeNumberInput } from '../utils/formatters';

interface DateInputProps {
  value: string; // Stored in ISO format "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  minYear?: number;
  maxYear?: number;
  placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  className = '',
  id,
  minYear = 1940,
  maxYear = 2035,
}) => {
  // Parse value (YYYY-MM-DD) into day, month, year
  const parseValue = (isoStr: string) => {
    if (!isoStr) return { day: '', month: '', year: '' };
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return {
        year: parts[0] || '',
        month: parts[1] || '',
        day: parts[2] || '',
      };
    }
    return { day: '', month: '', year: '' };
  };

  const parsed = parseValue(value);
  const [day, setDay] = useState<string>(parsed.day);
  const [month, setMonth] = useState<string>(parsed.month);
  const [year, setYear] = useState<string>(parsed.year);

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const hiddenNativeRef = useRef<HTMLInputElement>(null);

  // Sync internal state if external value changes
  useEffect(() => {
    const updated = parseValue(value);
    setDay(updated.day);
    setMonth(updated.month);
    setYear(updated.year);
  }, [value]);

  const updateParent = (newDay: string, newMonth: string, newYear: string) => {
    if (!newDay && !newMonth && !newYear) {
      onChange('');
      return;
    }

    if (newDay && newMonth && newYear && newYear.length === 4) {
      const d = newDay.padStart(2, '0');
      const m = newMonth.padStart(2, '0');
      const y = newYear;
      onChange(`${y}-${m}-${d}`);
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = normalizeNumberInput(e.target.value).slice(0, 2);
    setDay(clean);
    updateParent(clean, month, year);

    // Auto advance to month if 2 digits or user typed >= 4 (since days can't be > 31)
    if (clean.length === 2 || (clean.length === 1 && Number(clean) >= 4)) {
      monthRef.current?.focus();
      monthRef.current?.select();
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = normalizeNumberInput(e.target.value).slice(0, 2);
    setMonth(clean);
    updateParent(day, clean, year);

    // Auto advance to year if 2 digits or user typed >= 2 (if > 1 then only single digit month)
    if (clean.length === 2 || (clean.length === 1 && Number(clean) >= 2)) {
      yearRef.current?.focus();
      yearRef.current?.select();
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = normalizeNumberInput(e.target.value).slice(0, 4);
    setYear(clean);
    updateParent(day, month, clean);
  };

  const handleDayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowRight' && day.length >= 1) {
      monthRef.current?.focus();
    }
  };

  const handleMonthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !month) {
      dayRef.current?.focus();
    } else if (e.key === 'ArrowLeft') {
      dayRef.current?.focus();
    } else if (e.key === 'ArrowRight' && month.length >= 1) {
      yearRef.current?.focus();
    }
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !year) {
      monthRef.current?.focus();
    } else if (e.key === 'ArrowLeft') {
      monthRef.current?.focus();
    }
  };

  const handleClear = () => {
    setDay('');
    setMonth('');
    setYear('');
    onChange('');
    dayRef.current?.focus();
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <span className="text-[10px] text-neutral-600 font-mono">দিন/মাস/বছর (DD/MM/YYYY)</span>
        </div>
      )}

      <div className="relative flex items-center bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all shadow-2xs">
        {/* Segment 1: Day (Date) */}
        <div className="flex flex-col items-center">
          <input
            ref={dayRef}
            type="text"
            inputMode="numeric"
            placeholder="DD"
            value={day}
            onChange={handleDayChange}
            onKeyDown={handleDayKeyDown}
            disabled={disabled}
            className="w-8 text-center text-xs sm:text-sm font-mono font-bold text-neutral-900 dark:text-white bg-transparent focus:outline-none placeholder:text-neutral-600 placeholder:font-normal"
            title="দিন (Day 01-31)"
          />
          <span className="text-[9px] text-neutral-600 font-medium leading-none">দিন</span>
        </div>

        <span className="text-neutral-400 font-mono text-xs px-1 select-none font-bold">/</span>

        {/* Segment 2: Month */}
        <div className="flex flex-col items-center">
          <input
            ref={monthRef}
            type="text"
            inputMode="numeric"
            placeholder="MM"
            value={month}
            onChange={handleMonthChange}
            onKeyDown={handleMonthKeyDown}
            disabled={disabled}
            className="w-8 text-center text-xs sm:text-sm font-mono font-bold text-neutral-900 dark:text-white bg-transparent focus:outline-none placeholder:text-neutral-600 placeholder:font-normal"
            title="মাস (Month 01-12)"
          />
          <span className="text-[9px] text-neutral-600 font-medium leading-none">মাস</span>
        </div>

        <span className="text-neutral-400 font-mono text-xs px-1 select-none font-bold">/</span>

        {/* Segment 3: Year */}
        <div className="flex flex-col items-center flex-1">
          <input
            ref={yearRef}
            type="text"
            inputMode="numeric"
            placeholder="YYYY"
            value={year}
            onChange={handleYearChange}
            onKeyDown={handleYearKeyDown}
            disabled={disabled}
            className="w-14 text-center text-xs sm:text-sm font-mono font-bold text-neutral-900 dark:text-white bg-transparent focus:outline-none placeholder:text-neutral-600 placeholder:font-normal"
            title="বছর (Year e.g. 2026)"
          />
          <span className="text-[9px] text-neutral-600 font-medium leading-none">বছর</span>
        </div>

        {/* Action icons: Clear button if value exists */}
        {(day || month || year) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-neutral-400 hover:text-red-500 rounded-full transition-colors cursor-pointer mr-1"
            title="তারিখ মুছুন (Clear date)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Native Calendar Picker button */}
        <div className="relative shrink-0 flex items-center pl-1 border-l border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => {
              const el = hiddenNativeRef.current;
              if (!el) return;
              if ('showPicker' in el && typeof (el as any).showPicker === 'function') {
                try {
                  (el as any).showPicker();
                  return;
                } catch {
                  // Fall back
                }
              }
              el.focus();
              el.click();
            }}
            className="p-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            title="ক্যালেন্ডার থেকে তারিখ বাছুন"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>

          {/* Hidden HTML5 date picker for browser calendar popup support */}
          <input
            ref={hiddenNativeRef}
            type="date"
            value={value || ''}
            onChange={handleNativePickerChange}
            disabled={disabled}
            className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
};

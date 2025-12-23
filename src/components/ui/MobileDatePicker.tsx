import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

interface MobileDatePickerProps {
  value: string; // ISO format: YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const MONTHS_TH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

// Format date for display (Thai format)
function formatThaiDate(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = date.getDate();
  const month = MONTHS_TH_SHORT[date.getMonth()];
  const buddhistYear = date.getFullYear() + 543;
  return `${day} ${month} ${buddhistYear}`;
}

// Format date to ISO string
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function MobileDatePicker({
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  minDate,
  maxDate,
  disabled = false,
  className = '',
}: MobileDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current month/year for calendar view
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  // Update current month when value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Don't close if clicking on portal content
        const portalContent = document.getElementById('mobile-date-picker-portal');
        if (portalContent && portalContent.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const { daysInMonth, firstDayOfWeek, year, month } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfWeek, year, month };
  }, [currentMonth]);

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }

    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(0, 0, 0, 0);
      if (date > max) return true;
    }

    return false;
  };

  const handleSelectDate = (day: number) => {
    if (isDateDisabled(day)) return;
    const date = new Date(year, month, day);
    const isoDate = formatDateToISO(date);
    onChange(isoDate);
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const dateStr = formatDateToISO(new Date(year, month, day));
    return dateStr === value;
  };

  const isToday = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const canGoPrev = () => {
    if (!minDate) return true;
    const prevMonth = new Date(year, month - 1, 1);
    const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    return prevMonth >= minMonth;
  };

  const canGoNext = () => {
    if (!maxDate) return true;
    const nextMonth = new Date(year, month + 1, 1);
    const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    return nextMonth <= maxMonth;
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const isoDate = formatDateToISO(today);
    onChange(isoDate);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setIsOpen(false);
  };

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const buddhistYear = year + 543;

  // Full screen mobile calendar modal
  const calendarModal = isOpen && createPortal(
    <div
      id="mobile-date-picker-portal"
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Calendar Panel - slides up on mobile */}
      <div className="relative w-full sm:w-auto sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div>
            <div className="text-sm opacity-90">เลือกวันที่</div>
            <div className="text-lg font-semibold">
              {value ? formatThaiDate(value) : 'ยังไม่ได้เลือก'}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <button
            type="button"
            onClick={goToPrevMonth}
            disabled={!canGoPrev()}
            className={`p-2 rounded-full transition-all ${
              canGoPrev()
                ? 'text-blue-600 hover:bg-blue-100 active:scale-95'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={20} />
          </button>

          <span className="font-semibold text-gray-800">
            {MONTHS_TH[month]} {buddhistYear}
          </span>

          <button
            type="button"
            onClick={goToNextMonth}
            disabled={!canGoNext()}
            className={`p-2 rounded-full transition-all ${
              canGoNext()
                ? 'text-blue-600 hover:bg-blue-100 active:scale-95'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b">
          {DAYS_TH.map((day, index) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-medium ${
                index === 0 ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 p-3">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayDisabled = isDateDisabled(day);
            const selected = isSelected(day);
            const todayDate = isToday(day);
            const isSunday = new Date(year, month, day).getDay() === 0;

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDate(day)}
                disabled={dayDisabled}
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all
                  ${!dayDisabled && !selected && (isSunday ? 'text-red-500' : 'text-gray-700')}
                  ${!dayDisabled && !selected && 'hover:bg-gray-100 active:scale-95'}
                  ${selected && 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'}
                  ${todayDate && !selected && 'ring-2 ring-blue-400 ring-inset'}
                  ${dayDisabled && 'text-gray-300 cursor-not-allowed'}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleSelectToday}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition"
          >
            วันนี้
          </button>
          <div className="flex gap-2">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 font-medium hover:bg-red-50 rounded-lg transition"
              >
                ล้าง
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              ตกลง
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>,
    document.body
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-left
          focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-400'}
          ${value ? 'text-gray-800' : 'text-gray-400'}
        `}
      >
        {value ? formatThaiDate(value) : placeholder}
      </button>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      {/* Calendar Modal */}
      {calendarModal}
    </div>
  );
}

export default MobileDatePicker;

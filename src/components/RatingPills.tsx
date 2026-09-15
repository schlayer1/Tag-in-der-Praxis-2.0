import React from 'react';
import { RatingValue } from '../types/report';
import { Check } from 'lucide-react';

interface RatingPillsProps {
  name: string;
  value: RatingValue;
  onChange: (val: RatingValue) => void;
}

const OPTIONS: { label: string; value: RatingValue; color: string }[] = [
  { label: 'Trifft voll zu', value: 'trifft voll zu', color: 'text-emerald-700 border-emerald-300' },
  { label: 'Trifft eher zu', value: 'trifft eher zu', color: 'text-school-blue border-blue-300' },
  { label: 'Trifft eher nicht zu', value: 'trifft eher nicht zu', color: 'text-amber-700 border-amber-300' },
  { label: 'Trifft gar nicht zu', value: 'trifft gar nicht zu', color: 'text-rose-700 border-rose-300' },
];

export const RatingPills: React.FC<RatingPillsProps> = ({
  name,
  value,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs flex-shrink-0">
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;

        return (
          <label
            key={opt.value}
            className={`relative flex items-center justify-center px-2.5 py-2 min-h-[42px] rounded-xl border text-center cursor-pointer select-none transition-all duration-200 active:scale-[0.98] ${
              isSelected
                ? 'bg-school-blue text-white font-bold border-school-blue shadow-md scale-[1.02]'
                : 'bg-white text-slate-700 border-slate-300 hover:border-school-blue/50 hover:bg-blue-50/50'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span className="flex items-center gap-1">
              {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
              <span>{opt.label}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
};

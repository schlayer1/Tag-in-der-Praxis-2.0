import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Briefcase, Smile, Award } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onSelectStep: (step: number) => void;
}

const steps = [
  { id: 1, title: 'Stammdaten', icon: UserCheck },
  { id: 2, title: 'Tagesablauf', icon: Briefcase },
  { id: 3, title: 'Reflexion', icon: Smile },
  { id: 4, title: 'Abschluss', icon: Award },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  onSelectStep,
}) => {
  const progressPercent = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="bg-white border-b border-school-border/80 px-4 sm:px-8 py-3.5 no-print">
      {/* Step Numbers & Titles */}
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-2">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className="group flex flex-col items-center focus:outline-none transition-all"
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-school-blue text-white shadow-md ring-4 ring-school-blue/20 scale-105'
                    : isCompleted
                    ? 'bg-school-teal text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <span
                className={`text-[11px] sm:text-xs font-semibold mt-1 transition-colors ${
                  isCurrent
                    ? 'text-school-blue font-bold'
                    : isCompleted
                    ? 'text-school-teal'
                    : 'text-slate-400'
                }`}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden max-w-2xl mx-auto shadow-inner">
        <motion.div
          className="bg-gradient-to-r from-school-blue via-school-cyan to-school-teal h-full rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
};

import React from 'react';
import { PraxisReport, RatingValue } from '../types/report';
import { RatingPills } from './RatingPills';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Meh, BookOpen, AlertCircle, Compass, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface StepSelfReflectionProps {
  report: PraxisReport;
  onChange: (field: keyof PraxisReport, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepSelfReflection: React.FC<StepSelfReflectionProps> = ({
  report,
  onChange,
  onNext,
  onPrev,
}) => {
  // Questions reveal sequentially to not overwhelm students:
  const showQ2 = !!report.funRating;
  const showQ3 = showQ2 && !!report.boredRating;
  const showQ4 = showQ3 && !!report.learnedRating;
  const showQ5 = showQ4 && !!report.overwhelmedRating;
  const allAnswered = showQ5 && !!report.careerRating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center">
          <span className="w-6 h-6 rounded-full bg-school-orange text-white text-xs flex items-center justify-center font-bold mr-2.5 flex-shrink-0">
            3
          </span>
          Selbsteinschätzung & Reflexion (4-stufige Bewertung)
        </label>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          Schrittweise Beantwortung
        </span>
      </div>

      {/* Frage 1: Spaß */}
      <motion.div
        layout
        className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-school-border transition shadow-sm"
      >
        <div className="flex items-center gap-2 flex-1">
          <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-slate-800">
            • Die Arbeit an diesem Tag hat mir Spaß gemacht.
          </span>
        </div>
        <RatingPills
          name="sc_fun"
          value={report.funRating}
          onChange={(val: RatingValue) => onChange('funRating', val)}
        />
      </motion.div>

      {/* Frage 2: Gelangweilt */}
      <AnimatePresence>
        {showQ2 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-school-border transition shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-2 flex-1">
              <Meh className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                • Ich habe mich während meiner Arbeit gelangweilt.
              </span>
            </div>
            <RatingPills
              name="sc_bored"
              value={report.boredRating}
              onChange={(val: RatingValue) => onChange('boredRating', val)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Frage 3: Neues gelernt + Erläuterung */}
      <AnimatePresence>
        {showQ3 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 hover:border-school-border transition shadow-sm overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <BookOpen className="w-4 h-4 text-school-blue flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-800">
                  • Ich habe an diesem Tag etwas Neues gelernt.
                </span>
              </div>
              <RatingPills
                name="sc_learned"
                value={report.learnedRating}
                onChange={(val: RatingValue) => onChange('learnedRating', val)}
              />
            </div>

            {/* Dynamisches Aufklapp-Textfeld */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-1"
            >
              <textarea
                id="learned_explanation"
                rows={2}
                value={report.learnedExplanation}
                onChange={(e) => onChange('learnedExplanation', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-base sm:text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition leading-relaxed"
                placeholder="Erläuterung: Welche Fachkenntnisse, Fähigkeiten oder Werkzeuge hast du neu gelernt?"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Frage 4: Überfordert + Erläuterung */}
      <AnimatePresence>
        {showQ4 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 hover:border-school-border transition shadow-sm overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-800">
                  • Ich war mit einer Aufgabe überfordert.
                </span>
              </div>
              <RatingPills
                name="sc_overwhelmed"
                value={report.overwhelmedRating}
                onChange={(val: RatingValue) => onChange('overwhelmedRating', val)}
              />
            </div>

            {/* Dynamisches Aufklapp-Textfeld */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-1"
            >
              <textarea
                id="overwhelmed_explanation"
                rows={2}
                value={report.overwhelmedExplanation}
                onChange={(e) => onChange('overwhelmedExplanation', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-base sm:text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition leading-relaxed"
                placeholder="Erläuterung: Wobei hast du dich überfordert gefühlt und woran lag es?"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Frage 5: Zukunfts-Perspektive */}
      <AnimatePresence>
        {showQ5 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-school-border transition shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-2 flex-1">
              <Compass className="w-4 h-4 text-school-teal flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                • Ich kann mir vorstellen, dieser Tätigkeit täglich nachzugehen.
              </span>
            </div>
            <RatingPills
              name="sc_career"
              value={report.careerRating}
              onChange={(val: RatingValue) => onChange('careerRating', val)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Badge when all 5 answered */}
      {allAnswered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Super gemacht! Alle 5 Selbsteinschätzungen sind ausgefüllt.</span>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 font-medium py-3 sm:py-2.5 px-4 rounded-xl sm:rounded-lg hover:bg-slate-100 transition active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-school-blue to-school-cyan hover:from-school-darkblue hover:to-school-blue text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <span>Weiter zum Abschluss</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

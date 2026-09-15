import React from 'react';
import { PraxisReport } from '../types/report';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepDailyLogProps {
  report: PraxisReport;
  onChange: (field: keyof PraxisReport, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepDailyLog: React.FC<StepDailyLogProps> = ({
  report,
  onChange,
  onNext,
  onPrev,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Freitext 1: Tätigkeitsbericht */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <label className="block text-sm font-bold text-slate-800 flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-school-cyan text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
            1
          </span>
          <span className="flex-1">Worin bestand deine Tätigkeit an diesem Tag?</span>
        </label>
        <div className="relative">
          <textarea
            id="task_description"
            rows={3}
            value={report.taskDescription}
            onChange={(e) => onChange('taskDescription', e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3.5 text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition leading-relaxed"
            placeholder="Beschreibe deine Hauptaufgaben, Werkzeuge, Maschinen oder Arbeitsschritte..."
          />
        </div>
      </div>

      {/* Freitext 2: Tagesablauf Zeitstunden */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2.5">
        <label className="block text-sm font-bold text-slate-800 flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-school-cyan text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
            2
          </span>
          <span className="flex-1">Wie lief dein Praktikumstag ab?</span>
        </label>
        <p className="text-xs text-slate-500 ml-8.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Stichpunktartiger Überblick nach Zeitstunden
        </p>
        <textarea
          id="daily_schedule"
          rows={4}
          value={report.dailySchedule}
          onChange={(e) => onChange('dailySchedule', e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-3.5 text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition leading-relaxed font-mono sm:font-sans"
          placeholder="08:00 Uhr: Arbeitsbeginn, Sicherheitsunterweisung&#10;09:30 Uhr: Vorbereitung der Werkstücke&#10;12:00 Uhr: Mittagspause&#10;12:45 Uhr: Montagearbeiten..."
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium py-2.5 px-4 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-school-blue to-school-cyan hover:from-school-darkblue hover:to-school-blue text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <span>Weiter zur Selbsteinschätzung</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

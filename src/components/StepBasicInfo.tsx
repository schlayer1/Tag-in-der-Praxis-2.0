import React from 'react';
import { PraxisReport } from '../types/report';
import { generateStudentCode } from '../services/reportService';
import { User, Building2, Calendar, Clock, Layers, ArrowRight, School, Key } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepBasicInfoProps {
  report: PraxisReport;
  onChange: (field: keyof PraxisReport, value: string) => void;
  onNext: () => void;
}

const COMMON_CLASSES = ['8a', '8b', '8c', '9a', '9b', '9c'];

export const StepBasicInfo: React.FC<StepBasicInfoProps> = ({
  report,
  onChange,
  onNext,
}) => {
  // Aufteilung von studentName in Vor- und Nachname
  const initialParts = (report.studentName || '').trim().split(/\s+/);
  const [firstName, setFirstName] = React.useState(initialParts.length > 0 ? initialParts[0] : '');
  const [lastName, setLastName] = React.useState(initialParts.length > 1 ? initialParts.slice(1).join(' ') : '');

  const updateNames = (newFirst: string, newLast: string) => {
    setFirstName(newFirst);
    setLastName(newLast);
    const full = `${newFirst} ${newLast}`.trim();
    onChange('studentName', full);
    const code = generateStudentCode(full);
    if (code) {
      onChange('studentCode', code);
    }
  };

  const loginCode = report.studentCode || generateStudentCode(`${firstName} ${lastName}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="bg-school-lightbg border border-school-border rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-school-blue mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-school-cyan" />
          Angaben zum Praktikumstag
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Vorname */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-school-blue" />
              Vorname <span className="text-school-orange font-bold">*</span>
            </label>
            <input
              type="text"
              id="student_firstname"
              value={firstName}
              onChange={(e) => updateNames(e.target.value, lastName)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition"
              placeholder="z. B. Lukas"
              required
            />
          </div>

          {/* Nachname */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-school-blue" />
              Nachname <span className="text-school-orange font-bold">*</span>
            </label>
            <input
              type="text"
              id="student_lastname"
              value={lastName}
              onChange={(e) => updateNames(firstName, e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition"
              placeholder="z. B. Müller"
              required
            />
          </div>

          {/* Dein Login (Automatisch erstelltes Kürzel) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-school-blue" />
              Dein Login
            </label>
            <div className="relative">
              <input
                type="text"
                id="student_login"
                value={loginCode}
                readOnly
                placeholder="Wird generiert..."
                className="w-full bg-blue-50/70 border border-blue-200 text-school-darkblue font-mono font-black tracking-wider rounded-lg px-3.5 py-2.5 text-sm cursor-default focus:outline-none"
              />
            </div>
          </div>

          {/* Klasse */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-school-blue" />
              Klasse <span className="text-school-orange font-bold">*</span>
            </label>
            <select
              id="student_class"
              value={report.studentClass}
              onChange={(e) => onChange('studentClass', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition"
            >
              {COMMON_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  Klasse {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Firma / Betrieb */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-school-blue" />
              Firma / Betrieb <span className="text-school-orange font-bold">*</span>
            </label>
            <input
              type="text"
              id="company_name"
              value={report.companyName}
              onChange={(e) => onChange('companyName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition"
              placeholder="Name des Unternehmens"
              required
            />
          </div>

          {/* Turnus */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-school-blue" />
              Turnus <span className="text-school-orange font-bold">*</span>
            </label>
            <select
              id="stage_select"
              value={report.stage}
              onChange={(e) => onChange('stage', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition"
            >
              <option value="Turnus 1">Turnus 1</option>
              <option value="Turnus 2">Turnus 2</option>
              <option value="Turnus 3">Turnus 3</option>
              <option value="Turnus 4">Turnus 4</option>
            </select>
          </div>

          {/* Datum */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-school-blue" />
              Datum <span className="text-school-orange font-bold">*</span>
            </label>
            <input
              type="date"
              id="report_date"
              value={report.reportDate}
              onChange={(e) => onChange('reportDate', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition"
              required
            />
          </div>

          {/* Arbeitsbeginn */}
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-school-cyan" />
              Arbeitsbeginn
            </label>
            <input
              type="time"
              id="start_time"
              value={report.startTime}
              onChange={(e) => onChange('startTime', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition"
            />
          </div>

          {/* Arbeitsende */}
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-school-cyan" />
              Arbeitsende
            </label>
            <input
              type="time"
              id="end_time"
              value={report.endTime}
              onChange={(e) => onChange('endTime', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-school-blue to-school-cyan hover:from-school-darkblue hover:to-school-blue text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <span>Weiter zum Tagesablauf</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

import React from 'react';
import { PraxisReport } from '../types/report';

interface PrintableReportProps {
  report: PraxisReport;
  timestampText: string;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  report,
  timestampText,
}) => {
  return (
    <div id="pdf-printable-report" className="bg-white text-slate-800 p-4 max-w-3xl mx-auto space-y-4 text-xs sm:text-sm">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-school-darkblue via-school-blue to-school-cyan p-4 sm:p-5 text-white rounded-xl flex items-center gap-4 relative overflow-hidden avoid-break">
        <div className="w-16 h-16 bg-white p-1 rounded-full shadow flex-shrink-0 flex items-center justify-center">
          <img
            src="/Siegel_bunt.png"
            alt="Siegel Heimbürgeschule Kahla"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="inline-block bg-school-orange text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mb-1">
            Berufsorientierung & Praxis
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
            Reflexion meines Praktikumstages
          </h1>
          <p className="text-xs text-blue-100 font-medium">
            Staatliche Regelschule »Heimbürgeschule« Kahla
          </p>
        </div>
      </div>

      {/* Stammdaten */}
      <div className="bg-[#F4F9FD] border border-[#D0E4F5] rounded-xl p-3.5 space-y-2 avoid-break">
        <h2 className="text-xs font-bold uppercase tracking-wider text-school-blue">
          Angaben zum Praktikumstag
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="col-span-2">
            <span className="font-semibold text-slate-500 block">Eigener Name:</span>
            <span className="font-bold text-slate-900">{report.studentName || '—'} {report.studentClass ? `(Klasse ${report.studentClass})` : ''}</span>
          </div>
          <div className="col-span-2">
            <span className="font-semibold text-slate-500 block">Firma / Betrieb:</span>
            <span className="font-bold text-slate-900">{report.companyName || '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block">Turnus:</span>
            <span className="font-medium text-slate-900">{report.stage}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block">Datum:</span>
            <span className="font-medium text-slate-900">{report.reportDate || '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block">Arbeitsbeginn:</span>
            <span className="font-medium text-slate-900">{report.startTime || '—'} Uhr</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block">Arbeitsende:</span>
            <span className="font-medium text-slate-900">{report.endTime || '—'} Uhr</span>
          </div>
        </div>
      </div>

      {/* 1. Tätigkeitsbericht */}
      <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 avoid-break">
        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-school-cyan text-white text-[10px] flex items-center justify-center font-bold">1</span>
          Worin bestand deine Tätigkeit an diesem Tag?
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
          {report.taskDescription || 'Keine Angabe'}
        </div>
      </div>

      {/* 2. Tagesablauf */}
      <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 avoid-break">
        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-school-cyan text-white text-[10px] flex items-center justify-center font-bold">2</span>
          Wie lief dein Praktikumstag ab? (Stichpunktartiger Überblick nach Zeitstunden)
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
          {report.dailySchedule || 'Keine Angabe'}
        </div>
      </div>

      {/* 3. Selbsteinschätzung */}
      <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 avoid-break">
        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-school-orange text-white text-[10px] flex items-center justify-center font-bold">3</span>
          Selbsteinschätzung & Reflexion (4-stufige Bewertung)
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500">
              <th className="py-1">Aussage</th>
              <th className="py-1 text-right">Bewertung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-1.5 font-medium text-slate-700">• Die Arbeit an diesem Tag hat mir Spaß gemacht.</td>
              <td className="py-1.5 text-right font-bold text-school-blue">{report.funRating || '—'}</td>
            </tr>
            <tr>
              <td className="py-1.5 font-medium text-slate-700">• Ich habe mich während meiner Arbeit gelangweilt.</td>
              <td className="py-1.5 text-right font-bold text-school-blue">{report.boredRating || '—'}</td>
            </tr>
            <tr>
              <td className="py-1.5 font-medium text-slate-700">• Ich habe an diesem Tag etwas Neues gelernt.</td>
              <td className="py-1.5 text-right font-bold text-school-blue">{report.learnedRating || '—'}</td>
            </tr>
            {report.learnedExplanation && (
              <tr>
                <td colSpan={2} className="py-1 pl-3 text-[11px] text-slate-600 bg-slate-50 italic rounded">
                  Erläuterung: {report.learnedExplanation}
                </td>
              </tr>
            )}
            <tr>
              <td className="py-1.5 font-medium text-slate-700">• Ich war mit einer Aufgabe überfordert.</td>
              <td className="py-1.5 text-right font-bold text-school-blue">{report.overwhelmedRating || '—'}</td>
            </tr>
            {report.overwhelmedExplanation && (
              <tr>
                <td colSpan={2} className="py-1 pl-3 text-[11px] text-slate-600 bg-slate-50 italic rounded">
                  Erläuterung: {report.overwhelmedExplanation}
                </td>
              </tr>
            )}
            <tr>
              <td className="py-1.5 font-medium text-slate-700">• Ich kann mir vorstellen, dieser Tätigkeit täglich nachzugehen.</td>
              <td className="py-1.5 text-right font-bold text-school-blue">{report.careerRating || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Besondere Erinnerung */}
      <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 avoid-break">
        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-school-cyan text-white text-[10px] flex items-center justify-center font-bold">4</span>
          Das bleibt mir von diesem Tag besonders in Erinnerung:
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
          {report.specialMemory || 'Keine Angabe'}
        </div>
      </div>

      {/* PDF Footer with Stamp */}
      <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500 flex justify-between items-center avoid-break">
        <span>Staatliche Regelschule Heimbürgeschule Kahla</span>
        <span>{timestampText}</span>
      </div>
    </div>
  );
};

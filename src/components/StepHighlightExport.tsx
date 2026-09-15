import React, { useState } from 'react';
import { PraxisReport } from '../types/report';
import { Sparkles, FileDown, RotateCcw, ArrowLeft, CheckCircle2, Loader2, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepHighlightExportProps {
  report: PraxisReport;
  onChange: (field: keyof PraxisReport, value: string) => void;
  onPrev: () => void;
  onExportPDF: () => Promise<void>;
  onOpenReset: () => void;
}

export const StepHighlightExport: React.FC<StepHighlightExportProps> = ({
  report,
  onChange,
  onPrev,
  onExportPDF,
  onOpenReset,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportPDF();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert('Fehler beim Erstellen des PDFs. Bitte versuche es erneut.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Freitext 3: Besondere Erinnerung */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <label className="block text-sm font-bold text-slate-800 flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-school-cyan text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
            4
          </span>
          <span className="flex-1">Das bleibt mir von diesem Tag besonders in Erinnerung:</span>
        </label>
        <textarea
          id="special_memory"
          rows={3}
          value={report.specialMemory}
          onChange={(e) => onChange('specialMemory', e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-3.5 text-base sm:text-sm focus:ring-2 focus:ring-school-cyan focus:border-school-cyan focus:outline-none transition leading-relaxed"
          placeholder="Ein besonderes Erlebnis, ein tolles Teamgespräch, eine gelungene Arbeit..."
        />
      </div>

      {/* Zusammenfassungs-Card */}
      <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-school-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-school-blue font-bold text-sm">
          <Sparkles className="w-4 h-4 text-school-orange" />
          <span>Berichtsübersicht für {report.studentName || 'den Schüler'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
          <div>
            <span className="font-semibold block text-slate-400">Betrieb:</span>
            <span className="font-medium text-slate-800">{report.companyName || '—'}</span>
          </div>
          <div>
            <span className="font-semibold block text-slate-400">Turnus:</span>
            <span className="font-medium text-slate-800">{report.stage}</span>
          </div>
          <div>
            <span className="font-semibold block text-slate-400">Datum:</span>
            <span className="font-mono tabular-nums font-medium text-slate-800">{report.reportDate || '—'}</span>
          </div>
          <div>
            <span className="font-semibold block text-slate-400">Arbeitszeit:</span>
            <span className="font-mono tabular-nums font-medium text-slate-800">{report.startTime} - {report.endTime} Uhr</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 no-print space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 bg-gradient-to-r from-school-blue via-school-cyan to-school-teal hover:from-school-darkblue hover:to-school-blue text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex justify-center items-center gap-2 text-sm sm:text-base disabled:opacity-60 active:scale-[0.98]"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>PDF wird generiert...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>PDF erfolgreich heruntergeladen!</span>
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5 text-school-orange" />
                <span>Tagesbericht als PDF exportieren</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenReset}
            className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-medium py-3.5 px-6 rounded-xl transition border border-slate-200 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Zurücksetzen</span>
          </button>
        </div>

        {/* Hinweis-Box zum Download */}
        <div className="p-4 bg-school-lightbg border border-school-border rounded-xl text-xs sm:text-sm text-school-darkblue space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-school-blue">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Hinweis zum Download:</span>
            <span className="font-normal text-slate-600">Das PDF wird direkt automatisch heruntergeladen.</span>
          </div>
          <ul className="ml-5 list-disc space-y-1 text-slate-700 text-xs">
            <li>
              <strong>Apple (iPad/iPhone):</strong> Du findest die Datei in der App <em>„Dateien“</em> (im Ordner „Downloads“).
            </li>
            <li>
              <strong>Android & PC:</strong> Die Datei landet im Standard-Ordner <em>„Downloads“</em> deines Geräts.
            </li>
          </ul>
        </div>

        {/* Zurück-Navigation */}
        <div className="flex justify-start pt-2">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium py-2.5 px-4 rounded-lg hover:bg-slate-100 transition active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück zur Selbsteinschätzung</span>
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 no-print">
        Alle Daten werden automatisch und sicher lokal im Browser auf diesem Gerät gespeichert.
      </p>
    </motion.div>
  );
};

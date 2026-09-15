import React, { useState } from 'react';
import { PraxisReport } from '../types/report';
import { BookOpen, Calendar, Building2, MessageSquare, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: PraxisReport[];
  onSelectReport: (report: PraxisReport) => void;
  onNewReport: () => void;
}

export const StudentReportsModal: React.FC<StudentReportsModalProps> = ({
  isOpen,
  onClose,
  reports,
  onSelectReport,
  onNewReport,
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<PraxisReport | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 relative overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-school-blue flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Meine bisherigen Praktikumsberichte
                </h3>
                <p className="text-xs text-slate-500">
                  Alle gespeicherten Tagebücher und Rückmeldungen deines Lehrers
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-5 overflow-y-auto flex-1 space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-10 text-slate-500 space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm">Du hast noch keine Berichte in der Cloud gespeichert.</p>
                <button
                  onClick={() => {
                    onNewReport();
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 bg-school-blue text-white font-bold py-2 px-4 rounded-xl text-xs shadow hover:bg-school-darkblue transition"
                >
                  <span>Ersten Bericht starten</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              reports.map((rep) => {
                const hasFeedback = rep.teacherFeedback?.comment || rep.aiFeedback?.pedagogicalFeedback;

                return (
                  <div
                    key={rep.id || rep.reportDate}
                    className="p-4 rounded-xl border border-slate-200 hover:border-school-blue/50 bg-slate-50/70 hover:bg-blue-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {rep.stage || 'Praktikumstag'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {rep.reportDate}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-school-cyan" />
                        <span>{rep.companyName || 'Kein Betrieb angegeben'}</span>
                      </div>

                      {hasFeedback && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Rückmeldung vom Lehrer verfügbar!</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasFeedback && (
                        <button
                          onClick={() => setSelectedFeedback(rep)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Feedback lesen</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onSelectReport(rep);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-school-blue text-slate-700 hover:text-school-blue text-xs font-bold transition"
                      >
                        Öffnen
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
            <button
              onClick={() => {
                onNewReport();
                onClose();
              }}
              className="text-school-blue font-bold text-xs hover:underline"
            >
              + Neuen leeren Bericht beginnen
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs transition"
            >
              Schließen
            </button>
          </div>
        </motion.div>
      </div>

      {/* Teacher/AI Feedback Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-school-blue" />
                <span>Rückmeldung zu deinem Praxistag</span>
              </h4>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedFeedback.teacherFeedback?.comment && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-sm space-y-2">
                <div className="text-xs font-bold text-school-blue uppercase tracking-wider">
                  Notiz von {selectedFeedback.teacherFeedback.reviewedBy || 'deinem Lehrer'}:
                </div>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.teacherFeedback.comment}
                </p>
              </div>
            )}

            {selectedFeedback.aiFeedback?.pedagogicalFeedback && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-sm space-y-2">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Pädagogische Auswertung & Tipps:
                </div>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.aiFeedback.pedagogicalFeedback}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-5 py-2 rounded-xl bg-school-blue text-white font-bold text-sm shadow hover:bg-school-darkblue transition"
              >
                Verstanden
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

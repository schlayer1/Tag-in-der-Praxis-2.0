import React, { useState } from 'react';
import { PraxisReport } from '../types/report';
import { MessageSquare, Sparkles, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentFeedbackBannerProps {
  reports: PraxisReport[];
}

export const StudentFeedbackBanner: React.FC<StudentFeedbackBannerProps> = ({ reports }) => {
  // Find latest report that has teacher feedback
  const reportWithFeedback = reports.find(
    (r) => r.teacherFeedback?.comment || r.aiFeedback?.pedagogicalFeedback
  );

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (!reportWithFeedback || isDismissed) return null;

  const teacher = reportWithFeedback.teacherFeedback?.reviewedBy || 'deiner Lehrkraft';
  const comment = reportWithFeedback.teacherFeedback?.comment;
  const aiTips = reportWithFeedback.aiFeedback?.pedagogicalFeedback;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-3xl mx-auto mb-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow">
              <MessageSquare className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  Neue Lehrer-Rückmeldung
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  für {reportWithFeedback.reportDate} ({reportWithFeedback.stage})
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {teacher} hat deinen Bericht bewertet!
              </h3>

              {isExpanded ? (
                <div className="mt-3 space-y-3">
                  {comment && (
                    <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-xl border border-emerald-200 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-sm">
                      <span className="font-bold text-emerald-800 block text-xs mb-1">
                        Persönliche Notiz:
                      </span>
                      <p className="whitespace-pre-wrap">{comment}</p>
                    </div>
                  )}

                  {aiTips && (
                    <div className="bg-white/80 p-3 rounded-xl border border-teal-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-teal-800 flex items-center gap-1 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-school-orange" />
                        Pädagogischer Praxistipp:
                      </span>
                      <p className="whitespace-pre-wrap">{aiTips}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                  {comment || aiTips}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-sm transition flex items-center gap-0.5"
            >
              <span>{isExpanded ? 'Einklappen' : 'Lesen'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title="Ausblenden"
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-white/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

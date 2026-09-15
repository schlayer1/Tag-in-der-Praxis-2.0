import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateStudentCode } from '../services/reportService';
import { User, KeyRound, GraduationCap, X, Loader2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'student' | 'teacher';
  onStudentLoggedIn?: (code: string, name?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'student',
  onStudentLoggedIn,
}) => {
  const { loginAsStudent, registerAndLoginStudent, loginAsTeacher } = useAuth();
  const [tab, setTab] = useState<'student' | 'teacher'>(defaultTab);

  // Student Mode: 'login' (mit Kürzel) vs. 'create' (aus Name generieren)
  const [studentMode, setStudentMode] = useState<'create' | 'login'>('create');
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');

  // Teacher Form (Passwort TIP2026)
  const [teacherPassword, setTeacherPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Live generiertes Kürzel bei Eingabe des Namens
  const previewCode = generateStudentCode(fullName);

  const handleStudentCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const code = await registerAndLoginStudent(fullName);
      if (onStudentLoggedIn) {
        onStudentLoggedIn(code, fullName);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kürzel-Erstellung fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginAsStudent(studentCode);
      if (onStudentLoggedIn) {
        onStudentLoggedIn(studentCode.toUpperCase().trim());
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginAsTeacher(teacherPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tab Switcher: Schüler vs. Lehrer */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 mt-1">
            <button
              type="button"
              onClick={() => {
                setTab('student');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                tab === 'student'
                  ? 'bg-white text-school-blue shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Schüler-Bereich</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('teacher');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                tab === 'teacher'
                  ? 'bg-white text-school-blue shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Lehrer-Zugang</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {tab === 'student' ? (
            <div className="space-y-4">
              {/* Sub-Switch: Neu (Kürzel generieren) vs. Bereits Kürzel vorhanden */}
              <div className="flex border-b border-slate-200 pb-2 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('create');
                    setError(null);
                  }}
                  className={`pb-1 transition flex items-center gap-1.5 ${
                    studentMode === 'create'
                      ? 'text-school-blue border-b-2 border-school-blue font-bold'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-school-orange" />
                  <span>Kürzel erstellen (Neu)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('login');
                    setError(null);
                  }}
                  className={`pb-1 transition flex items-center gap-1.5 ${
                    studentMode === 'login'
                      ? 'text-school-blue border-b-2 border-school-blue font-bold'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Ich habe ein Kürzel</span>
                </button>
              </div>

              {studentMode === 'create' ? (
                /* Variante A: Kürzel automatisch aus Name generieren */
                <form onSubmit={handleStudentCreate} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Dein vollständiger Vor- und Nachname
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="z. B. Max Mustermann"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-school-blue focus:outline-none"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {previewCode && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-600 block">
                        Dein automatisch erstelltes Login-Kürzel:
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black font-mono tracking-wider text-school-darkblue">
                          {previewCode}
                        </span>
                        <span className="text-[10px] bg-blue-100 text-school-blue font-bold px-2 py-0.5 rounded-full">
                          Aufschreiben & merken!
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Mit diesem Kürzel kannst du deinen Praktikumsbericht jederzeit wieder aufrufen und das Feedback deiner Lehrkraft einsehen.
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading || !previewCode}
                    className="w-full bg-school-blue hover:bg-school-darkblue text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Kürzel übernehmen & Starten</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Variante B: Mit bestehendem Kürzel anmelden */
                <form onSubmit={handleStudentLogin} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Dein Schüler-Kürzel
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                        placeholder="z. B. MMUS oder LMUE"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono uppercase tracking-wider focus:ring-2 focus:ring-school-blue focus:outline-none"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Gib dein 4-stelliges Kürzel ein, um deinen aktuellen Bericht und Lehrer-Rückmeldungen zu laden.
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading || !studentCode.trim()}
                    className="w-full bg-school-blue hover:bg-school-darkblue text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Bericht laden</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Lehrer-Login mit Masterpasswort TIP2026 */
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lehrer-Passwort
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="Passwort eingeben (TIP2026)"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-school-blue focus:outline-none"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <span className="font-bold block mb-0.5">Lehrkraft-Bereich:</span>
                Zugang zur Gesamtauswertung aller Klassen, Turnusse und KI-gestützten Rückmeldungen.
              </div>

              <button
                type="submit"
                disabled={isLoading || !teacherPassword.trim()}
                className="w-full bg-school-darkblue hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 text-school-cyan" />
                    <span>Dashboard öffnen</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

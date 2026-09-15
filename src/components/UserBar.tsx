import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, GraduationCap, BookOpen, LogIn, MessageSquare, WifiOff } from 'lucide-react';

interface UserBarProps {
  onOpenLogin: (tab?: 'student' | 'teacher') => void;
  onOpenDashboard: () => void;
  onOpenHistory: () => void;
  reportCount?: number;
  hasFeedback?: boolean;
}

export const UserBar: React.FC<UserBarProps> = ({
  onOpenLogin,
  onOpenDashboard,
  onOpenHistory,
  reportCount = 0,
  hasFeedback = false,
}) => {
  const { role, studentCode, studentName, logout } = useAuth();
  const isLoggedIn = !!role;
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto mb-3 px-2 flex items-center justify-between text-xs sm:text-sm no-print">
      <div className="flex items-center gap-2 flex-wrap">
        {!isOnline && (
          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 text-[11px]" title="Offline: Berichte werden lokal gesichert und bei Verbindung synchronisiert">
            <WifiOff className="w-3 h-3 text-amber-700" />
            <span>Offline-Modus</span>
          </span>
        )}

        {isLoggedIn ? (
          <>
            {role === 'teacher' ? (
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-900 font-bold px-3 py-1 rounded-full border border-indigo-500/20 shadow-xs">
                <GraduationCap className="w-4 h-4 text-indigo-700" />
                <span>Lehrkraft (TIP Kahla)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-school-darkblue font-bold px-3 py-1 rounded-full border border-blue-500/20 shadow-xs">
                <User className="w-4 h-4 text-school-blue" />
                <span>Kürzel: <span className="font-mono tabular-nums font-black">{studentCode}</span> {studentName ? `(${studentName})` : ''}</span>
              </span>
            )}

            {role === 'student' && (
              <button
                onClick={onOpenHistory}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-xs transition-all duration-150 active:scale-[0.98] font-semibold ${
                  hasFeedback
                    ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30 ring-2 ring-emerald-400/40 animate-pulse'
                    : 'bg-white text-slate-700 hover:text-school-blue border-slate-300 hover:border-school-blue'
                }`}
              >
                {hasFeedback ? (
                  <>
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold">Lehrer-Rückmeldung da!</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-school-cyan" />
                    <span>Meine Berichte <span className="font-mono tabular-nums">({reportCount})</span></span>
                  </>
                )}
              </button>
            )}

            {role === 'teacher' && (
              <button
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-1.5 bg-school-blue hover:bg-school-darkblue text-white font-bold px-3.5 py-1 rounded-full shadow-sm transition-all duration-150 active:scale-[0.98]"
              >
                <span>Zum Dashboard</span>
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLogin('student')}
              className="inline-flex items-center gap-1.5 bg-white text-slate-700 hover:text-school-blue font-semibold px-3 py-1 rounded-full border border-slate-300 shadow-xs hover:border-school-blue transition-all duration-150 active:scale-[0.98]"
            >
              <LogIn className="w-3.5 h-3.5 text-school-blue" />
              <span>Schüler-Login / Kürzel</span>
            </button>

            <button
              onClick={() => onOpenLogin('teacher')}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium px-2 py-1 transition-all duration-150 active:scale-[0.98]"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Lehrer-Zugang</span>
            </button>
          </div>
        )}
      </div>

      {isLoggedIn && (
        <button
          onClick={logout}
          title="Abmelden"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-red-600 font-medium px-2 py-1 transition-all duration-150 active:scale-[0.98]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Abmelden</span>
        </button>
      )}
    </div>
  );
};

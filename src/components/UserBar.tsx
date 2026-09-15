import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, GraduationCap, BookOpen, LogIn, MessageSquare } from 'lucide-react';

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

  return (
    <div className="max-w-3xl mx-auto mb-3 px-2 flex items-center justify-between text-xs sm:text-sm no-print">
      {isLoggedIn ? (
        <div className="flex items-center gap-2 flex-wrap">
          {role === 'teacher' ? (
            <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-900 font-bold px-3 py-1 rounded-full border border-indigo-200 shadow-sm">
              <GraduationCap className="w-4 h-4 text-indigo-700" />
              <span>Lehrkraft (TIP Kahla)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-school-darkblue font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm">
              <User className="w-4 h-4 text-school-blue" />
              <span>Kürzel: {studentCode} {studentName ? `(${studentName})` : ''}</span>
            </span>
          )}

          {role === 'student' && (
            <button
              onClick={onOpenHistory}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm transition font-semibold ${
                hasFeedback
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/50 animate-pulse'
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
                  <span>Meine Berichte ({reportCount})</span>
                </>
              )}
            </button>
          )}

          {role === 'teacher' && (
            <button
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-1.5 bg-school-blue text-white font-bold px-3 py-1 rounded-full shadow-sm hover:bg-school-darkblue transition"
            >
              <span>Zum Dashboard</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenLogin('student')}
            className="inline-flex items-center gap-1.5 bg-white text-slate-700 hover:text-school-blue font-semibold px-3 py-1 rounded-full border border-slate-300 shadow-sm hover:border-school-blue transition"
          >
            <LogIn className="w-3.5 h-3.5 text-school-blue" />
            <span>Schüler-Login / Kürzel</span>
          </button>

          <button
            onClick={() => onOpenLogin('teacher')}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium px-2 py-1 transition"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Lehrkraft-Zugang</span>
          </button>
        </div>
      )}

      {isLoggedIn && (
        <button
          onClick={logout}
          title="Abmelden"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 font-medium px-2 py-1 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Abmelden</span>
        </button>
      )}
    </div>
  );
};

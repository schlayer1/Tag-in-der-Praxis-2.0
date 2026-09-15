import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  lastSaved?: Date | null;
}

export const Header: React.FC<HeaderProps> = ({ lastSaved }) => {
  return (
    <header className="bg-gradient-to-r from-school-darkblue via-school-blue to-school-cyan p-5 sm:p-7 text-white relative rounded-t-2xl shadow-md overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="flex flex-row items-center gap-4 sm:gap-6 relative z-10">
        {/* School Emblem */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white p-1 rounded-full shadow-xl flex-shrink-0 flex items-center justify-center ring-4 ring-white/30 transition-transform duration-300 hover:scale-105">
          <img
            src="/Siegel_bunt.png"
            alt="Siegel Heimbürgeschule Kahla"
            className="w-full h-full object-contain rounded-full"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 bg-school-orange text-white text-[11px] sm:text-xs uppercase font-bold tracking-wider px-3 py-0.5 rounded-full shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
              Berufsorientierung & Praxis
            </span>

            {lastSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] text-blue-100 bg-white/15 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span className="hidden xs:inline">Gespeichert</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
            Reflexion meines Praktikumstages
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 font-medium mt-0.5">
            Staatliche Regelschule »Heimbürgeschule« Kahla
          </p>
        </div>
      </div>

      {/* Decorative Bottom Marigold Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-school-orange" />
    </header>
  );
};

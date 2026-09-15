import React, { useState, useEffect, useRef } from 'react';
import { PraxisReport, AiFeedback, StudentPortfolioReport } from '../types/report';
import {
  fetchAllReportsForTeacher,
  saveTeacherFeedback,
  saveAiFeedback,
  exportReportsToJsonFile,
  importReportsFromJson,
  clearReportsBySchoolYear,
  calculateSchoolYear,
  normalizeSchoolYear,
  updateStudentClass,
  AVAILABLE_CLASSES,
  SCHOOL_YEARS
} from '../services/reportService';
import {
  generateFeedbackWithGemini,
  generatePortfolioWithGemini,
  getGeminiApiKey,
  saveGeminiApiKey
} from '../services/geminiService';
import { exportReportToPDF, exportPortfolioToPDF } from '../utils/pdfExport';
import { PrintablePortfolioReport } from './PrintablePortfolioReport';
import {
  GraduationCap,
  Search,
  FileDown,
  Sparkles,
  Eye,
  Check,
  Copy,
  Save,
  Key,
  X,
  Loader2,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  ChevronDown,
  ChevronRight,
  School,
  Layers,
  ListFilter,
  Download,
  Upload,
  Trash2,
  Archive,
  Award,
  CheckSquare,
  Square
} from 'lucide-react';

interface TeacherDashboardProps {
  onClose: () => void;
}

type GroupMode = 'class' | 'stage' | 'flat';

const AVAILABLE_STAGES = ['Turnus 1', 'Turnus 2', 'Turnus 3', 'Turnus 4'];

const PORTFOLIO_TIMESTAMPS_KEY = 'kahla_portfolio_timestamps';

const getStoredPortfolioTimestamps = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_TIMESTAMPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to parse portfolio timestamps', e);
    return {};
  }
};

const getStudentKey = (name?: string, code?: string): string => {
  return (code || name || '').trim().toLowerCase();
};

function getSchoolYearBadgeStyle(schoolYear?: string): string {
  const norm = normalizeSchoolYear(schoolYear);
  switch (norm) {
    case 'SJ 26/27':
      return 'bg-blue-100 text-blue-900 border-blue-300 ring-1 ring-blue-200';
    case 'SJ 27/28':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-200';
    case 'SJ 28/29':
      return 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-200';
    case 'SJ 29/30':
      return 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-200';
    case 'SJ 30/31':
      return 'bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-200';
    case 'SJ 31/32':
      return 'bg-teal-100 text-teal-900 border-teal-300 ring-1 ring-teal-200';
    case 'SJ 32/33':
      return 'bg-indigo-100 text-indigo-900 border-indigo-300 ring-1 ring-indigo-200';
    case 'SJ 33/34':
      return 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 ring-1 ring-fuchsia-200';
    case 'SJ 34/35':
      return 'bg-cyan-100 text-cyan-900 border-cyan-300 ring-1 ring-cyan-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onClose }) => {
  const [reports, setReports] = useState<PraxisReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('Alle');
  const [stageFilter, setStageFilter] = useState<string>('Alle');
  const [yearFilter, setYearFilter] = useState<string>(calculateSchoolYear());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [groupMode, setGroupMode] = useState<GroupMode>('class');

  // Collapsed state for accordion groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Inspection
  const [activeReport, setActiveReport] = useState<PraxisReport | null>(null);

  // Copied student login code indicator
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // AI Feedback State
  const [aiReport, setAiReport] = useState<PraxisReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AiFeedback | null>(null);
  const [editableFeedback, setEditableFeedback] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Portfolio Modal State
  const [portfolioModalOpen, setPortfolioModalOpen] = useState<boolean>(false);
  const [portfolioStudent, setPortfolioStudent] = useState<{
    studentCode: string;
    studentName: string;
    studentClass: string;
    reports: PraxisReport[];
  } | null>(null);
  const [selectedTurnusIds, setSelectedTurnusIds] = useState<string[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState<boolean>(false);
  const [portfolioResult, setPortfolioResult] = useState<StudentPortfolioReport | null>(null);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [isExportingPortfolioPdf, setIsExportingPortfolioPdf] = useState<boolean>(false);
  const [portfolioTimestamps, setPortfolioTimestamps] = useState<Record<string, string>>(getStoredPortfolioTimestamps);

  const savePortfolioTimestamp = (studentKey: string, dateStr: string) => {
    setPortfolioTimestamps((prev) => {
      const updated = { ...prev, [studentKey]: dateStr };
      try {
        localStorage.setItem(PORTFOLIO_TIMESTAMPS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving portfolio timestamp', e);
      }
      return updated;
    });
  };

  // Gemini API Key Modal
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>(getGeminiApiKey());

  // Archive / Backup Modal
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllReportsForTeacher();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };


  // Filtered reports
  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      (rep.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.studentCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.studentClass || '').toLowerCase().includes(searchTerm.toLowerCase());

    const repYear = normalizeSchoolYear(rep.schoolYear || calculateSchoolYear(rep.reportDate));
    const matchesYear = yearFilter === 'Alle' || repYear === yearFilter;
    const matchesClass = classFilter === 'Alle' || rep.studentClass === classFilter;
    const matchesStage = stageFilter === 'Alle' || rep.stage === stageFilter;

    const hasFeedback = !!rep.teacherFeedback?.comment;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'reviewed' && hasFeedback) ||
      (statusFilter === 'pending' && !hasFeedback);

    return matchesSearch && matchesYear && matchesClass && matchesStage && matchesStatus;
  });

  // Grouped records
  const groupedByClass: Record<string, PraxisReport[]> = {};
  const groupedByStage: Record<string, PraxisReport[]> = {};

  filteredReports.forEach((rep) => {
    const cls = rep.studentClass || 'Keine Klasse';
    const stg = rep.stage || 'Kein Turnus';

    if (!groupedByClass[cls]) groupedByClass[cls] = [];
    groupedByClass[cls].push(rep);

    if (!groupedByStage[stg]) groupedByStage[stg] = [];
    groupedByStage[stg].push(rep);
  });

  // Handle AI feedback generation
  const handleGenerateAi = async (rep: PraxisReport) => {
    setAiReport(rep);
    setAiResult(null);
    setEditableFeedback('');
    setAiError(null);
    setSavedSuccess(false);
    setCopied(false);

    const key = getGeminiApiKey();
    if (!key) {
      setIsKeyModalOpen(true);
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await generateFeedbackWithGemini(rep);
      setAiResult(result);
      setEditableFeedback(result.pedagogicalFeedback || '');
    } catch (err: any) {
      setAiError(err.message || 'Fehler bei der KI-Auswertung.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopy = () => {
    if (!editableFeedback) return;
    navigator.clipboard.writeText(editableFeedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveFeedback = async () => {
    if (!aiReport?.id) return;
    setIsAiLoading(true);
    try {
      await saveTeacherFeedback(aiReport.id, editableFeedback);
      if (aiResult) {
        await saveAiFeedback(aiReport.id, aiResult);
      }
      setSavedSuccess(true);
      await loadReports();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern des Feedbacks.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveKey = () => {
    saveGeminiApiKey(inputKey);
    setIsKeyModalOpen(false);
    if (aiReport) {
      handleGenerateAi(aiReport);
    }
  };

  // Klasse eines Schülers direkt durch die Lehrkraft ändern (z. B. bei Wiederholung oder Wechsel 9a -> 9b)
  const handleClassChange = async (rep: PraxisReport, newClass: string) => {
    if (!newClass || newClass === rep.studentClass) return;

    // 1. Sofortige reaktive Aktualisierung im Dashboard-State (verschiebt Schüler auch sofort in die richtige Gruppe)
    setReports((prev) =>
      prev.map((r) => {
        const isSameStudentAndYear =
          r.studentCode &&
          rep.studentCode &&
          r.studentCode.toUpperCase() === rep.studentCode.toUpperCase() &&
          normalizeSchoolYear(r.schoolYear) === normalizeSchoolYear(rep.schoolYear);
        if (r.id === rep.id || isSameStudentAndYear) {
          return { ...r, studentClass: newClass };
        }
        return r;
      })
    );

    // Auch im Inspektionsmodal anpassen falls geöffnet
    if (activeReport && (activeReport.id === rep.id || (activeReport.studentCode && activeReport.studentCode === rep.studentCode))) {
      setActiveReport((prev) => (prev ? { ...prev, studentClass: newClass } : null));
    }

    // 2. In Firestore speichern
    if (rep.id) {
      try {
        await updateStudentClass(rep.id, newClass, rep.studentCode, rep.schoolYear);
      } catch (err) {
        console.error('Fehler beim Aktualisieren der Klasse:', err);
      }
    }
  };

  // Portfolio Modal Handlers
  const handleOpenPortfolio = (studentName: string, studentCode?: string, fallbackClass?: string) => {
    const cleanCode = (studentCode || '').toUpperCase().trim();
    const cleanName = (studentName || '').toLowerCase().trim();

    // Alle Berichte dieses Schülers heraussuchen
    const studentReports = reports.filter((r) => {
      if (cleanCode && (r.studentCode || '').toUpperCase().trim() === cleanCode) return true;
      if (cleanName && (r.studentName || '').toLowerCase().trim() === cleanName) return true;
      return false;
    }).sort((a, b) => (a.stage || '').localeCompare(b.stage || '') || (a.reportDate || '').localeCompare(b.reportDate || ''));

    const effectiveClass = studentReports[studentReports.length - 1]?.studentClass || fallbackClass || '8a';

    setPortfolioStudent({
      studentCode: cleanCode,
      studentName: studentName || 'Schüler/in',
      studentClass: effectiveClass,
      reports: studentReports,
    });

    // Standardmäßig alle verfügbaren Berichte auswählen
    const allIds = studentReports.map((r) => r.id).filter(Boolean) as string[];
    setSelectedTurnusIds(allIds);
    setPortfolioResult(null);
    setPortfolioError(null);
    setPortfolioModalOpen(true);
  };

  const handleToggleTurnusSelection = (id: string) => {
    setSelectedTurnusIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllTurnus = () => {
    if (!portfolioStudent) return;
    const allIds = portfolioStudent.reports.map((r) => r.id).filter(Boolean) as string[];
    setSelectedTurnusIds(allIds);
  };

  const handleGeneratePortfolio = async () => {
    if (!portfolioStudent) return;
    const selectedReports = portfolioStudent.reports.filter((r) => r.id && selectedTurnusIds.includes(r.id));
    if (selectedReports.length === 0) {
      setPortfolioError('Bitte markiere mindestens einen Turnus für das Portfolio.');
      return;
    }

    const key = getGeminiApiKey();
    if (!key) {
      setIsKeyModalOpen(true);
      return;
    }

    setIsPortfolioLoading(true);
    setPortfolioError(null);
    try {
      const result = await generatePortfolioWithGemini(
        portfolioStudent.studentName,
        portfolioStudent.studentClass,
        selectedReports
      );
      setPortfolioResult(result);
      const studentKey = getStudentKey(portfolioStudent.studentName, portfolioStudent.studentCode);
      if (studentKey) {
        const todayFormatted = new Date().toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        savePortfolioTimestamp(studentKey, todayFormatted);
      }
    } catch (err: any) {
      setPortfolioError(err.message || 'Fehler beim Generieren des Portfolios.');
    } finally {
      setIsPortfolioLoading(false);
    }
  };

  const handleDownloadPortfolioPdf = async () => {
    if (!portfolioResult) return;
    setIsExportingPortfolioPdf(true);
    try {
      await exportPortfolioToPDF(portfolioResult);
    } catch (err) {
      console.error(err);
      alert('Fehler beim PDF-Export des Portfolios.');
    } finally {
      setIsExportingPortfolioPdf(false);
    }
  };

  // Backup & Restore Actions
  const handleDownloadBackup = () => {
    exportReportsToJsonFile(filteredReports, yearFilter === 'Alle' ? undefined : yearFilter);
    setArchiveSuccessMsg(`JSON-Backup für ${filteredReports.length} Berichte erfolgreich heruntergeladen!`);
    setTimeout(() => setArchiveSuccessMsg(null), 4000);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsArchiving(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const count = await importReportsFromJson(parsed);
      setArchiveSuccessMsg(`${count} Berichte erfolgreich aus Backup importiert!`);
      await loadReports();
      setTimeout(() => setArchiveSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Import-Fehler: ${err.message}`);
    } finally {
      setIsArchiving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearCurrentView = async () => {
    if (filteredReports.length === 0) return;
    const confirmPrompt = window.confirm(
      `ACHTUNG: Möchtest du wirklich alle ${filteredReports.length} aktuell gefilterten Berichte aus der Datenbank löschen?\n\nStelle sicher, dass du vorher ein JSON-Backup heruntergeladen hast!`
    );
    if (!confirmPrompt) return;

    setIsArchiving(true);
    try {
      const count = await clearReportsBySchoolYear(filteredReports);
      setArchiveSuccessMsg(`${count} Berichte wurden aus der Datenbank bereinigt.`);
      await loadReports();
      setTimeout(() => setArchiveSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Fehler beim Bereinigen: ${err.message}`);
    } finally {
      setIsArchiving(false);
    }
  };

  const pendingCount = reports.filter((r) => !r.teacherFeedback?.comment).length;
  const reviewedCount = reports.filter((r) => !!r.teacherFeedback?.comment).length;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-100 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="bg-school-darkblue text-white p-4 sm:px-8 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-school-cyan" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
              Lehrer-Dashboard | Praktikumsberichte
            </h1>
            <p className="text-xs text-blue-200">
              Staatliche Regelschule »Heimbürgeschule« Kahla
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsArchiveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-school-cyan/20 hover:bg-school-cyan/30 text-white text-xs font-semibold border border-school-cyan/40 transition"
          >
            <Archive className="w-3.5 h-3.5 text-school-cyan" />
            <span className="hidden sm:inline">Schuljahr-Backup / Archiv</span>
          </button>

          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
          >
            <Key className="w-3.5 h-3.5 text-school-orange" />
            <span className="hidden sm:inline">Gemini API-Key</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition ml-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-5">
        {/* KPI / Stats Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Gesamt eingereicht</span>
              <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900">{reports.length}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-school-blue flex items-center justify-center font-bold text-xs">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-xs flex items-center justify-between ${
              statusFilter === 'pending'
                ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-400/40'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div>
              <span className="text-xs text-amber-700 font-medium block">Offen für Feedback</span>
              <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-900">{pendingCount}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold text-xs">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'reviewed' ? 'all' : 'reviewed')}
            className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-xs flex items-center justify-between ${
              statusFilter === 'reviewed'
                ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-400/40'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div>
              <span className="text-xs text-emerald-700 font-medium block">Feedback erteilt</span>
              <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-900">{reviewedCount}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter & Group Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Schüler, Klasse, Betrieb..."
                className="w-full pl-9 pr-3 py-2.5 min-h-[44px] border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-school-blue focus:outline-none transition"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Filter Schuljahr */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 min-h-[44px] rounded-lg border border-slate-200 shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-school-blue" />
                <span className="text-xs font-semibold text-slate-500">Schuljahr:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="bg-transparent text-base sm:text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {SCHOOL_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y} {y === calculateSchoolYear() ? '(Aktuell)' : ''}
                    </option>
                  ))}
                  <option value="Alle">Alle Schuljahre</option>
                </select>
              </div>

              {/* Filter Klasse */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 min-h-[44px] rounded-lg border border-slate-200">
                <School className="w-3.5 h-3.5 text-school-blue" />
                <span className="text-xs font-semibold text-slate-500">Klasse:</span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-transparent text-base sm:text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="Alle">Alle Klassen</option>
                  {AVAILABLE_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      Klasse {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Turnus */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 min-h-[44px] rounded-lg border border-slate-200">
                <Layers className="w-3.5 h-3.5 text-school-blue" />
                <span className="text-xs font-semibold text-slate-500">Turnus:</span>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="bg-transparent text-base sm:text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="Alle">Alle Turnusse</option>
                  {AVAILABLE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Group Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setGroupMode('class')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition ${
                    groupMode === 'class' ? 'bg-white text-school-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Nach Klasse gruppieren"
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Klasse</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGroupMode('stage')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition ${
                    groupMode === 'stage' ? 'bg-white text-school-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Nach Turnus gruppieren"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Turnus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGroupMode('flat')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition ${
                    groupMode === 'flat' ? 'bg-white text-school-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gesamtliste"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Liste</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Rendering */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-school-blue mx-auto" />
            <p className="text-sm text-slate-500">Berichte werden synchronisiert...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">
              {yearFilter !== 'Alle'
                ? `Keine Schülerberichte im ${yearFilter} gefunden`
                : 'Keine passenden Berichte gefunden'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {yearFilter !== 'Alle'
                ? `Sobald Schüler im Schuljahr ${yearFilter} Berichte einreichen, werden sie automatisch hier aufgeführt.`
                : 'Passe deine Such- oder Filterkriterien an, um Berichte anzuzeigen.'}
            </p>
          </div>
        ) : groupMode === 'class' ? (
          /* Grouped by Class */
          <div className="space-y-4">
            {Object.keys(groupedByClass).sort().map((clsName) => {
              const items = groupedByClass[clsName];
              const isCollapsed = collapsedGroups[`class_${clsName}`];

              return (
                <div key={clsName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleGroup(`class_${clsName}`)}
                    className="w-full px-5 py-3.5 bg-slate-50 hover:bg-blue-50/40 border-b border-slate-200 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-school-blue" />
                      )}
                      <School className="w-4 h-4 text-school-blue" />
                      <span className="font-bold text-sm text-slate-800">
                        Klasse {clsName}
                      </span>
                    </div>

                    <span className="text-xs font-bold bg-school-blue/10 text-school-blue px-2.5 py-0.5 rounded-full">
                      {items.length} {items.length === 1 ? 'Bericht' : 'Berichte'}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((rep) => renderReportCard(rep))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : groupMode === 'stage' ? (
          /* Grouped by Stage */
          <div className="space-y-4">
            {Object.keys(groupedByStage).sort().map((stageName) => {
              const items = groupedByStage[stageName];
              const isCollapsed = collapsedGroups[`stage_${stageName}`];

              return (
                <div key={stageName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleGroup(`stage_${stageName}`)}
                    className="w-full px-5 py-3.5 bg-slate-50 hover:bg-blue-50/40 border-b border-slate-200 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-school-blue" />
                      )}
                      <Layers className="w-4 h-4 text-school-blue" />
                      <span className="font-bold text-sm text-slate-800">
                        {stageName}
                      </span>
                    </div>

                    <span className="text-xs font-bold bg-school-blue/10 text-school-blue px-2.5 py-0.5 rounded-full">
                      {items.length} {items.length === 1 ? 'Bericht' : 'Berichte'}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((rep) => renderReportCard(rep))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((rep) => renderReportCard(rep))}
          </div>
        )}
      </main>

      {/* Report Inspection Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>{activeReport.studentName}</span>
                  <div className="flex items-center gap-1 bg-blue-50/80 border border-blue-200 px-2 py-0.5 rounded-lg">
                    <School className="w-3.5 h-3.5 text-school-blue" />
                    <label htmlFor="modal-class-select" className="text-xs text-slate-600 font-semibold">Klasse:</label>
                    <select
                      id="modal-class-select"
                      value={activeReport.studentClass || '8a'}
                      onChange={(e) => handleClassChange(activeReport, e.target.value)}
                      className="bg-transparent text-xs text-school-darkblue font-bold focus:outline-none cursor-pointer"
                      title="Klasse des Schülers ändern (z. B. bei Wiederholung oder Klassenwechsel)"
                    >
                      {AVAILABLE_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </h3>
                <p className="text-xs text-slate-500">
                  {activeReport.stage} • {activeReport.reportDate} • {activeReport.companyName}
                </p>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Schüler Login-Kürzel Box für die Lehrkraft */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Key className="w-4 h-4 text-school-blue" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-700 font-bold">Login-Kürzel des Schülers:</span>
                      <span className="font-mono font-black text-sm text-school-darkblue bg-white px-2.5 py-0.5 rounded border border-blue-300 shadow-xs">
                        {activeReport.studentCode || '—'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Falls der Schüler sein Kürzel vergessen hat, kannst du es ihm hier mitgeben.
                    </span>
                  </div>
                </div>
                {activeReport.studentCode && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeReport.studentCode || '');
                      setCopiedCode(activeReport.studentCode || null);
                      setTimeout(() => setCopiedCode(null), 2500);
                    }}
                    className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-100 text-school-darkblue rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 flex-shrink-0 transition"
                  >
                    {copiedCode === activeReport.studentCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopieren</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  1. Tätigkeitsbeschreibung:
                </span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-800 whitespace-pre-wrap">
                  {activeReport.taskDescription || 'Keine Angabe'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  2. Tagesablauf (Stunden):
                </span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-800 whitespace-pre-wrap font-mono sm:font-sans">
                  {activeReport.dailySchedule || 'Keine Angabe'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  3. Selbsteinschätzung:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border">
                    <span className="text-slate-500 block text-[11px]">Spaß gemacht:</span>
                    <span className="font-bold text-school-blue">{activeReport.funRating || '—'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border">
                    <span className="text-slate-500 block text-[11px]">Gelangweilt:</span>
                    <span className="font-bold text-school-blue">{activeReport.boredRating || '—'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border">
                    <span className="text-slate-500 block text-[11px]">Neues gelernt:</span>
                    <span className="font-bold text-school-blue">{activeReport.learnedRating || '—'}</span>
                    {activeReport.learnedExplanation && (
                      <p className="text-slate-600 mt-1 italic text-[11px]">{activeReport.learnedExplanation}</p>
                    )}
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border">
                    <span className="text-slate-500 block text-[11px]">Überfordert:</span>
                    <span className="font-bold text-school-blue">{activeReport.overwhelmedRating || '—'}</span>
                    {activeReport.overwhelmedExplanation && (
                      <p className="text-slate-600 mt-1 italic text-[11px]">{activeReport.overwhelmedExplanation}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  4. Besondere Erinnerung:
                </span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-800 whitespace-pre-wrap">
                  {activeReport.specialMemory || 'Keine Angabe'}
                </p>
              </div>

              {activeReport.teacherFeedback?.comment && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-emerald-800 block">
                    Bisheriges Feedback von {activeReport.teacherFeedback.reviewedBy || 'Lehrkraft'}:
                  </span>
                  <p className="text-xs text-emerald-950 whitespace-pre-wrap">
                    {activeReport.teacherFeedback.comment}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportReportToPDF(activeReport)}
                  className="inline-flex items-center gap-1.5 bg-school-blue text-white text-xs font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-school-darkblue transition"
                >
                  <FileDown className="w-4 h-4" />
                  <span>PDF herunterladen</span>
                </button>

                {(() => {
                  const sKey = getStudentKey(activeReport.studentName, activeReport.studentCode);
                  const lastGen = portfolioTimestamps[sKey];
                  return (
                    <button
                      onClick={() => {
                        handleOpenPortfolio(activeReport.studentName, activeReport.studentCode, activeReport.studentClass);
                      }}
                      title={lastGen ? `Portfolio (Zuletzt generiert: ${lastGen})` : 'Portfolio erstellen'}
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-3 sm:px-4 rounded-lg shadow transition"
                    >
                      <Award className="w-4 h-4 shrink-0" />
                      <div className="text-left leading-tight">
                        <div>Portfolio erstellen</div>
                        {lastGen && (
                          <div className="text-[10px] text-purple-200 font-normal">
                            Zuletzt: {lastGen}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })()}
              </div>

              <button
                onClick={() => setActiveReport(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-300 transition"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Feedback Modal */}
      {aiReport && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-school-orange flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Gemini KI-Feedback-Assistent
                  </h3>
                  <p className="text-xs text-slate-500">
                    Für {aiReport.studentName} (Klasse {aiReport.studentClass || '—'} • {aiReport.companyName})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAiReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isAiLoading ? (
                <div className="py-14 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-school-blue mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    Gemini analysiert Tätigkeiten und Selbsteinschätzung...
                  </p>
                  <p className="text-xs text-slate-400">
                    Modell wird dynamisch erkannt & pädagogisches Feedback generiert
                  </p>
                </div>
              ) : aiError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Auswertung fehlgeschlagen</span>
                  </div>
                  <p>{aiError}</p>
                  <button
                    onClick={() => setIsKeyModalOpen(true)}
                    className="text-school-blue underline font-bold mt-1 block"
                  >
                    Gemini API-Key überprüfen
                  </button>
                </div>
              ) : (
                <>
                  {aiResult?.summary && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-school-darkblue">
                      <span className="font-bold block mb-0.5">Kurzfazit für die Lehrkraft:</span>
                      <span>{aiResult.summary}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Feedback an den Schüler (anpassbar vor Freigabe):
                      </label>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 text-xs font-bold text-school-blue hover:text-school-darkblue"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Kopiert!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Kopieren</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={editableFeedback}
                      onChange={(e) => setEditableFeedback(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-school-blue focus:outline-none leading-relaxed"
                      placeholder="Hier erscheint das generierte Feedback..."
                    />
                  </div>

                  {savedSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Feedback erfolgreich im Schüler-Zugang freigegeben!</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <div className="border-t pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleGenerateAi(aiReport)}
                disabled={isAiLoading}
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Neu generieren
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveFeedback}
                  disabled={isAiLoading || !editableFeedback}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Im Schülerkonto freigeben</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schuljahr-Archiv & JSON-Backup Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Archive className="w-5 h-5 text-school-blue" />
                <span>Schuljahr-Backup & Datenbank-Archiv</span>
              </h3>
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Hier kannst du am Ende eines Schuljahres alle Berichte mit einem Klick als schlanke <strong>JSON-Datei</strong> sichern, bei Bedarf die Datenbank für das neue Schuljahr leeren oder alte Backups wiederherstellen.
            </p>

            {archiveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{archiveSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Export Button */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    1. JSON-Backup herunterladen
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sichert alle {filteredReports.length} Berichte ({yearFilter !== 'Alle' ? yearFilter : 'Alle Schuljahre'}) als JSON-Datei auf deinem PC.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-3 py-2 rounded-lg bg-school-blue hover:bg-school-darkblue text-white text-xs font-bold shadow flex items-center gap-1.5 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              {/* Import Button */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    2. Backup importieren
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Spielt eine zuvor gesicherte JSON-Datei wieder in die Datenbank ein.
                  </span>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isArchiving}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:border-school-blue text-slate-700 text-xs font-bold shadow-sm flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importieren</span>
                  </button>
                </div>
              </div>

              {/* Clear / Purge Button */}
              <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-red-900 block">
                    3. Altes Schuljahr bereinigen
                  </span>
                  <span className="text-[11px] text-red-700">
                    Löscht die {filteredReports.length} Berichte des Schuljahres {yearFilter !== 'Alle' ? yearFilter : 'ausgewählt'} aus der Datenbank.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isArchiving || filteredReports.length === 0}
                  onClick={handleClearCurrentView}
                  className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bereinigen</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 transition"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Configuration Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-school-orange" />
                <span>Google Gemini API-Key</span>
              </h3>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Trage hier deinen persönlichen Gemini API-Key ein. Der Schlüssel wird sicher lokal im Browser auf diesem Gerät gespeichert und für die KI-Auswertung genutzt.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gemini API-Schlüssel
              </label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy... oder AQ..."
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-school-blue focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-school-blue hover:underline font-medium"
              >
                Key erstellen (Google AI Studio) &rarr;
              </a>

              <button
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-xl bg-school-blue text-white font-bold text-xs shadow hover:bg-school-darkblue transition"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KI-Portfolio & Entwicklungsbericht Modal */}
      {portfolioModalOpen && portfolioStudent && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 bg-gradient-to-r from-school-darkblue to-purple-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Award className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                    <span>Portfolio- & Entwicklungsbericht</span>
                    <span className="text-xs bg-purple-400/30 text-purple-100 px-2 py-0.5 rounded-full font-bold">
                      KI-Assistent
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200 flex items-center gap-2 flex-wrap">
                    <span>{portfolioStudent.studentName} • Klasse {portfolioStudent.studentClass} ({portfolioStudent.reports.length} Berichte verfügbar)</span>
                    {portfolioTimestamps[getStudentKey(portfolioStudent.studentName, portfolioStudent.studentCode)] && (
                      <span className="bg-purple-500/40 text-purple-100 border border-purple-300/40 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        Zuletzt generiert: {portfolioTimestamps[getStudentKey(portfolioStudent.studentName, portfolioStudent.studentCode)]}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPortfolioModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Turnus-Auswahl Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm block">
                      1. Turnusse für das Portfolio auswählen:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Wähle einen einzelnen Turnus, mehrere beliebige Turnusse oder alle Berichte für die Auswertung aus.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllTurnus}
                      className="px-2.5 py-1 text-xs font-bold text-school-blue hover:text-school-darkblue bg-blue-50 border border-blue-200 rounded-lg transition"
                    >
                      Alle auswählen
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTurnusIds([])}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition"
                    >
                      Auswahl aufheben
                    </button>
                  </div>
                </div>

                {/* Checkbox-Grid der Turnusse */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {portfolioStudent.reports.map((rep) => {
                    const isSelected = rep.id ? selectedTurnusIds.includes(rep.id) : false;
                    return (
                      <div
                        key={rep.id}
                        onClick={() => rep.id && handleToggleTurnusSelection(rep.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 active:scale-[0.98] flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-purple-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 text-purple-700">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{rep.stage}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold font-mono tabular-nums">
                                {rep.schoolYear}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                              {rep.companyName || 'Kein Betrieb'}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono tabular-nums">
                              Datum: {rep.reportDate || '—'}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rep.teacherFeedback?.comment ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-slate-500/10 text-slate-700 border-slate-500/20'
                        }`}>
                          {rep.teacherFeedback?.comment ? 'mit Feedback' : 'Bericht'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Generierungs-Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleGeneratePortfolio}
                    disabled={isPortfolioLoading || selectedTurnusIds.length === 0}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 px-5 min-h-[44px] rounded-xl text-xs sm:text-sm shadow-md transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isPortfolioLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gemini synthetisiert Entwicklungsbericht...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Portfolio mit KI generieren ({selectedTurnusIds.length} ausgewählt)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Fehlermeldung */}
              {portfolioError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Fehler beim Erstellen des Portfolios:</span>
                    <span>{portfolioError}</span>
                  </div>
                </div>
              )}

              {/* Generiertes Portfolio & Editor */}
              {portfolioResult && (
                <div className="border border-purple-200 bg-purple-50/20 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-purple-200/60 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Generierter Portfolio-Entwicklungsbericht
                      </h4>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-900 font-bold px-2.5 py-0.5 rounded-full">
                      {portfolioResult.periodCovered}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Du kannst alle Textabschnitte vor dem PDF-Druck nach deinen Wünschen anpassen oder ergänzen.
                  </p>

                  {/* 1. Pädagogische Gesamteinschätzung */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs block">
                      Pädagogische Gesamteinschätzung (Zusammenfassung):
                    </label>
                    <textarea
                      rows={3}
                      value={portfolioResult.summary}
                      onChange={(e) =>
                        setPortfolioResult({ ...portfolioResult, summary: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* 2. Durchlaufene Berufsfelder & Tätigkeiten */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs block">
                      I. Durchlaufene Berufsfelder & Tätigkeitsbereiche:
                    </label>
                    <textarea
                      rows={4}
                      value={portfolioResult.practicalExperience}
                      onChange={(e) =>
                        setPortfolioResult({ ...portfolioResult, practicalExperience: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* 3. Schlüsselkompetenzen & Stärken */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 text-xs block">
                      II. Beobachtete Schlüsselkompetenzen & Stärken:
                    </label>
                    <div className="space-y-2">
                      {portfolioResult.competenciesAndStrengths.map((st, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={st}
                            onChange={(e) => {
                              const updated = [...portfolioResult.competenciesAndStrengths];
                              updated[idx] = e.target.value;
                              setPortfolioResult({ ...portfolioResult, competenciesAndStrengths: updated });
                            }}
                            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = portfolioResult.competenciesAndStrengths.filter((_, i) => i !== idx);
                              setPortfolioResult({ ...portfolioResult, competenciesAndStrengths: updated });
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded transition"
                            title="Entfernen"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setPortfolioResult({
                            ...portfolioResult,
                            competenciesAndStrengths: [...portfolioResult.competenciesAndStrengths, 'Neu beobachtete Stärke...']
                          });
                        }}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 mt-1"
                      >
                        + Weitere Stärke hinzufügen
                      </button>
                    </div>
                  </div>

                  {/* 4. Lernentwicklung & Reflexionskompetenz */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs block">
                      III. Lernzuwachs, Reifegrad & Reflexionskompetenz:
                    </label>
                    <textarea
                      rows={4}
                      value={portfolioResult.developmentAndReflection}
                      onChange={(e) =>
                        setPortfolioResult({ ...portfolioResult, developmentAndReflection: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* 5. Empfehlungen zur Berufswahl */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs block">
                      IV. Empfehlungen zur Berufsorientierung:
                    </label>
                    <textarea
                      rows={3}
                      value={portfolioResult.careerRecommendations}
                      onChange={(e) =>
                        setPortfolioResult({ ...portfolioResult, careerRecommendations: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* 6. Abschlussvotum der Schule */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs block">
                      V. Abschließendes Votum des Betreuungslehrers:
                    </label>
                    <textarea
                      rows={3}
                      value={portfolioResult.overallConclusion}
                      onChange={(e) =>
                        setPortfolioResult({ ...portfolioResult, overallConclusion: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t bg-slate-50 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
              {portfolioResult ? (
                <button
                  type="button"
                  onClick={handleDownloadPortfolioPdf}
                  disabled={isExportingPortfolioPdf}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-school-blue to-purple-600 hover:from-school-darkblue hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {isExportingPortfolioPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>PDF wird erstellt...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Offiziellen PDF-Vordruck herunterladen (DIN A4)</span>
                    </>
                  )}
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPortfolioModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen printable portfolio template for html2pdf */}
      {portfolioResult && (
        <div
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '210mm',
            zIndex: -9999,
            opacity: 1,
            pointerEvents: 'none',
          }}
        >
          <PrintablePortfolioReport
            portfolio={portfolioResult}
            timestampText={`Digital exportiert am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`}
          />
        </div>
      )}
    </div>
  );

  function renderReportCard(rep: PraxisReport) {
    const hasFeedback = !!rep.teacherFeedback?.comment;
    const repYear = normalizeSchoolYear(rep.schoolYear || calculateSchoolYear(rep.reportDate));
    const yearBadgeStyle = getSchoolYearBadgeStyle(repYear);

    return (
      <div
        key={rep.id}
        className="bg-white rounded-xl border border-slate-200 hover:border-school-blue/60 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  {rep.studentName || 'Unbenannter Schüler'}
                </h4>
                {/* Klasse mit direktem Lehrer-Dropdown zur Klassenänderung */}
                <div
                  className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 border border-slate-300 hover:border-school-blue rounded px-1.5 py-0.5 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label htmlFor={`class-select-${rep.id}`} className="sr-only">Klasse ändern</label>
                  <select
                    id={`class-select-${rep.id}`}
                    value={rep.studentClass || '8a'}
                    onChange={(e) => handleClassChange(rep, e.target.value)}
                    title="Klasse des Schülers ändern (z. B. bei Wiederholung oder Wechsel 9a -> 9b)"
                    className="bg-transparent text-[11px] text-slate-800 font-bold cursor-pointer focus:outline-none"
                  >
                    {AVAILABLE_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Kl. {c}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Farblich abgesetztes Schuljahr */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${yearBadgeStyle}`}>
                  {repYear}
                </span>
              </div>

              {/* Login-Kürzel mit Kopier-Button für die Lehrkraft */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-mono text-xs font-bold">
                  <Key className="w-3 h-3 text-amber-700" />
                  <span>Login: {rep.studentCode || '—'}</span>
                </div>
                {rep.studentCode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(rep.studentCode || '');
                      setCopiedCode(rep.studentCode || null);
                      setTimeout(() => setCopiedCode(null), 2500);
                    }}
                    title="Kürzel kopieren, um es dem Schüler mitzugeben"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-school-blue hover:bg-blue-50 px-1.5 py-0.5 rounded transition"
                  >
                    {copiedCode === rep.studentCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Kopieren</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <span
              className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 border ${
                hasFeedback
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shadow-xs'
                  : 'bg-amber-500/10 text-amber-700 border-amber-500/20 shadow-xs'
              }`}
            >
              {hasFeedback ? 'Feedback erteilt' : 'Offen'}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-school-cyan flex-shrink-0" />
              <span className="truncate font-medium">{rep.companyName || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span><span className="font-mono tabular-nums">{rep.reportDate || '—'}</span> ({rep.stage})</span>
            </div>
          </div>
        </div>

        {/* Actions for this student */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveReport(rep)}
            className="flex-1 inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs transition-all duration-150 active:scale-[0.98]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Bericht</span>
          </button>

          <button
            onClick={() => exportReportToPDF(rep)}
            title="PDF herunterladen"
            className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-school-blue text-slate-600 transition-all duration-150 active:scale-[0.98]"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleGenerateAi(rep)}
            className="flex-1 inline-flex items-center justify-center gap-1 bg-gradient-to-r from-school-blue to-school-cyan hover:from-school-darkblue hover:to-school-blue text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition-all duration-150 active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-school-orange" />
            <span>KI-Feedback</span>
          </button>

          {(() => {
            const sKey = getStudentKey(rep.studentName, rep.studentCode);
            const lastGen = portfolioTimestamps[sKey];
            return (
              <button
                onClick={() => handleOpenPortfolio(rep.studentName, rep.studentCode, rep.studentClass)}
                title={lastGen ? `Portfolio-Entwicklungsbericht (Zuletzt generiert: ${lastGen})` : 'Portfolio-Entwicklungsbericht für diesen Schüler erstellen'}
                className="inline-flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold py-1.5 px-2.5 rounded-lg text-xs transition-all duration-150 active:scale-[0.98]"
              >
                <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <div className="flex flex-col items-start leading-none text-left">
                  <span>Portfolio</span>
                  {lastGen && (
                    <span className="text-[9px] font-mono tabular-nums text-purple-700 mt-0.5 whitespace-nowrap">
                      Zuletzt: {lastGen}
                    </span>
                  )}
                </div>
              </button>
            );
          })()}
        </div>
      </div>
    );
  }
};

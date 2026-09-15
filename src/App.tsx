import { useState, useEffect } from 'react';
import { PraxisReport, INITIAL_REPORT } from './types/report';
import { useAuth } from './context/AuthContext';
import {
  saveReportToFirestore,
  fetchStudentReports,
  calculateSchoolYear,
  getPromotedClass
} from './services/reportService';
import { Header } from './components/Header';
import { UserBar } from './components/UserBar';
import { StudentFeedbackBanner } from './components/StudentFeedbackBanner';
import { StepIndicator } from './components/StepIndicator';
import { StepBasicInfo } from './components/StepBasicInfo';
import { StepDailyLog } from './components/StepDailyLog';
import { StepSelfReflection } from './components/StepSelfReflection';
import { StepHighlightExport } from './components/StepHighlightExport';
import { ResetModal } from './components/ResetModal';
import { LoginModal } from './components/LoginModal';
import { StudentReportsModal } from './components/StudentReportsModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PrintableReport } from './components/PrintableReport';
import { exportReportToPDF } from './utils/pdfExport';
import { AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'praktikum_reflexion_kahla_final';

export function App() {
  const { role, studentCode } = useAuth();

  const [report, setReport] = useState<PraxisReport>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_REPORT,
          studentName: parsed.student_name || parsed.studentName || '',
          studentClass: parsed.student_class || parsed.studentClass || '8a',
          companyName: parsed.company_name || parsed.companyName || '',
          stage: parsed.stage_select || parsed.stage || 'Turnus 1',
          reportDate: parsed.report_date || parsed.reportDate || new Date().toISOString().split('T')[0],
          startTime: parsed.start_time || parsed.startTime || '08:00',
          endTime: parsed.end_time || parsed.endTime || '15:30',
          taskDescription: parsed.task_description || parsed.taskDescription || '',
          dailySchedule: parsed.daily_schedule || parsed.dailySchedule || '',
          funRating: parsed.sc_fun || parsed.funRating || '',
          boredRating: parsed.sc_bored || parsed.boredRating || '',
          learnedRating: parsed.sc_learned || parsed.learnedRating || '',
          learnedExplanation: parsed.learned_explanation || parsed.learnedExplanation || '',
          overwhelmedRating: parsed.sc_overwhelmed || parsed.overwhelmedRating || '',
          overwhelmedExplanation: parsed.overwhelmed_explanation || parsed.overwhelmedExplanation || '',
          careerRating: parsed.sc_career || parsed.careerRating || '',
          specialMemory: parsed.special_memory || parsed.specialMemory || '',
        };
      }
    } catch (e) {
      console.error('Error restoring localStorage data', e);
    }
    return INITIAL_REPORT;
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginDefaultTab, setLoginDefaultTab] = useState<'student' | 'teacher'>('student');
  const [isTeacherDashboardOpen, setIsTeacherDashboardOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [studentPastReports, setStudentPastReports] = useState<PraxisReport[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Automatically open TeacherDashboard when logged in as teacher, and close if logged out
  useEffect(() => {
    if (role === 'teacher') {
      setIsTeacherDashboardOpen(true);
      setIsLoginModalOpen(false);
    } else {
      setIsTeacherDashboardOpen(false);
    }
  }, [role]);

  // Load student reports when logged in as student
  useEffect(() => {
    if (role === 'student' && studentCode) {
      fetchStudentReports(studentCode).then((data) => {
        setStudentPastReports(data);
        // Pre-fill student name and class if available in past reports
        if (data.length > 0) {
          const latest = data[0];
          if (!report.studentName && latest.studentName) {
            setReport((prev) => ({ ...prev, studentName: latest.studentName }));
          }
          if (latest.studentClass) {
            const currentYear = calculateSchoolYear();
            const promoted = getPromotedClass(
              latest.studentClass,
              latest.schoolYear,
              currentYear
            );
            setReport((prev) => ({ ...prev, studentClass: promoted }));
          }
        }
      });
    }
  }, [studentCode, role]);

  // Auto-save whenever report changes
  useEffect(() => {
    try {
      const dataToSave = {
        student_name: report.studentName,
        student_class: report.studentClass,
        company_name: report.companyName,
        stage_select: report.stage,
        report_date: report.reportDate,
        start_time: report.startTime,
        end_time: report.endTime,
        task_description: report.taskDescription,
        daily_schedule: report.dailySchedule,
        sc_fun: report.funRating,
        sc_bored: report.boredRating,
        sc_learned: report.learnedRating,
        learned_explanation: report.learnedExplanation,
        sc_overwhelmed: report.overwhelmedRating,
        overwhelmed_explanation: report.overwhelmedExplanation,
        sc_career: report.careerRating,
        special_memory: report.specialMemory,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setLastSaved(new Date());
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }, [report]);

  const handleChange = (field: keyof PraxisReport, value: string) => {
    setReport((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setReport(INITIAL_REPORT);
    setCurrentStep(1);
  };

  // Export PDF & Upload to Firestore
  // Export PDF & Upload to Firestore
  const handleExportAndSave = async () => {
    // 1. Generate local PDF download
    await exportReportToPDF(report);

    // 2. Upload/save report to Firestore
    try {
      const code = studentCode || report.studentCode;
      const savedId = await saveReportToFirestore(report, code);
      setReport((prev) => ({ ...prev, id: savedId, status: 'submitted' }));
      if (code) {
        const updated = await fetchStudentReports(code);
        setStudentPastReports(updated);
      }
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        err?.message?.includes('permission') ||
        err?.message?.includes('Missing or insufficient permissions');
      if (isPermissionDenied) {
        alert(
          'Hinweis zur Datenbank: Der Bericht konnte nicht online in Firebase gespeichert werden, da die Firestore-Sicherheitsregeln den Zugriff verweigern. Bitte hinterlege die Freigabe-Regeln in der Firebase Console unter "Firestore Database > Regeln".'
        );
      } else {
        alert(`Hinweis zur Datenbank: Speichern fehlgeschlagen (${err?.message || err}).`);
      }
    }
  };

  const handleSelectPastReport = (pastReport: PraxisReport) => {
    setReport(pastReport);
    setCurrentStep(1);
  };

  const handleNewReport = () => {
    const currentYear = calculateSchoolYear();
    let effectiveClass = report.studentClass || '8a';
    if (studentPastReports.length > 0 && studentPastReports[0].studentClass) {
      effectiveClass = getPromotedClass(
        studentPastReports[0].studentClass,
        studentPastReports[0].schoolYear,
        currentYear
      );
    }
    setReport({
      ...INITIAL_REPORT,
      studentName: report.studentName,
      studentClass: effectiveClass,
      companyName: report.companyName,
    });
    setCurrentStep(1);
  };

  const hasFeedback = studentPastReports.some(
    (r) => r.teacherFeedback?.comment || r.aiFeedback?.pedagogicalFeedback
  );

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const timestampText = `Digital exportiert am ${dateFormatted} um ${timeFormatted} Uhr`;

  return (
    <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-6 md:px-8">
      {/* Top User Navigation */}
      <UserBar
        onOpenLogin={(tab = 'student') => {
          setLoginDefaultTab(tab);
          setIsLoginModalOpen(true);
        }}
        onOpenDashboard={() => {
          if (role === 'teacher') {
            setIsTeacherDashboardOpen(true);
          } else {
            setLoginDefaultTab('teacher');
            setIsLoginModalOpen(true);
          }
        }}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        reportCount={studentPastReports.length}
        hasFeedback={hasFeedback}
      />

      {/* Prominent Student Feedback Banner when feedback is available */}
      {role === 'student' && (
        <StudentFeedbackBanner reports={studentPastReports} />
      )}

      <div
        id="app-container"
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-school-border"
      >
        <Header lastSaved={lastSaved} />
        <StepIndicator
          currentStep={currentStep}
          totalSteps={4}
          onSelectStep={setCurrentStep}
        />

        <main className="p-5 sm:p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <StepBasicInfo
                key="step-1"
                report={report}
                onChange={handleChange}
                onNext={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <StepDailyLog
                key="step-2"
                report={report}
                onChange={handleChange}
                onNext={() => setCurrentStep(3)}
                onPrev={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && (
              <StepSelfReflection
                key="step-3"
                report={report}
                onChange={handleChange}
                onNext={() => setCurrentStep(4)}
                onPrev={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 4 && (
              <StepHighlightExport
                key="step-4"
                report={report}
                onChange={handleChange}
                onPrev={() => setCurrentStep(3)}
                onExportPDF={handleExportAndSave}
                onOpenReset={() => setIsResetModalOpen(true)}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Offscreen printable Din A4 template for html2pdf */}
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
        <PrintableReport report={report} timestampText={timestampText} />
      </div>

      {/* Modals */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleReset}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultTab={loginDefaultTab}
        onStudentLoggedIn={(code, name) => {
          if (name) {
            setReport((prev) => ({ ...prev, studentName: name, studentCode: code }));
          } else {
            setReport((prev) => ({ ...prev, studentCode: code }));
          }
        }}
        onTeacherLoggedIn={() => {
          setIsTeacherDashboardOpen(true);
        }}
      />

      <StudentReportsModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        reports={studentPastReports}
        onSelectReport={handleSelectPastReport}
        onNewReport={handleNewReport}
      />

      {isTeacherDashboardOpen && (
        <TeacherDashboard onClose={() => setIsTeacherDashboardOpen(false)} />
      )}
    </div>
  );
}

export default App;

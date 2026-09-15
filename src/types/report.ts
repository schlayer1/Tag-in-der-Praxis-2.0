export type RatingValue = 'trifft voll zu' | 'trifft eher zu' | 'trifft eher nicht zu' | 'trifft gar nicht zu' | '';

export interface TeacherFeedback {
  reviewedBy?: string;
  reviewedAt?: string;
  comment: string;
  isPublished: boolean;
}

export interface AiFeedback {
  generatedAt?: string;
  summary?: string;
  pedagogicalFeedback?: string;
  strengths?: string[];
  tips?: string[];
}

export interface StudentPortfolioReport {
  id?: string;
  studentName: string;
  studentClass: string;
  periodCovered: string;
  schoolYears: string;
  companiesInvolved: string[];
  generatedAt: string;
  title: string;
  summary: string;
  practicalExperience: string;
  competenciesAndStrengths: string[];
  developmentAndReflection: string;
  careerRecommendations: string;
  overallConclusion: string;
  teacherNote?: string;
}

export interface PraxisReport {
  // Identity & Status
  id?: string;
  studentUid: string;
  studentCode: string; // z. B. 'niko-k'
  schoolYear?: string; // z. B. '2025/2026'
  createdAt?: string;
  updatedAt?: string;
  status: 'draft' | 'submitted' | 'reviewed';

  // Schritt 1: Stammdaten
  studentName: string;
  studentClass: string; // z. B. '9a', '9b', '10a'
  companyName: string;
  stage: string; // 'Turnus 1', 'Turnus 2', 'Turnus 3', 'Turnus 4'
  reportDate: string;
  startTime: string;
  endTime: string;

  // Schritt 2: Tätigkeiten & Ablauf
  taskDescription: string;
  dailySchedule: string;

  // Schritt 3: Selbsteinschätzung (4-stufige Bewertung)
  funRating: RatingValue;
  boredRating: RatingValue;
  learnedRating: RatingValue;
  learnedExplanation: string;
  overwhelmedRating: RatingValue;
  overwhelmedExplanation: string;
  careerRating: RatingValue;

  // Schritt 4: Besondere Erinnerung
  specialMemory: string;

  // Teacher & AI Feedback
  teacherFeedback?: TeacherFeedback;
  aiFeedback?: AiFeedback;
}

export const INITIAL_REPORT: PraxisReport = {
  studentUid: '',
  studentCode: '',
  studentName: '',
  studentClass: '8a',
  companyName: '',
  stage: 'Turnus 1',
  reportDate: new Date().toISOString().split('T')[0],
  startTime: '08:00',
  endTime: '15:30',
  taskDescription: '',
  dailySchedule: '',
  funRating: '',
  boredRating: '',
  learnedRating: '',
  learnedExplanation: '',
  overwhelmedRating: '',
  overwhelmedExplanation: '',
  careerRating: '',
  specialMemory: '',
  status: 'draft'
};

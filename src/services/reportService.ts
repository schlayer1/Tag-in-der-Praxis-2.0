import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PraxisReport, AiFeedback } from '../types/report';

const REPORTS_COLLECTION = 'reports';

// Liste der wählbaren Schuljahre von SJ 26/27 bis SJ 34/35
// Automatische Generierung des Schüler-Kürzels aus Vor- und Nachname (wie in der Elternhelferkartei)
// z.B. "Lukas Müller" -> "LMUE", "Emma Schmidt" -> "ESCH"
export function generateStudentCode(fullName: string): string {
  if (!fullName || !fullName.trim()) return '';
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0];

  const cleanLast = last
    .replace(/ä/gi, 'ae')
    .replace(/ö/gi, 'oe')
    .replace(/ü/gi, 'ue')
    .replace(/ß/gi, 'ss')
    .replace(/[^a-zA-Z0-9]/g, '');

  const cleanFirst = first
    .replace(/ä/gi, 'ae')
    .replace(/ö/gi, 'oe')
    .replace(/ü/gi, 'ue')
    .replace(/ß/gi, 'ss')
    .replace(/[^a-zA-Z0-9]/g, '');

  if (parts.length === 1) {
    return cleanFirst.slice(0, 4).toUpperCase();
  }

  const code = (cleanFirst.slice(0, 1) + cleanLast.slice(0, 3)).toUpperCase();
  return code || 'SCHUELER';
}

// Liste der wählbaren Schuljahre von SJ 26/27 bis SJ 34/35
export const SCHOOL_YEARS = [
  'SJ 26/27',
  'SJ 27/28',
  'SJ 28/29',
  'SJ 29/30',
  'SJ 30/31',
  'SJ 31/32',
  'SJ 32/33',
  'SJ 33/34',
  'SJ 34/35'
];

// Berechnet das Schuljahr anhand des Datums (Schuljahresbeginn: 1. August eines jeden Jahres)
// Format z.B. "SJ 26/27"
export function calculateSchoolYear(dateStr?: string): string {
  let year: number;
  let month: number; // 1-12

  if (dateStr && dateStr.trim()) {
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    } else {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
      } else {
        year = d.getFullYear();
        month = d.getMonth() + 1;
      }
    }
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  // Wechsel zum 01.08. eines jeden Jahres:
  // Monat >= 8 (August bis Dezember): Startjahr = year, Folgejahr = year + 1
  // Monat < 8 (Januar bis Juli): Startjahr = year - 1, Folgejahr = year
  const startYear = month >= 8 ? year : year - 1;
  const endYear = startYear + 1;

  const startShort = String(startYear).slice(-2);
  const endShort = String(endYear).slice(-2);
  return `SJ ${startShort}/${endShort}`;
}

// Vereinheitlicht alte und neue Schreibweisen (z.B. "2026/2027", "SJ26/27", "SJ 26/27") zu "SJ 26/27"
export function normalizeSchoolYear(val?: string): string {
  if (!val) return calculateSchoolYear();
  const trimmed = val.trim();
  const match = trimmed.match(/(\d{2,4})[\/\-_](\d{2,4})/);
  if (match) {
    const start = match[1].slice(-2);
    const end = match[2].slice(-2);
    return `SJ ${start}/${end}`;
  }
  return trimmed;
}

// Liste der zulässigen Klassen (nur Klassen 8 und 9 absolvieren Praktika)
export const AVAILABLE_CLASSES = ['8a', '8b', '8c', '9a', '9b', '9c'];

// Extrahiert das Startjahr als 4-stellige Zahl aus Schuljahr-Strings wie "SJ 26/27" oder "2026/2027"
export function extractSchoolYearStart(yearStr?: string): number | null {
  if (!yearStr) return null;
  const match = yearStr.match(/(\d{2,4})[\/\-_](\d{2,4})/);
  if (match) {
    let yr = parseInt(match[1], 10);
    if (yr < 100) yr += 2000;
    return yr;
  }
  return null;
}

// Berechnet die neue Klassenstufe beim Schuljahreswechsel (z. B. 8a im SJ 26/27 -> 9a im SJ 27/28)
export function getPromotedClass(
  baseClass: string,
  fromSchoolYear?: string,
  toSchoolYear?: string
): string {
  if (!baseClass) return '8a';
  const cleanClass = baseClass.trim();
  const fromStart = extractSchoolYearStart(fromSchoolYear);
  const toStart = extractSchoolYearStart(toSchoolYear || calculateSchoolYear());

  if (fromStart === null || toStart === null) {
    return cleanClass;
  }

  const diffYears = toStart - fromStart;
  if (diffYears <= 0) {
    return cleanClass;
  }

  // Zerlege Klasse in Klassenstufe und Buchstabe (z.B. "8" und "a")
  const match = cleanClass.match(/^(\d+)([a-zA-Z]+)$/);
  if (!match) return cleanClass;

  const currentGrade = parseInt(match[1], 10);
  const letter = match[2].toLowerCase();

  const nextGrade = currentGrade + diffYears;
  // Da an der Schule nur Klassen 8 und 9 Praktika durchführen:
  if (nextGrade >= 9) {
    return `9${letter}`;
  }
  return `${nextGrade}${letter}`;
}

// Initial angelegte Testschüler für das aktuelle (SJ 26/27) und das kommende Schuljahr (SJ 27/28)
export const INITIAL_TEST_REPORTS: PraxisReport[] = [
  // --- Aktuelles Schuljahr: SJ 26/27 ---
  // Lukas Müller beginnt im SJ 26/27 in der 8a mit Turnus 1 und Turnus 2
  {
    id: 'test_lukas_26_t1',
    studentUid: 'LMUE',
    studentCode: 'LMUE',
    schoolYear: 'SJ 26/27',
    studentName: 'Lukas Müller',
    studentClass: '8a',
    companyName: 'Jenoptik AG Jena',
    stage: 'Turnus 1',
    reportDate: '2026-09-08',
    startTime: '08:00',
    endTime: '14:30',
    taskDescription: 'Einblick in die optische Fertigung und Montage von Präzisionslinsen. Teilnahme an der Sicherheitsunterweisung im Reinraum und Protokollierung optischer Messwerte.',
    dailySchedule: '08:00 Begrüßung und Sicherheitsunterweisung\n09:15 Einführung in die Reinraumkleidung & Schleuse\n10:30 Beobachtung der Linsenvergütung und Laserbeschriftung\n12:00 Mittagspause in der Firmenkantine\n12:45 Messprotokolle im Labor eintragen\n14:00 Feedbackgespräch mit Ausbildungsleiter Herrn Hoffmann\n14:30 Feierabend',
    funRating: 'trifft voll zu',
    boredRating: 'trifft gar nicht zu',
    learnedRating: 'trifft voll zu',
    learnedExplanation: 'Besonders der Umgang mit dem optischen Prüfplatz war neu und lehrreich.',
    overwhelmedRating: 'trifft eher nicht zu',
    overwhelmedExplanation: 'Bei Fragen konnte ich jederzeit den Meister fragen.',
    careerRating: 'trifft voll zu',
    specialMemory: 'Das Arbeiten im Reinraum mit der speziellen Schutzbekleidung war extrem spannend.',
    teacherFeedback: {
      comment: 'Hervorragender, detaillierter Bericht, Lukas! Deine Reflexion zeigt großes technisches Verständnis und echtes Interesse an der Feinoptik.',
      reviewedBy: 'Fachlehrer Berufsberatung',
      reviewedAt: '2026-09-10T11:20:00.000Z',
      isPublished: true
    },
    status: 'reviewed',
    createdAt: '2026-09-08T15:00:00.000Z',
    updatedAt: '2026-09-10T11:20:00.000Z'
  },
  {
    id: 'test_lukas_26_t2',
    studentUid: 'LMUE',
    studentCode: 'LMUE',
    schoolYear: 'SJ 26/27',
    studentName: 'Lukas Müller',
    studentClass: '8a',
    companyName: 'Jenoptik AG Jena',
    stage: 'Turnus 2',
    reportDate: '2027-02-10',
    startTime: '08:00',
    endTime: '14:30',
    taskDescription: 'Fortsetzung in der Feinoptikmontage: Justieren von Prismen und optischen Filtern. Messung von Reflexionsgraden am Spektrometer.',
    dailySchedule: '08:00 Arbeitsvorbereitung im Labor\n09:00 Justageprüfung am Kollimator\n11:00 Spektrometermessungen dokumentieren\n12:00 Mittagspause\n12:45 Montage von Filterfassungen\n14:00 Tagesabschluss mit Ausbilder\n14:30 Feierabend',
    funRating: 'trifft voll zu',
    boredRating: 'trifft gar nicht zu',
    learnedRating: 'trifft voll zu',
    learnedExplanation: 'Präzises Arbeiten unter dem Messmikroskop und Umgang mit Justierschrauben.',
    overwhelmedRating: 'trifft eher nicht zu',
    overwhelmedExplanation: 'Sehr gute Einweisung erhalten.',
    careerRating: 'trifft voll zu',
    specialMemory: 'Ein Prisma so exakt auszurichten, dass der Laserstrahl genau den Zielpunkt traf.',
    status: 'submitted',
    createdAt: '2027-02-10T15:00:00.000Z',
    updatedAt: '2027-02-10T15:00:00.000Z'
  },
  {
    id: 'test_emma_26',
    studentUid: 'ESCH',
    studentCode: 'ESCH',
    schoolYear: 'SJ 26/27',
    studentName: 'Emma Schmidt',
    studentClass: '8b',
    companyName: 'KAHLA/Thüringen Porzellan GmbH',
    stage: 'Turnus 1',
    reportDate: '2026-09-11',
    startTime: '08:30',
    endTime: '15:00',
    taskDescription: 'Kennenlernen des Entwurfs- und Formgebungsverfahrens im Designstudio. Begleitung des Brennvorgangs und Sortierung von Porzellanstücken nach Qualitätsstandards.',
    dailySchedule: '08:30 Arbeitsbeginn im Musterraum\n09:30 Einführung in Tonguss und Glasiertechniken\n11:30 Beobachtung am Tunnelofen\n12:15 Mittagspause\n13:00 Qualitätskontrolle und Verpackung für den Werksverkauf\n14:30 Tagesauswertung mit der Betreuerin Frau Krause\n15:00 Ende des Praktikumstages',
    funRating: 'trifft eher zu',
    boredRating: 'trifft eher nicht zu',
    learnedRating: 'trifft eher zu',
    learnedExplanation: 'Ich habe verstanden, wie wichtig Sorgfalt beim Trocknen der Formen ist.',
    overwhelmedRating: 'trifft eher nicht zu',
    overwhelmedExplanation: 'Die Abläufe wurden Schritt für Schritt vorgeführt.',
    careerRating: 'trifft eher zu',
    specialMemory: 'Selbst eine Schale aus der Form zu lösen und zu sehen, wie empfindlich der rohe Ton vor dem Brennen ist.',
    status: 'submitted',
    createdAt: '2026-09-11T16:00:00.000Z',
    updatedAt: '2026-09-11T16:00:00.000Z'
  },
  {
    id: 'test_tim_26',
    studentUid: 'TSCH',
    studentCode: 'TSCH',
    schoolYear: 'SJ 26/27',
    studentName: 'Tim Schneider',
    studentClass: '9a',
    companyName: 'Autohaus Kahla GmbH',
    stage: 'Turnus 1',
    reportDate: '2026-09-15',
    startTime: '07:30',
    endTime: '14:00',
    taskDescription: 'Mitarbeit in der Kfz-Werkstatt: Vorbereitung zur Hauptuntersuchung, Radwechsel und Auslesen von Diagnosedaten am Tester.',
    dailySchedule: '07:30 Werkstattbesprechung & Einteilung der Hebebühnen\n08:00 Radwechsel und Profiltiefenmessung an zwei Fahrzeugen\n10:15 Bremsflüssigkeitsprüfung mit dem Gesellen\n11:45 Pause\n12:30 Fehlerdiagnose am Bordcomputer über OBD2-Schnittstelle\n13:30 Werkzeugreinigung und Sicherheitscheck\n14:00 Feierabend',
    funRating: 'trifft voll zu',
    boredRating: 'trifft gar nicht zu',
    learnedRating: 'trifft voll zu',
    learnedExplanation: 'Diagnosegeräte und Fehlerspeicher mit OBD-Scanner auslesen.',
    overwhelmedRating: 'trifft eher nicht zu',
    overwhelmedExplanation: 'Der Geselle war immer ansprechbar.',
    careerRating: 'trifft voll zu',
    specialMemory: 'Dass moderne Autos über Computerprogramme diagnostiziert werden und ich den Fehlerspeicher selbst mit dem Tablet auslesen durfte.',
    status: 'submitted',
    createdAt: '2026-09-15T14:30:00.000Z',
    updatedAt: '2026-09-15T14:30:00.000Z'
  },

  // --- Kommendes Schuljahr: SJ 27/28 ---
  // Lukas Müller ist im neuen Schuljahr SJ 27/28 nun in der Klasse 9a und absolviert Turnus 3!
  {
    id: 'test_lukas_27_t3',
    studentUid: 'LMUE',
    studentCode: 'LMUE',
    schoolYear: 'SJ 27/28',
    studentName: 'Lukas Müller',
    studentClass: '9a',
    companyName: 'Jenoptik AG Jena',
    stage: 'Turnus 3',
    reportDate: '2027-09-15',
    startTime: '08:00',
    endTime: '14:30',
    taskDescription: 'Eigenständiges Kalibrieren von Halterungen für Mikrolinsen. Mitarbeit an einem Kundenprojekt zur Lasersensorik.',
    dailySchedule: '08:00 Teambesprechung Entwicklungsprojekt\n09:00 Kalibrierung am optischen Messtisch\n11:30 Zwischenprüfung mit Projektleiter\n12:15 Mittagspause\n13:00 Dokumentation der Toleranzen im ERP-System\n14:00 Reflexion des Praxistages\n14:30 Feierabend',
    funRating: 'trifft voll zu',
    boredRating: 'trifft gar nicht zu',
    learnedRating: 'trifft voll zu',
    learnedExplanation: 'Toleranzgrenzen im Mikrometerbereich eigenständig überprüfen.',
    overwhelmedRating: 'trifft eher nicht zu',
    overwhelmedExplanation: 'Gute Vorbereitung aus den ersten beiden Turnussen.',
    careerRating: 'trifft voll zu',
    specialMemory: 'Dass ich heute zum ersten Mal komplett eigenständig an einer Baugruppe arbeiten durfte.',
    status: 'submitted',
    createdAt: '2027-09-15T15:00:00.000Z',
    updatedAt: '2027-09-15T15:00:00.000Z'
  },
  {
    id: 'test_laura_27',
    studentUid: 'LWEB',
    studentCode: 'LWEB',
    schoolYear: 'SJ 27/28',
    studentName: 'Laura Weber',
    studentClass: '8c',
    companyName: 'Waldkliniken Eisenberg',
    stage: 'Turnus 1',
    reportDate: '2027-09-07',
    startTime: '08:00',
    endTime: '14:00',
    taskDescription: 'Hospitation im Stationsalltag und Einblicke in die Physiotherapie und Patientenbetreuung im orthopädischen Zentrum.',
    dailySchedule: '08:00 Frühbesprechung des Pflegeteams\n09:00 Rundgang auf Station 3 und Bettenaufbereitung\n10:30 Begleitung der Gehschule im Physiotherapiezentrum\n12:00 Mittagspause\n12:45 Einblick in die digitale Patientenakte und Dokumentation\n13:45 Feedbackrunde mit Praxisanleiterin\n14:00 Feierabend',
    funRating: 'trifft eher zu',
    boredRating: 'trifft gar nicht zu',
    learnedRating: 'trifft voll zu',
    learnedExplanation: 'Großer Einblick in die Pflegeberufe und den Umgang mit Patienten nach OPs.',
    overwhelmedRating: 'trifft eher nicht zu',
    overwhelmedExplanation: 'Die Pflegerinnen haben mich toll unterstützt.',
    careerRating: 'trifft eher zu',
    specialMemory: 'Wie freundlich und dankbar die älteren Patienten auf die Unterstützung reagiert haben.',
    status: 'submitted',
    createdAt: '2027-09-07T14:30:00.000Z',
    updatedAt: '2027-09-07T14:30:00.000Z'
  },
  {
    id: 'test_niklas_27',
    studentUid: 'NFIS',
    studentCode: 'NFIS',
    schoolYear: 'SJ 27/28',
    studentName: 'Niklas Fischer',
    studentClass: '9b',
    companyName: 'Tischlerei & Möbelbau Kahla',
    stage: 'Turnus 1',
    reportDate: '2027-09-14',
    startTime: '07:00',
    endTime: '14:30',
    taskDescription: 'Zuschnitt von Massivholzleisten, Kanten schleifen und Vormontage von Korpusmöbeln unter Anleitung des Meisters.',
    dailySchedule: '07:00 Einteilung in der Werkstatt\n07:30 Sicherheitsunterweisung für Handmaschinen\n09:00 Schleifen von Eichenholzplatten für eine Maßanfertigung\n11:30 Mittagspause\n12:15 Dübelverbindungen anleimen und Spannen der Zwingen\n13:45 Werkstatt kehren und Maschinen absaugen\n14:30 Arbeitsende',
    funRating: 'trifft voll zu',
    boredRating: 'trifft gar nicht zu',
    learnedRating: 'trifft eher zu',
    learnedExplanation: 'Genauer Umgang mit Hobel, Exzenterschleifer und Holzleimen.',
    overwhelmedRating: 'trifft gar nicht zu',
    overwhelmedExplanation: 'Alles wurde geduldig erklärt.',
    careerRating: 'trifft voll zu',
    specialMemory: 'Der Geruch von frischem Eichenholz in der Werkstatt und das Zusammenfügen der fertigen Schrankteile.',
    teacherFeedback: {
      comment: 'Sehr gut strukturierter Bericht, Niklas! Handwerkliche Berufe bieten tolle Perspektiven in unserer Region.',
      reviewedBy: 'Fachlehrer Berufsberatung',
      reviewedAt: '2027-09-16T10:00:00.000Z',
      isPublished: true
    },
    status: 'reviewed',
    createdAt: '2027-09-14T15:00:00.000Z',
    updatedAt: '2027-09-16T10:00:00.000Z'
  }
];

// 1. Bericht speichern (neu anlegen oder aktualisieren)
export async function saveReportToFirestore(
  report: PraxisReport,
  studentCodeInput?: string
): Promise<string> {
  const reportsRef = collection(db, REPORTS_COLLECTION);
  const nowISO = new Date().toISOString();
  const schoolYear = report.schoolYear || calculateSchoolYear(report.reportDate);
  const effectiveCode = (
    studentCodeInput ||
    report.studentCode ||
    generateStudentCode(report.studentName) ||
    'GAST'
  ).toUpperCase().trim();

  const dataToSave = {
    studentUid: effectiveCode,
    studentCode: effectiveCode,
    schoolYear: normalizeSchoolYear(schoolYear),
    studentName: report.studentName,
    studentClass: report.studentClass || '8a',
    companyName: report.companyName,
    stage: report.stage,
    reportDate: report.reportDate,
    startTime: report.startTime,
    endTime: report.endTime,
    taskDescription: report.taskDescription,
    dailySchedule: report.dailySchedule,
    funRating: report.funRating,
    boredRating: report.boredRating,
    learnedRating: report.learnedRating,
    learnedExplanation: report.learnedExplanation,
    overwhelmedRating: report.overwhelmedRating,
    overwhelmedExplanation: report.overwhelmedExplanation,
    careerRating: report.careerRating,
    specialMemory: report.specialMemory,
    status: report.status || 'submitted',
    updatedAt: nowISO,
  };

  if (report.id && !report.id.startsWith('test_')) {
    const reportDoc = doc(db, REPORTS_COLLECTION, report.id);
    await updateDoc(reportDoc, dataToSave);
    return report.id;
  } else {
    const newDoc = await addDoc(reportsRef, {
      ...dataToSave,
      createdAt: nowISO,
      serverTime: serverTimestamp(),
    });
    return newDoc.id;
  }
}

// 2. Alle Berichte eines Schülers laden anhand des Kürzels
export async function fetchStudentReports(studentCode: string): Promise<PraxisReport[]> {
  const cleanCode = (studentCode || '').toUpperCase().trim();
  if (!cleanCode) return [];

  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('studentCode', '==', cleanCode)
    );

    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PraxisReport, 'id'>),
    }));

    if (reports.length > 0) {
      return reports.sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
    }

    // Fallback: Prüfen ob Testschüler zutrifft
    const matchingTest = INITIAL_TEST_REPORTS.filter(
      (r) => r.studentCode.toUpperCase() === cleanCode
    );
    return matchingTest;
  } catch (err) {
    console.warn('Error fetching student reports, checking fallback test data:', err);
    return INITIAL_TEST_REPORTS.filter(
      (r) => r.studentCode.toUpperCase() === cleanCode
    );
  }
}

// 3. Alle Berichte für die Lehrkraft laden
export async function fetchAllReportsForTeacher(): Promise<PraxisReport[]> {
  try {
    const reportsRef = collection(db, REPORTS_COLLECTION);
    const snapshot = await getDocs(reportsRef);
    const firestoreReports = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PraxisReport, 'id'>),
    }));

    if (firestoreReports.length === 0) {
      return INITIAL_TEST_REPORTS;
    }

    const existingKeys = new Set(
      firestoreReports.map((r) => `${(r.studentCode || '').toLowerCase()}_${normalizeSchoolYear(r.schoolYear)}_${r.stage || ''}`)
    );

    const merged: PraxisReport[] = [...firestoreReports];
    for (const testRep of INITIAL_TEST_REPORTS) {
      const key = `${testRep.studentCode.toLowerCase()}_${normalizeSchoolYear(testRep.schoolYear)}_${testRep.stage || ''}`;
      if (!existingKeys.has(key)) {
        merged.push(testRep);
      }
    }

    return merged.sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
  } catch (err) {
    console.warn('Verwende initiale Testberichte wegen Datenbankstatus (prüfe Firestore Rules):', err);
    return INITIAL_TEST_REPORTS;
  }
}

// 4. Lehrer-Feedback speichern
export async function saveTeacherFeedback(
  reportId: string,
  comment: string,
  teacherName: string = 'Lehrkraft'
): Promise<void> {
  const reportDoc = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(reportDoc, {
    'teacherFeedback.comment': comment,
    'teacherFeedback.reviewedBy': teacherName,
    'teacherFeedback.reviewedAt': new Date().toISOString(),
    'teacherFeedback.isPublished': true,
    status: 'reviewed',
  });
}

// 5. KI-Feedback am Bericht hinterlegen
export async function saveAiFeedback(
  reportId: string,
  aiFeedback: AiFeedback
): Promise<void> {
  const reportDoc = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(reportDoc, {
    aiFeedback,
  });
}

// 6. Einzelnen Bericht löschen
export async function deleteReportDoc(reportId: string): Promise<void> {
  await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
}

// 7. JSON-Export für das Schuljahr-Backup (Herunterladen als Datei)
export function exportReportsToJsonFile(reports: PraxisReport[], schoolYearLabel?: string): void {
  const cleanYear = (schoolYearLabel || calculateSchoolYear()).replace('/', '_');
  const filename = `Praktikumsberichte_Backup_${cleanYear}_${new Date().toISOString().split('T')[0]}.json`;

  const jsonStr = JSON.stringify(reports, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 8. JSON-Import (Wiederherstellung von Berichten aus einer Backup-Datei)
export async function importReportsFromJson(importedReports: PraxisReport[]): Promise<number> {
  if (!Array.isArray(importedReports) || importedReports.length === 0) {
    throw new Error('Die ausgewählte Datei enthält keine gültigen Berichtsdaten.');
  }

  const reportsRef = collection(db, REPORTS_COLLECTION);
  let count = 0;

  // In Chunks von 250 speichern (Firestore Batch Limit ist 500)
  const chunkSize = 250;
  for (let i = 0; i < importedReports.length; i += chunkSize) {
    const chunk = importedReports.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach((rep) => {
      // Neue ID für den Import generieren oder bestehende nutzen
      const newDocRef = rep.id ? doc(db, REPORTS_COLLECTION, rep.id) : doc(reportsRef);
      const cleanData: any = { ...rep };
      delete cleanData.id;
      batch.set(newDocRef, cleanData);
      count++;
    });

    await batch.commit();
  }

  return count;
}

// 9. Alle Berichte eines bestimmten Schuljahres bereinigen (nachdem ein Backup erstellt wurde)
export async function clearReportsBySchoolYear(reportsToDelete: PraxisReport[]): Promise<number> {
  let count = 0;
  const chunkSize = 250;

  for (let i = 0; i < reportsToDelete.length; i += chunkSize) {
    const chunk = reportsToDelete.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach((rep) => {
      if (rep.id) {
        batch.delete(doc(db, REPORTS_COLLECTION, rep.id));
        count++;
      }
    });

    await batch.commit();
  }

  return count;
}

// 10. Klasse eines Schülers durch die Lehrkraft ändern (z.B. bei Wiederholung oder Klassenwechsel)
export async function updateStudentClass(
  reportId: string,
  newClass: string,
  studentCode?: string,
  schoolYear?: string
): Promise<void> {
  // Lokalen Mock aktualisieren, falls zutreffend
  const testIdx = INITIAL_TEST_REPORTS.findIndex((r) => r.id === reportId);
  if (testIdx >= 0) {
    INITIAL_TEST_REPORTS[testIdx].studentClass = newClass;
  }

  // In Firestore aktualisieren (falls ID kein reiner initialer Testschlüssel oder wenn in DB vorhanden)
  try {
    const reportDoc = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(reportDoc, {
      studentClass: newClass,
      updatedAt: new Date().toISOString(),
    });

    // Optional: Alle weiteren Berichte dieses Schülers im selben Schuljahr angleichen
    if (studentCode && schoolYear) {
      const q = query(
        collection(db, REPORTS_COLLECTION),
        where('studentCode', '==', studentCode.toUpperCase().trim())
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let batchCount = 0;
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (d.id !== reportId && normalizeSchoolYear(data.schoolYear) === normalizeSchoolYear(schoolYear)) {
          batch.update(d.ref, {
            studentClass: newClass,
            updatedAt: new Date().toISOString(),
          });
          batchCount++;
        }
      });
      if (batchCount > 0) {
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Hinweis beim Aktualisieren der Klasse in Firestore:', err);
  }
}

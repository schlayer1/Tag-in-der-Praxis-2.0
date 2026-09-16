import { PraxisReport, AiFeedback, StudentPortfolioReport } from '../types/report';

export function getGeminiApiKey(): string {
  const fromEnv = import.meta.env.VITE_GEMINI_API_KEY || '';
  const fromLocal = localStorage.getItem('gemini_api_key') || '';
  return fromLocal.trim() || fromEnv.trim();
}

export function saveGeminiApiKey(key: string): void {
  localStorage.setItem('gemini_api_key', key.trim());
}

// Dynamisches Modell-Matching wie in der bewährten Translatorapp
let cachedWorkingModel: string | null = null;
let cachedApiVersion: string = 'v1beta';

// Bekannte Flash-Modelle in absteigender Versionsreihenfolge als sichere Fallbacks
const FALLBACK_FLASH_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

function extractModelVersion(modelName: string): number {
  const match = modelName.match(/gemini-(\d+(?:\.\d+)?)-flash/);
  return match ? parseFloat(match[1]) : 0;
}

// 1. Automatische & zukunftssichere Modell-Erkennung direkt über die Google API (wie in der Translatorapp)
export async function discoverBestModel(key: string): Promise<{ model: string; version: string }> {
  if (cachedWorkingModel) {
    return { model: cachedWorkingModel, version: cachedApiVersion };
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];

      // Filter: Nur aktive Modelle, die generateContent unterstützen und weder Embedding noch Audio/Spezialmodelle sind
      const availableFlashModels = models
        .filter((m: any) => {
          const name = m.name || '';
          const methods = m.supportedGenerationMethods || [];
          return (
            methods.includes('generateContent') &&
            name.includes('flash') &&
            !name.includes('embedding') &&
            !name.includes('aqa') &&
            !name.includes('tts') &&
            !name.includes('image') &&
            !name.includes('native-audio') &&
            !name.includes('transcribe') &&
            !name.includes('computer-use') &&
            !name.includes('2.0') &&
            !name.includes('2.5') &&
            !name.includes('1.5')
          );
        })
        .map((m: any) => m.name.replace(/^models\//, ''))
        // Automatische Sortierung: Neuere Modellversionen (z. B. 4.0 > 3.8 > 3.7 > 3.6) stehen ganz oben!
        .sort((a: string, b: string) => extractModelVersion(b) - extractModelVersion(a));

      if (availableFlashModels.length > 0) {
        const bestModel = availableFlashModels[0];
        cachedWorkingModel = bestModel;
        cachedApiVersion = 'v1beta';
        console.log(`[Gemini] Zukunftssicheres Modell dynamisch erkannt: ${bestModel}`);
        return { model: bestModel, version: 'v1beta' };
      }
    }
  } catch (e) {
    console.warn('[Gemini] Live-Modellabfrage fehlgeschlagen, nutze Fallbacks:', e);
  }

  // Statischer Fallback-Standard
  return { model: 'gemini-3.8-flash', version: 'v1beta' };
}

// 2. Robuste Ausführung mit automatischem Modell-Wechsel bei Fehlern
async function executeGeminiRequest(key: string, promptText: string): Promise<string> {
  const { model: primaryModel } = await discoverBestModel(key);

  const candidateModels = Array.from(new Set([
    primaryModel,
    ...FALLBACK_FLASH_MODELS,
  ]));

  let lastError: any = null;

  for (const model of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          cachedWorkingModel = model;
          cachedApiVersion = 'v1beta';
          return candidateText;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `HTTP ${response.status}`;
        lastError = new Error(errMsg);

        // Falls ein Modell nicht mehr existiert oder überlastet ist, Cache leeren und nächstes testen
        if (cachedWorkingModel === model) {
          cachedWorkingModel = null;
        }

        if (response.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('key not valid'))) {
          throw new Error('Der eingegebene Gemini API-Schlüssel ist ungültig. Bitte prüfe den Schlüssel.');
        }

        console.warn(`[Gemini] ${model} nicht verfügbar (${errMsg}), probiere Fallback-Modell...`);
      }
    } catch (e: any) {
      lastError = e;
      if (e.message?.includes('ungültig')) {
        throw e;
      }
    }
  }

  throw lastError || new Error('Kein funktionierendes Gemini-Modell erreichbar.');
}

// Helper zur Erstellung des Masterprompts für Einzelberichte (auch für externe KIs nutzbar)
export function buildFeedbackPrompt(report: PraxisReport): string {
  return `Du bist ein erfahrener, empathischer Pädagoge und Betreuungslehrer an der Staatlichen Regelschule »Heimbürgeschule« Kahla in Thüringen.
Deine Aufgabe ist es, den eingereichten Praxisbericht eines Schülers auszuwerten und ein motivierendes, wertschätzendes und konstruktives Feedback für den Schüler zu formulieren.

BERICHTSDATEN DES SCHÜLERS:
- Name: ${report.studentName || 'Schüler/in'}
- Klasse: ${report.studentClass || '—'}
- Betrieb/Firma: ${report.companyName || 'Praktikumsbetrieb'}
- Turnus: ${report.stage}
- Datum: ${report.reportDate} (Arbeitszeit: ${report.startTime} bis ${report.endTime} Uhr)
- 1. Tätigkeitsbeschreibung: ${report.taskDescription || 'Keine Angabe'}
- 2. Tagesablauf (Stunden): ${report.dailySchedule || 'Keine Angabe'}
- 3. Selbsteinschätzung:
  * Hat mir Spaß gemacht: ${report.funRating || 'Nicht bewertet'}
  * Gelangweilt: ${report.boredRating || 'Nicht bewertet'}
  * Neues gelernt: ${report.learnedRating || 'Nicht bewertet'} (Erläuterung: ${report.learnedExplanation || 'Keine'})
  * Überfordert gefühlt: ${report.overwhelmedRating || 'Nicht bewertet'} (Erläuterung: ${report.overwhelmedExplanation || 'Keine'})
  * Kann mir Beruf täglich vorstellen: ${report.careerRating || 'Nicht bewertet'}
- 4. Besondere Erinnerung: ${report.specialMemory || 'Keine Angabe'}

ANFORDERUNGEN AN DEIN FEEDBACK:
1. Formuliere ein persönliches Feedback an den Schüler in der „Du“-Form (z. B. „Liebe/r ${report.studentName || 'Praktikant/in'}, ...“).
2. Gehe konkret auf seine genannten Tätigkeiten und Erfahrungen ein (keine leeren Floskeln).
3. Gehe einfühlsam auf Überforderungen oder Langeweile ein, falls genannt, und ermutige konstruktiv.
4. Gib einen konkreten Impuls oder Tipp für den nächsten Praxistag.
5. Halte das Feedback prägnant (ca. 100 bis 160 Wörter), wohlwollend und professionell.

Antworte bitte STRENG als valides JSON:
{
  "summary": "1-2 Sätze Zusammenfassung für die Lehrkraft über den Praxistag",
  "pedagogicalFeedback": "Das fertige, motivierende Feedback an den Schüler...",
  "strengths": ["Stärke 1", "Stärke 2"],
  "tips": ["Tipp für das nächste Mal"]
}`;
}

// 3. Pädagogisches Feedback für den Praktikumstag generieren
export async function generateFeedbackWithGemini(report: PraxisReport): Promise<AiFeedback> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Kein Gemini API-Schlüssel gefunden. Bitte trage deinen API-Key in den Einstellungen ein.');
  }

  const prompt = buildFeedbackPrompt(report);

  try {
    const rawJson = await executeGeminiRequest(apiKey, prompt);

    const cleanedJson = rawJson
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);

    return {
      generatedAt: new Date().toISOString(),
      summary: parsed.summary || 'Bericht erfolgreich ausgewertet.',
      pedagogicalFeedback: parsed.pedagogicalFeedback || rawJson,
      strengths: parsed.strengths || [],
      tips: parsed.tips || [],
    };
  } catch (err: any) {
    console.error('Gemini Feedback Error:', err);
    throw new Error(err.message || 'Fehler bei der KI-Auswertung.');
  }
}

// Helper zur Erstellung des Masterprompts für das Portfolio (auch für externe KIs nutzbar)
export function buildPortfolioPrompt(
  studentName: string,
  studentClass: string,
  reports: PraxisReport[]
): string {
  const sortedReports = [...reports].sort((a, b) => {
    return (a.stage || '').localeCompare(b.stage || '') || (a.reportDate || '').localeCompare(b.reportDate || '');
  });

  const stagesList = sortedReports.map((r) => r.stage || 'Turnus').join(', ');
  const companiesList = Array.from(new Set(sortedReports.map((r) => r.companyName).filter(Boolean)));
  const schoolYearsList = Array.from(new Set(sortedReports.map((r) => r.schoolYear).filter(Boolean))).join(', ');

  const aggregatedReportsData = sortedReports
    .map((r, idx) => `
TURNUS ${idx + 1}: ${r.stage} (Schuljahr: ${r.schoolYear || 'unbekannt'}, Datum: ${r.reportDate || 'unbekannt'})
- Betrieb / Firma: ${r.companyName || 'Keine Angabe'}
- Arbeitszeit: ${r.startTime || '08:00'} bis ${r.endTime || '15:00'} Uhr
- Tätigkeiten: ${r.taskDescription || 'Keine Angabe'}
- Tagesablauf: ${r.dailySchedule || 'Keine Angabe'}
- Selbsteinschätzung:
  * Spaß gemacht: ${r.funRating || 'keine Angabe'}
  * Gelangweilt: ${r.boredRating || 'keine Angabe'}
  * Neues gelernt: ${r.learnedRating || 'keine Angabe'} ${r.learnedExplanation ? `(Details: ${r.learnedExplanation})` : ''}
  * Überfordert: ${r.overwhelmedRating || 'keine Angabe'} ${r.overwhelmedExplanation ? `(Details: ${r.overwhelmedExplanation})` : ''}
  * Beruf täglich vorstellbar: ${r.careerRating || 'keine Angabe'}
- Besondere Erinnerung: ${r.specialMemory || 'Keine Angabe'}
- Bisheriges Lehrer-Feedback: ${r.teacherFeedback?.comment || 'Noch kein Feedback hinterlegt'}
`)
    .join('\n----------------------------------------\n');

  return `Du bist ein erfahrener Fachlehrer für Berufsorientierung und pädagogischer Betreuer an der Staatlichen Regelschule »Heimbürgeschule« Kahla in Thüringen.
Deine Aufgabe ist es, auf Basis der vorliegenden Praktikumsberichte eines Schülers aus ausgewählten Turnussen einen ganzheitlichen, professionellen Portfolio- und Entwicklungsbericht ("Tag in der Praxis") zu verfassen.

Der Bericht dient als offizieller Entwicklungsnachweis im Berufswahl-Portfolio des Schülers und richtet sich an den Schüler, die Erziehungsberechtigten sowie künftige Ausbildungsbetriebe.
Der Ton ist wertschätzend, entwicklungsfördernd, sachlich fundiert und pädagogisch motivierend.

EINGABEDATEN DES SCHÜLERS:
- Name: ${studentName || 'Schüler/in'}
- Klasse: ${studentClass || '8/9'}
- Betrachtete Turnusse: ${stagesList}
- Beteiligte Betriebe: ${companiesList.join(', ')}
- Schuljahre: ${schoolYearsList || 'Aktuell'}

VORLIEGENDE BERICHTE DER TURNUSSE:
${aggregatedReportsData}

LEITLINIEN FÜR DIE AUSWERTUNG:
1. Praxiserfahrungen: Fasse zusammen, in welchen Betrieben und Berufsfeldern der Schüler praktische Erfahrungen gesammelt hat und welche Kernaufgaben übernommen wurden.
2. Kompetenzen & Stärken: Arbeite heraus, welche praktischen, methodischen und persönlichen Stärken sichtbar wurden (z.B. handwerkliches Geschick, technisches Verständnis, Genauigkeit, Durchhaltevermögen, Teamfähigkeit, Zuverlässigkeit).
3. Lernentwicklung & Reflexion: Analysiere die Entwicklung über die gewählten Turnusse hinweg. Wie reflektiert der Schüler eigene Interessen, Herausforderungen und Lernfortschritte?
4. Berufsorientierungs-Empfehlung & Gesamtfazit: Formuliere konkrete, ermutigende Impulse für passende Berufsfelder, Folgebewerbungen oder Ausbildungsrichtungen.

Antworte STRENG als valides JSON:
{
  "title": "Portfolio-Entwicklungsbericht: Tag in der Praxis",
  "summary": "1-2 prägnante Sätze als Gesamtfazit für den Schüler...",
  "periodCovered": "${stagesList}",
  "practicalExperience": "Fließtext über absolvierte Praktika und Tätigkeiten...",
  "competenciesAndStrengths": [
    "Handwerkliches Geschick: Zeigte besondere Fingerfertigkeit bei...",
    "Zuverlässigkeit: War stets pünktlich und erledigte Aufgaben...",
    "Sorgfalt & Genauigkeit: Bewies hohe Präzision bei...",
    "Technisches Verständnis: Schnelles Erfassen von..."
  ],
  "developmentAndReflection": "Fließtext über den Lernzuwachs, Reifegrad und die Reflexionskompetenz...",
  "careerRecommendations": "Konkrete Empfehlungen für Berufsfelder und nächste Schritte...",
  "overallConclusion": "Persönliches, wertschätzendes Abschlusswort des betreuenden Fachlehrers..."
}`;
}

// 4. KI-Portfolio- und Entwicklungsbericht für Schüler (einzelner, ausgewählte oder alle Turnusse)
export async function generatePortfolioWithGemini(
  studentName: string,
  studentClass: string,
  reports: PraxisReport[]
): Promise<StudentPortfolioReport> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Kein Gemini API-Schlüssel gefunden. Bitte trage deinen API-Key in den Einstellungen ein.');
  }

  if (!reports || reports.length === 0) {
    throw new Error('Keine Berichte für das Portfolio ausgewählt.');
  }

  const prompt = buildPortfolioPrompt(studentName, studentClass, reports);

  const stagesList = reports.map((r) => r.stage || 'Turnus').join(', ');
  const companiesList = Array.from(new Set(reports.map((r) => r.companyName).filter(Boolean)));
  const schoolYearsList = Array.from(new Set(reports.map((r) => r.schoolYear).filter(Boolean))).join(', ');

  try {
    const rawJson = await executeGeminiRequest(apiKey, prompt);

    const cleanedJson = rawJson
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);

    return {
      studentName,
      studentClass,
      periodCovered: parsed.periodCovered || stagesList,
      schoolYears: schoolYearsList,
      companiesInvolved: companiesList,
      generatedAt: new Date().toISOString(),
      title: parsed.title || 'Portfolio-Entwicklungsbericht: Tag in der Praxis',
      summary: parsed.summary || 'Entwicklungsbericht erfolgreich generiert.',
      practicalExperience: parsed.practicalExperience || '',
      competenciesAndStrengths: Array.isArray(parsed.competenciesAndStrengths) ? parsed.competenciesAndStrengths : [],
      developmentAndReflection: parsed.developmentAndReflection || '',
      careerRecommendations: parsed.careerRecommendations || '',
      overallConclusion: parsed.overallConclusion || '',
    };
  } catch (err: any) {
    console.error('Gemini Portfolio Error:', err);
    throw new Error(err.message || 'Fehler bei der KI-Generierung des Portfolios.');
  }
}

export interface FeedbackSnippet {
  id: string;
  category: string;
  label: string;
  text: string;
}

export const DEFAULT_FEEDBACK_SNIPPETS: FeedbackSnippet[] = [
  // Lob & Anerkennung
  {
    id: 'lob-1',
    category: 'Lob & Motivation',
    label: 'Hervorragender Einsatz',
    text: 'Du hast heute einen vorbildlichen Einsatz im Betrieb gezeigt und deine Aufgaben sehr zuverlässig erledigt. Weiter so!',
  },
  {
    id: 'lob-2',
    category: 'Lob & Motivation',
    label: 'Großes Interesse',
    text: 'Es ist schön zu sehen, mit wie viel Neugier und Engagement du an neue Aufgaben herangehst. Ein sehr gelungener Praxistag!',
  },
  {
    id: 'lob-3',
    category: 'Lob & Motivation',
    label: 'Teamarbeit gewürdigt',
    text: 'Deine Bereitschaft, das Team vor Ort tatkräftig zu unterstützen, spiegelt sich deutlich in deinem Bericht wider. Sehr gut gemacht!',
  },

  // Arbeitssicherheit & Sorgfalt
  {
    id: 'sec-1',
    category: 'Arbeitssicherheit & Sorgfalt',
    label: 'Sicherheit beachtet',
    text: 'Sehr gut, dass du auf die Sicherheitsunterweisungen und das Tragen der Schutzkleidung geachtet hast. Sicherheit geht im Betrieb immer vor.',
  },
  {
    id: 'sec-2',
    category: 'Arbeitssicherheit & Sorgfalt',
    label: 'Präzision & Sorgfalt',
    text: 'Du hast deine Arbeitsabläufe präzise beschrieben und gezeigt, dass dir sauberes Arbeiten wichtig ist. Das ist eine wichtige Stärke für das Berufsleben.',
  },

  // Reflexion & Vertiefung
  {
    id: 'ref-1',
    category: 'Reflexion & Impulse',
    label: 'Ehrliche Selbsteinschätzung',
    text: 'Danke für deine ehrliche Reflexion. Auch herausfordernde Momente gehören zum Praktikum dazu und helfen dir herauszufinden, welcher Beruf wirklich zu dir passt.',
  },
  {
    id: 'ref-2',
    category: 'Reflexion & Impulse',
    label: 'Fragen stellen ermutigen',
    text: 'Tipp für den nächsten Praxistag: Trau dich ruhig noch mehr, den Kollegen Fragen zu den verschiedenen Ausbildungswegen in diesem Betrieb zu stellen!',
  },
  {
    id: 'ref-3',
    category: 'Reflexion & Impulse',
    label: 'Detailtiefe im Bericht',
    text: 'Guter Bericht! Versuche beim nächsten Mal noch 1-2 Sätze mehr dazu aufzuschreiben, welche Werkzeuge oder Maschinen du genau kennengelernt hast.',
  },
];

const CUSTOM_SNIPPETS_KEY = 'tip_kahla_custom_feedback_snippets';

export function getCustomFeedbackSnippets(): FeedbackSnippet[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SNIPPETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading custom feedback snippets', e);
    return [];
  }
}

export function saveCustomFeedbackSnippet(snippet: Omit<FeedbackSnippet, 'id'>): FeedbackSnippet {
  const custom = getCustomFeedbackSnippets();
  const newItem: FeedbackSnippet = {
    ...snippet,
    id: 'custom_' + Date.now(),
  };
  custom.push(newItem);
  localStorage.setItem(CUSTOM_SNIPPETS_KEY, JSON.stringify(custom));
  return newItem;
}

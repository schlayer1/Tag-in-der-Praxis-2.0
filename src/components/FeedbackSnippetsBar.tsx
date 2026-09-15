import React, { useState, useEffect } from 'react';
import {
  DEFAULT_FEEDBACK_SNIPPETS,
  getCustomFeedbackSnippets,
  saveCustomFeedbackSnippet,
  FeedbackSnippet,
} from '../constants/feedbackSnippets';
import { MessageSquarePlus, Sparkles, ShieldCheck, HelpCircle, Plus, Check } from 'lucide-react';

interface FeedbackSnippetsBarProps {
  onInsertText: (text: string) => void;
}

export const FeedbackSnippetsBar: React.FC<FeedbackSnippetsBarProps> = ({ onInsertText }) => {
  const [snippets, setSnippets] = useState<FeedbackSnippet[]>(DEFAULT_FEEDBACK_SNIPPETS);
  const [activeCategory, setActiveCategory] = useState<string>('Alle');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newText, setNewText] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Eigene');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const custom = getCustomFeedbackSnippets();
    setSnippets([...DEFAULT_FEEDBACK_SNIPPETS, ...custom]);
  }, []);

  const categories = ['Alle', ...Array.from(new Set(snippets.map((s) => s.category)))];

  const filteredSnippets =
    activeCategory === 'Alle'
      ? snippets
      : snippets.filter((s) => s.category === activeCategory);

  const handleSelectSnippet = (snippet: FeedbackSnippet) => {
    onInsertText(snippet.text);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newText.trim()) return;
    const added = saveCustomFeedbackSnippet({
      category: newCategory.trim() || 'Eigene Bausteine',
      label: newLabel.trim(),
      text: newText.trim(),
    });
    setSnippets((prev) => [...prev, added]);
    setNewLabel('');
    setNewText('');
    setShowAddModal(false);
  };

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('Lob')) return <Sparkles className="w-3 h-3 text-amber-500" />;
    if (cat.includes('Sicherheit')) return <ShieldCheck className="w-3 h-3 text-blue-500" />;
    if (cat.includes('Reflexion')) return <HelpCircle className="w-3 h-3 text-purple-500" />;
    return <MessageSquarePlus className="w-3 h-3 text-emerald-500" />;
  };

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <MessageSquarePlus className="w-3.5 h-3.5 text-school-blue" />
          <span>Schnellbausteine für Lehrkräfte:</span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                activeCategory === cat
                  ? 'bg-school-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            title="Eigenen Textbaustein anlegen"
            className="p-1 rounded-md bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border border-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Snippet Buttons Grid */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {filteredSnippets.map((snippet) => {
          const isCopied = copiedId === snippet.id;
          return (
            <button
              key={snippet.id}
              type="button"
              onClick={() => handleSelectSnippet(snippet)}
              title={snippet.text}
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all duration-150 active:scale-[0.98] ${
                isCopied
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-school-blue/40 text-slate-700'
              }`}
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
              ) : (
                getCategoryIcon(snippet.category)
              )}
              <span>{snippet.label}</span>
            </button>
          );
        })}
      </div>

      {/* Add Custom Snippet Modal */}
      {showAddModal && (
        <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-md space-y-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800">Neuen Baustein hinzufügen</span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Kurzer Titel (z.B. Pünktlichkeit)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-school-blue focus:outline-none"
            />
            <input
              type="text"
              placeholder="Kategorie (z.B. Verhalten)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-school-blue focus:outline-none"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Der vollständige Textbaustein..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-school-blue focus:outline-none"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSaveNew}
              className="px-3 py-1 rounded bg-school-blue text-white text-xs font-bold shadow-xs hover:bg-school-darkblue"
            >
              Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

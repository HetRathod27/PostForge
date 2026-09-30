import React, { useState } from "react";
import { StoryFact, FactKind } from "../types.ts";
import {
  MessageSquareQuote,
  Hash,
  User,
  Wrench,
  Lightbulb,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

interface StoryFactsPanelProps {
  facts: StoryFact[];
  onToggleFact: (id: string) => void;
  onUpdateFactText: (id: string, newText: string) => void;
  onDeleteFact: (id: string) => void;
  onAddFact: (text: string, kind: FactKind) => void;
  isAnalyzing?: boolean;
}

export const StoryFactsPanel: React.FC<StoryFactsPanelProps> = ({
  facts,
  onToggleFact,
  onUpdateFactText,
  onDeleteFact,
  onAddFact,
  isAnalyzing,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newFactText, setNewFactText] = useState("");
  const [newFactKind, setNewFactKind] = useState<FactKind>("takeaway");

  const enabledCount = facts.filter((f) => f.enabled).length;

  const getKindIcon = (kind: FactKind) => {
    switch (kind) {
      case "quote":
        return <MessageSquareQuote className="w-3.5 h-3.5 text-blue-400" />;
      case "number":
        return <Hash className="w-3.5 h-3.5 text-amber-400" />;
      case "person":
        return <User className="w-3.5 h-3.5 text-purple-400" />;
      case "tool":
        return <Wrench className="w-3.5 h-3.5 text-emerald-400" />;
      case "takeaway":
        return <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />;
      case "setting":
        return <MapPin className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const handleStartEdit = (f: StoryFact) => {
    setEditingId(f.id);
    setEditText(f.text);
  };

  const handleSaveEdit = (id: string) => {
    if (editText.trim()) {
      onUpdateFactText(id, editText.trim());
    }
    setEditingId(null);
  };

  const handleCreateFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactText.trim()) return;
    onAddFact(newFactText.trim(), newFactKind);
    setNewFactText("");
    setIsAdding(false);
  };

  return (
    <div className="rounded-xl theme-panel p-3.5 sm:p-5 space-y-3 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Layers className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          <h3 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main">
            Story Facts (Grounded Pool)
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
            {enabledCount}/{facts.length} active
          </span>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add Fact</span>
        </button>
      </div>

      <p className="text-[11px] theme-text-sub leading-normal">
        Posts are strictly synthesized from <span className="text-violet-600 dark:text-violet-300 font-medium">enabled facts</span>.
        Toggle chips off to exclude specific details from regeneration.
      </p>

      {/* Inline Add Fact Box */}
      {isAdding && (
        <form
          onSubmit={handleCreateFact}
          className="p-3 theme-subpanel rounded-lg space-y-2 animate-in fade-in duration-150"
        >
          <input
            type="text"
            value={newFactText}
            onChange={(e) => setNewFactText(e.target.value)}
            placeholder="Type verified fact (e.g. 'Keynote speaker was Sarah Chen')..."
            autoFocus
            className="w-full px-2.5 py-1.5 theme-input rounded text-xs focus:outline-none focus:border-violet-500"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs theme-text-sub">
              <span className="text-[11px]">Type:</span>
              <select
                value={newFactKind}
                onChange={(e) => setNewFactKind(e.target.value as FactKind)}
                className="theme-input rounded px-2 py-1 text-[11px] focus:outline-none"
              >
                <option value="takeaway">Takeaway</option>
                <option value="tool">Tool</option>
                <option value="number">Number / Metric</option>
                <option value="quote">Quote</option>
                <option value="person">Person</option>
                <option value="setting">Setting / Venue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2 py-1 text-xs theme-text-sub hover:opacity-80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFactText.trim()}
                className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Fact Chips List */}
      {facts.length === 0 ? (
        <div className="py-6 text-center text-xs theme-text-muted border border-dashed border-slate-300 dark:border-neutral-800 rounded-lg">
          {isAnalyzing ? (
            <div className="flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Extracting verified facts from text and images...</span>
            </div>
          ) : (
            <span>No facts extracted yet. Type your notes or load the demo to begin.</span>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {facts.map((fact) => {
            const isEditing = editingId === fact.id;

            return (
              <div
                key={fact.id}
                className={`p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2.5 group ${
                  fact.enabled
                    ? "bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 shadow-2xs"
                    : "bg-slate-50 dark:bg-neutral-950 border-slate-200/80 dark:border-neutral-800 text-slate-500 dark:text-neutral-400"
                }`}
              >
                {/* Toggle Checkbox */}
                <input
                  type="checkbox"
                  checked={fact.enabled}
                  onChange={() => onToggleFact(fact.id)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-neutral-700 text-violet-600 focus:ring-violet-500 cursor-pointer accent-violet-600 shrink-0"
                  aria-label={`Toggle fact: ${fact.text}`}
                />

                {/* Kind Icon */}
                <div className="mt-0.5 shrink-0" title={`Kind: ${fact.kind}`}>
                  {getKindIcon(fact.kind)}
                </div>

                {/* Fact Content or Edit Input */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 theme-input rounded text-xs focus:outline-none focus:border-violet-500"
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEdit(fact.id)}
                          className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 theme-text-sub hover:opacity-80 text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className={`leading-relaxed break-words ${!fact.enabled ? "line-through opacity-75" : ""}`}>
                        {fact.text}
                      </span>

                      {/* Source & Kind Tag */}
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] theme-text-muted flex-wrap">
                        <span className="font-mono capitalize px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700/80">
                          {fact.kind}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {fact.source === "image" ? (
                            <>
                              <ImageIcon className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400" />
                              <span>Image {fact.imageIndex !== undefined ? `#${fact.imageIndex + 1}` : ""}</span>
                            </>
                          ) : (
                            <span>Text note</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit & Delete Action Buttons (Visible on mobile touch, hover on desktop) */}
                {!isEditing && (
                  <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(fact)}
                      className="p-1.5 rounded theme-text-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                      title="Edit fact"
                      aria-label="Edit fact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteFact(fact.id)}
                      className="p-1.5 rounded theme-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                      title="Delete fact"
                      aria-label="Delete fact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

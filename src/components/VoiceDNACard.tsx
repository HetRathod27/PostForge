import React, { useState } from "react";
import { VoiceDNA } from "../types.ts";
import {
  Fingerprint,
  RotateCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Ban,
  Quote,
  Sliders,
} from "lucide-react";
import { distillVoiceDNA } from "../services/gemini.ts";

interface VoiceDNACardProps {
  voiceDNA: VoiceDNA;
  onUpdateVoiceDNA: (updated: VoiceDNA) => void;
  onError: (msg: string) => void;
}

export const VoiceDNACard: React.FC<VoiceDNACardProps> = ({
  voiceDNA,
  onUpdateVoiceDNA,
  onError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sample1, setSample1] = useState("");
  const [sample2, setSample2] = useState("");
  const [sample3, setSample3] = useState("");
  const [isDistilling, setIsDistilling] = useState(false);

  const handleToggleEnabled = () => {
    onUpdateVoiceDNA({
      ...voiceDNA,
      enabled: !voiceDNA.enabled,
    });
  };

  const handleDistill = async () => {
    const samples = [sample1, sample2, sample3].filter((s) => s.trim().length > 10);
    if (samples.length === 0) {
      onError("Please paste at least 1 or 2 past post samples to distill your voice.");
      return;
    }

    setIsDistilling(true);
    try {
      const distilled = await distillVoiceDNA(samples);
      onUpdateVoiceDNA({
        ...distilled,
        enabled: true,
      });
      setIsOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to distill voice DNA";
      onError(msg);
    } finally {
      setIsDistilling(false);
    }
  };

  return (
    <div className="rounded-xl theme-panel p-3.5 sm:p-5 space-y-3 transition-colors duration-200">
      {/* Header with Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <Fingerprint className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main">
                Voice DNA
              </h3>
              {voiceDNA.enabled && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] theme-text-sub">
              Matches your authentic writing cadence, habits & vocabulary
            </p>
          </div>
        </div>

        {/* Enable / Disable Switch */}
        <button
          onClick={handleToggleEnabled}
          role="switch"
          aria-checked={voiceDNA.enabled}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            voiceDNA.enabled ? "bg-purple-600" : "bg-slate-300 dark:bg-neutral-800"
          }`}
          title="Toggle Voice DNA on or off"
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              voiceDNA.enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Profile Summary Chips */}
      <div className="p-3 theme-subpanel rounded-lg text-xs space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300">
            Rhythm: {voiceDNA.sentenceLength}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300">
            Emojis: {voiceDNA.emojiHabits}
          </span>
        </div>

        {voiceDNA.sampleStyleSummary && (
          <p className="text-[11px] theme-text-sub italic leading-relaxed">
            &ldquo;{voiceDNA.sampleStyleSummary}&rdquo;
          </p>
        )}

        {/* Favorite Openers & Vocabulary */}
        <div className="pt-2 border-t theme-border grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div>
            <div className="text-[10px] theme-text-muted uppercase font-mono flex items-center gap-1 mb-1">
              <Quote className="w-2.5 h-2.5 opacity-60" />
              Favorite Openers
            </div>
            <div className="flex flex-wrap gap-1">
              {voiceDNA.openers?.slice(0, 3).map((op, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 theme-text-sub text-[10px] truncate max-w-full">
                  {op}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] theme-text-muted uppercase font-mono flex items-center gap-1 mb-1">
              <Ban className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
              Taboo / Avoided Words
            </div>
            <div className="flex flex-wrap gap-1">
              {voiceDNA.tabooWords?.slice(0, 3).map((tw, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-[10px]">
                  {tw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expand Sample Input to Re-distill */}
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-xs theme-text-sub hover:opacity-100 py-1 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Update Voice DNA from past posts</span>
          </span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isOpen && (
          <div className="mt-3 space-y-2 pt-2 border-t theme-border animate-in fade-in duration-150">
            <p className="text-[11px] theme-text-sub">
              Paste 2-3 of your best recent posts. Gemini will reverse-engineer your signature tone.
            </p>

            <textarea
              value={sample1}
              onChange={(e) => setSample1(e.target.value)}
              placeholder="Sample post 1 (paste text here)..."
              rows={2}
              className="w-full px-2.5 py-1.5 theme-input rounded text-xs focus:outline-none focus:border-purple-500"
            />
            <textarea
              value={sample2}
              onChange={(e) => setSample2(e.target.value)}
              placeholder="Sample post 2 (paste text here)..."
              rows={2}
              className="w-full px-2.5 py-1.5 theme-input rounded text-xs focus:outline-none focus:border-purple-500"
            />

            <button
              onClick={handleDistill}
              disabled={isDistilling}
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              {isDistilling ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Distilling Voice DNA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Distill My Voice Profile</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

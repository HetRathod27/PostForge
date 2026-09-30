import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Check } from "lucide-react";

interface HookLabProps {
  altHooks: string[];
  currentHook: string;
  onSelectHook: (newHook: string) => void;
}

export const HookLab: React.FC<HookLabProps> = ({
  altHooks,
  currentHook,
  onSelectHook,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);

  if (!altHooks || altHooks.length === 0) return null;

  return (
    <div className="mt-3 border-t border-slate-200 dark:border-neutral-800/80 pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1 px-2 rounded-lg text-xs font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Hook Lab</span>
          <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 px-1.5 py-0.5 rounded-full font-mono">
            {altHooks.length} options
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-neutral-400">
          <span>{isOpen ? "Hide" : "Explore alternative hooks"}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 px-1">
            Click any alternative hook below to instantly swap it into the post:
          </p>
          {altHooks.map((hook, idx) => {
            const isMatch =
              selectedHookIndex === idx ||
              (currentHook && currentHook.trim() === hook.trim());

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedHookIndex(idx);
                  onSelectHook(hook);
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border flex items-start gap-2 group cursor-pointer ${
                  isMatch
                    ? "bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-xs"
                    : "bg-white dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-neutral-100"
                }`}
              >
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 shrink-0 mt-0.5">
                  #{idx + 1}
                </span>
                <span className="flex-1 leading-snug">{hook}</span>
                {isMatch && (
                  <span className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 flex items-center gap-1 text-[10px] font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

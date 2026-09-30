import React, { useState } from "react";
import { PostScore } from "../types.ts";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface ScoreRingProps {
  score: PostScore;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score }) => {
  const [expanded, setExpanded] = useState(false);

  const avg =
    ((score.hook + score.clarity + score.cta + score.platformFit) / 4).toFixed(1);
  const numAvg = parseFloat(avg);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numAvg / 10) * circumference;

  const color =
    numAvg >= 8.5
      ? "text-emerald-400 stroke-emerald-400"
      : numAvg >= 7.0
      ? "text-cyan-400 stroke-cyan-400"
      : "text-amber-400 stroke-amber-400";

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white dark:bg-neutral-900/80 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700/60 transition-colors text-xs font-mono group shadow-xs cursor-pointer"
        title="View score breakdown"
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r={radius}
              className="stroke-slate-200 dark:stroke-neutral-800"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r={radius}
              className={color}
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[11px] font-bold text-slate-800 dark:text-neutral-200">
            {avg}
          </span>
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-sans font-medium">
            Post Score
          </div>
          <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
            {numAvg >= 8.5 ? "Exceptional" : numAvg >= 7 ? "Strong" : "Good"}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 group-hover:text-slate-700 dark:group-hover:text-neutral-200" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 group-hover:text-slate-700 dark:group-hover:text-neutral-200" />
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-36px)] p-3.5 rounded-xl bg-white dark:bg-neutral-900/95 border border-slate-200 dark:border-neutral-700/80 shadow-2xl backdrop-blur-xl z-30 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800 mb-3">
            <span className="font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              Score Breakdown
            </span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{avg} / 10</span>
          </div>

          <div className="space-y-2 mb-3">
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                <span>Hook Punch</span>
                <span className="font-mono text-slate-800 dark:text-neutral-200">{score.hook}/10</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${score.hook * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                <span>Clarity & Flow</span>
                <span className="font-mono text-slate-800 dark:text-neutral-200">{score.clarity}/10</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${score.clarity * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                <span>Call to Action</span>
                <span className="font-mono text-slate-800 dark:text-neutral-200">{score.cta}/10</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${score.cta * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                <span>Platform Fit</span>
                <span className="font-mono text-slate-800 dark:text-neutral-200">{score.platformFit}/10</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full"
                  style={{ width: `${score.platformFit * 10}%` }}
                />
              </div>
            </div>
          </div>

          {score.notes && (
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/50 text-[11px] text-slate-600 dark:text-neutral-300 italic leading-relaxed">
              &ldquo;{score.notes}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
};

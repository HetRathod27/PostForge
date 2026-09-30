import React from "react";
import { Sparkles, ArrowRight, X, Layers, ShieldCheck, Fingerprint } from "lucide-react";
import { APP_NAME } from "../types.ts";

interface HeroBannerProps {
  onLoadDemo: () => void;
  onDismiss: () => void;
  isWorking: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onLoadDemo,
  onDismiss,
  isWorking,
}) => {
  if (isWorking) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-100/90 via-white/95 to-indigo-100/90 dark:from-violet-950/60 dark:via-neutral-900/90 dark:to-indigo-950/60 border border-violet-300/40 dark:border-violet-500/20 p-4 sm:p-7 mb-5 sm:mb-6 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-all">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-neutral-800/60 transition-colors"
        title="Dismiss intro banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="max-w-3xl space-y-3 sm:space-y-3.5">
        {/* Topic kicker (Clean text metadata, no pill badge) */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multimodal AI Content Studio</span>
        </div>

        {/* Title */}
        <h1 className="font-heading text-lg sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
          Dump raw notes & event slides. <br className="hidden sm:inline" />
          Get <span className="bg-gradient-to-r from-violet-600 via-pink-600 to-indigo-600 dark:from-violet-400 dark:via-pink-400 dark:to-cyan-400 bg-clip-text text-transparent">platform-accurate posts</span> in seconds.
        </h1>

        <p className="text-slate-600 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
          {APP_NAME} turns unstructured event takeaways, slide screenshots, and photos into native posts for{" "}
          <span className="text-[#0a66c2] font-semibold">LinkedIn</span>,{" "}
          <span className="text-pink-600 dark:text-pink-400 font-semibold">Instagram</span>,{" "}
          <span className="font-bold text-slate-900 dark:text-white">X</span>,{" "}
          <span className="text-[#ff4500] font-semibold">Reddit</span>, and{" "}
          <span className="text-[#25D366] font-semibold">WhatsApp</span>—with image-grounded fact extraction, Honesty Guard anti-hallucination, and reusable Voice DNA.
        </p>

        {/* Three Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 pb-1">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-neutral-300 bg-white/90 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 p-2.5 rounded-lg shadow-2xs">
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>Image-grounded facts extracted from slides & badges</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-neutral-300 bg-white/90 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 p-2.5 rounded-lg shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Honesty Guard flags unverified claims in amber</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-neutral-300 bg-white/90 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 p-2.5 rounded-lg shadow-2xs">
            <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Voice DNA distills your authentic sentence rhythm</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-1 flex items-center gap-3">
          <button
            onClick={onLoadDemo}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-violet-600/25 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer"
          >
            <span>Try the Claude Workshop Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

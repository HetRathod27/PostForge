import React from "react";
import {
  Sparkles,
  Download,
  Copy,
  RotateCcw,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { APP_NAME } from "../types.ts";

interface TopBarProps {
  onLoadDemo: () => void;
  onCopyAll: () => void;
  onExportMarkdown: () => void;
  onReset: () => void;
  hasGeneratedPosts: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  isProcessing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onLoadDemo,
  onCopyAll,
  onExportMarkdown,
  onReset,
  hasGeneratedPosts,
  theme,
  onToggleTheme,
  isProcessing,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full theme-topbar backdrop-blur-xl border-b theme-border transition-colors duration-200">
      <div className="max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-pink-600 to-cyan-400 p-[1.5px] flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-400 fill-violet-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-heading font-bold text-base sm:text-lg tracking-tight theme-text-main">
              {APP_NAME}
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20 font-semibold">
              Studio
            </span>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Load Demo Button */}
          <button
            onClick={onLoadDemo}
            disabled={isProcessing}
            className="h-9 px-2 xs:px-2.5 sm:px-3 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-xs flex items-center gap-1 sm:gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95 shrink-0 touch-manipulation"
            title="Load Claude Cowork Workshop sample data and generate all posts"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-200 shrink-0" />
            <span className="hidden sm:inline">Load Demo</span>
            <span className="hidden xs:inline sm:hidden font-medium">Demo</span>
          </button>

          {/* Copy All Button */}
          <button
            onClick={onCopyAll}
            disabled={!hasGeneratedPosts || isProcessing}
            className="h-9 min-w-[36px] sm:min-w-0 px-2 sm:px-3 rounded-lg text-xs font-medium bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-45 disabled:pointer-events-none transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 touch-manipulation"
            title="Copy all generated posts to clipboard"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 shrink-0" />
            <span className="hidden sm:inline">Copy All</span>
          </button>

          {/* Export Markdown Button */}
          <button
            onClick={onExportMarkdown}
            disabled={!hasGeneratedPosts || isProcessing}
            className="h-9 min-w-[36px] sm:min-w-0 px-2 sm:px-3 rounded-lg text-xs font-medium bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-45 disabled:pointer-events-none transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 touch-manipulation"
            title="Export all posts as a formatted .md file"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 shrink-0" />
            <span className="hidden md:inline">Export .md</span>
            <span className="hidden sm:inline md:hidden">Export</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={onReset}
            disabled={isProcessing}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 disabled:opacity-45 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer shrink-0 touch-manipulation"
            title="Reset workspace"
            aria-label="Reset workspace"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer shrink-0 touch-manipulation"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

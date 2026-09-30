import React, { useState } from "react";
import {
  PlatformType,
  StoryFact,
  ToneSettings,
  XPost,
} from "../../types.ts";
import { ScoreRing } from "../ScoreRing.tsx";
import { HookLab } from "../HookLab.tsx";
import { HonestyGuardBadge, highlightGroundedText } from "../HonestyGuardBadge.tsx";
import {
  Copy,
  Check,
  RotateCw,
  Heart,
  Repeat,
  MessageCircle,
  Bookmark,
  Share,
  Sparkles,
  Scissors,
} from "lucide-react";
import { shortenTweetText } from "../../services/gemini.ts";

interface XPreviewProps {
  post: XPost;
  onUpdatePost: (updated: XPost) => void;
  onRegenerate: (platform: PlatformType) => void;
  onRefine: (platform: PlatformType, instruction: string) => Promise<void>;
  enabledFacts: StoryFact[];
  tone: ToneSettings;
  isRegenerating?: boolean;
}

export const XPreview: React.FC<XPreviewProps> = ({
  post,
  onUpdatePost,
  onRegenerate,
  onRefine,
  isRegenerating,
}) => {
  const [viewMode, setViewMode] = useState<"single" | "thread">("single");
  const [copied, setCopied] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [shorteningIndex, setShorteningIndex] = useState<number | "single" | null>(null);

  const threadList = post.thread && post.thread.length > 0 ? post.thread : [post.single];

  const handleFixLength = async (target: "single" | number) => {
    try {
      setShorteningIndex(target);
      if (target === "single") {
        const shortened = await shortenTweetText(post.single, 280);
        onUpdatePost({ ...post, single: shortened });
      } else {
        const textToShorten = threadList[target];
        const shortened = await shortenTweetText(textToShorten, 280);
        const updatedThread = [...threadList];
        updatedThread[target] = shortened;
        onUpdatePost({ ...post, thread: updatedThread });
      }
    } catch (err) {
      console.warn("Failed to shorten tweet:", err);
    } finally {
      setShorteningIndex(null);
    }
  };

  const handleCopy = () => {
    const textToCopy =
      viewMode === "single"
        ? post.single
        : threadList.map((t, i) => `${i + 1}/${threadList.length} ${t}`).join("\n\n");

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveClaim = (claimToRemove: string) => {
    const cleanSingle = post.single.replace(claimToRemove, "").replace(/\s\s+/g, " ").trim();
    const cleanThread = threadList.map((tweet) =>
      tweet.replace(claimToRemove, "").replace(/\s\s+/g, " ").trim()
    );
    const remainingClaims = post.addedClaims.filter(
      (c) => c.toLowerCase() !== claimToRemove.toLowerCase()
    );

    onUpdatePost({
      ...post,
      single: cleanSingle,
      thread: cleanThread,
      addedClaims: remainingClaims,
    });
  };

  const handleSwapHook = (newHook: string) => {
    const updatedThread = [...threadList];
    if (updatedThread.length > 0) {
      updatedThread[0] = newHook.startsWith("1/") ? newHook : `1/ ${newHook}`;
    }
    onUpdatePost({
      ...post,
      single: newHook,
      thread: updatedThread,
    });
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim() || isRefining) return;
    setIsRefining(true);
    try {
      await onRefine("x", refineText);
      setRefineText("");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="rounded-2xl theme-panel overflow-hidden flex flex-col h-full transition-colors duration-200">
      {/* Platform Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50/80 dark:bg-neutral-950/60 border-b theme-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
          <div className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-black border border-slate-700 dark:border-neutral-700 flex items-center justify-center font-bold text-white text-xs">
            𝕏
          </div>
          <span className="font-heading font-semibold text-sm theme-text-main">
            X
          </span>

          {/* Toggle between Single and Thread */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-[11px] ml-1 sm:ml-2 font-medium">
            <button
              onClick={() => setViewMode("single")}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "single"
                  ? "bg-white dark:bg-neutral-950 theme-text-main shadow-sm font-semibold"
                  : "theme-text-muted hover:opacity-100"
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setViewMode("thread")}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "thread"
                  ? "bg-white dark:bg-neutral-950 theme-text-main shadow-sm font-semibold"
                  : "theme-text-muted hover:opacity-100"
              }`}
            >
              Thread ({threadList.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <HonestyGuardBadge
            addedClaims={post.addedClaims}
            usedFactIdsCount={post.usedFactIds.length}
          />
          <ScoreRing score={post.score} />
        </div>
      </div>

      {/* Main X Mock Container */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="bg-slate-50 dark:bg-black rounded-xl p-4 border border-slate-200 dark:border-neutral-800 shadow-sm dark:shadow-inner">
          {viewMode === "single" ? (
            /* Single Tweet View */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    AR
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="text-xs font-bold theme-text-main hover:underline cursor-pointer">
                        Alex Rivera
                      </span>
                      <span className="text-[11px] theme-text-muted font-mono">
                        @alexrivera • 2m
                      </span>
                    </div>
                    <div className="text-[10px] theme-text-sub font-mono">
                      builder & AI engineer
                    </div>
                  </div>
                </div>

                {/* Character Counter & Fix Length */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full ${
                      post.single.length > 280
                        ? "bg-red-500/20 text-red-500 font-bold border border-red-500/40"
                        : post.single.length > 240
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-slate-200 dark:bg-neutral-800 theme-text-sub"
                    }`}
                  >
                    {post.single.length}/280
                  </span>

                  {post.single.length > 280 && (
                    <button
                      onClick={() => handleFixLength("single")}
                      disabled={shorteningIndex === "single"}
                      className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold flex items-center gap-1 shadow animate-pulse cursor-pointer"
                      title="Shorten to <= 280 chars with AI"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>{shorteningIndex === "single" ? "Fixing..." : "Fix length"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tweet Content */}
              <div className="text-[13px] theme-text-main whitespace-pre-line leading-relaxed font-sans pl-1">
                {highlightGroundedText(post.single, post.addedClaims, handleRemoveClaim)}
              </div>

              {/* Action Bar */}
              <div className="pt-2 border-t border-slate-200 dark:border-neutral-900 flex items-center justify-between theme-text-muted text-xs px-1">
                <button className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono">18</span>
                </button>
                <button className="flex items-center gap-1 hover:text-emerald-500 transition-colors cursor-pointer">
                  <Repeat className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono">34</span>
                </button>
                <button className="flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono">192</span>
                </button>
                <button className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono">42</span>
                </button>
                <button className="hover:opacity-100 transition-colors cursor-pointer">
                  <Share className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Thread View with Connecting Line */
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {threadList.map((tweet, index) => {
                const isOverLimit = tweet.length > 280;
                const isLast = index === threadList.length - 1;

                return (
                  <div key={index} className="relative flex gap-3 group">
                    {/* Vertical connecting line */}
                    {!isLast && (
                      <div className="absolute left-4 top-9 bottom-0 w-[2px] bg-slate-200 dark:bg-neutral-800 -mb-4 z-0" />
                    )}

                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 flex items-center justify-center theme-text-main font-bold text-[11px] shrink-0 z-10">
                      {index + 1}
                    </div>

                    <div className="flex-1 space-y-1.5 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold theme-text-main">
                          Tweet {index + 1} of {threadList.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              isOverLimit
                                ? "bg-red-500/20 text-red-500 font-bold"
                                : "bg-slate-200 dark:bg-neutral-800 theme-text-sub"
                            }`}
                          >
                            {tweet.length}/280
                          </span>

                          {isOverLimit && (
                            <button
                              onClick={() => handleFixLength(index)}
                              disabled={shorteningIndex === index}
                              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold flex items-center gap-1 shadow cursor-pointer"
                              title="Shorten this tweet to <= 280 chars"
                            >
                              <Scissors className="w-2.5 h-2.5" />
                              <span>{shorteningIndex === index ? "Fixing..." : "Fix length"}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-xs theme-text-main whitespace-pre-line leading-relaxed font-sans">
                        {highlightGroundedText(tweet, post.addedClaims, handleRemoveClaim)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hook Lab */}
        <HookLab
          altHooks={post.altHooks}
          currentHook={post.single}
          onSelectHook={handleSwapHook}
        />

        {/* Refine Box */}
        <form onSubmit={handleRefineSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Refine (e.g. punchier hook, shorten thread, more contrarian)..."
            className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-slate-500 dark:focus:border-white transition-colors"
          />
          <button
            type="submit"
            disabled={!refineText.trim() || isRefining}
            className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            {isRefining ? (
              <RotateCw className="w-3 h-3 animate-spin text-white" />
            ) : (
              <Sparkles className="w-3 h-3 text-white" />
            )}
            <span>Refine</span>
          </button>
        </form>

        {/* Action Footer */}
        <div className="mt-3 pt-3 border-t theme-border flex items-center justify-between">
          <button
            onClick={() => onRegenerate("x")}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs theme-text-sub hover:opacity-100 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-slate-900 dark:text-white" : ""}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-neutral-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-neutral-950 transition-colors shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : viewMode === "single" ? "Copy Tweet" : "Copy Thread"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

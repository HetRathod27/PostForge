import React, { useState } from "react";
import {
  LinkedInPost,
  PlatformType,
  StoryFact,
  ToneSettings,
} from "../../types.ts";
import { ScoreRing } from "../ScoreRing.tsx";
import { HookLab } from "../HookLab.tsx";
import { HonestyGuardBadge, highlightGroundedText } from "../HonestyGuardBadge.tsx";
import {
  Copy,
  Check,
  RotateCw,
  Send,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Sparkles,
  Globe,
  MoreHorizontal,
} from "lucide-react";

interface LinkedInPreviewProps {
  post: LinkedInPost;
  onUpdatePost: (updated: LinkedInPost) => void;
  onRegenerate: (platform: PlatformType) => void;
  onRefine: (platform: PlatformType, instruction: string) => Promise<void>;
  enabledFacts: StoryFact[];
  tone: ToneSettings;
  isRegenerating?: boolean;
}

export const LinkedInPreview: React.FC<LinkedInPreviewProps> = ({
  post,
  onUpdatePost,
  onRegenerate,
  onRefine,
  isRegenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  const fullText = `${post.hook}\n\n${post.body}\n\n${post.cta}\n\n${post.hashtags.join(" ")}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveClaim = (claimToRemove: string) => {
    const cleanHook = post.hook.replace(claimToRemove, "").replace(/\s\s+/g, " ").trim();
    const cleanBody = post.body.replace(claimToRemove, "").replace(/\s\s+/g, " ").trim();
    const cleanCta = post.cta.replace(claimToRemove, "").replace(/\s\s+/g, " ").trim();
    const remainingClaims = post.addedClaims.filter(
      (c) => c.toLowerCase() !== claimToRemove.toLowerCase()
    );

    onUpdatePost({
      ...post,
      hook: cleanHook,
      body: cleanBody,
      cta: cleanCta,
      addedClaims: remainingClaims,
    });
  };

  const handleSwapHook = (newHook: string) => {
    onUpdatePost({
      ...post,
      hook: newHook,
    });
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim() || isRefining) return;
    setIsRefining(true);
    try {
      await onRefine("linkedin", refineText);
      setRefineText("");
    } finally {
      setIsRefining(false);
    }
  };

  // LinkedIn truncation logic: ~210 characters cutoff
  const charLimit = 210;
  const isLong = fullText.length > charLimit;
  const displayText = expanded || !isLong ? fullText : fullText.slice(0, charLimit);

  return (
    <div className="rounded-2xl theme-panel overflow-hidden flex flex-col h-full transition-colors duration-200">
      {/* Platform Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50/80 dark:bg-neutral-950/60 border-b theme-border flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-6 h-6 rounded bg-[#0a66c2] flex items-center justify-center font-bold text-white text-xs">
            in
          </div>
          <span className="font-heading font-semibold text-sm theme-text-main">
            LinkedIn
          </span>
          <span className="text-[11px] theme-text-muted font-mono">
            {fullText.length} chars
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <HonestyGuardBadge
            addedClaims={post.addedClaims}
            usedFactIdsCount={post.usedFactIds.length}
          />
          <ScoreRing score={post.score} />
        </div>
      </div>

      {/* Main LinkedIn Mock Card */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="bg-slate-50 dark:bg-[#1b1f23] rounded-xl p-4 border border-slate-200 dark:border-neutral-700/60 shadow-sm">
          {/* Post Author Bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow">
                AR
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold theme-text-main hover:text-blue-500 cursor-pointer">
                    Alex Rivera
                  </span>
                  <span className="text-[10px] theme-text-muted">• 1st</span>
                </div>
                <div className="text-[11px] theme-text-sub leading-tight">
                  Building AI Content Systems • Content Engineer
                </div>
                <div className="text-[10px] theme-text-muted flex items-center gap-1 mt-0.5">
                  <span>Just now</span>
                  <span>•</span>
                  <Globe className="w-3 h-3" />
                </div>
              </div>
            </div>
            <button className="theme-text-muted hover:opacity-100 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Post Body with ~210 Char Truncation Fold */}
          <div className="text-[13px] theme-text-main whitespace-pre-line leading-relaxed font-sans">
            {highlightGroundedText(displayText, post.addedClaims, handleRemoveClaim)}
            {isLong && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-blue-600 dark:text-blue-400 font-medium ml-1 cursor-pointer inline-block"
              >
                ...see more
              </button>
            )}
            {isLong && expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="text-blue-600 dark:text-blue-400 font-medium ml-1 cursor-pointer block mt-1 text-[11px]"
              >
                Show less
              </button>
            )}
          </div>

          {/* Reactions bar */}
          <div className="mt-4 pt-2.5 border-t border-slate-200 dark:border-neutral-800/80 flex items-center justify-between text-[11px] theme-text-muted">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white">
                  👍
                </span>
                <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] text-white">
                  👏
                </span>
                <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] text-white">
                  💡
                </span>
              </div>
              <span className="ml-1 font-mono">148</span>
            </div>
            <div className="flex gap-2">
              <span>24 comments</span>
              <span>•</span>
              <span>6 reposts</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-around theme-text-sub text-xs">
            <button className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-200/60 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span className="text-[11px]">Like</span>
            </button>
            <button className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-200/60 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[11px]">Comment</span>
            </button>
            <button className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-200/60 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer">
              <Repeat2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Repost</span>
            </button>
            <button className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-200/60 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer">
              <Send className="w-3.5 h-3.5" />
              <span className="text-[11px]">Send</span>
            </button>
          </div>
        </div>

        {/* Hook Lab */}
        <HookLab
          altHooks={post.altHooks}
          currentHook={post.hook}
          onSelectHook={handleSwapHook}
        />

        {/* Refine Box */}
        <form onSubmit={handleRefineSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Refine (e.g. make it punchier, shorter, add stat)..."
            className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!refineText.trim() || isRefining}
            className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            {isRefining ? (
              <RotateCw className="w-3 h-3 animate-spin text-blue-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-blue-400" />
            )}
            <span>Refine</span>
          </button>
        </form>

        {/* Action Footer */}
        <div className="mt-3 pt-3 border-t theme-border flex items-center justify-between">
          <button
            onClick={() => onRegenerate("linkedin")}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs theme-text-sub hover:opacity-100 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-blue-400" : ""}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#0a66c2] hover:bg-[#084e96] text-white transition-colors shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Post"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

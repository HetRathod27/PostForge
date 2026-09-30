import React, { useState } from "react";
import {
  PlatformType,
  RedditPost,
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
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface RedditPreviewProps {
  post: RedditPost;
  onUpdatePost: (updated: RedditPost) => void;
  onRegenerate: (platform: PlatformType) => void;
  onRefine: (platform: PlatformType, instruction: string) => Promise<void>;
  enabledFacts: StoryFact[];
  tone: ToneSettings;
  isRegenerating?: boolean;
}

export const RedditPreview: React.FC<RedditPreviewProps> = ({
  post,
  onUpdatePost,
  onRegenerate,
  onRefine,
  isRegenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState(
    post.selectedSubreddit || post.suggestedSubreddits[0] || "r/artificial"
  );
  const [voteCount, setVoteCount] = useState(142);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [refineText, setRefineText] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  const fullText = `**${post.title}**\n\n${post.body}\n\n**TL;DR:** ${post.tldr}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpvote = () => {
    if (userVote === "up") {
      setUserVote(null);
      setVoteCount((prev) => prev - 1);
    } else {
      setVoteCount((prev) => (userVote === "down" ? prev + 2 : prev + 1));
      setUserVote("up");
    }
  };

  const handleDownvote = () => {
    if (userVote === "down") {
      setUserVote(null);
      setVoteCount((prev) => prev + 1);
    } else {
      setVoteCount((prev) => (userVote === "up" ? prev - 2 : prev - 1));
      setUserVote("down");
    }
  };

  const handleRemoveClaim = (claimToRemove: string) => {
    const cleanTitle = post.title.replace(claimToRemove, "").replace(/\s\s+/g, " ").trim();
    const cleanBody = post.body.replace(claimToRemove, "").replace(/\s\s+/g, " ").trim();
    const cleanTldr = post.tldr.replace(claimToRemove, "").replace(/\s\s+/g, " ").trim();
    const remainingClaims = post.addedClaims.filter(
      (c) => c.toLowerCase() !== claimToRemove.toLowerCase()
    );

    onUpdatePost({
      ...post,
      title: cleanTitle,
      body: cleanBody,
      tldr: cleanTldr,
      addedClaims: remainingClaims,
    });
  };

  const handleSwapHook = (newHook: string) => {
    onUpdatePost({
      ...post,
      title: newHook,
    });
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim() || isRefining) return;
    setIsRefining(true);
    try {
      await onRefine("reddit", refineText);
      setRefineText("");
    } finally {
      setIsRefining(false);
    }
  };

  const riskColor =
    post.selfPromoRisk === "low"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      : post.selfPromoRisk === "medium"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
      : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";

  return (
    <div className="rounded-2xl theme-panel overflow-hidden flex flex-col h-full transition-colors duration-200">
      {/* Platform Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50/80 dark:bg-neutral-950/60 border-b theme-border flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-6 h-6 rounded-full bg-[#ff4500] flex items-center justify-center font-bold text-white text-xs">
            r/
          </div>
          <span className="font-heading font-semibold text-sm theme-text-main">
            Reddit
          </span>
          <span className="text-[11px] theme-text-muted font-mono">
            community-first
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

      {/* Main Reddit Mock Container */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
        {/* Subreddit Chip Selector */}
        <div className="mb-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] theme-text-muted font-medium">Target sub:</span>
          {post.suggestedSubreddits.map((sub, i) => (
            <button
              key={i}
              onClick={() => setSelectedSubreddit(sub)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono transition-colors cursor-pointer ${
                selectedSubreddit === sub
                  ? "bg-[#ff4500]/15 text-[#ff4500] border border-[#ff4500]/40 font-semibold"
                  : "bg-slate-100 dark:bg-neutral-800 theme-text-sub hover:opacity-100"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-[#121316] rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm dark:shadow-inner overflow-hidden flex">
          {/* Left Vote Rail */}
          <div className="w-10 bg-slate-50 dark:bg-neutral-950/50 p-2 flex flex-col items-center gap-1 border-r border-slate-200 dark:border-neutral-800/80 shrink-0">
            <button
              onClick={handleUpvote}
              className={`p-1 rounded hover:bg-slate-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                userVote === "up" ? "text-[#ff4500]" : "theme-text-muted"
              }`}
            >
              <ArrowBigUp className="w-5 h-5 fill-current" />
            </button>
            <span
              className={`text-xs font-mono font-bold ${
                userVote === "up"
                  ? "text-[#ff4500]"
                  : userVote === "down"
                  ? "text-blue-500"
                  : "theme-text-main"
              }`}
            >
              {voteCount}
            </span>
            <button
              onClick={handleDownvote}
              className={`p-1 rounded hover:bg-slate-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                userVote === "down" ? "text-blue-500" : "theme-text-muted"
              }`}
            >
              <ArrowBigDown className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* Right Post Area */}
          <div className="flex-1 p-3.5 space-y-2.5">
            {/* Post Meta */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold theme-text-main hover:underline cursor-pointer">
                  {selectedSubreddit}
                </span>
                <span className="theme-text-muted">•</span>
                <span className="theme-text-sub">Posted by u/curious_builder</span>
                <span className="theme-text-muted">2 hours ago</span>
              </div>

              {/* Self Promo Risk Pill */}
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${riskColor}`}
                title={post.selfPromoReason}
              >
                {post.selfPromoRisk === "low" ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>Promo: {post.selfPromoRisk.toUpperCase()}</span>
              </div>
            </div>

            {/* Post Title */}
            <h3 className="text-sm sm:text-base font-bold theme-text-main leading-snug">
              {highlightGroundedText(post.title, post.addedClaims, handleRemoveClaim)}
            </h3>

            {/* Post Body */}
            <div className="text-xs theme-text-sub whitespace-pre-line leading-relaxed font-sans max-h-56 overflow-y-auto pr-1">
              {highlightGroundedText(post.body, post.addedClaims, handleRemoveClaim)}
            </div>

            {/* TL;DR Box */}
            {post.tldr && (
              <div className="p-2.5 rounded-lg theme-subpanel text-xs">
                <span className="font-bold text-[#ff4500] mr-1">TL;DR:</span>
                <span className="theme-text-main">
                  {highlightGroundedText(post.tldr, post.addedClaims, handleRemoveClaim)}
                </span>
              </div>
            )}

            {/* Reddit Footer Actions */}
            <div className="pt-2 flex items-center gap-4 theme-text-muted text-xs">
              <button className="flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors cursor-pointer">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>38 Comments</span>
              </button>
              <button className="flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors cursor-pointer">
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button className="flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors cursor-pointer">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hook Lab */}
        <HookLab
          altHooks={post.altHooks}
          currentHook={post.title}
          onSelectHook={handleSwapHook}
        />

        {/* Refine Box */}
        <form onSubmit={handleRefineSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Refine (e.g. less promotional, deeper technical detail)..."
            className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#ff4500] transition-colors"
          />
          <button
            type="submit"
            disabled={!refineText.trim() || isRefining}
            className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            {isRefining ? (
              <RotateCw className="w-3 h-3 animate-spin text-[#ff7744]" />
            ) : (
              <Sparkles className="w-3 h-3 text-[#ff7744]" />
            )}
            <span>Refine</span>
          </button>
        </form>

        {/* Action Footer */}
        <div className="mt-3 pt-3 border-t theme-border flex items-center justify-between">
          <button
            onClick={() => onRegenerate("reddit")}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs theme-text-sub hover:opacity-100 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-[#ff4500]" : ""}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#ff4500] hover:bg-[#e03d00] text-white transition-colors shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Post"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import {
  PlatformType,
  StoryFact,
  ToneSettings,
  WhatsAppPost,
} from "../../types.ts";
import { ScoreRing } from "../ScoreRing.tsx";
import { HookLab } from "../HookLab.tsx";
import { HonestyGuardBadge, highlightGroundedText } from "../HonestyGuardBadge.tsx";
import {
  Copy,
  Check,
  RotateCw,
  CheckCheck,
  Sparkles,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react";

interface WhatsAppPreviewProps {
  post: WhatsAppPost;
  onUpdatePost: (updated: WhatsAppPost) => void;
  onRegenerate: (platform: PlatformType) => void;
  onRefine: (platform: PlatformType, instruction: string) => Promise<void>;
  enabledFacts: StoryFact[];
  tone: ToneSettings;
  isRegenerating?: boolean;
}

export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({
  post,
  onUpdatePost,
  onRegenerate,
  onRefine,
  isRegenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(post.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveClaim = (claimToRemove: string) => {
    const cleanMessage = post.message
      .replace(claimToRemove, "")
      .replace(/\s\s+/g, " ")
      .trim();
    const remainingClaims = post.addedClaims.filter(
      (c) => c.toLowerCase() !== claimToRemove.toLowerCase()
    );

    onUpdatePost({
      ...post,
      message: cleanMessage,
      addedClaims: remainingClaims,
    });
  };

  const handleSwapHook = (newHook: string) => {
    // Replace first paragraph/sentence with newHook
    const lines = post.message.split("\n");
    lines[0] = newHook;
    onUpdatePost({
      ...post,
      message: lines.join("\n"),
    });
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim() || isRefining) return;
    setIsRefining(true);
    try {
      await onRefine("whatsapp", refineText);
      setRefineText("");
    } finally {
      setIsRefining(false);
    }
  };

  // Convert WhatsApp markdown like *bold* to bold text visually
  const renderFormattedWhatsApp = (content: string) => {
    return highlightGroundedText(content, post.addedClaims, handleRemoveClaim);
  };

  return (
    <div className="rounded-2xl theme-panel overflow-hidden flex flex-col h-full transition-colors duration-200">
      {/* Platform Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50/80 dark:bg-neutral-950/60 border-b theme-border flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center font-bold text-white text-xs shadow-xs">
            WA
          </div>
          <span className="font-heading font-semibold text-sm theme-text-main">
            WhatsApp
          </span>
          <span className="text-[11px] theme-text-muted font-mono">
            community broadcast
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

      {/* Main WhatsApp Mock Container */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
        {/* WhatsApp Chat Shell */}
        <div className="rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-md dark:shadow-2xl">
          {/* WhatsApp Chat Top Header */}
          <div className="px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                CF
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">
                  AI Founders & Builders
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400">
                  Alex, Priya, Dev, Rohan + 184 others
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-neutral-400">
              <Video className="w-4 h-4 cursor-pointer hover:text-slate-800 dark:hover:text-white" />
              <Phone className="w-3.5 h-3.5 cursor-pointer hover:text-slate-800 dark:hover:text-white" />
              <MoreVertical className="w-4 h-4 cursor-pointer hover:text-slate-800 dark:hover:text-white" />
            </div>
          </div>

          {/* Chat Background & Message Bubble */}
          <div
            className="p-4 min-h-[220px] max-h-[360px] overflow-y-auto flex flex-col justify-end bg-[#efeae2] dark:bg-[#0b141a]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* Date divider */}
            <div className="flex justify-center mb-3">
              <span className="px-2.5 py-0.5 rounded-md bg-white/80 dark:bg-[#182229] text-[10px] text-slate-600 dark:text-neutral-400 font-mono shadow-xs border border-slate-200/60 dark:border-neutral-700/40">
                TODAY
              </span>
            </div>

            {/* Outgoing Message Bubble */}
            <div className="max-w-[88%] ml-auto bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-neutral-100 rounded-2xl rounded-tr-sm p-3.5 shadow-sm relative group border border-emerald-200/40 dark:border-emerald-600/30">
              <div className="text-xs sm:text-[13px] whitespace-pre-line leading-relaxed font-sans pr-1">
                {renderFormattedWhatsApp(post.message)}
              </div>

              {/* Timestamp & double ticks */}
              <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-500 dark:text-emerald-200/70 font-mono">
                <span>10:42 AM</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
              </div>
            </div>
          </div>
        </div>

        {/* Hook Lab */}
        <HookLab
          altHooks={post.altHooks}
          currentHook={post.message.split("\n")[0] || ""}
          onSelectHook={handleSwapHook}
        />

        {/* Refine Box */}
        <form onSubmit={handleRefineSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Refine (e.g. shorter, more emojis, direct question)..."
            className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#25D366] transition-colors"
          />
          <button
            type="submit"
            disabled={!refineText.trim() || isRefining}
            className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            {isRefining ? (
              <RotateCw className="w-3 h-3 animate-spin text-[#25D366]" />
            ) : (
              <Sparkles className="w-3 h-3 text-[#25D366]" />
            )}
            <span>Refine</span>
          </button>
        </form>

        {/* Action Footer */}
        <div className="mt-3 pt-3 border-t theme-border flex items-center justify-between">
          <button
            onClick={() => onRegenerate("whatsapp")}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs theme-text-sub hover:opacity-100 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-[#25D366]" : ""}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-neutral-950 transition-colors shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Broadcast"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

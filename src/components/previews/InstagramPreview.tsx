import React, { useState, useRef, useEffect } from "react";
import {
  InstagramPost,
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
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Sparkles,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { toPng } from "html-to-image";

interface InstagramPreviewProps {
  post: InstagramPost;
  onUpdatePost: (updated: InstagramPost) => void;
  onRegenerate: (platform: PlatformType) => void;
  onRefine: (platform: PlatformType, instruction: string) => Promise<void>;
  enabledFacts: StoryFact[];
  tone: ToneSettings;
  isRegenerating?: boolean;
}

export const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  post,
  onUpdatePost,
  onRegenerate,
  onRefine,
  isRegenerating,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  const slides = post.carouselSlides && post.carouselSlides.length > 0
    ? post.carouselSlides
    : [{ title: "Key Takeaway", body: post.caption }];

  const totalSlides = slides.length;

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNextSlide();
      if (e.key === "ArrowLeft") handlePrevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSlides]);

  const fullCopyText = `${post.caption}\n\n${post.hashtags.join(" ")}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCopyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSlide = async () => {
    if (!slideRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(slideRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `instagram-slide-${currentSlideIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.warn("Failed to download slide PNG:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemoveClaim = (claimToRemove: string) => {
    const cleanCaption = post.caption.replace(claimToRemove, "").replace(/\s\s+/g, " ").trim();
    const remainingClaims = post.addedClaims.filter(
      (c) => c.toLowerCase() !== claimToRemove.toLowerCase()
    );

    onUpdatePost({
      ...post,
      caption: cleanCaption,
      addedClaims: remainingClaims,
    });
  };

  const handleSwapHook = (newHook: string) => {
    const updatedSlides = [...slides];
    if (updatedSlides.length > 0) {
      updatedSlides[0] = { ...updatedSlides[0], title: newHook };
    }
    const captionLines = post.caption.split("\n");
    captionLines[0] = newHook;

    onUpdatePost({
      ...post,
      caption: captionLines.join("\n"),
      carouselSlides: updatedSlides,
    });
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim() || isRefining) return;
    setIsRefining(true);
    try {
      await onRefine("instagram", refineText);
      setRefineText("");
    } finally {
      setIsRefining(false);
    }
  };

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div className="rounded-2xl theme-panel overflow-hidden flex flex-col h-full transition-colors duration-200">
      {/* Platform Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50/80 dark:bg-neutral-950/60 border-b theme-border flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
            IG
          </div>
          <span className="font-heading font-semibold text-sm theme-text-main">
            Instagram
          </span>
          <span className="text-[11px] theme-text-muted font-mono">
            {totalSlides} slides
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

      {/* Main Instagram Mock Card */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm dark:shadow-2xl">
          {/* Post Header */}
          <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-neutral-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[11px] font-bold text-white">
                  AR
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold theme-text-main leading-tight">
                  alex.rivera
                </div>
                <div className="text-[10px] theme-text-muted">Original audio</div>
              </div>
            </div>
            <button className="theme-text-muted hover:opacity-100 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Swipeable Carousel Slide Preview */}
          <div className="relative aspect-square max-h-[360px] bg-neutral-950 overflow-hidden select-none">
            <div
              ref={slideRef}
              className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-neutral-900 via-indigo-950/40 to-purple-950/60 relative"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Slide Counter Pill */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] tracking-widest uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 backdrop-blur-md">
                  PostForge Studio
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-white/90 backdrop-blur-md">
                  {currentSlideIndex + 1} / {totalSlides}
                </span>
              </div>

              {/* Slide Content */}
              <div className="my-auto z-10 space-y-3">
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-white tracking-tight leading-snug drop-shadow-md">
                  {currentSlide.title}
                </h3>
                <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {currentSlide.body}
                </p>
              </div>

              {/* Slide Footer */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 z-10 pt-2 border-t border-white/10">
                <span>Swipe to learn &rarr;</span>
                <span className="text-pink-400 font-medium">@alex.rivera</span>
              </div>
            </div>

            {/* Navigation Arrows */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors backdrop-blur-md z-20 cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors backdrop-blur-md z-20 cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Download Button on Slide */}
            <button
              onClick={handleDownloadSlide}
              disabled={isDownloading}
              className="absolute top-3 left-3 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity px-2 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-mono rounded flex items-center gap-1 z-20 backdrop-blur-md cursor-pointer"
              title="Download current slide as PNG"
            >
              <Download className="w-3 h-3" />
              <span>{isDownloading ? "Saving..." : "PNG"}</span>
            </button>
          </div>

          {/* Carousel Dots */}
          {totalSlides > 1 && (
            <div className="py-2 flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-neutral-950">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentSlideIndex
                      ? "w-4 bg-pink-500"
                      : "w-1.5 bg-slate-300 dark:bg-neutral-700 hover:bg-slate-400 dark:hover:bg-neutral-500"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="p-3 border-t border-slate-100 dark:border-neutral-900 flex items-center justify-between text-slate-700 dark:text-neutral-200">
            <div className="flex items-center gap-4">
              <button className="hover:text-rose-500 transition-colors cursor-pointer">
                <Heart className="w-5 h-5" />
              </button>
              <button className="hover:text-blue-500 transition-colors cursor-pointer">
                <MessageCircle className="w-5 h-5" />
              </button>
              <button className="hover:text-emerald-500 transition-colors cursor-pointer">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <button className="hover:text-amber-500 transition-colors cursor-pointer">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>

          {/* Caption */}
          <div className="px-3 pb-3 text-xs leading-relaxed">
            <span className="font-semibold theme-text-main mr-1.5">alex.rivera</span>
            <span className="theme-text-sub">
              {expandedCaption
                ? highlightGroundedText(post.caption, post.addedClaims, handleRemoveClaim)
                : highlightGroundedText(
                    post.caption.slice(0, 120),
                    post.addedClaims,
                    handleRemoveClaim
                  )}
            </span>
            {post.caption.length > 120 && (
              <button
                onClick={() => setExpandedCaption(!expandedCaption)}
                className="text-pink-600 dark:text-pink-400 hover:underline ml-1 font-medium cursor-pointer"
              >
                {expandedCaption ? "less" : "...more"}
              </button>
            )}

            {/* Hashtags */}
            <div className="mt-2 text-[11px] text-pink-600 dark:text-pink-400/90 leading-tight">
              {post.hashtags.join(" ")}
            </div>
          </div>
        </div>

        {/* Hook Lab */}
        <HookLab
          altHooks={post.altHooks}
          currentHook={slides[0]?.title || ""}
          onSelectHook={handleSwapHook}
        />

        {/* Refine Box */}
        <form onSubmit={handleRefineSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Refine (e.g. punchier cover slide, more visual)..."
            className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-pink-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!refineText.trim() || isRefining}
            className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            {isRefining ? (
              <RotateCw className="w-3 h-3 animate-spin text-pink-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-pink-400" />
            )}
            <span>Refine</span>
          </button>
        </form>

        {/* Action Footer */}
        <div className="mt-3 pt-3 border-t theme-border flex items-center justify-between">
          <button
            onClick={() => onRegenerate("instagram")}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs theme-text-sub hover:opacity-100 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-pink-500" : ""}`} />
            <span>Regenerate</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSlide}
              disabled={isDownloading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium theme-btn-secondary transition-colors cursor-pointer"
              title="Download slide as PNG image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Slide</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white transition-colors shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Caption"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

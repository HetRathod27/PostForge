import React, { useState, useEffect } from "react";
import {
  InstagramPost,
  LinkedInPost,
  PlatformPost,
  PlatformType,
  RedditPost,
  StoryFact,
  ToneSettings,
  WhatsAppPost,
  XPost,
} from "../types.ts";
import { LinkedInPreview } from "./previews/LinkedInPreview.tsx";
import { InstagramPreview } from "./previews/InstagramPreview.tsx";
import { XPreview } from "./previews/XPreview.tsx";
import { RedditPreview } from "./previews/RedditPreview.tsx";
import { WhatsAppPreview } from "./previews/WhatsAppPreview.tsx";
import { PostContentEditor } from "./PostContentEditor.tsx";
import { DeviceFrame } from "./DeviceFrame.tsx";
import {
  Columns2,
  LayoutList,
  Sparkles,
  Layers,
  ArrowRight,
  SplitSquareVertical,
  Eye,
  FileText,
  RotateCw,
} from "lucide-react";

interface OutputStudioProps {
  posts: Record<string, PlatformPost>;
  onUpdatePost: (platform: PlatformType, post: PlatformPost) => void;
  onRegeneratePlatform: (platform: PlatformType) => void;
  onRefinePlatform: (platform: PlatformType, instruction: string) => Promise<void>;
  enabledFacts: StoryFact[];
  tone: ToneSettings;
  isGenerating: boolean;
  regeneratingPlatform: PlatformType | null;
  onLoadDemo: () => void;
}

// Adapts a post from one platform format to another for instant cross-platform previewing
function adaptPostForPreview(
  sourcePost: PlatformPost,
  targetPlatform: PlatformType
): PlatformPost {
  let hook = "";
  let body = "";
  let cta = "What are your thoughts on this?";
  let hashtags = ["#tech", "#learning", "#ai"];

  if ("hook" in sourcePost) {
    const li = sourcePost as LinkedInPost;
    hook = li.hook;
    body = li.body;
    cta = li.cta || cta;
    hashtags = li.hashtags || hashtags;
  } else if ("caption" in sourcePost) {
    const ig = sourcePost as InstagramPost;
    const lines = ig.caption.split("\n\n");
    hook = lines[0] || "";
    body = lines.slice(1).join("\n\n") || ig.caption;
    hashtags = ig.hashtags || hashtags;
  } else if ("single" in sourcePost) {
    const xp = sourcePost as XPost;
    const lines = xp.single.split("\n\n");
    hook = lines[0] || "";
    body = lines.slice(1).join("\n\n") || xp.single;
  } else if ("title" in sourcePost) {
    const rd = sourcePost as RedditPost;
    hook = rd.title;
    body = rd.body;
  } else if ("message" in sourcePost) {
    const wa = sourcePost as WhatsAppPost;
    const lines = wa.message.split("\n\n");
    hook = lines[0] || "";
    body = lines.slice(1).join("\n\n") || wa.message;
  }

  const combinedText = `${hook}\n\n${body}`.trim();

  switch (targetPlatform) {
    case "linkedin":
      return {
        platform: "linkedin",
        hook: hook || combinedText.slice(0, 180),
        body: body || combinedText,
        cta,
        hashtags,
        score: sourcePost.score,
        usedFactIds: sourcePost.usedFactIds || [],
        addedClaims: sourcePost.addedClaims || [],
        altHooks: sourcePost.altHooks || [],
      } as LinkedInPost;

    case "x": {
      const single =
        combinedText.length <= 280
          ? combinedText
          : `${hook}\n\n${body}`.slice(0, 275) + "...";
      const thread = [
        `1/ ${hook}`.slice(0, 280),
        `2/ ${body.slice(0, 270)}`,
        `3/ Key takeaway: ${cta}`.slice(0, 280),
      ];
      return {
        platform: "x",
        single,
        thread,
        score: sourcePost.score,
        usedFactIds: sourcePost.usedFactIds || [],
        addedClaims: sourcePost.addedClaims || [],
        altHooks: sourcePost.altHooks || [],
      } as XPost;
    }

    case "instagram": {
      const slides = [
        { slideNumber: 1, title: hook || "Key Insight", body: "Swipe to learn more →" },
        { slideNumber: 2, title: "The Takeaway", body: body.slice(0, 200) || body },
        { slideNumber: 3, title: "How to Apply", body: cta || "Save this post for later reference." },
      ];
      return {
        platform: "instagram",
        caption: `${hook}\n\n${body}\n\n${cta}`,
        hashtags,
        carouselSlides: slides,
        altText: "Carousel slide preview summarizing key takeaways.",
        score: sourcePost.score,
        usedFactIds: sourcePost.usedFactIds || [],
        addedClaims: sourcePost.addedClaims || [],
        altHooks: sourcePost.altHooks || [],
      } as InstagramPost;
    }

    case "reddit":
      return {
        platform: "reddit",
        suggestedSubreddits: ["r/technology", "r/productivity", "r/startups"],
        title: hook || "Important Takeaways & Lessons Learned",
        body: body || combinedText,
        tldr: hook || combinedText.slice(0, 120),
        selfPromoRisk: "low",
        score: sourcePost.score,
        usedFactIds: sourcePost.usedFactIds || [],
        addedClaims: sourcePost.addedClaims || [],
        altHooks: sourcePost.altHooks || [],
      } as RedditPost;

    case "whatsapp":
      return {
        platform: "whatsapp",
        message: `*${hook}*\n\n${body}\n\n_${cta}_`,
        score: sourcePost.score,
        usedFactIds: sourcePost.usedFactIds || [],
        addedClaims: sourcePost.addedClaims || [],
        altHooks: sourcePost.altHooks || [],
      } as WhatsAppPost;
  }
}

export const OutputStudio: React.FC<OutputStudioProps> = ({
  posts,
  onUpdatePost,
  onRegeneratePlatform,
  onRefinePlatform,
  enabledFacts,
  tone,
  isGenerating,
  regeneratingPlatform,
  onLoadDemo,
}) => {
  // View mode: 'split' (Content + Preview side-by-side), 'side-by-side' (multi-platform grid), 'tabs' (single platform)
  const [viewMode, setViewMode] = useState<"split" | "side-by-side" | "tabs">("split");

  // Active platform for focused views
  const [activePlatform, setActivePlatform] = useState<PlatformType>("linkedin");

  // Which platform is being simulated in the live preview panel
  const [previewPlatform, setPreviewPlatform] = useState<PlatformType>("linkedin");

  // Device simulation mode: desktop vs mobile
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  // Per-card content vs preview toggle in grid mode
  const [cardModes, setCardModes] = useState<Record<string, "preview" | "content">>({});

  const allPlatforms: { id: PlatformType; label: string; icon: string; color: string }[] = [
    { id: "linkedin", label: "LinkedIn", icon: "in", color: "#0a66c2" },
    { id: "instagram", label: "Instagram", icon: "IG", color: "#e1306c" },
    { id: "x", label: "X", icon: "𝕏", color: "#000000" },
    { id: "reddit", label: "Reddit", icon: "r/", color: "#ff4500" },
    { id: "whatsapp", label: "WhatsApp", icon: "WA", color: "#25D366" },
  ];

  // User-selected platforms
  const userSelectedPlatforms =
    tone.selectedPlatforms && tone.selectedPlatforms.length > 0
      ? tone.selectedPlatforms
      : allPlatforms.map((p) => p.id);

  // Sync active platform to first available if current active is not generated
  useEffect(() => {
    if (!posts[activePlatform]) {
      const firstAvailable = userSelectedPlatforms.find((p) => posts[p]);
      if (firstAvailable) {
        setActivePlatform(firstAvailable);
        setPreviewPlatform(firstAvailable);
      }
    }
  }, [posts, activePlatform, userSelectedPlatforms]);

  // When activePlatform changes, match previewPlatform by default
  const handleSelectActivePlatform = (platform: PlatformType) => {
    setActivePlatform(platform);
    setPreviewPlatform(platform);
  };

  const hasAnyPosts = Object.keys(posts).length > 0;

  // Render a specific platform preview component
  const renderPreviewCard = (
    platformToRender: PlatformType,
    postToRender: PlatformPost,
    isRegen: boolean
  ) => {
    switch (platformToRender) {
      case "linkedin":
        return (
          <LinkedInPreview
            key="linkedin"
            post={postToRender as LinkedInPost}
            onUpdatePost={(p) => onUpdatePost("linkedin", p)}
            onRegenerate={onRegeneratePlatform}
            onRefine={onRefinePlatform}
            enabledFacts={enabledFacts}
            tone={tone}
            isRegenerating={isRegen}
          />
        );
      case "instagram":
        return (
          <InstagramPreview
            key="instagram"
            post={postToRender as InstagramPost}
            onUpdatePost={(p) => onUpdatePost("instagram", p)}
            onRegenerate={onRegeneratePlatform}
            onRefine={onRefinePlatform}
            enabledFacts={enabledFacts}
            tone={tone}
            isRegenerating={isRegen}
          />
        );
      case "x":
        return (
          <XPreview
            key="x"
            post={postToRender as XPost}
            onUpdatePost={(p) => onUpdatePost("x", p)}
            onRegenerate={onRegeneratePlatform}
            onRefine={onRefinePlatform}
            enabledFacts={enabledFacts}
            tone={tone}
            isRegenerating={isRegen}
          />
        );
      case "reddit":
        return (
          <RedditPreview
            key="reddit"
            post={postToRender as RedditPost}
            onUpdatePost={(p) => onUpdatePost("reddit", p)}
            onRegenerate={onRegeneratePlatform}
            onRefine={onRefinePlatform}
            enabledFacts={enabledFacts}
            tone={tone}
            isRegenerating={isRegen}
          />
        );
      case "whatsapp":
        return (
          <WhatsAppPreview
            key="whatsapp"
            post={postToRender as WhatsAppPost}
            onUpdatePost={(p) => onUpdatePost("whatsapp", p)}
            onRegenerate={onRegeneratePlatform}
            onRefine={onRefinePlatform}
            enabledFacts={enabledFacts}
            tone={tone}
            isRegenerating={isRegen}
          />
        );
      default:
        return null;
    }
  };

  // Get current active post
  const activePost = posts[activePlatform];

  // Resolve preview post (either dedicated generated post, or adapted from activePost)
  const isDedicatedPreviewPost = !!posts[previewPlatform];
  const resolvedPreviewPost: PlatformPost | null = isDedicatedPreviewPost
    ? posts[previewPlatform]
    : activePost
    ? adaptPostForPreview(activePost, previewPlatform)
    : null;

  const isCurrentPreviewRegenerating =
    isGenerating || regeneratingPlatform === previewPlatform;

  return (
    <div className="space-y-4">
      {/* View Switcher Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b theme-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-pink-500" />
          <h2 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main">
            Platform Studio & Previews
          </h2>
          {hasAnyPosts && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              {Object.keys(posts).length} of {userSelectedPlatforms.length} generated
            </span>
          )}
        </div>

        {/* View Mode Switcher: Split (Content + Preview) | Grid | Focus */}
        <div className="flex items-center bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg p-0.5 text-xs font-medium self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === "split"
                ? "bg-white dark:bg-neutral-800 theme-text-main shadow-xs font-semibold"
                : "theme-text-muted hover:opacity-80"
            }`}
            title="Content editor + Live platform preview side-by-side"
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-violet-500" />
            <span>Content + Preview</span>
          </button>

          <button
            onClick={() => setViewMode("side-by-side")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === "side-by-side"
                ? "bg-white dark:bg-neutral-800 theme-text-main shadow-xs font-semibold"
                : "theme-text-muted hover:opacity-80"
            }`}
            title="Multi-platform grid comparison"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All Platforms</span>
            <span className="sm:hidden">Grid</span>
          </button>

          <button
            onClick={() => setViewMode("tabs")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === "tabs"
                ? "bg-white dark:bg-neutral-800 theme-text-main shadow-xs font-semibold"
                : "theme-text-muted hover:opacity-80"
            }`}
            title="Single platform focus tab"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Focus</span>
          </button>
        </div>
      </div>

      {/* Primary Platform Selector Tabs (In Split & Focus modes) */}
      {(viewMode === "split" || viewMode === "tabs") && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x -mx-1 px-1">
          <span className="text-[11px] theme-text-muted font-medium mr-1 shrink-0">
            Platform:
          </span>
          {allPlatforms.map((p) => {
            const isSelectedByUser = userSelectedPlatforms.includes(p.id);
            const hasPost = !!posts[p.id];
            const isActive = activePlatform === p.id;

            return (
              <button
                key={p.id}
                onClick={() => handleSelectActivePlatform(p.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer shrink-0 touch-manipulation ${
                  isActive
                    ? "bg-slate-900 dark:bg-neutral-800 border-slate-700 dark:border-neutral-600 text-white shadow-xs font-semibold"
                    : "bg-white dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800/80 theme-text-sub hover:opacity-80"
                } ${!isSelectedByUser && !hasPost ? "opacity-45" : ""}`}
                title={
                  isSelectedByUser
                    ? `${p.label} (Selected in Tone Studio)`
                    : `${p.label} (Not selected in Tone Studio)`
                }
              >
                <span
                  className="w-4 h-4 rounded text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.icon}
                </span>
                <span>{p.label}</span>
                {hasPost && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {!hasAnyPosts && !isGenerating ? (
        /* Empty State */
        <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-neutral-800 theme-panel p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[460px]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600/20 via-pink-600/20 to-cyan-500/20 border border-violet-200 dark:border-neutral-700/60 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-xl">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="max-w-md space-y-2">
            <h3 className="font-heading font-bold text-lg theme-text-main">
              No posts generated yet
            </h3>
            <p className="text-xs theme-text-sub leading-relaxed">
              Enter your event notes and upload photos on the left, or test the complete pipeline instantly with realistic workshop notes.
            </p>
          </div>

          <button
            onClick={onLoadDemo}
            className="mt-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/25 transition-all hover:scale-105 cursor-pointer"
          >
            <span>Run Claude Workshop Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : viewMode === "split" ? (
        /* 1. DUAL SPLIT VIEW: Content Editor on Left, Live Mock Feed Preview on Right */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left Column: Structured Content for the Post */}
          <div className="xl:col-span-6 space-y-3">
            {activePost ? (
              <PostContentEditor
                platform={activePlatform}
                post={activePost}
                onUpdatePost={(p) => onUpdatePost(activePlatform, p)}
                onRefine={onRefinePlatform}
                onRegenerate={onRegeneratePlatform}
                isRegenerating={isGenerating || regeneratingPlatform === activePlatform}
              />
            ) : (
              <div className="rounded-2xl theme-panel p-6 flex flex-col items-center justify-center gap-3 min-h-[420px] text-center">
                <Sparkles className="w-8 h-8 text-violet-500 animate-pulse" />
                <h4 className="text-sm font-semibold theme-text-main">
                  {activePlatform.toUpperCase()} post not generated yet
                </h4>
                <p className="text-xs theme-text-sub max-w-xs">
                  Generate a dedicated native post tailored to {activePlatform}&apos;s algorithm and audience.
                </p>
                <button
                  onClick={() => onRegeneratePlatform(activePlatform)}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Generate for {activePlatform}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Live Feed Preview with Cross-Platform Switcher */}
          <div className="xl:col-span-6 space-y-3">
            <div className="p-3 rounded-xl theme-subpanel border theme-border space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Platform Preview Selector: Preview in any user-selected platform */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold theme-text-sub flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-violet-500" />
                    <span>Preview in:</span>
                  </span>
                  {allPlatforms.map((p) => {
                    const isPreviewActive = previewPlatform === p.id;
                    const hasDedicatedPost = !!posts[p.id];

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPreviewPlatform(p.id)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                          isPreviewActive
                            ? "bg-slate-900 dark:bg-neutral-800 text-white border-slate-700 dark:border-neutral-600 font-semibold shadow-xs"
                            : "bg-white dark:bg-neutral-900/60 theme-text-sub border-slate-200 dark:border-neutral-800 hover:opacity-100"
                        }`}
                        title={
                          hasDedicatedPost
                            ? `Preview dedicated native ${p.label} post`
                            : `Preview how content adapts to ${p.label}`
                        }
                      >
                        <span
                          className="w-3 h-3 rounded-xs text-[8px] font-bold text-white flex items-center justify-center shrink-0"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.icon}
                        </span>
                        <span>{p.label}</span>
                        {!hasDedicatedPost && isPreviewActive && (
                          <span className="text-[9px] text-amber-500 font-mono">
                            (Adapted)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isDedicatedPreviewPost && resolvedPreviewPost && (
                <div className="flex items-center justify-between px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                  <span>
                    Viewing live simulation of content on {previewPlatform}.
                  </span>
                  <button
                    onClick={() => onRegeneratePlatform(previewPlatform)}
                    className="font-semibold underline ml-2 hover:opacity-80 cursor-pointer"
                  >
                    Generate full {previewPlatform} version
                  </button>
                </div>
              )}
            </div>

            {/* Preview Frame with Mobile / Desktop Simulator */}
            <DeviceFrame device={device} onChangeDevice={setDevice}>
              {resolvedPreviewPost ? (
                renderPreviewCard(
                  previewPlatform,
                  resolvedPreviewPost,
                  isCurrentPreviewRegenerating
                )
              ) : (
                <div className="rounded-2xl theme-panel p-6 flex flex-col justify-center items-center gap-3 min-h-[420px] animate-pulse">
                  <Sparkles className="w-5 h-5 text-violet-500 animate-spin" />
                  <span className="text-xs theme-text-sub font-medium capitalize">
                    Loading live {previewPlatform} preview...
                  </span>
                </div>
              )}
            </DeviceFrame>
          </div>
        </div>
      ) : viewMode === "side-by-side" ? (
        /* 2. GRID VIEW: All Platforms with per-card Content/Preview toggle */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-6">
          {userSelectedPlatforms.map((platform) => {
            const post = posts[platform];
            const isRegen = isGenerating || regeneratingPlatform === platform;
            const mode = cardModes[platform] || "preview";

            if (!post) {
              if (isGenerating) {
                return (
                  <div
                    key={platform}
                    className="rounded-2xl theme-panel p-6 flex flex-col justify-center items-center gap-3 min-h-[420px] animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-violet-500 animate-spin" />
                    </div>
                    <span className="text-xs theme-text-sub font-medium capitalize">
                      Drafting native {platform} post...
                    </span>
                  </div>
                );
              }
              return null;
            }

            return (
              <div key={platform} className="space-y-2">
                {/* Mini Mode Toggle on each card */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-heading font-semibold capitalize theme-text-main flex items-center gap-1.5">
                    <span>{platform}</span>
                  </span>

                  <div className="flex items-center bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg p-0.5 text-[11px] font-medium">
                    <button
                      type="button"
                      onClick={() =>
                        setCardModes((prev) => ({ ...prev, [platform]: "preview" }))
                      }
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        mode === "preview"
                          ? "bg-white dark:bg-neutral-800 theme-text-main shadow-xs font-semibold"
                          : "theme-text-muted hover:opacity-80"
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCardModes((prev) => ({ ...prev, [platform]: "content" }))
                      }
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        mode === "content"
                          ? "bg-white dark:bg-neutral-800 theme-text-main shadow-xs font-semibold"
                          : "theme-text-muted hover:opacity-80"
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>Content</span>
                    </button>
                  </div>
                </div>

                {mode === "content" ? (
                  <PostContentEditor
                    platform={platform}
                    post={post}
                    onUpdatePost={(p) => onUpdatePost(platform, p)}
                    onRefine={onRefinePlatform}
                    onRegenerate={onRegeneratePlatform}
                    isRegenerating={isRegen}
                  />
                ) : (
                  renderPreviewCard(platform, post, isRegen)
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* 3. TABS FOCUS VIEW */
        <div className="max-w-2xl mx-auto space-y-3">
          {activePost ? (
            renderPreviewCard(
              activePlatform,
              activePost,
              isGenerating || regeneratingPlatform === activePlatform
            )
          ) : (
            <div className="rounded-2xl theme-panel p-8 text-center space-y-3">
              <p className="text-xs theme-text-sub">
                No post generated for {activePlatform} yet.
              </p>
              <button
                onClick={() => onRegeneratePlatform(activePlatform)}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
              >
                Generate {activePlatform} Post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

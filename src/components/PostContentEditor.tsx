import React, { useState } from "react";
import {
  InstagramPost,
  LinkedInPost,
  PlatformPost,
  PlatformType,
  RedditPost,
  WhatsAppPost,
  XPost,
} from "../types.ts";
import { HookLab } from "./HookLab.tsx";
import {
  Copy,
  Check,
  RotateCw,
  Sparkles,
  FileText,
  Hash,
  MessageSquareQuote,
  Target,
  Send,
  Layers,
  Edit3,
} from "lucide-react";

interface PostContentEditorProps {
  platform: PlatformType;
  post: PlatformPost;
  onUpdatePost: (updated: PlatformPost) => void;
  onRefine: (platform: PlatformType, instruction: string) => Promise<void>;
  onRegenerate: (platform: PlatformType) => void;
  isRegenerating?: boolean;
}

export const PostContentEditor: React.FC<PostContentEditorProps> = ({
  platform,
  post,
  onUpdatePost,
  onRefine,
  onRegenerate,
  isRegenerating,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [refineText, setRefineText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [newHashtag, setNewHashtag] = useState("");

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim() || isRefining) return;
    setIsRefining(true);
    try {
      await onRefine(platform, refineText);
      setRefineText("");
    } finally {
      setIsRefining(false);
    }
  };

  const getFullText = () => {
    switch (platform) {
      case "linkedin": {
        const p = post as LinkedInPost;
        return `${p.hook}\n\n${p.body}\n\n${p.cta}\n\n${p.hashtags.join(" ")}`;
      }
      case "instagram": {
        const p = post as InstagramPost;
        return `${p.caption}\n\n${p.hashtags.join(" ")}`;
      }
      case "x": {
        const p = post as XPost;
        return p.single;
      }
      case "reddit": {
        const p = post as RedditPost;
        return `# ${p.title}\n\n${p.body}\n\n**TL;DR:** ${p.tldr}`;
      }
      case "whatsapp": {
        const p = post as WhatsAppPost;
        return p.message;
      }
    }
  };

  // 1. LinkedIn Content Editor
  if (platform === "linkedin") {
    const li = post as LinkedInPost;

    const handleUpdateField = (field: keyof LinkedInPost, value: unknown) => {
      onUpdatePost({
        ...li,
        [field]: value,
      });
    };

    const handleRemoveHashtag = (tagToRemove: string) => {
      handleUpdateField(
        "hashtags",
        li.hashtags.filter((t) => t !== tagToRemove)
      );
    };

    const handleAddHashtag = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newHashtag.trim()) return;
      const formatted = newHashtag.startsWith("#") ? newHashtag.trim() : `#${newHashtag.trim()}`;
      if (!li.hashtags.includes(formatted)) {
        handleUpdateField("hashtags", [...li.hashtags, formatted]);
      }
      setNewHashtag("");
    };

    return (
      <div className="rounded-2xl theme-panel p-3.5 sm:p-5 space-y-4 flex flex-col h-full transition-colors duration-200">
        {/* Top Header & Copy Bar */}
        <div className="flex items-center justify-between pb-3 border-b theme-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h3 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main truncate">
              LinkedIn Post Content
            </h3>
            <span className="text-[11px] theme-text-muted font-mono shrink-0">
              {getFullText().length} chars
            </span>
          </div>

          <button
            onClick={() => copyToClipboard(getFullText(), "all")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0a66c2] hover:bg-[#084e96] text-white transition-all shadow-xs cursor-pointer shrink-0"
            title="Copy entire post to clipboard"
          >
            {copiedSection === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedSection === "all" ? "Copied All!" : "Copy Post"}</span>
            <span className="sm:hidden">{copiedSection === "all" ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Content Fields */}
        <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
          {/* Hook Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold theme-text-sub flex items-center gap-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Opening Hook (Above "...see more")</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] theme-text-muted font-mono">
                  {li.hook.length}c {li.hook.length <= 210 ? "✓" : "(!)"}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(li.hook, "hook")}
                  className="text-[10px] theme-text-muted hover:theme-text-main p-0.5 cursor-pointer"
                  title="Copy Hook"
                >
                  {copiedSection === "hook" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <textarea
              value={li.hook}
              onChange={(e) => handleUpdateField("hook", e.target.value)}
              rows={2}
              className="w-full p-2.5 theme-input rounded-lg text-xs leading-relaxed font-sans focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="First 1-2 lines that stop the scroll..."
            />
          </div>

          {/* Core Body Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold theme-text-sub flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Story & Key Takeaways Body</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] theme-text-muted font-mono">
                  {li.body.split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(li.body, "body")}
                  className="text-[10px] theme-text-muted hover:theme-text-main p-0.5 cursor-pointer"
                  title="Copy Body"
                >
                  {copiedSection === "body" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <textarea
              value={li.body}
              onChange={(e) => handleUpdateField("body", e.target.value)}
              rows={5}
              className="w-full p-2.5 theme-input rounded-lg text-xs leading-relaxed font-sans focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Detailed story, lessons, takeaways, line breaks..."
            />
          </div>

          {/* Call to Action Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold theme-text-sub flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Call to Action (CTA)</span>
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(li.cta, "cta")}
                className="text-[10px] theme-text-muted hover:theme-text-main p-0.5 cursor-pointer"
                title="Copy CTA"
              >
                {copiedSection === "cta" ? "Copied" : "Copy"}
              </button>
            </div>
            <input
              type="text"
              value={li.cta}
              onChange={(e) => handleUpdateField("cta", e.target.value)}
              className="w-full px-2.5 py-1.5 theme-input rounded-lg text-xs focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Engaging closing question or discussion prompt..."
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold theme-text-sub flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Target Hashtags</span>
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(li.hashtags.join(" "), "hashtags")}
                className="text-[10px] theme-text-muted hover:theme-text-main p-0.5 cursor-pointer"
                title="Copy all hashtags"
              >
                {copiedSection === "hashtags" ? "Copied" : "Copy Tags"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {li.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHashtag(tag)}
                    className="hover:text-red-500 text-slate-400 p-0.5 cursor-pointer"
                    title="Remove tag"
                  >
                    ×
                  </button>
                </span>
              ))}
              <form onSubmit={handleAddHashtag} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  placeholder="+ Add #tag"
                  className="w-20 px-1.5 py-0.5 rounded text-[11px] theme-input focus:outline-none focus:w-28 transition-all"
                />
              </form>
            </div>
          </div>

          {/* Hook Lab */}
          <HookLab
            altHooks={li.altHooks}
            currentHook={li.hook}
            onSelectHook={(newHook) => handleUpdateField("hook", newHook)}
          />
        </div>

        {/* Refine Box & Regenerate */}
        <div className="pt-2 border-t theme-border space-y-2">
          <form onSubmit={handleRefineSubmit} className="flex gap-2">
            <input
              type="text"
              value={refineText}
              onChange={(e) => setRefineText(e.target.value)}
              placeholder="Refine (e.g. make it punchier, add stats, shorter)..."
              className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!refineText.trim() || isRefining}
              className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              {isRefining ? <RotateCw className="w-3 h-3 animate-spin text-blue-400" /> : <Sparkles className="w-3 h-3 text-blue-400" />}
              <span>Refine</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={() => onRegenerate("linkedin")}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg theme-text-sub hover:opacity-100 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-blue-400" : ""}`} />
              <span>Regenerate with AI</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Instagram Content Editor
  if (platform === "instagram") {
    const ig = post as InstagramPost;

    const handleUpdateField = (field: keyof InstagramPost, value: unknown) => {
      onUpdatePost({
        ...ig,
        [field]: value,
      });
    };

    return (
      <div className="rounded-2xl theme-panel p-3.5 sm:p-5 space-y-4 flex flex-col h-full transition-colors duration-200">
        <div className="flex items-center justify-between pb-3 border-b theme-border">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-500 shrink-0" />
            <h3 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main truncate">
              Instagram Content & Slides
            </h3>
            <span className="text-[11px] theme-text-muted font-mono shrink-0">
              {ig.carouselSlides?.length || 0} slides
            </span>
          </div>

          <button
            onClick={() => copyToClipboard(getFullText(), "all")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white transition-all shadow-xs cursor-pointer shrink-0"
          >
            {copiedSection === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedSection === "all" ? "Copied!" : "Copy Caption"}</span>
            <span className="sm:hidden">{copiedSection === "all" ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
          {/* Caption */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold theme-text-sub flex items-center justify-between">
              <span>Post Caption</span>
              <span className="text-[10px] theme-text-muted font-mono">{ig.caption.length}/2200</span>
            </label>
            <textarea
              value={ig.caption}
              onChange={(e) => handleUpdateField("caption", e.target.value)}
              rows={4}
              className="w-full p-2.5 theme-input rounded-lg text-xs leading-relaxed font-sans focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          {/* Carousel Slide Outlines */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-semibold theme-text-sub flex items-center gap-1.5">
              <span>Carousel Slides ({ig.carouselSlides.length})</span>
            </label>
            <div className="space-y-2">
              {ig.carouselSlides.map((slide, idx) => (
                <div key={idx} className="p-2.5 theme-subpanel rounded-lg space-y-1 border theme-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] font-bold text-pink-600 dark:text-pink-400">
                      Slide {idx + 1}: {idx === 0 ? "Cover Hook" : idx === ig.carouselSlides.length - 1 ? "CTA" : "Insight"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => {
                      const updated = [...ig.carouselSlides];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      handleUpdateField("carouselSlides", updated);
                    }}
                    className="w-full px-2 py-1 theme-input rounded text-xs font-semibold focus:outline-none"
                    placeholder="Slide headline..."
                  />
                  <textarea
                    value={slide.body}
                    onChange={(e) => {
                      const updated = [...ig.carouselSlides];
                      updated[idx] = { ...updated[idx], body: e.target.value };
                      handleUpdateField("carouselSlides", updated);
                    }}
                    rows={2}
                    className="w-full px-2 py-1 theme-input rounded text-xs focus:outline-none"
                    placeholder="Slide body text..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-semibold theme-text-sub">
              Hashtags ({ig.hashtags.length})
            </label>
            <div className="text-xs text-pink-600 dark:text-pink-400/90 leading-relaxed font-mono break-words">
              {ig.hashtags.join(" ")}
            </div>
          </div>
        </div>

        {/* Refine */}
        <form onSubmit={handleRefineSubmit} className="pt-2 border-t theme-border flex gap-2">
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Refine Instagram copy or slides..."
            className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            disabled={!refineText.trim() || isRefining}
            className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 text-white rounded-lg text-xs font-medium cursor-pointer shrink-0"
          >
            Refine
          </button>
        </form>
      </div>
    );
  }

  // 3. X Content Editor
  if (platform === "x") {
    const xp = post as XPost;

    const handleUpdateSingle = (text: string) => {
      onUpdatePost({
        ...xp,
        single: text,
      });
    };

    const handleUpdateTweet = (index: number, text: string) => {
      const updated = [...xp.thread];
      updated[index] = text;
      onUpdatePost({
        ...xp,
        thread: updated,
      });
    };

    return (
      <div className="rounded-2xl theme-panel p-3.5 sm:p-5 space-y-4 flex flex-col h-full transition-colors duration-200">
        <div className="flex items-center justify-between pb-3 border-b theme-border">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">𝕏</span>
            <h3 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main">
              X (Twitter) Content
            </h3>
          </div>

          <button
            onClick={() => copyToClipboard(xp.single, "single")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-950 transition-all shadow-xs cursor-pointer shrink-0"
          >
            {copiedSection === "single" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedSection === "single" ? "Copied!" : "Copy Tweet"}</span>
            <span className="sm:hidden">{copiedSection === "single" ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
          {/* Standalone Tweet */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold theme-text-sub">
                Standalone Tweet
              </label>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  xp.single.length > 280 ? "bg-red-500/20 text-red-500 font-bold" : "theme-text-muted"
                }`}
              >
                {xp.single.length}/280
              </span>
            </div>
            <textarea
              value={xp.single}
              onChange={(e) => handleUpdateSingle(e.target.value)}
              rows={4}
              className="w-full p-2.5 theme-input rounded-lg text-xs leading-relaxed font-sans focus:outline-none"
            />
          </div>

          {/* Thread Tweets */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold theme-text-sub">
                Thread Breakdown ({xp.thread.length} tweets)
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(xp.thread.join("\n\n---\n\n"), "thread")}
                className="text-[10px] theme-text-muted hover:theme-text-main"
              >
                {copiedSection === "thread" ? "Copied" : "Copy Full Thread"}
              </button>
            </div>
            <div className="space-y-2">
              {xp.thread.map((tweet, idx) => (
                <div key={idx} className="space-y-1 p-2 theme-subpanel rounded-lg border theme-border">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-semibold">Tweet {idx + 1}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        tweet.length > 280 ? "text-red-500 font-bold" : "theme-text-muted"
                      }`}
                    >
                      {tweet.length}/280
                    </span>
                  </div>
                  <textarea
                    value={tweet}
                    onChange={(e) => handleUpdateTweet(idx, e.target.value)}
                    rows={2}
                    className="w-full p-2 theme-input rounded text-xs focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Refine */}
        <form onSubmit={handleRefineSubmit} className="pt-2 border-t theme-border flex gap-2">
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Refine tweet or thread..."
            className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs focus:outline-none"
          />
          <button
            type="submit"
            disabled={!refineText.trim() || isRefining}
            className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 text-white rounded-lg text-xs font-medium cursor-pointer shrink-0"
          >
            Refine
          </button>
        </form>
      </div>
    );
  }

  // 4. Reddit Content Editor
  if (platform === "reddit") {
    const rd = post as RedditPost;

    const handleUpdateField = (field: keyof RedditPost, value: unknown) => {
      onUpdatePost({
        ...rd,
        [field]: value,
      });
    };

    return (
      <div className="rounded-2xl theme-panel p-3.5 sm:p-5 space-y-4 flex flex-col h-full transition-colors duration-200">
        <div className="flex items-center justify-between pb-3 border-b theme-border">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#ff4500] text-white flex items-center justify-center font-bold text-xs shrink-0">r/</span>
            <h3 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main truncate">
              Reddit Post Content
            </h3>
          </div>

          <button
            onClick={() => copyToClipboard(getFullText(), "all")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#ff4500] hover:bg-[#e03d00] text-white transition-all shadow-xs cursor-pointer shrink-0"
          >
            {copiedSection === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedSection === "all" ? "Copied!" : "Copy Post"}</span>
            <span className="sm:hidden">{copiedSection === "all" ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold theme-text-sub">Post Title</label>
            <input
              type="text"
              value={rd.title}
              onChange={(e) => handleUpdateField("title", e.target.value)}
              className="w-full px-2.5 py-1.5 theme-input rounded-lg text-xs font-semibold focus:outline-none focus:border-[#ff4500]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold theme-text-sub">Markdown Body</label>
            <textarea
              value={rd.body}
              onChange={(e) => handleUpdateField("body", e.target.value)}
              rows={7}
              className="w-full p-2.5 theme-input rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:border-[#ff4500]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold theme-text-sub">TL;DR Summary</label>
            <input
              type="text"
              value={rd.tldr}
              onChange={(e) => handleUpdateField("tldr", e.target.value)}
              className="w-full px-2.5 py-1.5 theme-input rounded-lg text-xs focus:outline-none focus:border-[#ff4500]"
            />
          </div>
        </div>

        <form onSubmit={handleRefineSubmit} className="pt-2 border-t theme-border flex gap-2">
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Refine Reddit post..."
            className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs focus:outline-none focus:border-[#ff4500]"
          />
          <button
            type="submit"
            disabled={!refineText.trim() || isRefining}
            className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 text-white rounded-lg text-xs font-medium cursor-pointer shrink-0"
          >
            Refine
          </button>
        </form>
      </div>
    );
  }

  // 5. WhatsApp Content Editor
  const wa = post as WhatsAppPost;
  return (
    <div className="rounded-2xl theme-panel p-3.5 sm:p-5 space-y-4 flex flex-col h-full transition-colors duration-200">
      <div className="flex items-center justify-between pb-3 border-b theme-border">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-[#25D366] shrink-0" />
          <h3 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main truncate">
            WhatsApp Broadcast Message
          </h3>
        </div>

        <button
          onClick={() => copyToClipboard(wa.message, "all")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-neutral-950 transition-all shadow-xs cursor-pointer shrink-0"
        >
          {copiedSection === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copiedSection === "all" ? "Copied!" : "Copy Broadcast"}</span>
          <span className="sm:hidden">{copiedSection === "all" ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold theme-text-sub flex items-center justify-between">
            <span>Broadcast Message (Supports *bold*, _italic_)</span>
            <span className="text-[10px] theme-text-muted font-mono">{wa.message.length} chars</span>
          </label>
          <textarea
            value={wa.message}
            onChange={(e) => onUpdatePost({ ...wa, message: e.target.value })}
            rows={8}
            className="w-full p-2.5 theme-input rounded-lg text-xs leading-relaxed font-sans focus:outline-none focus:border-[#25D366]"
          />
        </div>
      </div>

      <form onSubmit={handleRefineSubmit} className="pt-2 border-t theme-border flex gap-2">
        <input
          type="text"
          value={refineText}
          onChange={(e) => setRefineText(e.target.value)}
          placeholder="Refine broadcast message..."
          className="flex-1 px-3 py-1.5 theme-input rounded-lg text-xs focus:outline-none focus:border-[#25D366]"
        />
        <button
          type="submit"
          disabled={!refineText.trim() || isRefining}
          className="px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 text-white rounded-lg text-xs font-medium cursor-pointer shrink-0"
        >
          Refine
        </button>
      </form>
    </div>
  );
};

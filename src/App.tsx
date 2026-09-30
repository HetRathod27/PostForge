import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  FactKind,
  PlatformPost,
  PlatformType,
  StoryFact,
  StoryFactsResult,
  ToneSettings,
  UploadedImage,
  VoiceDNA,
} from "./types.ts";
import {
  loadStoredDraftNotes,
  loadStoredToneSettings,
  loadStoredVoiceDNA,
  loadThemeMode,
  saveStoredDraftNotes,
  saveStoredToneSettings,
  saveStoredVoiceDNA,
  saveThemeMode,
} from "./lib/storage.ts";
import {
  analyzeMaterial,
  generateAllPosts,
  generateSinglePlatform,
  refinePlatformPost,
} from "./services/gemini.ts";
import { downloadMarkdownFile, formatPostsToMarkdown } from "./lib/markdown.ts";
import { TopBar } from "./components/TopBar.tsx";
import { HeroBanner } from "./components/HeroBanner.tsx";
import { InputStudio } from "./components/InputStudio.tsx";
import { OutputStudio } from "./components/OutputStudio.tsx";
import { ToastContainer, ToastMessage } from "./components/ToastContainer.tsx";

const DEMO_TEXT =
  "Attended the Claude Cowork workshop today. Learned how to delegate multi-step tasks to an AI teammate, saw a live demo automating a weekly report in under 5 minutes, met some great builders. Biggest takeaway: stop prompting, start delegating.";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => loadThemeMode());

  // Input states
  const [rawNotes, setRawNotes] = useState<string>(() => loadStoredDraftNotes());
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [facts, setFacts] = useState<StoryFact[]>([]);
  const [analysisMeta, setAnalysisMeta] = useState<{
    topic?: string;
    eventOrContext?: string;
    mood?: string;
    suggestedAngle?: string;
  }>({});

  // Settings
  const [tone, setTone] = useState<ToneSettings>(() => loadStoredToneSettings());
  const [voiceDNA, setVoiceDNA] = useState<VoiceDNA>(() => loadStoredVoiceDNA());

  // Generated outputs
  const [posts, setPosts] = useState<Record<string, PlatformPost>>({});

  // Process / Pipeline states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<PlatformType | null>(null);
  const [heroDismissed, setHeroDismissed] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply theme to html root
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
    }
    saveThemeMode(theme);
  }, [theme]);

  // Save notes & tone to storage
  useEffect(() => {
    saveStoredDraftNotes(rawNotes);
  }, [rawNotes]);

  useEffect(() => {
    saveStoredToneSettings(tone);
  }, [tone]);

  useEffect(() => {
    saveStoredVoiceDNA(voiceDNA);
  }, [voiceDNA]);

  const addToast = (type: "success" | "error" | "info", message: string, onRetry?: () => void) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message, onRetry }]);
    if (type !== "error") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Image actions
  const handleAddImages = (newImgs: UploadedImage[]) => {
    setImages((prev) => [...prev, ...newImgs]);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Fact actions
  const handleToggleFact = (id: string) => {
    setFacts((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleUpdateFactText = (id: string, newText: string) => {
    setFacts((prev) =>
      prev.map((f) => (f.id === id ? { ...f, text: newText } : f))
    );
  };

  const handleDeleteFact = (id: string) => {
    setFacts((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddFact = (text: string, kind: FactKind) => {
    const newFact: StoryFact = {
      id: `fact-user-${Date.now()}`,
      text,
      kind,
      source: "text",
      enabled: true,
    };
    setFacts((prev) => [newFact, ...prev]);
  };

  // Stage 1: Analyze
  const executeStage1Analyze = async (
    textToAnalyze: string,
    imagesToAnalyze: UploadedImage[]
  ): Promise<StoryFactsResult> => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeMaterial(textToAnalyze, imagesToAnalyze);
      setFacts(result.facts || []);
      setAnalysisMeta({
        topic: result.topic,
        eventOrContext: result.eventOrContext,
        mood: result.mood,
        suggestedAngle: result.suggestedAngle,
      });

      // Attach image notes to uploaded images
      if (result.imageNotes && result.imageNotes.length > 0) {
        setImages((prev) =>
          prev.map((img, idx) => {
            const note = result.imageNotes.find((n) => n.imageIndex === idx);
            return note ? { ...img, analysisNote: note } : img;
          })
        );
      }

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      addToast("error", `Analysis error: ${msg}`, () =>
        executeStage1Analyze(textToAnalyze, imagesToAnalyze)
      );
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Stage 2: Generate all posts in parallel
  const executeStage2Generate = async (
    enabledFacts: StoryFact[],
    textNotes: string
  ) => {
    setIsGenerating(true);
    try {
      const generated = await generateAllPosts(
        enabledFacts,
        textNotes,
        tone,
        voiceDNA
      );
      setPosts(generated);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981"],
        });
      } catch {
        // Confetti optional
      }

      addToast("success", "Successfully generated native posts for all 5 platforms!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      addToast("error", `Generation error: ${msg}`, () =>
        executeStage2Generate(enabledFacts, textNotes)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Full Pipeline: Analyze + Generate
  const handleAnalyzeAndGenerate = async () => {
    if (!rawNotes.trim() && images.length === 0) {
      addToast("error", "Please enter some notes or upload at least one image.");
      return;
    }

    try {
      const result = await executeStage1Analyze(rawNotes, images);
      const enabled = (result.facts || []).filter((f) => f.enabled);
      await executeStage2Generate(enabled, rawNotes);
    } catch {
      // Handled in individual stages
    }
  };

  // Rerun Stage 2 only (with current enabled facts)
  const handleRegenerateStage2 = async () => {
    const enabled = facts.filter((f) => f.enabled);
    if (enabled.length === 0 && !rawNotes.trim()) {
      addToast("error", "Please enable at least one fact or enter notes to regenerate.");
      return;
    }
    await executeStage2Generate(enabled, rawNotes);
  };

  // Single Platform Regenerate
  const handleRegeneratePlatform = async (platform: PlatformType) => {
    setRegeneratingPlatform(platform);
    const enabled = facts.filter((f) => f.enabled);
    try {
      const newPost = await generateSinglePlatform(
        platform,
        enabled,
        rawNotes,
        tone,
        voiceDNA
      );
      setPosts((prev) => ({ ...prev, [platform]: newPost }));
      addToast("success", `Regenerated ${platform} post!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Regeneration failed";
      addToast("error", `Could not regenerate ${platform}: ${msg}`, () =>
        handleRegeneratePlatform(platform)
      );
    } finally {
      setRegeneratingPlatform(null);
    }
  };

  // Single Platform Refine
  const handleRefinePlatform = async (platform: PlatformType, instruction: string) => {
    const currentPost = posts[platform];
    if (!currentPost) return;

    const enabled = facts.filter((f) => f.enabled);
    try {
      const refined = await refinePlatformPost(
        platform,
        currentPost,
        instruction,
        enabled,
        tone
      );
      setPosts((prev) => ({ ...prev, [platform]: refined }));
      addToast("success", `Refined ${platform} post based on your instruction!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Refine failed";
      addToast("error", `Could not refine ${platform}: ${msg}`);
      throw err;
    }
  };

  // Load Demo
  const handleLoadDemo = async () => {
    setRawNotes(DEMO_TEXT);
    setHeroDismissed(true);
    addToast("info", "Loaded Claude Workshop demo material. Running pipeline...");

    try {
      const result = await executeStage1Analyze(DEMO_TEXT, []);
      const enabled = (result.facts || []).filter((f) => f.enabled);
      await executeStage2Generate(enabled, DEMO_TEXT);
    } catch {
      // Errors handled inside stage runners
    }
  };

  // Confirm reset state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Global Actions
  const handleCopyAll = () => {
    if (Object.keys(posts).length === 0) return;
    const md = formatPostsToMarkdown(posts);
    navigator.clipboard.writeText(md);
    addToast("success", "Copied all 5 platform posts to clipboard in Markdown format!");
  };

  const handleExportMarkdown = () => {
    if (Object.keys(posts).length === 0) return;
    const md = formatPostsToMarkdown(posts);
    downloadMarkdownFile(md, "postforge-campaign.md");
    addToast("success", "Downloaded postforge-campaign.md!");
  };

  const handleConfirmReset = () => {
    setRawNotes("");
    setImages([]);
    setFacts([]);
    setPosts({});
    setShowResetConfirm(false);
    addToast("info", "Workspace reset.");
  };

  const hasGeneratedPosts = Object.keys(posts).length > 0;
  const isWorking = hasGeneratedPosts || facts.length > 0 || heroDismissed;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-mesh-dark text-neutral-100" : "bg-mesh-light text-slate-900"} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Bar */}
      <TopBar
        onLoadDemo={handleLoadDemo}
        onCopyAll={handleCopyAll}
        onExportMarkdown={handleExportMarkdown}
        onReset={() => setShowResetConfirm(true)}
        hasGeneratedPosts={hasGeneratedPosts}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        isProcessing={isAnalyzing || isGenerating}
      />

      {/* Main Container */}
      <main className={`flex-1 ${hasGeneratedPosts ? "max-w-[1440px] 2xl:max-w-[1536px]" : "max-w-7xl"} w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6 transition-all duration-300`}>
        {/* Hero Section on first load */}
        <HeroBanner
          onLoadDemo={handleLoadDemo}
          onDismiss={() => setHeroDismissed(true)}
          isWorking={isWorking}
        />

        {/* Two-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Pane: Input Studio */}
          <div className={`lg:col-span-5 ${hasGeneratedPosts ? "xl:col-span-4" : "xl:col-span-5"}`}>
            <InputStudio
              rawNotes={rawNotes}
              onChangeRawNotes={setRawNotes}
              images={images}
              onAddImages={handleAddImages}
              onRemoveImage={handleRemoveImage}
              facts={facts}
              onToggleFact={handleToggleFact}
              onUpdateFactText={handleUpdateFactText}
              onDeleteFact={handleDeleteFact}
              onAddFact={handleAddFact}
              tone={tone}
              onChangeTone={setTone}
              voiceDNA={voiceDNA}
              onUpdateVoiceDNA={setVoiceDNA}
              onAnalyzeAndGenerate={handleAnalyzeAndGenerate}
              onRegenerateStage2={handleRegenerateStage2}
              isAnalyzing={isAnalyzing}
              isGenerating={isGenerating}
              onError={(msg) => addToast("error", msg)}
            />
          </div>

          {/* Right Pane: Output Studio */}
          <div className={`lg:col-span-7 ${hasGeneratedPosts ? "xl:col-span-8" : "xl:col-span-7"}`}>
            <OutputStudio
              posts={posts}
              onUpdatePost={(platform, post) =>
                setPosts((prev) => ({ ...prev, [platform]: post }))
              }
              onRegeneratePlatform={handleRegeneratePlatform}
              onRefinePlatform={handleRefinePlatform}
              enabledFacts={facts.filter((f) => f.enabled)}
              tone={tone}
              isGenerating={isGenerating}
              regeneratingPlatform={regeneratingPlatform}
              onLoadDemo={handleLoadDemo}
            />
          </div>
        </div>
      </main>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm p-5 rounded-2xl theme-panel shadow-2xl border theme-border space-y-4">
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-base theme-text-main">
                Reset Workspace?
              </h3>
              <p className="text-xs theme-text-sub leading-relaxed">
                This will clear your current draft notes, uploaded images, extracted story facts, and generated posts.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium theme-btn-secondary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t theme-border py-4 px-6 text-center text-xs theme-text-muted font-mono">
        <span>PostForge Studio • Grounded AI Content Engine • Powered by Gemini 3.8 Flash</span>
      </footer>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

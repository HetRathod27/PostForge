import React, { useState, useEffect } from "react";
import {
  FactKind,
  PlatformType,
  StoryFact,
  ToneSettings,
  UploadedImage,
  VoiceDNA,
} from "../types.ts";
import { ImageUploader } from "./ImageUploader.tsx";
import { StoryFactsPanel } from "./StoryFactsPanel.tsx";
import { ToneStudio } from "./ToneStudio.tsx";
import { VoiceDNACard } from "./VoiceDNACard.tsx";
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
} from "../lib/speech.ts";
import {
  Mic,
  MicOff,
  RotateCw,
  Sparkles,
  Command,
  FileText,
  Trash2,
} from "lucide-react";

interface InputStudioProps {
  rawNotes: string;
  onChangeRawNotes: (notes: string) => void;
  images: UploadedImage[];
  onAddImages: (imgs: UploadedImage[]) => void;
  onRemoveImage: (id: string) => void;
  facts: StoryFact[];
  onToggleFact: (id: string) => void;
  onUpdateFactText: (id: string, newText: string) => void;
  onDeleteFact: (id: string) => void;
  onAddFact: (text: string, kind: FactKind) => void;
  tone: ToneSettings;
  onChangeTone: (newTone: ToneSettings) => void;
  voiceDNA: VoiceDNA;
  onUpdateVoiceDNA: (updated: VoiceDNA) => void;
  onAnalyzeAndGenerate: () => void;
  onRegenerateStage2: () => void;
  isAnalyzing: boolean;
  isGenerating: boolean;
  onError: (msg: string) => void;
}

export const InputStudio: React.FC<InputStudioProps> = ({
  rawNotes,
  onChangeRawNotes,
  images,
  onAddImages,
  onRemoveImage,
  facts,
  onToggleFact,
  onUpdateFactText,
  onDeleteFact,
  onAddFact,
  tone,
  onChangeTone,
  voiceDNA,
  onUpdateVoiceDNA,
  onAnalyzeAndGenerate,
  onRegenerateStage2,
  isAnalyzing,
  isGenerating,
  onError,
}) => {
  const [isListening, setIsListening] = useState(false);
  const speechSupported = isSpeechRecognitionSupported();

  // Web Speech recognition setup
  useEffect(() => {
    if (!speechSupported) return;

    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        if (isFinal) {
          onChangeRawNotes(
            rawNotes ? `${rawNotes.trim()} ${transcript.trim()}` : transcript.trim()
          );
        }
      },
      (listening) => setIsListening(listening),
      (errMsg) => onError(errMsg)
    );

    return () => {
      if (recognizer) {
        recognizer.stop();
      }
    };
  }, [speechSupported, rawNotes, onChangeRawNotes, onError]);

  const toggleMic = () => {
    if (!speechSupported) {
      onError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        if (isFinal) {
          onChangeRawNotes(
            rawNotes ? `${rawNotes.trim()} ${transcript.trim()}` : transcript.trim()
          );
        }
      },
      (listening) => setIsListening(listening),
      (errMsg) => onError(errMsg)
    );

    if (!recognizer) return;

    if (isListening) {
      recognizer.stop();
      setIsListening(false);
    } else {
      recognizer.start();
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter triggers generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isAnalyzing && !isGenerating) {
          if (facts.length > 0) {
            onRegenerateStage2();
          } else {
            onAnalyzeAndGenerate();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnalyzing, isGenerating, facts.length, onRegenerateStage2, onAnalyzeAndGenerate]);

  const isProcessing = isAnalyzing || isGenerating;
  const hasRawContent = rawNotes.trim().length > 0 || images.length > 0;
  const canGenerate = hasRawContent || facts.length > 0;

  return (
    <div className="space-y-5">
      {/* 1. Raw Material Input Box */}
      <div className="rounded-xl theme-panel p-4 space-y-3 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            <h2 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main">
              Raw Material & Notes
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleMic}
                className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  isListening
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300"
                }`}
                title="Dictate via microphone"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Dictate</span>
                  </>
                )}
              </button>
            )}

            {rawNotes && (
              <button
                type="button"
                onClick={() => onChangeRawNotes("")}
                className="text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 p-1"
                title="Clear notes"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={rawNotes}
            onChange={(e) => onChangeRawNotes(e.target.value)}
            placeholder="Dump your rough sentences, takeaways, bullet points, speaker quotes, or event takeaways here..."
            rows={5}
            className="w-full p-3 theme-input rounded-lg text-xs sm:text-sm leading-relaxed font-sans resize-y focus:outline-none focus:border-violet-500 transition-colors"
          />
          <div className="absolute bottom-2 right-2 text-[10px] theme-text-muted font-mono pointer-events-none">
            {rawNotes.length} chars
          </div>
        </div>

        {/* Image Uploader */}
        <ImageUploader
          images={images}
          onAddImages={onAddImages}
          onRemoveImage={onRemoveImage}
          onError={onError}
          disabled={isProcessing}
        />
      </div>

      {/* Primary Action Button (Magnetic styling) */}
      <div className="static lg:sticky lg:top-20 z-20 py-1 sm:py-2">
        <button
          onClick={() => {
            if (facts.length > 0) {
              onRegenerateStage2();
            } else {
              onAnalyzeAndGenerate();
            }
          }}
          disabled={!canGenerate || isProcessing}
          className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-indigo-600 hover:from-violet-500 hover:via-pink-500 hover:to-indigo-500 disabled:opacity-40 text-white font-heading font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-violet-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer touch-manipulation"
        >
          {isProcessing ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>
                {isAnalyzing
                  ? "Stage 1: Extracting Grounded Facts..."
                  : "Stage 2: Crafting Platform Posts in Parallel..."}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-pink-300" />
              <span>
                {facts.length > 0
                  ? "Regenerate Posts from Enabled Facts"
                  : "Analyze Material & Generate Posts"}
              </span>
              <span className="hidden sm:inline-flex items-center gap-0.5 ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-white/80">
                <Command className="w-2.5 h-2.5" />
                <span>Enter</span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* 2. Story Facts Panel (Image Grounded Extraction) */}
      <StoryFactsPanel
        facts={facts}
        onToggleFact={onToggleFact}
        onUpdateFactText={onUpdateFactText}
        onDeleteFact={onDeleteFact}
        onAddFact={onAddFact}
        isAnalyzing={isAnalyzing}
      />

      {/* 3. Tone & Platform Studio */}
      <ToneStudio tone={tone} onChangeTone={onChangeTone} />

      {/* 4. Voice DNA Profile */}
      <VoiceDNACard
        voiceDNA={voiceDNA}
        onUpdateVoiceDNA={onUpdateVoiceDNA}
        onError={onError}
      />
    </div>
  );
};

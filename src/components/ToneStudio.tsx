import React from "react";
import {
  EmojiDensity,
  LanguageOption,
  PlatformType,
  ToneSettings,
} from "../types.ts";
import { SlidersHorizontal, Globe, Smile, Monitor, Check } from "lucide-react";

interface ToneStudioProps {
  tone: ToneSettings;
  onChangeTone: (newTone: ToneSettings) => void;
}

export const ToneStudio: React.FC<ToneStudioProps> = ({ tone, onChangeTone }) => {
  const handleSliderChange = (
    field: "formality" | "energy" | "length",
    value: number
  ) => {
    onChangeTone({
      ...tone,
      [field]: value,
    });
  };

  const handleEmojiChange = (density: EmojiDensity) => {
    onChangeTone({
      ...tone,
      emojiDensity: density,
    });
  };

  const handleLanguageChange = (lang: LanguageOption) => {
    onChangeTone({
      ...tone,
      language: lang,
    });
  };

  const handleTogglePlatform = (platform: PlatformType) => {
    const current = tone.selectedPlatforms || [];
    let updated: PlatformType[];
    if (current.includes(platform)) {
      if (current.length === 1) return; // Keep at least one platform selected
      updated = current.filter((p) => p !== platform);
    } else {
      updated = [...current, platform];
    }
    onChangeTone({
      ...tone,
      selectedPlatforms: updated,
    });
  };

  const platformsList: {
    id: PlatformType;
    label: string;
    brandColor: string;
    selectedStyle: string;
  }[] = [
    {
      id: "linkedin",
      label: "LinkedIn",
      brandColor: "#0a66c2",
      selectedStyle: "bg-[#0a66c2] text-white border-[#0a66c2] shadow-xs",
    },
    {
      id: "instagram",
      label: "Instagram",
      brandColor: "#e1306c",
      selectedStyle: "bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white border-pink-500 shadow-xs",
    },
    {
      id: "x",
      label: "X",
      brandColor: "#64748b",
      selectedStyle: "bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-950 border-slate-800 dark:border-white shadow-xs font-bold",
    },
    {
      id: "reddit",
      label: "Reddit",
      brandColor: "#ff4500",
      selectedStyle: "bg-[#ff4500] text-white border-[#ff4500] shadow-xs",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      brandColor: "#25D366",
      selectedStyle: "bg-[#25D366] text-slate-950 font-bold border-[#20ba59] shadow-xs",
    },
  ];

  return (
    <div className="rounded-xl theme-panel p-3.5 sm:p-5 space-y-4 sm:space-y-5 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        <h3 className="font-heading font-semibold text-xs uppercase tracking-wider theme-text-main">
          Tone & Platform Studio
        </h3>
      </div>

      {/* Target Platforms Multi-Select */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold theme-text-sub flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Generate for Platforms:</span>
          </label>
          <span className="text-[10px] font-mono theme-text-muted bg-slate-100 dark:bg-neutral-800/90 px-2 py-0.5 rounded border border-slate-200 dark:border-neutral-700">
            {tone.selectedPlatforms.length} of 5 selected
          </span>
        </div>

        {/* Platform Selection Buttons */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
          {platformsList.map((p) => {
            const isSelected = tone.selectedPlatforms.includes(p.id);
            const isWhatsApp = p.id === "whatsapp";
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleTogglePlatform(p.id)}
                className={`min-h-[38px] py-1.5 px-2.5 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation ${
                  isWhatsApp ? "col-span-2 xs:col-span-1" : ""
                } ${
                  isSelected
                    ? p.selectedStyle
                    : "bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:border-slate-400 dark:hover:border-neutral-600 shadow-2xs"
                }`}
                title={`Click to ${isSelected ? "deselect" : "select"} ${p.label}`}
              >
                {!isSelected ? (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.brandColor }}
                  />
                ) : (
                  <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />
                )}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-3.5 pt-3 border-t theme-border">
        {/* Formality: Professional <-> Casual */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] theme-text-sub font-medium">
            <span>Professional</span>
            <span className="font-mono font-semibold theme-text-main text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
              {tone.formality <= 2 ? "Authoritative" : tone.formality >= 4 ? "Casual" : "Balanced"}
            </span>
            <span>Casual</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={tone.formality}
            onChange={(e) => handleSliderChange("formality", parseInt(e.target.value, 10))}
            className="w-full accent-cyan-600 dark:accent-cyan-400 h-2 bg-slate-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
            aria-label="Formality slider"
          />
        </div>

        {/* Energy: Humble <-> Hype */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] theme-text-sub font-medium">
            <span>Humble / Understated</span>
            <span className="font-mono font-semibold theme-text-main text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
              {tone.energy <= 2 ? "Grounded" : tone.energy >= 4 ? "Hype" : "Engaging"}
            </span>
            <span>Hype / High-Energy</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={tone.energy}
            onChange={(e) => handleSliderChange("energy", parseInt(e.target.value, 10))}
            className="w-full accent-violet-600 dark:accent-violet-400 h-2 bg-slate-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
            aria-label="Energy slider"
          />
        </div>

        {/* Length: Concise <-> Detailed */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] theme-text-sub font-medium">
            <span>Concise</span>
            <span className="font-mono font-semibold theme-text-main text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
              {tone.length <= 2 ? "Tight" : tone.length >= 4 ? "Detailed" : "Standard"}
            </span>
            <span>Detailed</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={tone.length}
            onChange={(e) => handleSliderChange("length", parseInt(e.target.value, 10))}
            className="w-full accent-pink-600 dark:accent-pink-400 h-2 bg-slate-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
            aria-label="Length slider"
          />
        </div>
      </div>

      {/* Row: Emojis and Multilingual */}
      <div className="pt-3 border-t theme-border grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Emoji Density */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold theme-text-sub flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-amber-500" />
            <span>Emoji Density:</span>
          </label>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg">
            {(["none", "light", "rich"] as EmojiDensity[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleEmojiChange(mode)}
                className={`flex-1 py-1.5 rounded-md text-[11px] font-medium capitalize transition-all cursor-pointer ${
                  tone.emojiDensity === mode
                    ? "bg-white dark:bg-neutral-800 theme-text-main shadow-xs font-semibold"
                    : "theme-text-muted hover:theme-text-main"
                }`}
              >
                {mode === "none" ? "None" : mode === "light" ? "1-3 (Light)" : "Rich"}
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold theme-text-sub flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Output Language:</span>
          </label>
          <select
            value={tone.language}
            onChange={(e) => handleLanguageChange(e.target.value as LanguageOption)}
            className="w-full h-[38px] px-3 py-1.5 rounded-lg theme-input text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer shadow-2xs"
            aria-label="Select output language"
          >
            <option value="English">English (Global)</option>
            <option value="Hinglish">Hinglish (Urban Tech / Latin)</option>
            <option value="Hindi">Hindi (हिन्दी / Devanagari)</option>
            <option value="Gujarati">Gujarati (ગુજરાતી)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

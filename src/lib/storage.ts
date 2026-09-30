import { ToneSettings, VoiceDNA } from "../types.ts";

const STORAGE_KEYS = {
  VOICE_DNA: "postforge_voice_dna_v1",
  TONE_SETTINGS: "postforge_tone_settings_v1",
  DRAFT_NOTES: "postforge_draft_notes_v1",
  THEME_MODE: "postforge_theme_mode_v1",
};

export const defaultToneSettings: ToneSettings = {
  formality: 3,
  energy: 3,
  length: 3,
  emojiDensity: "light",
  language: "English",
  selectedPlatforms: ["linkedin", "instagram", "x", "reddit", "whatsapp"],
};

export const defaultVoiceDNA: VoiceDNA = {
  enabled: false,
  sentenceLength: "punchy",
  emojiHabits: "minimal",
  openers: ["Here's what happened:", "3 things I learned:", "The biggest takeaway:"],
  vocabulary: ["framework", "leverage", "unintuitive", "signal", "execution"],
  tabooWords: ["synergy", "paradigm shift", "circle back", "delighted to announce"],
  rhythmAndPunctuation: "Short lines, bold key ideas, bulleted insights",
  sampleStyleSummary: "Crisp, analytical, conversational tone focused on lessons and actionable insights.",
};

export function loadStoredToneSettings(): ToneSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TONE_SETTINGS);
    if (!raw) return defaultToneSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultToneSettings, ...parsed };
  } catch (err) {
    console.warn("Failed to load tone settings from localStorage:", err);
    return defaultToneSettings;
  }
}

export function saveStoredToneSettings(settings: ToneSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TONE_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn("Failed to save tone settings to localStorage:", err);
  }
}

export function loadStoredVoiceDNA(): VoiceDNA {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOICE_DNA);
    if (!raw) return defaultVoiceDNA;
    const parsed = JSON.parse(raw);
    return { ...defaultVoiceDNA, ...parsed };
  } catch (err) {
    console.warn("Failed to load voice DNA from localStorage:", err);
    return defaultVoiceDNA;
  }
}

export function saveStoredVoiceDNA(voiceDNA: VoiceDNA): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOICE_DNA, JSON.stringify(voiceDNA));
  } catch (err) {
    console.warn("Failed to save voice DNA to localStorage:", err);
  }
}

export function loadStoredDraftNotes(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.DRAFT_NOTES) || "";
  } catch {
    return "";
  }
}

export function saveStoredDraftNotes(notes: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT_NOTES, notes);
  } catch {
    // Ignore storage quota or disabled errors
  }
}

export function loadThemeMode(): "dark" | "light" {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    return mode === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function saveThemeMode(mode: "dark" | "light"): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  } catch {
    // Ignore
  }
}

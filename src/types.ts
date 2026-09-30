export const APP_NAME = "PostForge";
export const GEMINI_MODEL = "gemini-3.8-flash";

export type PlatformType = "linkedin" | "instagram" | "x" | "reddit" | "whatsapp";

export type FactSource = "text" | "image";

export type FactKind =
  | "quote"
  | "number"
  | "person"
  | "tool"
  | "takeaway"
  | "setting"
  | "other";

export interface StoryFact {
  id: string;
  text: string;
  source: FactSource;
  imageIndex?: number;
  kind: FactKind;
  enabled: boolean;
}

export interface ImageNote {
  imageIndex: number;
  description: string;
  bestUseFor: "carousel" | "cover" | "supporting";
}

export interface StoryFactsResult {
  topic: string;
  eventOrContext: string;
  mood: string;
  facts: StoryFact[];
  suggestedAngle: string;
  imageNotes: ImageNote[];
}

export interface PostScore {
  hook: number;        // 0-10
  clarity: number;     // 0-10
  cta: number;         // 0-10
  platformFit: number; // 0-10
  notes: string;
}

export interface CommonPostOutput {
  score: PostScore;
  usedFactIds: string[];
  addedClaims: string[];
  altHooks: string[];
}

export interface LinkedInPost extends CommonPostOutput {
  platform: "linkedin";
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export interface InstagramSlide {
  slideNumber?: number;
  title: string;
  body: string;
}

export interface InstagramPost extends CommonPostOutput {
  platform: "instagram";
  caption: string;
  hashtags: string[];
  carouselSlides: InstagramSlide[];
  altText: string;
}

export interface XPost extends CommonPostOutput {
  platform: "x";
  single: string;
  thread: string[];
}

export interface RedditPost extends CommonPostOutput {
  platform: "reddit";
  suggestedSubreddits: string[];
  selectedSubreddit?: string;
  title: string;
  body: string;
  tldr: string;
  selfPromoRisk: "low" | "medium" | "high";
  selfPromoReason: string;
}

export interface WhatsAppPost extends CommonPostOutput {
  platform: "whatsapp";
  message: string;
}

export type PlatformPost =
  | LinkedInPost
  | InstagramPost
  | XPost
  | RedditPost
  | WhatsAppPost;

export interface VoiceDNA {
  enabled: boolean;
  name?: string;
  sentenceLength: "punchy" | "balanced" | "flowing";
  emojiHabits: "none" | "minimal" | "expressive";
  openers: string[];
  vocabulary: string[];
  tabooWords: string[];
  rhythmAndPunctuation: string;
  sampleStyleSummary: string;
}

export type LanguageOption = "English" | "Hinglish" | "Hindi" | "Gujarati";
export type EmojiDensity = "none" | "light" | "rich";

export interface ToneSettings {
  formality: number; // 1 (Very Professional) to 5 (Ultra Casual)
  energy: number;    // 1 (Humble / Understated) to 5 (Hype / High-Energy)
  length: number;    // 1 (Concise) to 5 (Detailed)
  emojiDensity: EmojiDensity;
  language: LanguageOption;
  selectedPlatforms: PlatformType[];
}

export interface UploadedImage {
  id: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  analysisNote?: ImageNote;
}

export interface GenerationState {
  isAnalyzing: boolean;
  isGenerating: boolean;
  activeGeneratingPlatforms: PlatformType[];
  stage: "idle" | "analyzed" | "generating" | "completed" | "error";
  error: string | null;
}

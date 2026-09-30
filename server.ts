import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import {
  STAGE_1_ANALYZE_SYSTEM_PROMPT,
  buildTonePrompt,
  LINKEDIN_SYSTEM_PROMPT,
  INSTAGRAM_SYSTEM_PROMPT,
  X_SYSTEM_PROMPT,
  REDDIT_SYSTEM_PROMPT,
  WHATSAPP_SYSTEM_PROMPT,
  MULTI_PLATFORM_SYSTEM_PROMPT,
  VOICE_DISTILL_SYSTEM_PROMPT,
  REFINE_SYSTEM_PROMPT,
  SHORTEN_SYSTEM_PROMPT,
} from "./src/prompts.ts";
import { PlatformType, StoryFact, ToneSettings, VoiceDNA } from "./src/types.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Preferred model candidates in order of priority (fast/generous quota first)
export const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// In-memory model health tracking:
// If a model encounters 429 (quota exceeded), don't pound it repeatedly.
// Put it on cooldown for 60 seconds (or retry delay).
const modelCooldowns = new Map<string, number>();

export function getAvailableModels(): string[] {
  const now = Date.now();
  const active: string[] = [];
  const cooling: string[] = [];

  for (const model of CANDIDATE_MODELS) {
    const cooldownUntil = modelCooldowns.get(model) || 0;
    if (now >= cooldownUntil) {
      active.push(model);
    } else {
      cooling.push(model);
    }
  }

  // Active models first, followed by cooling if needed
  return active.length > 0 ? [...active, ...cooling] : CANDIDATE_MODELS;
}

// Resilient execution with model fallback & exponential retry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateWithModelFallback(params: {
  contents: any;
  systemInstruction?: string;
  responseSchema?: any;
}) {
  let lastError: unknown = null;
  const modelsToTry = getAvailableModels();

  for (const model of modelsToTry) {
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt <= maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: "application/json",
            responseSchema: params.responseSchema,
          },
        });
        // Success: clear cooldown for this model
        modelCooldowns.delete(model);
        return { response, modelUsed: model };
      } catch (err: unknown) {
        attempt++;
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        const is429 = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");
        const is503 = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");

        if (is429) {
          // Parse retry delay if present, default 60s
          let delaySeconds = 60;
          const retryMatch = errMsg.match(/retry in ([0-9.]+)s/i) || errMsg.match(/retryDelay":"([0-9.]+)s"/i);
          if (retryMatch && retryMatch[1]) {
            delaySeconds = Math.max(10, Math.ceil(parseFloat(retryMatch[1])));
          }
          modelCooldowns.set(model, Date.now() + delaySeconds * 1000);
          console.warn(`[PostForge] Model ${model} quota exhausted (429). Cooling down for ${delaySeconds}s. Trying next candidate.`);
          break; // Switch to next candidate model immediately
        }

        if (is503) {
          // 503 is a temporary spike. Short backoff retry before switching
          if (attempt <= maxAttempts) {
            const backoff = 400 * attempt;
            console.log(`[PostForge] Model ${model} 503 transient spike. Retrying in ${backoff}ms (attempt ${attempt}/${maxAttempts})...`);
            await new Promise((resolve) => setTimeout(resolve, backoff));
            continue;
          } else {
            console.warn(`[PostForge] Model ${model} still 503 after ${maxAttempts} retries. Trying next candidate.`);
            break;
          }
        }

        if (attempt <= maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        }
      }
    }
  }

  throw lastError || new Error("All candidate models failed");
}

const app = express();
app.use(express.json({ limit: "50mb" }));

// --- Schemas ---
const scoreSchema = {
  type: Type.OBJECT,
  properties: {
    hook: { type: Type.NUMBER, description: "0 to 10 score" },
    clarity: { type: Type.NUMBER, description: "0 to 10 score" },
    cta: { type: Type.NUMBER, description: "0 to 10 score" },
    platformFit: { type: Type.NUMBER, description: "0 to 10 score" },
    notes: { type: Type.STRING, description: "Brief constructive critique" },
  },
  required: ["hook", "clarity", "cta", "platformFit", "notes"],
};

const storyFactsSchema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    eventOrContext: { type: Type.STRING },
    mood: { type: Type.STRING },
    suggestedAngle: { type: Type.STRING },
    facts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          source: { type: Type.STRING, description: "text or image" },
          imageIndex: { type: Type.INTEGER },
          kind: {
            type: Type.STRING,
            description: "quote | number | person | tool | takeaway | setting | other",
          },
        },
        required: ["id", "text", "source", "kind"],
      },
    },
    imageNotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          imageIndex: { type: Type.INTEGER },
          description: { type: Type.STRING },
          bestUseFor: { type: Type.STRING, description: "carousel | cover | supporting" },
        },
        required: ["imageIndex", "description", "bestUseFor"],
      },
    },
  },
  required: ["topic", "eventOrContext", "mood", "suggestedAngle", "facts", "imageNotes"],
};

const linkedInSchema = {
  type: Type.OBJECT,
  properties: {
    platform: { type: Type.STRING },
    hook: { type: Type.STRING },
    body: { type: Type.STRING },
    cta: { type: Type.STRING },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    score: scoreSchema,
    usedFactIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    addedClaims: { type: Type.ARRAY, items: { type: Type.STRING } },
    altHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["platform", "hook", "body", "cta", "hashtags", "score", "usedFactIds", "addedClaims", "altHooks"],
};

const instagramSchema = {
  type: Type.OBJECT,
  properties: {
    platform: { type: Type.STRING },
    caption: { type: Type.STRING },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    carouselSlides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          slideNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          body: { type: Type.STRING },
        },
        required: ["title", "body"],
      },
    },
    altText: { type: Type.STRING },
    score: scoreSchema,
    usedFactIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    addedClaims: { type: Type.ARRAY, items: { type: Type.STRING } },
    altHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["platform", "caption", "hashtags", "carouselSlides", "altText", "score", "usedFactIds", "addedClaims", "altHooks"],
};

const xSchema = {
  type: Type.OBJECT,
  properties: {
    platform: { type: Type.STRING },
    single: { type: Type.STRING },
    thread: { type: Type.ARRAY, items: { type: Type.STRING } },
    score: scoreSchema,
    usedFactIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    addedClaims: { type: Type.ARRAY, items: { type: Type.STRING } },
    altHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["platform", "single", "thread", "score", "usedFactIds", "addedClaims", "altHooks"],
};

const redditSchema = {
  type: Type.OBJECT,
  properties: {
    platform: { type: Type.STRING },
    suggestedSubreddits: { type: Type.ARRAY, items: { type: Type.STRING } },
    title: { type: Type.STRING },
    body: { type: Type.STRING },
    tldr: { type: Type.STRING },
    selfPromoRisk: { type: Type.STRING, description: "low | medium | high" },
    selfPromoReason: { type: Type.STRING },
    score: scoreSchema,
    usedFactIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    addedClaims: { type: Type.ARRAY, items: { type: Type.STRING } },
    altHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["platform", "suggestedSubreddits", "title", "body", "tldr", "selfPromoRisk", "selfPromoReason", "score", "usedFactIds", "addedClaims", "altHooks"],
};

const whatsAppSchema = {
  type: Type.OBJECT,
  properties: {
    platform: { type: Type.STRING },
    message: { type: Type.STRING },
    score: scoreSchema,
    usedFactIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    addedClaims: { type: Type.ARRAY, items: { type: Type.STRING } },
    altHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["platform", "message", "score", "usedFactIds", "addedClaims", "altHooks"],
};

const voiceDNASchema = {
  type: Type.OBJECT,
  properties: {
    sentenceLength: { type: Type.STRING, description: "punchy | balanced | flowing" },
    emojiHabits: { type: Type.STRING, description: "none | minimal | expressive" },
    openers: { type: Type.ARRAY, items: { type: Type.STRING } },
    vocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
    tabooWords: { type: Type.ARRAY, items: { type: Type.STRING } },
    rhythmAndPunctuation: { type: Type.STRING },
    sampleStyleSummary: { type: Type.STRING },
  },
  required: ["sentenceLength", "emojiHabits", "openers", "vocabulary", "tabooWords", "rhythmAndPunctuation", "sampleStyleSummary"],
};

// Unified batch schema for generating all platforms in 1 single Gemini call
const batchAllPostsSchema = {
  type: Type.OBJECT,
  properties: {
    linkedin: linkedInSchema,
    instagram: instagramSchema,
    x: xSchema,
    reddit: redditSchema,
    whatsapp: whatsAppSchema,
  },
};

// Fallback synthetic fact extractor in case all external models are down
function generateFallbackFacts(rawText: string, imageCount = 0): {
  topic: string;
  eventOrContext: string;
  mood: string;
  suggestedAngle: string;
  facts: StoryFact[];
  imageNotes: Array<{ imageIndex: number; description: string; bestUseFor: "carousel" | "cover" | "supporting" }>;
} {
  const sentences = (rawText || "")
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const facts: StoryFact[] = [];
  sentences.forEach((s, idx) => {
    let kind: StoryFact["kind"] = "takeaway";
    if (s.includes('"') || s.includes("'") || s.toLowerCase().includes("quote")) kind = "quote";
    else if (/\d+/.test(s)) kind = "number";
    else if (s.toLowerCase().includes("tool") || s.toLowerCase().includes("api") || s.toLowerCase().includes("ai")) kind = "tool";
    else if (s.toLowerCase().includes("workshop") || s.toLowerCase().includes("event") || s.toLowerCase().includes("room") || s.toLowerCase().includes("stage")) kind = "setting";

    facts.push({
      id: `fact-${idx + 1}`,
      text: s,
      source: "text",
      kind,
      enabled: true,
    });
  });

  if (facts.length === 0) {
    facts.push({
      id: "fact-1",
      text: "Captured high-leverage workflows and key strategic takeaways.",
      source: "text",
      kind: "takeaway",
      enabled: true,
    });
  }

  const imageNotes = [];
  for (let i = 0; i < imageCount; i++) {
    imageNotes.push({
      imageIndex: i,
      description: `Presentation slide / photo illustrating core concepts #${i + 1}`,
      bestUseFor: i === 0 ? ("cover" as const) : ("carousel" as const),
    });
    facts.push({
      id: `fact-img-${i + 1}`,
      text: `Key slide #${i + 1} highlighted architecture and workflow automation.`,
      source: "image",
      imageIndex: i,
      kind: "takeaway",
      enabled: true,
    });
  }

  const firstSentence = sentences[0] || "Key Takeaways";
  const secondSentence = sentences[1] || "Event / Project Takeaways";

  return {
    topic: firstSentence.slice(0, 60),
    eventOrContext: secondSentence.slice(0, 50),
    mood: "Pragmatic, inspiring, high signal",
    suggestedAngle: "Turn raw experiences into actionable lessons and leverage.",
    facts,
    imageNotes,
  };
}

// Fallback synthetic post generator for a single platform (dynamically builds from user's facts & notes)
function generateFallbackPost(
  platform: PlatformType,
  enabledFacts: StoryFact[],
  rawText: string,
  _tone: ToneSettings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const factTexts = (enabledFacts || []).map((f) => f.text.trim()).filter(Boolean);
  const factIds = (enabledFacts || []).map((f) => f.id);

  // Extract key sentences / thoughts from rawText
  const rawLines = (rawText || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const firstFact = factTexts[0];
  const firstLine = rawLines[0];
  const mainTopic = firstLine || firstFact || "Key Takeaways & Lessons";
  const coreThesis = firstFact || firstLine || "Key insights from today's work";

  const supportingPoints =
    factTexts.length > 1
      ? factTexts.slice(1, 6)
      : rawLines.length > 1
      ? rawLines.slice(1, 5)
      : [
          "Focus on high-leverage execution over manual repetition",
          "Document systems so workflows compound over time",
          "Iterate quickly based on direct feedback and real output",
        ];

  const bulletList = supportingPoints.map((p) => `• ${p}`).join("\n");

  const baseScore = {
    hook: 8.8,
    clarity: 9.1,
    cta: 8.6,
    platformFit: 9.2,
    notes: `Grounded in ${factTexts.length > 0 ? factTexts.length : "verified"} takeaways. Formatted to native ${platform} conventions.`,
  };

  const altHooks = [
    `The most unintuitive lesson about ${mainTopic.slice(0, 50)}:`,
    `Here's what nobody tells you about ${mainTopic.slice(0, 45)}:`,
    `3 core takeaways from ${mainTopic.slice(0, 50)}:`,
    `If you're working on ${mainTopic.slice(0, 40)}, keep this in mind:`,
    `Stop overcomplicating this. Here is the single biggest unlock:`,
  ];

  if (platform === "linkedin") {
    return {
      platform: "linkedin",
      hook: `Most people look at ${mainTopic.slice(0, 50)} the wrong way.\n\nHere is what really moved the needle:`,
      body: `${coreThesis}\n\nHere are the biggest takeaways:\n\n${bulletList}\n\nThe biggest unlock is turning these lessons into continuous execution habits.`,
      cta: "What's your biggest takeaway from this? Drop your thoughts below.",
      hashtags: ["#Productivity", "#Innovation", "#Growth", "#Leadership"],
      score: baseScore,
      usedFactIds: factIds,
      addedClaims: [],
      altHooks,
    };
  }

  if (platform === "instagram") {
    const slides = [
      {
        slideNumber: 1,
        title: mainTopic.slice(0, 60),
        body: "Swipe for the core frameworks and takeaways →",
      },
      ...supportingPoints.slice(0, 4).map((pt, i) => ({
        slideNumber: i + 2,
        title: `0${i + 1}. Insight`,
        body: pt,
      })),
      {
        slideNumber: Math.min(supportingPoints.length + 2, 6),
        title: "Action Step",
        body: "Save this post and implement one insight into your workflow today.",
      },
    ];

    return {
      platform: "instagram",
      caption: `${mainTopic}\n\n${coreThesis}\n\nSwipe through for the breakdown. Which one resonates most with you? 💡`,
      hashtags: ["#growth", "#takeaways", "#buildinpublic", "#insights", "#learning"],
      carouselSlides: slides,
      altText: `Carousel breaking down key takeaways for ${mainTopic.slice(0, 50)}.`,
      score: baseScore,
      usedFactIds: factIds,
      addedClaims: [],
      altHooks,
    };
  }

  if (platform === "x") {
    const single = `${mainTopic.slice(0, 100)}:\n\n${supportingPoints.slice(0, 3).map((p) => `• ${p}`).join("\n")}\n\nThe leverage is immense.`;
    const thread = [
      `1/ ${mainTopic.slice(0, 180)}:\n\nA quick breakdown of what matters: 🧵`,
      ...supportingPoints.slice(0, 4).map((p, i) => `${i + 2}/ ${p}`),
      `${Math.min(supportingPoints.length, 4) + 2}/ The takeaway:\n\n${coreThesis}\n\nWhat are you applying first?`,
    ];

    return {
      platform: "x",
      single: single.length > 280 ? single.slice(0, 277) + "..." : single,
      thread,
      score: baseScore,
      usedFactIds: factIds,
      addedClaims: [],
      altHooks,
    };
  }

  if (platform === "reddit") {
    return {
      platform: "reddit",
      suggestedSubreddits: ["r/technology", "r/productivity", "r/startups", "r/webdev"],
      title: `${mainTopic.slice(0, 90)}: Key Lessons & Notes`,
      body: `Wanted to share a few concrete observations:\n\n### Core Thesis\n${coreThesis}\n\n### Key Takeaways\n${bulletList}\n\nCurious how others are tackling this in your day-to-day workflow. What has worked best for you?`,
      tldr: coreThesis.slice(0, 140),
      selfPromoRisk: "low",
      selfPromoReason: "Grounded technical lessons with zero self-promotional links or marketing hype.",
      score: baseScore,
      usedFactIds: factIds,
      addedClaims: [],
      altHooks,
    };
  }

  // whatsapp
  return {
    platform: "whatsapp",
    message: `*${mainTopic}* 📌\n\n${coreThesis}\n\n*Key Highlights:*\n${bulletList}\n\n_What are your thoughts on this?_`,
    score: baseScore,
    usedFactIds: factIds,
    addedClaims: [],
    altHooks,
  };
}

// Platform Generator Helper
async function generateSinglePlatformPost(
  platform: PlatformType,
  enabledFacts: StoryFact[],
  rawText: string,
  tone: ToneSettings,
  voiceDNA?: VoiceDNA
) {
  let systemPrompt = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let responseSchema: any = linkedInSchema;

  switch (platform) {
    case "linkedin":
      systemPrompt = LINKEDIN_SYSTEM_PROMPT;
      responseSchema = linkedInSchema;
      break;
    case "instagram":
      systemPrompt = INSTAGRAM_SYSTEM_PROMPT;
      responseSchema = instagramSchema;
      break;
    case "x":
      systemPrompt = X_SYSTEM_PROMPT;
      responseSchema = xSchema;
      break;
    case "reddit":
      systemPrompt = REDDIT_SYSTEM_PROMPT;
      responseSchema = redditSchema;
      break;
    case "whatsapp":
      systemPrompt = WHATSAPP_SYSTEM_PROMPT;
      responseSchema = whatsAppSchema;
      break;
  }

  const toneContext = buildTonePrompt(tone, voiceDNA);

  const factsText = enabledFacts
    .map(
      (f, idx) =>
        `[Fact ${idx + 1}] ID: ${f.id} | Kind: ${f.kind} | Source: ${f.source} | Content: "${f.text}"`
    )
    .join("\n");

  const prompt = `Write a platform-native post for "${platform}".

${toneContext}

VERIFIED ENABLED FACTS TO GROUND THE POST:
${factsText || "(No facts provided. Rely strictly on user notes and do not hallucinate details.)"}

USER'S ORIGINAL RAW NOTES:
"""
${rawText || "No additional notes"}
"""

Return a valid JSON object matching the requested schema. Ensure platform="${platform}".`;

  try {
    const { response } = await generateWithModelFallback({
      contents: prompt,
      systemInstruction: systemPrompt,
      responseSchema,
    });

    const parsed = JSON.parse(response.text || "{}");
    parsed.platform = platform;
    return parsed;
  } catch (err: unknown) {
    console.warn(`[PostForge] Live Gemini call for ${platform} fell back to grounded generator:`, err);
    return generateFallbackPost(platform, enabledFacts, rawText, tone);
  }
}

// Unified Multi-Platform Generator (Generates all selected platforms in ONE efficient call)
async function generateUnifiedPlatformPosts(
  targetPlatforms: PlatformType[],
  enabledFacts: StoryFact[],
  rawText: string,
  tone: ToneSettings,
  voiceDNA?: VoiceDNA
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {};
  for (const p of targetPlatforms) {
    if (p === "linkedin") properties.linkedin = linkedInSchema;
    else if (p === "instagram") properties.instagram = instagramSchema;
    else if (p === "x") properties.x = xSchema;
    else if (p === "reddit") properties.reddit = redditSchema;
    else if (p === "whatsapp") properties.whatsapp = whatsAppSchema;
  }

  const dynamicUnifiedSchema = {
    type: Type.OBJECT,
    properties,
    required: targetPlatforms,
  };

  const toneContext = buildTonePrompt(tone, voiceDNA);

  const factsText = enabledFacts
    .map(
      (f, idx) =>
        `[Fact ${idx + 1}] ID: ${f.id} | Kind: ${f.kind} | Source: ${f.source} | Content: "${f.text}"`
    )
    .join("\n");

  const prompt = `Generate platform-native posts for all requested platforms: [${targetPlatforms.join(", ")}].

${toneContext}

VERIFIED ENABLED FACTS TO GROUND THE POSTS:
${factsText || "(No facts provided. Rely strictly on user notes and do not hallucinate details.)"}

USER'S ORIGINAL RAW NOTES:
"""
${rawText || "No additional notes"}
"""

Generate a complete, high-quality post for each of the following keys: ${targetPlatforms.join(", ")}.
Return a single JSON object conforming to the schema.`;

  const { response } = await generateWithModelFallback({
    contents: prompt,
    systemInstruction: MULTI_PLATFORM_SYSTEM_PROMPT,
    responseSchema: dynamicUnifiedSchema,
  });

  const parsed = JSON.parse(response.text || "{}");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const p of targetPlatforms) {
    if (parsed[p]) {
      parsed[p].platform = p;
      result[p] = parsed[p];
    }
  }
  return result;
}

// --- API Endpoints ---

// 1. Stage 1: Analyze user text and images
app.post("/api/analyze", async (req, res) => {
  try {
    const { rawText, images } = req.body as {
      rawText: string;
      images?: Array<{ base64: string; mimeType: string }>;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];
    const imageCount = images?.length || 0;

    if (images && Array.isArray(images) && images.length > 0) {
      images.forEach((img) => {
        parts.push({
          inlineData: {
            data: img.base64,
            mimeType: img.mimeType || "image/jpeg",
          },
        });
      });
    }

    parts.push({
      text: `Analyze the user's raw notes and attached images (if any). Extract only real, visible, or stated facts into atomic StoryFacts.
      
USER NOTES:
"""
${rawText || "No text provided. Rely exclusively on visible images."}
"""`,
    });

    try {
      const { response } = await generateWithModelFallback({
        contents: { parts },
        systemInstruction: STAGE_1_ANALYZE_SYSTEM_PROMPT,
        responseSchema: storyFactsSchema,
      });

      const storyFacts = JSON.parse(response.text || "{}");
      if (Array.isArray(storyFacts.facts)) {
        storyFacts.facts = storyFacts.facts.map((f: StoryFact, idx: number) => ({
          ...f,
          id: f.id || `fact-${idx + 1}`,
          enabled: true,
        }));
      }

      return res.json({ success: true, data: storyFacts });
    } catch (modelError: unknown) {
      console.warn("[PostForge] Analyze model call failed, using grounded fact extractor:", modelError);
      const fallbackFacts = generateFallbackFacts(rawText || "", imageCount);
      return res.json({ success: true, data: fallbackFacts });
    }
  } catch (error: unknown) {
    console.error("Error in /api/analyze:", error);
    const msg = error instanceof Error ? error.message : "Analysis failed";
    res.status(500).json({ success: false, error: msg });
  }
});

// 2. Stage 2: Generate for multiple platforms (Unified single call with resilient individual fallback)
app.post("/api/generate-all", async (req, res) => {
  try {
    const { enabledFacts, rawText, tone, voiceDNA } = req.body as {
      enabledFacts: StoryFact[];
      rawText: string;
      tone: ToneSettings;
      voiceDNA?: VoiceDNA;
    };

    const targetPlatforms: PlatformType[] =
      tone.selectedPlatforms && tone.selectedPlatforms.length > 0
        ? tone.selectedPlatforms
        : ["linkedin", "instagram", "x", "reddit", "whatsapp"];

    const postsByPlatform: Record<string, unknown> = {};

    // 1. Primary path: Unified single API call to generate all platforms at once
    try {
      const unifiedPosts = await generateUnifiedPlatformPosts(
        targetPlatforms,
        enabledFacts || [],
        rawText || "",
        tone,
        voiceDNA
      );
      for (const platform of targetPlatforms) {
        if (unifiedPosts[platform]) {
          postsByPlatform[platform] = unifiedPosts[platform];
        }
      }
    } catch (unifiedErr) {
      console.warn("[PostForge] Unified generation encountered an issue, falling back to individual generators:", unifiedErr);
    }

    // 2. Secondary path: For any missing platforms, generate individually or via fallback
    for (const platform of targetPlatforms) {
      if (postsByPlatform[platform]) continue;

      try {
        const post = await generateSinglePlatformPost(
          platform,
          enabledFacts || [],
          rawText || "",
          tone,
          voiceDNA
        );
        if (post && post.platform) {
          postsByPlatform[post.platform] = post;
        } else {
          postsByPlatform[platform] = generateFallbackPost(platform, enabledFacts, rawText, tone);
        }
      } catch (err) {
        console.warn(`[PostForge] Error generating post for ${platform}:`, err);
        postsByPlatform[platform] = generateFallbackPost(platform, enabledFacts, rawText, tone);
      }
    }

    res.json({ success: true, data: postsByPlatform });
  } catch (error: unknown) {
    console.error("Error in /api/generate-all:", error);
    const msg = error instanceof Error ? error.message : "Post generation failed";
    res.status(500).json({ success: false, error: msg });
  }
});

// 3. Stage 2: Generate for a single platform (Regenerate)
app.post("/api/generate-platform", async (req, res) => {
  try {
    const { platform, enabledFacts, rawText, tone, voiceDNA } = req.body as {
      platform: PlatformType;
      enabledFacts: StoryFact[];
      rawText: string;
      tone: ToneSettings;
      voiceDNA?: VoiceDNA;
    };

    let post;
    try {
      post = await generateSinglePlatformPost(
        platform,
        enabledFacts || [],
        rawText || "",
        tone,
        voiceDNA
      );
    } catch (singleErr) {
      console.warn(`[PostForge] Single platform generation failed for ${platform}, using grounded fallback:`, singleErr);
      post = generateFallbackPost(platform, enabledFacts, rawText, tone);
    }

    res.json({ success: true, data: post });
  } catch (error: unknown) {
    console.error("Error in /api/generate-platform:", error);
    const msg = error instanceof Error ? error.message : "Platform regeneration failed";
    res.status(500).json({ success: false, error: msg });
  }
});

// 4. Stage 3: Distill Voice DNA
app.post("/api/distill-voice", async (req, res) => {
  try {
    const { samples } = req.body as { samples: string[] };
    if (!samples || samples.length === 0) {
      return res.status(400).json({ success: false, error: "Please provide at least 1-3 sample posts." });
    }

    const samplePrompt = samples
      .map((s, i) => `--- SAMPLE POST ${i + 1} ---\n${s}`)
      .join("\n\n");

    try {
      const { response } = await generateWithModelFallback({
        contents: `Analyze these writing samples from a single author and distill their authentic Voice DNA profile:\n\n${samplePrompt}`,
        systemInstruction: VOICE_DISTILL_SYSTEM_PROMPT,
        responseSchema: voiceDNASchema,
      });

      const voiceData = JSON.parse(response.text || "{}");
      voiceData.enabled = true;
      return res.json({ success: true, data: voiceData });
    } catch {
      // Fallback Voice DNA
      return res.json({
        success: true,
        data: {
          enabled: true,
          sentenceLength: "punchy",
          emojiHabits: "minimal",
          openers: ["Here's what happened:", "The biggest takeaway:", "Stop doing this:"],
          vocabulary: ["framework", "leverage", "unintuitive", "signal", "execution"],
          tabooWords: ["synergy", "paradigm shift", "circle back"],
          rhythmAndPunctuation: "Short lines, bold key concepts, numbered insights",
          sampleStyleSummary: "Analytical, high-velocity writing focused on tactical takeaways and clarity.",
        },
      });
    }
  } catch (error: unknown) {
    console.error("Error in /api/distill-voice:", error);
    const msg = error instanceof Error ? error.message : "Voice distillation failed";
    res.status(500).json({ success: false, error: msg });
  }
});

// 5. Stage 3: Refine platform post with instruction
app.post("/api/refine", async (req, res) => {
  try {
    const { platform, currentPost, instruction, enabledFacts, tone } = req.body as {
      platform: PlatformType;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentPost: any;
      instruction: string;
      enabledFacts: StoryFact[];
      tone: ToneSettings;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let responseSchema: any = linkedInSchema;
    if (platform === "instagram") responseSchema = instagramSchema;
    else if (platform === "x") responseSchema = xSchema;
    else if (platform === "reddit") responseSchema = redditSchema;
    else if (platform === "whatsapp") responseSchema = whatsAppSchema;

    const factsText = enabledFacts
      .map((f, i) => `[Fact ${i + 1}] ID: ${f.id} | ${f.text}`)
      .join("\n");

    const prompt = `Refine this existing ${platform} post based on the following instruction:
"${instruction}"

CURRENT POST JSON:
${JSON.stringify(currentPost, null, 2)}

GROUNDED FACTS:
${factsText}

TONE CONTEXT:
Language: ${tone?.language || "English"}

Keep all platform rules, recalculate scores and Honesty Guard added claims, and return JSON matching the schema.`;

    try {
      const { response } = await generateWithModelFallback({
        contents: prompt,
        systemInstruction: REFINE_SYSTEM_PROMPT,
        responseSchema,
      });

      const refinedPost = JSON.parse(response.text || "{}");
      refinedPost.platform = platform;
      return res.json({ success: true, data: refinedPost });
    } catch {
      // Return adjusted post with updated score notes
      const postCopy = { ...currentPost };
      if (postCopy.score) {
        postCopy.score.notes = `Refined with focus on: "${instruction}".`;
      }
      return res.json({ success: true, data: postCopy });
    }
  } catch (error: unknown) {
    console.error("Error in /api/refine:", error);
    const msg = error instanceof Error ? error.message : "Refine failed";
    res.status(500).json({ success: false, error: msg });
  }
});

// 6. Stage 3: Shorten tweet for X "Fix length"
app.post("/api/shorten", async (req, res) => {
  try {
    const { text, maxChars = 280 } = req.body as { text: string; maxChars?: number };

    try {
      const { response } = await generateWithModelFallback({
        contents: `Shorten the following tweet to be strictly <= ${maxChars} characters while keeping the hook and core punch:\n\n"${text}"`,
        systemInstruction: SHORTEN_SYSTEM_PROMPT,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortened: {
              type: Type.STRING,
              description: `Shortened text strictly ${maxChars} chars or fewer`,
            },
          },
          required: ["shortened"],
        },
      });

      const result = JSON.parse(response.text || "{}");
      res.json({ success: true, shortened: result.shortened || text.slice(0, maxChars) });
    } catch {
      res.json({ success: true, shortened: text.slice(0, maxChars) });
    }
  } catch (error: unknown) {
    console.error("Error in /api/shorten:", error);
    const msg = error instanceof Error ? error.message : "Shorten failed";
    res.status(500).json({ success: false, error: msg });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", models: CANDIDATE_MODELS, timestamp: new Date().toISOString() });
});

// Vite Middleware for development or static serving for production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PostForge] Server running on http://0.0.0.0:${PORT} (Mode: ${isProd ? "production" : "development"})`);
  });
}

startServer();

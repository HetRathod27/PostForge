import {
  PlatformPost,
  PlatformType,
  StoryFact,
  StoryFactsResult,
  ToneSettings,
  UploadedImage,
  VoiceDNA,
} from "../types.ts";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries = 2,
  backoffMs = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        let errorMsg = `Server error (${res.status})`;
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch {
          // Fallback to text
        }
        throw new ApiError(errorMsg, res.status);
      }
      return await res.json();
    } catch (err: unknown) {
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)));
    }
  }
  throw new ApiError("Failed after retries");
}

export async function analyzeMaterial(
  rawText: string,
  images: UploadedImage[]
): Promise<StoryFactsResult> {
  const payload = {
    rawText,
    images: images.map((img) => ({
      base64: img.base64,
      mimeType: img.mimeType,
    })),
  };

  const response = await fetchWithRetry<{ success: boolean; data: StoryFactsResult; error?: string }>(
    "/api/analyze",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.success || !response.data) {
    throw new ApiError(response.error || "Failed to analyze content");
  }

  return response.data;
}

export async function generateAllPosts(
  enabledFacts: StoryFact[],
  rawText: string,
  tone: ToneSettings,
  voiceDNA?: VoiceDNA
): Promise<Record<string, PlatformPost>> {
  const payload = {
    enabledFacts,
    rawText,
    tone,
    voiceDNA: voiceDNA?.enabled ? voiceDNA : undefined,
  };

  const response = await fetchWithRetry<{
    success: boolean;
    data: Record<string, PlatformPost>;
    error?: string;
  }>("/api/generate-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.success || !response.data) {
    throw new ApiError(response.error || "Failed to generate posts");
  }

  return response.data;
}

export async function generateSinglePlatform(
  platform: PlatformType,
  enabledFacts: StoryFact[],
  rawText: string,
  tone: ToneSettings,
  voiceDNA?: VoiceDNA
): Promise<PlatformPost> {
  const payload = {
    platform,
    enabledFacts,
    rawText,
    tone,
    voiceDNA: voiceDNA?.enabled ? voiceDNA : undefined,
  };

  const response = await fetchWithRetry<{
    success: boolean;
    data: PlatformPost;
    error?: string;
  }>("/api/generate-platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.success || !response.data) {
    throw new ApiError(response.error || `Failed to regenerate post for ${platform}`);
  }

  return response.data;
}

export async function distillVoiceDNA(samples: string[]): Promise<VoiceDNA> {
  const response = await fetchWithRetry<{
    success: boolean;
    data: VoiceDNA;
    error?: string;
  }>("/api/distill-voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ samples }),
  });

  if (!response.success || !response.data) {
    throw new ApiError(response.error || "Failed to distill Voice DNA");
  }

  return response.data;
}

export async function refinePlatformPost(
  platform: PlatformType,
  currentPost: PlatformPost,
  instruction: string,
  enabledFacts: StoryFact[],
  tone: ToneSettings
): Promise<PlatformPost> {
  const response = await fetchWithRetry<{
    success: boolean;
    data: PlatformPost;
    error?: string;
  }>("/api/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform,
      currentPost,
      instruction,
      enabledFacts,
      tone,
    }),
  });

  if (!response.success || !response.data) {
    throw new ApiError(response.error || "Failed to refine post");
  }

  return response.data;
}

export async function shortenTweetText(text: string, maxChars = 280): Promise<string> {
  const response = await fetchWithRetry<{
    success: boolean;
    shortened: string;
    error?: string;
  }>("/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, maxChars }),
  });

  if (!response.success || !response.shortened) {
    throw new ApiError(response.error || "Failed to shorten tweet");
  }

  return response.shortened;
}

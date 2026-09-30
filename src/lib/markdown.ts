import {
  PlatformPost,
  LinkedInPost,
  InstagramPost,
  XPost,
  RedditPost,
  WhatsAppPost,
} from "../types.ts";

export function formatPostsToMarkdown(posts: Record<string, PlatformPost>): string {
  const parts: string[] = [
    `# PostForge Content Export`,
    `Generated on: ${new Date().toLocaleString()}`,
    `\n---\n`,
  ];

  if (posts.linkedin) {
    const p = posts.linkedin as LinkedInPost;
    parts.push(`## LinkedIn Post`);
    parts.push(`**Score:** Hook ${p.score.hook}/10 | Clarity ${p.score.clarity}/10 | Fit ${p.score.platformFit}/10`);
    parts.push(`\n### Post Content\n`);
    parts.push(`${p.hook}\n\n${p.body}\n\n${p.cta}\n\n${p.hashtags.join(" ")}`);
    parts.push(`\n---\n`);
  }

  if (posts.x) {
    const p = posts.x as XPost;
    parts.push(`## X (Twitter)`);
    parts.push(`**Score:** Hook ${p.score.hook}/10 | Fit ${p.score.platformFit}/10`);
    parts.push(`\n### Single Tweet (${p.single.length}/280 chars)\n`);
    parts.push(p.single);
    if (p.thread && p.thread.length > 0) {
      parts.push(`\n### Thread (${p.thread.length} tweets)\n`);
      p.thread.forEach((tweet, i) => {
        parts.push(`${i + 1}. ${tweet} (${tweet.length} chars)`);
      });
    }
    parts.push(`\n---\n`);
  }

  if (posts.instagram) {
    const p = posts.instagram as InstagramPost;
    parts.push(`## Instagram`);
    parts.push(`**Score:** Hook ${p.score.hook}/10 | Fit ${p.score.platformFit}/10`);
    parts.push(`\n### Caption\n`);
    parts.push(`${p.caption}\n\n${p.hashtags.join(" ")}`);
    if (p.carouselSlides && p.carouselSlides.length > 0) {
      parts.push(`\n### Carousel Slides (${p.carouselSlides.length} slides)\n`);
      p.carouselSlides.forEach((slide, i) => {
        parts.push(`**Slide ${i + 1}: ${slide.title}**\n${slide.body}\n`);
      });
    }
    parts.push(`\n---\n`);
  }

  if (posts.reddit) {
    const p = posts.reddit as RedditPost;
    parts.push(`## Reddit`);
    parts.push(`**Subreddits:** ${p.suggestedSubreddits.join(", ")}`);
    parts.push(`**Self-Promo Risk:** ${p.selfPromoRisk.toUpperCase()} (${p.selfPromoReason})`);
    parts.push(`\n### Title\n${p.title}`);
    parts.push(`\n### Body\n${p.body}`);
    parts.push(`\n### TL;DR\n${p.tldr}`);
    parts.push(`\n---\n`);
  }

  if (posts.whatsapp) {
    const p = posts.whatsapp as WhatsAppPost;
    parts.push(`## WhatsApp Broadcast`);
    parts.push(`\n${p.message}\n`);
    parts.push(`\n---\n`);
  }

  return parts.join("\n");
}

export function downloadMarkdownFile(content: string, filename = "postforge-export.md"): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

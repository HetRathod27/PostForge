# PostForge

PostForge is a TypeScript web app for turning rough notes and optional event photos into platform-native social posts. It combines a React UI with an Express API and Gemini-powered generation pipeline to produce grounded content for LinkedIn, Instagram, X, Reddit, and WhatsApp.

## Overview

PostForge is designed around a guided workflow:

1. Add raw notes (typed or dictated) and optional images.
2. Extract and review grounded story facts.
3. Generate posts for selected platforms.
4. Refine/regenerate platform outputs.
5. Copy or export all generated content as Markdown.

## Key Features

- **Two-stage generation pipeline**: analyze materials first, then generate multi-platform posts.
- **Platform support**: LinkedIn, Instagram, X, Reddit, and WhatsApp.
- **Grounding controls**:
  - Fact extraction from notes/images
  - Fact toggles and manual fact editing
  - Honesty Guard indicators (`addedClaims`, used facts)
- **Voice DNA**: optional style distillation from your sample posts.
- **Tone controls**:
  - Formality, energy, and length sliders
  - Emoji density
  - Output language (English, Hinglish, Hindi, Gujarati)
  - Platform selection
- **Editing and iteration**:
  - Regenerate all selected platforms
  - Regenerate individual platform posts
  - Refine a post with natural-language instructions
  - Hook alternatives (Hook Lab)
  - X-length shortening endpoint for tweet constraints
- **Usability**:
  - Theme toggle (dark/light)
  - Local draft/settings persistence
  - Optional browser speech-to-text note input
  - Markdown export and clipboard copy
- **Resilience**:
  - Candidate-model fallback and retry logic for Gemini calls
  - Grounded server-side fallback generators if model calls fail

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Backend**: Express + TypeScript (`server.ts` via `tsx`)
- **AI**: `@google/genai` (Gemini)
- **Styling/UI**: Tailwind CSS v4, Lucide icons, Motion
- **Utilities**: `canvas-confetti`, `html-to-image`, browser Web Speech API (when available)

## Prerequisites

- **Node.js** 18+ (recommended)
- **npm** (or Bun; `bun.lock` is present)
- A **Gemini API key**

## Installation

```bash
# from repository root
npm install
```

If you prefer Bun:

```bash
bun install
```

## Environment Variables

Create a `.env` file in the repository root (you can copy from `.env.example`).

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
```

### Variable details

- `GEMINI_API_KEY` (**required**): used by the Express server for Gemini API requests.
- `APP_URL` (present in example): included for hosted/runtime scenarios; not required by current local server code paths.
- `PORT` (optional): server port (defaults to `3000`).
- `NODE_ENV` (optional): set to `production` to enable static serving of built frontend assets.
- `DISABLE_HMR` (optional): controls Vite HMR/watch behavior in `vite.config.ts`.

## Development

Run the full app (Express API + Vite middleware):

```bash
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Available Scripts

From `package.json`:

- `npm run dev` – start local server in development mode (`tsx server.ts`)
- `npm run start` – start server (`tsx server.ts`)
- `npm run build` – build frontend assets with Vite into `dist/`
- `npm run lint` – type-check with TypeScript (`tsc --noEmit`)
- `npm run clean` – remove build artifacts (`dist`, `server.js`)

## Build & Production Notes

Build frontend assets:

```bash
npm run build
```

Then run in production mode:

```bash
NODE_ENV=production npm run start
```

In production mode, Express serves static files from `dist/` and falls back to `dist/index.html` for SPA routes.

## API Surface (server)

- `POST /api/analyze` – extract grounded facts from notes/images
- `POST /api/generate-all` – generate posts for selected platforms
- `POST /api/generate-platform` – regenerate one platform post
- `POST /api/distill-voice` – derive Voice DNA from samples
- `POST /api/refine` – refine an existing platform post
- `POST /api/shorten` – shorten X/tweet text to max chars
- `GET /api/health` – health and model metadata

## Project Structure

```text
PostForge/
├── server.ts               # Express server + API routes + Vite/static serving
├── src/
│   ├── App.tsx             # Main app workflow and state orchestration
│   ├── components/         # Input/Output studios, previews, UI controls
│   ├── services/gemini.ts  # Frontend API client wrappers
│   ├── lib/                # Storage, markdown export, image/speech helpers
│   ├── prompts.ts          # Prompt templates/system instructions
│   └── types.ts            # Shared TypeScript contracts
├── .env.example
├── package.json
└── vite.config.ts
```

## Contributing

Contributions are welcome.

1. Fork the repo and create a feature branch.
2. Make focused changes.
3. Run checks locally:
   ```bash
   npm run lint
   npm run build
   ```
4. Open a pull request with a clear description.

> Note: there is currently no dedicated automated test suite configured in `package.json`; type-check/build are the primary validation commands.

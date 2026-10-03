# MotionGraphicPrompts — AI-Powered Motion Graphics Prompt Generator

> Turn any topic into viral motion graphic prompts in 5 stages, powered by Google Gemini AI.

## What it does

MotionGraphicPrompts is a 5-stage wizard that takes your video topic and generates everything you need:

| Stage | What you get |
|---|---|
| 1 — Topic | 5 viral title ideas using proven formulas |
| 2 — Script | A cinematic 20-30 second narration script |
| 3 — Background | Visual theme selection (Editorial / Technical / Academic / Custom) |
| 4 — Image Prompts | Scene-by-scene prompts for Midjourney, Leonardo AI, etc. |
| 5 — Motion Prompts | Google Flow (Veo) optimized motion prompts for image-to-video |

## Quick Start

### 1. Get your Gemini API key
Visit [Google AI Studio](https://aistudio.google.com/) → Create API Key (free tier available)

### 2. Add your API key
Open `.env.local` and replace the placeholder:
```
GEMINI_API_KEY=your_actual_key_here
```

### 3. Install and run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🚀

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 1.5 Flash API
- **State**: Zustand + sessionStorage persistence
- **Data**: localStorage (no database, no login)
- **Deploy**: Vercel-ready

## Security

The Gemini API key is **server-side only**:
- Stored in `.env.local` (never committed to git)
- Only accessed in `/app/api/` route handlers
- The browser never sees the key

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add `GEMINI_API_KEY` as an Environment Variable in your Vercel dashboard.

## File Structure

```
├── app/
│   ├── page.tsx              # Home: trending ideas + history
│   ├── stage/1-5/page.tsx    # The 5 wizard stages
│   └── api/generate/         # 6 Gemini API routes (server-side)
├── components/               # 8 shared UI components
├── store/                    # Zustand state management
├── lib/                      # Gemini wrapper + localStorage helpers
└── types/                    # TypeScript interfaces
```

## Features

- 🔥 Daily trending topic ideas (cached daily, auto-refreshed)
- 📂 Recent projects history (last 10 projects in localStorage)
- 🎨 3 predefined themes + custom color picker
- 📋 One-click copy for any prompt
- 🔄 Per-scene regeneration (without regenerating all scenes)
- 🎉 Confetti animation + project auto-save on completion
- 📱 Fully responsive (mobile-first)
- 🔐 API key never exposed to the browser

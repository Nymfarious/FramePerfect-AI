<div align="center">
   <img width="825" height="575" alt="image" src="https://github.com/user-attachments/assets/fa883631-a96c-447c-913b-54eefe67fb14" />
<p></p>
   <img width="1263" height="394" alt="image" src="https://github.com/user-attachments/assets/fd636595-7515-4ce8-ac02-a62a606c000d" />
</div>

View this app in Google AI Studio: https://ai.studio/apps/drive/1D99ndhp-rFEMdTUki5cyk50Ox5pBoNrD

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

   # FramePerfect AI

AI-powered video frame extraction and curation tool.

## Features

- 🎬 Extract frames from video at configurable intervals
- 🤖 AI analysis with Google Gemini (quality, composition, subjects)
- ✨ AI enhancement options (restore, unblur, cinematic, bokeh)
- 📦 Export curated frames as ZIP library
- 💾 Auto-save with IndexedDB persistence

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS
- Google Gemini API (gemini-2.5-flash)
- IndexedDB for storage
- JSZip for exports

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
```bash
   npm install
```

2. Set your Gemini API key in `.env.local`:
GEMINI_API_KEY=your_key_here

3. Run the app:
```bash
   npm run dev
```

## Pipeline Stages

1. **Frame Sampler Agent** - Extracts frames at intervals
2. **Vision Analyzer Agent** - Gemini AI analysis
3. **Clustering Agent** - Groups similar frames

## Part of the Echoverse

This app is part of the Echoverse ecosystem and can connect to Master DevTools for monitoring.

---

*Built by Nymfarious*

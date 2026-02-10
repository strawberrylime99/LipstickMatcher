# 💄 Lipstick Matcher

A lightweight Svelte web app that matches lipstick shades based on your skin tone and undertone, using a photo upload.
Currently Live at: www.LipstickMatcher.com

<p align="center">
  <img src="static/logo.png" alt="Lipstick Matcher logo" width="200"/>
</p>

## 🚀 Features

- 📷 Upload a photo and detect skin tone
- 🎨 Detect undertone using HSL/HSV conversion
- 💡 Suggest three lipstick shades that best match your tone
- 🌈 Swatch previews and direct product links

## 🛠️ Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/strawberrylime99/LipstickMatcher.git
cd LipstickMatcher
npm install

Start the development server:
npm run dev

🧪 Build & Preview
npm run build       # build production version
npm run preview     # preview the production build

✨ Technologies
SvelteKit
TypeScript
HSL color processing
Skin undertone logic

📸 Models Used
face-api.js for face detection
Custom logic for skintone extraction from cheeks

## Content Automation (PR-Only)

This repo includes a twice-weekly content automation workflow that generates a blog draft and opens a GitHub PR.
You only need to review and merge from your phone.

- Workflow: `.github/workflows/content-draft-pr.yml`
- Publish ping: `.github/workflows/indexnow-ping.yml`
- Topic queue: `content/automation-topics.json`
- Generator: `scripts/generate-content-post.mjs`
- IndexNow script: `scripts/ping-indexnow.mjs`

### Local commands

```bash
npm run content:dry-run
npm run content:generate
```

### IndexNow setup (optional, recommended)

1. Generate an IndexNow key in Bing Webmaster Tools.
2. Add a repository secret named `INDEXNOW_KEY` in GitHub.
3. Upload `<key>.txt` to `static/` so it resolves at:
   `https://lipstickmatcher.com/<key>.txt`

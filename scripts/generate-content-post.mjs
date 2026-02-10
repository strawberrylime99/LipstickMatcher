import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TOPICS_PATH = path.join(ROOT, 'content', 'automation-topics.json');
const BLOG_DIR = path.join(ROOT, 'src', 'routes', 'blog');
const COLOR_UTILS_PATH = path.join(ROOT, 'src', 'lib', 'colorUtils.ts');
const DRY_RUN = process.argv.includes('--dry-run');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function toIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateStamp() {
  return toIsoDate().replace(/-/g, '');
}

function buildUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 2;
  while (fs.existsSync(path.join(BLOG_DIR, `${slug}.md`))) {
    slug = `${baseSlug}-${dateStamp()}-${counter}`;
    counter += 1;
  }
  return slug;
}

function extractBlock(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  if (start === -1) return '';
  const end = source.indexOf(endNeedle, start);
  if (end === -1) return '';
  return source.slice(start, end + endNeedle.length);
}

function extractQuotedValues(text) {
  const values = [];
  const re = /'([^']+)'/g;
  let match = re.exec(text);
  while (match) {
    values.push(match[1]);
    match = re.exec(text);
  }
  return values;
}

function getLogicSnapshot() {
  const source = fs.readFileSync(COLOR_UTILS_PATH, 'utf8');

  const toneMapBlock = extractBlock(
    source,
    'const toneMap: Record<string, string[]> = {',
    '};'
  );
  const undertoneMapBlock = extractBlock(
    source,
    'const shadeMap = {',
    '};'
  );
  const fallbackMatch = source.match(/const fallback = \[(.*?)\];/s);

  const toneArrays = [...toneMapBlock.matchAll(/\[(.*?)\]/gs)].map((m) => m[1]);
  const toneShades = toneArrays.flatMap((arrText) => extractQuotedValues(arrText));
  const undertoneArrays = [...undertoneMapBlock.matchAll(/\[(.*?)\]/gs)].map((m) => m[1]);
  const undertoneShades = undertoneArrays.flatMap((arrText) => extractQuotedValues(arrText));
  const fallbackShades = fallbackMatch ? extractQuotedValues(fallbackMatch[1]) : [];

  const merged = [...new Set([...toneShades, ...undertoneShades, ...fallbackShades])];
  const shownPool = merged.slice(0, 15).join(', ');

  return {
    shownPool,
    poolCount: merged.length,
    sourcePath: 'src/lib/colorUtils.ts'
  };
}

function buildPost(topic, dateIso, logicSnapshot) {
  const tags = `[${topic.tags.map((tag) => `"${tag}"`).join(', ')}]`;
  return `---
title: "${topic.title}"
description: "${topic.description}"
date: ${dateIso}
tags: ${tags}
---

If you have ever wondered why one lipstick looks amazing in store lighting but feels off in daylight, you are not alone.
Most of us are balancing tone depth, undertone, and finish all at once, and that can get confusing fast.

For this guide, we are keeping things simple and aligned with how **Lipstick Matcher** actually works.
That means this article follows the same matching logic used in the app, sourced from \`${logicSnapshot.sourcePath}\`.

## The quick takeaway

Start with undertone alignment first, then adjust depth and finish.
You will usually get better results faster than chasing trend names alone.

## How Lipstick Matcher decides your shades

1. Your selfie is sampled from the cheek area.
2. RGB values are converted to HSL to estimate tone depth.
3. Undertone is classified as cool, warm, or neutral.
4. Tone-based and undertone-based shade lists are merged.
5. The app returns up to 3 unique suggestions.

## What this means in practice

If your result feels close but not perfect, your best next move is usually:

- Same undertone family
- One step lighter or deeper
- A finish adjustment (matte, satin, or gloss) based on comfort

## Matching notes from the current code

- Low saturation (\`s < 20\`) is treated as neutral.
- Very light skin has specific cool checks.
- Hue ranges are used for warm/cool decisions with neutral fallback.

Current in-app shade token pool includes:
${logicSnapshot.shownPool}.

Total unique shade tokens currently referenced in code: ${logicSnapshot.poolCount}.

## Try your own match

Use the [Lipstick Matcher](/) for a quick starting point, then review [how it is matched](/how-its-matched) if you want the technical breakdown.
`;
}

function main() {
  if (!fs.existsSync(TOPICS_PATH)) {
    throw new Error(`Missing topic file: ${TOPICS_PATH}`);
  }
  if (!fs.existsSync(BLOG_DIR)) {
    throw new Error(`Missing blog directory: ${BLOG_DIR}`);
  }
  if (!fs.existsSync(COLOR_UTILS_PATH)) {
    throw new Error(`Missing logic source file: ${COLOR_UTILS_PATH}`);
  }

  const config = readJson(TOPICS_PATH);
  if (!Array.isArray(config.topics) || config.topics.length === 0) {
    throw new Error('automation-topics.json must include a non-empty topics array.');
  }

  const cursor = Number.isInteger(config.cursor) ? config.cursor : 0;
  const topic = config.topics[cursor % config.topics.length];
  const dateIso = toIsoDate();
  const slug = buildUniqueSlug(topic.slug);
  const postPath = path.join(BLOG_DIR, `${slug}.md`);
  const logicSnapshot = getLogicSnapshot();
  const postBody = buildPost(topic, dateIso, logicSnapshot);

  if (DRY_RUN) {
    console.log(`[dry-run] Next topic index: ${cursor}`);
    console.log(`[dry-run] New slug: ${slug}`);
    console.log(`[dry-run] Would write: ${postPath}`);
    console.log(`[dry-run] Logic source: ${logicSnapshot.sourcePath}`);
    console.log(`[dry-run] Parsed shade tokens: ${logicSnapshot.poolCount}`);
    return;
  }

  fs.writeFileSync(postPath, postBody, 'utf8');
  config.cursor = cursor + 1;
  writeJson(TOPICS_PATH, config);

  console.log(`Created post: src/routes/blog/${slug}.md`);
  console.log(`Advanced topic cursor to: ${config.cursor}`);
}

main();

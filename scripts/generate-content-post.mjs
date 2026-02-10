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
  const undertoneFamilies = { cool: [], warm: [], neutral: [] };

  if (undertoneMapBlock) {
    const mapText = undertoneMapBlock;
    const coolMatch = mapText.match(/cool:\s*\[(.*?)\]/s);
    const warmMatch = mapText.match(/warm:\s*\[(.*?)\]/s);
    const neutralMatch = mapText.match(/neutral:\s*\[(.*?)\]/s);
    if (coolMatch) undertoneFamilies.cool = extractQuotedValues(coolMatch[1]);
    if (warmMatch) undertoneFamilies.warm = extractQuotedValues(warmMatch[1]);
    if (neutralMatch) undertoneFamilies.neutral = extractQuotedValues(neutralMatch[1]);
  }

  return {
    undertoneFamilies,
    poolPreview: merged.slice(0, 12).join(', '),
    poolCount: merged.length,
    sourcePath: 'src/lib/colorUtils.ts'
  };
}

function getRelatedTopics(topics, index) {
  if (topics.length < 2) return [];
  const prev = topics[(index - 1 + topics.length) % topics.length];
  const next = topics[(index + 1) % topics.length];
  return [prev, next];
}

function getExistingBlogSlugs() {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace('.md', ''));
}

function getRelatedLinks(topics, topic, index) {
  const existingSlugs = new Set(getExistingBlogSlugs());
  const byQueueNeighbors = getRelatedTopics(topics, index)
    .filter((item) => existingSlugs.has(item.slug) && item.slug !== topic.slug)
    .map((item) => ({ title: item.title, slug: item.slug }));

  if (byQueueNeighbors.length >= 2) return byQueueNeighbors.slice(0, 2);

  const fallbackExisting = topics
    .filter((item) => item.slug !== topic.slug && existingSlugs.has(item.slug))
    .slice(0, 2)
    .map((item) => ({ title: item.title, slug: item.slug }));

  return [...byQueueNeighbors, ...fallbackExisting].slice(0, 2);
}

function getTopicSpecificBlock(topic, logicSnapshot) {
  const slug = topic.slug.toLowerCase();
  const cool = logicSnapshot.undertoneFamilies.cool.slice(0, 3).join(', ');
  const warm = logicSnapshot.undertoneFamilies.warm.slice(0, 3).join(', ');
  const neutral = logicSnapshot.undertoneFamilies.neutral.slice(0, 3).join(', ');

  if (slug.includes('vs') || slug.includes('comparison')) {
    return `## Side-by-side test you can do in two minutes

Pick two shades that are close in depth, then compare them in daylight:

1. Apply one shade directly.
2. Take one selfie facing a window.
3. Switch to the second shade and repeat.
4. Keep the one that makes your skin look more balanced and bright.

If both look good, choose by vibe: polished for day, bolder for night.`;
  }

  if (slug.includes('mistakes')) {
    return `## Common mistakes and easy fixes

- Shade looks gray: move one step warmer.
- Shade looks too orange: move one step cooler.
- Shade looks heavy: try the same color family in a softer finish.
- Shade disappears: go one step deeper while keeping the same undertone family.`;
  }

  if (slug.includes('office')) {
    return `## Workday-friendly shade families

- Cool-leaning options: ${cool || 'rose, plum, berry'}.
- Warm-leaning options: ${warm || 'terracotta, coral, caramel'}.
- Neutral options: ${neutral || 'balanced nude, soft rose, muted plum'}.

Keep saturation moderate and finish comfortable for all-day wear.`;
  }

  return `## Shade families to try first

Start with families the matcher already favors:

- Cool-leaning: ${cool || 'rose, plum, berry'}.
- Warm-leaning: ${warm || 'terracotta, coral, caramel'}.
- Neutral-leaning: ${neutral || 'balanced nude, soft rose, clear gloss'}.

This gives you a practical starting point before fine-tuning depth and finish.`;
}

function buildPost(topic, dateIso, logicSnapshot, relatedTopics) {
  const tags = `[${topic.tags.map((tag) => `"${tag}"`).join(', ')}]`;
  const relatedLinks = relatedTopics.length
    ? relatedTopics.map((item) => `- [${item.title}](/blog/${item.slug})`).join('\n')
    : '- [Lipstick Matcher Blog](/blog)\n- [How It Is Matched](/how-its-matched)';
  const topicBlock = getTopicSpecificBlock(topic, logicSnapshot);

  return `---
title: "${topic.title}"
description: "${topic.description}"
date: ${dateIso}
tags: ${tags}
---

${topic.primaryKeyword} can feel confusing when you are trying to juggle undertone, depth, and finish at the same time.
This guide keeps it simple, practical, and aligned with the way Lipstick Matcher actually recommends shades.

## ${topic.primaryKeyword}: quick rules that work

- Match undertone first.
- Then adjust depth one step up or down.
- Use finish to control the final vibe.

## How Lipstick Matcher decides your shades

1. Your selfie is sampled from the cheek area.
2. Color values are used to estimate tone depth.
3. Undertone is classified as cool, warm, or neutral.
4. Tone-based and undertone-based shade lists are merged.
5. The app returns up to 3 unique suggestions.

${topicBlock}

## 3 fast rules for better picks

1. Stay in the same undertone family before changing anything else.
2. If a shade feels flat, go one step deeper.
3. If a shade feels heavy, try the same family in a softer finish.

## Common mistakes to avoid

- Choosing only by trend names.
- Testing under harsh lighting.
- Switching undertone and depth at the same time.

## Quick FAQ

### How do I know if I should go lighter or deeper?
If the shade disappears, go deeper. If it feels too intense, go lighter.

### What if two shades both look good?
Pick based on finish and occasion. Matte usually reads bolder, while satin or gloss looks softer.

### Is this based on random beauty trends?
No. The guide follows the same logic family used by the matcher so recommendations feel consistent.

## Try your own match

Use the [Lipstick Matcher](/) to get your shade starting point in under a minute.
Want the method overview? See [How It Is Matched](/how-its-matched).

## Related guides

${relatedLinks}
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
  const topicIndex = cursor % config.topics.length;
  const topic = config.topics[topicIndex];
  const relatedTopics = getRelatedLinks(config.topics, topic, topicIndex);
  const dateIso = toIsoDate();
  const slug = buildUniqueSlug(topic.slug);
  const postPath = path.join(BLOG_DIR, `${slug}.md`);
  const logicSnapshot = getLogicSnapshot();
  const postBody = buildPost(topic, dateIso, logicSnapshot, relatedTopics);

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

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TOPICS_PATH = path.join(ROOT, 'content', 'automation-topics.json');
const BLOG_DIR = path.join(ROOT, 'src', 'routes', 'blog');
const SHADE_RULES_PATH = path.join(ROOT, 'src', 'lib', 'recommendations', 'shadeRules.ts');
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
  const source = fs.readFileSync(SHADE_RULES_PATH, 'utf8');

  const toneMapBlock = extractBlock(
    source,
    'export const TONE_SHADE_MAP',
    '};'
  );
  const undertoneMapBlock = extractBlock(
    source,
    'export const UNDERTONE_SHADE_MAP',
    '};'
  );

  const toneArrays = [...toneMapBlock.matchAll(/\[(.*?)\]/gs)].map((m) => m[1]);
  const toneShades = toneArrays.flatMap((arrText) => extractQuotedValues(arrText));
  const undertoneArrays = [...undertoneMapBlock.matchAll(/\[(.*?)\]/gs)].map((m) => m[1]);
  const undertoneShades = undertoneArrays.flatMap((arrText) => extractQuotedValues(arrText));

  const merged = [...new Set([...toneShades, ...undertoneShades])];
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
    sourcePath: 'src/lib/recommendations/shadeRules.ts'
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

function inferPostStyle(topic, index) {
  const slug = topic.slug.toLowerCase();
  const title = topic.title.toLowerCase();

  if (slug.includes('vs') || slug.includes('comparison') || title.includes(' vs ')) {
    return 'comparison';
  }
  if (slug.includes('mistakes')) {
    return 'mistakes';
  }
  if (slug.includes('office')) {
    return 'office';
  }
  if (slug.includes('lighting')) {
    return 'troubleshooting';
  }
  if (slug.includes('test')) {
    return 'quick-test';
  }
  if (slug.includes('dry-lips') || title.includes('dry lips')) {
    return 'finish-guide';
  }

  return index % 2 === 0 ? 'guide' : 'practical-list';
}

function buildTitleOptions(topic, style) {
  const options = [topic.title];

  if (style === 'comparison') {
    options.push(`${topic.title} Without the Guesswork`);
    options.push(`Blue-Red or Orange-Red? A Simple Way to Choose`);
  } else if (style === 'mistakes') {
    options.push(`Lipstick Shade Mistakes That Are Easy to Fix`);
    options.push(`The Lipstick Mistakes That Make a Shade Feel "Off"`);
  } else if (style === 'quick-test') {
    options.push(`A Fast Way to Figure Out Your Undertone`);
    options.push(`Warm, Cool, or Neutral? Try This Quick Undertone Check`);
  } else if (style === 'finish-guide') {
    options.push(`How to Choose a Lipstick Finish If Your Lips Get Dry`);
    options.push(`Dry Lips? Start With the Right Lipstick Finish`);
  } else if (style === 'office') {
    options.push(`Easy Lipstick Shades That Still Look Polished at Work`);
    options.push(`Work-Appropriate Lipstick Shades That Do Not Feel Boring`);
  } else if (style === 'troubleshooting') {
    options.push(`Why Your Lipstick Match Changes in Different Lighting`);
    options.push(`The Lighting Mistake That Can Throw Off Shade Matching`);
  } else {
    options.push(`${topic.title}: A Simple, Practical Guide`);
    options.push(`How to Make ${topic.primaryKeyword} Easier`);
  }

  return [...new Set(options)].slice(0, 3);
}

function buildIntro(topic, style) {
  if (style === 'comparison') {
    return `Some lipstick choices look dramatic on paper but feel obvious once you see them side by side. ${topic.title} is one of those decisions.

If you have ever held two reds in your hand and thought "one of these probably works better on me, but I cannot tell which," this is the kind of comparison that helps fast.`;
  }

  if (style === 'mistakes') {
    return `A lipstick can be a good color and still feel wrong once it is on. Usually that comes down to one small mismatch, not a total disaster.

This is where most people overcorrect. They throw out a whole color family when the real fix is often just a tweak to undertone, depth, or finish.`;
  }

  if (style === 'quick-test') {
    return `Undertone advice can get overcomplicated really quickly. You do not need a full beauty science lecture to get a useful answer.

If you want a simple way to narrow things down before picking lipstick shades, this is a much easier place to start.`;
  }

  if (style === 'troubleshooting') {
    return `If your lipstick match looks good in one photo and completely different in another, you are probably not imagining it. Lighting changes a lot.

The good news is that once you know what kind of lighting is throwing things off, it gets much easier to judge shades more accurately.`;
  }

  if (style === 'office') {
    return `A lot of "everyday lipstick" advice ends up meaning beige, barely there, and a little boring. That is not actually the goal.

The better target is polished, easy to wear, and still flattering on your own coloring.`;
  }

  if (style === 'finish-guide') {
    return `A lipstick shade can be right while the finish is completely wrong for your lips. That is why a color you love can still end up looking uncomfortable by lunch.

If your lips get dry, the best choice is usually not about avoiding whole categories. It is about knowing what wears well on you.`;
  }

  return `Picking the right lipstick can get weirdly complicated fast. One shade looks perfect in the tube, then somehow turns too bright, too flat, or just not quite right once it is on.

That is usually not because you are bad at choosing lipstick. It is more that undertone, depth, and finish all pull the final look in slightly different directions.`;
}

function buildQuickRules(style) {
  if (style === 'comparison') {
    return `## Quick rules before you compare

- Keep depth similar when comparing two shades.
- Judge the color in daylight if you can.
- Pay attention to what makes your skin look clearer, not just what looks bolder in the tube.`;
  }

  if (style === 'finish-guide') {
    return `## Quick rules before you pick a finish

- If your lips get dry fast, comfort matters as much as color.
- Satin is usually the easiest middle ground.
- Gloss can make a shade feel fresher without changing the undertone family.`;
  }

  return `## Quick rules that make this easier

- Start with undertone.
- Adjust depth second.
- Use finish to make the color feel softer, cleaner, bolder, or more relaxed.`;
}

function buildCoreSection(topic, style, topicBlock) {
  if (style === 'comparison') {
    return `## What usually separates these two shades

Most of the difference comes down to undertone temperature and how bright the color feels against your skin.

${topicBlock}`;
  }

  if (style === 'quick-test') {
    return `## A simple way to narrow it down

You do not need ten tests. You just need one or two that are easy to repeat and easy to read.

${topicBlock}`;
  }

  if (style === 'mistakes') {
    return `## What is probably going wrong

When a lipstick feels harsher, duller, or stranger than expected, it is usually one of a few very fixable things.

${topicBlock}`;
  }

  return topicBlock;
}

function buildPracticalSection(style) {
  if (style === 'office') {
    return `## How to make an everyday shade feel more polished

1. Keep the shade in a family that already flatters your undertone.
2. Choose a finish you will not need to babysit all day.
3. Let the depth do the work instead of reaching for a louder color every time.`;
  }

  if (style === 'troubleshooting') {
    return `## How to get a more reliable read on a shade

1. Check the color in front-facing daylight first.
2. Avoid judging it under warm bathroom lighting alone.
3. If a shade looks inconsistent, compare photos in the same lighting before changing the shade family.`;
  }

  return `## Three practical ways to get a better match

1. Keep the undertone family the same before changing anything else.
2. If a shade looks flat on you, go a little deeper.
3. If a shade feels too strong, try the same color family in a satin or glossy finish.`;
}

function buildMistakesSection(style) {
  if (style === 'comparison') {
    return `## Common comparison mistakes

- Comparing two shades under totally different lighting.
- Picking based on what looks trendier in the tube.
- Changing finish and shade family at the same time.`;
  }

  if (style === 'quick-test') {
    return `## Common undertone-test mistakes

- Doing the test in yellow indoor light.
- Expecting one clue to be perfect every time.
- Treating undertone like a strict rule instead of a helpful shortcut.`;
  }

  return `## Common mistakes that trip people up

- Picking only by trend names.
- Judging a shade under bad lighting.
- Changing undertone and depth at the same time, so it is hard to tell what actually helped.`;
}

function buildFaq(style) {
  if (style === 'comparison') {
    return `## Quick FAQ

### What if both shades look good?
That usually means the color family works on you and the choice is more about mood, finish, and occasion.

### What if both shades look slightly wrong?
Try keeping the same general color family but changing the undertone or depth one step at a time.

### Do I need to choose one "forever" red?
Not at all. Most people look good in more than one version once depth and finish are dialed in.`;
  }

  if (style === 'finish-guide') {
    return `## Quick FAQ

### Is matte always a bad idea for dry lips?
Not always, but it usually needs more prep and can make texture show up faster.

### What is the easiest finish to wear day to day?
For a lot of people, satin is the easiest balance between comfort and polish.

### Can gloss still work if I want color?
Yes. A gloss or balm-gloss finish can make a color feel more forgiving without making it disappear.`;
  }

  return `## Quick FAQ

### How do I know if I should go lighter or deeper?
If the shade disappears into your face, go a little deeper. If it starts to wear you instead of the other way around, go lighter or softer.

### What if two shades both look good?
Then you are choosing between good options, not fixing a mistake. Go by finish, vibe, and where you plan to wear it.

### Is this based on random beauty trends?
No. It follows the same matching logic family used by the app, so the advice stays consistent with the tool.`;
}

function getTopicSpecificBlock(topic, logicSnapshot) {
  const slug = topic.slug.toLowerCase();
  const cool = logicSnapshot.undertoneFamilies.cool.slice(0, 3).join(', ');
  const warm = logicSnapshot.undertoneFamilies.warm.slice(0, 3).join(', ');
  const neutral = logicSnapshot.undertoneFamilies.neutral.slice(0, 3).join(', ');

  if (slug.includes('vs') || slug.includes('comparison')) {
    return `## A quick side-by-side test

Pick two shades that are close in depth, then compare them in daylight:

1. Apply one shade directly.
2. Take one selfie facing a window.
3. Switch to the second shade and repeat.
4. Keep the one that makes your skin look more balanced and bright.

If both look good, that is honestly a win. Pick the one that fits the mood you want: softer for everyday, bolder for going out.`;
  }

  if (slug.includes('mistakes')) {
    return `## Easy fixes when a shade feels off

- Shade looks gray: move one step warmer.
- Shade looks too orange: move one step cooler.
- Shade looks heavy: try the same color family in a softer finish.
- Shade disappears: go one step deeper while keeping the same undertone family.`;
  }

  if (slug.includes('office')) {
    return `## Easy workday shade families

- Cool-leaning options: ${cool || 'rose, plum, berry'}.
- Warm-leaning options: ${warm || 'terracotta, coral, caramel'}.
- Neutral options: ${neutral || 'balanced nude, soft rose, muted plum'}.

Keep the saturation a little softer and the finish comfortable enough that you will still like it by mid-afternoon.`;
  }

  return `## Shade families worth trying first

Start with families the matcher already favors:

- Cool-leaning: ${cool || 'rose, plum, berry'}.
- Warm-leaning: ${warm || 'terracotta, coral, caramel'}.
- Neutral-leaning: ${neutral || 'balanced nude, soft rose, clear gloss'}.

This gives you a solid starting point before you fine-tune depth and finish.`;
}

function buildPost(topic, dateIso, logicSnapshot, relatedTopics, topicIndex) {
  const style = inferPostStyle(topic, topicIndex);
  const titleOptions = buildTitleOptions(topic, style);
  const intro = buildIntro(topic, style);
  const quickRules = buildQuickRules(style);
  const tags = `[${topic.tags.map((tag) => `"${tag}"`).join(', ')}]`;
  const relatedLinks = relatedTopics.length
    ? relatedTopics.map((item) => `- [${item.title}](/blog/${item.slug})`).join('\n')
    : '- [Lipstick Matcher Blog](/blog)\n- [How It Is Matched](/how-its-matched)';
  const topicBlock = getTopicSpecificBlock(topic, logicSnapshot);
  const coreSection = buildCoreSection(topic, style, topicBlock);
  const practicalSection = buildPracticalSection(style);
  const mistakesSection = buildMistakesSection(style);
  const faqSection = buildFaq(style);

  return `---
title: "${topic.title}"
description: "${topic.description}"
date: ${dateIso}
tags: ${tags}
---

<!--
Editor notes
- Style: ${style}
- Primary keyword: ${topic.primaryKeyword}
- Secondary keyword: ${topic.secondaryKeyword}
- Alternate titles:
  1. ${titleOptions[0] ?? topic.title}
  2. ${titleOptions[1] ?? topic.title}
  3. ${titleOptions[2] ?? topic.title}
-->

${intro}

This guide keeps things simple and practical, using the same general logic Lipstick Matcher uses when it suggests shades.

${quickRules}

## How Lipstick Matcher decides your shades

1. Your selfie is sampled from the cheek area.
2. Color values are used to estimate tone depth.
3. Undertone is classified as cool, warm, or neutral.
4. Tone-based and undertone-based shade lists are merged.
5. The app returns up to 3 unique suggestions.

${coreSection}

${practicalSection}

${mistakesSection}

${faqSection}

## Try your own match

If you want a faster starting point, use the [Lipstick Matcher](/) to get a few shade directions in under a minute.
If you want the full breakdown, see [How It Is Matched](/how-its-matched).

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
  if (!fs.existsSync(SHADE_RULES_PATH)) {
    throw new Error(`Missing logic source file: ${SHADE_RULES_PATH}`);
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
  const postBody = buildPost(topic, dateIso, logicSnapshot, relatedTopics, topicIndex);

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

---
title: "Best Lipstick Shades for Cool Undertones"
description: "A practical guide to cool-undertone lipstick shades, easy shade families to test, and common mistakes to avoid."
date: 2026-02-10
tags: ["lipstick", "cool undertone", "shade guide", "beauty tips"]
---

If you have ever wondered why one lipstick looks amazing in store lighting but feels off in daylight, you are not alone.
Most of us are balancing tone depth, undertone, and finish all at once, and that can get confusing fast.

For this guide, we are keeping things simple and aligned with how **Lipstick Matcher** actually works.
That means this article follows the same matching logic used in the app, sourced from `src/lib/colorUtils.ts`.

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

- Low saturation (`s < 20`) is treated as neutral.
- Very light skin has specific cool checks.
- Hue ranges are used for warm/cool decisions with neutral fallback.

Current in-app shade token pool includes:
ice pink, frosty rose, cloudberry, rosebud, shell pink, clear gloss, cool nude, warm peach, soft bronze, sunset coral, pink beige, terracotta, warm nude, rich coral, mocha.

Total unique shade tokens currently referenced in code: 43.

## Try your own match

Use the [Lipstick Matcher](/) for a quick starting point, then review [how it is matched](/how-its-matched) if you want the technical breakdown.

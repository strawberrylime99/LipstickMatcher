# Mobile UI Checklist

This checklist is based on the current homepage flow in [src/routes/+page.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/routes/+page.svelte), [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte), and [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte).

## Highest Priority

- [ ] Turn the match results widget into a true mobile bottom sheet.
Reason: the current fixed modal still behaves like a centered desktop dialog with only partial mobile adjustments.
Files: [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

- [ ] Add safe-area aware spacing for the floating results button and bottom-sheet content.
Reason: `bottom: 0.75rem` risks collisions with iPhone home indicator / browser chrome.
Files: [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

- [ ] Prevent background page scroll when the results widget is open.
Reason: modal + page scroll together usually feels rough on mobile and makes the overlay harder to use.
Files: [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

- [ ] Add a sticky mobile header area inside the results widget with the title and close action always visible.
Reason: once the shade list scrolls, closing or re-orienting becomes harder on small screens.
Files: [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

- [ ] Increase tap target sizes to at least 44px for nav pills, upload CTA, close button, and shop buttons.
Reason: several controls look close to acceptable, but mobile usability is better when the minimum touch target is enforced consistently.
Files: [src/routes/+page.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/routes/+page.svelte), [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte), [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte)

## Upload Flow

- [ ] Make the upload area read as a mobile-first action card, not a desktop drag-and-drop zone.
Reason: drag-and-drop is much less relevant on phones, so the primary message should emphasize tapping to choose photos.
Files: [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte)

- [ ] Add a dedicated mobile upload button inside the drop zone.
Reason: relying on the whole panel being clickable is less obvious on touch devices.
Files: [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte)

- [ ] Tighten copy length in the upload guidance block on small screens.
Reason: the guidance is helpful, but it becomes visually heavy before the user even starts.
Files: [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte)

- [ ] Rework preview thumbnails for narrow widths.
Reason: `minmax(160px, 1fr)` and fixed `height: 180px` can feel oversized and push important actions below the fold.
Files: [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte)

- [ ] Keep the progress state compact and visible without pushing content too far down.
Reason: the analyzer can get tall quickly once progress, errors, guidance, and previews all stack together.
Files: [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte)

## Homepage Layout

- [ ] Reduce vertical padding and section density with more deliberate mobile spacing tokens.
Reason: the page is already responsive, but many sections still scale down from desktop rather than being intentionally composed for mobile.
Files: [src/routes/+page.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/routes/+page.svelte)

- [ ] Revisit hero hierarchy so the upload action is visible sooner on first load.
Reason: on mobile, the hero, nav, copy, and uploader can create too much pre-action scrolling.
Files: [src/routes/+page.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/routes/+page.svelte)

- [ ] Consider a simpler mobile nav treatment.
Reason: three pill links plus the logo can wrap awkwardly and compete with the primary task.
Files: [src/routes/+page.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/routes/+page.svelte)

- [ ] Audit card border radii, shadows, and padding so the page feels lighter on phones.
Reason: multiple large rounded containers stacked together can make the layout feel bulky.
Files: [src/routes/+page.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/routes/+page.svelte), [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte), [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

## Results Readability

- [ ] Make metric cards stack with tighter spacing and stronger labels on phones.
Reason: sample, tone, and undertone are useful, but they should scan instantly before the user reaches the shopping links.
Files: [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

- [ ] Shorten shade-card copy and reduce line-length in the recommendation reasons.
Reason: long paragraphs inside cards make the results sheet feel dense on mobile.
Files: [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

- [ ] Keep the primary action visible near the top of each recommendation card.
Reason: after the cards stack to one column, the CTA can drift too far from the shade name and rank.
Files: [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

- [ ] Add explicit overflow handling for long shade names.
Reason: product names can eventually create awkward wrapping in small layouts.
Files: [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

## Interaction + Accessibility

- [ ] Add visible keyboard focus states that also look good on touch devices with external keyboards.
Reason: hover styling is present, but focus styling should be equally intentional.
Files: [src/routes/+page.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/routes/+page.svelte), [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte), [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

- [ ] Add focus management when the results widget opens and closes.
Reason: mobile screen readers and keyboard users benefit when the dialog receives focus and returns focus predictably.
Files: [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

- [ ] Review color contrast on pink text, pills, and helper copy at mobile font sizes.
Reason: some muted text may become harder to read on smaller screens and in bright environments.
Files: [src/routes/+page.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/routes/+page.svelte), [src/lib/components/UploadAnalyzer.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/UploadAnalyzer.svelte), [src/lib/components/MatchResults.svelte](c:/Users/jesth/WebApps/LipstickMatcher/src/lib/components/MatchResults.svelte)

## QA Checklist

- [ ] Test on narrow mobile widths around 320px to 390px.
- [ ] Test in Safari iOS and Chrome Android, not just desktop responsive mode.
- [ ] Test with long result text and all three preview images present.
- [ ] Test the open, close, and reopen behavior of the results widget after multiple uploads.
- [ ] Test with browser bottom bars expanded/collapsed to catch fixed-position spacing issues.
- [ ] Test one-handed usage: upload, scroll, open results, close results, and tap shop links.

## Suggested Build Order

- [ ] Phase 1: Fix the results widget behavior on mobile.
- [ ] Phase 2: Simplify the upload section for touch-first use.
- [ ] Phase 3: Tighten homepage spacing and section hierarchy.
- [ ] Phase 4: Run a dedicated mobile QA pass and polish.

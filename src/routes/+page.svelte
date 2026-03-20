<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { injectAnalytics, track } from '@vercel/analytics/sveltekit';
	import UploadAnalyzer from '$lib/components/UploadAnalyzer.svelte';
	import MatchResults from '$lib/components/MatchResults.svelte';
	import { loadFaceApiModels } from '$lib/analysis/faceModel';
	import { analyzeSelfieImage } from '$lib/analysis/analyzeSelfie';
	import type { FaceApiModule } from '$lib/analysis/types';
	import { buildMatchProfile } from '$lib/recommendations/buildMatchProfile';
	import { posts } from './blog/_posts';

	injectAnalytics();

	type UploadSource = 'file_picker' | 'drop_zone';

	let imageUrl: string | null = null;
	let imageElement: HTMLImageElement | null = null;
	let faceapi: FaceApiModule | null = null;
	let uploadInput: HTMLInputElement | null = null;

	let sampledHex: string | null = null;
	let suggestedShades: string[] = [];
	let detectedTone: string | null = null;
	let detectedUndertone: string | null = null;

	let isModelLoading = true;
	let modelLoadError: string | null = null;
	let isAnalyzing = false;
	let analysisError: string | null = null;
	let analysisProgress = 0;
	let analysisStage = 'Preparing image...';
	let isDragActive = false;
	let progressInterval: ReturnType<typeof setInterval> | null = null;

	const siteUrl = 'https://lipstickmatcher.com';
	const latestPosts = [...posts]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 3);

	const homeStructuredData = JSON.stringify([
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Lipstick Matcher',
			url: siteUrl,
			description: 'Find lipstick shades that fit your skin tone and undertone with a selfie.',
			potentialAction: {
				'@type': 'SearchAction',
				target: `${siteUrl}/blog?q={search_term_string}`,
				'query-input': 'required name=search_term_string'
			}
		},
		{
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: 'Lipstick Matcher',
			applicationCategory: 'LifestyleApplication',
			operatingSystem: 'Web Browser',
			url: siteUrl,
			description:
				'AI lipstick matching tool that analyzes selfie skin tone and undertone to suggest lipstick shades.',
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'USD'
			}
		}
	]);

	function getPostCategory(post: any): string {
		if (Array.isArray(post.tags) && post.tags.length > 0) {
			return String(post.tags[0]);
		}
		return 'Guide';
	}

	function trackAffiliateClick(shade: string, position: number) {
		track('affiliate_click', {
			shade,
			position,
			placement: 'homepage_recommendations',
			merchant: 'amazon'
		});
	}

	// Keep progress state updates in one place for the page-level workflow.
	function startProgress() {
		analysisProgress = 10;
		analysisStage = 'Preparing image...';
		if (progressInterval) clearInterval(progressInterval);
		progressInterval = setInterval(() => {
			if (analysisProgress < 88) {
				analysisProgress += 1;
			}
		}, 140);
	}

	function updateProgress(progress: number, stage: string) {
		analysisProgress = Math.max(analysisProgress, progress);
		analysisStage = stage;
	}

	function stopProgress() {
		if (progressInterval) {
			clearInterval(progressInterval);
			progressInterval = null;
		}
	}

	function resetResults() {
		analysisError = null;
		sampledHex = null;
		suggestedShades = [];
		detectedTone = null;
		detectedUndertone = null;
	}

	function openFileDialog() {
		uploadInput?.click();
	}

	function onDropZoneKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openFileDialog();
		}
	}

	onMount(async () => {
		try {
			if (typeof window === 'undefined') return;
			faceapi = await loadFaceApiModels();
			isModelLoading = false;
		} catch (error) {
			console.error(error);
			isModelLoading = false;
			modelLoadError = 'Model failed to load. Refresh and try again.';
		}
	});

	onDestroy(() => {
		stopProgress();
	});

	// The page now orchestrates analysis while shared modules handle the heavy lifting.
	async function analyzeImage(imageDataUrl: string, source: UploadSource) {
		isAnalyzing = true;
		resetResults();
		startProgress();
		track('upload_started', { source });

		try {
			imageUrl = imageDataUrl;
			await tick();
			updateProgress(30, 'Checking photo quality...');

			if (!imageElement || !faceapi) {
				throw new Error('Model is still loading. Try again in a moment.');
			}

			const { rgb } = await analyzeSelfieImage(imageElement, faceapi, ({ progress, stage }) => {
				updateProgress(progress, stage);
			});

			updateProgress(90, 'Building your lipstick matches...');

			const profile = buildMatchProfile(rgb);
			sampledHex = profile.sampledHex;
			detectedTone = profile.detectedTone;
			detectedUndertone = profile.detectedUndertone;
			suggestedShades = profile.suggestedShades;

			analysisProgress = 100;
			analysisStage = 'Done';
			track('analysis_complete', {
				source,
				detectedTone,
				detectedUndertone,
				shadeCount: suggestedShades.length
			});
		} catch (error) {
			analysisError = error instanceof Error ? error.message : 'Could not process this photo.';
			track('analysis_error', {
				source,
				message: analysisError
			});
		} finally {
			stopProgress();
			isAnalyzing = false;
		}
	}

	async function handleFile(file: File, source: UploadSource) {
		const imageDataUrl = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => resolve((e.target?.result as string) ?? '');
			reader.onerror = () => reject(new Error('Could not read uploaded file.'));
			reader.readAsDataURL(file);
		});

		await analyzeImage(imageDataUrl, source);
	}

	async function handleUpload(event: Event) {
		const file = (event.target as HTMLInputElement)?.files?.[0];
		if (!file) return;
		await handleFile(file, 'file_picker');
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragActive = false;
		const file = event.dataTransfer?.files?.[0];
		if (!file) return;
		await handleFile(file, 'drop_zone');
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragActive = true;
	}

	function handleDragLeave() {
		isDragActive = false;
	}
</script>

<svelte:head>
	<title>AI Lipstick Matcher | Find Your Best Lip Color in Seconds</title>
	<meta
		name="description"
		content="Upload one selfie to get lipstick shade matches based on your skin tone and undertone. Fast, private, and free lipstick recommendations."
	/>
	<meta
		name="keywords"
		content="lipstick matcher, lipstick shade finder, AI lipstick tool, undertone lipstick match, beauty tech"
	/>
	<meta name="author" content="Lipstick Matcher" />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<link rel="canonical" href="https://lipstickmatcher.com/" />

	<meta property="og:type" content="website" />
	<meta property="og:title" content="AI Lipstick Matcher | Find Your Best Lip Color in Seconds" />
	<meta
		property="og:description"
		content="Get lipstick shade recommendations from your selfie using skin tone and undertone analysis."
	/>
	<meta property="og:image" content="https://lipstickmatcher.com/logo.png" />
	<meta property="og:url" content="https://lipstickmatcher.com/" />
	<meta property="og:site_name" content="Lipstick Matcher" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="AI Lipstick Matcher | Find Your Best Lip Color in Seconds" />
	<meta
		name="twitter:description"
		content="Find lipstick shades that fit your tone and undertone from a single selfie."
	/>
	<meta name="twitter:image" content="https://lipstickmatcher.com/logo.png" />

	<script type="application/ld+json">{homeStructuredData}</script>
</svelte:head>

<main class="page">
	<header class="hero">
		<div class="hero-topbar">
			<a href="/" class="brand">
				<img src="/logo.png" alt="Lipstick Matcher" class="brand-logo" />
			</a>
			<nav class="nav-links" aria-label="Main navigation">
				<a href="/" aria-current="page">Matcher</a>
				<a href="/how-its-matched">How It Works</a>
				<a href="/blog">Blog</a>
			</nav>
		</div>

		<div class="hero-grid">
			<div class="hero-copy">
				<p class="eyebrow">PERSONALIZED BEAUTY MATCHING</p>
				<h1>Find lipstick shades that look right on you</h1>
				<p>
					Upload a clear selfie and get your best matches in under a minute. No signup, no app install,
					no guesswork.
				</p>
				<div class="hero-actions">
					<button class="cta-primary cta-upload" on:click={openFileDialog} disabled={isModelLoading}>
						Upload selfie
					</button>
				</div>
			</div>
		</div>

		<UploadAnalyzer
			bind:uploadInput
			bind:imageElement
			{isModelLoading}
			{modelLoadError}
			{isAnalyzing}
			{analysisError}
			{analysisProgress}
			{analysisStage}
			{imageUrl}
			{isDragActive}
			on:selectfile={openFileDialog}
			on:upload={(event) => handleUpload(event.detail)}
			on:dropfile={(event) => handleDrop(event.detail)}
			on:dragoverzone={(event) => handleDragOver(event.detail)}
			on:dragleavezone={handleDragLeave}
			on:keyactivate={(event) => onDropZoneKeydown(event.detail)}
		/>
	</header>

	<MatchResults
		{sampledHex}
		{detectedTone}
		{detectedUndertone}
		{suggestedShades}
		on:affiliateclick={(event) => trackAffiliateClick(event.detail.shade, event.detail.position)}
	/>

	<section class="why-trust" aria-labelledby="why-trust-title">
		<h2 id="why-trust-title">What makes the results feel polished</h2>
		<div class="trust-grid">
			<article>
				<h3><span class="mini-swatch" style="background:#f3a6b6"></span>Clear color profile</h3>
				<p>Each result includes the sampled cheek color plus tone and undertone details.</p>
			</article>
			<article>
				<h3><span class="mini-swatch" style="background:#f4b49f"></span>Wearable shade picks</h3>
				<p>Recommendations are curated to be practical, not generic color labels.</p>
			</article>
			<article>
				<h3><span class="mini-swatch" style="background:#d2749a"></span>Quick comparison flow</h3>
				<p>Fast processing makes it easy to test multiple photos and compare outcomes.</p>
			</article>
		</div>
	</section>

	<section class="content-boost" aria-labelledby="content-boost-title">
		<div class="section-head">
			<h2 id="content-boost-title">Latest guides</h2>
			<a href="/blog" class="secondary-link">View all articles</a>
		</div>
		<ul class="article-list">
			{#each latestPosts as post}
				<li>
					<a href={`/blog/${post.slug}`}>
						<div class="guide-main">
							<span class="guide-pill"><span class="pill-dot"></span>{getPostCategory(post)}</span>
							<span>{post.title}</span>
						</div>
						<small>
							{new Date(post.date).toLocaleDateString('en-US', {
								month: 'long',
								day: 'numeric',
								year: 'numeric'
							})}
						</small>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<section class="faq" aria-labelledby="faq-title">
		<h2 id="faq-title">Common questions</h2>
		<div>
			<h3>Do I need an account?</h3>
			<p>No. You can upload a photo and get recommendations immediately.</p>
		</div>
		<div>
			<h3>How accurate is the match?</h3>
			<p>Results are strongest when lighting is even and your face is front-facing.</p>
		</div>
		<div>
			<h3>What if no face is detected?</h3>
			<p>Try a brighter image, remove filters, and make sure your full face is visible.</p>
		</div>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Manrope', 'Segoe UI', sans-serif;
		background:
			radial-gradient(circle at top left, rgba(247, 168, 184, 0.12) 0%, rgba(247, 168, 184, 0) 45%),
			linear-gradient(160deg, #fff7f9 0%, #fff5f2 100%);
		color: #1f2937;
	}

	.page {
		max-width: 1120px;
		margin: 0 auto;
		padding: 1.25rem 1rem 4rem;
	}

	.hero {
		border: 1px solid #f0d8de;
		background: linear-gradient(130deg, #ffffff 0%, #fff4f8 100%);
		border-radius: 24px;
		padding: 1rem 1rem 1.5rem;
		box-shadow: 0 20px 50px rgba(134, 49, 83, 0.08);
	}

	.hero-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.hero-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.8rem;
		align-items: stretch;
		margin-top: 0.9rem;
	}

	.brand {
		display: inline-block;
		text-decoration: none;
	}

	.brand-logo {
		width: 178px;
		height: auto;
		display: block;
		box-shadow: none;
		filter: none;
		background: transparent;
		border: 0;
		border-radius: 0;
	}

	.nav-links {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
	}

	.nav-links a {
		text-decoration: none;
		padding: 0.52rem 0.9rem;
		border-radius: 999px;
		font-weight: 700;
		color: #8e3f5f;
		background: #fff0f5;
		border: 1px solid #efc6d5;
		font-size: 0.92rem;
		transition: transform 150ms ease, box-shadow 150ms ease;
	}

	.nav-links a:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(164, 75, 110, 0.12);
	}

	.nav-links a[aria-current='page'] {
		background: #cf6f96;
		color: #fff;
		border-color: #cf6f96;
	}

	.eyebrow {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		font-weight: 800;
		font-size: 0.72rem;
		color: #a94b6e;
	}

	h1 {
		margin: 0.45rem 0 0.8rem;
		font-size: clamp(1.9rem, 4vw, 3rem);
		line-height: 1.1;
		color: #61263f;
		font-family: 'Cormorant Garamond', 'Georgia', serif;
		font-weight: 700;
	}

	h2 {
		margin: 0;
		font-size: 1.3rem;
		color: #6e2e4d;
	}

	.hero-copy p {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.6;
		color: #4b5563;
	}

	.hero-actions {
		display: flex;
		gap: 0.65rem;
		flex-wrap: wrap;
		margin-top: 1rem;
		justify-content: center;
	}

	.cta-primary,
	.secondary-link {
		font-family: 'Manrope', 'Segoe UI', sans-serif;
	}

	.cta-primary {
		border: none;
		border-radius: 999px;
		padding: 0.72rem 1.2rem;
		font-weight: 800;
		cursor: pointer;
		color: #fff;
		background: linear-gradient(120deg, #d84d7f 0%, #b22856 100%);
		box-shadow: 0 10px 24px rgba(150, 34, 78, 0.28);
		transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
	}

	.cta-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 14px 28px rgba(150, 34, 78, 0.35);
		filter: saturate(1.08);
	}

	.cta-primary:active {
		transform: translateY(0);
	}

	.cta-upload {
		padding: 0.8rem 1.35rem;
		font-size: 1rem;
	}

	.secondary-link {
		border: 1px solid #e7a3bf;
		background: #fff;
		color: #9f3f67;
		padding: 0.66rem 1rem;
		border-radius: 999px;
		font-weight: 700;
		cursor: pointer;
		text-decoration: none;
		transition: transform 150ms ease, box-shadow 150ms ease;
	}

	.secondary-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(173, 74, 113, 0.14);
	}

	.hero :global(.analyzer) {
		margin-top: 1.1rem;
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
	}

	.why-trust,
	.content-boost,
	.faq {
		margin-top: 1.25rem;
		padding: 1.2rem;
		background: #fff;
		border: 1px solid #efd8df;
		border-radius: 18px;
		box-shadow: 0 12px 26px rgba(102, 41, 66, 0.05);
	}

	.trust-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
		margin-top: 0.8rem;
	}

	.trust-grid article {
		padding: 0.9rem;
		border: 1px solid #efd5df;
		border-radius: 12px;
		background: #fff8fb;
		transition: transform 140ms ease, box-shadow 140ms ease;
	}

	.trust-grid article:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 22px rgba(172, 78, 116, 0.1);
	}

	.mini-swatch {
		display: inline-block;
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 50%;
		margin-right: 0.4rem;
		vertical-align: middle;
	}

	.trust-grid h3 {
		margin: 0;
		font-size: 1rem;
		color: #6f2f4f;
	}

	.trust-grid p {
		margin: 0.45rem 0 0;
		color: #5a5561;
		line-height: 1.5;
	}

	.article-list {
		list-style: none;
		padding: 0;
		margin: 0.8rem 0 0;
		display: grid;
		gap: 0.6rem;
	}

	.article-list a {
		display: flex;
		justify-content: space-between;
		gap: 0.9rem;
		align-items: baseline;
		text-decoration: none;
		padding: 0.8rem 0.9rem;
		border-radius: 11px;
		border: 1px solid #edd1de;
		background: #fff9fb;
		color: #6a2d48;
		font-weight: 700;
		transition: transform 140ms ease, box-shadow 140ms ease;
	}

	.article-list a:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(172, 78, 116, 0.1);
	}

	.guide-main {
		display: grid;
		gap: 0.3rem;
	}

	.guide-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.18rem 0.5rem;
		border-radius: 999px;
		background: #fdebf1;
		color: #9f3f67;
		width: fit-content;
		text-transform: capitalize;
	}

	.pill-dot {
		width: 0.42rem;
		height: 0.42rem;
		border-radius: 50%;
		background: #e77aa6;
		display: inline-block;
	}

	.article-list small {
		color: #8b6778;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.faq > div {
		margin-top: 0.8rem;
		padding-top: 0.8rem;
		border-top: 1px solid #efdbe3;
	}

	.faq h3 {
		margin: 0;
		font-size: 1rem;
		color: #6f2f4f;
	}

	.faq p {
		margin: 0.45rem 0 0;
		color: #5a5561;
	}

	@media (max-width: 720px) {
		.page {
			padding: 0.8rem 0.75rem 3rem;
		}

		.hero,
		.why-trust,
		.content-boost,
		.faq {
			border-radius: 14px;
			padding: 1rem;
		}

		.article-list a {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>

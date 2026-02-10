<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { injectAnalytics, track } from '@vercel/analytics/sveltekit';
	import { rgbToHex, getToneNameFromRGB, getBestMatchedShades, getUndertone } from '$lib/colorUtils';
	import { shadeColors } from '$lib/shadeColors';
	import { posts } from './blog/_posts';

	injectAnalytics();

	type Point = { x: number; y: number };
	type UploadSource = 'file_picker' | 'drop_zone' | 'sample_photo';

	let imageUrl: string | null = null;
	let imageElement: HTMLImageElement | null = null;
	let faceapi: typeof import('face-api.js') | null = null;
	let uploadInput: HTMLInputElement | null = null;
	let uploaderSection: HTMLElement | null = null;

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
	let workflowStep = 0;
	let progressInterval: ReturnType<typeof setInterval> | null = null;

	const siteUrl = 'https://lipstickmatcher.com';
	const latestPosts = [...posts]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 3);

	const heroSwatches = [
		{ name: 'Rosy Nude', hex: '#ca8e8f' },
		{ name: 'Warm Peach', hex: '#f4a57f' },
		{ name: 'Blue-Red', hex: '#a51d31' }
	];

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

	function sampleMedianRgb(
		ctx: CanvasRenderingContext2D,
		center: Point,
		radius: number
	): [number, number, number] | null {
		const { width, height } = ctx.canvas;
		const x0 = Math.max(0, Math.floor(center.x - radius));
		const y0 = Math.max(0, Math.floor(center.y - radius));
		const x1 = Math.min(width - 1, Math.ceil(center.x + radius));
		const y1 = Math.min(height - 1, Math.ceil(center.y + radius));

		if (x0 > x1 || y0 > y1) return null;

		const rs: number[] = [];
		const gs: number[] = [];
		const bs: number[] = [];

		for (let y = y0; y <= y1; y++) {
			for (let x = x0; x <= x1; x++) {
				const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
				const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
				if (luminance < 25 || luminance > 240) continue;

				rs.push(r);
				gs.push(g);
				bs.push(b);
			}
		}

		if (!rs.length) return null;

		rs.sort((a, b) => a - b);
		gs.sort((a, b) => a - b);
		bs.sort((a, b) => a - b);
		const mid = Math.floor(rs.length / 2);

		return [rs[mid], gs[mid], bs[mid]];
	}

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
		workflowStep = 1;
	}

	function scrollToUploader() {
		uploaderSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
			const module = await import('face-api.js');
			faceapi = module;

			await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
			await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
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

	async function analyzeImage(imageDataUrl: string, source: UploadSource) {
		isAnalyzing = true;
		resetResults();
		startProgress();
		workflowStep = 2;
		track('upload_started', { source });

		try {
			imageUrl = imageDataUrl;
			await tick();
			updateProgress(30, 'Checking photo quality...');

			if (!imageElement || !faceapi) {
				throw new Error('Model is still loading. Try again in a moment.');
			}

			await imageElement.decode();
			updateProgress(48, 'Detecting face landmarks...');

			const result = await faceapi
				.detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
				.withFaceLandmarks();

			if (!result) {
				throw new Error('No face detected. Try a bright, front-facing photo.');
			}

			const imageWidth = imageElement.naturalWidth || imageElement.width;
			const imageHeight = imageElement.naturalHeight || imageElement.height;

			const resized = faceapi.resizeResults(result, {
				width: imageWidth,
				height: imageHeight
			});

			const leftEye = resized.landmarks.positions[36];
			const rightEye = resized.landmarks.positions[45];
			const nose = resized.landmarks.positions[30];
			const leftCheekPoint = {
				x: (leftEye.x + nose.x) / 2,
				y: (leftEye.y + nose.y) / 2 + imageHeight * 0.03
			};
			const rightCheekPoint = {
				x: (rightEye.x + nose.x) / 2,
				y: (rightEye.y + nose.y) / 2 + imageHeight * 0.03
			};

			const canvas = document.createElement('canvas');
			canvas.width = imageWidth;
			canvas.height = imageHeight;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				throw new Error('Could not read the uploaded image.');
			}

			ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
			updateProgress(70, 'Sampling skin tone...');

			const sampleRadius = Math.max(4, Math.round(imageWidth * 0.01));
			const leftSample = sampleMedianRgb(ctx, leftCheekPoint, sampleRadius);
			const rightSample = sampleMedianRgb(ctx, rightCheekPoint, sampleRadius);
			const samples = [leftSample, rightSample].filter(Boolean) as [number, number, number][];

			if (!samples.length) {
				throw new Error('Could not sample skin tone clearly. Try even lighting.');
			}

			const [r, g, b] = samples
				.reduce(
					(acc, current) => [acc[0] + current[0], acc[1] + current[1], acc[2] + current[2]],
					[0, 0, 0]
				)
				.map((value) => Math.round(value / samples.length)) as [number, number, number];

			updateProgress(90, 'Building your lipstick matches...');

			sampledHex = rgbToHex(r, g, b);
			detectedTone = getToneNameFromRGB(r, g, b);
			detectedUndertone = getUndertone(r, g, b);
			suggestedShades = getBestMatchedShades(r, g, b).slice(0, 3);

			analysisProgress = 100;
			analysisStage = 'Done';
			workflowStep = 3;
			track('analysis_complete', {
				source,
				detectedTone,
				detectedUndertone,
				shadeCount: suggestedShades.length
			});
		} catch (error) {
			analysisError = error instanceof Error ? error.message : 'Could not process this photo.';
			workflowStep = imageUrl ? 1 : 0;
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

	async function useSamplePhoto() {
		imageUrl = '/sample-selfie.svg';
		isAnalyzing = true;
		resetResults();
		startProgress();
		workflowStep = 2;
		track('upload_started', { source: 'sample_photo' });

		try {
			updateProgress(35, 'Loading sample...');
			await new Promise((resolve) => setTimeout(resolve, 380));
			updateProgress(62, 'Analyzing sample tone...');
			await new Promise((resolve) => setTimeout(resolve, 380));
			const [r, g, b]: [number, number, number] = [216, 166, 151];
			sampledHex = rgbToHex(r, g, b);
			detectedTone = getToneNameFromRGB(r, g, b);
			detectedUndertone = getUndertone(r, g, b);
			suggestedShades = getBestMatchedShades(r, g, b).slice(0, 3);
			analysisProgress = 100;
			analysisStage = 'Done';
			workflowStep = 3;
			track('analysis_complete', {
				source: 'sample_photo',
				detectedTone,
				detectedUndertone,
				shadeCount: suggestedShades.length
			});
		} catch {
			analysisError = 'Could not load the sample photo.';
			track('analysis_error', {
				source: 'sample_photo',
				message: analysisError
			});
		} finally {
			stopProgress();
			isAnalyzing = false;
		}
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
				<img src="/favicon.png" alt="Lipstick Matcher icon" class="brand-icon" />
				<span>Lipstick Matcher</span>
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
					<button class="cta-primary" on:click={scrollToUploader}>Get my 3 shade matches</button>
					<button class="cta-secondary" on:click={() => goto('/how-its-matched')}>See how it works</button>
				</div>
			</div>

			<aside class="hero-preview" aria-label="Beauty preview">
				<h2>Instant beauty preview</h2>
				<ul>
					{#each heroSwatches as swatch}
						<li>
							<span class="preview-dot" style={`background:${swatch.hex}`}></span>
							{swatch.name}
						</li>
					{/each}
				</ul>
				<div class="mini-card">
					<p>Your match</p>
					<strong>3 curated picks</strong>
					<small>Tone + undertone aware</small>
				</div>
			</aside>
		</div>
	</header>

	<section class="analyzer" aria-labelledby="analyzer-title" bind:this={uploaderSection} id="uploader">
		<div class="section-head">
			<h2 id="analyzer-title">Upload your selfie</h2>
			<button type="button" class="secondary-link" on:click={() => goto('/how-its-matched')}>
				See the matching method
			</button>
		</div>

		<ol class="stepper" aria-label="Matching steps">
			<li class:active={workflowStep >= 1}><span>1</span> Upload</li>
			<li class:active={workflowStep >= 2}><span>2</span> Analyze</li>
			<li class:active={workflowStep >= 3}><span>3</span> Results</li>
		</ol>

		{#if isModelLoading}
			<p class="model-status">Loading AI model...</p>
		{:else if modelLoadError}
			<p class="error-message">{modelLoadError}</p>
		{/if}

		<div
			class="drop-zone"
			class:dragging={isDragActive}
			on:dragover={handleDragOver}
			on:dragleave={handleDragLeave}
			on:drop={handleDrop}
			on:click={openFileDialog}
			on:keydown={onDropZoneKeydown}
			role="button"
			tabindex="0"
		>
			<p><strong>Drop your selfie here</strong> or click to browse</p>
			<small>JPG, PNG, HEIC (best in even lighting)</small>
			<input
				bind:this={uploadInput}
				type="file"
				accept="image/*"
				on:change={handleUpload}
				disabled={isModelLoading}
			/>
		</div>

		<div class="action-row">
			<button class="cta-primary" on:click={openFileDialog} disabled={isModelLoading}>Get my 3 shade matches</button>
			<button class="cta-secondary" on:click={useSamplePhoto}>Try a sample photo</button>
		</div>

		<p class="privacy-note">?? Private: your photo never leaves your device.</p>

		<div class="upload-guidance" role="note" aria-label="Best results tips">
			<p>For best accuracy:</p>
			<ul>
				<li>Use daylight or bright front lighting.</li>
				<li>Avoid heavy filters and hard shadows.</li>
				<li>Face the camera straight with both cheeks visible.</li>
			</ul>
		</div>

		{#if isAnalyzing}
			<div class="progress-wrap" role="status" aria-live="polite">
				<div
					class="progress-bar"
					role="progressbar"
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={analysisProgress}
				>
					<span style={`width: ${analysisProgress}%`}></span>
				</div>
				<p>{analysisStage}</p>
			</div>
		{/if}

		{#if analysisError}
			<p class="error-message">{analysisError}</p>
		{/if}

		{#if imageUrl}
			<div class="preview-card">
				<img bind:this={imageElement} src={imageUrl} alt="Uploaded selfie preview" />
			</div>
		{/if}
	</section>

	{#if sampledHex || detectedTone || detectedUndertone || suggestedShades.length > 0}
		<section class="results" aria-labelledby="results-title">
			<h2 id="results-title">Your match profile</h2>

			<div class="metric-grid">
				{#if sampledHex}
					<div class="metric-card">
						<h3>Sampled cheek color</h3>
						<p>
							<span class="color-dot" style={`background-color: ${sampledHex}`}></span>
							{sampledHex}
						</p>
					</div>
				{/if}

				{#if detectedTone}
					<div class="metric-card">
						<h3>Detected tone</h3>
						<p>{detectedTone}</p>
					</div>
				{/if}

				{#if detectedUndertone}
					<div class="metric-card">
						<h3>Detected undertone</h3>
						<p>{detectedUndertone}</p>
					</div>
				{/if}
			</div>

			{#if suggestedShades.length > 0}
				<div class="shade-list-wrap">
					<h3>Recommended shades</h3>
					<p class="link-disclosure">Some product links below are paid links.</p>
					<ul class="shade-list">
						{#each suggestedShades as shade, index}
							<li>
								<a
									href={shadeColors[shade]?.link}
									target="_blank"
									rel="noopener noreferrer"
									on:click={() => trackAffiliateClick(shade, index + 1)}
								>
									<span class="swatch" style={`background-color: ${shadeColors[shade]?.hex ?? '#ccc'}`}></span>
									<span class="shade-name">{shade}</span>
									{#if index === 0}
										<span class="best-badge">Best match</span>
									{/if}
									<span class="buy-label">View product <span class="paid-link">(paid link)</span></span>
								</a>
							</li>
						{/each}
					</ul>
					<p class="open-note">Product links open in a new tab.</p>
					<p class="amazon-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>
				</div>
			{/if}
		</section>
	{/if}

	<button class="mobile-sticky-cta" on:click={scrollToUploader}>Get my 3 shade matches</button>

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
		grid-template-columns: 1.4fr 1fr;
		gap: 1rem;
		align-items: stretch;
		margin-top: 0.9rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: #7a2f4d;
		font-weight: 800;
		font-size: 1.55rem;
		font-family: 'Cormorant Garamond', 'Georgia', serif;
	}

	.brand-icon {
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 0;
		display: block;
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

	.hero-copy p {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.6;
		color: #4b5563;
	}

	.hero-actions,
	.action-row {
		display: flex;
		gap: 0.65rem;
		flex-wrap: wrap;
		margin-top: 1rem;
	}

	.cta-primary,
	.cta-secondary,
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
		background: linear-gradient(120deg, #f7a8b8 0%, #e77aa6 100%);
		box-shadow: 0 10px 24px rgba(192, 83, 132, 0.22);
		transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
	}

	.cta-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 14px 28px rgba(192, 83, 132, 0.28);
		filter: saturate(1.08);
	}

	.cta-primary:active {
		transform: translateY(0);
	}

	.cta-secondary,
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

	.cta-secondary:hover,
	.secondary-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(173, 74, 113, 0.14);
	}

	.hero-preview {
		border: 1px solid rgba(231, 122, 166, 0.22);
		border-radius: 18px;
		background: linear-gradient(150deg, rgba(255, 255, 255, 0.76), rgba(255, 241, 246, 0.72));
		backdrop-filter: blur(4px);
		padding: 0.9rem;
	}

	.hero-preview h2 {
		margin: 0;
		font-size: 1rem;
		color: #7f3656;
	}

	.hero-preview ul {
		list-style: none;
		padding: 0;
		margin: 0.7rem 0;
		display: grid;
		gap: 0.42rem;
	}

	.hero-preview li {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-weight: 700;
		color: #6f3652;
	}

	.preview-dot {
		width: 0.95rem;
		height: 0.95rem;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.9);
		box-shadow: 0 4px 9px rgba(105, 56, 80, 0.19);
	}

	.mini-card {
		border: 1px solid rgba(231, 122, 166, 0.3);
		padding: 0.8rem;
		border-radius: 14px;
		background: #fff;
		box-shadow: inset 0 1px 8px rgba(236, 182, 201, 0.28);
	}

	.mini-card p,
	.mini-card small {
		margin: 0;
		font-size: 0.86rem;
		color: #7b4a5e;
	}

	.mini-card strong {
		display: block;
		margin: 0.2rem 0;
		color: #6f2744;
	}

	.analyzer,
	.results,
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

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
	}

	h2 {
		margin: 0;
		font-size: 1.3rem;
		color: #6e2e4d;
	}

	.stepper {
		display: flex;
		gap: 0.8rem;
		list-style: none;
		padding: 0;
		margin: 0.9rem 0 0;
		flex-wrap: wrap;
	}

	.stepper li {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: #8b7b84;
		font-weight: 700;
		font-size: 0.9rem;
	}

	.stepper li span {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.3rem;
		height: 1.3rem;
		border-radius: 50%;
		border: 1px solid #e8bfd0;
		background: #fff7fa;
		font-size: 0.76rem;
	}

	.stepper li.active {
		color: #9b365f;
	}

	.stepper li.active span {
		background: #e77aa6;
		color: #fff;
		border-color: #e77aa6;
	}

	.drop-zone {
		margin-top: 1rem;
		border: 1.5px dashed #e8a8c1;
		background: linear-gradient(150deg, #fff8fb 0%, #fff3f7 100%);
		padding: 1.2rem;
		border-radius: 14px;
		cursor: pointer;
		text-align: center;
		transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
	}

	.drop-zone:hover,
	.drop-zone.dragging {
		transform: translateY(-2px);
		box-shadow: 0 12px 22px rgba(184, 85, 125, 0.12);
		border-color: #d7739e;
	}

	.drop-zone p {
		margin: 0;
		color: #7d3152;
	}

	.drop-zone small {
		display: block;
		margin-top: 0.3rem;
		color: #8a6878;
	}

	.drop-zone input[type='file'] {
		display: none;
	}

	.privacy-note {
		margin: 0.65rem 0 0;
		font-size: 0.87rem;
		color: #826876;
	}

	.model-status {
		margin: 0.9rem 0;
		font-weight: 600;
		color: #725260;
	}

	.upload-guidance {
		margin-top: 1rem;
		padding: 0.9rem 1rem;
		background: #fff5f9;
		border: 1px solid #efcddd;
		border-radius: 12px;
	}

	.upload-guidance p {
		margin: 0 0 0.4rem;
		font-weight: 700;
	}

	.upload-guidance ul {
		margin: 0;
		padding-left: 1.1rem;
	}

	.upload-guidance li {
		margin: 0.25rem 0;
		color: #5a5561;
	}

	.progress-wrap {
		margin-top: 1rem;
	}

	.progress-wrap p {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: #6d5965;
	}

	.progress-bar {
		width: 100%;
		height: 10px;
		border-radius: 999px;
		background: #f4d9e3;
		overflow: hidden;
	}

	.progress-bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, #f7a8b8 0%, #e77aa6 60%, #d46794 100%);
		transition: width 160ms ease-out;
	}

	.error-message {
		margin-top: 0.9rem;
		padding: 0.75rem 0.9rem;
		background: #fff2f4;
		border: 1px solid #efc8d5;
		color: #9f2f4f;
		border-radius: 10px;
		font-weight: 600;
	}

	.preview-card {
		margin-top: 1rem;
		border-radius: 14px;
		overflow: hidden;
		border: 1px solid #ecd1da;
		background: #fff8fa;
	}

	.preview-card img {
		display: block;
		width: 100%;
		height: auto;
		max-height: 420px;
		object-fit: contain;
	}

	.metric-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.8rem;
		margin-top: 1rem;
	}

	.metric-card {
		padding: 0.9rem;
		border-radius: 12px;
		background: #fff6fa;
		border: 1px solid #efcfdd;
	}

	.metric-card h3 {
		margin: 0;
		font-size: 0.86rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #9a5876;
	}

	.metric-card p {
		margin: 0.55rem 0 0;
		font-weight: 700;
		font-size: 1.06rem;
		color: #6a2d48;
		text-transform: capitalize;
	}

	.color-dot,
	.swatch {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 1px solid #edd9e0;
		vertical-align: middle;
		margin-right: 0.45rem;
	}

	.shade-list-wrap {
		margin-top: 1rem;
	}

	.shade-list-wrap h3 {
		margin: 0 0 0.65rem;
		color: #6f2e4e;
	}

	.link-disclosure {
		margin: 0 0 0.65rem;
		font-size: 0.84rem;
		color: #7d6270;
	}

	.shade-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.55rem;
	}

	.shade-list a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.7rem;
		padding: 0.75rem 0.9rem;
		border-radius: 11px;
		text-decoration: none;
		border: 1px solid #edd1de;
		background: #fff;
		color: #6a2d48;
		transition: transform 140ms ease, box-shadow 140ms ease;
	}

	.shade-list a:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(172, 78, 116, 0.11);
	}

	.shade-name {
		font-weight: 700;
		text-transform: capitalize;
		flex: 1;
	}

	.best-badge {
		font-size: 0.68rem;
		font-weight: 800;
		padding: 0.2rem 0.42rem;
		border-radius: 999px;
		background: #fde9f1;
		color: #a03d67;
		white-space: nowrap;
	}

	.buy-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: #91526d;
	}

	.paid-link {
		font-weight: 600;
		color: #9c6b82;
	}

	.amazon-disclosure {
		margin: 0.6rem 0 0;
		font-size: 0.82rem;
		color: #816572;
	}

	.open-note {
		margin: 0.55rem 0 0;
		font-size: 0.78rem;
		color: #8b6f7d;
	}

	.mobile-sticky-cta {
		display: none;
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

	@media (max-width: 900px) {
		.hero-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 720px) {
		.page {
			padding: 0.8rem 0.75rem 3rem;
		}

		.hero,
		.analyzer,
		.results,
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

		.mobile-sticky-cta {
			display: inline-flex;
			position: fixed;
			right: 0.75rem;
			left: 0.75rem;
			bottom: 0.75rem;
			justify-content: center;
			border: none;
			border-radius: 999px;
			padding: 0.82rem 1rem;
			font-weight: 800;
			font-size: 0.95rem;
			z-index: 40;
			cursor: pointer;
			color: #fff;
			background: linear-gradient(120deg, #f7a8b8 0%, #e77aa6 100%);
			box-shadow: 0 14px 28px rgba(171, 71, 111, 0.28);
		}
	}
</style>

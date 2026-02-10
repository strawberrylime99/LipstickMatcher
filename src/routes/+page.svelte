<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { injectAnalytics, track } from '@vercel/analytics/sveltekit';
	import { rgbToHex, getToneNameFromRGB, getBestMatchedShades, getUndertone } from '$lib/colorUtils';
	import { shadeColors } from '$lib/shadeColors';
	import { posts } from './blog/_posts';

	injectAnalytics();

	type Point = { x: number; y: number };

	let imageUrl: string | null = null;
	let imageElement: HTMLImageElement | null = null;
	let faceapi: typeof import('face-api.js') | null = null;

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
	let progressInterval: ReturnType<typeof setInterval> | null = null;
	const latestPosts = [...posts]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 3);

	const siteUrl = 'https://lipstickmatcher.com';
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

	function handleShadeClick(shade: string) {
		track('shade_click', { shade });
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

	async function handleUpload(event: Event) {
		const file = (event.target as HTMLInputElement)?.files?.[0];
		if (!file) return;

		isAnalyzing = true;
		analysisError = null;
		sampledHex = null;
		suggestedShades = [];
		detectedTone = null;
		detectedUndertone = null;
		startProgress();

		try {
			const imageDataUrl = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (e) => resolve((e.target?.result as string) ?? '');
				reader.onerror = () => reject(new Error('Could not read uploaded file.'));
				reader.readAsDataURL(file);
			});

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
		} catch (error) {
			analysisError = error instanceof Error ? error.message : 'Could not process this photo.';
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
			<img src="/logo.png" alt="Lipstick Matcher" class="logo" />
			<nav class="nav-links" aria-label="Main navigation">
				<a href="/" aria-current="page">Matcher</a>
				<a href="/how-its-matched">How It Works</a>
				<a href="/blog">Blog</a>
			</nav>
		</div>

		<div class="hero-copy">
			<p class="eyebrow">Personalized Beauty Matching</p>
			<h1>Find lipstick shades that actually fit your skin tone</h1>
			<p>
				Upload a clear selfie and get personalized lipstick matches in under a minute. No signup,
				no app install, and no guesswork.
			</p>
			<div class="trust-badges">
				<span>Private in-browser processing</span>
				<span>Fast AI landmark detection</span>
				<span>Tone and undertone aware</span>
			</div>
		</div>
	</header>

	<section class="analyzer" aria-labelledby="analyzer-title">
		<div class="section-head">
			<h2 id="analyzer-title">Upload your selfie</h2>
			<button type="button" class="secondary-link" on:click={() => goto('/how-its-matched')}>
				See the matching method
			</button>
		</div>

		{#if isModelLoading}
			<p class="model-status">Loading AI model...</p>
		{:else if modelLoadError}
			<p class="error-message">{modelLoadError}</p>
		{/if}

		<div class="upload-guidance" role="note" aria-label="Best results tips">
			<p>For best accuracy:</p>
			<ul>
				<li>Use daylight or bright front lighting.</li>
				<li>Avoid heavy filters and hard shadows.</li>
				<li>Face the camera straight with both cheeks visible.</li>
			</ul>
		</div>

		<label class="upload-label" aria-label="Upload a selfie image file">
			Choose selfie
			<input type="file" accept="image/*" on:change={handleUpload} disabled={isModelLoading} />
		</label>

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
						{#each suggestedShades as shade}
							<li>
								<a
									href={shadeColors[shade]?.link}
									target="_blank"
									rel="noopener noreferrer"
									on:click={() => handleShadeClick(shade)}
								>
									<span class="swatch" style={`background-color: ${shadeColors[shade]?.hex ?? '#ccc'}`}></span>
									<span class="shade-name">{shade}</span>
									<span class="buy-label">View product <span class="paid-link">(paid link)</span></span>
								</a>
							</li>
						{/each}
					</ul>
					<p class="amazon-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>
				</div>
			{/if}
		</section>
	{/if}

	<section class="why-trust" aria-labelledby="why-trust-title">
		<h2 id="why-trust-title">What makes the results feel polished</h2>
		<div class="trust-grid">
			<article>
				<h3>Clear color profile</h3>
				<p>Each result includes the sampled cheek color plus tone and undertone details.</p>
			</article>
			<article>
				<h3>Wearable shade picks</h3>
				<p>Recommendations are curated to be practical, not generic color labels.</p>
			</article>
			<article>
				<h3>Quick comparison flow</h3>
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
						<span>{post.title}</span>
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
			radial-gradient(circle at top left, #fdf2e7 0%, rgba(253, 242, 231, 0) 40%),
			linear-gradient(160deg, #fffdfa 0%, #f6f8fc 100%);
		color: #1f2937;
	}

	.page {
		max-width: 1080px;
		margin: 0 auto;
		padding: 1.25rem 1rem 4rem;
	}

	.hero {
		border: 1px solid #dde6ef;
		background: linear-gradient(130deg, #ffffff 0%, #f4f8ff 100%);
		border-radius: 20px;
		padding: 1rem 1rem 1.6rem;
		box-shadow: 0 20px 50px rgba(6, 34, 79, 0.08);
	}

	.hero-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.logo {
		width: 162px;
		height: auto;
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
		color: #1e3a5f;
		background: #e7effa;
		border: 1px solid #c8d8ef;
		font-size: 0.92rem;
	}

	.nav-links a[aria-current='page'] {
		background: #1e3a5f;
		color: #fff;
		border-color: #1e3a5f;
	}

	.hero-copy {
		max-width: 720px;
		padding-top: 1.1rem;
	}

	.eyebrow {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 800;
		font-size: 0.75rem;
		color: #b5442e;
	}

	h1 {
		margin: 0.4rem 0 0.8rem;
		font-size: clamp(1.8rem, 3.8vw, 2.9rem);
		line-height: 1.1;
		color: #0d223d;
	}

	.hero-copy p {
		margin: 0;
		font-size: 1.04rem;
		line-height: 1.6;
		color: #334155;
	}

	.trust-badges {
		display: flex;
		gap: 0.65rem;
		flex-wrap: wrap;
		margin-top: 1rem;
	}

	.trust-badges span {
		font-size: 0.85rem;
		padding: 0.4rem 0.7rem;
		border-radius: 999px;
		background: #eef5ff;
		border: 1px solid #d1e0f5;
		font-weight: 600;
		color: #26486f;
	}

	.analyzer,
	.results,
	.why-trust,
	.content-boost,
	.faq {
		margin-top: 1.25rem;
		padding: 1.2rem;
		background: #fff;
		border: 1px solid #e3e8f0;
		border-radius: 16px;
		box-shadow: 0 12px 26px rgba(8, 30, 66, 0.04);
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
		color: #0d223d;
	}

	.secondary-link {
		border: 1px solid #c9d6e7;
		background: #f4f8ff;
		color: #1f3e63;
		text-decoration: none;
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		font-weight: 700;
		font-size: 0.88rem;
		cursor: pointer;
	}

	.model-status {
		margin: 0.9rem 0;
		font-weight: 600;
		color: #475569;
	}

	.upload-guidance {
		margin-top: 1rem;
		padding: 0.9rem 1rem;
		background: #f8fbff;
		border: 1px solid #d7e4f4;
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
		color: #334155;
	}

	.upload-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.72rem 1.1rem;
		margin-top: 1rem;
		border-radius: 11px;
		font-weight: 800;
		background: linear-gradient(120deg, #c14934 0%, #9f2f40 100%);
		color: #fff;
		cursor: pointer;
		border: none;
	}

	.upload-label input[type='file'] {
		display: none;
	}

	.progress-wrap {
		margin-top: 1rem;
	}

	.progress-wrap p {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: #475569;
	}

	.progress-bar {
		width: 100%;
		height: 10px;
		border-radius: 999px;
		background: #e7eef8;
		overflow: hidden;
	}

	.progress-bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, #2d67a5 0%, #4d84bf 60%, #7aa0ca 100%);
		transition: width 160ms ease-out;
	}

	.error-message {
		margin-top: 0.9rem;
		padding: 0.75rem 0.9rem;
		background: #fff3f1;
		border: 1px solid #f3ccc7;
		color: #9f2f2f;
		border-radius: 10px;
		font-weight: 600;
	}

	.preview-card {
		margin-top: 1rem;
		border-radius: 14px;
		overflow: hidden;
		border: 1px solid #dce5f1;
		background: #f9fbff;
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
		background: #f8fbff;
		border: 1px solid #dce7f4;
	}

	.metric-card h3 {
		margin: 0;
		font-size: 0.86rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #4a6787;
	}

	.metric-card p {
		margin: 0.55rem 0 0;
		font-weight: 700;
		font-size: 1.06rem;
		color: #10263f;
		text-transform: capitalize;
	}

	.color-dot,
	.swatch {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 1px solid #d4dee8;
		vertical-align: middle;
		margin-right: 0.45rem;
	}

	.shade-list-wrap {
		margin-top: 1rem;
	}

	.shade-list-wrap h3 {
		margin: 0 0 0.65rem;
		color: #0d223d;
	}

	.link-disclosure {
		margin: 0 0 0.65rem;
		font-size: 0.84rem;
		color: #52657d;
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
		border: 1px solid #dce6f2;
		background: #fff;
		color: #132f4f;
	}

	.shade-name {
		font-weight: 700;
		text-transform: capitalize;
		flex: 1;
	}

	.buy-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: #2f4f78;
	}

	.paid-link {
		font-weight: 600;
		color: #5b6f87;
	}

	.amazon-disclosure {
		margin: 0.6rem 0 0;
		font-size: 0.82rem;
		color: #52657d;
	}

	.trust-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
		margin-top: 0.8rem;
	}

	.trust-grid article {
		padding: 0.9rem;
		border: 1px solid #dee8f4;
		border-radius: 12px;
		background: #f7fbff;
	}

	.trust-grid h3 {
		margin: 0;
		font-size: 1rem;
		color: #143459;
	}

	.trust-grid p {
		margin: 0.45rem 0 0;
		color: #334155;
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
		border: 1px solid #dce6f2;
		background: #f9fbff;
		color: #112f4f;
		font-weight: 700;
	}

	.article-list small {
		color: #5f738c;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.faq > div {
		margin-top: 0.8rem;
		padding-top: 0.8rem;
		border-top: 1px solid #e4e9f2;
	}

	.faq h3 {
		margin: 0;
		font-size: 1rem;
		color: #123456;
	}

	.faq p {
		margin: 0.45rem 0 0;
		color: #334155;
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
	}
</style>

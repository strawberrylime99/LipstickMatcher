<script lang="ts">
	import { goto } from '$app/navigation';

	const howStructuredData = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'What does Lipstick Matcher analyze from my selfie?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'It detects facial landmarks, samples cheek color, estimates skin tone and undertone, then maps your profile to curated lipstick shades.'
				}
			},
			{
				'@type': 'Question',
				name: 'How can I get more accurate results?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Use a clear front-facing photo in bright, even light. Avoid filters, flash glare, and heavy shadows on the cheeks.'
				}
			},
			{
				'@type': 'Question',
				name: 'How many shades are recommended?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'The tool returns three practical lipstick shade suggestions with color swatches and links.'
				}
			}
		]
	});
</script>

<svelte:head>
	<title>How Lipstick Matcher Works | Transparent Tone and Undertone Matching</title>
	<meta
		name="description"
		content="See exactly how Lipstick Matcher detects facial landmarks, samples skin tone, estimates undertone, and recommends lipstick shades you can actually wear."
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://lipstickmatcher.com/how-its-matched" />
	<meta property="og:title" content="How Lipstick Matcher Works" />
	<meta
		property="og:description"
		content="Transparent breakdown of the matching pipeline: selfie upload, skin-tone sampling, undertone detection, and shade recommendations."
	/>
	<meta property="og:url" content="https://lipstickmatcher.com/how-its-matched" />
	<meta property="og:type" content="article" />
	<meta property="og:image" content="https://lipstickmatcher.com/logo.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="How Lipstick Matcher Works" />
	<meta
		name="twitter:description"
		content="Learn how selfie-based lipstick matching uses tone and undertone analysis for practical recommendations."
	/>
	<script type="application/ld+json">{howStructuredData}</script>
</svelte:head>

<main class="page">
	<header class="hero">
		<div class="topbar">
			<a href="/" class="brand">
				<img src="/logo.png" alt="Lipstick Matcher" class="logo" />
			</a>
			<nav aria-label="Main navigation" class="nav-links">
				<a href="/">Matcher</a>
				<a href="/how-its-matched" aria-current="page">How It Works</a>
				<a href="/blog">Blog</a>
			</nav>
		</div>

		<p class="eyebrow">Transparent Process</p>
		<h1>How your selfie becomes lipstick recommendations</h1>
		<p>This page explains the method in plain language so every recommendation feels clear and grounded.</p>
	</header>

	<section class="panel" aria-labelledby="pipeline-title">
		<h2 id="pipeline-title">Matching pipeline</h2>
		<ol>
			<li>
				<strong>Landmark detection:</strong> We locate key points around eyes, nose, and facial structure
				using face-api.js.
			</li>
			<li>
				<strong>Cheek sampling:</strong> We sample both cheek regions, then use median RGB values to reduce
				noise from highlights and shadow.
			</li>
			<li>
				<strong>Tone + undertone estimation:</strong> RGB/HSL values are mapped into skin tone depth and warm,
				cool, or neutral undertone.
			</li>
			<li>
				<strong>Shade ranking:</strong> We rank lipstick shades by compatibility and return three clear choices.
			</li>
		</ol>
	</section>

	<section class="panel" aria-labelledby="trust-title">
		<h2 id="trust-title">Why this method feels consistent</h2>
		<ul>
			<li>The process is deterministic and repeatable with similar photos.</li>
			<li>Cheek-based sampling is used because it is less biased than lips or forehead alone.</li>
			<li>You can inspect your sampled color, detected tone, and detected undertone before buying.</li>
		</ul>
	</section>

	<section class="panel" aria-labelledby="accuracy-title">
		<h2 id="accuracy-title">How to improve accuracy</h2>
		<ul>
			<li>Use soft daylight or evenly lit indoor light.</li>
			<li>Keep your face centered, straight, and unobstructed.</li>
			<li>Avoid intense beauty filters or overexposed flash photos.</li>
		</ul>
	</section>

	<section class="panel" aria-labelledby="faq-title">
		<h2 id="faq-title">FAQ</h2>
		<div>
			<h3>What if my result changes between photos?</h3>
			<p>Lighting and camera settings can shift sampled color, which affects shade ranking.</p>
		</div>
		<div>
			<h3>Can I use this without makeup?</h3>
			<p>Yes. A makeup-free selfie usually gives the most neutral skin-tone sample.</p>
		</div>
		<div>
			<h3>Where do the shade links go?</h3>
			<p>Each recommendation opens a product listing so users can compare and purchase quickly.</p>
		</div>
	</section>

	<section class="panel cta">
		<h2>Try the matcher now</h2>
		<p>Go back to the main tool and test your selfie in under a minute.</p>
		<button type="button" on:click={() => goto('/')}>Open Lipstick Matcher</button>
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
		padding: 1.25rem 1rem 3.5rem;
	}

	.hero {
		border: 1px solid #f0d8de;
		background: linear-gradient(130deg, #ffffff 0%, #fff4f8 100%);
		border-radius: 24px;
		padding: 1rem 1rem 1.4rem;
		box-shadow: 0 20px 50px rgba(134, 49, 83, 0.08);
	}

	.topbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.logo {
		width: 178px;
		height: auto;
		display: block;
	}

	.brand {
		display: inline-block;
		text-decoration: none;
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
		font-size: 0.92rem;
		color: #8e3f5f;
		background: #fff0f5;
		border: 1px solid #efc6d5;
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
		margin: 0.95rem 0 0;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		font-size: 0.72rem;
		font-weight: 800;
		color: #a94b6e;
	}

	h1 {
		margin: 0.42rem 0 0.6rem;
		font-size: clamp(1.9rem, 4vw, 3rem);
		line-height: 1.16;
		color: #61263f;
		font-family: 'Cormorant Garamond', 'Georgia', serif;
	}

	.hero p {
		margin: 0;
		line-height: 1.6;
		color: #4b5563;
	}

	.panel {
		margin-top: 1.25rem;
		padding: 1.2rem;
		background: #fff;
		border: 1px solid #efd8df;
		border-radius: 18px;
		box-shadow: 0 12px 26px rgba(102, 41, 66, 0.05);
	}

	h2 {
		margin: 0;
		font-size: 1.3rem;
		color: #6e2e4d;
	}

	ol,
	ul {
		margin: 0.75rem 0 0;
		padding-left: 1.15rem;
		line-height: 1.6;
		color: #5a5561;
	}

	li {
		margin: 0.4rem 0;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
		color: #6f2f4f;
	}

	#faq-title + div,
	#faq-title + div + div,
	#faq-title + div + div + div {
		margin-top: 0.8rem;
		padding-top: 0.8rem;
		border-top: 1px solid #efdbe3;
	}

	.panel p {
		margin: 0.35rem 0 0;
		color: #5a5561;
	}

	.cta {
		text-align: center;
		background: linear-gradient(150deg, #fff9fb 0%, #fff2f7 100%);
	}

	.cta button {
		margin-top: 0.85rem;
		padding: 0.72rem 1.2rem;
		border-radius: 999px;
		border: none;
		font-weight: 800;
		cursor: pointer;
		background: linear-gradient(120deg, #d84d7f 0%, #b22856 100%);
		color: #fff;
		box-shadow: 0 10px 24px rgba(150, 34, 78, 0.28);
		transition: transform 150ms ease, box-shadow 150ms ease;
	}

	.cta button:hover {
		transform: translateY(-2px);
		box-shadow: 0 14px 28px rgba(150, 34, 78, 0.35);
	}

	@media (max-width: 720px) {
		.page {
			padding: 0.8rem 0.75rem 3rem;
		}

		.hero,
		.panel {
			border-radius: 14px;
			padding: 1rem;
		}
	}
</style>

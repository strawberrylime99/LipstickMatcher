<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		rgbToHex,
		getToneNameFromRGB,
		getBestMatchedShades,
        getUndertone
	} from '$lib/colorUtils';
	import { shadeColors } from '$lib/shadeColors';
    import { injectAnalytics, track } from '@vercel/analytics/sveltekit'
    import { goto } from '$app/navigation';

    injectAnalytics();
    function handleShadeClick(shade: string) {
		track('shade_click', { shade });
	}

	let imageUrl: string | null = null;
	let imageElement: HTMLImageElement | null = null;
	let faceapi: typeof import('face-api.js') | null = null;

	let sampledHex: string | null = null;
	let suggestedShades: string[] = [];
	let detectedTone: string | null = null;
	let detectedUndertone: string | null = null;

	onMount(async () => {
		if (typeof window !== 'undefined') {
			const module = await import('face-api.js');
			faceapi = module;

			await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
			await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
			console.log('Models loaded');
		}
	});

	async function handleUpload(event: Event) {
		const file = (event.target as HTMLInputElement)?.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = async (e) => {
				sampledHex = null;
				suggestedShades = [];
				detectedTone = null;
				detectedUndertone = null;

				imageUrl = e.target?.result as string;
				await tick();

				if (!imageElement || !faceapi) return;
				await imageElement.decode();

				const result = await faceapi
					.detectSingleFace(
						imageElement,
						new faceapi.TinyFaceDetectorOptions()
					)
					.withFaceLandmarks();

				if (!result) {
					alert('No face detected. Try another photo.');
					return;
				}

				const resized = faceapi.resizeResults(result, {
					width: imageElement.clientWidth,
					height: imageElement.clientHeight
				});

				const eye = resized.landmarks.positions[36];
				const nose = resized.landmarks.positions[30];
				const cheekPoint = {
					x: (eye.x + nose.x) / 2,
					y: (eye.y + nose.y) / 2 + 20
				};

				const canvas = document.createElement('canvas');
				canvas.width = imageElement.clientWidth;
				canvas.height = imageElement.clientHeight;
				const ctx = canvas.getContext('2d');
				if (!ctx) return;

				ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

				const x = Math.round(cheekPoint.x);
				const y = Math.round(cheekPoint.y);

				if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
					console.warn('Sample point out of bounds:', x, y);
					return;
				}

				const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
				console.log(`Sampled pixel: rgb(${r}, ${g}, ${b})`);

				sampledHex = rgbToHex(r, g, b);
				detectedTone = getToneNameFromRGB(r, g, b).split(' ')[0];
				suggestedShades = getBestMatchedShades(r, g, b).slice(0, 3);
				detectedUndertone = getUndertone(r, g, b);
			};
			reader.readAsDataURL(file);
		}
	}
</script>

<svelte:head>
	<title>AI Lipstick Matcher – Find Your Best Shade with a Selfie</title>
	<meta name="description" content="Use AI to find your perfect lipstick shade. Upload a selfie and get personalized matches based on your skin tone and undertone." />
	<meta name="keywords" content="lipstick matcher, AI beauty tool, find lipstick shade, skin tone detector, undertone, SvelteKit beauty app, virtual makeup match" />
	<meta name="author" content="Lipstick Matcher" />
	<meta property="og:title" content="AI Lipstick Matcher – Find Your Best Shade with a Selfie" />
	<meta property="og:description" content="Upload your photo and get smart lipstick shade suggestions powered by AI. Fast, private, and free." />
	<meta property="og:image" content="/logo.png" />
	<meta property="og:url" content="https://lipstickmatcher.com" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<header class="logo-header">
	<img src="/logo.png" alt="Lipstick Matcher logo" class="logo" />
</header>
<nav class="nav-bar">
	<button on:click={() => goto('/')}>💄 Lipstick Matcher</button>
	<button on:click={() => goto('/how-its-matched')}>🧠 How It's Matched</button>
</nav>

<div class="upload-note">
	<p><strong>📸 Tips for Best Results:</strong></p>
	<ul>
		<li>Use natural lighting (daylight is best)</li>
		<li>Avoid harsh shadows or very dark rooms</li>
		<li>No flash – it can distort skintone</li>
		<li>Face the camera straight on</li>
		<li>Make sure cheeks are visible</li>
	</ul>
</div>

<label class="upload-label">
	Upload Selfie
	<input type="file" accept="image/*" on:change={handleUpload} />
</label>
  

{#if imageUrl}
	<div class="preview">
		<img bind:this={imageElement} src={imageUrl} alt="Preview" />
	</div>
{/if}

{#if sampledHex}
	<div class="shade-section">
		<p><strong>Cheek color:</strong>
			<span class="color-dot" style="background-color: {sampledHex}"></span>
			{sampledHex}
		</p>
	</div>
{/if}

{#if detectedTone || detectedUndertone}
	<div class="shade-section">
		{#if detectedTone}
			<p><strong>Detected tone:</strong> {detectedTone}</p>
		{/if}
		{#if detectedUndertone}
			<p><strong>Detected undertone:</strong> {detectedUndertone}</p>
		{/if}
	</div>
{/if}


{#if suggestedShades.length > 0}
	<div class="shade-section">
		<p><strong>Suggested lipstick shades:</strong></p>
		<ul>
            {#each suggestedShades as shade}
            <li>
                <a
                href={shadeColors[shade]?.link}
                target="_blank"
                rel="noopener noreferrer"
                class="shade-link"
                on:click={() => handleShadeClick(shade)}
            >
                <span
                    class="swatch"
                    style="background-color: {shadeColors[shade]?.hex ?? '#ccc'}"
                ></span>
                <span class="shade-name">{shade}</span>
                <span class="link-indicator">→🛒</span>
            </a>
            </li>
        {/each}
		</ul>
	</div>
{/if}
<section class="recent-articles">
	<h2>📰 Recent Blog Articles</h2>
	<ul>
	  <li>
		<a href="/blog/2025-spring-lipstick-trends">
		  Spring 2025 Lipstick Trends
		  <span class="date">April 20, 2025</span>
		</a>
	  </li>
	  <li>
		<a href="/blog/matte-vs-glossy-lipstick">
		  Choosing between a Matte or Glossy Lip
		  <span class="date">April 15, 2025</span>
		</a>
	  </li>
	</ul>
  </section>
<style>
:global(body) {
	background-color: #fff3e0;
	margin: 0;
	padding: 0;
	font-family: 'Poppins', sans-serif;
}
.nav-bar {
	display: flex;
	justify-content: center;
	gap: 1rem;
	margin-bottom: 2rem;
}
.nav-bar button {
	background-color: #ffe0e0;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 5px;
	cursor: pointer;
	font-size: 1rem;
	font-weight: 500;
	font-family: 'Poppins', sans-serif;
	color: #4e342e;
	transition: background-color 0.2s ease;
}
.nav-bar button:hover {
	background-color: #f8bbd0;
}
.upload-label {
	display: block;
	width: fit-content;
	margin: 0 auto 1.5rem;
	padding: 0.5rem 1rem;
	background-color: #f06292;
	color: white;
	border-radius: 4px;
	cursor: pointer;
	text-align: center;
	font-weight: bold;
	transition: background-color 0.2s ease;
}
.upload-label:hover {
	background-color: #e04878;
}
.upload-label input[type="file"] {
	display: none;
}
.upload-note {
	max-width: 400px;
	margin: 1.5rem auto 1rem;
	background: #fff8f6;
	border: 1px solid #f8bbd0;
	border-radius: 6px;
	padding: 1rem;
	font-size: 0.95rem;
	color: #4e342e;
	box-shadow: 0 2px 8px rgba(244, 143, 177, 0.1);
}
.upload-note ul {
	margin: 0.5rem 0 0;
	padding-left: 1.2rem;
}
.upload-note li {
	margin-bottom: 0.3rem;
}
.preview {
	max-width: 400px;
	margin: 0 auto;
	border-radius: 8px;
	box-shadow: 0 2px 10px rgba(141, 110, 99, 0.1);
	overflow: hidden;
	background: #fff3e0;
}
img {
	display: block;
	width: 100%;
	height: auto;
}
.shade-section {
	margin: 2rem auto;
	max-width: 400px;
	padding: 1rem;
	border-radius: 6px;
	background: rgb(236, 201, 195);
	box-shadow: 0 0 440px rgba(197, 63, 14, 0.15);
	font-family: 'Poppins', sans-serif;
}
.shade-section p {
	text-align: center;
	margin-bottom: 0.5rem;
	color: #4e342e;
}
.shade-section ul {
	list-style: none;
	padding: 0;
	margin: 1rem 0;
}
.shade-section li {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	margin: 0.3rem 0;
	text-transform: capitalize;
	color: #4e342e;
}
.shade-link {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: #ffeef0;
	padding: 0.6rem 1rem;
	border-radius: 6px;
	margin-bottom: 0.5rem;
	color: #4e342e;
	text-decoration: none;
	transition: background-color 0.2s ease;
}
.shade-link:hover {
	background-color: #fcd4da;
}
.shade-name {
	font-weight: 500;
}
.link-indicator {
	font-size: 1.1rem;
	color: #d81b60;
	margin-left: 0.5rem;
}
.color-dot,
.swatch {
	width: 1.2rem;
	height: 1.2rem;
	border-radius: 50%;
	border: 1px solid #d7ccc8;
	display: inline-block;
}
.logo-header {
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 2rem 0 1rem;
}
.logo {
	max-width: 200px;
	height: auto;
}

.recent-articles {
  margin: 3rem auto;
  max-width: 400px;
  padding: 1.5rem;
  background: #ffe0e0;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(244, 143, 177, 0.1);
}

.recent-articles h2 {
  color: #c2185b;
  font-family: 'Poppins', sans-serif;
  text-align: center;
  margin-bottom: 1rem;
}

.recent-articles ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recent-articles li {
  margin-bottom: 1.2rem;
}

.recent-articles a {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
  font-family: 'Poppins', sans-serif;
  color: #4e342e;
  font-size: 1rem;
  background: #f1c2c7;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.recent-articles a:hover {
  background-color: #f0a4b0;
}

.recent-articles .date {
  font-size: 0.875rem;
  color: #8d6e63;
}

</style>

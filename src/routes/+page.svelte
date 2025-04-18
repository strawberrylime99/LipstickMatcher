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
				detectedTone = getToneNameFromRGB(r, g, b);
				suggestedShades = getBestMatchedShades(r, g, b).slice(0, 3);
				detectedUndertone = getUndertone(r, g, b);
			};
			reader.readAsDataURL(file);
		}
	}
</script>

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

{#if detectedTone}
	<div class="shade-section">
		<p><strong>Detected tone:</strong> {detectedTone}</p>
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
                    <span class="swatch" style="background-color: {shadeColors[shade]?.hex ?? '#ccc'}"></span>
                    {shade}
                </a>
            </li>
        {/each}
        
		</ul>
	</div>
{/if}

<style>
:global(body) {
	background-color: #fff3e0; /* Peach Cream */
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


/* Upload button styling */
.upload-label {
	display: block;
	width: fit-content;
	margin: 0 auto 1.5rem;
	padding: 0.5rem 1rem;
	background-color: #f06292; /* Coral Pink */
	color: white;
	border-radius: 4px;
	cursor: pointer;
	text-align: center;
	font-weight: bold;
	transition: background-color 0.2s ease;
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

.shade-section {
	margin: 2rem auto;
	max-width: 400px;
	padding: 1rem;
	border-radius: 6px;
	background: #fcfcfc;
	box-shadow: 0 0 4px rgba(141, 110, 99, 0.15);
	font-family: 'Poppins', sans-serif;
}

.upload-label:hover {
	background-color: #e04878;
}

.upload-label input[type="file"] {
	display: none;
}


input[type="file"] {
	display: block;
	margin: 0 auto 1.5rem;
	font-family: 'Poppins', sans-serif;
}

.preview {
	max-width: 400px;
	margin: 0 auto;
	border-radius: 8px;
	box-shadow: 0 2px 10px rgba(141, 110, 99, 0.1); /* Mocha Brown tint */
	overflow: hidden;
	background: #fff3e0; /* Peach Cream */
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
	background: 	rgb(236, 201, 195);
	box-shadow: 0 0 440px rgba(197, 63, 14, 0.15); /* Soft Mocha shadow */
	font-family: 'Poppins', sans-serif;
}

.shade-section p {
	text-align: center;
	margin-bottom: 0.5rem;
	color: #4e342e; /* Deep Coffee */
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

.color-dot,
.swatch {
	width: 1.2rem;
	height: 1.2rem;
	border-radius: 50%;
	border: 1px solid #d7ccc8; /* Neutral taupe */
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

.shade-link {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #4e342e;
	text-decoration: none;
	transition: color 0.2s ease;
	font-weight: 500;
}

.shade-link:hover {
	color: #d81b60; /* coral pink accent */
}


</style>

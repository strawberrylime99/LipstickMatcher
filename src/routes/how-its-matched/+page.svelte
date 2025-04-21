<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
</script>
<header class="logo-header">
	<img src="/logo.png" alt="Lipstick Matcher logo" class="logo" />
</header>

<nav class="nav-bar">
	<button on:click={() => goto('/')}>💄 Lipstick Matcher</button>
	<button on:click={() => goto('/how-its-matched')}>🧠 How It's Matched</button>
</nav>

<svelte:head>
  <title>How Lipstick Matcher Works | Skin Tone & Undertone Detection</title>
  <meta name="description" content="Learn how Lipstick Matcher uses face detection and color science to recommend lipstick shades tailored to you." />
  <meta property="og:title" content="How Lipstick Matcher Works" />
  <meta property="og:description" content="See the tech behind our AI lipstick matcher and how it finds your best shade based on your skin tone." />
</svelte:head>


<div class="content">
    <h1>💡 How Lipstick Matching Works</h1>

    <p>
        Our <strong>AI-powered lipstick matcher</strong> uses advanced facial recognition and color science to recommend lipstick shades that enhance your natural beauty. Here's how we do it:
    </p>

    <h2>📷 Step 1: Face Detection</h2>
    <p>
        When you upload a selfie, we use <strong>face-api.js</strong>, a lightweight deep learning model, to detect key landmarks on your face such as your eyes, nose, and jawline. This helps us locate your <strong>cheek region</strong>, which is ideal for sampling true skin tone.
    </p>

    <h2>🎨 Step 2: Skin Tone Sampling</h2>
    <p>
        From your cheek area, we extract RGB color values and convert them to <strong>HSL (Hue, Saturation, Lightness)</strong>. This conversion allows us to analyze your skin's lightness level with precision.
    </p>
    <p>
        We divide skin lightness into <strong>20 distinct tone levels</strong>, ranging from the fairest ivory tones to the deepest ebony hues. This granularity ensures we capture subtle variations in your complexion that generic systems might miss.
    </p>
    <p>
        Your exact tone level helps us fine-tune the lipstick recommendations to suit your skin’s natural depth and undertone.
    </p>
    

    <h2>🌈 Step 3: Undertone Detection</h2>
    <p>
        Using color hue and saturation values, our algorithm estimates whether your undertone is <strong>warm, cool, or neutral</strong>. This step is crucial for selecting lipstick shades that harmonize with your natural undertones.
    </p>

    <h2>💄 Step 4: Shade Recommendation</h2>
    <p>
        Finally, we cross-reference your tone and undertone against a curated database of lipstick colors. We suggest <strong>three lipstick shades</strong> that complement your complexion — complete with <strong>color swatches</strong> and direct links to shop.
    </p>

    <h2>⚡ Technology We Use</h2>
    <ul>
        <li><strong>face-api.js</strong> for facial landmark detection</li>
        <li>Custom HSL-based color analysis</li>
        <li>Tailored shade-matching logic based on makeup color theory</li>
    </ul>

    <h2>✅ Best Practices for Accurate Results</h2>
    <ul>
        <li>Use natural daylight (avoid flash)</li>
        <li>Make sure your cheeks are clearly visible</li>
        <li>Upload a photo without heavy makeup</li>
    </ul>

    <p>
        Want to try it out? Head back to our <a href="/">Lipstick Matcher</a> and upload your selfie!
    </p>
</div>

<style>
    .logo-header {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 2rem;
    }

    .logo {
        max-width: 200px;
        height: auto;
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
    .content {
        max-width: 700px;
        margin: 2rem auto;
        padding: 1rem;
        font-family: 'Poppins', sans-serif;
        line-height: 1.6;
        color: #4e342e;
        background: #fffaf9;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(244, 143, 177, 0.1);
    }

    h1, h2 {
        color: #d81b60;
        margin-top: 1.5rem;
    }

    ul {
        padding-left: 1.2rem;
    }

    a {
        color: #d81b60;
        text-decoration: underline;
    }
</style>

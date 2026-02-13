<script lang="ts">
	import { posts } from './_posts';

	const sortedPosts = [...posts].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	function getPostCategory(post: any): string {
		if (Array.isArray(post.tags) && post.tags.length > 0) {
			return String(post.tags[0]);
		}
		return 'Guide';
	}

	const blogStructuredData = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: 'Lipstick Matcher Blog',
		url: 'https://lipstickmatcher.com/blog',
		description: 'Lipstick tips, shade theory, and practical beauty guides.'
	});
</script>

<svelte:head>
	<title>Lipstick Matcher Blog | Shade Guides and Beauty Tips</title>
	<meta
		name="description"
		content="Read lipstick shade guides, finish comparisons, and seasonal beauty insights from Lipstick Matcher."
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://lipstickmatcher.com/blog" />
	<meta property="og:title" content="Lipstick Matcher Blog" />
	<meta property="og:description" content="Beauty guides and lipstick matching tips from the Lipstick Matcher team." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://lipstickmatcher.com/blog" />
	<meta property="og:image" content="https://lipstickmatcher.com/logo.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<script type="application/ld+json">{blogStructuredData}</script>
</svelte:head>

<main class="blog-page">
	<header class="hero">
		<div class="hero-topbar">
			<a href="/" class="brand">
				<img src="/logo.png" alt="Lipstick Matcher" class="brand-logo" />
			</a>
			<nav aria-label="Main navigation" class="nav-links">
				<a href="/">Matcher</a>
				<a href="/how-its-matched">How It Works</a>
				<a href="/blog" aria-current="page">Blog</a>
			</nav>
		</div>
		<p class="eyebrow">Beauty Education</p>
		<h1>Lipstick Matcher Blog</h1>
		<p>Short, practical reads to help users choose shades with less guesswork.</p>
	</header>

	<ul class="post-list">
		{#each sortedPosts as post}
			<li>
				<a href={`/blog/${post.slug}`}>
					<div class="post-main">
						<span class="guide-pill"><span class="pill-dot"></span>{getPostCategory(post)}</span>
						<span class="title">{post.title}</span>
					</div>
					<span class="meta"
						>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span
					>
				</a>
			</li>
		{/each}
	</ul>
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

	.blog-page {
		max-width: 980px;
		margin: 0 auto;
		padding: 1.25rem 1rem 3rem;
	}

	.hero {
		border: 1px solid #f0d8de;
		background: linear-gradient(130deg, #ffffff 0%, #fff4f8 100%);
		border-radius: 24px;
		padding: 1rem 1rem 1.3rem;
		box-shadow: 0 20px 50px rgba(134, 49, 83, 0.08);
	}

	.hero-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.brand {
		display: inline-block;
		text-decoration: none;
	}

	.brand-logo {
		width: 178px;
		height: auto;
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
		margin: 0.9rem 0 0;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		font-size: 0.72rem;
		font-weight: 800;
		color: #a94b6e;
	}

	h1 {
		margin: 0.38rem 0 0.6rem;
		color: #61263f;
		font-family: 'Cormorant Garamond', 'Georgia', serif;
		font-size: clamp(1.8rem, 3.8vw, 2.75rem);
		line-height: 1.12;
	}

	.hero p {
		margin: 0;
		color: #4b5563;
		line-height: 1.6;
	}

	.post-list {
		list-style: none;
		padding: 0;
		margin: 1.2rem 0 0;
		display: grid;
		gap: 0.7rem;
	}

	.post-list a {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: baseline;
		padding: 0.9rem 1rem;
		border-radius: 13px;
		text-decoration: none;
		background: #fff9fb;
		border: 1px solid #edd1de;
		color: #6a2d48;
		box-shadow: 0 10px 24px rgba(102, 41, 66, 0.06);
		transition: transform 140ms ease, box-shadow 140ms ease;
	}

	.post-list a:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 24px rgba(172, 78, 116, 0.12);
	}

	.post-main {
		display: grid;
		gap: 0.32rem;
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

	.title {
		font-weight: 700;
	}

	.meta {
		font-size: 0.84rem;
		font-weight: 600;
		color: #8b6778;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.blog-page {
			padding: 0.8rem 0.75rem 3rem;
		}

		.hero {
			padding: 1rem;
			border-radius: 14px;
		}

		.post-list a {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>

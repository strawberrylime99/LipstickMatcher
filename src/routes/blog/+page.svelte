<script lang="ts">
	import { posts } from './_posts';

	const sortedPosts = [...posts].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

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
	<header>
		<p class="eyebrow">Beauty Education</p>
		<h1>Lipstick Matcher Blog</h1>
		<p>Short, practical reads to help users choose shades with less guesswork.</p>
	</header>

	<ul class="post-list">
		{#each sortedPosts as post}
			<li>
				<a href={`/blog/${post.slug}`}>
					<span class="title">{post.title}</span>
					<span class="meta">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
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
			radial-gradient(circle at top left, #fdf2e7 0%, rgba(253, 242, 231, 0) 40%),
			linear-gradient(160deg, #fffdfa 0%, #f6f8fc 100%);
		color: #1f2937;
	}

	.blog-page {
		max-width: 840px;
		margin: 0 auto;
		padding: 1.2rem 1rem 3rem;
	}

	header {
		background: #fff;
		border: 1px solid #dfe7f1;
		border-radius: 16px;
		padding: 1.1rem;
		box-shadow: 0 14px 32px rgba(8, 30, 66, 0.05);
	}

	.eyebrow {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.76rem;
		font-weight: 800;
		color: #b5442e;
	}

	h1 {
		margin: 0.38rem 0 0.5rem;
		color: #0d223d;
	}

	header p {
		margin: 0;
		color: #334155;
	}

	.post-list {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0;
		display: grid;
		gap: 0.65rem;
	}

	.post-list a {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: baseline;
		padding: 0.9rem 1rem;
		border-radius: 12px;
		text-decoration: none;
		background: #fff;
		border: 1px solid #dfe7f1;
		color: #132f4f;
		box-shadow: 0 10px 24px rgba(8, 30, 66, 0.04);
	}

	.title {
		font-weight: 700;
	}

	.meta {
		font-size: 0.84rem;
		font-weight: 600;
		color: #64748b;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.post-list a {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>

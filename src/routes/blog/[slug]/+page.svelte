<script lang="ts">
	export let data;

	const formattedDate = new Date(data.post.date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const articleUrl = `https://lipstickmatcher.com/blog/${data.post.slug}`;
	const articleStructuredData = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: data.post.title,
		description: data.post.description ?? 'Lipstick Matcher beauty blog post',
		datePublished: data.post.date,
		mainEntityOfPage: articleUrl,
		author: {
			'@type': 'Organization',
			name: 'Lipstick Matcher'
		},
		publisher: {
			'@type': 'Organization',
			name: 'Lipstick Matcher',
			logo: {
				'@type': 'ImageObject',
				url: 'https://lipstickmatcher.com/logo.png'
			}
		}
	});
</script>

<svelte:head>
	<title>{data.post.title} | Lipstick Matcher</title>
	<meta name="description" content={data.post.description ?? 'Lipstick Matcher beauty blog post'} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={articleUrl} />

	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={data.post.description ?? 'Lipstick Matcher beauty blog post'} />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="Lipstick Matcher" />
	<meta property="og:url" content={articleUrl} />
	<meta property="og:image" content="https://lipstickmatcher.com/logo.png" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.post.title} />
	<meta name="twitter:description" content={data.post.description ?? 'Lipstick Matcher beauty blog post'} />
	<meta name="twitter:image" content="https://lipstickmatcher.com/logo.png" />

	<script type="application/ld+json">{articleStructuredData}</script>
</svelte:head>

<article class="blog-post">
	<header class="hero">
		<div class="hero-topbar">
			<a href="/" class="brand">
				<img src="/logo.png" alt="Lipstick Matcher" class="brand-logo" />
			</a>
			<nav class="nav-links" aria-label="Main navigation">
				<a href="/">Matcher</a>
				<a href="/how-its-matched">How It Works</a>
				<a href="/blog" aria-current="page">Blog</a>
			</nav>
		</div>
		<a href="/blog" class="back-link">Back to blog</a>
		<h1>{data.post.title}</h1>
		<p class="published">{formattedDate}</p>
	</header>

	<section class="content-panel">
		<div class="content">
			<svelte:component this={data.post.component} />
		</div>
	</section>

	<section class="post-cta" aria-label="Try matcher">
		<h2>Ready to test your own shades?</h2>
		<p>Upload a selfie and get your top lipstick matches in under a minute.</p>
		<a href="/" class="cta-button">Try Lipstick Matcher</a>
	</section>

	{#if data.relatedPosts?.length > 0}
		<section class="related-guides" aria-label="Related guides">
			<h2>Related guides</h2>
			<ul>
				{#each data.relatedPosts as post}
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
	{/if}

	<p class="affiliate-note">
		Disclosure: This site may use paid links. As an Amazon Associate I earn from qualifying purchases.
	</p>
</article>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Manrope', 'Segoe UI', sans-serif;
		background:
			radial-gradient(circle at top left, rgba(247, 168, 184, 0.12) 0%, rgba(247, 168, 184, 0) 45%),
			linear-gradient(160deg, #fff7f9 0%, #fff5f2 100%);
		color: #1f2937;
	}

	.blog-post {
		max-width: 980px;
		margin: 1.2rem auto 3.2rem;
		padding: 0 1rem;
		line-height: 1.66;
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

	.back-link {
		display: inline-block;
		margin-top: 0.9rem;
		margin-bottom: 0.8rem;
		font-size: 0.88rem;
		text-decoration: none;
		font-weight: 700;
		color: #9f3f67;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.8rem, 3.8vw, 2.75rem);
		line-height: 1.2;
		color: #61263f;
		font-family: 'Cormorant Garamond', 'Georgia', serif;
	}

	.published {
		margin: 0.45rem 0 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: #8b6778;
	}

	.content-panel,
	.post-cta,
	.related-guides {
		margin-top: 1.1rem;
		padding: 1.1rem;
		border: 1px solid #efd8df;
		border-radius: 16px;
		background: #fff;
		box-shadow: 0 12px 26px rgba(102, 41, 66, 0.05);
	}

	.content :global(h2),
	.content :global(h3) {
		color: #6f2f4f;
		font-family: 'Cormorant Garamond', 'Georgia', serif;
	}

	.content :global(a) {
		color: #9f3f67;
	}

	.content :global(img) {
		max-width: 100%;
		height: auto;
		display: block;
		margin: 1.25rem auto;
		border-radius: 12px;
		border: 1px solid #ecd1da;
	}

	.post-cta h2,
	.related-guides h2 {
		margin: 0;
		font-size: 1.2rem;
		color: #6f2f4f;
		font-family: 'Cormorant Garamond', 'Georgia', serif;
	}

	.post-cta p {
		margin: 0.45rem 0 0.9rem;
		color: #5a5561;
	}

	.cta-button {
		display: inline-block;
		text-decoration: none;
		padding: 0.72rem 1.1rem;
		border-radius: 999px;
		font-weight: 800;
		color: #fff;
		background: linear-gradient(120deg, #d84d7f 0%, #b22856 100%);
		box-shadow: 0 10px 24px rgba(150, 34, 78, 0.28);
	}

	.related-guides ul {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0 0;
		display: grid;
		gap: 0.6rem;
	}

	.related-guides a {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.8rem;
		padding: 0.7rem 0.8rem;
		border-radius: 10px;
		text-decoration: none;
		background: #fff9fb;
		border: 1px solid #edd1de;
		color: #6a2d48;
		font-weight: 700;
		transition: transform 140ms ease, box-shadow 140ms ease;
	}

	.related-guides a:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(172, 78, 116, 0.11);
	}

	.related-guides small {
		color: #8b6778;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.affiliate-note {
		margin: 1rem 0 0;
		font-size: 0.82rem;
		color: #816572;
	}

	@media (max-width: 720px) {
		.blog-post {
			padding: 0 0.75rem;
			margin-top: 0.8rem;
		}

		.hero,
		.content-panel,
		.post-cta,
		.related-guides {
			border-radius: 14px;
			padding: 1rem;
		}

		.related-guides a {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>

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
	<a href="/blog" class="back-link">Back to blog</a>
	<h1>{data.post.title}</h1>
	<p class="published">{formattedDate}</p>
	<div class="content">
		<svelte:component this={data.post.component} />
	</div>
</article>

<style>
	.blog-post {
		max-width: 840px;
		margin: 1.2rem auto 3rem;
		padding: 1.1rem;
		font-family: 'Manrope', 'Segoe UI', sans-serif;
		line-height: 1.66;
		background: #fff;
		border: 1px solid #dfe7f1;
		border-radius: 16px;
		box-shadow: 0 14px 32px rgba(8, 30, 66, 0.05);
	}

	.back-link {
		display: inline-block;
		margin-bottom: 0.7rem;
		font-size: 0.9rem;
		text-decoration: none;
		font-weight: 700;
		color: #1f3e63;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.6rem, 3.2vw, 2.25rem);
		line-height: 1.2;
		color: #0d223d;
	}

	.published {
		margin: 0.45rem 0 1rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: #64748b;
	}

	.content :global(h2),
	.content :global(h3) {
		color: #143459;
	}

	.content :global(a) {
		color: #0f4c8d;
	}

	.content :global(img) {
		max-width: 100%;
		height: auto;
		display: block;
		margin: 1.25rem auto;
		border-radius: 12px;
	}
</style>

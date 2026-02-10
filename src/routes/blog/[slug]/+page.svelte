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

	.post-cta,
	.related-guides {
		margin-top: 1.25rem;
		padding: 1rem;
		border: 1px solid #dce6f2;
		border-radius: 12px;
		background: #f8fbff;
	}

	.post-cta h2,
	.related-guides h2 {
		margin: 0;
		font-size: 1.2rem;
		color: #143459;
	}

	.post-cta p {
		margin: 0.45rem 0 0.9rem;
	}

	.cta-button {
		display: inline-block;
		text-decoration: none;
		padding: 0.65rem 0.9rem;
		border-radius: 10px;
		font-weight: 700;
		color: #fff;
		background: linear-gradient(120deg, #c14934 0%, #9f2f40 100%);
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
		background: #fff;
		border: 1px solid #dce6f2;
		color: #143459;
		font-weight: 700;
	}

	.related-guides small {
		color: #64748b;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.affiliate-note {
		margin: 1rem 0 0;
		font-size: 0.82rem;
		color: #64748b;
	}
</style>

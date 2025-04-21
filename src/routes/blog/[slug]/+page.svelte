<script lang="ts">
	export let data;
	const formattedDate = new Date(data.post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
</script>

<svelte:head>
  <title>{data.post.title} | Lipstick Matcher</title>
  <meta name="description" content={data.post.description ?? 'Lipstick Matcher beauty blog post'} />

  <!-- Open Graph -->
  <meta property="og:title" content={data.post.title} />
  <meta property="og:description" content={data.post.description ?? 'Lipstick Matcher beauty blog post'} />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Lipstick Matcher" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={data.post.title} />
  <meta name="twitter:description" content={data.post.description ?? 'Lipstick Matcher beauty blog post'} />
</svelte:head>

<article class="blog-post">
	<a href="/" class="back-button">← Back to Lipstick Matcher</a>
	<h1>{data.post.title}</h1>
	<p><em>{formattedDate}</em></p>
	<svelte:component this={data.post.component} />
</article>

<style>
.blog-post {
	max-width: 700px;
	margin: 2rem auto;
	padding: 1rem;
	font-family: 'Poppins', sans-serif;
	line-height: 1.6;
}
.content img {
	max-width: 100%;
	height: auto;
	margin: 2rem 0;
	border-radius: 12px;
}
.back-button {
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  color: #c2185b;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-button:hover {
  color: #880e4f;
  text-decoration: underline;
}

</style>

<script lang="ts">
    import { posts } from './_posts';
  </script>
  
  <svelte:head>
    <title>Blog | Lipstick Matcher</title>
    <meta name="description" content="Beauty blog with lipstick tips, AI shade matching, and seasonal trends." />
  </svelte:head>
  
  <h1>📝 Lipstick Matcher Blog</h1>
  <ul>
    {#each posts as post}
      <li>
        <a href={`/blog/${post.slug}`}>
          <strong>{post.title}</strong> — <small>{post.date}</small>
        </a>
      </li>
    {/each}
  </ul>
  
<style>
	:global(body) {
		background-color: #fff8f4;
		margin: 0;
		font-family: 'Poppins', sans-serif;
		color: #4e342e;
	}

	.blog-layout {
		max-width: 720px;
		margin: 3rem auto;
		padding: 2rem;
		border-radius: 12px;
		background: #b80b0b;
		box-shadow: 0 4px 16px rgba(244, 143, 177, 0.15);
	}

	h1, h2, h3 {
		color: #d81b60;
		margin-top: 2rem;
	}

	p, li {
		font-size: 1.05rem;
		line-height: 1.7;
		margin-bottom: 1.2rem;
	}

	a {
		color: #c2185b;
		text-decoration: underline;
		transition: color 0.2s ease;
	}

	a:hover {
		color: #880e4f;
	}

	:global(.blog-image) {
		max-width: 100%;
		max-height: 400px;
		display: block;
		margin: 2rem auto;
		border-radius: 12px;
		object-fit: cover;
		box-shadow: 0 4px 16px rgba(197, 63, 14, 0.1);
	}

	hr {
		border: none;
		border-top: 1px dashed #ef9a9a;
		margin: 2rem 0;
	}
</style>
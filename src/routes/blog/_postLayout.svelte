<script>
  export let title = 'Blog Post';
</script>

<svelte:head>
  <title>{title} | Lipstick Matcher</title>
  <meta name="description" content="Beauty blog, lipstick recommendations, AI shade matching, and seasonal trends." />
</svelte:head>

<main class="blog-layout">
  <slot />
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

  .blog-layout {
    max-width: 980px;
    margin: 1.2rem auto 3rem;
    padding: 1.1rem;
    line-height: 1.7;
    background: #fff;
    border: 1px solid #efd8df;
    border-radius: 16px;
    box-shadow: 0 12px 26px rgba(102, 41, 66, 0.05);
  }

  :global(h1),
  :global(h2),
  :global(h3) {
    color: #6f2f4f;
    margin-top: 1.2rem;
    font-family: 'Cormorant Garamond', 'Georgia', serif;
    font-weight: 700;
  }

  :global(p),
  :global(li) {
    color: #5a5561;
    font-size: 1rem;
    margin-bottom: 0.9rem;
  }

  :global(a) {
    color: #9f3f67;
    text-decoration: underline;
    transition: color 0.2s ease;
  }

  :global(a:hover) {
    color: #7c3052;
  }

  :global(img) {
    max-width: 100%;
    height: auto;
    margin: 1.5rem auto;
    display: block;
    border-radius: 12px;
    border: 1px solid #ecd1da;
    box-shadow: 0 8px 18px rgba(102, 41, 66, 0.08);
    object-fit: cover;
  }

  :global(ul) {
    padding-left: 1.5rem;
  }

  :global(em) {
    color: #8b6778;
  }

  @media (max-width: 720px) {
    .blog-layout {
      margin-top: 0.8rem;
      padding: 1rem;
      border-radius: 14px;
    }
  }
</style>

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
  .blog-layout {
    max-width: 720px;
    margin: 3rem auto;
    padding: 2rem;
    font-family: 'Poppins', sans-serif;
    line-height: 1.7;
    background-color: #f0d3bb; /* Peach Cream */
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(244, 143, 177, 0.1);
  }

  :global(h1),
  :global(h2),
  :global(h3) {
    color: #c2185b;
    margin-top: 2rem;
    font-weight: 600;
  }

  :global(p),
  :global(li) {
    color: #4e342e;
    font-size: 1.05rem;
    margin-bottom: 1.2rem;
  }

  :global(a) {
    color: #d81b60;
    text-decoration: underline;
    transition: color 0.2s ease;
  }

  :global(a:hover) {
    color: #880e4f;
  }

  :global(img) {
    max-width: 100%;
    height: auto;
    margin: 2rem auto;
    display: block;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    object-fit: cover;
  }

  :global(ul) {
    padding-left: 1.5rem;
  }

  :global(em) {
    color: #8d6e63;
  }
</style>

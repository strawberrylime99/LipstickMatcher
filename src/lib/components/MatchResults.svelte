<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ShadeCatalogEntry } from '$lib/catalog/shades';

	export let sampledHex: string | null = null;
	export let detectedTone: string | null = null;
	export let detectedUndertone: string | null = null;
	export let suggestedShades: string[] = [];
	export let shadeCatalog: Record<string, ShadeCatalogEntry> = {};

	const dispatch = createEventDispatcher<{
		affiliateclick: { shade: string; position: number };
	}>();

	$: hasResults = Boolean(sampledHex || detectedTone || detectedUndertone || suggestedShades.length > 0);
</script>

{#if hasResults}
	<section class="results" aria-labelledby="results-title">
		<h2 id="results-title">Your match profile</h2>

		<div class="metric-grid">
			{#if sampledHex}
				<div class="metric-card">
					<h3>Sampled cheek color</h3>
					<p>
						<span class="color-dot" style={`background-color: ${sampledHex}`}></span>
						{sampledHex}
					</p>
				</div>
			{/if}

			{#if detectedTone}
				<div class="metric-card">
					<h3>Detected tone</h3>
					<p>{detectedTone}</p>
				</div>
			{/if}

			{#if detectedUndertone}
				<div class="metric-card">
					<h3>Detected undertone</h3>
					<p>{detectedUndertone}</p>
				</div>
			{/if}
		</div>

		{#if suggestedShades.length > 0}
			<div class="shade-list-wrap">
				<h3>Recommended shades</h3>
				<ul class="shade-list">
					{#each suggestedShades as shade, index}
						<li>
							<a
								href={shadeCatalog[shade]?.productUrl}
								target="_blank"
								rel="noopener noreferrer"
								on:click={() => dispatch('affiliateclick', { shade, position: index + 1 })}
							>
								<span class="swatch" style={`background-color: ${shadeCatalog[shade]?.hex ?? '#ccc'}`}></span>
								<span class="shade-name">{shade}</span>
								{#if index === 0}
									<span class="best-badge">Best match</span>
								{/if}
								<span class="buy-label">View product</span>
							</a>
						</li>
					{/each}
				</ul>
				<p class="open-note">Product links open in a new tab.</p>
				<p class="amazon-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>
			</div>
		{/if}
	</section>
{/if}

<style>
	.results {
		margin-top: 1.25rem;
		padding: 1.2rem;
		background: #fff;
		border: 1px solid #efd8df;
		border-radius: 18px;
		box-shadow: 0 12px 26px rgba(102, 41, 66, 0.05);
	}

	h2 {
		margin: 0;
		font-size: 1.3rem;
		color: #6e2e4d;
	}

	.metric-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.8rem;
		margin-top: 1rem;
	}

	.metric-card {
		padding: 0.9rem;
		border-radius: 12px;
		background: #fff6fa;
		border: 1px solid #efcfdd;
	}

	.metric-card h3 {
		margin: 0;
		font-size: 0.86rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #9a5876;
	}

	.metric-card p {
		margin: 0.55rem 0 0;
		font-weight: 700;
		font-size: 1.06rem;
		color: #6a2d48;
		text-transform: capitalize;
	}

	.color-dot,
	.swatch {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 1px solid #edd9e0;
		vertical-align: middle;
		margin-right: 0.45rem;
	}

	.shade-list-wrap {
		margin-top: 1rem;
	}

	.shade-list-wrap h3 {
		margin: 0 0 0.65rem;
		color: #6f2e4e;
	}

	.shade-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.55rem;
	}

	.shade-list a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.7rem;
		padding: 0.75rem 0.9rem;
		border-radius: 11px;
		text-decoration: none;
		border: 1px solid #edd1de;
		background: #fff;
		color: #6a2d48;
		transition: transform 140ms ease, box-shadow 140ms ease;
	}

	.shade-list a:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(172, 78, 116, 0.11);
	}

	.shade-name {
		font-weight: 700;
		text-transform: capitalize;
		flex: 1;
	}

	.best-badge {
		font-size: 0.68rem;
		font-weight: 800;
		padding: 0.2rem 0.42rem;
		border-radius: 999px;
		background: #fde9f1;
		color: #a03d67;
		white-space: nowrap;
	}

	.buy-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: #91526d;
	}

	.amazon-disclosure {
		margin: 0.6rem 0 0;
		font-size: 0.82rem;
		color: #816572;
	}

	.open-note {
		margin: 0.55rem 0 0;
		font-size: 0.78rem;
		color: #8b6f7d;
	}

	@media (max-width: 720px) {
		.results {
			border-radius: 14px;
			padding: 1rem;
		}
	}
</style>

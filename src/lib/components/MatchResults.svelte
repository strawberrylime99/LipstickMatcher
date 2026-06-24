<script lang="ts">
	import { createEventDispatcher, onDestroy, tick } from 'svelte';
	import type { ShadeCatalogEntry } from '$lib/catalog/shades';

	export let sampledHex: string | null = null;
	export let detectedTone: string | null = null;
	export let detectedUndertone: string | null = null;
	export let suggestedShades: string[] = [];
	export let shadeReasons: string[] = [];
	export let shadeCatalog: Record<string, ShadeCatalogEntry> = {};

	const dispatch = createEventDispatcher<{
		affiliateclick: { shade: string; position: number };
	}>();

	$: hasResults = Boolean(sampledHex || detectedTone || detectedUndertone || suggestedShades.length > 0);
	let isOpen = false;
	let lastResultSignature = '';
	let dialogElement: HTMLDivElement | null = null;
	let closeButtonElement: HTMLButtonElement | null = null;
	let previousActiveElement: HTMLElement | null = null;

	$: resultSignature = suggestedShades.join('|');
	$: if (hasResults && resultSignature && resultSignature !== lastResultSignature) {
		isOpen = true;
		lastResultSignature = resultSignature;
	}

	$: if (typeof document !== 'undefined') {
		document.body.classList.toggle('results-open', isOpen);
	}

	$: if (isOpen) {
		previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		void tick().then(() => {
			closeButtonElement?.focus();
		});
	} else if (previousActiveElement) {
		previousActiveElement.focus();
		previousActiveElement = null;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			closeWidget();
		}
	}

	function handleDialogKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab' || !dialogElement) return;

		const focusableElements = Array.from(
			dialogElement.querySelectorAll<HTMLElement>(
				'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => !element.hasAttribute('disabled'));

		if (!focusableElements.length) return;

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (event.shiftKey && document.activeElement === firstElement) {
			event.preventDefault();
			lastElement.focus();
		} else if (!event.shiftKey && document.activeElement === lastElement) {
			event.preventDefault();
			firstElement.focus();
		}
	}

	function closeWidget() {
		isOpen = false;
	}

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.body.classList.remove('results-open');
		}
	});
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if hasResults}
	{#if isOpen}
		<div class="results-overlay" aria-hidden="true" on:click={closeWidget}></div>

		<div
			class="results-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="results-title"
			tabindex="-1"
			bind:this={dialogElement}
			on:keydown={handleDialogKeydown}
		>
			<div class="modal-head">
				<div>
					<p class="eyebrow">Match complete</p>
					<h2 id="results-title">Your top lipstick matches are ready</h2>
					<p class="subcopy">These are the three shades most likely to click right away.</p>
				</div>
				<button
					class="close-button"
					type="button"
					aria-label="Close results"
					bind:this={closeButtonElement}
					on:click={closeWidget}
				>
					&times;
				</button>
			</div>

			<div class="metric-grid">
				{#if sampledHex}
					<div class="metric-card">
						<h3>Sample</h3>
						<p>
							<span class="color-dot" style={`background-color: ${sampledHex}`}></span>
							{sampledHex}
						</p>
					</div>
				{/if}

				{#if detectedTone}
					<div class="metric-card">
						<h3>Tone</h3>
						<p>{detectedTone}</p>
					</div>
				{/if}

				{#if detectedUndertone}
					<div class="metric-card">
						<h3>Undertone</h3>
						<p>{detectedUndertone}</p>
					</div>
				{/if}
			</div>

			{#if suggestedShades.length > 0}
				<div class="shade-list-wrap">
					<ul class="shade-list">
						{#each suggestedShades as shade, index}
							<li class:index-top={index === 0}>
								<div class="shade-card">
									<div class="shade-copy">
										<div class="shade-title-row">
											<div class="shade-title-wrap">
												<span
													class="swatch"
													style={`background-color: ${shadeCatalog[shade]?.hex ?? '#ccc'}`}
												></span>
												<div>
													<p class="rank-label">#{index + 1} pick</p>
													<p class="shade-name">{shade}</p>
												</div>
											</div>
											{#if index === 0}
												<span class="best-badge">Best match</span>
											{/if}
										</div>
										<p class="shade-reason">
											{shadeReasons[index] || 'This one fits your coloring in an easy, wearable way.'}
										</p>
									</div>
									<a
										class="shop-link"
										href={shadeCatalog[shade]?.productUrl}
										target="_blank"
										rel="noopener noreferrer"
										on:click={() => dispatch('affiliateclick', { shade, position: index + 1 })}
									>
										Shop this shade
									</a>
								</div>
							</li>
						{/each}
					</ul>
					<p class="open-note">Product links open in a new tab.</p>
					<p class="amazon-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>
				</div>
			{/if}
		</div>
	{:else if suggestedShades.length > 0}
		<button class="reopen-button" type="button" on:click={() => (isOpen = true)}>
			View your 3 matches
		</button>
	{/if}
{/if}

<style>
	:global(body.results-open) {
		overflow: hidden;
		touch-action: none;
	}

	.results-overlay {
		position: fixed;
		inset: 0;
		background: rgba(64, 25, 41, 0.38);
		backdrop-filter: blur(4px);
		z-index: 29;
	}

	.results-modal {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: min(720px, calc(100vw - 1.5rem));
		max-height: calc(100vh - 1.5rem);
		overflow: auto;
		padding: 1.2rem;
		background:
			radial-gradient(circle at top right, rgba(247, 168, 184, 0.22) 0%, rgba(247, 168, 184, 0) 34%),
			linear-gradient(180deg, #fffdfd 0%, #fff7fa 100%);
		border: 1px solid #efd8df;
		border-radius: 24px;
		box-shadow: 0 28px 60px rgba(74, 27, 46, 0.22);
		z-index: 30;
		overscroll-behavior: contain;
	}

	.modal-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		position: sticky;
		top: -1.2rem;
		margin: -1.2rem -1.2rem 0;
		padding: 1.2rem 1.2rem 0.95rem;
		background: linear-gradient(180deg, rgba(255, 253, 253, 0.98) 0%, rgba(255, 247, 250, 0.95) 100%);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(239, 216, 223, 0.9);
		border-top-left-radius: 24px;
		border-top-right-radius: 24px;
		z-index: 1;
	}

	.eyebrow {
		margin: 0 0 0.35rem;
		font-size: 0.74rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #b04c73;
	}

	.subcopy {
		margin: 0.4rem 0 0;
		color: #6f5c66;
		font-size: 0.96rem;
		line-height: 1.5;
	}

	.close-button {
		width: 2.75rem;
		height: 2.75rem;
		flex: 0 0 auto;
		border: 1px solid #ecc9d7;
		border-radius: 999px;
		background: #fff;
		color: #874562;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
	}

	.close-button:focus-visible,
	.shop-link:focus-visible,
	.reopen-button:focus-visible {
		outline: 3px solid rgba(176, 76, 115, 0.3);
		outline-offset: 2px;
	}

	h2 {
		margin: 0;
		font-size: 1.7rem;
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
		padding-bottom: 0.25rem;
	}

	.shade-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.8rem;
	}

	.shade-card {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
		border-radius: 16px;
		border: 1px solid #edd1de;
		background: #fff;
		color: #6a2d48;
		transition: transform 140ms ease, box-shadow 140ms ease;
	}

	.shade-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(172, 78, 116, 0.11);
	}

	.index-top .shade-card {
		border-color: #df9ab5;
		box-shadow: 0 12px 28px rgba(189, 81, 123, 0.12);
	}

	.shade-title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.shade-title-wrap {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.rank-label {
		margin: 0;
		font-size: 0.74rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a1647d;
	}

	.shade-name {
		margin: 0.18rem 0 0;
		font-weight: 800;
		font-size: 1.08rem;
		text-transform: capitalize;
		overflow-wrap: anywhere;
	}

	.shade-reason {
		margin: 0.7rem 0 0;
		color: #5d5260;
		line-height: 1.55;
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

	.shop-link,
	.reopen-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		text-decoration: none;
		border: none;
		border-radius: 999px;
		min-height: 44px;
		padding: 0.82rem 1.05rem;
		font-size: 0.9rem;
		font-weight: 800;
		cursor: pointer;
		color: #fff;
		background: linear-gradient(120deg, #d84d7f 0%, #b22856 100%);
		box-shadow: 0 10px 24px rgba(150, 34, 78, 0.22);
		white-space: nowrap;
	}

	.reopen-button {
		position: fixed;
		right: 1rem;
		bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
		z-index: 20;
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
		.results-modal {
			left: 0.7rem;
			right: 0.7rem;
			top: auto;
			bottom: 0;
			width: auto;
			max-width: none;
			max-height: min(84vh, calc(100dvh - 0.5rem));
			transform: none;
			padding: 1rem 1.15rem calc(1rem + env(safe-area-inset-bottom, 0px));
			border-radius: 20px 20px 16px 16px;
		}

		h2 {
			font-size: 1.35rem;
		}

		.modal-head {
			top: -1rem;
			margin: -1rem -1.15rem 0;
			padding: 1rem 1.15rem 0.85rem;
			border-top-left-radius: 20px;
			border-top-right-radius: 20px;
		}

		.metric-grid {
			grid-template-columns: 1fr;
			gap: 0.65rem;
		}

		.shade-card {
			grid-template-columns: 1fr;
			align-items: stretch;
		}

		.shade-title-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.best-badge {
			align-self: flex-start;
		}

		.shop-link {
			width: 100%;
			max-width: 100%;
		}

		.reopen-button {
			right: 0.75rem;
			left: 0.75rem;
			bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
		}
	}
</style>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type AnalyzerEvents = {
		selectfile: void;
		upload: Event;
		dropfile: DragEvent;
		dragoverzone: DragEvent;
		dragleavezone: void;
		keyactivate: KeyboardEvent;
	};

	export let isModelLoading = false;
	export let modelLoadError: string | null = null;
	export let isAnalyzing = false;
	export let analysisError: string | null = null;
	export let analysisProgress = 0;
	export let analysisStage = 'Preparing image...';
	export let previewUrls: string[] = [];
	export let uploadInput: HTMLInputElement | null = null;
	export let isDragActive = false;
	export let maxUploads = 3;

	const dispatch = createEventDispatcher<AnalyzerEvents>();
</script>

<section class="analyzer" aria-labelledby="analyzer-title" id="uploader">
	<div class="section-head uploader-head">
		<h2 id="analyzer-title">Upload your selfies</h2>
	</div>

	{#if isModelLoading}
		<p class="model-status">Loading AI model...</p>
	{:else if modelLoadError}
		<p class="error-message">{modelLoadError}</p>
	{/if}

	<div
		class="drop-zone"
		class:dragging={isDragActive}
		on:dragover={(event) => dispatch('dragoverzone', event)}
		on:dragleave={() => dispatch('dragleavezone')}
		on:drop={(event) => dispatch('dropfile', event)}
		on:click={() => dispatch('selectfile')}
		on:keydown={(event) => dispatch('keyactivate', event)}
		role="button"
		tabindex="0"
	>
		<p><strong>Drop up to {maxUploads} selfies here</strong> or click to browse</p>
		<small>JPG, PNG, HEIC (best in even lighting)</small>
		<input
			bind:this={uploadInput}
			type="file"
			accept="image/*"
			multiple
			on:change={(event) => dispatch('upload', event)}
			disabled={isModelLoading}
		/>
	</div>

	<p class="privacy-note">
		Private: your photo never leaves your device. We do not store it anywhere or sell it to anyone.
	</p>

	<div class="upload-guidance" role="note" aria-label="Best results tips">
		<p>For best accuracy:</p>
		<ul>
			<li>Upload one to three photos in similar daylight or bright front lighting.</li>
			<li>Avoid heavy filters, strong shadows, and extreme white balance shifts.</li>
			<li>Face the camera straight with both cheeks visible.</li>
		</ul>
	</div>

	{#if isAnalyzing}
		<div class="progress-wrap" role="status" aria-live="polite">
			<div
				class="progress-bar"
				role="progressbar"
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={analysisProgress}
			>
				<span style={`width: ${analysisProgress}%`}></span>
			</div>
			<p>{analysisStage}</p>
		</div>
	{/if}

	{#if analysisError}
		<p class="error-message">{analysisError}</p>
	{/if}

	{#if previewUrls.length}
		<div class="preview-wrap">
			<div class="preview-head">
				<h3>Photo set</h3>
				<p>{previewUrls.length} selected</p>
			</div>
			<div class="preview-grid">
				{#each previewUrls as previewUrl, index}
					<div class="preview-card">
						<img src={previewUrl} alt={`Uploaded selfie preview ${index + 1}`} />
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.analyzer {
		margin-top: 1.25rem;
		padding: 1.2rem;
		background: #fff;
		border: 1px solid #efd8df;
		border-radius: 18px;
		box-shadow: 0 12px 26px rgba(102, 41, 66, 0.05);
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
	}

	.uploader-head {
		justify-content: center;
		text-align: center;
	}

	h2 {
		margin: 0;
		font-size: 1.3rem;
		color: #6e2e4d;
	}

	.drop-zone {
		margin-top: 1rem;
		border: 1.5px dashed #e8a8c1;
		background: linear-gradient(150deg, #fff8fb 0%, #fff3f7 100%);
		padding: 1.2rem;
		border-radius: 14px;
		cursor: pointer;
		text-align: center;
		transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
	}

	.drop-zone:hover,
	.drop-zone.dragging {
		transform: translateY(-2px);
		box-shadow: 0 12px 22px rgba(184, 85, 125, 0.12);
		border-color: #d7739e;
	}

	.drop-zone p {
		margin: 0;
		color: #7d3152;
	}

	.drop-zone small {
		display: block;
		margin-top: 0.3rem;
		color: #8a6878;
	}

	.drop-zone input[type='file'] {
		display: none;
	}

	.privacy-note {
		margin: 0.65rem 0 0;
		font-size: 0.87rem;
		color: #826876;
		text-align: center;
	}

	.model-status {
		margin: 0.9rem 0;
		font-weight: 600;
		color: #725260;
		text-align: center;
	}

	.upload-guidance {
		margin-top: 1rem;
		padding: 0.9rem 1rem;
		background: #fff5f9;
		border: 1px solid #efcddd;
		border-radius: 12px;
	}

	.upload-guidance p {
		margin: 0 0 0.4rem;
		font-weight: 700;
	}

	.upload-guidance ul {
		margin: 0;
		padding-left: 1.1rem;
	}

	.upload-guidance li {
		margin: 0.25rem 0;
		color: #5a5561;
	}

	.progress-wrap {
		margin-top: 1rem;
	}

	.progress-wrap p {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: #6d5965;
	}

	.progress-bar {
		width: 100%;
		height: 10px;
		border-radius: 999px;
		background: #f4d9e3;
		overflow: hidden;
	}

	.progress-bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, #f7a8b8 0%, #e77aa6 60%, #d46794 100%);
		transition: width 160ms ease-out;
	}

	.error-message {
		margin-top: 0.9rem;
		padding: 0.75rem 0.9rem;
		background: #fff2f4;
		border: 1px solid #efc8d5;
		color: #9f2f4f;
		border-radius: 10px;
		font-weight: 600;
	}

	.preview-wrap {
		margin-top: 1rem;
	}

	.preview-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.65rem;
	}

	.preview-head h3,
	.preview-head p {
		margin: 0;
		color: #6a2d48;
	}

	.preview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.7rem;
	}

	.preview-card {
		border-radius: 14px;
		overflow: hidden;
		border: 1px solid #ecd1da;
		background: #fff8fa;
	}

	.preview-card img {
		display: block;
		width: 100%;
		height: 180px;
		object-fit: cover;
	}

	@media (max-width: 720px) {
		.analyzer {
			border-radius: 14px;
			padding: 1rem;
		}
	}
</style>

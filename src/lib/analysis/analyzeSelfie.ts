import type { AnalysisProgress, AnalysisResult, FaceApiModule } from './types';
import { sampleFaceSkinTone } from './skinSampling';

type ProgressHandler = (update: AnalysisProgress) => void;
type DetectionInput = HTMLImageElement | HTMLCanvasElement;

const DETECTION_ATTEMPTS = [
	{
		options: { inputSize: 320, scoreThreshold: 0.5 },
		progress: 48,
		stage: 'Detecting face landmarks...'
	},
	{
		options: { inputSize: 512, scoreThreshold: 0.4 },
		progress: 58,
		stage: 'Trying a more detailed face scan...'
	},
	{
		options: { inputSize: 608, scoreThreshold: 0.35 },
		progress: 66,
		stage: 'Retrying with a closer face scan...'
	},
	{
		options: { inputSize: 704, scoreThreshold: 0.3 },
		progress: 74,
		stage: 'Trying a lower-threshold face scan...'
	}
] as const;

type AnalysisErrorCode = 'no_face_detected' | 'skin_sampling_failed' | 'analysis_failed';

export class AnalysisPipelineError extends Error {
	code: AnalysisErrorCode;
	debug?: Record<string, number | string>;

	constructor(code: AnalysisErrorCode, message: string, debug?: Record<string, number | string>) {
		super(message);
		this.name = 'AnalysisPipelineError';
		this.code = code;
		this.debug = debug;
	}
}

function clampChannel(value: number): number {
	return Math.max(0, Math.min(255, Math.round(value)));
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

function drawSourceToCanvas(imageElement: HTMLImageElement): HTMLCanvasElement {
	const imageWidth = imageElement.naturalWidth || imageElement.width;
	const imageHeight = imageElement.naturalHeight || imageElement.height;
	const canvas = createCanvas(imageWidth, imageHeight);
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new AnalysisPipelineError('analysis_failed', 'Could not read the uploaded image.');
	}

	ctx.drawImage(imageElement, 0, 0, imageWidth, imageHeight);
	return canvas;
}

function createEnhancedCanvas(
	sourceCanvas: HTMLCanvasElement,
	settings: { brightnessOffset: number; contrast: number }
): HTMLCanvasElement {
	const canvas = createCanvas(sourceCanvas.width, sourceCanvas.height);
	const ctx = canvas.getContext('2d');
	const sourceCtx = sourceCanvas.getContext('2d');

	if (!ctx || !sourceCtx) {
		throw new AnalysisPipelineError('analysis_failed', 'Could not prepare the uploaded image.');
	}

	const source = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
	const enhanced = ctx.createImageData(source.width, source.height);
	const { data } = source;
	const output = enhanced.data;

	for (let index = 0; index < data.length; index += 4) {
		output[index] = clampChannel((data[index] - 128) * settings.contrast + 128 + settings.brightnessOffset);
		output[index + 1] = clampChannel(
			(data[index + 1] - 128) * settings.contrast + 128 + settings.brightnessOffset
		);
		output[index + 2] = clampChannel(
			(data[index + 2] - 128) * settings.contrast + 128 + settings.brightnessOffset
		);
		output[index + 3] = data[index + 3];
	}

	ctx.putImageData(enhanced, 0, 0);
	return canvas;
}

function getDetectionVariants(imageElement: HTMLImageElement) {
	const sourceCanvas = drawSourceToCanvas(imageElement);
	return [
		{ label: 'original', image: imageElement as DetectionInput },
		{
			label: 'shadow_lift',
			image: createEnhancedCanvas(sourceCanvas, { brightnessOffset: 16, contrast: 1.04 }) as DetectionInput
		},
		{
			label: 'contrast_boost',
			image: createEnhancedCanvas(sourceCanvas, { brightnessOffset: 6, contrast: 1.16 }) as DetectionInput
		}
	] as const;
}

function getLargestFaceMatch<T extends { detection: { box: { width: number; height: number } } }>(
	matches: T[]
): T | null {
	if (!matches.length) return null;

	return matches.reduce((largest, current) => {
		const currentArea = current.detection.box.width * current.detection.box.height;
		const largestArea = largest.detection.box.width * largest.detection.box.height;
		return currentArea > largestArea ? current : largest;
	});
}

// Run the face detection pipeline and return a sampled RGB skin tone.
export async function analyzeSelfieImage(
	imageElement: HTMLImageElement,
	faceapi: FaceApiModule,
	onProgress?: ProgressHandler
): Promise<AnalysisResult> {
	await imageElement.decode();
	let result = null;
	let detectionVariant = 'original';
	let detectionAttempts = 0;
	let detectedFaceCount = 0;
	const variants = getDetectionVariants(imageElement);

	for (const [variantIndex, variant] of variants.entries()) {
		for (const attempt of DETECTION_ATTEMPTS) {
			detectionAttempts += 1;
			const variantSuffix =
				variantIndex === 0 ? '' : ` (${variant.label.replace('_', ' ')} retry)`;
			onProgress?.({ progress: attempt.progress, stage: `${attempt.stage}${variantSuffix}` });
			const matches = await faceapi
				.detectAllFaces(variant.image, new faceapi.TinyFaceDetectorOptions(attempt.options))
				.withFaceLandmarks();

			if (matches.length) {
				result = getLargestFaceMatch(matches);
				detectionVariant = variant.label;
				detectedFaceCount = matches.length;
				break;
			}
		}

		if (result) {
			break;
		}
	}

	if (!result) {
		throw new AnalysisPipelineError(
			'no_face_detected',
			'No face detected. Try a brighter, front-facing photo with your full face visible.',
			{
				detectionAttempts,
				variantCount: variants.length
			}
		);
	}

	const imageWidth = imageElement.naturalWidth || imageElement.width;
	const imageHeight = imageElement.naturalHeight || imageElement.height;
	const resized = faceapi.resizeResults(result, {
		width: imageWidth,
		height: imageHeight
	});

	const canvas = document.createElement('canvas');
	canvas.width = imageWidth;
	canvas.height = imageHeight;
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new AnalysisPipelineError('analysis_failed', 'Could not read the uploaded image.');
	}

	ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
	onProgress?.({ progress: 70, stage: 'Sampling skin tone...' });

	const rgb = sampleFaceSkinTone(ctx, resized.landmarks.positions, imageWidth, imageHeight);
	if (!rgb) {
		throw new AnalysisPipelineError(
			'skin_sampling_failed',
			'Could not sample skin tone clearly. Try even lighting and keep both cheeks visible.',
			{
				detectedFaceCount,
				detectionAttempts,
				detectionVariant
			}
		);
	}

	return {
		debug: {
			detectedFaceCount,
			detectionAttempts,
			detectionVariant
		},
		rgb
	};
}

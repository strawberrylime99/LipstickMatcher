import type { AnalysisProgress, AnalysisResult, FaceApiModule } from './types';
import { sampleFaceSkinTone } from './skinSampling';

type ProgressHandler = (update: AnalysisProgress) => void;

// Run the face detection pipeline and return a sampled RGB skin tone.
export async function analyzeSelfieImage(
	imageElement: HTMLImageElement,
	faceapi: FaceApiModule,
	onProgress?: ProgressHandler
): Promise<AnalysisResult> {
	await imageElement.decode();
	onProgress?.({ progress: 48, stage: 'Detecting face landmarks...' });

	const result = await faceapi
		.detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
		.withFaceLandmarks();

	if (!result) {
		throw new Error('No face detected. Try a bright, front-facing photo.');
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
		throw new Error('Could not read the uploaded image.');
	}

	ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
	onProgress?.({ progress: 70, stage: 'Sampling skin tone...' });

	const rgb = sampleFaceSkinTone(ctx, resized.landmarks.positions, imageWidth, imageHeight);
	if (!rgb) {
		throw new Error('Could not sample skin tone clearly. Try even lighting.');
	}

	return { rgb };
}

import type { FaceApiModule } from './types';

// Load the face-api models once so the page can analyze photos locally.
export async function loadFaceApiModels(): Promise<FaceApiModule> {
	const module = await import('face-api.js');

	await module.nets.tinyFaceDetector.loadFromUri('/models');
	await module.nets.faceLandmark68Net.loadFromUri('/models');

	return module;
}

export type Point = { x: number; y: number };

export type RgbSample = [number, number, number];

export type AnalysisProgress = {
	progress: number;
	stage: string;
};

export type AnalysisDebugDetails = {
	detectedFaceCount: number;
	detectionAttempts: number;
	detectionVariant: string;
};

export type AnalysisResult = {
	debug: AnalysisDebugDetails;
	rgb: RgbSample;
};

export type FaceApiModule = typeof import('face-api.js');

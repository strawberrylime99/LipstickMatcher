export type Point = { x: number; y: number };

export type RgbSample = [number, number, number];

export type AnalysisProgress = {
	progress: number;
	stage: string;
};

export type AnalysisResult = {
	rgb: RgbSample;
};

export type FaceApiModule = typeof import('face-api.js');

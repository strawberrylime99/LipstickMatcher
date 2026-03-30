import type { RgbSample } from './types';

function getChannelMedian(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
}

function getSampleDistance(a: RgbSample, b: RgbSample): number {
	return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function averageSamples(samples: RgbSample[]): RgbSample {
	return samples
		.reduce(
			(acc, current) => [acc[0] + current[0], acc[1] + current[1], acc[2] + current[2]],
			[0, 0, 0] as RgbSample
		)
		.map((value) => Math.round(value / samples.length)) as RgbSample;
}

export function aggregateRgbSamples(samples: RgbSample[]): RgbSample | null {
	if (!samples.length) return null;
	if (samples.length === 1) return samples[0];

	const medianSample: RgbSample = [
		getChannelMedian(samples.map((sample) => sample[0])),
		getChannelMedian(samples.map((sample) => sample[1])),
		getChannelMedian(samples.map((sample) => sample[2]))
	];

	const stableSamples = samples.filter((sample) => getSampleDistance(sample, medianSample) <= 24);
	const preferredSamples =
		stableSamples.length >= Math.ceil(samples.length / 2) ? stableSamples : samples;

	return averageSamples(preferredSamples);
}

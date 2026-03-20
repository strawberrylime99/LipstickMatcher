import type { Point, RgbSample } from './types';

function sampleMedianRgb(
	ctx: CanvasRenderingContext2D,
	center: Point,
	radius: number
): RgbSample | null {
	const { width, height } = ctx.canvas;
	const x0 = Math.max(0, Math.floor(center.x - radius));
	const y0 = Math.max(0, Math.floor(center.y - radius));
	const x1 = Math.min(width - 1, Math.ceil(center.x + radius));
	const y1 = Math.min(height - 1, Math.ceil(center.y + radius));

	if (x0 > x1 || y0 > y1) return null;

	const rs: number[] = [];
	const gs: number[] = [];
	const bs: number[] = [];

	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
			const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			if (luminance < 25 || luminance > 240) continue;

			rs.push(r);
			gs.push(g);
			bs.push(b);
		}
	}

	if (!rs.length) return null;

	rs.sort((a, b) => a - b);
	gs.sort((a, b) => a - b);
	bs.sort((a, b) => a - b);
	const mid = Math.floor(rs.length / 2);

	return [rs[mid], gs[mid], bs[mid]];
}

function collectSamples(ctx: CanvasRenderingContext2D, points: Point[], radius: number): RgbSample[] {
	return points
		.map((point) => sampleMedianRgb(ctx, point, radius))
		.filter((sample): sample is RgbSample => Boolean(sample));
}

function averageSamples(samples: RgbSample[]): RgbSample {
	return samples
		.reduce(
			(acc, current) => [acc[0] + current[0], acc[1] + current[1], acc[2] + current[2]],
			[0, 0, 0] as RgbSample
		)
		.map((value) => Math.round(value / samples.length)) as RgbSample;
}

function getChannelMedian(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
}

function getSampleDistance(a: RgbSample, b: RgbSample): number {
	return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function filterStableSamples(samples: RgbSample[], maxDistance = 26): RgbSample[] {
	if (samples.length <= 2) return samples;

	const medianSample: RgbSample = [
		getChannelMedian(samples.map((sample) => sample[0])),
		getChannelMedian(samples.map((sample) => sample[1])),
		getChannelMedian(samples.map((sample) => sample[2]))
	];
	const filtered = samples.filter((sample) => getSampleDistance(sample, medianSample) <= maxDistance);

	return filtered.length >= Math.max(2, Math.ceil(samples.length / 2)) ? filtered : samples;
}

// Sample cheek-first skin regions and only keep nose samples that agree with them.
export function sampleFaceSkinTone(
	ctx: CanvasRenderingContext2D,
	landmarks: Point[],
	imageWidth: number,
	imageHeight: number
): RgbSample | null {
	const leftEye = landmarks[36];
	const rightEye = landmarks[45];
	const nose = landmarks[30];
	const faceWidth = Math.abs(landmarks[14].x - landmarks[2].x);

	const leftCheekCenter = {
		x: leftEye.x * 0.68 + nose.x * 0.32,
		y: leftEye.y * 0.58 + nose.y * 0.42 + imageHeight * 0.018
	};
	const rightCheekCenter = {
		x: rightEye.x * 0.68 + nose.x * 0.32,
		y: rightEye.y * 0.58 + nose.y * 0.42 + imageHeight * 0.018
	};
	const noseCenter = {
		x: nose.x,
		y: nose.y + imageHeight * 0.01
	};

	const sampleRadius = Math.max(4, Math.round(imageWidth * 0.011));
	const cheekHorizontalOffset = Math.max(sampleRadius, Math.round(faceWidth * 0.04));
	const cheekVerticalOffset = Math.max(2, Math.round(imageHeight * 0.01));
	const noseHorizontalOffset = Math.max(2, Math.round(sampleRadius * 0.55));
	const noseVerticalOffset = Math.max(2, Math.round(sampleRadius * 0.45));

	const leftCheekPoints = [
		leftCheekCenter,
		{ x: leftCheekCenter.x - cheekHorizontalOffset, y: leftCheekCenter.y - cheekVerticalOffset },
		{
			x: leftCheekCenter.x - Math.round(cheekHorizontalOffset * 0.55),
			y: leftCheekCenter.y + Math.round(cheekVerticalOffset * 0.45)
		}
	];
	const rightCheekPoints = [
		rightCheekCenter,
		{ x: rightCheekCenter.x + cheekHorizontalOffset, y: rightCheekCenter.y - cheekVerticalOffset },
		{
			x: rightCheekCenter.x + Math.round(cheekHorizontalOffset * 0.55),
			y: rightCheekCenter.y + Math.round(cheekVerticalOffset * 0.45)
		}
	];
	const nosePoints = [
		noseCenter,
		{ x: noseCenter.x - noseHorizontalOffset, y: noseCenter.y + noseVerticalOffset },
		{ x: noseCenter.x + noseHorizontalOffset, y: noseCenter.y + noseVerticalOffset }
	];

	const cheekSamples = filterStableSamples([
		...collectSamples(ctx, leftCheekPoints, sampleRadius),
		...collectSamples(ctx, rightCheekPoints, sampleRadius)
	]);
	const noseSamples = filterStableSamples(
		collectSamples(ctx, nosePoints, Math.max(3, sampleRadius - 1)),
		18
	);
	const cheekAverage = cheekSamples.length ? averageSamples(cheekSamples) : null;
	const compatibleNoseSamples =
		cheekAverage === null
			? noseSamples
			: noseSamples.filter((sample) => getSampleDistance(sample, cheekAverage) <= 14);
	const samples = [...cheekSamples, ...compatibleNoseSamples];

	return samples.length ? averageSamples(samples) : null;
}

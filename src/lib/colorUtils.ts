import { shadeCatalog } from '$lib/catalog/shades';
import {
	TONE_SHADE_MAP,
	UNDERTONE_SHADE_MAP,
	type ShadeDepth,
	type ShadeUndertone
} from '$lib/recommendations/shadeRules';

export type Undertone = ShadeUndertone;

const DEPTH_ORDER: ShadeDepth[] = ['fair', 'light', 'medium', 'tan', 'deep'];

export function rgbToHex(r: number, g: number, b: number): string {
	return (
		'#' +
		[r, g, b]
			.map((x) => {
				const hex = x.toString(16);
				return hex.length === 1 ? `0${hex}` : hex;
			})
			.join('')
	);
}

export function hexToRgb(hex: string): [number, number, number] {
	const normalized = hex.replace('#', '');
	const safeHex = normalized.length === 8 ? normalized.slice(0, 6) : normalized;

	return [
		parseInt(safeHex.slice(0, 2), 16),
		parseInt(safeHex.slice(2, 4), 16),
		parseInt(safeHex.slice(4, 6), 16)
	];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}

		h /= 6;
	}

	return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function srgbToLinear(value: number): number {
	const normalized = value / 255;
	return normalized <= 0.04045
		? normalized / 12.92
		: Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
	const red = srgbToLinear(r);
	const green = srgbToLinear(g);
	const blue = srgbToLinear(b);

	const x = red * 0.4124 + green * 0.3576 + blue * 0.1805;
	const y = red * 0.2126 + green * 0.7152 + blue * 0.0722;
	const z = red * 0.0193 + green * 0.1192 + blue * 0.9505;

	const pivot = (value: number) =>
		value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;

	const fx = pivot(x / 0.95047);
	const fy = pivot(y / 1);
	const fz = pivot(z / 1.08883);

	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function getDepthNameFromRGB(r: number, g: number, b: number): ShadeDepth {
	const [labLightness] = rgbToLab(r, g, b);
	const [, , hslLightness] = rgbToHsl(r, g, b);
	const brightness = ((0.299 * r + 0.587 * g + 0.114 * b) / 255) * 100;
	const depthScore = labLightness * 0.55 + hslLightness * 0.25 + brightness * 0.2;

	if (depthScore >= 76) return 'fair';
	if (depthScore >= 61) return 'light';
	if (depthScore >= 47) return 'medium';
	if (depthScore >= 33) return 'tan';
	return 'deep';
}

function getDepthIndexFromRGB(r: number, g: number, b: number): number {
	return DEPTH_ORDER.indexOf(getDepthNameFromRGB(r, g, b));
}

function getToneVariantNumber(undertone: Undertone): 1 | 2 | 3 {
	if (undertone === 'cool') return 1;
	if (undertone === 'neutral') return 2;
	return 3;
}

function getHueDistance(a: number, b: number): number {
	const diff = Math.abs(a - b);
	return Math.min(diff, 360 - diff);
}

function getUndertoneAffinityScore(
	userUndertone: Undertone,
	shadeUndertones: ShadeUndertone[]
): number {
	if (shadeUndertones.includes(userUndertone)) return 22;
	if (shadeUndertones.includes('neutral')) return 10;
	return -8;
}

function getDepthAffinityScore(userDepthIndex: number, shadeDepths: ShadeDepth[]): number {
	if (!shadeDepths.length) return 8;

	const bestDistance = Math.min(
		...shadeDepths.map((depth) => Math.abs(userDepthIndex - DEPTH_ORDER.indexOf(depth)))
	);

	if (bestDistance === 0) return 24;
	if (bestDistance === 1) return 15;
	if (bestDistance === 2) return 5;
	return -10;
}

function getHueHarmonyScore(
	userHue: number,
	userUndertone: Undertone,
	shadeHex: string,
	userDepthIndex: number
): number {
	const [shadeR, shadeG, shadeB] = hexToRgb(shadeHex);
	const [shadeHue, shadeSaturation, shadeLightness] = rgbToHsl(shadeR, shadeG, shadeB);
	const hueDistance = getHueDistance(userHue, shadeHue);

	let score = 18 - Math.min(hueDistance / 8, 18);

	if (userUndertone === 'warm' && shadeHue >= 5 && shadeHue <= 55) score += 8;
	if (
		userUndertone === 'cool' &&
		((shadeHue >= 300 && shadeHue <= 355) || (shadeHue >= 200 && shadeHue <= 280))
	) {
		score += 8;
	}
	if (userUndertone === 'neutral' && shadeSaturation <= 62) score += 6;

	if (userDepthIndex >= 3 && shadeLightness <= 42) score += 5;
	if (userDepthIndex <= 1 && shadeLightness >= 45) score += 5;

	return score;
}

export function getUndertone(r: number, g: number, b: number): Undertone {
	const [h, s, l] = rgbToHsl(r, g, b);
	const warmth = (r - b) / 255;
	const redness = (r - g) / 255;
	const goldness = (g - b) / 255;

	if (s < 16 || Math.abs(warmth) < 0.045) {
		return 'neutral';
	}

	if (l > 84 && warmth < 0.015) {
		return redness > 0.03 ? 'cool' : 'neutral';
	}

	if ((h >= 10 && h <= 55 && warmth > 0.03) || (goldness > 0.02 && warmth > 0.045)) {
		return 'warm';
	}

	if ((h >= 185 && h <= 320) || warmth < -0.055 || redness < 0.01) {
		return 'cool';
	}

	return 'neutral';
}

export function getToneNameFromRGB(r: number, g: number, b: number): string {
	const depth = getDepthNameFromRGB(r, g, b);
	const undertone = getUndertone(r, g, b);
	const toneNumber = getToneVariantNumber(undertone);
	return `${depth.charAt(0).toUpperCase()}${depth.slice(1)} ${toneNumber}`;
}

export function matchLipstickShadeByTone(r: number, g: number, b: number): string[] {
	const depth = getDepthNameFromRGB(r, g, b);
	const undertone = getUndertone(r, g, b);
	return TONE_SHADE_MAP[`${depth} ${undertone}`] ?? ['clear gloss', 'rosebud', 'warm nude'];
}

export function matchLipstickByUndertone(r: number, g: number, b: number): string[] {
	return UNDERTONE_SHADE_MAP[getUndertone(r, g, b)];
}

export function getBestMatchedShades(r: number, g: number, b: number): string[] {
	const [h] = rgbToHsl(r, g, b);
	const undertone = getUndertone(r, g, b);
	const depthIndex = getDepthIndexFromRGB(r, g, b);
	const preferredToneShades = matchLipstickShadeByTone(r, g, b);
	const preferredUndertoneShades = matchLipstickByUndertone(r, g, b);

	return [...shadeCatalog]
		.map((shade) => {
			let score = 0;
			score += getDepthAffinityScore(depthIndex, shade.depthAffinities);
			score += getUndertoneAffinityScore(undertone, shade.undertoneAffinities);
			score += getHueHarmonyScore(h, undertone, shade.hex, depthIndex);
			const toneIndex = preferredToneShades.indexOf(shade.name);
			const undertoneIndex = preferredUndertoneShades.indexOf(shade.name);
			if (toneIndex !== -1) score += 26 - toneIndex * 3;
			if (undertoneIndex !== -1) score += 10 - undertoneIndex * 2;
			return { name: shade.name, score };
		})
		.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
		.slice(0, 3)
		.map((shade) => shade.name);
}

const shadeDescriptions: Record<string, string> = {
	'ice pink': 'A frosty touch that highlights cool undertones in fair skin.',
	'frosty rose': 'Delicate and icy, perfect for a fair cool tone.',
	'cloudberry': 'Soft and dreamy for those with light, cool elegance.',
	'rosebud': 'A versatile pink that flatters cool tones across the spectrum.',
	'shell pink': 'Subtle and sweet for fair neutral skin.',
	'clear gloss': 'A universal finish that suits every undertone.',
	'cool nude': 'Balanced and understated, perfect for neutral complexions.',
	'warm peach': 'Glows beautifully against warm undertones.',
	'soft bronze': 'Adds sun-kissed warmth to fair or light warm skin.',
	'sunset coral': 'Brightens up warm skin with a peachy pop.',
	'terracotta': 'Rich and earthy, complements warm or olive undertones.',
	'plum': 'Deep and striking for cool or medium tones.',
	'wine': 'A classic choice that enhances medium cool elegance.',
	'burnt sienna': 'Adds depth and warmth to medium skin.',
	'rich spice': 'Vibrant and bold, perfect for warm medium tones.',
	'cherrywood': 'Deep red with warm depth, great for autumn tones.',
	'moody plum': 'Dark and dramatic, stands out on deep cool complexions.',
	'oxblood': 'Bold and chic for cool, deep tones.',
	'caramel blush': 'Sweet and warm, ideal for golden undertones.',
	'universal red': 'Timeless and flattering on all tones.',
	'fig': 'Earthy and rich, pairs well with deep neutral skin.',
	'dark nude': 'Neutral with a hint of depth, ideal for understated looks.'
};

export function getShadeDescriptions(shades: string[]): string[] {
	return shades.map(
		(shade) => shadeDescriptions[shade] || 'A flattering choice for your skin tone.'
	);
}

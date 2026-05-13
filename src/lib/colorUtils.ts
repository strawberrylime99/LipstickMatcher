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
	const [, aAxis, bAxis] = rgbToLab(r, g, b);
	const warmth = (r - b) / 255;
	const redness = (r - g) / 255;
	const chroma = Math.hypot(aAxis, bAxis);
	const undertoneBalance = bAxis - aAxis * 0.45;

	if (s < 16 || chroma < 12 || Math.abs(undertoneBalance) < 3.5) {
		return 'neutral';
	}

	if (l > 84 && undertoneBalance < 4) {
		return redness > 0.03 ? 'cool' : 'neutral';
	}

	if (
		undertoneBalance >= 8 ||
		((h >= 8 && h <= 50) && warmth > 0.025 && bAxis > 12)
	) {
		return 'warm';
	}

	if (
		undertoneBalance <= 1.5 ||
		((h >= 185 && h <= 320) && aAxis > 8) ||
		(redness < 0.008 && bAxis < 12)
	) {
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

function getShadeFamilyLabel(name: string, hex: string): string {
	const normalized = name.toLowerCase();

	if (normalized.includes('gloss')) return 'glossy';
	if (normalized.includes('nude')) return 'nude';
	if (normalized.includes('rose') || normalized.includes('pink')) return 'rosy';
	if (normalized.includes('berry') || normalized.includes('plum') || normalized.includes('fig'))
		return 'berry-toned';
	if (normalized.includes('peach') || normalized.includes('coral')) return 'peachy';
	if (
		normalized.includes('rust') ||
		normalized.includes('terracotta') ||
		normalized.includes('sienna') ||
		normalized.includes('spice')
	) {
		return 'warm earthy';
	}
	if (
		normalized.includes('wine') ||
		normalized.includes('oxblood') ||
		normalized.includes('cherry') ||
		normalized.includes('red')
	) {
		return 'rich red';
	}
	if (
		normalized.includes('bronze') ||
		normalized.includes('caramel') ||
		normalized.includes('mocha') ||
		normalized.includes('espresso') ||
		normalized.includes('chocolate')
	) {
		return 'soft brown';
	}

	const [hue] = rgbToHsl(...hexToRgb(hex));
	if (hue >= 10 && hue <= 45) return 'warm earthy';
	if (hue >= 46 && hue <= 80) return 'peachy';
	if (hue >= 300 || hue <= 8) return 'rich red';
	if (hue >= 260 && hue < 300) return 'berry-toned';
	return 'rosy';
}

function getMatchReasonForShade(
	userDepth: ShadeDepth,
	userUndertone: Undertone,
	shadeName: string,
	position: number
): string {
	const shade = shadeCatalog.find((entry) => entry.name === shadeName);
	if (!shade) return 'This one just works. Easy tone, easy depth, easy wear.';

	const exactDepth = shade.depthAffinities.includes(userDepth);
	const nearDepth = shade.depthAffinities.some(
		(depth) => Math.abs(DEPTH_ORDER.indexOf(depth) - DEPTH_ORDER.indexOf(userDepth)) <= 1
	);
	const exactUndertone = shade.undertoneAffinities.includes(userUndertone);
	const neutralFriendly = shade.undertoneAffinities.includes('neutral');
	const family = getShadeFamilyLabel(shade.name, shade.hex);

	const undertoneLine = exactUndertone
		? `it plays really well with your ${userUndertone} undertone`
		: neutralFriendly
			? 'it stays nicely balanced on the undertone side'
			: 'the undertone still lands in a flattering spot';

	const depthLine = exactDepth
		? 'and the depth feels right for your coloring'
		: nearDepth
			? 'and it stays close to your natural depth so it will not feel harsh'
			: 'and it gives a little extra contrast without looking off';

	if (position === 0) {
		return `Your best bet if you want the safest win. The ${family} tone works because ${undertoneLine} ${depthLine}.`;
	}

	if (position === 1) {
		return `A super easy second option. It leans ${family}, so you still get a great match while switching up the vibe a bit.`;
	}

	return `Good pick if you want a little more range. It still fits because ${undertoneLine} ${depthLine}.`;
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

export function getShadeMatchReasons(r: number, g: number, b: number, shades: string[]): string[] {
	const userDepth = getDepthNameFromRGB(r, g, b);
	const userUndertone = getUndertone(r, g, b);

	return shades.map((shade, index) => getMatchReasonForShade(userDepth, userUndertone, shade, index));
}

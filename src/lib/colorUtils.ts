export function rgbToHex(r: number, g: number, b: number): string {
	return (
		'#' +
		[r, g, b]
			.map((x) => {
				const hex = x.toString(16);
				return hex.length === 1 ? '0' + hex : hex;
			})
			.join('')
	);
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0, s = 0, l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function matchLipstickShade(hex: string): string[] {
	const shades: Record<string, string[]> = {
		light: ['soft pink', 'coral', 'peach'],
		medium: ['rosewood', 'terracotta', 'plum'],
		dark: ['berry', 'wine', 'deep red'],
	};

	// Dummy skin tone matching — customize later
	if (!hex) return [];

	const hexLower = hex.toLowerCase();

	if (hexLower <= '#a88a7f') return shades.light;
	if (hexLower <= '#c39b7d') return shades.medium;
	return shades.dark;
}

const toneNameMap: Record<number, string> = {
	1: 'fair cool',
	2: 'fair neutral',
	3: 'fair warm',
	4: 'light cool',
	5: 'light neutral',
	6: 'light warm',
	7: 'medium cool',
	8: 'medium neutral',
	9: 'medium warm',
	10: 'tan cool',
	11: 'tan neutral',
	12: 'tan warm',
	13: 'tan warm',
	14: 'deep cool',
	15: 'deep neutral',
	16: 'deep warm',
	17: 'deep warm',
	18: 'deep neutral',
	19: 'deep cool',
	20: 'deep cool'
};



export function matchLipstickShadeByTone(r: number, g: number, b: number): string[] {
	const [, , l] = rgbToHsl(r, g, b);
	const toneIndex = Math.floor((l / 100) * 20);
	const toneName = toneNameMap[toneIndex + 1];

	const toneMap: Record<string, string[]> = {
		'fair cool': ['ice pink', 'frosty rose', 'cloudberry', 'rosebud'],
		'fair neutral': ['shell pink', 'clear gloss', 'cool nude'],
		'fair warm': ['warm peach', 'soft bronze', 'sunset coral'],
		'light cool': ['pink beige', 'terracotta', 'cool nude'],
		'light neutral': ['warm nude', 'rich coral', 'mocha'],
		'light warm': ['berry blush', 'rust', 'deep rose'],
		'medium cool': ['plum', 'wine', 'burnt sienna'],
		'medium neutral': ['brick red', 'dark nude', 'currant'],
		'medium warm': ['rich spice', 'cherrywood', 'bold berry'],
		'tan cool': ['garnet', 'merlot', 'vamp red'],
		'tan neutral': ['aubergine', 'black cherry', 'sable'],
		'tan warm': ['espresso', 'dark chocolate', 'mahogany'],
		'deep cool': ['oxblood', 'moody plum', 'cool burgundy'],
		'deep neutral': ['deep wine', 'cool nude', 'fig']
	};

	return toneMap[toneName] ?? ['clear gloss', 'rosebud', 'warm nude'];
}


export function matchLipstickByUndertone(r: number, g: number, b: number): string[] {
	const undertone = getUndertone(r, g, b);
	console.log('Detected undertone:', undertone);

	const shadeMap = {
		cool: ['plum', 'rosebud', 'moody plum'],
		warm: ['terracotta', 'sunset coral', 'caramel blush'],
		neutral: ['soft bronze', 'pink beige', 'clear gloss']
	};

	return shadeMap[undertone];
}

export function getBestMatchedShades(r: number, g: number, b: number): string[] {
	const toneShades = matchLipstickShadeByTone(r, g, b);
	const undertoneShades = matchLipstickByUndertone(r, g, b);

	// Combine and ensure uniqueness
	const combined = [...new Set([...toneShades, ...undertoneShades])];

	// Always return exactly 3 shades
	if (combined.length >= 3) {
		return combined.slice(0, 3);
	} else {
		// Pad with fallback universal shades if needed
		const fallback = ['clear gloss', 'universal red', 'rosebud'];
		const padded = [...combined];
		for (const f of fallback) {
			if (!padded.includes(f)) padded.push(f);
			if (padded.length === 3) break;
		}
		return padded;
	}
}

const shadeDescriptions: Record<string, string> = {
  'ice pink': 'A frosty touch that highlights cool undertones in fair skin.',
  'frosty rose': 'Delicate and icy—perfect for a fair cool tone.',
  'cloudberry': 'Soft and dreamy for those with light, cool elegance.',
  'rosebud': 'A versatile pink that flatters cool tones across the spectrum.',
  'shell pink': 'Subtle and sweet for fair neutral skin.',
  'clear gloss': 'A universal finish that suits every undertone.',
  'cool nude': 'Balanced and understated, perfect for neutral complexions.',
  'warm peach': 'Glows beautifully against warm undertones.',
  'soft bronze': 'Adds sun-kissed warmth to fair or light warm skin.',
  'sunset coral': 'Brightens up warm skin with a peachy pop.',
  'terracotta': 'Rich and earthy—complements warm or olive undertones.',
  'plum': 'Deep and striking for cool or medium tones.',
  'wine': 'A classic choice that enhances medium cool elegance.',
  'burnt sienna': 'Adds depth and warmth to medium skin.',
  'rich spice': 'Vibrant and bold, perfect for warm medium tones.',
  'cherrywood': 'Deep red with warm depth—great for autumn tones.',
  'moody plum': 'Dark and dramatic—stands out on deep cool complexions.',
  'oxblood': 'Bold and chic for cool, deep tones.',
  'caramel blush': 'Sweet and warm, ideal for golden undertones.',
  'universal red': 'Timeless and flattering on all tones.',
  'fig': 'Earthy and rich—pairs well with deep neutral skin.',
  'dark nude': 'Neutral with a hint of depth, ideal for understated looks.',
};

export function getShadeDescriptions(shades: string[]): string[] {
  return shades.map((shade) => shadeDescriptions[shade] || 'A flattering choice for your skin tone.');
}


export function getToneNameFromRGB(r: number, g: number, b: number): string {
	const [, , l] = rgbToHsl(r, g, b);

	// Invert the lightness scale so lower `l` means deeper tone
	const invertedL = 100 - l;
	const toneIndex = Math.floor((invertedL / 100) * 20);

	return toneNameMap[toneIndex + 1] ?? `Tone ${toneIndex + 1}`;
}


export function getUndertone(r: number, g: number, b: number): 'cool' | 'warm' | 'neutral' {
	const [h, s, l] = rgbToHsl(r, g, b);

	if (s < 20) {
		return 'neutral';
	}

	// Special case for very fair skin with subtle pink/blue
	if (l > 85 && (h < 25 || h > 330)) {
		return 'cool';
	}
	if (l > 85 && r - b < 20 && r - g < 20) {
	return 'cool';
}


	// Hue-based classification
	if ((h >= 0 && h <= 50) || (h >= 330 && h <= 360)) {
		return 'warm';
	}

	if (h >= 180 && h <= 300) {
		return 'cool';
	}

	return 'neutral';
}

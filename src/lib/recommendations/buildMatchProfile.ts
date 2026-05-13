import {
	getBestMatchedShades,
	getShadeMatchReasons,
	getToneNameFromRGB,
	getUndertone,
	rgbToHex,
	type Undertone
} from '$lib/colorUtils';
import type { RgbSample } from '$lib/analysis/types';

export type MatchProfile = {
	sampledHex: string;
	detectedTone: string;
	detectedUndertone: Undertone;
	suggestedShades: string[];
	shadeReasons: string[];
};

// Turn a sampled RGB value into the profile data used by the UI.
export function buildMatchProfile([r, g, b]: RgbSample): MatchProfile {
	const suggestedShades = getBestMatchedShades(r, g, b).slice(0, 3);

	return {
		sampledHex: rgbToHex(r, g, b),
		detectedTone: getToneNameFromRGB(r, g, b),
		detectedUndertone: getUndertone(r, g, b),
		suggestedShades,
		shadeReasons: getShadeMatchReasons(r, g, b, suggestedShades)
	};
}

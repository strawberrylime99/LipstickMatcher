import { describe, expect, it } from 'vitest';
import {
	getBestMatchedShades,
	getToneNameFromRGB,
	getUndertone,
	rgbToHex,
	rgbToHsl
} from './colorUtils';

describe('colorUtils', () => {
	it('converts RGB values to hex', () => {
		expect(rgbToHex(186, 140, 134)).toBe('#ba8c86');
	});

	it('converts RGB values to HSL', () => {
		expect(rgbToHsl(255, 0, 0)).toEqual([0, 100, 50]);
	});

	it('maps brighter skin samples into a light tone bucket', () => {
		expect(getToneNameFromRGB(186, 140, 134)).toBe('Light 3');
	});

	it('detects neutral undertones for low-saturation samples', () => {
		expect(getUndertone(198, 183, 180)).toBe('neutral');
	});

	it('returns a stable list of three recommended shades', () => {
		expect(getBestMatchedShades(186, 140, 134)).toHaveLength(3);
		expect(getBestMatchedShades(186, 140, 134)).toEqual(['rust', 'deep rose', 'berry blush']);
	});
});

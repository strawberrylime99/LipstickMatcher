import { describe, expect, it } from 'vitest';
import { buildMatchProfile } from './buildMatchProfile';

describe('buildMatchProfile', () => {
	it('builds the UI profile from a sampled RGB value', () => {
		expect(buildMatchProfile([186, 140, 134])).toEqual({
			sampledHex: '#ba8c86',
			detectedTone: 'Light 3',
			detectedUndertone: 'warm',
			suggestedShades: ['rust', 'deep rose', 'berry blush']
		});
	});
});

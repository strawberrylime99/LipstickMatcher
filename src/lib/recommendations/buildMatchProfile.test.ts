import { describe, expect, it } from 'vitest';
import { buildMatchProfile } from './buildMatchProfile';

describe('buildMatchProfile', () => {
	it('builds the UI profile from a sampled RGB value', () => {
		expect(buildMatchProfile([186, 140, 134])).toEqual({
			sampledHex: '#ba8c86',
			detectedTone: 'Light 2',
			detectedUndertone: 'neutral',
			suggestedShades: ['warm nude', 'deep rose', 'rich coral'],
			shadeReasons: [
				'Your best bet if you want the safest win. The nude tone works because it plays really well with your neutral undertone and the depth feels right for your coloring.',
				'A super easy second option. It leans rosy, so you still get a great match while switching up the vibe a bit.',
				'Good pick if you want a little more range. It still fits because it plays really well with your neutral undertone and the depth feels right for your coloring.'
			]
		});
	});
});

export type ShadeDepth = 'fair' | 'light' | 'medium' | 'tan' | 'deep';
export type ShadeUndertone = 'cool' | 'warm' | 'neutral';

export const TONE_SHADE_MAP: Record<`${ShadeDepth} ${ShadeUndertone}`, string[]> = {
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
	'deep neutral': ['deep wine', 'cool nude', 'fig'],
	'deep warm': ['mahogany', 'espresso', 'oxblood']
};

export const UNDERTONE_SHADE_MAP: Record<ShadeUndertone, string[]> = {
	cool: ['plum', 'rosebud', 'moody plum'],
	warm: ['terracotta', 'sunset coral', 'caramel blush'],
	neutral: ['soft bronze', 'pink beige', 'clear gloss']
};

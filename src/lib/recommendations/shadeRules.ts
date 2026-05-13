export type ShadeDepth = 'fair' | 'light' | 'medium' | 'tan' | 'deep';
export type ShadeUndertone = 'cool' | 'warm' | 'neutral';

export const TONE_SHADE_MAP: Record<`${ShadeDepth} ${ShadeUndertone}`, string[]> = {
	'fair cool': ['ice pink', 'frosty rose', 'rosebud', 'cool nude'],
	'fair neutral': ['shell pink', 'clear gloss', 'pink beige'],
	'fair warm': ['warm peach', 'soft bronze', 'caramel blush'],
	'light cool': ['pink beige', 'rosebud', 'cool nude'],
	'light neutral': ['warm nude', 'rich coral', 'deep rose'],
	'light warm': ['warm nude', 'soft bronze', 'terracotta'],
	'medium cool': ['plum', 'currant', 'wine'],
	'medium neutral': ['brick red', 'dark nude', 'fig'],
	'medium warm': ['terracotta', 'rich spice', 'cherrywood'],
	'tan cool': ['garnet', 'merlot', 'vamp red'],
	'tan neutral': ['fig', 'aubergine', 'sable'],
	'tan warm': ['rich spice', 'espresso', 'mahogany'],
	'deep cool': ['oxblood', 'moody plum', 'cool burgundy'],
	'deep neutral': ['fig', 'deep wine', 'sable'],
	'deep warm': ['mahogany', 'espresso', 'oxblood']
};

export const UNDERTONE_SHADE_MAP: Record<ShadeUndertone, string[]> = {
	cool: ['plum', 'rosebud', 'moody plum'],
	warm: ['warm nude', 'terracotta', 'caramel blush'],
	neutral: ['pink beige', 'fig', 'clear gloss']
};

import { shadeColors } from '$lib/shadeColors';
import {
	TONE_SHADE_MAP,
	UNDERTONE_SHADE_MAP,
	type ShadeDepth,
	type ShadeUndertone
} from '$lib/recommendations/shadeRules';

export type ShadeCatalogEntry = {
	name: string;
	hex: string;
	productUrl: string;
	depthAffinities: ShadeDepth[];
	undertoneAffinities: ShadeUndertone[];
};

function getDepthAffinities(name: string): ShadeDepth[] {
	const depths = new Set<ShadeDepth>();

	for (const [toneKey, shades] of Object.entries(TONE_SHADE_MAP)) {
		if (!shades.includes(name)) continue;
		depths.add(toneKey.split(' ')[0] as ShadeDepth);
	}

	return [...depths];
}

function getUndertoneAffinities(name: string): ShadeUndertone[] {
	const undertones = new Set<ShadeUndertone>();

	for (const [toneKey, shades] of Object.entries(TONE_SHADE_MAP)) {
		if (!shades.includes(name)) continue;
		undertones.add(toneKey.split(' ')[1] as ShadeUndertone);
	}

	for (const [undertone, shades] of Object.entries(UNDERTONE_SHADE_MAP) as [
		ShadeUndertone,
		string[]
	][]) {
		if (shades.includes(name)) {
			undertones.add(undertone);
		}
	}

	return undertones.size ? [...undertones] : ['neutral'];
}

export const shadeCatalog: ShadeCatalogEntry[] = Object.entries(shadeColors)
	.map(([name, details]) => ({
		name,
		hex: details.hex,
		productUrl: details.link,
		depthAffinities: getDepthAffinities(name),
		undertoneAffinities: getUndertoneAffinities(name)
	}))
	.sort((a, b) => a.name.localeCompare(b.name));

export function getShadeCatalogMap(entries: ShadeCatalogEntry[] = shadeCatalog): Record<string, ShadeCatalogEntry> {
	return Object.fromEntries(entries.map((entry) => [entry.name, entry]));
}

import { json } from '@sveltejs/kit';
import type { ShadeDepth, ShadeUndertone } from '$lib/recommendations/shadeRules';
import { TONE_SHADE_MAP, UNDERTONE_SHADE_MAP } from '$lib/recommendations/shadeRules';
import { listShadeCatalog } from '$lib/server/shadeCatalogRepository';

const validDepths = [...new Set(Object.keys(TONE_SHADE_MAP).map((key) => key.split(' ')[0]))] as ShadeDepth[];
const validUndertones = Object.keys(UNDERTONE_SHADE_MAP) as ShadeUndertone[];

function parseDepth(value: string | null): ShadeDepth | null {
	if (!value) return null;
	return validDepths.includes(value as ShadeDepth) ? (value as ShadeDepth) : null;
}

function parseUndertone(value: string | null): ShadeUndertone | null {
	if (!value) return null;
	return validUndertones.includes(value as ShadeUndertone) ? (value as ShadeUndertone) : null;
}

export async function GET({ url }) {
	const rawDepth = url.searchParams.get('depth');
	const rawUndertone = url.searchParams.get('undertone');
	const depth = parseDepth(rawDepth);
	const undertone = parseUndertone(rawUndertone);

	if (rawDepth && !depth) {
		return json(
			{ error: 'Invalid depth filter.' },
			{ status: 400 }
		);
	}

	if (rawUndertone && !undertone) {
		return json(
			{ error: 'Invalid undertone filter.' },
			{ status: 400 }
		);
	}

	return json({
		shades: await listShadeCatalog({ depth, undertone })
	});
}

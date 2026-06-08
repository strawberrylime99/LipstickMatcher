import {
	getShadeCatalogMap,
	shadeCatalog,
	type ShadeCatalogEntry
} from '$lib/catalog/shades';
import type { ShadeDepth, ShadeUndertone } from '$lib/recommendations/shadeRules';

type ShadeCatalogFilters = {
	depth?: ShadeDepth | null;
	undertone?: ShadeUndertone | null;
};

function filterLocalCatalog(filters: ShadeCatalogFilters = {}) {
	return shadeCatalog.filter((entry) => {
		const matchesDepth = filters.depth ? entry.depthAffinities.includes(filters.depth) : true;
		const matchesUndertone = filters.undertone
			? entry.undertoneAffinities.includes(filters.undertone)
			: true;

		return matchesDepth && matchesUndertone;
	});
}

export async function listShadeCatalog(filters: ShadeCatalogFilters = {}) {
	// Temporarily force the app to use the in-repo shade catalog so
	// affiliate links always come from the checked-in source of truth.
	return filterLocalCatalog(filters);
}

export async function getShadeCatalogByName() {
	return getShadeCatalogMap(await listShadeCatalog());
}

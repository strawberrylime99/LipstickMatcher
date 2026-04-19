import {
	getShadeCatalogMap,
	shadeCatalog,
	type ShadeCatalogEntry
} from '$lib/catalog/shades';
import type { ShadeDepth, ShadeUndertone } from '$lib/recommendations/shadeRules';
import { isDatabaseConfigured, queryRows } from '$lib/server/database';

type ShadeCatalogFilters = {
	depth?: ShadeDepth | null;
	undertone?: ShadeUndertone | null;
};

type ShadeCatalogRow = {
	name: string;
	hex: string;
	product_url: string;
	depth_affinities: string[];
	undertone_affinities: string[];
};

function normalizeEntry(row: ShadeCatalogRow): ShadeCatalogEntry {
	return {
		name: row.name,
		hex: row.hex,
		productUrl: row.product_url,
		depthAffinities: row.depth_affinities as ShadeDepth[],
		undertoneAffinities: row.undertone_affinities as ShadeUndertone[]
	};
}

function filterLocalCatalog(filters: ShadeCatalogFilters = {}) {
	return shadeCatalog.filter((entry) => {
		const matchesDepth = filters.depth ? entry.depthAffinities.includes(filters.depth) : true;
		const matchesUndertone = filters.undertone
			? entry.undertoneAffinities.includes(filters.undertone)
			: true;

		return matchesDepth && matchesUndertone;
	});
}

async function listDatabaseShades(filters: ShadeCatalogFilters = {}): Promise<ShadeCatalogEntry[]> {
	const clauses: string[] = [];
	const params: string[] = [];

	if (filters.depth) {
		params.push(filters.depth);
		clauses.push(`$${params.length} = any(depth_affinities)`);
	}

	if (filters.undertone) {
		params.push(filters.undertone);
		clauses.push(`$${params.length} = any(undertone_affinities)`);
	}

	const whereClause = clauses.length ? `where ${clauses.join(' and ')}` : '';
	const rows = await queryRows<ShadeCatalogRow>(
		`
			select name, hex, product_url, depth_affinities, undertone_affinities
			from public.shades
			${whereClause}
			order by name asc
		`,
		params
	);

	return rows.map(normalizeEntry);
}

export async function listShadeCatalog(filters: ShadeCatalogFilters = {}) {
	if (!isDatabaseConfigured()) {
		return filterLocalCatalog(filters);
	}

	try {
		return await listDatabaseShades(filters);
	} catch (error) {
		console.error('Falling back to local shade catalog.', error);
		return filterLocalCatalog(filters);
	}
}

export async function getShadeCatalogByName() {
	return getShadeCatalogMap(await listShadeCatalog());
}

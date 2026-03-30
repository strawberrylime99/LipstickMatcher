import { getShadeCatalogMap, shadeCatalog } from '$lib/catalog/shades';

export async function listShadeCatalog() {
	return shadeCatalog;
}

export async function getShadeCatalogByName() {
	return getShadeCatalogMap();
}

import type { PageServerLoad } from './$types';
import { getShadeCatalogByName } from '$lib/server/shadeCatalogRepository';

export const load: PageServerLoad = async () => {
	return {
		shadeCatalog: await getShadeCatalogByName()
	};
};

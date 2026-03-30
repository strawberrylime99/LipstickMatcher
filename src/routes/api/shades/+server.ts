import { json } from '@sveltejs/kit';
import { listShadeCatalog } from '$lib/server/shadeCatalogRepository';

export async function GET() {
	return json({
		shades: await listShadeCatalog()
	});
}

import { describe, expect, it } from 'vitest';
import { listShadeCatalog } from './shadeCatalogRepository';

describe('shadeCatalogRepository', () => {
	it('returns normalized shade catalog entries', async () => {
		const shades = await listShadeCatalog();

		expect(shades.length).toBeGreaterThan(10);
		expect(shades[0]).toHaveProperty('name');
		expect(shades[0]).toHaveProperty('depthAffinities');
		expect(shades[0]).toHaveProperty('undertoneAffinities');
	});
});

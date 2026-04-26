import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listShadeCatalog } from './shadeCatalogRepository';

const databaseMock = vi.hoisted(() => ({
	isDatabaseConfigured: vi.fn(),
	queryRows: vi.fn()
}));

vi.mock('$lib/server/database', () => databaseMock);

describe('shadeCatalogRepository', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns normalized shade catalog entries', async () => {
		databaseMock.isDatabaseConfigured.mockReturnValue(false);

		const shades = await listShadeCatalog();

		expect(shades.length).toBeGreaterThan(10);
		expect(shades[0]).toHaveProperty('name');
		expect(shades[0]).toHaveProperty('depthAffinities');
		expect(shades[0]).toHaveProperty('undertoneAffinities');
	});

	it('filters local catalog entries by depth and undertone', async () => {
		databaseMock.isDatabaseConfigured.mockReturnValue(false);

		const shades = await listShadeCatalog({ depth: 'fair', undertone: 'cool' });

		expect(shades.length).toBeGreaterThan(0);
		expect(shades.every((shade) => shade.depthAffinities.includes('fair'))).toBe(true);
		expect(shades.every((shade) => shade.undertoneAffinities.includes('cool'))).toBe(true);
	});

	it('returns database rows when the database is configured', async () => {
		databaseMock.isDatabaseConfigured.mockReturnValue(true);
		databaseMock.queryRows.mockResolvedValue([
			{
				name: 'test rose',
				hex: '#cc8899',
				product_url: 'https://example.com/test-rose',
				depth_affinities: ['light'],
				undertone_affinities: ['neutral']
			}
		]);

		const shades = await listShadeCatalog({ depth: 'light' });

		expect(databaseMock.queryRows).toHaveBeenCalledOnce();
		expect(shades).toEqual([
			{
				name: 'test rose',
				hex: '#cc8899',
				productUrl: 'https://example.com/test-rose',
				depthAffinities: ['light'],
				undertoneAffinities: ['neutral']
			}
		]);
	});
});

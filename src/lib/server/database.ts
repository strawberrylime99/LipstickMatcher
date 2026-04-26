import { env } from '$env/dynamic/private';
import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null | undefined;

export function isDatabaseConfigured() {
	return Boolean(env.DATABASE_URL);
}

function getPool() {
	if (pool !== undefined) return pool;

	if (!env.DATABASE_URL) {
		pool = null;
		return pool;
	}

	pool = new Pool({
		connectionString: env.DATABASE_URL
	});

	return pool;
}

export async function queryRows<T extends pg.QueryResultRow>(
	text: string,
	params: unknown[] = []
): Promise<T[]> {
	const activePool = getPool();

	if (!activePool) {
		throw new Error('Database is not configured.');
	}

	const result = await activePool.query<T>(text, params);
	return result.rows;
}

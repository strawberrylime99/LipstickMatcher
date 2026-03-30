import { readFile, writeFile } from 'node:fs/promises';

function escapeSql(value) {
	return value.replaceAll("'", "''");
}

function parseExportedConst(source, exportName) {
	const exportIndex = source.indexOf(`export const ${exportName}`);
	if (exportIndex === -1) {
		throw new Error(`Could not find export "${exportName}"`);
	}

	const assignmentIndex = source.indexOf('=', exportIndex);
	const endIndex = source.indexOf('\n};', assignmentIndex);
	const literal = source.slice(assignmentIndex + 1, endIndex + 2).trim();

	return Function(`return (${literal});`)();
}

const shadeColorSource = await readFile(new URL('../src/lib/shadeColors.ts', import.meta.url), 'utf8');
const shadeRuleSource = await readFile(
	new URL('../src/lib/recommendations/shadeRules.ts', import.meta.url),
	'utf8'
);

const shadeColors = parseExportedConst(shadeColorSource, 'shadeColors');
const toneShadeMap = parseExportedConst(shadeRuleSource, 'TONE_SHADE_MAP');
const undertoneShadeMap = parseExportedConst(shadeRuleSource, 'UNDERTONE_SHADE_MAP');

const shadeCatalog = Object.entries(shadeColors)
	.map(([name, details]) => {
		const depthAffinities = [
			...new Set(
				Object.entries(toneShadeMap)
					.filter(([, shades]) => shades.includes(name))
					.map(([toneKey]) => toneKey.split(' ')[0])
			)
		];
		const undertoneAffinities = [
			...new Set([
				...Object.entries(toneShadeMap)
					.filter(([, shades]) => shades.includes(name))
					.map(([toneKey]) => toneKey.split(' ')[1]),
				...Object.entries(undertoneShadeMap)
					.filter(([, shades]) => shades.includes(name))
					.map(([undertone]) => undertone)
			])
		];

		return {
			name,
			hex: details.hex,
			productUrl: details.link,
			depthAffinities,
			undertoneAffinities: undertoneAffinities.length ? undertoneAffinities : ['neutral']
		};
	})
	.sort((a, b) => a.name.localeCompare(b.name));

const values = shadeCatalog
	.map(
		(shade) =>
			`('${escapeSql(shade.name)}', '${shade.hex}', '${escapeSql(shade.productUrl)}', '{${shade.depthAffinities.join(',')}}', '{${shade.undertoneAffinities.join(',')}}')`
	)
	.join(',\n');

const sql = `insert into public.shades (name, hex, product_url, depth_affinities, undertone_affinities)
values
${values}
on conflict (name) do update set
	hex = excluded.hex,
	product_url = excluded.product_url,
	depth_affinities = excluded.depth_affinities,
	undertone_affinities = excluded.undertone_affinities,
	updated_at = timezone('utc', now());
`;

await writeFile(new URL('../supabase/seed.sql', import.meta.url), sql);
console.log(`Wrote ${shadeCatalog.length} shade rows to supabase/seed.sql`);

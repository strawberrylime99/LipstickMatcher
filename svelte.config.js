import adapter from '@sveltejs/adapter-auto';
import { mdsvex } from 'mdsvex';
import path from 'path';

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		mdsvex({
			extensions: ['.md'],
			layout: {
				blog: './src/routes/blog/_postLayout.svelte'
			  }
			  
		})
	],
	kit: {
		adapter: adapter(),
		alias: {
			$lib: path.resolve('./src/lib')
		}
	}
};

export default config;

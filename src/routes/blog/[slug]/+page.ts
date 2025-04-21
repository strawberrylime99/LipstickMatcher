import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const allPosts = import.meta.glob('../*.md', { eager: true });

export const load: PageLoad = async ({ params }) => {
	const slug = params.slug;
	const match = Object.entries(allPosts).find(([path]) =>
		path.includes(`${slug}.md`)
	);

	if (!match) {
		throw error(404, 'Post not found');
	}

	const post: any = match[1];

	return {
		post: {
			...post.metadata,
			component: post.default
		}
	};
};

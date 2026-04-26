import type { Handle } from '@sveltejs/kit';

const contentSecurityPolicy = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"img-src 'self' data: https:",
	"font-src 'self' https://fonts.gstatic.com",
	"connect-src 'self' https://vitals.vercel-insights.com",
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"form-action 'self'"
].join('; ');

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('Content-Security-Policy', contentSecurityPolicy);
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), interest-cohort=()'
	);

	return response;
};

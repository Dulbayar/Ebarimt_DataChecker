import autoAdapter from '@sveltejs/adapter-auto';
import staticAdapter from '@sveltejs/adapter-static';
import { relative, sep } from 'node:path';

const isTauriBuild = process.env.TAURI_BUILD === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		}
	},
	kit: {
		adapter: isTauriBuild
			? staticAdapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				strict: false
			})
			: autoAdapter()
	}
};

export default config;

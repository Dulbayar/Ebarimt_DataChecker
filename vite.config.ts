import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const isTauriBuild = process.env.TAURI_BUILD === 'true';

export default defineConfig({
	plugins: [sveltekit()],
	// Use relative assets for packaged desktop builds to avoid blank windows.
	base: isTauriBuild ? './' : '/'
});

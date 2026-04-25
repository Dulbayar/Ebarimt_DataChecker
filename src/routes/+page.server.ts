import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const webOnlyMode = (env.PUBLIC_WEB_ONLY ?? '').trim().toLowerCase() === 'true';

	if (webOnlyMode) {
		throw redirect(307, '/download');
	}

	const userAgent = request.headers.get('user-agent')?.toLowerCase() ?? '';
	const isTauriWebview = userAgent.includes('tauri');

	if (!isTauriWebview) {
		throw redirect(307, '/download');
	}

	return {};
};

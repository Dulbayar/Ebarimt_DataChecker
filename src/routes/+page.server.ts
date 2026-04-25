import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const userAgent = request.headers.get('user-agent')?.toLowerCase() ?? '';
	const isTauriWebview = userAgent.includes('tauri');

	if (!isTauriWebview) {
		throw redirect(307, '/download');
	}

	return {};
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { username, password, clientId, env } = await request.json();

	const baseUrl =
		env === 'staging'
			? 'https://st.auth.itc.gov.mn/auth/realms/Staging/protocol/openid-connect/token'
			: 'https://auth.itc.gov.mn/auth/realms/ITC/protocol/openid-connect/token';

	const body = new URLSearchParams({
		grant_type: 'password',
		username,
		password,
		client_id: clientId || 'vatps'
	});

	let res: Response;
	try {
		res = await fetch(baseUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString()
		});
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		return json({ error: `Network error: ${msg}`, url: baseUrl }, { status: 502 });
	}

	const text = await res.text();
	let data: Record<string, unknown>;
	try {
		data = JSON.parse(text);
	} catch {
		return json({ error: `Non-JSON response (${res.status}): ${text.slice(0, 300)}`, url: baseUrl }, { status: 502 });
	}

	if (!res.ok) {
		return json(
			{ error: data.error_description || data.error || `HTTP ${res.status}`, raw: data, url: baseUrl },
			{ status: res.status }
		);
	}

	return json({ access_token: data.access_token, expires_in: data.expires_in });
};

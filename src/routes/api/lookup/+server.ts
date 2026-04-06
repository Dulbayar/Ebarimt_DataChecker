import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import https from 'node:https';

const BASE = 'https://api.ebarimt.mn/api/info/check';

// Use node https directly to avoid Windows SSL revocation errors
function httpsGet(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		https.get(url, { rejectUnauthorized: false }, (res: import('node:http').IncomingMessage) => {
			let data = '';
			res.on('data', (chunk: Buffer) => (data += chunk));
			res.on('end', () => resolve(data));
		}).on('error', reject);
	});
}

export const POST: RequestHandler = async ({ request }) => {
	const { regNos } = await request.json();

	if (!Array.isArray(regNos) || regNos.length === 0) {
		return json({ error: 'No registration numbers provided' }, { status: 400 });
	}

	const results = await Promise.all(
		regNos.map(async (regNo: string) => {
			const trimmed = regNo.trim();
			if (!trimmed) return null;

			// Step 1: get TIN from registration number
			let tinText: string;
			try {
				tinText = await httpsGet(`${BASE}/getTinInfo?regNo=${encodeURIComponent(trimmed)}`);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				return { regNo: trimmed, tin: '', name: '', vatPayer: '', cityPayer: '', found: false, error: `Сүлжээний алдаа (TIN): ${msg}` };
			}

			let tinData: Record<string, unknown>;
			try {
				tinData = JSON.parse(tinText);
			} catch {
				return { regNo: trimmed, tin: '', name: '', vatPayer: '', cityPayer: '', found: false, error: `TIN хариу алдаатай: ${tinText.slice(0, 200)}` };
			}

			if (tinData.status !== 200 || !tinData.data) {
				return { regNo: trimmed, tin: '', name: '', vatPayer: '', cityPayer: '', found: false, error: (tinData.msg as string) || `TIN олдсонгүй` };
			}

			const tin = tinData.data as string;

			// Step 2: get company info from TIN
			let infoText: string;
			try {
				infoText = await httpsGet(`${BASE}/getInfo?tin=${encodeURIComponent(tin)}`);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				return { regNo: trimmed, tin, name: '', vatPayer: '', cityPayer: '', found: false, error: `Сүлжээний алдаа (Info): ${msg}` };
			}

			let infoData: Record<string, unknown>;
			try {
				infoData = JSON.parse(infoText);
			} catch {
				return { regNo: trimmed, tin, name: '', vatPayer: '', cityPayer: '', found: false, error: `Info хариу алдаатай: ${infoText.slice(0, 200)}` };
			}

			if (infoData.status !== 200) {
				return { regNo: trimmed, tin, name: '', vatPayer: '', cityPayer: '', found: false, error: (infoData.msg as string) || `Info олдсонгүй` };
			}

			const d = infoData.data as Record<string, unknown>;
			return {
				regNo: trimmed,
				tin,
				name: (d.name as string) || '',
				vatPayer: d.vatPayer ? 'Тийм' : 'Үгүй',
				cityPayer: d.cityPayer ? 'Тийм' : 'Үгүй',
				found: d.found !== false,
				error: ''
			};
		})
	);

	return json({ results: results.filter(Boolean) });
};

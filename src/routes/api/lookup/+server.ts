import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BASE = 'https://api.ebarimt.mn/api/info/check';

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
			let tinData: Record<string, unknown>;
			try {
				const res = await fetch(`${BASE}/getTinInfo?regNo=${encodeURIComponent(trimmed)}`);
				tinData = await res.json();
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				return { regNo: trimmed, tin: '', name: '', vatPayer: '', cityPayer: '', found: false, error: `Сүлжээний алдаа (TIN): ${msg}` };
			}

			if (tinData.status !== 200 || !tinData.data) {
				return { regNo: trimmed, tin: '', name: '', vatPayer: '', cityPayer: '', found: false, error: (tinData.msg as string) || `TIN олдсонгүй` };
			}

			const tin = tinData.data as string;

			// Step 2: get company info from TIN
			let infoData: Record<string, unknown>;
			try {
				const res = await fetch(`${BASE}/getInfo?tin=${encodeURIComponent(tin)}`);
				infoData = await res.json();
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				return { regNo: trimmed, tin, name: '', vatPayer: '', cityPayer: '', found: false, error: `Сүлжээний алдаа (Info): ${msg}` };
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

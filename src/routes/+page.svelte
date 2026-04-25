<script lang="ts">
	type Row = {
		regNo: string;
		tin: string;
		name: string;
		vatPayer: string;
		cityPayer: string;
		found: boolean;
		error: string;
	};

	let inputText = $state('');
	let results = $state<Row[]>([]);
	let loading = $state(false);
	let lookupError = $state('');
	let progress = $state(0);
	let total = $state(0);

	let progressPct = $derived(total > 0 ? Math.round((progress / total) * 100) : 0);

	async function lookup() {
		const regNos = inputText
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);

		if (regNos.length === 0) {
			lookupError = 'Регистрийн дугаар оруулна уу';
			return;
		}

		loading = true;
		lookupError = '';
		results = [];
		progress = 0;
		total = regNos.length;

		const BASE = 'https://api.ebarimt.mn/api/info/check';

		async function httpsGet(url: string): Promise<string> {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.text();
		}

		for (const regNo of regNos) {
			const trimmed = regNo.trim();
			if (!trimmed) continue;

			let tinData: Record<string, unknown>;
			try {
				const tinText = await httpsGet(`${BASE}/getTinInfo?regNo=${encodeURIComponent(trimmed)}`);
				tinData = JSON.parse(tinText);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				results = [...results, { regNo: trimmed, tin: '', name: '', vatPayer: '', cityPayer: '', found: false, error: `Сүлжээний алдаа (TIN): ${msg}` }];
				progress++;
				continue;
			}

			if (tinData.status !== 200 || !tinData.data) {
				results = [...results, { regNo: trimmed, tin: '', name: '', vatPayer: '', cityPayer: '', found: false, error: (tinData.msg as string) || `TIN олдсонгүй` }];
				progress++;
				continue;
			}

			const tin = tinData.data as string;

			let infoData: Record<string, unknown>;
			try {
				const infoText = await httpsGet(`${BASE}/getInfo?tin=${encodeURIComponent(tin)}`);
				infoData = JSON.parse(infoText);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				results = [...results, { regNo: trimmed, tin, name: '', vatPayer: '', cityPayer: '', found: false, error: `Сүлжээний алдаа (Info): ${msg}` }];
				progress++;
				continue;
			}

			if (infoData.status !== 200) {
				results = [...results, { regNo: trimmed, tin, name: '', vatPayer: '', cityPayer: '', found: false, error: (infoData.msg as string) || `Info олдсонгүй` }];
				progress++;
				continue;
			}

			const d = infoData.data as Record<string, unknown>;
			results = [...results, {
				regNo: trimmed,
				tin,
				name: (d.name as string) || '',
				vatPayer: d.vatPayer ? 'Тийм' : 'Үгүй',
				cityPayer: d.cityPayer ? 'Тийм' : 'Үгүй',
				found: d.found !== false,
				error: ''
			}];
			progress++;
		}

		loading = false;
	}

	function exportCsv() {
		const header = ['Регистрийн дугаар', 'ТТД', 'Нэр', 'НӨАТ төлөгч', 'Хот татвар', 'Олдсон эсэх', 'Шалтгаан'];
		const rows = results.map((r) => [
			r.regNo,
			r.tin,
			r.name,
			r.vatPayer,
			r.cityPayer,
			r.found ? 'Тийм' : 'Үгүй',
			r.error
		]);

		const csvContent =
			'\uFEFF' +
			[header, ...rows]
				.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
				.join('\r\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `ebarimt_lookup_${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function clearAll() {
		inputText = '';
		results = [];
		lookupError = '';
		progress = 0;
		total = 0;
	}

	let regNoCount = $derived(
		inputText
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean).length
	);
</script>

<svelte:head>
	<title>eBarimt Lookup</title>
</svelte:head>

<div class="app">
	<header>
		<div class="header-content">
			<div class="title-wrap">
				<h1>eBarimt Lookup</h1>
				<p class="subtitle">Регистрийн дугаараар байгууллага хайх</p>
			</div>
			<a class="download-link" href="/download">Download App</a>
		</div>
	</header>

	<main>
		<div class="card input-card">
			<div class="card-header">
				<h2>Регистрийн дугаар</h2>
				{#if regNoCount > 0}
					<span class="badge">{regNoCount} дугаар</span>
				{/if}
			</div>
			<textarea
				bind:value={inputText}
				onkeydown={(e) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); lookup(); } }}
				placeholder="Регистрийн дугааруудыг мөр болгон буулгана уу (Excel-ийн нэг баганаас хуулж болно)

Жишээ нь:
6063770
3809720
1234567"
				rows="10"
			></textarea>
			<div class="input-actions">
				<button class="btn-primary" onclick={lookup} disabled={loading || regNoCount === 0}>
					{#if loading}
						<span class="spinner"></span> Хайж байна...
					{:else}
						Хайх
					{/if}
				</button>
				{#if inputText || results.length > 0}
					<button class="btn-ghost" onclick={clearAll} disabled={loading}>Цэвэрлэх</button>
				{/if}
			</div>

			{#if loading || (total > 0 && progress > 0)}
				<div class="progress-wrap">
					<div class="progress-bar-bg">
						<div class="progress-bar-fill" style="width: {progressPct}%"></div>
					</div>
					<span class="progress-label">
						{progress} / {total} &nbsp;·&nbsp; {progressPct}%
						{#if !loading && progress === total}
							<span class="progress-done">✓ Дууслаа</span>
						{/if}
					</span>
				</div>
			{/if}

			{#if lookupError}
				<div class="error-msg">{lookupError}</div>
			{/if}
		</div>

		{#if results.length > 0}
			<div class="card results-card">
				<div class="card-header">
					<h2>Үр дүн</h2>
					<div class="result-meta">
						<span class="badge success">{results.filter((r) => r.found).length} олдсон</span>
						{#if results.filter((r) => r.error).length > 0}
							<span class="badge error">{results.filter((r) => r.error).length} алдаа</span>
						{/if}
						{#if !loading}
							<button class="btn-export" onclick={exportCsv}>CSV татах</button>
						{/if}
					</div>
				</div>
				<div class="table-wrap">
					<table>
						<thead>
							<tr>
								<th>#</th>
								<th>Регистрийн дугаар</th>
								<th>ТТД</th>
								<th>Байгууллагын нэр</th>
								<th>НӨАТ</th>
								<th>Хот татвар</th>
								<th>Төлөв</th>
								<th>Шалтгаан</th>
							</tr>
						</thead>
						<tbody>
							{#each results as row, i}
								<tr class:row-error={!!row.error} class:row-notfound={!row.found && !row.error}>
									<td class="num">{i + 1}</td>
									<td class="mono">{row.regNo}</td>
									<td class="mono">{row.tin}</td>
									<td class="name">{row.name}</td>
									<td class="center">{row.vatPayer}</td>
									<td class="center">{row.cityPayer}</td>
									<td>
										{#if row.error}
											<span class="tag tag-error">Алдаа</span>
										{:else if row.found}
											<span class="tag tag-ok">Олдсон</span>
										{:else}
											<span class="tag tag-warn">Олдсонгүй</span>
										{/if}
									</td>
									<td class="reason">{row.error}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: #f1f5f9;
		color: #1e293b;
		min-height: 100vh;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		background: #1e40af;
		color: white;
		padding: 0 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.header-content {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1rem 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.title-wrap {
		display: flex;
		flex-direction: column;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.subtitle {
		font-size: 0.85rem;
		opacity: 0.8;
		margin-top: 0.1rem;
	}

	.download-link {
		display: inline-flex;
		align-items: center;
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.16);
		border: 1px solid rgba(255, 255, 255, 0.3);
		text-decoration: none;
		color: white;
		font-size: 0.83rem;
		font-weight: 600;
		transition: background 0.15s ease;
	}

	.download-link:hover {
		background: rgba(255, 255, 255, 0.24);
	}

	main {
		flex: 1;
		max-width: 1100px;
		margin: 0 auto;
		width: 100%;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.card-header h2 {
		font-size: 1rem;
		font-weight: 600;
	}

	.result-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	textarea {
		width: 100%;
		padding: 1rem 1.25rem;
		border: none;
		resize: vertical;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		line-height: 1.6;
		color: #334155;
		outline: none;
		min-height: 180px;
	}

	textarea::placeholder {
		color: #94a3b8;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.input-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid #e2e8f0;
	}

	.progress-wrap {
		padding: 0.6rem 1.25rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.progress-bar-bg {
		height: 8px;
		background: #e2e8f0;
		border-radius: 99px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: #1e40af;
		border-radius: 99px;
		transition: width 0.3s ease;
	}

	.progress-label {
		font-size: 0.78rem;
		color: #64748b;
	}

	.progress-done {
		color: #16a34a;
		font-weight: 600;
	}

	.error-msg {
		padding: 0.5rem 1.25rem 0.75rem;
		color: #dc2626;
		font-size: 0.85rem;
	}

	.badge {
		padding: 0.2rem 0.6rem;
		border-radius: 99px;
		font-size: 0.75rem;
		font-weight: 600;
		background: #e2e8f0;
		color: #475569;
	}

	.badge.success {
		background: #dcfce7;
		color: #16a34a;
	}

	.badge.error {
		background: #fee2e2;
		color: #dc2626;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 1.25rem;
		background: #1e40af;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-primary:hover:not(:disabled) { background: #1d3a9e; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

	.btn-ghost {
		padding: 0.45rem 1rem;
		background: transparent;
		color: #475569;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		font-size: 0.85rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-ghost:hover { background: #f8fafc; }
	.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

	.btn-export {
		padding: 0.4rem 1rem;
		background: #16a34a;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-export:hover { background: #15803d; }

	.spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	thead th {
		padding: 0.7rem 1rem;
		text-align: left;
		background: #f8fafc;
		color: #64748b;
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		border-bottom: 1px solid #e2e8f0;
		white-space: nowrap;
	}

	tbody tr {
		border-bottom: 1px solid #f1f5f9;
		transition: background 0.1s;
	}

	tbody tr:hover { background: #f8fafc; }

	tbody tr.row-error { background: #fff5f5; }
	tbody tr.row-error:hover { background: #fee2e2; }

	tbody tr.row-notfound { background: #fffbeb; }

	td {
		padding: 0.65rem 1rem;
		color: #334155;
	}

	td.num {
		color: #94a3b8;
		font-size: 0.8rem;
		width: 40px;
	}

	td.mono {
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		color: #1e40af;
	}

	td.name {
		font-weight: 500;
		max-width: 300px;
	}

	td.center { text-align: center; }

	td.reason {
		font-size: 0.8rem;
		color: #dc2626;
		max-width: 220px;
	}

	.tag {
		display: inline-block;
		padding: 0.15rem 0.55rem;
		border-radius: 99px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.tag-ok   { background: #dcfce7; color: #16a34a; }
	.tag-error { background: #fee2e2; color: #dc2626; }
	.tag-warn  { background: #fef9c3; color: #ca8a04; }
</style>

<script lang="ts">
	let { data } = $props();

	function prettyBytes(size: number) {
		if (!Number.isFinite(size) || size <= 0) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB'];
		const power = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
		const value = size / Math.pow(1024, power);
		return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
	}

	function guessPlatform(name: string) {
		const lower = name.toLowerCase();
		if (lower.includes('windows') || lower.endsWith('.msi') || lower.endsWith('.exe')) return 'Windows';
		if (lower.includes('mac') || lower.includes('darwin') || lower.endsWith('.dmg') || lower.endsWith('.app.tar.gz')) return 'macOS';
		if (lower.includes('linux') || lower.endsWith('.appimage') || lower.endsWith('.deb') || lower.endsWith('.rpm')) return 'Linux';
		return 'Other';
	}

	function formatPublishedAt(value?: string) {
		if (!value) return '';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
	}
</script>

<svelte:head>
	<title>Download DataFetching</title>
</svelte:head>

<div class="scene">
	<div class="glow glow-a"></div>
	<div class="glow glow-b"></div>

	<main class="shell">
		<header class="hero">
			<a class="back" href="/">Back to Lookup</a>
			<p class="kicker">Official Builds</p>
			<h1>Download DataFetching</h1>
			<p class="lede">
				Install the latest release directly from GitHub. Built from
				<a href={`https://github.com/${data.owner}/${data.repo}`} target="_blank" rel="noreferrer">{data.owner}/{data.repo}</a>.
			</p>
		</header>

		{#if data.release}
			<section class="release-card">
				<div class="release-head">
					<div>
						<p class="label">Latest release</p>
						<h2>{data.release.name || data.release.tag_name}</h2>
						<p class="meta">Tag {data.release.tag_name} • Published {formatPublishedAt(data.release.published_at)}</p>
					</div>
					<a class="outline" href={data.release.html_url} target="_blank" rel="noreferrer">View release notes</a>
				</div>

				{#if data.release.assets?.length}
					<ul class="asset-list">
						{#each data.release.assets as asset}
							<li class="asset">
								<div class="asset-main">
									<p class="asset-name">{asset.name}</p>
									<p class="asset-meta">
										<span>{guessPlatform(asset.name)}</span>
										<span>{prettyBytes(asset.size)}</span>
										<span>{asset.download_count} downloads</span>
									</p>
								</div>
								<a class="download" href={asset.browser_download_url}>Download</a>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="empty">This release has no downloadable assets yet.</p>
				{/if}
			</section>
		{:else}
			<section class="release-card error">
				<h2>Release not available</h2>
				<p>{data.error || 'No release found.'}</p>
				<p>
					Publish one using the GitHub Actions workflow, then refresh this page.
				</p>
			</section>
		{/if}
	</main>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap');

	:global(body) {
		margin: 0;
		font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
		background: #f8f7f2;
		color: #1f2937;
	}

	.scene {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background:
			radial-gradient(circle at 10% 5%, rgba(239, 68, 68, 0.18), transparent 35%),
			radial-gradient(circle at 90% 20%, rgba(16, 185, 129, 0.18), transparent 30%),
			linear-gradient(135deg, #faf7f2, #f5efe4 45%, #eaf1e8);
	}

	.glow {
		position: absolute;
		border-radius: 999px;
		filter: blur(36px);
		opacity: 0.45;
		pointer-events: none;
	}

	.glow-a {
		width: 220px;
		height: 220px;
		background: #f97316;
		top: -70px;
		right: -40px;
	}

	.glow-b {
		width: 280px;
		height: 280px;
		background: #34d399;
		left: -70px;
		bottom: -90px;
	}

	.shell {
		position: relative;
		z-index: 1;
		max-width: 980px;
		margin: 0 auto;
		padding: 2.25rem 1rem 3rem;
	}

	.hero {
		display: grid;
		gap: 0.7rem;
		margin-bottom: 1.5rem;
		animation: rise 0.45s ease-out;
	}

	.back {
		justify-self: start;
		color: #374151;
		text-decoration: none;
		font-size: 0.9rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid #d1d5db;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.7);
	}

	.back:hover {
		background: #ffffff;
	}

	.kicker {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		font-size: 0.76rem;
		font-weight: 700;
		color: #047857;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.8rem, 5vw, 3.25rem);
		line-height: 1.02;
	}

	.lede {
		margin: 0;
		max-width: 68ch;
		color: #4b5563;
	}

	.lede a {
		color: #0f766e;
		font-weight: 700;
	}

	.release-card {
		background: rgba(255, 255, 255, 0.78);
		backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.7);
		border-radius: 22px;
		padding: 1rem;
		box-shadow: 0 16px 45px rgba(0, 0, 0, 0.08);
		animation: rise 0.55s ease-out;
	}

	.release-card.error {
		border-color: #fecaca;
	}

	.release-head {
		display: flex;
		gap: 0.9rem;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0.2rem 1rem;
		flex-wrap: wrap;
		border-bottom: 1px dashed #d1d5db;
	}

	.label {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #b45309;
	}

	h2 {
		margin: 0.2rem 0 0;
		font-size: clamp(1.2rem, 3vw, 2rem);
	}

	.meta {
		margin: 0.3rem 0 0;
		color: #6b7280;
	}

	.outline {
		text-decoration: none;
		color: #0f172a;
		border: 1px solid #94a3b8;
		border-radius: 999px;
		padding: 0.55rem 0.95rem;
		font-weight: 600;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.asset-list {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0;
		display: grid;
		gap: 0.75rem;
	}

	.asset {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem;
		border-radius: 14px;
		background: linear-gradient(180deg, #fff, #f8fafc);
		border: 1px solid #e5e7eb;
	}

	.asset-name {
		margin: 0;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		font-weight: 500;
		word-break: break-all;
	}

	.asset-meta {
		margin: 0.35rem 0 0;
		display: flex;
		gap: 0.55rem;
		flex-wrap: wrap;
		color: #6b7280;
		font-size: 0.82rem;
	}

	.asset-meta span {
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		background: #eef2ff;
		color: #334155;
	}

	.download {
		text-decoration: none;
		font-weight: 700;
		background: linear-gradient(135deg, #f59e0b, #ef4444);
		color: white;
		padding: 0.55rem 0.9rem;
		border-radius: 10px;
		white-space: nowrap;
		transition: transform 0.15s ease;
	}

	.download:hover {
		transform: translateY(-1px);
	}

	.empty {
		margin: 1.2rem 0 0.3rem;
		color: #6b7280;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.shell {
			padding-top: 1.2rem;
		}

		.asset {
			align-items: flex-start;
			flex-direction: column;
		}

		.download {
			align-self: stretch;
			text-align: center;
		}
	}
</style>

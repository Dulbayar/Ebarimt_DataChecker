# DataFetching

SvelteKit + Tauri desktop app for bulk eBarimt company lookup by registration number.

## Local Development

Install dependencies:

```sh
npm install
```

Run the web app:

```sh
npm run dev
```

Run checks:

```sh
npm run check
npm run build
```

## GitHub Build and Release Setup

This repository includes a release workflow at [.github/workflows/tauri-release.yml](.github/workflows/tauri-release.yml).

What it does:

1. Builds the Tauri app on `windows-latest`.
2. Publishes build assets to a GitHub Release.
3. Triggers on:
	- Tag pushes like `v1.0.0`
	- Manual run via Actions UI (`workflow_dispatch`) with a `tag` input

### Release Steps

Option 1: tag push

```sh
git tag v1.0.0
git push origin v1.0.0
```

Option 2: manual

1. Open GitHub Actions.
2. Run workflow `Build and Release Tauri App`.
3. Enter a tag like `v1.0.1`.

## Download Landing Page

Download page route:

- [/download](src/routes/download/+page.svelte)

It loads the latest release from GitHub server-side in [+page.server.ts](src/routes/download/+page.server.ts).

Optional public env vars (for forked repo support):

- `PUBLIC_GITHUB_OWNER`
- `PUBLIC_GITHUB_REPO`
- `PUBLIC_WEB_ONLY`

If not set, defaults are:

- Owner: `Dulbayar`
- Repo: `Ebarimt_DataChecker`

### Web-Only Mode (Recommended)

The root route redirect behavior is controlled client-side in [src/routes/+page.svelte](src/routes/+page.svelte).

Set this on Vercel so web users always see the download page:

- `PUBLIC_WEB_ONLY=true`

Recommended Vercel envs:

- `PUBLIC_WEB_ONLY=true`
- `PUBLIC_GITHUB_OWNER=Dulbayar`
- `PUBLIC_GITHUB_REPO=Ebarimt_DataChecker`

Behavior:

1. If `PUBLIC_WEB_ONLY=true`, `/` redirects to `/download` in the browser.
2. If not set, it uses runtime detection and keeps the desktop Tauri app on `/`.

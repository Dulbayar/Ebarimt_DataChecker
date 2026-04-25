import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';

type GithubAsset = {
	id: number;
	name: string;
	size: number;
	download_count: number;
	browser_download_url: string;
	content_type: string;
};

type GithubRelease = {
	tag_name: string;
	name: string;
	body: string;
	published_at: string;
	html_url: string;
	assets: GithubAsset[];
};

const DEFAULT_OWNER = 'Dulbayar';
const DEFAULT_REPO = 'Ebarimt_DataChecker';

export const load: PageServerLoad = async ({ fetch }) => {
	const owner = env.PUBLIC_GITHUB_OWNER || DEFAULT_OWNER;
	const repo = env.PUBLIC_GITHUB_REPO || DEFAULT_REPO;
	const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

	try {
		const response = await fetch(apiUrl, {
			headers: {
				Accept: 'application/vnd.github+json',
				'User-Agent': 'DataFetching-Download-Page'
			}
		});

		if (!response.ok) {
			const statusText = response.status === 404 ? 'No releases published yet.' : `GitHub API returned ${response.status}`;
			return {
				owner,
				repo,
				release: null,
				error: statusText
			};
		}

		const release = (await response.json()) as GithubRelease;

		return {
			owner,
			repo,
			release,
			error: null
		};
	} catch (error) {
		return {
			owner,
			repo,
			release: null,
			error: error instanceof Error ? error.message : 'Failed to load release data.'
		};
	}
};

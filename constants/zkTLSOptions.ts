export interface ZkTLSOption {
	id: string;
	label: string;
	description: string;
	icon: string;
	baseEndpoint: string;
	category?: string;
	status?: "active" | "coming_soon" | "beta";
	providerId?: string; // Reclaim Provider ID
	version?: string;    // Provider version
}

export const ZKTLS_OPTIONS: ZkTLSOption[] = [
	{
		id: "github-pr",
		label: "GitHub Pull Request Merged",
		description: "Prove that a specific GitHub pull request was successfully merged into the main branch",
		icon: "logo-github",
		baseEndpoint: "https://api.github.com",
		category: "Code",
		status: "active",
		providerId: "49ae2af4-b035-4296-ba91-1db1b62003fc", // Exact Reclaim Provider ID
		version: "v1.0.0",
	},
];
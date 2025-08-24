export interface ZkTLSOption {
	id: string;
	label: string;
	description: string;
	icon: string;
	baseEndpoint: string;
	category?: string;
	status?: "active" | "coming_soon" | "beta";
}

export const ZKTLS_OPTIONS: ZkTLSOption[] = [
	{
		id: "github-pr",
		label: "GitHub",
		description: "Verify pull request was merged",
		icon: "logo-github",
		baseEndpoint: "https://api.github.com",
		category: "Code",
		status: "active",
	},
	{
		id: "google-doc",
		label: "Google Doc",
		description: "Verify document was edited",
		icon: "document-text",
		baseEndpoint: "https://docs.googleapis.com",
		category: "Documents",
		status: "active",
	},
	{
		id: "twitter",
		label: "Twitter",
		description: "Verify tweet was published",
		icon: "logo-twitter",
		baseEndpoint: "https://api.twitter.com",
		category: "Social",
		status: "active",
	},
	{
		id: "website",
		label: "Website",
		description: "Verify webpage content changed",
		icon: "globe",
		baseEndpoint: "",
		category: "Web",
		status: "active",
	},
	{
		id: "api",
		label: "API",
		description: "Verify API returned specific data",
		icon: "server",
		baseEndpoint: "",
		category: "Web",
		status: "active",
	},
	{
		id: "custom",
		label: "Custom",
		description: "Provide your own verification URL",
		icon: "settings",
		baseEndpoint: "",
		category: "Advanced",
		status: "active",
	},
];
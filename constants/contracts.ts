export const CONTRACT_CONFIG = {
	// Back to our original Proof of Work contract - Treasury authorization proven working!
	address: "xion1gk050spal94tpjw0lvfdkzdm0ef837peh8wy025c74jwy07vwe9q4z0nty", // Updated to social payment contract
	rpcUrl: "https://rpc.xion-testnet-2.burnt.com:443",
	restUrl: "https://api.xion-testnet-2.burnt.com:443",
	chainId: "xion-testnet-2",
};

export const TREASURY_CONFIG = {
	address: process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS || "",
	enabled: !!process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS, // Enable if address is configured
	minimumBalance: 1.0, // 1 XION minimum to sponsor gas
	averageGasCost: 0.2, // ~0.2 XION per transaction estimate
};

export const RECLAIM_CONFIG = {
	appId: process.env.EXPO_PUBLIC_RECLAIM_APP_ID || "",
	appSecret: process.env.EXPO_PUBLIC_RECLAIM_APP_SECRET || "",
	providerId: process.env.EXPO_PUBLIC_RECLAIM_PROVIDER_ID || "",
	enabled: !!(
		process.env.EXPO_PUBLIC_RECLAIM_APP_ID &&
		process.env.EXPO_PUBLIC_RECLAIM_APP_SECRET &&
		process.env.EXPO_PUBLIC_RECLAIM_PROVIDER_ID
	),
	verificationContractAddress:
		"xion1qf8jtznwf0tykpg7e65gwafwp47rwxl4x2g2kldvv357s6frcjlsh2m24e", // From Burnt documentation
	rumCodeId: 1289, // RUM contract code ID for storing proofs
};

export const CONTRACT_MESSAGES = {
	// Social payment contract query messages
	GET_USER: (username: string) => ({ get_user: { username } }),
	GET_USER_BY_USERNAME: (username: string) => ({
		get_user_by_username: { username },
	}),
	IS_USERNAME_AVAILABLE: (username: string) => ({
		is_username_available: { username },
	}),

	// Social payment contract execute messages
	REGISTER_USER: (
		username: string,
		displayName: string,
		profilePicture: string
	) => ({
		register_user: {
			username,
			display_name: displayName,
			profile_picture: profilePicture,
		},
	}),
};

// Job status types
export enum JobStatus {
	OPEN = "Open",
	ACCEPTED = "Accepted",
	PROOF_SUBMITTED = "ProofSubmitted",
	COMPLETED = "Completed",
	CANCELLED = "Cancelled",
}

// Helper constants
export const XION_DECIMALS = 1000000; // 1 XION = 1,000,000 uxion
export const XION_DENOM = "uxion";

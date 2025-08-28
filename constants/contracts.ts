export const CONTRACT_CONFIG = {
	address:
		process.env.EXPO_PUBLIC_CONTRACT_ADDRESS ||
		"xion1lxcdce37k8n4zyanq3ne5uw958cj0r6mnrr4kdpzrylvsanfcvpq0gzrxy",
	rpcUrl:
		process.env.EXPO_PUBLIC_RPC_ENDPOINT ||
		"https://rpc.xion-testnet-2.burnt.com:443",
	restUrl:
		process.env.EXPO_PUBLIC_REST_ENDPOINT ||
		"https://api.xion-testnet-2.burnt.com:443",
	chainId: process.env.EXPO_PUBLIC_CHAIN_ID || "xion-testnet-2",
	enabled: !!process.env.EXPO_PUBLIC_CONTRACT_ADDRESS, // Enable if address is configured
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
	// Fix: Remove GET_USER (doesn't exist)
	// Keep GET_USER_BY_USERNAME (exists but user "test" not found - normal)
	GET_USER_BY_USERNAME: (username: string) => ({
		get_user_by_username: { username },
	}),

	// Add the missing methods your contract actually has:
	GET_USER_BY_WALLET: (wallet: string) => ({
		get_user_by_wallet: { wallet },
	}),

	IS_USERNAME_AVAILABLE: (username: string) => ({
		is_username_available: { username },
	}),

	HAS_USERNAME: (wallet: string) => ({
		has_username: { wallet },
	}),

	SEARCH_USERS: (query: string) => ({
		search_users: { query },
	}),

	// Payment/Job query messages
	LIST_PAYMENTS: {
		list_payments: {},
	},

	GET_PAYMENT: (paymentId: string) => ({
		get_payment: { payment_id: paymentId },
	}),

	GET_PAYMENTS_BY_SENDER: (senderAddress: string) => ({
		get_payments_by_sender: { sender: senderAddress },
	}),

	GET_PAYMENTS_BY_RECEIVER: (receiverAddress: string) => ({
		get_payments_by_receiver: { receiver: receiverAddress },
	}),

	LIST_JOBS: {
		list_jobs: {},
	},

	// Execute messages
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

	SEND_PAYMENT: (recipient: string, amount: number, description: string) => ({
		send_payment: {
			recipient,
			amount: amount.toString(),
			description,
		},
	}),

	POST_JOB: (description: string) => ({
		post_job: {
			description,
		},
	}),

	ACCEPT_JOB: (jobId: number) => ({
		accept_job: {
			job_id: jobId,
		},
	}),

	SUBMIT_PROOF: (jobId: number, proofHash: string, proofUrl?: string) => ({
		submit_proof: {
			job_id: jobId,
			proof_hash: proofHash,
			proof_url: proofUrl,
		},
	}),

	ACCEPT_PROOF: (jobId: number) => ({
		accept_proof: {
			job_id: jobId,
		},
	}),

	REJECT_PROOF: (jobId: number, reason?: string) => ({
		reject_proof: {
			job_id: jobId,
			reason,
		},
	}),

	CANCEL_JOB: (jobId: number) => ({
		cancel_job: {
			job_id: jobId,
		},
	}),

	SUBMIT_ZKTLS_PROOF: (jobId: number, proof: string) => ({
		submit_zktls_proof: {
			job_id: jobId,
			proof,
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
// console.log("🔍 DEBUG: Contract address being used:", CONTRACT_CONFIG.address);
// console.log(
// 	"🔍 DEBUG: Environment variable:",
// 	process.env.EXPO_PUBLIC_CONTRACT_ADDRESS
// );
// console.log("🔍 DEBUG: Full CONTRACT_CONFIG:", CONTRACT_CONFIG);

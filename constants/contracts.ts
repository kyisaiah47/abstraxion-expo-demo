export const CONTRACT_CONFIG = {
	// Back to our original Proof of Work contract - Treasury authorization proven working!
	address: "xion1x9wlxg2xs9ft0h20z7t6rmnexhzwwws3qgkmm2j803rcdr4jrrys4gt6cv", // Proof of Work contract
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
	enabled: !!(
		process.env.EXPO_PUBLIC_RECLAIM_APP_ID &&
		process.env.EXPO_PUBLIC_RECLAIM_APP_SECRET
	),
	verificationContractAddress:
		"xion1qf8jtznwf0tykpg7e65gwafwp47rwxl4x2g2kldvv357s6frcjlsh2m24e", // From Burnt documentation
	rumCodeId: 1289, // RUM contract code ID for storing proofs
};

export const CONTRACT_MESSAGES = {
	// Proof of Work contract query messages
	LIST_JOBS: { list_jobs: {} },
	GET_JOB: (jobId: number) => ({ get_job: { job_id: jobId } }),
	GET_JOBS_BY_CLIENT: (client: string) => ({ get_jobs_by_client: { client } }),
	GET_JOBS_BY_WORKER: (worker: string) => ({ get_jobs_by_worker: { worker } }),

	// Proof of Work contract execute messages
	POST_JOB: (description: string, deadline?: string) => {
		const msg: any = { post_job: { description } };
		if (deadline !== null && deadline !== undefined && deadline !== "") {
			msg.post_job.deadline = deadline;
		}
		console.log("Generated POST_JOB message:", JSON.stringify(msg, null, 2));
		return msg;
	},
	POST_JOB_MINIMAL: (description: string) => ({ post_job: { description } }),
	ACCEPT_JOB: (jobId: number) => ({ accept_job: { job_id: jobId } }),
	SUBMIT_PROOF: (jobId: number, proof: string) => ({
		submit_proof: { job_id: jobId, proof },
	}),
	ACCEPT_PROOF: (jobId: number) => ({ accept_proof: { job_id: jobId } }),
	REJECT_PROOF: (jobId: number) => ({ reject_proof: { job_id: jobId } }),
	CANCEL_JOB: (jobId: number) => ({ cancel_job: { job_id: jobId } }),

	// zkTLS integration messages (future contract upgrade)
	SUBMIT_ZKTLS_PROOF: (
		jobId: number,
		proofData: string,
		reclaimProof: string,
		deliveryUrl: string
	) => ({
		submit_zktls_proof: {
			job_id: jobId,
			proof_data: proofData,
			reclaim_proof: reclaimProof,
			delivery_url: deliveryUrl,
		},
	}),
	VERIFY_ZKTLS_PROOF: (jobId: number) => ({
		verify_zktls_proof: { job_id: jobId },
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

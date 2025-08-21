export const CONTRACT_CONFIG = {
	// Back to our original Proof of Work contract - Treasury authorization proven working!
	address: "xion1x9wlxg2xs9ft0h20z7t6rmnexhzwwws3qgkmm2j803rcdr4jrrys4gt6cv", // Proof of Work contract
	rpcUrl: "https://rpc.xion-testnet-2.burnt.com:443",
	restUrl: "https://api.xion-testnet-2.burnt.com:443",
	chainId: "xion-testnet-2",
};

export const TREASURY_CONFIG = {
	// Treasury contract for gasless transactions
	address: process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS || "",
	enabled: !!process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS,
	minBalanceThreshold: 1.0, // 1 XION minimum
	gasEstimate: 200000, // ~0.2 XION per transaction
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

export const CONTRACT_CONFIG = {
	// TEMPORARY: Using User Map contract to test Treasury/authorization flow
	// Original: "xion1x9wlxg2xs9ft0h20z7t6rmnexhzwwws3qgkmm2j803rcdr4jrrys4gt6cv"
	address: "xion1276fhsa7v4twwfq9ta7lxszfvl7gqusc6c0vw98d55ryayrjhxpqmal0vg", // User Map contract
	rpcUrl: "https://rpc.xion-testnet-2.burnt.com:443",
	restUrl: "https://api.xion-testnet-2.burnt.com:443",
	chainId: "xion-testnet-2",
};

export const CONTRACT_MESSAGES = {
	// User Map contract query messages (correct format)
	GET_USERS: { get_users: {} },
	GET_VALUE_BY_USER: (user: string) => ({ get_value_by_user: { user } }),
	GET_MAP: { get_map: {} },

	// User Map contract execute messages (correct format)
	UPDATE: (value: any) => ({ update: { value } }), // Original messages - keep for when we switch back to Proof of Work contract
	LIST_JOBS: { list_jobs: {} },
	GET_JOB: (jobId: number) => ({ get_job: { job_id: jobId } }),
	GET_JOBS_BY_CLIENT: (client: string) => ({ get_jobs_by_client: { client } }),
	GET_JOBS_BY_WORKER: (worker: string) => ({ get_jobs_by_worker: { worker } }),
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

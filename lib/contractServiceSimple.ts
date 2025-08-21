import {
	CONTRACT_CONFIG,
	CONTRACT_MESSAGES,
	JobStatus,
	XION_DECIMALS,
	XION_DENOM,
} from "../constants/contracts";

export interface Job {
	id: number;
	description: string;
	client: string;
	worker?: string;
	escrow_amount: {
		denom: string;
		amount: string;
	};
	status: JobStatus;
	deadline?: string;
	proof?: string;
	created_at?: string;
}

export interface JobPosting {
	description: string;
	escrow_amount: string;
	deadline?: string;
}

export type ContractClient = any;

export class ContractService {
	private account: any;
	private client: ContractClient;

	constructor(account: any, client: ContractClient) {
		this.account = account;
		this.client = client;
	}

	// ======= JOB QUERIES =======

	async getJobs(): Promise<Job[]> {
		try {
			console.log("🔍 Fetching jobs from contract...");
			const result = await this.client.queryContractSmart(
				CONTRACT_CONFIG.address,
				{ get_jobs: {} }
			);

			const jobs = result.jobs || [];
			console.log(`📋 Found ${jobs.length} jobs`);
			return jobs;
		} catch (error: any) {
			console.error("Failed to fetch jobs:", error);
			throw new Error(`Failed to fetch jobs: ${error.message}`);
		}
	}

	async getJob(id: number): Promise<Job | null> {
		try {
			console.log(`🔍 Fetching job ${id} from contract...`);
			const result = await this.client.queryContractSmart(
				CONTRACT_CONFIG.address,
				{ get_job: { job_id: id } }
			);

			return result.job || null;
		} catch (error: any) {
			console.error(`Failed to fetch job ${id}:`, error);
			return null;
		}
	}

	async getUserJobs(userAddress: string): Promise<Job[]> {
		try {
			console.log(`🔍 Fetching jobs for user ${userAddress}...`);
			const result = await this.client.queryContractSmart(
				CONTRACT_CONFIG.address,
				{ get_user_jobs: { user: userAddress } }
			);

			const jobs = result.jobs || [];
			console.log(`📋 Found ${jobs.length} jobs for user`);
			return jobs;
		} catch (error: any) {
			console.error("Failed to fetch user jobs:", error);
			throw new Error(`Failed to fetch user jobs: ${error.message}`);
		}
	}

	// ======= JOB ACTIONS =======

	async createJob(jobData: JobPosting): Promise<any> {
		console.log("📝 Creating new job...", jobData);

		try {
			const escrowAmount = parseFloat(jobData.escrow_amount);
			const escrowInUxion = Math.floor(
				escrowAmount * Math.pow(10, XION_DECIMALS)
			);

			const funds = [
				{
					denom: XION_DENOM,
					amount: escrowInUxion.toString(),
				},
			];

			const msg = {
				post_job: {
					description: jobData.description,
					escrow_amount: {
						denom: XION_DENOM,
						amount: escrowInUxion.toString(),
					},
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto",
				"Create new job",
				funds
			);

			console.log("✅ Job created successfully:", result.transactionHash);
			return result;
		} catch (error: any) {
			console.error("Job creation failed:", error);
			throw new Error(error.message || "Failed to create job");
		}
	}

	async acceptJob(jobId: number): Promise<any> {
		console.log(`Accepting job ${jobId}...`);

		try {
			const msg = {
				accept_job: {
					job_id: jobId,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto",
				`Accept job ${jobId}`
			);

			console.log("✅ Job accepted successfully:", result.transactionHash);
			return result;
		} catch (error: any) {
			console.error("Job acceptance failed:", error);
			throw new Error(error.message || "Failed to accept job");
		}
	}

	async submitProof(jobId: number, proofText: string): Promise<any> {
		console.log(`Submitting proof for job ${jobId}...`);

		try {
			const msg = {
				submit_proof: {
					job_id: jobId,
					proof_text: proofText,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto",
				`Submit proof for job ${jobId}`
			);

			console.log("✅ Proof submitted successfully:", result.transactionHash);
			return result;
		} catch (error: any) {
			console.error("Proof submission failed:", error);
			throw new Error(error.message || "Failed to submit proof");
		}
	}

	async acceptProof(jobId: number): Promise<any> {
		console.log(`Accepting proof for job ${jobId}...`);

		try {
			const msg = {
				accept_proof: {
					job_id: jobId,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto",
				`Accept proof for job ${jobId}`
			);

			console.log("✅ Proof accepted successfully:", result.transactionHash);
			return result;
		} catch (error: any) {
			console.error("Proof acceptance failed:", error);
			throw new Error(error.message || "Failed to accept proof");
		}
	}

	async rejectProof(jobId: number): Promise<any> {
		console.log(`Rejecting proof for job ${jobId}...`);

		try {
			const msg = {
				reject_proof: {
					job_id: jobId,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto",
				`Reject proof for job ${jobId}`
			);

			console.log("✅ Proof rejected successfully:", result.transactionHash);
			return result;
		} catch (error: any) {
			console.error("Proof rejection failed:", error);
			throw new Error(error.message || "Failed to reject proof");
		}
	}

	async cancelJob(jobId: number): Promise<any> {
		console.log(`Cancelling job ${jobId}...`);

		try {
			const msg = {
				cancel_job: {
					job_id: jobId,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto",
				`Cancel job ${jobId}`
			);

			console.log("✅ Job cancelled successfully:", result.transactionHash);
			return result;
		} catch (error: any) {
			console.error("Job cancellation failed:", error);
			throw new Error(error.message || "Failed to cancel job");
		}
	}

	// ======= UTILITY METHODS =======

	formatEscrowAmount(amount: { denom: string; amount: string }): string {
		const amountInXion = parseInt(amount.amount) / Math.pow(10, XION_DECIMALS);
		return `${amountInXion.toFixed(2)} XION`;
	}

	parseJobStatus(status: any): JobStatus {
		if (typeof status === "string") {
			return status.toLowerCase() as JobStatus;
		}

		if (typeof status === "object" && status !== null) {
			const statusKey = Object.keys(status)[0];
			return statusKey?.toLowerCase() as JobStatus;
		}

		return "open" as JobStatus;
	}
}

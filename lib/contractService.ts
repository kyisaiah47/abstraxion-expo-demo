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
	created_at: string;
}

export interface ContractAccount {
	bech32Address: string;
}

// Use the actual abstraxion client interface
export interface ContractClient {
	queryContractSmart: (address: string, query: any) => Promise<any>;
	execute: (
		senderAddress: string,
		contractAddress: string,
		msg: any,
		fee: "auto" | number,
		memo?: string,
		funds?: readonly any[]
	) => Promise<any>;
}

export class ContractService {
	private account: ContractAccount;
	private client: ContractClient;

	constructor(account: ContractAccount, client: ContractClient) {
		this.account = account;
		this.client = client;
	}

	// ======= QUERY FUNCTIONS (FREE, NO GAS) =======

	async queryJobs(): Promise<Job[]> {
		try {
			const result = await this.client.queryContractSmart(
				CONTRACT_CONFIG.address,
				CONTRACT_MESSAGES.LIST_JOBS
			);
			return result.jobs || [];
		} catch (error) {
			console.error("Error querying jobs:", error);
			return [];
		}
	}

	async queryJob(jobId: number): Promise<Job | null> {
		try {
			const result = await this.client.queryContractSmart(
				CONTRACT_CONFIG.address,
				CONTRACT_MESSAGES.GET_JOB(jobId)
			);
			return result.job;
		} catch (error) {
			console.error("Error querying job:", error);
			return null;
		}
	}

	async queryJobsByClient(clientAddress: string): Promise<Job[]> {
		try {
			const result = await this.client.queryContractSmart(
				CONTRACT_CONFIG.address,
				CONTRACT_MESSAGES.GET_JOBS_BY_CLIENT(clientAddress)
			);
			return result.jobs || [];
		} catch (error) {
			console.error("Error querying client jobs:", error);
			return [];
		}
	}

	async queryJobsByWorker(workerAddress: string): Promise<Job[]> {
		try {
			const result = await this.client.queryContractSmart(
				CONTRACT_CONFIG.address,
				CONTRACT_MESSAGES.GET_JOBS_BY_WORKER(workerAddress)
			);
			return result.jobs || [];
		} catch (error) {
			console.error("Error querying worker jobs:", error);
			return [];
		}
	}

	// ======= EXECUTE FUNCTIONS (COST GAS) =======

	async postJob(
		description: string,
		paymentAmount: number,
		deadline?: string
	): Promise<any> {
		try {
			const msg = CONTRACT_MESSAGES.POST_JOB(description, deadline);
			const funds = [{ denom: XION_DENOM, amount: paymentAmount.toString() }];

			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto",
				"", // memo
				funds
			);
			return result;
		} catch (error) {
			console.error("Error posting job:", error);
			throw error;
		}
	}

	async acceptJob(jobId: number): Promise<any> {
		try {
			const msg = CONTRACT_MESSAGES.ACCEPT_JOB(jobId);
			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto"
			);
			return result;
		} catch (error) {
			console.error("Error accepting job:", error);
			throw error;
		}
	}

	async submitProof(jobId: number, proofText: string): Promise<any> {
		try {
			const msg = CONTRACT_MESSAGES.SUBMIT_PROOF(jobId, proofText);
			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto"
			);
			return result;
		} catch (error) {
			console.error("Error submitting proof:", error);
			throw error;
		}
	}

	async acceptProof(jobId: number): Promise<any> {
		try {
			const msg = CONTRACT_MESSAGES.ACCEPT_PROOF(jobId);
			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto"
			);
			return result;
		} catch (error) {
			console.error("Error accepting proof:", error);
			throw error;
		}
	}

	async rejectProof(jobId: number): Promise<any> {
		try {
			const msg = CONTRACT_MESSAGES.REJECT_PROOF(jobId);
			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto"
			);
			return result;
		} catch (error) {
			console.error("Error rejecting proof:", error);
			throw error;
		}
	}

	async cancelJob(jobId: number): Promise<any> {
		try {
			const msg = CONTRACT_MESSAGES.CANCEL_JOB(jobId);
			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto"
			);
			return result;
		} catch (error) {
			console.error("Error cancelling job:", error);
			throw error;
		}
	}

	// ======= HELPER FUNCTIONS =======

	calculateTotalEarnings(jobs: Job[], userAddress: string): number {
		return jobs
			.filter(
				(job) =>
					job.worker === userAddress && job.status === JobStatus.COMPLETED
			)
			.reduce((total, job) => total + parseInt(job.escrow_amount.amount), 0);
	}

	getOpenJobs(jobs: Job[]): Job[] {
		return jobs.filter((job) => job.status === JobStatus.OPEN);
	}

	getAcceptedJobs(jobs: Job[]): Job[] {
		return jobs.filter((job) => job.status === JobStatus.ACCEPTED);
	}

	getJobsWithProofSubmitted(jobs: Job[]): Job[] {
		return jobs.filter((job) => job.status === JobStatus.PROOF_SUBMITTED);
	}

	getCompletedJobs(jobs: Job[]): Job[] {
		return jobs.filter((job) => job.status === JobStatus.COMPLETED);
	}

	getUserJobs(jobs: Job[], userAddress: string): Job[] {
		return jobs.filter(
			(job) => job.client === userAddress || job.worker === userAddress
		);
	}

	getClientJobs(jobs: Job[], clientAddress: string): Job[] {
		return jobs.filter((job) => job.client === clientAddress);
	}

	getWorkerJobs(jobs: Job[], workerAddress: string): Job[] {
		return jobs.filter((job) => job.worker === workerAddress);
	}

	getActiveJobForUser(jobs: Job[], userAddress: string): Job | null {
		// Find a job where user is worker and status is Accepted or ProofSubmitted
		const activeJob = jobs.find(
			(job) =>
				job.worker === userAddress &&
				(job.status === JobStatus.ACCEPTED ||
					job.status === JobStatus.PROOF_SUBMITTED)
		);
		return activeJob || null;
	}

	// Conversion utilities
	static convertUxionToXion(uxionAmount: number): number {
		return uxionAmount / XION_DECIMALS;
	}

	static convertXionToUxion(xionAmount: number): number {
		return Math.floor(xionAmount * XION_DECIMALS);
	}

	static formatXionAmount(uxionAmount: number): string {
		const xionAmount = ContractService.convertUxionToXion(uxionAmount);
		return `${xionAmount.toFixed(2)} XION`;
	}

	// Status checks
	canAcceptJob(job: Job, userAddress: string): boolean {
		return job.status === JobStatus.OPEN && job.client !== userAddress;
	}

	canSubmitProof(job: Job, userAddress: string): boolean {
		return job.status === JobStatus.ACCEPTED && job.worker === userAddress;
	}

	canAcceptProof(job: Job, userAddress: string): boolean {
		return (
			job.status === JobStatus.PROOF_SUBMITTED && job.client === userAddress
		);
	}

	canRejectProof(job: Job, userAddress: string): boolean {
		return (
			job.status === JobStatus.PROOF_SUBMITTED && job.client === userAddress
		);
	}

	canCancelJob(job: Job, userAddress: string): boolean {
		return job.status === JobStatus.OPEN && job.client === userAddress;
	}
}

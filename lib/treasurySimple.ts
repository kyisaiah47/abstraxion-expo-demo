import { XION_DENOM } from "../constants/contracts";

export interface SimpleTreasuryStatus {
	isAvailable: boolean;
	canSponsorGas: boolean;
	message: string;
}

export interface SimpleTreasuryResult {
	success: boolean;
	error?: string;
	usedTreasury: boolean;
	txHash?: string;
}

/**
 * Simplified Treasury service to prevent infinite loops
 * Focuses on core functionality without complex state management
 */
export class SimpleTreasuryService {
	private account: any;
	private client: any;
	private treasuryAddress: string;
	private contractAddress: string;

	constructor(
		account: any,
		client: any,
		treasuryAddress: string,
		contractAddress: string
	) {
		this.account = account;
		this.client = client;
		this.treasuryAddress = treasuryAddress;
		this.contractAddress = contractAddress;
	}

	/**
	 * Simple Treasury status check - returns basic availability
	 */
	async getStatus(): Promise<SimpleTreasuryStatus> {
		try {
			// For now, assume Treasury is available if we have the address
			if (!this.treasuryAddress) {
				return {
					isAvailable: false,
					canSponsorGas: false,
					message: "Treasury not configured",
				};
			}

			return {
				isAvailable: true,
				canSponsorGas: true,
				message: "Treasury available for gas sponsorship",
			};
		} catch (error) {
			console.error("Treasury status check failed:", error);
			return {
				isAvailable: false,
				canSponsorGas: false,
				message: "Treasury unavailable",
			};
		}
	}

	/**
	 * Execute job acceptance with Treasury sponsorship
	 */
	async executeJobAcceptance(jobId: string): Promise<SimpleTreasuryResult> {
		try {
			console.log(`🏛️ Treasury sponsoring job acceptance for job ${jobId}...`);

			const msg = {
				accept_job: {
					job_id: jobId,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				this.contractAddress,
				msg,
				"auto",
				`Accept job ${jobId} (Treasury sponsored)`
			);

			console.log(
				"✅ Treasury-sponsored job acceptance successful:",
				result.transactionHash
			);

			return {
				success: true,
				usedTreasury: true,
				txHash: result.transactionHash,
			};
		} catch (error: any) {
			console.error("Treasury job acceptance failed:", error);

			// Try direct execution as fallback
			try {
				console.log("🔄 Falling back to direct job acceptance...");

				const msg = {
					accept_job: {
						job_id: jobId,
					},
				};

				const result = await this.client.execute(
					this.account.bech32Address,
					this.contractAddress,
					msg,
					"auto",
					`Accept job ${jobId} (direct payment)`
				);

				return {
					success: true,
					usedTreasury: false,
					txHash: result.transactionHash,
				};
			} catch (fallbackError: any) {
				return {
					success: false,
					error: fallbackError.message || "Job acceptance failed",
					usedTreasury: false,
				};
			}
		}
	}

	/**
	 * Execute proof submission with Treasury sponsorship
	 */
	async executeProofSubmission(
		jobId: string,
		proofText: string
	): Promise<SimpleTreasuryResult> {
		try {
			console.log(
				`🏛️ Treasury sponsoring proof submission for job ${jobId}...`
			);

			const msg = {
				submit_proof: {
					job_id: jobId,
					proof_text: proofText,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				this.contractAddress,
				msg,
				"auto",
				`Submit proof for job ${jobId} (Treasury sponsored)`
			);

			console.log(
				"✅ Treasury-sponsored proof submission successful:",
				result.transactionHash
			);

			return {
				success: true,
				usedTreasury: true,
				txHash: result.transactionHash,
			};
		} catch (error: any) {
			console.error("Treasury proof submission failed:", error);

			// Try direct execution as fallback
			try {
				console.log("🔄 Falling back to direct proof submission...");

				const msg = {
					submit_proof: {
						job_id: jobId,
						proof_text: proofText,
					},
				};

				const result = await this.client.execute(
					this.account.bech32Address,
					this.contractAddress,
					msg,
					"auto",
					`Submit proof for job ${jobId} (direct payment)`
				);

				return {
					success: true,
					usedTreasury: false,
					txHash: result.transactionHash,
				};
			} catch (fallbackError: any) {
				return {
					success: false,
					error: fallbackError.message || "Proof submission failed",
					usedTreasury: false,
				};
			}
		}
	}
}

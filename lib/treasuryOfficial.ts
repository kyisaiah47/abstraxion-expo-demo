import { TREASURY_CONFIG, XION_DENOM } from "../constants/contracts";

export interface TreasuryConfig {
	treasury: string;
	rpcUrl?: string;
	restUrl?: string;
}

export interface TreasuryStatus {
	isConnected: boolean;
	hasPermissions: boolean;
	canSponsorGas: boolean;
	balance?: number;
	lastChecked: Date;
}

export interface TreasuryExecuteResult {
	success: boolean;
	error?: string;
	txHash?: string;
	gasSponsored: boolean;
}

/**
 * Treasury Service following Burnt's official documentation
 * https://docs.burnt.com/xion/developers/getting-started-advanced/gasless-ux-and-permission-grants/treasury-contracts
 */
export class TreasuryService {
	private treasuryAddress: string;
	private account: any;
	private client: any;
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
	 * Check Treasury status - simplified to prevent infinite loops
	 */
	async getTreasuryStatus(): Promise<TreasuryStatus> {
		try {
			// Simple check - assume Treasury is available if address is configured
			const isConnected = !!this.treasuryAddress;

			return {
				isConnected,
				hasPermissions: isConnected, // Assume permissions are granted
				canSponsorGas: isConnected,
				balance: 0, // Don't query balance to avoid infinite loops
				lastChecked: new Date(),
			};
		} catch (error) {
			console.error("Treasury status check failed:", error);
			return {
				isConnected: false,
				hasPermissions: false,
				canSponsorGas: false,
				lastChecked: new Date(),
			};
		}
	}

	/**
	 * Execute transaction with Treasury gas sponsorship
	 * Following official documentation pattern
	 */
	async executeWithTreasury(
		msg: any,
		memo: string = ""
	): Promise<TreasuryExecuteResult> {
		try {
			console.log("🏛️ Executing transaction with Treasury gas sponsorship...");

			// Following the official documentation pattern for Treasury gas sponsorship
			const result = await this.client.execute(
				this.account.bech32Address,
				this.contractAddress,
				msg,
				{
					amount: [{ amount: "1", denom: XION_DENOM }],
					gas: "500000",
					granter: this.treasuryAddress, // Treasury sponsors the gas
				},
				memo,
				[]
			);

			console.log(
				"✅ Treasury-sponsored transaction successful:",
				result.transactionHash
			);

			return {
				success: true,
				txHash: result.transactionHash,
				gasSponsored: true,
			};
		} catch (error: any) {
			console.error("Treasury-sponsored transaction failed:", error);

			// Fallback to regular execution if Treasury fails
			try {
				console.log("🔄 Falling back to regular transaction...");

				const fallbackResult = await this.client.execute(
					this.account.bech32Address,
					this.contractAddress,
					msg,
					"auto",
					memo
				);

				return {
					success: true,
					txHash: fallbackResult.transactionHash,
					gasSponsored: false,
				};
			} catch (fallbackError: any) {
				return {
					success: false,
					error: fallbackError.message || "Transaction failed",
					gasSponsored: false,
				};
			}
		}
	}

	/**
	 * Job acceptance with Treasury sponsorship
	 */
	async executeJobAcceptance(jobId: number): Promise<TreasuryExecuteResult> {
		const msg = {
			accept_job: {
				job_id: jobId,
			},
		};

		return this.executeWithTreasury(msg, `Accept job ${jobId}`);
	}

	/**
	 * Proof submission with Treasury sponsorship
	 */
	async executeProofSubmission(
		jobId: number,
		proofText: string
	): Promise<TreasuryExecuteResult> {
		const msg = {
			submit_proof: {
				job_id: jobId,
				proof_text: proofText,
			},
		};

		return this.executeWithTreasury(msg, `Submit proof for job ${jobId}`);
	}

	/**
	 * Proof acceptance with Treasury sponsorship
	 */
	async executeProofAcceptance(jobId: number): Promise<TreasuryExecuteResult> {
		const msg = {
			accept_proof: {
				job_id: jobId,
			},
		};

		return this.executeWithTreasury(msg, `Accept proof for job ${jobId}`);
	}

	/**
	 * Proof rejection with Treasury sponsorship
	 */
	async executeProofRejection(jobId: number): Promise<TreasuryExecuteResult> {
		const msg = {
			reject_proof: {
				job_id: jobId,
			},
		};

		return this.executeWithTreasury(msg, `Reject proof for job ${jobId}`);
	}

	/**
	 * Job cancellation with Treasury sponsorship
	 */
	async executeJobCancellation(jobId: number): Promise<TreasuryExecuteResult> {
		const msg = {
			cancel_job: {
				job_id: jobId,
			},
		};

		return this.executeWithTreasury(msg, `Cancel job ${jobId}`);
	}
}

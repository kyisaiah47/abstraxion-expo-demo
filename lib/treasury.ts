import { XION_DENOM, XION_DECIMALS } from "../constants/contracts";

export interface TreasuryBalance {
	amount: string;
	denom: string;
}

export interface TreasuryConfig {
	address: string;
	minBalanceThreshold: number; // in XION
	gasEstimate: number; // estimated gas cost per transaction in uxion
}

export interface TreasuryAccount {
	bech32Address: string;
}

export interface TreasuryClient {
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

export interface TreasuryExecuteResult {
	success: boolean;
	transactionHash?: string;
	error?: string;
	gasUsed?: string;
	usedTreasury: boolean;
}

export interface TreasuryStatus {
	isAvailable: boolean;
	balance: number; // in XION
	canSponsorGas: boolean;
	estimatedTransactionsLeft: number;
	lastChecked: Date;
}

/**
 * Treasury Service for managing gasless transactions in XION
 * Routes user contract interactions through Treasury contract for gas sponsorship
 */
export class TreasuryService {
	private account: TreasuryAccount;
	private client: TreasuryClient;
	private config: TreasuryConfig;
	private contractAddress: string; // The proof-of-work contract address

	constructor(
		account: TreasuryAccount,
		client: TreasuryClient,
		treasuryAddress: string,
		contractAddress: string
	) {
		this.account = account;
		this.client = client;
		this.contractAddress = contractAddress;
		this.config = {
			address: treasuryAddress,
			minBalanceThreshold: 1.0, // 1 XION minimum
			gasEstimate: 200000, // ~0.2 XION per transaction estimate
		};
	}

	// ======= TREASURY STATUS AND MONITORING =======

	/**
	 * Check Treasury balance and availability
	 */
	async getTreasuryStatus(): Promise<TreasuryStatus> {
		try {
			const balance = await this.getTreasuryBalance();
			const canSponsorGas = balance >= this.config.minBalanceThreshold;
			const estimatedTransactionsLeft = Math.floor(
				(balance * XION_DECIMALS) / this.config.gasEstimate
			);

			return {
				isAvailable: true,
				balance,
				canSponsorGas,
				estimatedTransactionsLeft,
				lastChecked: new Date(),
			};
		} catch (error) {
			console.error("Failed to check Treasury status:", error);
			return {
				isAvailable: false,
				balance: 0,
				canSponsorGas: false,
				estimatedTransactionsLeft: 0,
				lastChecked: new Date(),
			};
		}
	}

	/**
	 * Get Treasury contract balance
	 */
	async getTreasuryBalance(): Promise<number> {
		try {
			const result = await this.client.queryContractSmart(this.config.address, {
				get_balance: {},
			});

			if (result.balance) {
				return this.convertUxionToXion(parseInt(result.balance.amount));
			}
			return 0;
		} catch (error) {
			console.error("Failed to get Treasury balance:", error);
			return 0;
		}
	}

	/**
	 * Check if Treasury can sponsor a specific operation
	 */
	async canSponsorTransaction(gasEstimate?: number): Promise<boolean> {
		try {
			const status = await this.getTreasuryStatus();
			const requiredGas = gasEstimate || this.config.gasEstimate;
			const requiredXion = this.convertUxionToXion(requiredGas);

			return status.canSponsorGas && status.balance >= requiredXion;
		} catch (error) {
			console.error("Failed to check Treasury sponsorship capability:", error);
			return false;
		}
	}

	// ======= GASLESS CONTRACT EXECUTIONS =======

	/**
	 * Execute job acceptance through Treasury (gasless)
	 */
	async executeJobAcceptance(jobId: number): Promise<TreasuryExecuteResult> {
		try {
			console.log(`🏦 Executing job acceptance ${jobId} through Treasury...`);

			// Check Treasury status first
			const canSponsor = await this.canSponsorTransaction();
			if (!canSponsor) {
				return await this.fallbackToDirectPayment("accept_job", {
					job_id: jobId,
				});
			}

			// Route through Treasury contract
			const treasuryMsg = {
				execute_job_acceptance: {
					job_id: jobId,
					user_address: this.account.bech32Address,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				this.config.address,
				treasuryMsg,
				"auto",
				`Gasless job acceptance ${jobId}`
			);

			console.log(
				"✅ Job acceptance executed through Treasury:",
				result.transactionHash
			);

			return {
				success: true,
				transactionHash: result.transactionHash,
				usedTreasury: true,
				gasUsed: result.gasUsed?.toString(),
			};
		} catch (error: any) {
			console.error("Treasury job acceptance failed:", error);

			// Fallback to direct payment if Treasury fails
			console.log("🔄 Falling back to direct payment...");
			return await this.fallbackToDirectPayment("accept_job", {
				job_id: jobId,
			});
		}
	}

	/**
	 * Execute proof submission through Treasury (gasless)
	 */
	async executeProofSubmission(
		jobId: number,
		proof: string
	): Promise<TreasuryExecuteResult> {
		try {
			console.log(`🏦 Executing proof submission ${jobId} through Treasury...`);

			const canSponsor = await this.canSponsorTransaction();
			if (!canSponsor) {
				return await this.fallbackToDirectPayment("submit_proof", {
					job_id: jobId,
					proof,
				});
			}

			const treasuryMsg = {
				execute_proof_submission: {
					job_id: jobId,
					proof,
					user_address: this.account.bech32Address,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				this.config.address,
				treasuryMsg,
				"auto",
				`Gasless proof submission ${jobId}`
			);

			console.log(
				"✅ Proof submission executed through Treasury:",
				result.transactionHash
			);

			return {
				success: true,
				transactionHash: result.transactionHash,
				usedTreasury: true,
				gasUsed: result.gasUsed?.toString(),
			};
		} catch (error: any) {
			console.error("Treasury proof submission failed:", error);

			return await this.fallbackToDirectPayment("submit_proof", {
				job_id: jobId,
				proof,
			});
		}
	}

	/**
	 * Execute payment release through Treasury (gasless)
	 */
	async executePaymentRelease(jobId: number): Promise<TreasuryExecuteResult> {
		try {
			console.log(`🏦 Executing payment release ${jobId} through Treasury...`);

			const canSponsor = await this.canSponsorTransaction();
			if (!canSponsor) {
				return await this.fallbackToDirectPayment("accept_proof", {
					job_id: jobId,
				});
			}

			const treasuryMsg = {
				execute_payment_release: {
					job_id: jobId,
					user_address: this.account.bech32Address,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				this.config.address,
				treasuryMsg,
				"auto",
				`Gasless payment release ${jobId}`
			);

			console.log(
				"✅ Payment release executed through Treasury:",
				result.transactionHash
			);

			return {
				success: true,
				transactionHash: result.transactionHash,
				usedTreasury: true,
				gasUsed: result.gasUsed?.toString(),
			};
		} catch (error: any) {
			console.error("Treasury payment release failed:", error);

			return await this.fallbackToDirectPayment("accept_proof", {
				job_id: jobId,
			});
		}
	}

	/**
	 * Execute job rejection through Treasury (gasless)
	 */
	async executeJobRejection(jobId: number): Promise<TreasuryExecuteResult> {
		try {
			console.log(`🏦 Executing job rejection ${jobId} through Treasury...`);

			const canSponsor = await this.canSponsorTransaction();
			if (!canSponsor) {
				return await this.fallbackToDirectPayment("reject_proof", {
					job_id: jobId,
				});
			}

			const treasuryMsg = {
				execute_job_rejection: {
					job_id: jobId,
					user_address: this.account.bech32Address,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				this.config.address,
				treasuryMsg,
				"auto",
				`Gasless job rejection ${jobId}`
			);

			console.log(
				"✅ Job rejection executed through Treasury:",
				result.transactionHash
			);

			return {
				success: true,
				transactionHash: result.transactionHash,
				usedTreasury: true,
				gasUsed: result.gasUsed?.toString(),
			};
		} catch (error: any) {
			console.error("Treasury job rejection failed:", error);

			return await this.fallbackToDirectPayment("reject_proof", {
				job_id: jobId,
			});
		}
	}

	/**
	 * Execute job cancellation through Treasury (gasless)
	 */
	async executeJobCancellation(jobId: number): Promise<TreasuryExecuteResult> {
		try {
			console.log(`🏦 Executing job cancellation ${jobId} through Treasury...`);

			const canSponsor = await this.canSponsorTransaction();
			if (!canSponsor) {
				return await this.fallbackToDirectPayment("cancel_job", {
					job_id: jobId,
				});
			}

			const treasuryMsg = {
				execute_job_cancellation: {
					job_id: jobId,
					user_address: this.account.bech32Address,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				this.config.address,
				treasuryMsg,
				"auto",
				`Gasless job cancellation ${jobId}`
			);

			console.log(
				"✅ Job cancellation executed through Treasury:",
				result.transactionHash
			);

			return {
				success: true,
				transactionHash: result.transactionHash,
				usedTreasury: true,
				gasUsed: result.gasUsed?.toString(),
			};
		} catch (error: any) {
			console.error("Treasury job cancellation failed:", error);

			return await this.fallbackToDirectPayment("cancel_job", {
				job_id: jobId,
			});
		}
	}

	// ======= FALLBACK METHODS =======

	/**
	 * Fallback to direct payment when Treasury cannot sponsor
	 */
	private async fallbackToDirectPayment(
		action: string,
		params: any
	): Promise<TreasuryExecuteResult> {
		try {
			console.log(
				`💳 Using direct payment for ${action} (Treasury unavailable)`
			);

			const msg = { [action]: params };

			const result = await this.client.execute(
				this.account.bech32Address,
				this.contractAddress,
				msg,
				"auto",
				`Direct payment ${action}`
			);

			return {
				success: true,
				transactionHash: result.transactionHash,
				usedTreasury: false,
				gasUsed: result.gasUsed?.toString(),
			};
		} catch (error: any) {
			console.error(`Direct payment ${action} failed:`, error);

			let errorMessage = error.message || "Unknown error";

			// Provide specific error messages for common issues
			if (errorMessage.includes("insufficient funds")) {
				errorMessage =
					"Insufficient funds for gas fees. Treasury is also unavailable.";
			} else if (errorMessage.includes("unauthorized")) {
				errorMessage = "Transaction unauthorized. Check wallet connection.";
			}

			return {
				success: false,
				error: errorMessage,
				usedTreasury: false,
			};
		}
	}

	// ======= ADMIN FUNCTIONS =======

	/**
	 * Fund Treasury contract (admin only)
	 */
	async fundTreasury(amount: number): Promise<TreasuryExecuteResult> {
		try {
			console.log(`💰 Funding Treasury with ${amount} XION...`);

			const amountUxion = this.convertXionToUxion(amount);
			const funds = [{ denom: XION_DENOM, amount: amountUxion.toString() }];

			const msg = { fund_treasury: {} };

			const result = await this.client.execute(
				this.account.bech32Address,
				this.config.address,
				msg,
				"auto",
				`Fund Treasury with ${amount} XION`,
				funds
			);

			console.log("✅ Treasury funded successfully:", result.transactionHash);

			return {
				success: true,
				transactionHash: result.transactionHash,
				usedTreasury: false, // This is funding the Treasury
			};
		} catch (error: any) {
			console.error("Treasury funding failed:", error);

			return {
				success: false,
				error: error.message || "Failed to fund Treasury",
				usedTreasury: false,
			};
		}
	}

	/**
	 * Withdraw from Treasury contract (admin only)
	 */
	async withdrawFromTreasury(amount: number): Promise<TreasuryExecuteResult> {
		try {
			console.log(`💸 Withdrawing ${amount} XION from Treasury...`);

			const amountUxion = this.convertXionToUxion(amount);

			const msg = {
				withdraw_treasury: {
					amount: amountUxion.toString(),
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				this.config.address,
				msg,
				"auto",
				`Withdraw ${amount} XION from Treasury`
			);

			console.log("✅ Treasury withdrawal successful:", result.transactionHash);

			return {
				success: true,
				transactionHash: result.transactionHash,
				usedTreasury: false,
			};
		} catch (error: any) {
			console.error("Treasury withdrawal failed:", error);

			return {
				success: false,
				error: error.message || "Failed to withdraw from Treasury",
				usedTreasury: false,
			};
		}
	}

	// ======= UTILITY FUNCTIONS =======

	/**
	 * Convert uxion to XION
	 */
	private convertUxionToXion(uxionAmount: number): number {
		return uxionAmount / XION_DECIMALS;
	}

	/**
	 * Convert XION to uxion
	 */
	private convertXionToUxion(xionAmount: number): number {
		return Math.floor(xionAmount * XION_DECIMALS);
	}

	/**
	 * Format XION amount for display
	 */
	static formatXionAmount(uxionAmount: number): string {
		const xionAmount = uxionAmount / XION_DECIMALS;
		return `${xionAmount.toFixed(2)} XION`;
	}

	/**
	 * Get Treasury configuration
	 */
	getTreasuryConfig(): TreasuryConfig {
		return { ...this.config };
	}

	/**
	 * Update Treasury configuration
	 */
	updateTreasuryConfig(updates: Partial<TreasuryConfig>): void {
		this.config = { ...this.config, ...updates };
	}

	// ======= ERROR HANDLING HELPERS =======

	/**
	 * Determine if error is due to Treasury or user funds
	 */
	static categorizeError(error: string): "treasury" | "user" | "other" {
		const lowerError = error.toLowerCase();

		if (
			lowerError.includes("treasury") &&
			lowerError.includes("insufficient")
		) {
			return "treasury";
		}

		if (
			lowerError.includes("insufficient funds") ||
			lowerError.includes("insufficient balance")
		) {
			return "user";
		}

		return "other";
	}

	/**
	 * Get user-friendly error message
	 */
	static getErrorMessage(error: string, usedTreasury: boolean): string {
		const category = TreasuryService.categorizeError(error);

		switch (category) {
			case "treasury":
				return "Treasury has insufficient funds to sponsor this transaction. Please contact the administrator or pay gas fees directly.";
			case "user":
				if (usedTreasury) {
					return "Transaction failed despite Treasury sponsorship. Please try again.";
				} else {
					return "Insufficient funds for gas fees. Treasury is also unavailable.";
				}
			default:
				return error;
		}
	}
}

import { CONTRACT_CONFIG } from "../constants/contracts";

export type ContractClient = any;

export class ContractService {
	private account: any;
	private client: ContractClient;

	constructor(account: any, client: ContractClient) {
		this.account = account;
		this.client = client;
	}

	// ======= PAYMENT ACTIONS =======

	async sendPayment(amount: string, recipient: string): Promise<any> {
		console.log(`💰 Sending payment of ${amount} to ${recipient}...`);

		try {
			const msg = {
				send_payment: {
					amount,
					recipient,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto",
				`Send payment of ${amount} to ${recipient}`
			);

			console.log("✅ Payment sent successfully:", result.transactionHash);
			return result;
		} catch (error: any) {
			console.error("Payment sending failed:", error);
			throw new Error(error.message || "Failed to send payment");
		}
	}

	async withdrawFunds(amount: string): Promise<any> {
		console.log(`🏦 Withdrawing funds: ${amount}...`);

		try {
			const msg = {
				withdraw_funds: {
					amount,
				},
			};

			const result = await this.client.execute(
				this.account.bech32Address,
				CONTRACT_CONFIG.address,
				msg,
				"auto",
				`Withdraw funds: ${amount}`
			);

			console.log("✅ Funds withdrawn successfully:", result.transactionHash);
			return result;
		} catch (error: any) {
			console.error("Funds withdrawal failed:", error);
			throw new Error(error.message || "Failed to withdraw funds");
		}
	}

	async getBalance(address: string): Promise<any> {
		try {
			console.log(`🔍 Fetching balance for ${address}...`);
			const result = await this.client.queryContractSmart(
				CONTRACT_CONFIG.address,
				{ get_balance: { address } }
			);

			return result.balance || null;
		} catch (error: any) {
			console.error(`Failed to fetch balance for ${address}:`, error);
			return null;
		}
	}

	// ======= UTILITY METHODS =======

	formatAmount(amount: string): string {
		return `${parseFloat(amount).toFixed(2)} XION`;
	}
}

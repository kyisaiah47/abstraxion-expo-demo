import {
	SigningCosmWasmClient,
	CosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";

// RPC endpoint and contract address
export const EXPO_PUBLIC_RPC_ENDPOINT =
	process.env.EXPO_PUBLIC_RPC_ENDPOINT ||
	"https://rpc.xion-testnet-2.burnt.com:443";
export const EXPO_PUBLIC_REST_ENDPOINT =
	process.env.EXPO_PUBLIC_REST_ENDPOINT ||
	"https://api.xion-testnet-2.burnt.com:443";
export const SOCIAL_CONTRACT_ADDRESS =
	process.env.EXPO_PUBLIC_CONTRACT_ADDRESS ||
	"xion1lxcdce37k8n4zyanq3ne5uw958cj0r6mnrr4kdpzrylvsanfcvpq0gzrxy";

// Add logging to verify the contract address being used
console.log("Using contract address:", SOCIAL_CONTRACT_ADDRESS);
console.log("Environment variables:", process.env);

// User interface
export interface User {
	username: string;
	wallet_address: string;
	display_name?: string;
	profile_picture?: string;
}

// PaymentType enum
export enum PaymentType {
	DirectPayment = "DirectPayment",
	PaymentRequest = "PaymentRequest",
	HelpRequest = "HelpRequest",
}

// ProofType enum
export enum ProofType {
	None = "None",
	Text = "Text",
	Photo = "Photo",
	Document = "Document",
	Location = "Location",
	ZkTLS = "ZkTLS",
	Manual = "Manual",
}

// PaymentStatus enum
export enum PaymentStatus {
	Pending = "Pending",
	Completed = "Completed",
	Rejected = "Rejected",
	Cancelled = "Cancelled",
}

// Payment interface
export interface Payment {
	id: string;
	from_username: string;
	to_username: string;
	amount: string; // in uXION
	description?: string;
	payment_type: PaymentType;
	proof_type: ProofType;
	status: PaymentStatus;
}

// Helper functions
export function formatXionAmount(amount: string | number): string {
	// Converts XION to uXION (1 XION = 1,000,000 uXION)
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	return Math.round(num * 1_000_000).toString();
}

export function formatUsername(username: string): string {
	// Ensures username is lowercase and trimmed
	return username.trim().toLowerCase();
}

export class SocialPaymentContract {
	client: CosmWasmClient | SigningCosmWasmClient;
	contractAddress: string;

	constructor(
		client: CosmWasmClient | SigningCosmWasmClient,
		contractAddress: string = SOCIAL_CONTRACT_ADDRESS
	) {
		this.client = client;
		this.contractAddress = contractAddress;
	}

	// User registration
	async registerUser(user: User, sender: string) {
		if (!(this.client instanceof SigningCosmWasmClient))
			throw new Error("Client must be SigningCosmWasmClient for writes");
		return await this.client.execute(
			sender,
			this.contractAddress,
			{
				register_user: {
					username: formatUsername(user.username),
					display_name: user.display_name,
					profile_picture: user.profile_picture,
				},
			},
			"auto"
		);
	}

	// Friend requests
	async sendFriendRequest(from: string, to_username: string) {
		if (!(this.client instanceof SigningCosmWasmClient))
			throw new Error("Client must be SigningCosmWasmClient for writes");
		return await this.client.execute(
			from,
			this.contractAddress,
			{
				send_friend_request: {
					to_username: formatUsername(to_username),
				},
			},
			"auto"
		);
	}

	async acceptFriendRequest(from: string, requester_username: string) {
		if (!(this.client instanceof SigningCosmWasmClient))
			throw new Error("Client must be SigningCosmWasmClient for writes");
		return await this.client.execute(
			from,
			this.contractAddress,
			{
				accept_friend_request: {
					requester_username: formatUsername(requester_username),
				},
			},
			"auto"
		);
	}

	// Payments
	async sendDirectPayment(
		from: string,
		payment: Omit<Payment, "id" | "status">
	) {
		if (!(this.client instanceof SigningCosmWasmClient))
			throw new Error("Client must be SigningCosmWasmClient for writes");
		return await this.client.execute(
			from,
			this.contractAddress,
			{
				send_direct_payment: {
					to_username: formatUsername(payment.to_username),
					amount: payment.amount,
					description: payment.description,
					payment_type: payment.payment_type,
					proof_type: payment.proof_type,
				},
			},
			"auto"
		);
	}

	async createPaymentRequest(
		from: string,
		payment: Omit<Payment, "id" | "status">
	) {
		if (!(this.client instanceof SigningCosmWasmClient))
			throw new Error("Client must be SigningCosmWasmClient for writes");
		return await this.client.execute(
			from,
			this.contractAddress,
			{
				create_payment_request: {
					to_username: formatUsername(payment.to_username),
					amount: payment.amount,
					description: payment.description,
					payment_type: payment.payment_type,
					proof_type: payment.proof_type,
				},
			},
			"auto"
		);
	}

	async createHelpRequest(
		from: string,
		payment: Omit<Payment, "id" | "status">
	) {
		if (!(this.client instanceof SigningCosmWasmClient))
			throw new Error("Client must be SigningCosmWasmClient for writes");
		return await this.client.execute(
			from,
			this.contractAddress,
			{
				create_help_request: {
					to_username: formatUsername(payment.to_username),
					amount: payment.amount,
					description: payment.description,
					payment_type: payment.payment_type,
					proof_type: payment.proof_type,
				},
			},
			"auto"
		);
	}

	async submitProof(
		from: string,
		paymentId: string,
		proof: { type: ProofType; data?: string }
	) {
		if (!(this.client instanceof SigningCosmWasmClient))
			throw new Error("Client must be SigningCosmWasmClient for writes");
		return await this.client.execute(
			from,
			this.contractAddress,
			{
				submit_proof: {
					payment_id: paymentId,
					proof_type: proof.type,
					proof_data: proof.data,
				},
			},
			"auto"
		);
	}

	// Read-only queries (updated to match contract interface)
	async getUserByUsername(username: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_user_by_username: { username: formatUsername(username) },
		});
	}

	async getUserByWallet(wallet: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_user_by_wallet: { wallet },
		});
	}

	async isUsernameAvailable(username: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			is_username_available: { username: formatUsername(username) },
		});
	}

	async searchUsers(query: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			search_users: { query },
		});
	}

	async getUsernameByWallet(wallet: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_username_by_wallet: { wallet },
		});
	}

	async getWalletByUsername(username: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_wallet_by_username: { username: formatUsername(username) },
		});
	}

	async hasUsername(wallet: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			has_username: { wallet },
		});
	}

	async getUserFriends(username: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_user_friends: { username: formatUsername(username) },
		});
	}

	async getPendingRequests(username: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_pending_requests: { username: formatUsername(username) },
		});
	}

	async areFriends(userA: string, userB: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			are_friends: {
				username_a: formatUsername(userA),
				username_b: formatUsername(userB),
			},
		});
	}

	async getPaymentById(paymentId: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_payment_by_id: { payment_id: paymentId },
		});
	}

	async getPaymentHistory(username: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_payment_history: { username: formatUsername(username) },
		});
	}

	async getPendingPayments(username: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_pending_payments: { username: formatUsername(username) },
		});
	}
}

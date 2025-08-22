import {
	SigningCosmWasmClient,
	CosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";

// RPC endpoint and contract address
export const XION_RPC_ENDPOINT = "https://testnet-rpc.xion-api.com:443";
export const SOCIAL_CONTRACT_ADDRESS =
	"xion1gk050spal94tpjw0lvfdkzdm0ef837peh8wy025c74jwy07vwe9q4z0nty";

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

	// Read-only queries
	async getUser(username: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_user: { username: formatUsername(username) },
		});
	}

	async getPayment(paymentId: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_payment: { payment_id: paymentId },
		});
	}

	async getPaymentsByUser(username: string) {
		return await this.client.queryContractSmart(this.contractAddress, {
			get_payments_by_user: { username: formatUsername(username) },
		});
	}
}

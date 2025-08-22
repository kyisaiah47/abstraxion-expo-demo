// ProofPay Core Types
export type ProofStatus = "Proof Confirmed" | "Awaiting Proof" | "Payment Sent";

export interface Payment {
	id: string;
	title: string;
	subtitle: string;
	amount: number;
	direction: "in" | "out";
	status: ProofStatus;
	timeAgo: string;
}

export interface UserWallet {
	address: string;
	ens?: string;
	chain: "XION" | "EVM";
	activeSince: Date;
}

export interface UserStats {
	tasksCompleted: number;
	totalEarned: number;
	awaitingAmount: number;
	proofConfirmed: number;
	totalProofs: number;
	verifiedBalance: number;
	awaitingProofs: number;
	activeSince: Date;
}

export interface TaskFormData {
	description: string;
	reward: number;
	deadline?: string;
	proofType?: "text" | "photo" | "zktls";
}

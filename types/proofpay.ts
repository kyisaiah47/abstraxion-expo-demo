// ProofPay Core Types
export type ProofStatus = "Proof Confirmed" | "Awaiting Proof" | "Payment Sent";
export type PaymentType = "request_help" | "request_money" | "send_money";
export type ProofType = "none" | "text" | "photo" | "zktls";
export type FriendshipStatus = "pending" | "accepted" | "declined";

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

// New Social System Types
export interface User {
	id: string;
	walletAddress: string;
	username: string;
	displayName: string;
	profilePicture?: string;
	createdAt: Date;
}

export interface Friendship {
	id: string;
	user1: string; // User ID
	user2: string; // User ID
	createdAt: Date;
}

export interface FriendRequest {
	id: string;
	fromUser: string; // User ID
	toUser: string; // User ID
	status: FriendshipStatus;
	createdAt: Date;
}

export interface SocialPayment {
	id: string;
	type: PaymentType;
	fromUser: string; // User ID
	toUser: string; // User ID
	amount: number;
	description: string;
	proofType: ProofType;
	status: "pending" | "completed" | "cancelled";
	proofSubmission?: {
		type: ProofType;
		content: string; // text description, photo URL, or zkTLS proof
		submittedAt: Date;
	};
	createdAt: Date;
	completedAt?: Date;
}

// Updated form data for social payments
export interface PaymentFormData {
	type: PaymentType;
	recipientUserId?: string;
	amount: number;
	description: string;
	proofType: ProofType;
}

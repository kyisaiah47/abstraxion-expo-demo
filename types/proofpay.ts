// ProofPay Core Types
export type ProofStatus = "Proof Confirmed" | "Awaiting Proof" | "Payment Sent";
export type PaymentType = "request_task" | "request_money" | "send_money";
export type ProofType = "soft" | "zktls" | "hybrid";
export type TaskStatus = "pending" | "proof_submitted" | "pending_release" | "released" | "disputed" | "refunded";
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
	proofType: ProofType;
	endpoint?: string; // For zktls/hybrid tasks
	reviewWindow?: number; // Hours for hybrid tasks, default 24
}

export interface Task {
	id: string;
	creator: string; // wallet address
	worker?: string; // wallet address
	amount: number;
	description: string;
	proofType: ProofType;
	status: TaskStatus;
	endpoint?: string;
	reviewWindow?: number;
	createdAt: Date;
	submittedAt?: Date;
	releasedAt?: Date;
	disputedAt?: Date;
	proofHash?: string;
	evidenceUrl?: string;
}

export interface DisputeData {
	taskId: string;
	reason: string;
	evidenceUrl?: string;
	evidenceHash?: string;
	createdAt: Date;
}

export type NotificationType = 
	| "task_created" 
	| "proof_submitted" 
	| "pending_release_started"
	| "task_released"
	| "task_disputed"
	| "task_refunded";

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	taskId?: string;
	createdAt: Date;
	read: boolean;
}

// New Social System Types
export interface User {
	id?: string;
	wallet_address: string;
	username: string;
	display_name: string;
	profile_picture?: string | null;
	created_at: number;
	updated_at?: number;
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

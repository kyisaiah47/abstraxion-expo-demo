import { useState, useCallback, useEffect } from "react";
import { SocialPaymentContract, User, Payment } from "../lib/socialContract";
import {
	CosmWasmClient,
	SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";

// Ensure EXPO_PUBLIC_RPC_ENDPOINT is defined only once
const EXPO_PUBLIC_RPC_ENDPOINT = process.env.EXPO_PUBLIC_RPC_ENDPOINT || "";
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS || "";

// Payment detail hook
export function usePaymentDetail(paymentId: string) {
	const [payment, setPayment] = useState<Payment | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.getPaymentById(paymentId);
			setPayment(result.payment || null);
		} catch (e: any) {
			setError(e.message);
			setPayment(null);
		} finally {
			setLoading(false);
		}
	}, [paymentId]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	return { payment, loading, error, refetch: fetch };
}

// Helper to create a read-only contract instance
async function getReadClient() {
	return await CosmWasmClient.connect(EXPO_PUBLIC_RPC_ENDPOINT);
}

// Helper to create a write-enabled contract instance
export async function getWriteClient(signer: any) {
	const gasPrice = GasPrice.fromString("0.025uxion");

	return await SigningCosmWasmClient.connectWithSigner(
		EXPO_PUBLIC_RPC_ENDPOINT,
		signer,
		{
			gasPrice: gasPrice,
		}
	);
}
// useUserProfile: get user profile by wallet address
export function useUserProfile(address: string) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.getUserByWallet(address);
			setUser(result.user || null);
		} catch (e: any) {
			setError(e.message);
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, [address]);

	return { user, loading, error, refetch: fetch };
}

// useUserByUsername: get user by username
export function useUserByUsername(username: string) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.getUserByUsername(username);
			setUser(result.user || null);
		} catch (e: any) {
			setError(e.message);
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, [username]);

	return { user, loading, error, refetch: fetch };
}

// useIsUsernameAvailable: check username availability
export function useIsUsernameAvailable(username: string) {
	const [available, setAvailable] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			console.log("Checking username availability for:", username);
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.isUsernameAvailable(username);
			console.log("Contract query result:", result);
			setAvailable(result.available ?? null);
		} catch (e: any) {
			console.error("Error checking username availability:", e.message);
			setError(e.message);
			setAvailable(null);
		} finally {
			setLoading(false);
		}
	}, [username]);

	return { available, loading, error, refetch: fetch };
}

// useUserFriends: get user's friends list
export function useUserFriends(username: string) {
	const [friends, setFriends] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.getUserFriends(username);
			setFriends(result.friends || []);
		} catch (e: any) {
			setError(e.message);
			setFriends([]);
		} finally {
			setLoading(false);
		}
	}, [username]);

	return { friends, loading, error, refetch: fetch };
}

// usePendingFriendRequests: get pending friend requests
export function usePendingFriendRequests(username: string) {
	const [requests, setRequests] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.getPendingRequests(username);
			setRequests(result.requests || []);
		} catch (e: any) {
			setError(e.message);
			setRequests([]);
		} finally {
			setLoading(false);
		}
	}, [username]);

	return { requests, loading, error, refetch: fetch };
}

// usePaymentHistory: get user's payment history
export function usePaymentHistory(username: string) {
	const [payments, setPayments] = useState<Payment[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.getPaymentHistory(username);
			setPayments(result.payments || []);
		} catch (e: any) {
			setError(e.message);
			setPayments([]);
		} finally {
			setLoading(false);
		}
	}, [username]);

	return { payments, loading, error, refetch: fetch };
}

// usePendingPayments: get pending payments requiring action
export function usePendingPayments(username: string) {
	const [pending, setPending] = useState<Payment[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.getPendingPayments(username);
			setPending(result.payments || []);
		} catch (e: any) {
			setError(e.message);
			setPending([]);
		} finally {
			setLoading(false);
		}
	}, [username]);

	return { pending, loading, error, refetch: fetch };
}

// Ensure `signer` is passed correctly to `getContract`
export function useSocialOperations(signingClient: any) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Register user
	const registerUser = useCallback(
		async (username: string, senderAddress: string) => {
			if (!signingClient) {
				throw new Error("Signing client not available");
			}

			setLoading(true);
			setError(null);
			try {
				// Use the Abstraxion signing client directly!
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						register_user: {
							username,
							display_name: username,
							profile_picture: "",
						},
					},
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[signingClient]
	);

	// Send friend request
	const sendFriendRequest = useCallback(
		async (toUsername: string, senderAddress: string) => {
			if (!signingClient) {
				throw new Error("Signing client not available");
			}

			setLoading(true);
			setError(null);
			try {
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						send_friend_request: {
							to_username: toUsername,
						},
					},
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[signingClient]
	);

	// Accept friend request
	const acceptFriendRequest = useCallback(
		async (requesterUsername: string, senderAddress: string) => {
			if (!signingClient) {
				throw new Error("Signing client not available");
			}

			setLoading(true);
			setError(null);
			try {
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						accept_friend_request: {
							requester_username: requesterUsername,
						},
					},
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[signingClient]
	);

	// Send direct payment
	const sendDirectPayment = useCallback(
		async (
			toUsername: string,
			amount: string,
			description: string,
			senderAddress: string
		) => {
			if (!signingClient) {
				throw new Error("Signing client not available");
			}

			setLoading(true);
			setError(null);
			try {
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						send_direct_payment: {
							to_username: toUsername,
							amount,
							description,
							payment_type: "DirectPayment",
							proof_type: "None",
						},
					},
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[signingClient]
	);

	// Create payment request
	const createPaymentRequest = useCallback(
		async (
			toUsername: string,
			amount: string,
			description: string,
			senderAddress: string
		) => {
			if (!signingClient) {
				throw new Error("Signing client not available");
			}

			setLoading(true);
			setError(null);
			try {
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						create_payment_request: {
							to_username: toUsername,
							amount,
							description,
							payment_type: "PaymentRequest",
							proof_type: "None",
						},
					},
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[signingClient]
	);

	// Create help request
	const createHelpRequest = useCallback(
		async (
			toUsername: string,
			amount: string,
			description: string,
			senderAddress: string
		) => {
			if (!signingClient) {
				throw new Error("Signing client not available");
			}

			setLoading(true);
			setError(null);
			try {
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						create_help_request: {
							to_username: toUsername,
							amount,
							description,
							payment_type: "HelpRequest",
							proof_type: "None",
						},
					},
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[signingClient]
	);

	// Approve payment
	const approvePayment = useCallback(
		async (paymentId: string, senderAddress: string) => {
			if (!signingClient) {
				throw new Error("Signing client not available");
			}

			setLoading(true);
			setError(null);
			try {
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						approve_payment: {
							payment_id: paymentId,
						},
					},
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[signingClient]
	);

	// Reject payment
	const rejectPayment = useCallback(
		async (paymentId: string, senderAddress: string) => {
			if (!signingClient) {
				throw new Error("Signing client not available");
			}

			setLoading(true);
			setError(null);
			try {
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						reject_payment: {
							payment_id: paymentId,
						},
					},
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[signingClient]
	);

	// Submit proof
	const submitProof = useCallback(
		async (
			paymentId: string,
			proofType: string,
			proofData: string,
			senderAddress: string
		) => {
			if (!signingClient) {
				throw new Error("Signing client not available");
			}

			setLoading(true);
			setError(null);
			try {
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						submit_proof: {
							payment_id: paymentId,
							proof_type: proofType,
							proof_data: proofData,
						},
					},
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[signingClient]
	);

	return {
		loading,
		error,
		registerUser,
		sendFriendRequest,
		acceptFriendRequest,
		sendDirectPayment,
		createPaymentRequest,
		createHelpRequest,
		approvePayment,
		rejectPayment,
		submitProof,
	};
}

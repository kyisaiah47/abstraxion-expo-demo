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
		if (!address || address.trim() === "") {
			console.log("❌ No address provided to useUserProfile");
			setUser(null);
			setLoading(false);
			return;
		}

		console.log("🔍 useUserProfile fetching for address:", address);
		setLoading(true);
		setError(null);

		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);

			console.log("🔗 Calling contract.getUserByWallet...");

			// First try the direct getUserByWallet method
			try {
				const result = await contract.getUserByWallet(address);
				console.log(
					"📋 Direct getUserByWallet result:",
					JSON.stringify(result, null, 2)
				);
				setUser(result.user || null);
				console.log("👤 Set user to:", result.user || null);
				return;
			} catch (directError) {
				console.log("❌ Direct getUserByWallet failed:", directError.message);
				console.log("🔄 Trying two-step approach...");

				// Try the two-step approach as fallback
				const usernameResult = await contract.getUsernameByWallet(address);
				console.log(
					"📝 Username result:",
					JSON.stringify(usernameResult, null, 2)
				);

				if (usernameResult?.username) {
					const userResult = await contract.getUserByUsername(
						usernameResult.username
					);
					console.log("👤 User result:", JSON.stringify(userResult, null, 2));
					setUser(userResult.user || null);
				} else {
					console.log("❌ No username found for wallet");
					setUser(null);
				}
			}
		} catch (e: any) {
			console.error("❌ Error in useUserProfile:", e.message);
			console.error("❌ Full error:", e);
			setError(e.message);
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, [address]);

	useEffect(() => {
		fetch();
	}, [fetch]);

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

// Check username availability hook
export function useUsernameCheck() {
	const [isChecking, setIsChecking] = useState(false);

	const checkUsername = useCallback(async (username: string) => {
		setIsChecking(true);
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.isUsernameAvailable(username);
			return result.available;
		} catch (error) {
			console.error("Error checking username:", error);
			return false;
		} finally {
			setIsChecking(false);
		}
	}, []);

	return { checkUsername, isChecking };
}

// Get current user hook
export function useCurrentUser(walletAddress: string) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(false);

	const fetchCurrentUser = useCallback(async () => {
		if (!walletAddress) return;

		setLoading(true);
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.getUserByWallet(walletAddress);
			setUser(result.user || null);
		} catch (error) {
			console.error("Error fetching current user:", error);
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, [walletAddress]);

	useEffect(() => {
		fetchCurrentUser();
	}, [fetchCurrentUser]);

	return { user, loading, refetch: fetchCurrentUser };
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

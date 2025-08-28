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
			setUser(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const { supabase } = await import("@/lib/supabase");
			
			// Fetch user from database by wallet address
			const { data: userData, error: dbError } = await supabase
				.from('users')
				.select('*')
				.eq('wallet_address', address)
				.single();

			if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "not found"
				throw new Error(dbError.message);
			}

			if (userData) {
				// Convert database format to User type
				const userProfile: User = {
					username: userData.handle || '',
					display_name: userData.display_name || '',
					wallet_address: userData.wallet_address,
					profile_picture: userData.profile_picture || '',
				};
				setUser(userProfile);
			} else {
				setUser(null);
			}
		} catch (e: any) {
			console.error("❌ Error in useUserProfile:", e.message);
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

// useSearchUsers: search users by query (partial match) from database
export function useSearchUsers(query: string) {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		if (!query || query.trim().length < 2) {
			setUsers([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const { supabase } = await import("@/lib/supabase");
			
			// Search users by handle or display_name
			const { data: userData, error: dbError } = await supabase
				.from('users')
				.select('*')
				.or(`handle.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`)
				.limit(10);

			if (dbError) {
				throw new Error(dbError.message);
			}

			// Convert database format to User type
			const searchResults: User[] = userData?.map(user => ({
				username: user.handle || '',
				display_name: user.display_name || '',
				wallet_address: user.wallet_address,
				profile_picture: user.avatar_url || '',
			})) || [];

			setUsers(searchResults);
		} catch (e: any) {
			setError(e.message);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	}, [query]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	return { users, loading, error, refetch: fetch };
}

// useIsUsernameAvailable: check username availability
export function useIsUsernameAvailable(username: string) {
	const [available, setAvailable] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		if (!username || username.trim() === "") {
			setAvailable(null);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const { supabase } = await import("@/lib/supabase");
			
			// Check if username exists in database
			const { data, error: dbError } = await supabase
				.from('users')
				.select('handle')
				.eq('handle', username.toLowerCase())
				.single();

			if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "not found"
				throw new Error(dbError.message);
			}

			// Username is available if no record found
			setAvailable(!data);
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
		if (!username || !['isaiah_kim', 'mayathedesigner'].includes(username)) {
			setFriends([]);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const { supabase } = await import("@/lib/supabase");
			
			// Get all users except the current user
			const { data: allUsers } = await supabase
				.from('users')
				.select('*')
				.neq('handle', username);

			const friendsList: User[] = allUsers?.map(user => ({
				username: user.handle || '',
				display_name: user.display_name || '',
				wallet_address: user.wallet_address,
				profile_picture: user.avatar_url || '',
			})) || [];

			setFriends(friendsList);
		} catch (e: any) {
			setError(e.message);
			setFriends([]);
		} finally {
			setLoading(false);
		}
	}, [username]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	return { friends, loading, error, refetch: fetch };
}

// usePendingFriendRequests: get pending friend requests (simplified)
export function usePendingFriendRequests(username: string) {
	const [requests, setRequests] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		setLoading(false);
		setError(null);
		setRequests([]); // Simplified - friend requests not implemented in DB yet
	}, [username]);

	useEffect(() => {
		fetch();
	}, [fetch]);

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

// usePaymentHistory: get user's payment history from database
export function usePaymentHistory(walletAddress: string) {
	const [payments, setPayments] = useState<Payment[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		if (!walletAddress) {
			setPayments([]);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const { supabase } = await import("@/lib/supabase");
			
			// Fetch tasks where user is either payer or worker
			const { data: tasks, error: dbError } = await supabase
				.from('tasks')
				.select('*')
				.or(`payer.eq.${walletAddress},worker.eq.${walletAddress}`)
				.order('created_at', { ascending: false });

			if (dbError) {
				throw new Error(dbError.message);
			}

			// Convert tasks to Payment format for compatibility
			const paymentsData = tasks?.map(task => ({
				id: task.id,
				amount: task.amount,
				description: task.description,
				payment_type: task.task_type,
				status: task.status === 'released' ? 'Completed' : 
				        task.status === 'pending_release' ? 'Pending' : 'Pending',
				from_username: task.payer,
				to_username: task.worker,
				created_at: task.created_at,
			})) || [];

			setPayments(paymentsData);
		} catch (e: any) {
			setError(e.message);
			setPayments([]);
		} finally {
			setLoading(false);
		}
	}, [walletAddress]);

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
		async (username: string, displayName: string, senderAddress: string) => {
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
							display_name: displayName,
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

			console.log("🔗 Executing acceptFriendRequest with:");
			console.log("  - requesterUsername:", requesterUsername);
			console.log("  - senderAddress:", senderAddress);
			console.log("  - CONTRACT_ADDRESS:", CONTRACT_ADDRESS);
			
			const message = {
				accept_friend_request: {
					from_username: requesterUsername,
				},
			};
			console.log("  - message:", JSON.stringify(message, null, 2));

			setLoading(true);
			setError(null);
			try {
				return await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					message,
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
							amount: { denom: "uxion", amount },
							description,
							proof_type: "None",
						},
					},
					"auto",
					undefined,
					[{ denom: "uxion", amount }] // Send the actual funds
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
							amount: { denom: "uxion", amount },
							description,
							proof_type: "None",
						},
					},
					"auto",
					undefined,
					[{ denom: "uxion", amount }] // Send the actual funds for escrow
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
				console.log("🔧 TRANSACTION DEBUG:");
				console.log("  - senderAddress:", senderAddress);
				console.log("  - CONTRACT_ADDRESS:", CONTRACT_ADDRESS);
				console.log("  - message:", JSON.stringify({
					create_help_request: {
						to_username: toUsername,
						amount: { denom: "uxion", amount },
						description,
						proof_type: "None",
					},
				}, null, 2));
				console.log("  - funds:", [{ denom: "uxion", amount }]);
				console.log("  - signingClient type:", typeof signingClient);
				
				const result = await signingClient.execute(
					senderAddress,
					CONTRACT_ADDRESS,
					{
						create_help_request: {
							to_username: toUsername,
							amount: { denom: "uxion", amount },
							description,
							proof_type: "None",
						},
					},
					"auto",
					undefined,
					[{ denom: "uxion", amount }] // Send the actual funds for escrow
				);
				
				console.log("✅ Transaction successful:", result);
				return result;
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

	// Update user
	const updateUser = useCallback(
		async (username: string, displayName: string, senderAddress: string) => {
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
						update_user: {
							username,
							display_name: displayName,
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

	// Check username availability
	const checkUsernameAvailability = useCallback(async (username: string) => {
		try {
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.isUsernameAvailable(username);
			return result.available;
		} catch (error) {
			console.error("Error checking username availability:", error);
			return false;
		}
	}, []);

	return {
		loading,
		error,
		registerUser,
		updateUser,
		checkUsernameAvailability,
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

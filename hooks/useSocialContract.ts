import { useState, useCallback, useEffect } from "react";
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
			const result = await contract.getPayment(paymentId);
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
import {
	SocialPaymentContract,
	User,
	Payment,
	ProofType,
} from "../lib/socialContract";
import {
	CosmWasmClient,
	SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";

// Helper to create a read-only contract instance
async function getReadClient() {
	return await CosmWasmClient.connect(XION_RPC_ENDPOINT);
}

// Helper to create a write-enabled contract instance
export async function getWriteClient(signer: any) {
	return await SigningCosmWasmClient.connectWithSigner(
		XION_RPC_ENDPOINT,
		signer
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
			// Assume contract has getUserByAddress query
			const result = await contract.client.queryContractSmart(
				contract.contractAddress,
				{
					get_user_by_address: { wallet_address: address },
				}
			);
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
			const result = await contract.getUser(username);
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
			const client = await getReadClient();
			const contract = new SocialPaymentContract(client);
			const result = await contract.getUser(username);
			setAvailable(!result.user);
		} catch (e: any) {
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
			const result = await contract.client.queryContractSmart(
				contract.contractAddress,
				{
					get_friends: { username },
				}
			);
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
			const result = await contract.client.queryContractSmart(
				contract.contractAddress,
				{
					get_pending_friend_requests: { username },
				}
			);
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
			const result = await contract.getPaymentsByUser(username);
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
			const result = await contract.client.queryContractSmart(
				contract.contractAddress,
				{
					get_pending_payments: { username },
				}
			);
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

// useSocialOperations: hook for write operations
export function useSocialOperations(signer: any) {
	// Approve payment
	const approvePayment = useCallback(
		async (paymentId: string) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				if (!(contract.client instanceof SigningCosmWasmClient))
					throw new Error("Client must be SigningCosmWasmClient for writes");
				return await contract.client.execute(
					signer,
					contract.contractAddress,
					{ approve_payment: { payment_id: paymentId } },
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[getContract, signer]
	);

	// Reject payment
	const rejectPayment = useCallback(
		async (paymentId: string) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				if (!(contract.client instanceof SigningCosmWasmClient))
					throw new Error("Client must be SigningCosmWasmClient for writes");
				return await contract.client.execute(
					signer,
					contract.contractAddress,
					{ reject_payment: { payment_id: paymentId } },
					"auto"
				);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[getContract, signer]
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getContract = useCallback(async () => {
		const client = await getWriteClient(signer);
		return new SocialPaymentContract(client);
	}, [signer]);

	// Each operation returns a function
	const registerUser = useCallback(
		async (user: User, sender: string) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				return await contract.registerUser(user, sender);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[getContract]
	);

	const sendFriendRequest = useCallback(
		async (from: string, to_username: string) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				return await contract.sendFriendRequest(from, to_username);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[getContract]
	);

	const acceptFriendRequest = useCallback(
		async (from: string, requester_username: string) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				return await contract.acceptFriendRequest(from, requester_username);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[getContract]
	);

	const sendDirectPayment = useCallback(
		async (from: string, payment: any) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				return await contract.sendDirectPayment(from, payment);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[getContract]
	);

	const createPaymentRequest = useCallback(
		async (from: string, payment: any) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				return await contract.createPaymentRequest(from, payment);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[getContract]
	);

	const createHelpRequest = useCallback(
		async (from: string, payment: any) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				return await contract.createHelpRequest(from, payment);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[getContract]
	);

	const submitProof = useCallback(
		async (
			from: string,
			paymentId: string,
			proof: { type: ProofType; data?: string }
		) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				return await contract.submitProof(from, paymentId, proof);
			} catch (e: any) {
				setError(e.message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[getContract]
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
		submitProof,
		approvePayment,
		rejectPayment,
	};
}

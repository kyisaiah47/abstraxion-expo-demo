import { useState, useCallback, useEffect } from "react";
import { SocialPaymentContract, User, Payment } from "../lib/socialContract";
import {
	CosmWasmClient,
	SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";

// Ensure EXPO_PUBLIC_RPC_ENDPOINT is defined only once
const EXPO_PUBLIC_RPC_ENDPOINT = process.env.EXPO_PUBLIC_RPC_ENDPOINT || "";

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
	return await SigningCosmWasmClient.connectWithSigner(
		EXPO_PUBLIC_RPC_ENDPOINT,
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
export function useSocialOperations(signer: any) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getContract = useCallback(async () => {
		const client = await getWriteClient(signer);
		return new SocialPaymentContract(client);
	}, [signer]);

	// Register user
	const registerUser = useCallback(
		async (username: string, wallet_address: string) => {
			setLoading(true);
			setError(null);
			try {
				const contract = await getContract();
				if (!(contract.client instanceof SigningCosmWasmClient))
					throw new Error("Client must be SigningCosmWasmClient for writes");
				return await contract.registerUser(
					{ username, wallet_address },
					wallet_address
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

	return {
		loading,
		error,
		registerUser,
		approvePayment,
		rejectPayment,
	};
}

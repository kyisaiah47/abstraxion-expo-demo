import { User, FriendRequest } from "@/types/proofpay";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS;

// Static dependencies that will be set by the app
let staticClient: SigningCosmWasmClient | null = null;
let staticWalletAddress: string | null = null;

// Initialize the service with client and wallet address
export function initializeUserService(
	client: SigningCosmWasmClient,
	walletAddress: string
) {
	staticClient = client;
	staticWalletAddress = walletAddress;
}

// Helper function to get initialized dependencies
function getDeps() {
	if (!staticClient)
		throw new Error(
			"UserService not initialized - call initializeUserService first"
		);
	if (!staticWalletAddress) throw new Error("Wallet address not available");
	if (!CONTRACT_ADDRESS) throw new Error("Contract address not set");

	return {
		client: staticClient,
		walletAddress: staticWalletAddress,
		contractAddress: CONTRACT_ADDRESS,
	};
}

export class UserService {
	// Username Management
	static async checkUsernameAvailability(username: string): Promise<boolean> {
		const { client, contractAddress } = getDeps();
		try {
			const res = await client.queryContractSmart(contractAddress, {
				is_username_available: { username: username.toLowerCase() },
			});
			return res.available;
		} catch (error) {
			// If contract throws error, assume username is available
			console.error("Error checking username availability:", error);
			return true;
		}
	}

	static async registerUsername(username: string): Promise<User> {
		const { client, walletAddress, contractAddress } = getDeps();

		const msg = {
			register_user: {
				username: username.toLowerCase(),
				display_name: username,
			},
		};

		await client.execute(walletAddress, contractAddress, msg, "auto");

		// Get the registered user
		const currentUser = await this.getCurrentUser();
		if (!currentUser) {
			throw new Error("User registration failed");
		}
		return currentUser;
	}

	// User Registration and Profile
	static async registerUser(
		username: string,
		displayName: string
	): Promise<User> {
		const { client, walletAddress, contractAddress } = getDeps();

		const msg = {
			register_user: {
				username: username.toLowerCase(),
				display_name: displayName,
			},
		};

		await client.execute(walletAddress, contractAddress, msg, "auto");

		// Get the registered user
		const currentUser = await this.getCurrentUser();
		if (!currentUser) {
			throw new Error("User registration failed");
		}
		return currentUser;
	}

	static async getCurrentUser(): Promise<User | null> {
		const { client, walletAddress, contractAddress } = getDeps();
		try {
			// First get username by wallet address
			const usernameResult = await client.queryContractSmart(contractAddress, {
				get_username_by_wallet: { wallet_address: walletAddress },
			});

			if (!usernameResult?.username) return null;

			// Then get full user by username
			const userResult = await client.queryContractSmart(contractAddress, {
				get_user_by_username: { username: usernameResult.username },
			});

			return userResult?.user || null;
		} catch (error) {
			console.error("Error fetching current user:", error);
			return null;
		}
	}

	static async getUserByWallet(
		targetWalletAddress: string
	): Promise<User | null> {
		const { client, contractAddress } = getDeps();
		try {
			// First get username by wallet address
			const usernameResult = await client.queryContractSmart(contractAddress, {
				get_username_by_wallet: { wallet_address: targetWalletAddress },
			});

			if (!usernameResult?.username) return null;

			// Then get full user by username
			const userResult = await client.queryContractSmart(contractAddress, {
				get_user_by_username: { username: usernameResult.username },
			});

			return userResult?.user || null;
		} catch (error) {
			console.error("Error fetching user by wallet:", error);
			return null;
		}
	}

	static async updateProfile(updates: Partial<User>): Promise<User> {
		const { client, walletAddress, contractAddress } = getDeps();

		const msg = {
			update_user_profile: {
				display_name: updates.displayName || null,
				profile_picture: updates.profilePicture || null,
			},
		};

		await client.execute(walletAddress, contractAddress, msg, "auto");

		// Get updated user
		const updatedUser = await this.getCurrentUser();
		if (!updatedUser) {
			throw new Error("User not found after update");
		}
		return updatedUser;
	}

	// User Search
	static async searchUsers(query: string): Promise<User[]> {
		if (!query.trim()) return [];
		const { client, walletAddress, contractAddress } = getDeps();

		try {
			const res = await client.queryContractSmart(contractAddress, {
				search_users: { query },
			});

			// Filter out current user
			const users = res.users || [];
			return users.filter((user: User) => user.walletAddress !== walletAddress);
		} catch (error) {
			console.error("Error searching users:", error);
			return [];
		}
	}

	static async getUserById(userId: string): Promise<User | null> {
		const { client, contractAddress } = getDeps();
		try {
			// Treat userId as username for contract compatibility
			const res = await client.queryContractSmart(contractAddress, {
				get_user_by_username: { username: userId },
			});
			return res?.user || null;
		} catch {
			return null;
		}
	}

	// Friend Management
	static async sendFriendRequest(toUserId: string): Promise<FriendRequest> {
		const { client, walletAddress, contractAddress } = getDeps();

		const msg = {
			send_friend_request: {
				to_username: toUserId, // Assuming toUserId is username
			},
		};

		await client.execute(walletAddress, contractAddress, msg, "auto");

		// Return a minimal friend request object
		return {
			id: Date.now().toString(),
			fromUser: walletAddress,
			toUser: toUserId,
			status: "pending",
			createdAt: new Date(),
		} as FriendRequest;
	}

	static async respondToFriendRequest(
		requestId: string,
		response: "accepted" | "declined"
	): Promise<void> {
		const { client, walletAddress, contractAddress } = getDeps();
		const msg =
			response === "accepted"
				? { accept_friend_request: { from_username: requestId } }
				: { decline_friend_request: { from_username: requestId } };

		await client.execute(walletAddress, contractAddress, msg, "auto");
	}

	static async getFriends(): Promise<User[]> {
		const { client, contractAddress } = getDeps();

		try {
			// First get current user's username
			const currentUser = await this.getCurrentUser();
			if (!currentUser?.username) return [];

			// Get friend usernames
			const res = await client.queryContractSmart(contractAddress, {
				get_user_friends: { username: currentUser.username },
			});

			const friendUsernames = res.friends || [];

			// Fetch full user objects for each friend
			const friends = await Promise.all(
				friendUsernames.map(async (username: string) => {
					try {
						const userRes = await client.queryContractSmart(contractAddress, {
							get_user_by_username: { username },
						});
						return userRes?.user;
					} catch {
						return null;
					}
				})
			);

			return friends.filter((friend): friend is User => !!friend);
		} catch (error) {
			console.error("Error fetching friends:", error);
			return [];
		}
	}

	static async getPendingFriendRequests(): Promise<
		(FriendRequest & { fromUserData: User })[]
	> {
		const { client, contractAddress } = getDeps();

		try {
			// Get current user's username
			const currentUser = await this.getCurrentUser();
			if (!currentUser?.username) return [];

			const res = await client.queryContractSmart(contractAddress, {
				get_pending_requests: { username: currentUser.username },
			});

			const requests = res.requests || [];

			// Enrich with user data
			const enrichedRequests = await Promise.all(
				requests.map(async (request: any) => {
					try {
						const fromUserRes = await client.queryContractSmart(
							contractAddress,
							{
								get_user_by_username: { username: request.from_username },
							}
						);
						return {
							...request,
							fromUserData: fromUserRes?.user,
						};
					} catch {
						return null;
					}
				})
			);

			return enrichedRequests.filter(
				(req): req is FriendRequest & { fromUserData: User } =>
					!!req && !!req.fromUserData
			);
		} catch (error) {
			console.error("Error fetching pending friend requests:", error);
			return [];
		}
	}

	static async getSentFriendRequests(): Promise<
		(FriendRequest & { toUserData: User })[]
	> {
		// This would require additional contract queries or different contract methods
		// For now, return empty array as the contract might not support this directly
		return [];
	}

	// Helper to check if users are friends
	static async areFriends(userId1: string, userId2: string): Promise<boolean> {
		const { client, contractAddress } = getDeps();

		try {
			const res = await client.queryContractSmart(contractAddress, {
				are_friends: {
					username1: userId1,
					username2: userId2,
				},
			});
			return !!res.are_friends;
		} catch {
			return false;
		}
	}
}

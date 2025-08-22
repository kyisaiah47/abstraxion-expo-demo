import { User, Friendship, FriendRequest } from "@/types/proofpay";

// Mock data store (in real app, this would be API calls)
let mockUsers: User[] = [
	{
		id: "1",
		walletAddress: "0x1234567890abcdef",
		username: "alice_crypto",
		displayName: "Alice Johnson",
		profilePicture: "https://i.pravatar.cc/100?img=1",
		createdAt: new Date("2024-01-15"),
	},
	{
		id: "2",
		walletAddress: "0xabcdef1234567890",
		username: "bob_blockchain",
		displayName: "Bob Smith",
		profilePicture: "https://i.pravatar.cc/100?img=2",
		createdAt: new Date("2024-02-01"),
	},
	{
		id: "3",
		walletAddress: "0x9876543210fedcba",
		username: "charlie_web3",
		displayName: "Charlie Davis",
		profilePicture: "https://i.pravatar.cc/100?img=3",
		createdAt: new Date("2024-02-10"),
	},
];

let mockFriendships: Friendship[] = [
	{
		id: "f1",
		user1: "1",
		user2: "2",
		createdAt: new Date("2024-02-15"),
	},
];

let mockFriendRequests: FriendRequest[] = [
	{
		id: "r1",
		fromUser: "3",
		toUser: "1",
		status: "pending",
		createdAt: new Date("2024-08-20"),
	},
];

let currentUserId = "1"; // Mock current user

export class UserService {
	// Username Management
	static async checkUsernameAvailability(username: string): Promise<boolean> {
		const existingUser = mockUsers.find(
			(u) => u.username.toLowerCase() === username.toLowerCase()
		);
		return !existingUser;
	}

	static async registerUsername(
		username: string,
		walletAddress: string
	): Promise<User> {
		// Check if username is taken
		const isAvailable = await this.checkUsernameAvailability(username);
		if (!isAvailable) {
			throw new Error("Username is already taken");
		}

		// Check if user already exists with this wallet
		const existingUser = await this.getUserByWallet(walletAddress);
		if (existingUser) {
			throw new Error("User already exists with this wallet address");
		}

		const newUser: User = {
			id: Date.now().toString(),
			walletAddress,
			username: username.toLowerCase(),
			displayName: username, // Default display name to username
			createdAt: new Date(),
		};

		mockUsers.push(newUser);
		currentUserId = newUser.id; // Set as current user
		return newUser;
	}

	// User Registration and Profile
	static async registerUser(
		walletAddress: string,
		username: string,
		displayName: string
	): Promise<User> {
		// Check if username is taken
		const existingUser = mockUsers.find(
			(u) => u.username.toLowerCase() === username.toLowerCase()
		);
		if (existingUser) {
			throw new Error("Username is already taken");
		}

		const newUser: User = {
			id: Date.now().toString(),
			walletAddress,
			username: username.toLowerCase(),
			displayName,
			createdAt: new Date(),
		};

		mockUsers.push(newUser);
		return newUser;
	}

	static async getCurrentUser(): Promise<User | null> {
		return mockUsers.find((u) => u.id === currentUserId) || null;
	}

	static async getUserByWallet(walletAddress: string): Promise<User | null> {
		return mockUsers.find((u) => u.walletAddress === walletAddress) || null;
	}

	static async updateProfile(
		userId: string,
		updates: Partial<User>
	): Promise<User> {
		const userIndex = mockUsers.findIndex((u) => u.id === userId);
		if (userIndex === -1) {
			throw new Error("User not found");
		}

		mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
		return mockUsers[userIndex];
	}

	// User Search
	static async searchUsers(query: string): Promise<User[]> {
		if (!query.trim()) return [];

		const lowercaseQuery = query.toLowerCase();
		return mockUsers.filter(
			(user) =>
				user.id !== currentUserId &&
				(user.username.toLowerCase().includes(lowercaseQuery) ||
					user.displayName.toLowerCase().includes(lowercaseQuery))
		);
	}

	static async getUserById(userId: string): Promise<User | null> {
		return mockUsers.find((u) => u.id === userId) || null;
	}

	// Friend Management
	static async sendFriendRequest(toUserId: string): Promise<FriendRequest> {
		// Check if friendship already exists
		const existingFriendship = mockFriendships.find(
			(f) =>
				(f.user1 === currentUserId && f.user2 === toUserId) ||
				(f.user1 === toUserId && f.user2 === currentUserId)
		);

		if (existingFriendship) {
			throw new Error("You are already friends with this user");
		}

		// Check if request already exists
		const existingRequest = mockFriendRequests.find(
			(r) =>
				(r.fromUser === currentUserId && r.toUser === toUserId) ||
				(r.fromUser === toUserId && r.toUser === currentUserId)
		);

		if (existingRequest) {
			throw new Error("Friend request already exists");
		}

		const newRequest: FriendRequest = {
			id: Date.now().toString(),
			fromUser: currentUserId,
			toUser: toUserId,
			status: "pending",
			createdAt: new Date(),
		};

		mockFriendRequests.push(newRequest);
		return newRequest;
	}

	static async respondToFriendRequest(
		requestId: string,
		response: "accepted" | "declined"
	): Promise<void> {
		const requestIndex = mockFriendRequests.findIndex(
			(r) => r.id === requestId
		);
		if (requestIndex === -1) {
			throw new Error("Friend request not found");
		}

		const request = mockFriendRequests[requestIndex];
		request.status = response;

		if (response === "accepted") {
			// Create friendship
			const newFriendship: Friendship = {
				id: Date.now().toString(),
				user1: request.fromUser,
				user2: request.toUser,
				createdAt: new Date(),
			};
			mockFriendships.push(newFriendship);
		}

		// Remove the request
		mockFriendRequests.splice(requestIndex, 1);
	}

	static async getFriends(): Promise<User[]> {
		const friendships = mockFriendships.filter(
			(f) => f.user1 === currentUserId || f.user2 === currentUserId
		);

		const friendIds = friendships.map((f) =>
			f.user1 === currentUserId ? f.user2 : f.user1
		);

		return mockUsers.filter((u) => friendIds.includes(u.id));
	}

	static async getPendingFriendRequests(): Promise<
		(FriendRequest & { fromUserData: User })[]
	> {
		const pendingRequests = mockFriendRequests.filter(
			(r) => r.toUser === currentUserId && r.status === "pending"
		);

		return pendingRequests.map((request) => ({
			...request,
			fromUserData: mockUsers.find((u) => u.id === request.fromUser)!,
		}));
	}

	static async getSentFriendRequests(): Promise<
		(FriendRequest & { toUserData: User })[]
	> {
		const sentRequests = mockFriendRequests.filter(
			(r) => r.fromUser === currentUserId && r.status === "pending"
		);

		return sentRequests.map((request) => ({
			...request,
			toUserData: mockUsers.find((u) => u.id === request.toUser)!,
		}));
	}

	// Helper to check if users are friends
	static async areFriends(userId1: string, userId2: string): Promise<boolean> {
		return mockFriendships.some(
			(f) =>
				(f.user1 === userId1 && f.user2 === userId2) ||
				(f.user1 === userId2 && f.user2 === userId1)
		);
	}
}

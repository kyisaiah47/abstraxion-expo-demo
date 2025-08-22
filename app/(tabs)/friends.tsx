import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	Pressable,
	Alert,
	RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import { DesignSystem } from "@/constants/DesignSystem";
import { User, FriendRequest } from "@/types/proofpay";
import { UserService } from "@/lib/userService";

export default function FriendsScreen() {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [friends, setFriends] = useState<User[]>([]);
	const [pendingRequests, setPendingRequests] = useState<
		(FriendRequest & { fromUserData: User })[]
	>([]);
	const [sentRequests, setSentRequests] = useState<
		(FriendRequest & { toUserData: User })[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const { logout } =
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require("@burnt-labs/abstraxion-react-native").useAbstraxionAccount();

	const handleLogout = async () => {
		try {
			console.log("Attempting to logout...");
			await logout();
			console.log("Logout successful");
			router.replace("/");
		} catch (error) {
			console.error("Logout failed:", error);
			Alert.alert("Error", "Failed to sign out. Please try again.");
		}
	};

	// Load initial data
	useEffect(() => {
		loadFriendsData();
	}, []);

	// Handle user search
	useEffect(() => {
		const searchUsers = async () => {
			if (searchQuery.trim().length < 2) {
				setSearchResults([]);
				return;
			}

			setIsLoading(true);
			try {
				const results = await UserService.searchUsers(searchQuery);
				setSearchResults(results);
			} catch (error) {
				console.error("Search error:", error);
			} finally {
				setIsLoading(false);
			}
		};

		const debounceTimer = setTimeout(searchUsers, 300);
		return () => clearTimeout(debounceTimer);
	}, [searchQuery]);

	const loadFriendsData = async () => {
		try {
			const [friendsList, pending, sent] = await Promise.all([
				UserService.getFriends(),
				UserService.getPendingFriendRequests(),
				UserService.getSentFriendRequests(),
			]);

			setFriends(friendsList);
			setPendingRequests(pending);
			setSentRequests(sent);
		} catch (error) {
			console.error("Error loading friends data:", error);
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadFriendsData();
		setRefreshing(false);
	};

	const handleSendFriendRequest = async (userId: string) => {
		try {
			await UserService.sendFriendRequest(userId);
			Alert.alert("Success", "Friend request sent!");

			// Refresh data to update UI
			await loadFriendsData();

			// Clear search to show updated state
			setSearchQuery("");
			setSearchResults([]);
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to send friend request"
			);
		}
	};

	const handleRespondToRequest = async (
		requestId: string,
		response: "accepted" | "declined"
	) => {
		try {
			await UserService.respondToFriendRequest(requestId, response);
			Alert.alert(
				"Success",
				response === "accepted"
					? "Friend request accepted!"
					: "Friend request declined"
			);
			await loadFriendsData();
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to respond to request"
			);
		}
	};

	const renderUserItem = (user: User, showAddButton: boolean = true) => (
		<View
			key={user.id}
			style={styles.userItem}
		>
			<View style={styles.userInfo}>
				<View style={styles.avatarPlaceholder}>
					<Text style={styles.avatarText}>
						{user.displayName.charAt(0).toUpperCase()}
					</Text>
				</View>
				<View style={styles.userTextContainer}>
					<Text style={styles.userName}>{user.displayName}</Text>
					<Text style={styles.userUsername}>@{user.username}</Text>
				</View>
			</View>
			{showAddButton && (
				<Pressable
					style={styles.addButton}
					onPress={() => handleSendFriendRequest(user.id)}
				>
					<Ionicons
						name="person-add"
						size={20}
						color={DesignSystem.colors.primary[800]}
					/>
				</Pressable>
			)}
		</View>
	);

	const renderFriendRequestItem = (
		request: FriendRequest & { fromUserData: User }
	) => (
		<View
			key={request.id}
			style={styles.requestItem}
		>
			<View style={styles.userInfo}>
				<View style={styles.avatarPlaceholder}>
					<Text style={styles.avatarText}>
						{request.fromUserData.displayName.charAt(0).toUpperCase()}
					</Text>
				</View>
				<View style={styles.userTextContainer}>
					<Text style={styles.userName}>
						{request.fromUserData.displayName}
					</Text>
					<Text style={styles.userUsername}>
						@{request.fromUserData.username}
					</Text>
				</View>
			</View>
			<View style={styles.requestActions}>
				<Pressable
					style={[styles.requestButton, styles.acceptButton]}
					onPress={() => handleRespondToRequest(request.id, "accepted")}
				>
					<Ionicons
						name="checkmark"
						size={16}
						color={DesignSystem.colors.text.inverse}
					/>
				</Pressable>
				<Pressable
					style={[styles.requestButton, styles.declineButton]}
					onPress={() => handleRespondToRequest(request.id, "declined")}
				>
					<Ionicons
						name="close"
						size={16}
						color={DesignSystem.colors.text.inverse}
					/>
				</Pressable>
			</View>
		</View>
	);

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title="Friends"
				subtitle="Connect with people you trust"
				onLogout={handleLogout}
			/>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
					/>
				}
				showsVerticalScrollIndicator={false}
			>
				{/* Search Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Find Friends</Text>
					<View style={styles.searchContainer}>
						<Ionicons
							name="search"
							size={20}
							color={DesignSystem.colors.text.secondary}
							style={styles.searchIcon}
						/>
						<TextInput
							style={styles.searchInput}
							value={searchQuery}
							onChangeText={setSearchQuery}
							placeholder="Search by name or username..."
							placeholderTextColor={DesignSystem.colors.text.tertiary}
						/>
					</View>

					{searchResults.length > 0 && (
						<View style={styles.searchResults}>
							{searchResults.map((user) => renderUserItem(user))}
						</View>
					)}
				</View>

				{/* Pending Friend Requests */}
				{pendingRequests.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Friend Requests</Text>
						<View style={styles.requestsList}>
							{pendingRequests.map(renderFriendRequestItem)}
						</View>
					</View>
				)}

				{/* Sent Requests */}
				{sentRequests.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Pending Requests</Text>
						<View style={styles.requestsList}>
							{sentRequests.map((request) => (
								<View
									key={request.id}
									style={styles.userItem}
								>
									<View style={styles.userInfo}>
										<View style={styles.avatarPlaceholder}>
											<Text style={styles.avatarText}>
												{request.toUserData.displayName.charAt(0).toUpperCase()}
											</Text>
										</View>
										<View style={styles.userTextContainer}>
											<Text style={styles.userName}>
												{request.toUserData.displayName}
											</Text>
											<Text style={styles.userUsername}>
												@{request.toUserData.username}
											</Text>
										</View>
									</View>
									<Text style={styles.pendingText}>Pending</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Friends List */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>
						Your Friends {friends.length > 0 && `(${friends.length})`}
					</Text>
					{friends.length > 0 ? (
						<View style={styles.friendsList}>
							{friends.map((friend) => renderUserItem(friend, false))}
						</View>
					) : (
						<View style={styles.emptyState}>
							<Ionicons
								name="people-outline"
								size={48}
								color={DesignSystem.colors.text.tertiary}
							/>
							<Text style={styles.emptyStateText}>No friends yet</Text>
							<Text style={styles.emptyStateSubtext}>
								Search for people to add as friends
							</Text>
						</View>
					)}
				</View>

				{/* Bottom Spacer */}
				<View style={styles.bottomSpacer} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.primary,
	},

	scrollView: {
		flex: 1,
	},

	scrollContent: {
		paddingHorizontal: DesignSystem.layout.containerPadding,
		paddingTop: DesignSystem.spacing["2xl"],
	},

	section: {
		marginBottom: DesignSystem.spacing["4xl"],
	},

	sectionTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.lg,
	},

	// Search Styles
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		paddingHorizontal: DesignSystem.spacing.lg,
	},

	searchIcon: {
		marginRight: DesignSystem.spacing.md,
	},

	searchInput: {
		flex: 1,
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.primary,
		minHeight: 56,
	},

	searchResults: {
		marginTop: DesignSystem.spacing.lg,
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},

	// User Item Styles
	userItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: DesignSystem.colors.border.tertiary,
	},

	userInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},

	avatarPlaceholder: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: DesignSystem.colors.primary[800],
		alignItems: "center",
		justifyContent: "center",
		marginRight: DesignSystem.spacing.md,
	},

	avatarText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	userTextContainer: {
		flex: 1,
	},

	userName: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	userUsername: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},

	addButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor:
			DesignSystem.colors.primary[50] || DesignSystem.colors.surface.elevated,
		borderWidth: 1,
		borderColor: DesignSystem.colors.primary[800],
		alignItems: "center",
		justifyContent: "center",
	},

	pendingText: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		fontStyle: "italic",
	},

	// Friend Request Styles
	requestsList: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},

	requestItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: DesignSystem.colors.border.tertiary,
	},

	requestActions: {
		flexDirection: "row",
		gap: DesignSystem.spacing.sm,
	},

	requestButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},

	acceptButton: {
		backgroundColor: DesignSystem.colors.status.success,
	},

	declineButton: {
		backgroundColor: DesignSystem.colors.status.error,
	},

	// Friends List Styles
	friendsList: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},

	// Empty State Styles
	emptyState: {
		alignItems: "center",
		paddingVertical: DesignSystem.spacing["4xl"],
		paddingHorizontal: DesignSystem.spacing["2xl"],
	},

	emptyStateText: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.secondary,
		marginTop: DesignSystem.spacing.lg,
		textAlign: "center",
	},

	emptyStateSubtext: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.tertiary,
		marginTop: DesignSystem.spacing.sm,
		textAlign: "center",
	},

	bottomSpacer: {
		height: 140, // Space for tab bar
	},
});

import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	Pressable,
	RefreshControl,
	ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import ActionButton from "@/components/ActionButton";
import { DesignSystem } from "@/constants/DesignSystem";
import { User } from "@/lib/socialContract";
import { useTheme } from "@/contexts/ThemeContext";
import {
	useUserFriends,
	usePendingFriendRequests,
	useSocialOperations,
	useSearchUsers,
	useUserProfile,
} from "@/hooks/useSocialContract";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";

export default function FriendsScreen() {
	const { logout, data } = useAbstraxionAccount();
	const address = data?.bech32Address ?? "";
	const { client: signingClient } = useAbstraxionSigningClient();
	const { colors } = useTheme();

	// Get current user profile to get their username
	const { user: currentUser } = useUserProfile(address);
	const username = currentUser?.username || "";
	console.log("👤 Current user data:", currentUser);
	console.log("📝 Username for queries:", username);
	
	const {
		friends,
		loading: friendsLoading,
		error: friendsError,
		refetch: refetchFriends,
	} = useUserFriends(username);
	console.log("👥 Friends data:", friends, "loading:", friendsLoading, "error:", friendsError);
	
	const {
		requests: pendingRequests,
		loading: requestsLoading,
		error: requestsError,
		refetch: refetchRequests,
	} = usePendingFriendRequests(username);
	console.log("📨 Pending requests data:", pendingRequests, "loading:", requestsLoading, "error:", requestsError);
	console.log("📨 Pending requests detailed:", JSON.stringify(pendingRequests, null, 2));
	// Get signing client for operations
	const {
		sendFriendRequest,
		acceptFriendRequest,
		loading: opsLoading,
		error: opsError,
	} = useSocialOperations(signingClient);

	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");

	const {
		users: foundUsers,
		loading: searchLoading,
		error: searchError,
	} = useSearchUsers(debouncedQuery);
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
	const [activeTab, setActiveTab] = useState<"find" | "requests" | "friends">("find");
	const [showRemoveModal, setShowRemoveModal] = useState<{
		open: boolean;
		friend?: User;
	}>({ open: false });

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchQuery.trim().length >= 2) {
				setDebouncedQuery(searchQuery.trim());
			} else {
				setDebouncedQuery("");
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Search results logic
	useEffect(() => {
		if (debouncedQuery === "") {
			setSearchResults([]);
			return;
		}

		// Only show results when search is complete
		if (!searchLoading) {
			if (foundUsers && foundUsers.length > 0) {
				setSearchResults(foundUsers);
			} else {
				setSearchResults([]);
			}
		}
	}, [debouncedQuery, foundUsers, searchLoading, searchError]);

	const handleRefresh = async () => {
		setRefreshing(true);
		await Promise.all([refetchFriends(), refetchRequests()]);
		setRefreshing(false);
	};

	const handleSendFriendRequest = async (toUsername: string) => {
		console.log("🚀 Sending friend request...");
		console.log("  - toUsername:", toUsername);
		console.log("  - address:", address);
		console.log("  - signingClient:", signingClient);
		console.log("  - data object:", data);

		try {
			await sendFriendRequest(toUsername, address);
			console.log("✅ Friend request sent successfully!");

			// Add to sent requests to update UI
			setSentRequests((prev) => new Set([...prev, toUsername]));

			Toast.show({
				type: 'success',
				text1: 'Success',
				text2: 'Friend request sent!',
				position: 'bottom',
			});
		} catch (error) {
			console.error("❌ Friend request failed:", error);
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: error instanceof Error ? error.message : 'Failed to send friend request',
				position: 'bottom',
			});
		}
	};

	const handleRespondToRequest = async (
		requestUsername: string,
		response: "accepted" | "declined"
	) => {
		console.log("📨 Responding to friend request...");
		console.log("  - requestUsername:", requestUsername);
		console.log("  - response:", response);
		console.log("  - address:", address);
		console.log("  - signingClient:", signingClient);

		try {
			if (response === "accepted") {
				await acceptFriendRequest(requestUsername, address);
				Toast.show({
					type: 'success',
					text1: 'Success',
					text2: 'Friend request accepted!',
					position: 'bottom',
				});
			} else {
				Toast.show({
					type: 'info',
					text1: 'Declined',
					text2: 'Friend request declined.',
					position: 'bottom',
				});
			}
			await handleRefresh();
		} catch (error) {
			console.error("❌ Friend request response failed:", error);
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: error instanceof Error ? error.message : 'Failed to respond to request',
				position: 'bottom',
			});
		}
	};

	const renderStatusBadge = (pending?: boolean) => {
		let color = pending
			? colors.status?.warning || colors.primary[500]
			: colors.status?.success || colors.primary[600];
		let text = pending ? "Pending" : "Friend";
		return (
			<View
				style={{
					backgroundColor: color,
					borderRadius: 8,
					paddingHorizontal: 8,
					paddingVertical: 2,
					marginLeft: 8,
				}}
			>
				<Text style={{ color: colors.text.inverse, fontSize: 12 }}>
					{text}
				</Text>
			</View>
		);
	};

	const renderUserItem = (
		user: User,
		showAddButton: boolean = true,
		showRemoveButton: boolean = false,
		showStatusBadge: boolean = true
	) => (
		<View
			style={styles.userItem}
		>
			<View style={styles.userInfo}>
				<View style={styles.avatarPlaceholder}>
					<Text style={styles.avatarText}>
						{(user.display_name || user.username || "?").charAt(0).toUpperCase()}
					</Text>
				</View>
				<View style={styles.userTextContainer}>
					<Text style={styles.userName}>
						{user.display_name || user.username || "Unknown User"}
					</Text>
					<Text style={styles.userUsername}>@{user.username || "unknown"}</Text>
				</View>
			</View>
			{showAddButton && (
				<ActionButton
					icon={sentRequests.has(user.username) ? "checkmark" : "person-add"}
					variant="success"
					size="large"
					style={sentRequests.has(user.username) && styles.addButtonSent}
					onPress={() => handleSendFriendRequest(user.username)}
					disabled={opsLoading || sentRequests.has(user.username)}
				/>
			)}
			{showRemoveButton && (
				<ActionButton
					icon="person-remove"
					variant="error"
					size="large"
					onPress={() => setShowRemoveModal({ open: true, friend: user })}
					disabled={opsLoading}
				/>
			)}
		</View>
	);

	const renderFriendRequestItem = (request: User) => (
		<View
			style={styles.requestItem}
		>
			<View style={styles.userInfo}>
				<View style={styles.avatarPlaceholder}>
					<Text style={styles.avatarText}>
						{(request.display_name || request.username || "?").charAt(0).toUpperCase()}
					</Text>
				</View>
				<View style={styles.userTextContainer}>
					<Text style={styles.userName}>
						{request.display_name || request.username || "Unknown User"}
					</Text>
					<Text style={styles.userUsername}>@{request.username || "unknown"}</Text>
				</View>
			</View>
			<View style={styles.requestActions}>
				<ActionButton
					icon="checkmark"
					variant="success"
					size="medium"
					onPress={() => handleRespondToRequest(request.username, "accepted")}
					disabled={opsLoading}
				/>
				<ActionButton
					icon="close"
					variant="error"
					size="medium"
					onPress={() => handleRespondToRequest(request.username, "declined")}
					disabled={opsLoading}
				/>
			</View>
		</View>
	);

	const handleRemoveFriend = async (friend: User) => {
		// TODO: Implement contract call to remove friend if available
		Toast.show({
			type: 'info',
			text1: 'Removed',
			text2: `Friend ${friend.display_name || friend.username} removed (not implemented)`,
			position: 'bottom',
		});
		setShowRemoveModal({ open: false });
		await handleRefresh();
	};

	// Remove friend modal
	useEffect(() => {
		if (showRemoveModal.open && showRemoveModal.friend) {
			Alert.alert(
				"Remove Friend",
				"Are you sure you want to remove " +
					(showRemoveModal.friend.display_name ||
						showRemoveModal.friend.username) +
					"?",
				[
					{
						text: "Cancel",
						style: "cancel",
						onPress: () => setShowRemoveModal({ open: false }),
					},
					{
						text: "Remove",
						style: "destructive",
						onPress: () => handleRemoveFriend(showRemoveModal.friend!),
					},
				]
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [showRemoveModal]);

	const anyLoading =
		friendsLoading ||
		requestsLoading ||
		opsLoading ||
		searchLoading ||
		refreshing;
	const anyError = friendsError || requestsError || opsError || searchError;

	const handleLogout = async () => {
		try {
			await logout();
			router.replace("/");
		} catch {
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Failed to sign out. Please try again.',
				position: 'bottom',
			});
		}
	};

	const styles = createStyles(colors);

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
			{anyLoading && (
				<View style={{ padding: 24, alignItems: "center" }}>
					<ActivityIndicator
						size="large"
						color={colors.primary[800]}
					/>
				</View>
			)}
			{anyError && (
				<View style={{ padding: 24, alignItems: "center" }}>
					<Text
						style={{ color: colors.status?.error || colors.text.primary, fontSize: 16 }}
					>
						Error: {anyError}
					</Text>
				</View>
			)}
			{/* Tab Switcher */}
			<View style={styles.tabContainer}>
				<Pressable
					style={[styles.tab, activeTab === "find" && styles.tabActive]}
					onPress={() => setActiveTab("find")}
				>
					<Text style={[styles.tabText, activeTab === "find" && styles.tabTextActive]}>
						Find Friends
					</Text>
				</Pressable>
				<Pressable
					style={[styles.tab, activeTab === "requests" && styles.tabActive]}
					onPress={() => setActiveTab("requests")}
				>
					<Text style={[styles.tabText, activeTab === "requests" && styles.tabTextActive]}>
						Requests
						{pendingRequests.length > 0 && (
							<Text style={styles.tabBadge}> ({pendingRequests.length})</Text>
						)}
					</Text>
				</Pressable>
				<Pressable
					style={[styles.tab, activeTab === "friends" && styles.tabActive]}
					onPress={() => setActiveTab("friends")}
				>
					<Text style={[styles.tabText, activeTab === "friends" && styles.tabTextActive]}>
						Friends
						{friends.length > 0 && (
							<Text style={styles.tabBadge}> ({friends.length})</Text>
						)}
					</Text>
				</Pressable>
			</View>

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
				{/* Find Friends Tab */}
				{activeTab === "find" && (
					<View style={styles.section}>
					<Text style={styles.sectionTitle}>Find Friends</Text>
					<View style={styles.searchContainer}>
						<Ionicons
							name="search"
							size={20}
							color={colors.text.secondary}
							style={styles.searchIcon}
						/>
						<TextInput
							style={styles.searchInput}
							value={searchQuery}
							onChangeText={setSearchQuery}
							placeholder="Search by name or username..."
							placeholderTextColor={colors.text.tertiary}
						/>
					</View>
					{searchResults.length > 0 && (
						<View style={styles.searchResults}>
							{searchResults.map((user, index) =>
								<View key={user.username || user.wallet_address || index}>
									{renderUserItem(user, true, false, false)}
								</View>
							)}
						</View>
					)}
				</View>
				)}

				{/* Friend Requests Tab */}
				{activeTab === "requests" && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Friend Requests</Text>
						{pendingRequests.length > 0 ? (
							<View style={styles.requestsList}>
								{pendingRequests.map((request, index) => {
									return (
										<View key={request.username || request.wallet_address || index}>
											{renderFriendRequestItem(request)}
										</View>
									);
								})}
							</View>
						) : (
							<View style={styles.emptyState}>
								<Ionicons
									name="person-add-outline"
									size={48}
									color={colors.text.tertiary}
								/>
								<Text style={styles.emptyStateText}>No pending requests</Text>
								<Text style={styles.emptyStateSubtext}>
									Friend requests will appear here
								</Text>
							</View>
						)}
					</View>
				)}

				{/* Friends List Tab */}
				{activeTab === "friends" && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Your Friends</Text>
						{friends.length > 0 ? (
							<View style={styles.friendsList}>
								{friends.map((friend, index) => {
									return (
										<View key={friend.username || friend.wallet_address || index}>
											{renderUserItem(friend, false, true, false)}
										</View>
									);
								})}
							</View>
						) : (
							<View style={styles.emptyState}>
								<Ionicons
									name="people-outline"
									size={48}
									color={colors.text.tertiary}
								/>
								<Text style={styles.emptyStateText}>No friends yet</Text>
								<Text style={styles.emptyStateSubtext}>
									Search for people to add as friends
								</Text>
							</View>
						)}
					</View>
				)}
				{/* Bottom Spacer */}
				<View style={styles.bottomSpacer} />
			</ScrollView>
		</SafeAreaView>
	);
}

const createStyles = (colors: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface.primary,
	},
	tabContainer: {
		flexDirection: "row",
		backgroundColor: colors.surface.elevated,
		borderBottomWidth: 1,
		borderBottomColor: colors.border.secondary,
	},
	tab: {
		flex: 1,
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing.md,
		alignItems: "center",
		borderBottomWidth: 2,
		borderBottomColor: "transparent",
	},
	tabActive: {
		borderBottomColor: colors.primary[800],
	},
	tabText: {
		...DesignSystem.typography.label.medium,
		color: colors.text.secondary,
	},
	tabTextActive: {
		color: colors.primary[800],
		fontWeight: "600",
	},
	tabBadge: {
		color: colors.text.tertiary,
		fontSize: 12,
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
		color: colors.text.primary,
		marginBottom: DesignSystem.spacing.lg,
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: colors.border.secondary,
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingVertical: DesignSystem.spacing.lg,
	},
	searchIcon: {
		marginRight: DesignSystem.spacing.md,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		color: colors.text.primary,
		textAlignVertical: "center",
	},
	searchResults: {
		marginTop: DesignSystem.spacing.lg,
		backgroundColor: colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: colors.border.secondary,
	},
	userItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: colors.border.tertiary,
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
		backgroundColor: colors.primary[800],
		alignItems: "center",
		justifyContent: "center",
		marginRight: DesignSystem.spacing.md,
	},
	avatarText: {
		...DesignSystem.typography.label.medium,
		color: colors.text.inverse,
		fontWeight: "600",
	},
	userTextContainer: {
		flex: 1,
	},
	userName: {
		...DesignSystem.typography.label.large,
		color: colors.text.primary,
	},
	userUsername: {
		...DesignSystem.typography.body.small,
		color: colors.text.secondary,
	},
	addButtonSent: {
		backgroundColor: (colors.status?.success || colors.primary[600]) + "20", // Light green background
		borderColor: colors.status?.success || colors.primary[600],
	},
	pendingText: {
		...DesignSystem.typography.body.small,
		color: colors.text.secondary,
		fontStyle: "italic",
	},
	requestsList: {
		backgroundColor: colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: colors.border.secondary,
	},
	requestItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: colors.border.tertiary,
	},
	requestActions: {
		flexDirection: "row",
		gap: DesignSystem.spacing.sm,
	},
	friendsList: {
		backgroundColor: colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: colors.border.secondary,
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: DesignSystem.spacing["4xl"],
		paddingHorizontal: DesignSystem.spacing["2xl"],
	},
	emptyStateText: {
		...DesignSystem.typography.h4,
		color: colors.text.secondary,
		marginTop: DesignSystem.spacing.lg,
		textAlign: "center",
	},
	emptyStateSubtext: {
		...DesignSystem.typography.body.medium,
		color: colors.text.tertiary,
		marginTop: DesignSystem.spacing.sm,
		textAlign: "center",
	},
	bottomSpacer: {
		height: 140, // Space for tab bar
	},
});

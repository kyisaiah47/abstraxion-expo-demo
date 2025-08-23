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
	ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import { DesignSystem } from "@/constants/DesignSystem";
import { User } from "@/lib/socialContract";
import {
	useUserFriends,
	usePendingFriendRequests,
	useSocialOperations,
	useSearchUsers,
	useUserProfile,
} from "@/hooks/useSocialContract";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";

export default function FriendsScreen() {
	const { logout, data } = useAbstraxionAccount();
	const address = data?.bech32Address ?? "";

	// Get current user profile to get their username
	const { user: currentUser } = useUserProfile(address);
	const username = currentUser?.username || "";
	const {
		friends,
		loading: friendsLoading,
		error: friendsError,
		refetch: refetchFriends,
	} = useUserFriends(username);
	const {
		requests: pendingRequests,
		loading: requestsLoading,
		error: requestsError,
		refetch: refetchRequests,
	} = usePendingFriendRequests(username);
	// Get signing client for operations
	const {
		sendFriendRequest,
		acceptFriendRequest,
		loading: opsLoading,
		error: opsError,
	} = useSocialOperations(data?.signingClient);

	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");

	const {
		users: foundUsers,
		loading: searchLoading,
		error: searchError,
	} = useSearchUsers(debouncedQuery);
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [refreshing, setRefreshing] = useState(false);
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
		try {
			await sendFriendRequest(toUsername, address);
			Alert.alert("Success", "Friend request sent!");
			setSearchQuery("");
			setSearchResults([]);
			await handleRefresh();
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to send friend request"
			);
		}
	};

	const handleRespondToRequest = async (
		requestUsername: string,
		response: "accepted" | "declined"
	) => {
		try {
			if (response === "accepted") {
				await acceptFriendRequest(requestUsername, address);
				Alert.alert("Success", "Friend request accepted!");
			} else {
				Alert.alert("Declined", "Friend request declined.");
			}
			await handleRefresh();
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to respond to request"
			);
		}
	};

	const renderStatusBadge = (pending?: boolean) => {
		let color = pending
			? DesignSystem.colors.status.warning
			: DesignSystem.colors.status.success;
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
				<Text style={{ color: DesignSystem.colors.text.inverse, fontSize: 12 }}>
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
			key={user.username}
			style={styles.userItem}
		>
			<View style={styles.userInfo}>
				<View style={styles.avatarPlaceholder}>
					<Text style={styles.avatarText}>
						{(user.display_name || user.username).charAt(0).toUpperCase()}
					</Text>
				</View>
				<View style={styles.userTextContainer}>
					<Text style={styles.userName}>
						{user.display_name || user.username}
					</Text>
					<Text style={styles.userUsername}>@{user.username}</Text>
				</View>
				{showStatusBadge && renderStatusBadge(false)}
			</View>
			{showAddButton && (
				<Pressable
					style={styles.addButton}
					onPress={() => handleSendFriendRequest(user.username)}
					disabled={opsLoading}
				>
					<Ionicons
						name="person-add"
						size={20}
						color={DesignSystem.colors.status.success}
					/>
				</Pressable>
			)}
			{showRemoveButton && (
				<Pressable
					style={styles.addButton}
					onPress={() => setShowRemoveModal({ open: true, friend: user })}
					disabled={opsLoading}
				>
					<Ionicons
						name="person-remove"
						size={20}
						color={DesignSystem.colors.status.error}
					/>
				</Pressable>
			)}
		</View>
	);

	const renderFriendRequestItem = (request: User) => (
		<View
			key={request.username}
			style={styles.requestItem}
		>
			<View style={styles.userInfo}>
				<View style={styles.avatarPlaceholder}>
					<Text style={styles.avatarText}>
						{(request.display_name || request.username).charAt(0).toUpperCase()}
					</Text>
				</View>
				<View style={styles.userTextContainer}>
					<Text style={styles.userName}>
						{request.display_name || request.username}
					</Text>
					<Text style={styles.userUsername}>@{request.username}</Text>
				</View>
				{renderStatusBadge(true)}
			</View>
			<View style={styles.requestActions}>
				<Pressable
					style={[styles.requestButton, styles.acceptButton]}
					onPress={() => handleRespondToRequest(request.username, "accepted")}
					disabled={opsLoading}
				>
					<Ionicons
						name="checkmark"
						size={16}
						color={DesignSystem.colors.text.inverse}
					/>
				</Pressable>
				<Pressable
					style={[styles.requestButton, styles.declineButton]}
					onPress={() => handleRespondToRequest(request.username, "declined")}
					disabled={opsLoading}
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

	const handleRemoveFriend = async (friend: User) => {
		// TODO: Implement contract call to remove friend if available
		Alert.alert(
			"Removed",
			`Friend ${
				friend.display_name || friend.username
			} removed (not implemented)`
		);
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
			Alert.alert("Error", "Failed to sign out. Please try again.");
		}
	};

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
						color={DesignSystem.colors.primary[800]}
					/>
				</View>
			)}
			{anyError && (
				<View style={{ padding: 24, alignItems: "center" }}>
					<Text
						style={{ color: DesignSystem.colors.status.error, fontSize: 16 }}
					>
						Error: {anyError}
					</Text>
				</View>
			)}
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
							{searchResults.map((user) =>
								renderUserItem(user, true, false, false)
							)}
						</View>
					)}
				</View>
				{/* Pending Friend Requests */}
				{pendingRequests.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Friend Requests</Text>
						<View style={styles.requestsList}>
							{pendingRequests.map((request) => {
								return renderFriendRequestItem(request);
							})}
						</View>
					</View>
				)}
				{/* Friends List */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>
						{"Your Friends" +
							(friends.length > 0 ? " (" + friends.length + ")" : "")}
					</Text>
					{friends.length > 0 ? (
						<View style={styles.friendsList}>
							{friends.map((friend) => {
								return renderUserItem(friend, false, true, true);
							})}
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
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingVertical: DesignSystem.spacing.lg,
	},
	searchIcon: {
		marginRight: DesignSystem.spacing.md,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		color: DesignSystem.colors.text.primary,
		textAlignVertical: "center",
	},
	searchResults: {
		marginTop: DesignSystem.spacing.lg,
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},
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
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		alignItems: "center",
		justifyContent: "center",
		...DesignSystem.shadows.sm,
	},
	pendingText: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		fontStyle: "italic",
	},
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
	friendsList: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},
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

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
import { User } from "@/types/proofpay";
import {
	useUserFriends,
	usePendingFriendRequests,
	useSocialOperations,
	useUserByUsername,
} from "@/hooks/useSocialContract";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";

export default function FriendsScreen() {
	const { logout, data } = useAbstraxionAccount();
	const address = data?.bech32Address ?? "";
	// TODO: Replace with actual username from your app's user context/store
	const username = address ? address : "";
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
	const {
		sendFriendRequest,
		acceptFriendRequest,
		loading: opsLoading,
		error: opsError,
	} = useSocialOperations(address);

	const [searchQuery, setSearchQuery] = useState("");
	const {
		user: foundUser,
		loading: searchLoading,
		error: searchError,
	} = useUserByUsername(searchQuery);
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [showRemoveModal, setShowRemoveModal] = useState<{
		open: boolean;
		friend?: User;
	}>({ open: false });

	// Search logic
	useEffect(() => {
		if (searchQuery.trim().length < 2) {
			setSearchResults([]);
			return;
		}
		if (!searchLoading && foundUser) {
			// Defensive mapping for contract result
			const mappedUser = {
				id: foundUser.wallet_address || "",
				walletAddress: foundUser.wallet_address || "",
				username: foundUser.username || "",
				displayName: foundUser.display_name || foundUser.username || "",
				profilePicture: foundUser.profile_picture || undefined,
				createdAt: new Date(),
			};
			setSearchResults([mappedUser]);
		} else {
			setSearchResults([]);
		}
	}, [searchQuery, foundUser, searchLoading]);

	const handleRefresh = async () => {
		setRefreshing(true);
		await Promise.all([refetchFriends(), refetchRequests()]);
		setRefreshing(false);
	};

	const handleSendFriendRequest = async (username: string) => {
		try {
			await sendFriendRequest(address, username);
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
				await acceptFriendRequest(address, requestUsername);
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
		showRemoveButton: boolean = false
	) => (
		<View
			key={user.username}
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
				{renderStatusBadge(false)}
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
						color={DesignSystem.colors.primary[800]}
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
						{request.displayName.charAt(0).toUpperCase()}
					</Text>
				</View>
				<View style={styles.userTextContainer}>
					<Text style={styles.userName}>{request.displayName}</Text>
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
			`Friend ${friend.displayName} removed (not implemented)`
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
					showRemoveModal.friend.displayName +
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
							{searchResults.map((user) => renderUserItem(user, true, false))}
						</View>
					)}
				</View>
				{/* Pending Friend Requests */}
				{pendingRequests.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Friend Requests</Text>
						<View style={styles.requestsList}>
							{pendingRequests.map((request) => {
								const mappedRequest = {
									id: request.wallet_address || "",
									walletAddress: request.wallet_address || "",
									username: request.username || "",
									displayName: request.display_name || request.username || "",
									profilePicture: request.profile_picture || undefined,
									createdAt: new Date(),
								};
								return renderFriendRequestItem(mappedRequest);
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
								const mappedFriend = {
									id: friend.wallet_address || "",
									walletAddress: friend.wallet_address || "",
									username: friend.username || "",
									displayName: friend.display_name || friend.username || "",
									profilePicture: friend.profile_picture || undefined,
									createdAt: new Date(),
								};
								return renderUserItem(mappedFriend, false, true);
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

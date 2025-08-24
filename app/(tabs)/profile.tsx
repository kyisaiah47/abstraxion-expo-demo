import { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Pressable,
	Switch,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import AddressChip from "@/components/AddressChip";
import { DesignSystem } from "@/constants/DesignSystem";
import { User } from "@/types/proofpay";
import { UserService, initializeUserService } from "@/lib/userService";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import ZkTLSSelectionModal from "@/components/ZkTLSSelectionModal";
import ConfirmationModal from "@/components/ConfirmationModal";

interface MenuItem {
	id: string;
	title: string;
	subtitle?: string;
	icon: keyof typeof Ionicons.glyphMap;
	action: () => void;
	hasToggle?: boolean;
	isEnabled?: boolean;
	onToggle?: (value: boolean) => void;
	hasNotification?: boolean;
	notificationCount?: number;
}

export default function ProfileScreen() {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [unreadCount, setUnreadCount] = useState(0);
	const [showZkTLSModal, setShowZkTLSModal] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [userStats, setUserStats] = useState({
		totalTasks: 0,
		completedTasks: 0,
		totalEarned: 0,
		averageRating: 0,
	});

	// Theme and auth context
	const { user } = useAuth();
	const { isDarkMode, toggleDarkMode, colors } = useTheme();

	// Get wallet address from Abstraxion
	const { data, logout } = useAbstraxionAccount();
	const { client } = useAbstraxionSigningClient();
	const walletAddress = data?.bech32Address;

	const handleLogout = () => {
		setShowLogoutModal(true);
	};

	const confirmLogout = async () => {
		setShowLogoutModal(false);
		try {
			
			await logout();
			
			router.replace("/");
		} catch (error) {
			
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Failed to sign out. Please try again.",
				position: "bottom",
			});
		}
	};

	// Fetch user stats and notifications
	const fetchUserStats = async () => {
		if (!user?.walletAddress) return;

		try {
			// Get user tasks statistics
			const { data: tasks, error: tasksError } = await supabase
				.from("tasks")
				.select("*")
				.or(`payer.eq.${user.walletAddress},worker.eq.${user.walletAddress}`);

			if (tasksError) {
				
				return;
			}

			const totalTasks = tasks?.length || 0;
			const completedTasks =
				tasks?.filter((task) => task.status === "released").length || 0;
			const totalEarned =
				tasks
					?.filter(
						(task) =>
							task.status === "released" && task.worker === user.walletAddress
					)
					.reduce((sum, task) => sum + parseFloat(task.amount) / 1000000, 0) ||
				0;

			setUserStats({
				totalTasks,
				completedTasks,
				totalEarned,
				averageRating: 4.8, // Placeholder for now
			});

			// Get unread notifications count
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("id")
				.eq("wallet_address", user.walletAddress)
				.single();

			if (userError || !userData) {
				
				return;
			}

			const { count, error: notifError } = await supabase
				.from("notifications")
				.select("*", { count: "exact", head: true })
				.eq("user_id", userData.id)
				.is("read_at", null);

			if (!notifError) {
				setUnreadCount(count || 0);
			}
		} catch (error) {
			
		}
	};

	// Initialize UserService and load current user data
	useEffect(() => {
		if (!client || !walletAddress) return;
		initializeUserService(client, walletAddress);
		const loadUserData = async () => {
			try {
				const user = await UserService.getCurrentUser();
				setCurrentUser(user);
			} catch (error) {
				
			}
		};
		loadUserData();
	}, [client, walletAddress]);

	// Fetch user stats and notifications
	useEffect(() => {
		fetchUserStats();
	}, [user?.walletAddress]);

	const menuSections = [
		{
			title: "Account",
			items: [
				{
					id: "activity-feed",
					title: "Activity Feed",
					subtitle:
						unreadCount > 0
							? `${unreadCount} new notification${unreadCount > 1 ? "s" : ""}`
							: "View your task activity",
					icon: "notifications-outline" as const,
					action: () => router.push("/(tabs)/recent-activity"),
					hasNotification: unreadCount > 0,
					notificationCount: unreadCount,
				},
				{
					id: "edit-profile",
					title: "Edit Profile",
					subtitle: "Update your name and username",
					icon: "create-outline" as const,
					action: () => router.push("/edit-profile"),
				},
				{
					id: "wallet-settings",
					title: "Wallet Settings",
					subtitle: "Manage connected wallets",
					icon: "wallet-outline" as const,
					action: () => router.push("/wallet-settings"),
				},
			],
		},
		{
			title: "Verification",
			items: [
				{
					id: "zkTLS-providers",
					title: "Available zkTLS Providers",
					subtitle: "Browse verification methods",
					icon: "shield-checkmark-outline" as const,
					action: () => setShowZkTLSModal(true),
				},
				{
					id: "zkTLS-demo",
					title: "zkTLS Verification",
					subtitle: "Try cryptographic proof system",
					icon: "shield-outline" as const,
					action: () => router.push("/zktls-demo"),
				},
			],
		},
		{
			title: "Settings",
			items: [
				{
					id: "notifications",
					title: "Push Notifications",
					subtitle: "Get notified about payments",
					icon: "notifications-outline" as const,
					hasToggle: true,
					isEnabled: notificationsEnabled,
					onToggle: setNotificationsEnabled,
					action: () => {},
				},
				{
					id: "dark-mode",
					title: "Dark Mode",
					subtitle: "Switch to dark theme",
					icon: "moon-outline" as const,
					hasToggle: true,
					isEnabled: isDarkMode,
					onToggle: toggleDarkMode,
					action: () => {},
				},
			],
		},
		{
			title: "Support",
			items: [
				{
					id: "help-center",
					title: "Help Center",
					subtitle: "Get help and support",
					icon: "help-circle-outline" as const,
					action: () => router.push("/help-center"),
				},
			],
		},
	];

	const renderMenuItem = (item: MenuItem) => (
		<Pressable
			key={item.id}
			style={styles.menuItem}
			onPress={item.action}
			android_ripple={{
				color: DesignSystem.colors.primary[100],
			}}
		>
			{({ pressed }) => (
				<View
					style={[styles.menuItemContent, pressed && styles.menuItemPressed]}
				>
					<View style={styles.menuItemLeft}>
						<View style={styles.menuIconContainer}>
							<Ionicons
								name={item.icon}
								size={20}
								color={colors.primary[800]}
							/>
						</View>
						<View style={styles.menuTextContainer}>
							<Text style={styles.menuItemTitle}>{item.title}</Text>
							{item.subtitle && (
								<Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
							)}
						</View>
					</View>

					<View style={styles.menuItemRight}>
						{item.hasToggle && item.onToggle ? (
							<Switch
								value={item.isEnabled}
								onValueChange={item.onToggle}
								trackColor={{
									false: colors.border.secondary,
									true: colors.primary[800],
								}}
								thumbColor={colors.surface.primary}
							/>
						) : (
							<View style={styles.rightContent}>
								{item.hasNotification &&
									item.notificationCount &&
									item.notificationCount > 0 && (
										<View
											style={[
												styles.notificationBadge,
												{ backgroundColor: colors.status?.error || "#DC2626" },
											]}
										>
											<Text style={styles.notificationText}>
												{item.notificationCount > 9
													? "9+"
													: item.notificationCount}
											</Text>
										</View>
									)}
								<Ionicons
									name="chevron-forward"
									size={20}
									color={colors.text.tertiary}
								/>
							</View>
						)}
					</View>
				</View>
			)}
		</Pressable>
	);

	const renderMenuSection = (section: (typeof menuSections)[0]) => (
		<View
			key={section.title}
			style={styles.menuSection}
		>
			<Text style={styles.sectionTitle}>{section.title}</Text>
			<View style={styles.menuContainer}>
				{section.items.map(renderMenuItem)}
			</View>
		</View>
	);

	const styles = createStyles(colors);

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title="Profile"
				subtitle="Manage your account and settings"
				onLogout={handleLogout}
			/>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* User Profile Card */}
				<View
					style={[
						styles.profileCard,
						{
							backgroundColor: colors.surface.secondary,
							borderColor: colors.border.primary,
						},
					]}
				>
					<View style={styles.profileHeader}>
						<View style={styles.avatarContainer}>
							<View style={styles.avatarPlaceholder}>
								<Text style={styles.avatarText}>
									{currentUser?.display_name
										? currentUser.display_name.charAt(0).toUpperCase()
										: "U"}
								</Text>
							</View>
						</View>
						<View style={styles.profileInfo}>
							<Text style={styles.displayName}>
								{currentUser?.display_name || "Loading..."}
							</Text>
							<Text style={styles.username}>
								@{currentUser?.username || "username"}
							</Text>
						</View>
					</View>

					{/* Wallet Address */}
					<View style={styles.walletSection}>
						<Text style={styles.walletLabel}>Wallet Address</Text>
						<AddressChip
							address={
								currentUser?.wallet_address ||
								"0x0000000000000000000000000000000000000000"
							}
							variant="default"
						/>
					</View>
				</View>

				{/* Stats Card */}
				<View
					style={[
						styles.statsCard,
						{
							backgroundColor: colors.surface.secondary,
							borderColor: colors.border.primary,
						},
					]}
				>
					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<Text style={[styles.statValue, { color: colors.text.primary }]}>
								{userStats.totalTasks}
							</Text>
							<Text
								style={[styles.statLabel, { color: colors.text.secondary }]}
							>
								Total Tasks
							</Text>
						</View>
						<View style={styles.statItem}>
							<Text
								style={[
									styles.statValue,
									{ color: colors.status?.success || "#059669" },
								]}
							>
								{userStats.completedTasks}
							</Text>
							<Text
								style={[styles.statLabel, { color: colors.text.secondary }]}
							>
								Completed
							</Text>
						</View>
						<View style={styles.statItem}>
							<Text style={[styles.statValue, { color: colors.text.primary }]}>
								${userStats.totalEarned.toFixed(1)}
							</Text>
							<Text
								style={[styles.statLabel, { color: colors.text.secondary }]}
							>
								Earned
							</Text>
						</View>
						<View style={styles.statItem}>
							<View style={styles.ratingContainer}>
								<Text
									style={[styles.statValue, { color: colors.text.primary }]}
								>
									{userStats.averageRating.toFixed(1)}
								</Text>
								<Ionicons
									name="star"
									size={16}
									color="#F59E0B"
								/>
							</View>
							<Text
								style={[styles.statLabel, { color: colors.text.secondary }]}
							>
								Rating
							</Text>
						</View>
					</View>
				</View>

				{/* Menu Sections */}
				{menuSections.map(renderMenuSection)}

				{/* Bottom Spacer */}
				<View style={styles.bottomSpacer} />
			</ScrollView>

			<ZkTLSSelectionModal
				visible={showZkTLSModal}
				onClose={() => setShowZkTLSModal(false)}
				title="zkTLS Verification Providers"
				subtitle="Explore all available verification methods"
				mode="browse"
				showCategories={true}
				showStatus={true}
			/>

			<ConfirmationModal
				visible={showLogoutModal}
				title="Sign Out"
				message="Are you sure you want to sign out of your account?"
				confirmText="Sign Out"
				cancelText="Cancel"
				confirmStyle="destructive"
				icon="log-out-outline"
				onConfirm={confirmLogout}
				onCancel={() => setShowLogoutModal(false)}
			/>
		</SafeAreaView>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.surface.primary,
		},

		scrollView: {
			flex: 1,
		},

		scrollContent: {
			paddingHorizontal: DesignSystem.layout.containerPadding,
			paddingTop: DesignSystem.spacing["2xl"],
		},

		// Profile Card Styles
		profileCard: {
			backgroundColor: colors.surface.secondary,
			borderRadius: DesignSystem.radius.xl,
			padding: DesignSystem.spacing["3xl"],
			borderWidth: 1,
			marginBottom: DesignSystem.spacing["3xl"],
			...DesignSystem.shadows.md,
		},

		profileHeader: {
			flexDirection: "row",
			alignItems: "center",
			marginBottom: DesignSystem.spacing["2xl"],
		},

		avatarContainer: {
			marginRight: DesignSystem.spacing.lg,
		},

		avatarPlaceholder: {
			width: 60,
			height: 60,
			borderRadius: 30,
			backgroundColor: colors.primary[800],
			alignItems: "center",
			justifyContent: "center",
		},

		avatarText: {
			...DesignSystem.typography.h3,
			color: colors.text.inverse,
			fontWeight: "600",
		},

		profileInfo: {
			flex: 1,
		},

		displayName: {
			...DesignSystem.typography.h3,
			color: colors.text.primary,
			marginBottom: 4,
		},

		username: {
			...DesignSystem.typography.body.large,
			color: colors.text.secondary,
		},

		walletSection: {
			gap: DesignSystem.spacing.md,
		},

		walletLabel: {
			...DesignSystem.typography.label.medium,
			color: colors.text.secondary,
		},

		// Menu Styles
		menuSection: {
			marginBottom: DesignSystem.spacing["3xl"],
		},

		sectionTitle: {
			...DesignSystem.typography.h4,
			color: colors.text.primary,
			marginBottom: DesignSystem.spacing.lg,
		},

		menuContainer: {
			backgroundColor: colors.surface.secondary,
			borderRadius: DesignSystem.radius.xl,
			overflow: "hidden",
			...DesignSystem.shadows.sm,
		},

		menuItem: {
			borderBottomWidth: 1,
			borderBottomColor: colors.border.tertiary,
		},

		menuItemContent: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingVertical: DesignSystem.spacing.lg,
			paddingHorizontal: DesignSystem.spacing["2xl"],
			minHeight: 60,
		},

		menuItemPressed: {
			backgroundColor: colors.surface.tertiary,
		},

		menuItemLeft: {
			flexDirection: "row",
			alignItems: "center",
			flex: 1,
		},

		menuIconContainer: {
			width: 32,
			height: 32,
			borderRadius: 16,
			backgroundColor: colors.primary[50] || colors.surface.tertiary,
			alignItems: "center",
			justifyContent: "center",
			marginRight: DesignSystem.spacing.md,
		},

		menuTextContainer: {
			flex: 1,
		},

		menuItemTitle: {
			...DesignSystem.typography.label.large,
			color: colors.text.primary,
			marginBottom: 2,
		},

		menuItemSubtitle: {
			...DesignSystem.typography.body.small,
			color: colors.text.secondary,
		},

		menuItemRight: {
			marginLeft: DesignSystem.spacing.md,
		},

		rightContent: {
			flexDirection: "row",
			alignItems: "center",
			gap: DesignSystem.spacing.sm,
		},

		notificationBadge: {
			width: 20,
			height: 20,
			borderRadius: 10,
			alignItems: "center",
			justifyContent: "center",
			marginRight: DesignSystem.spacing.xs,
		},

		notificationText: {
			...DesignSystem.typography.body.small,
			color: "white",
			fontWeight: "600",
			fontSize: 10,
		},

		// Stats Card Styles
		statsCard: {
			borderRadius: DesignSystem.radius.xl,
			padding: DesignSystem.spacing.xl,
			marginBottom: DesignSystem.spacing["3xl"],
			borderWidth: 1,
			...DesignSystem.shadows.sm,
		},

		statsRow: {
			flexDirection: "row",
			justifyContent: "space-between",
		},

		statItem: {
			alignItems: "center",
			flex: 1,
		},

		statValue: {
			...DesignSystem.typography.h3,
			fontWeight: "700",
			marginBottom: 4,
		},

		statLabel: {
			...DesignSystem.typography.body.small,
			textAlign: "center",
		},

		ratingContainer: {
			flexDirection: "row",
			alignItems: "center",
			gap: 4,
		},

		bottomSpacer: {
			height: 140, // Space for tab bar
		},
	});

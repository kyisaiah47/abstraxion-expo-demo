import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Pressable,
	Switch,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import AddressChip from "@/components/AddressChip";
import { DesignSystem } from "@/constants/DesignSystem";
import { User } from "@/types/proofpay";
import { UserService } from "@/lib/userService";

interface MenuItem {
	id: string;
	title: string;
	subtitle?: string;
	icon: keyof typeof Ionicons.glyphMap;
	action: () => void;
	hasToggle?: boolean;
	isEnabled?: boolean;
	onToggle?: (value: boolean) => void;
}

export default function ProfileScreen() {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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

	// Load current user data
	useEffect(() => {
		const loadUserData = async () => {
			try {
				const user = await UserService.getCurrentUser();
				setCurrentUser(user);
			} catch (error) {
				console.error("Error loading user:", error);
			}
		};
		loadUserData();
	}, []);

	const menuSections = [
		{
			title: "Account",
			items: [
				{
					id: "edit-profile",
					title: "Edit Profile",
					subtitle: "Update your name and username",
					icon: "create-outline" as const,
					action: () =>
						Alert.alert(
							"Coming Soon",
							"Profile editing will be available soon!"
						),
				},
				{
					id: "wallet-settings",
					title: "Wallet Settings",
					subtitle: "Manage connected wallets",
					icon: "wallet-outline" as const,
					action: () => Alert.alert("Wallet", "Wallet management coming soon!"),
				},
			],
		},
		{
			title: "Verification",
			items: [
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
					isEnabled: darkModeEnabled,
					onToggle: setDarkModeEnabled,
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
					action: () => Alert.alert("Help", "Support system coming soon!"),
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
								color={DesignSystem.colors.primary[800]}
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
									false: DesignSystem.colors.border.secondary,
									true: DesignSystem.colors.primary[800],
								}}
								thumbColor={DesignSystem.colors.surface.primary}
							/>
						) : (
							<Ionicons
								name="chevron-forward"
								size={20}
								color={DesignSystem.colors.text.tertiary}
							/>
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
				<View style={styles.profileCard}>
					<View style={styles.profileHeader}>
						<View style={styles.avatarContainer}>
							<View style={styles.avatarPlaceholder}>
								<Text style={styles.avatarText}>
									{currentUser
										? currentUser.displayName.charAt(0).toUpperCase()
										: "U"}
								</Text>
							</View>
						</View>
						<View style={styles.profileInfo}>
							<Text style={styles.displayName}>
								{currentUser?.displayName || "Loading..."}
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
								currentUser?.walletAddress ||
								"0x0000000000000000000000000000000000000000"
							}
							variant="default"
						/>
					</View>
				</View>

				{/* Menu Sections */}
				{menuSections.map(renderMenuSection)}

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

	// Profile Card Styles
	profileCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["3xl"],
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
		backgroundColor: DesignSystem.colors.primary[800],
		alignItems: "center",
		justifyContent: "center",
	},

	avatarText: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	profileInfo: {
		flex: 1,
	},

	displayName: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		marginBottom: 4,
	},

	username: {
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.secondary,
	},

	walletSection: {
		gap: DesignSystem.spacing.md,
	},

	walletLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.secondary,
	},

	// Menu Styles
	menuSection: {
		marginBottom: DesignSystem.spacing["3xl"],
	},

	sectionTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.lg,
	},

	menuContainer: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		overflow: "hidden",
		...DesignSystem.shadows.sm,
	},

	menuItem: {
		borderBottomWidth: 1,
		borderBottomColor: DesignSystem.colors.border.tertiary,
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
		backgroundColor: DesignSystem.colors.surface.tertiary,
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
		backgroundColor:
			DesignSystem.colors.primary[50] || DesignSystem.colors.surface.tertiary,
		alignItems: "center",
		justifyContent: "center",
		marginRight: DesignSystem.spacing.md,
	},

	menuTextContainer: {
		flex: 1,
	},

	menuItemTitle: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
		marginBottom: 2,
	},

	menuItemSubtitle: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},

	menuItemRight: {
		marginLeft: DesignSystem.spacing.md,
	},

	bottomSpacer: {
		height: 140, // Space for tab bar
	},
});

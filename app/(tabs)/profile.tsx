import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Pressable,
	Image,
	Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import { DesignSystem } from "@/constants/DesignSystem";

interface UserStats {
	tasksCompleted: number;
	totalEarnings: number;
	pendingPayments: number;
	verifiedTasks: number;
}

interface MenuItem {
	id: string;
	title: string;
	subtitle?: string;
	icon: keyof typeof Ionicons.glyphMap;
	action: string;
	badge?: string;
	hasToggle?: boolean;
	isEnabled?: boolean;
}

export default function ProofPayProfile() {
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [darkModeEnabled, setDarkModeEnabled] = useState(false);
	const { logout } =
		require("@burnt-labs/abstraxion-react-native").useAbstraxionAccount();

	const userStats: UserStats = {
		tasksCompleted: 12,
		totalEarnings: 850.5,
		pendingPayments: 150.0,
		verifiedTasks: 11,
	};

	const menuSections = [
		{
			title: "Wallet",
			items: [
				{
					id: "wallet-balance",
					title: "Wallet Balance",
					subtitle: "View and manage your funds",
					icon: "wallet-outline",
					action: "wallet-balance",
				},
				{
					id: "payment-history",
					title: "Payment History",
					subtitle: "View all transactions",
					icon: "time-outline",
					action: "payment-history",
				},
				{
					id: "verification",
					title: "Identity Verification",
					subtitle: "Verify your identity for higher limits",
					icon: "shield-checkmark-outline",
					action: "verification",
					badge: "Verified",
				},
			] as MenuItem[],
		},
		{
			title: "Tasks",
			items: [
				{
					id: "task-history",
					title: "Task History",
					subtitle: "View completed and pending tasks",
					icon: "list-outline",
					action: "task-history",
				},
				{
					id: "proof-verification",
					title: "Proof Verification",
					subtitle: "zkTLS verification settings",
					icon: "shield-outline",
					action: "proof-verification",
				},
			] as MenuItem[],
		},
		{
			title: "Settings",
			items: [
				{
					id: "notifications",
					title: "Push Notifications",
					subtitle: "Get notified about new payments",
					icon: "notifications-outline",
					action: "notifications",
					hasToggle: true,
					isEnabled: notificationsEnabled,
				},
				{
					id: "dark-mode",
					title: "Dark Mode",
					subtitle: "Use dark theme interface",
					icon: "moon-outline",
					action: "dark-mode",
					hasToggle: true,
					isEnabled: darkModeEnabled,
				},
			] as MenuItem[],
		},
		{
			title: "Support",
			items: [
				{
					id: "help-center",
					title: "Help Center",
					subtitle: "Get help and support",
					icon: "help-circle-outline",
					action: "help-center",
				},
				{
					id: "demo",
					title: "View Demo",
					subtitle: "See zkTLS verification in action",
					icon: "play-circle-outline",
					action: "demo",
				},
			] as MenuItem[],
		},
	];

	const handleMenuAction = (action: string, item?: MenuItem) => {
		switch (action) {
			case "notifications":
				setNotificationsEnabled(!notificationsEnabled);
				break;
			case "dark-mode":
				setDarkModeEnabled(!darkModeEnabled);
				break;
			case "payment-history":
				router.push("/(tabs)/activity");
				break;
			case "demo":
				router.push("/zktls-demo");
				break;
			default:
				console.log(`Action: ${action}`);
		}
	};

	const renderStatsCard = () => (
		<View style={styles.statsCard}>
			<LinearGradient
				colors={[
					DesignSystem.colors.primary[700],
					DesignSystem.colors.primary[900],
				]}
				style={StyleSheet.absoluteFillObject}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			/>

			<View style={styles.statsContent}>
				<View style={styles.statsGrid}>
					<View style={styles.statItem}>
						<Text style={styles.statValue}>{userStats.tasksCompleted}</Text>
						<Text style={styles.statLabel}>Tasks Completed</Text>
					</View>

					<View style={styles.statItem}>
						<Text style={styles.statValue}>
							${userStats.totalEarnings.toFixed(0)}
						</Text>
						<Text style={styles.statLabel}>Total Earned</Text>
					</View>

					<View style={styles.statItem}>
						<Text style={styles.statValue}>
							${userStats.pendingPayments.toFixed(0)}
						</Text>
						<Text style={styles.statLabel}>Pending</Text>
					</View>

					<View style={styles.statItem}>
						<Text style={styles.statValue}>{userStats.verifiedTasks}</Text>
						<Text style={styles.statLabel}>Verified</Text>
					</View>
				</View>
			</View>
		</View>
	);

	const renderMenuItem = (item: MenuItem) => (
		<Pressable
			key={item.id}
			style={styles.menuItem}
			onPress={() => handleMenuAction(item.action, item)}
		>
			<View style={styles.menuItemIcon}>
				<Ionicons
					name={item.icon}
					size={20}
					color={DesignSystem.colors.text.secondary}
				/>
			</View>

			<View style={styles.menuItemContent}>
				<View style={styles.menuItemText}>
					<Text style={styles.menuItemTitle}>{item.title}</Text>
					{item.subtitle && (
						<Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
					)}
				</View>

				<View style={styles.menuItemAction}>
					{item.badge && (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{item.badge}</Text>
						</View>
					)}

					{item.hasToggle ? (
						<Switch
							value={item.isEnabled}
							onValueChange={() => handleMenuAction(item.action, item)}
							trackColor={{
								false: DesignSystem.colors.border.primary,
								true: DesignSystem.colors.primary[800],
							}}
							thumbColor={DesignSystem.colors.surface.elevated}
						/>
					) : (
						<Ionicons
							name="chevron-forward"
							size={16}
							color={DesignSystem.colors.text.tertiary}
						/>
					)}
				</View>
			</View>
		</Pressable>
	);

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title="Profile"
				subtitle="Manage your ProofPay account"
			/>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Profile Header */}
				<View style={styles.profileHeader}>
					<View style={styles.avatarContainer}>
						<Image
							source={{
								uri: "https://via.placeholder.com/120/2563EB/FFFFFF?text=JD",
							}}
							style={styles.avatar}
						/>
						<Pressable style={styles.editAvatarButton}>
							<Ionicons
								name="camera"
								size={16}
								color={DesignSystem.colors.text.inverse}
							/>
						</Pressable>
					</View>

					<View style={styles.profileInfo}>
						<Text style={styles.profileName}>John Doe</Text>
						<Text style={styles.profileEmail}>john.doe@example.com</Text>
						<Text style={styles.profileJoined}>
							ProofPay member since January 2024
						</Text>
					</View>
				</View>

				{/* Stats Card */}
				{renderStatsCard()}

				{/* Menu Sections */}
				{menuSections.map((section, sectionIndex) => (
					<View
						key={section.title}
						style={styles.menuSection}
					>
						<Text style={styles.sectionTitle}>{section.title}</Text>
						<View style={styles.menuCard}>
							{section.items.map((item, itemIndex) => (
								<View key={item.id}>
									{renderMenuItem(item)}
									{itemIndex < section.items.length - 1 && (
										<View style={styles.menuSeparator} />
									)}
								</View>
							))}
						</View>
					</View>
				))}

				{/* Trust Message */}
				<View style={styles.trustSection}>
					<View style={styles.trustCard}>
						<Ionicons
							name="shield-checkmark"
							size={28}
							color={DesignSystem.colors.primary[700]}
						/>
						<Text style={styles.trustTitle}>Verified Payments</Text>
						<Text style={styles.trustSubtitle}>
							Your payments are secured with cryptographic proof verification
						</Text>
					</View>
				</View>

				{/* Logout Section */}
				<View style={styles.logoutSection}>
					<Pressable
						style={styles.logoutButton}
						onPress={logout}
					>
						<Ionicons
							name="log-out-outline"
							size={20}
							color={DesignSystem.colors.status.error}
						/>
						<Text style={styles.logoutText}>Sign Out</Text>
					</Pressable>
				</View>

				{/* App Version */}
				<View style={styles.versionSection}>
					<Text style={styles.versionText}>ProofPay v1.0.0 (Build 1)</Text>
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

	// Profile Header
	profileHeader: {
		alignItems: "center",
		marginBottom: DesignSystem.spacing["4xl"],
		gap: DesignSystem.spacing["2xl"],
	},

	avatarContainer: {
		position: "relative",
	},

	avatar: {
		width: 120,
		height: 120,
		borderRadius: 60,
		borderWidth: 4,
		borderColor: DesignSystem.colors.surface.elevated,
		...DesignSystem.shadows.lg,
	},

	editAvatarButton: {
		position: "absolute",
		bottom: 8,
		right: 8,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: DesignSystem.colors.primary[800],
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: DesignSystem.colors.surface.elevated,
	},

	profileInfo: {
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
	},

	profileName: {
		...DesignSystem.typography.h2,
		color: DesignSystem.colors.text.primary,
	},

	profileEmail: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
	},

	profileJoined: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.tertiary,
	},

	// Stats Card
	statsCard: {
		borderRadius: DesignSystem.radius.xl,
		marginBottom: DesignSystem.spacing["4xl"],
		overflow: "hidden",
		...DesignSystem.shadows.lg,
	},

	statsContent: {
		padding: DesignSystem.spacing["3xl"],
	},

	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: DesignSystem.spacing["2xl"],
	},

	statItem: {
		flex: 1,
		minWidth: "45%",
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
	},

	statValue: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.inverse,
	},

	statLabel: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.inverse,
		opacity: 0.9,
		textAlign: "center",
	},

	// Menu Sections
	menuSection: {
		marginBottom: DesignSystem.spacing["4xl"],
	},

	sectionTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.xl,
	},

	menuCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
		overflow: "hidden",
	},

	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: DesignSystem.spacing["2xl"],
		gap: DesignSystem.spacing.xl,
	},

	menuSeparator: {
		height: 1,
		backgroundColor: DesignSystem.colors.border.tertiary,
		marginLeft: 72, // Icon width + gap
	},

	menuItemIcon: {
		width: 40,
		height: 40,
		borderRadius: DesignSystem.radius.lg,
		backgroundColor: DesignSystem.colors.surface.tertiary,
		alignItems: "center",
		justifyContent: "center",
	},

	menuItemContent: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	menuItemText: {
		flex: 1,
		gap: DesignSystem.spacing.xs,
	},

	menuItemTitle: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	menuItemSubtitle: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},

	menuItemAction: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.md,
	},

	badge: {
		backgroundColor: DesignSystem.colors.status.success + "20",
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.xs,
		borderRadius: DesignSystem.radius.md,
	},

	badgeText: {
		...DesignSystem.typography.label.small,
		color: DesignSystem.colors.status.success,
	},

	// Trust Section
	trustSection: {
		marginBottom: DesignSystem.spacing["4xl"],
	},

	trustCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["3xl"],
		alignItems: "center",
		gap: DesignSystem.spacing.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
	},

	trustTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		textAlign: "center",
	},

	trustSubtitle: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
		lineHeight: 22,
	},

	// Logout Section
	logoutSection: {
		marginBottom: DesignSystem.spacing["2xl"],
	},

	logoutButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: DesignSystem.spacing.xl,
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.status.error + "30",
		gap: DesignSystem.spacing.md,
	},

	logoutText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.status.error,
	},

	// Version Section
	versionSection: {
		alignItems: "center",
		marginBottom: DesignSystem.spacing["2xl"],
	},

	versionText: {
		...DesignSystem.typography.caption,
		color: DesignSystem.colors.text.tertiary,
	},

	bottomSpacer: {
		height: 140, // Space for tab bar
	},
});

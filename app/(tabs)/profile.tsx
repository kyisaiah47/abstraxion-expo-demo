import React, { useState } from "react";
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
import InfoCard from "@/components/InfoCard";
import { DesignSystem } from "@/constants/DesignSystem";
import { UserWallet, UserStats } from "@/types/proofpay";

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

export default function ProofIDScreen() {
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [darkModeEnabled, setDarkModeEnabled] = useState(false);
	const { logout } =
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

	// Mock user data - in real app this would come from auth/wallet state
	const userWallet: UserWallet = {
		address: "0x742D35Cc6635C0532925a3b8D67F8A8d00C00000",
		ens: undefined,
		chain: "XION",
		activeSince: new Date("2024-01-15"),
	};

	const userStats: UserStats = {
		totalProofs: 12,
		verifiedBalance: 850.5,
		awaitingProofs: 3,
		activeSince: new Date("2024-01-15"),
		// Legacy stats for compatibility
		tasksCompleted: 12,
		totalEarned: 850.5,
		awaitingAmount: 150.0,
		proofConfirmed: 11,
	};

	const menuSections = [
		{
			title: "Verification",
			items: [
				{
					id: "proof-history",
					title: "Proof History",
					subtitle: "View all verification records",
					icon: "shield-checkmark-outline",
					action: "proof-history",
				},
				{
					id: "wallet-settings",
					title: "Wallet Settings",
					subtitle: "Manage your XION wallet",
					icon: "wallet-outline",
					action: "wallet-settings",
				},
			] as MenuItem[],
		},
		{
			title: "Privacy",
			items: [
				{
					id: "data-export",
					title: "Export Data",
					subtitle: "Download your proof records",
					icon: "download-outline",
					action: "data-export",
				},
				{
					id: "verification-level",
					title: "Verification Level",
					subtitle: "Advanced cryptographic proofs",
					icon: "shield-outline",
					action: "verification-level",
					badge: "zkTLS",
				},
			] as MenuItem[],
		},
		{
			title: "Preferences",
			items: [
				{
					id: "notifications",
					title: "Push Notifications",
					subtitle: "Get notified about proof updates",
					icon: "notifications-outline",
					action: "notifications",
					hasToggle: true,
					isEnabled: notificationsEnabled,
				},
				{
					id: "dark-mode",
					title: "Appearance",
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
					id: "verification-demo",
					title: "zkTLS Demo",
					subtitle: "See proof verification in action",
					icon: "play-circle-outline",
					action: "verification-demo",
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
			case "proof-history":
				router.push("/(tabs)/activity");
				break;
			case "verification-demo":
				router.push("/zktls-demo");
				break;
			default:
				console.log(`Action: ${action}`);
		}
	};

	const renderStatsCard = () => (
		<View style={styles.statsCard}>
			<View style={styles.statsHeader}>
				<View style={styles.statsHeaderContent}>
					<Ionicons
						name="shield-checkmark"
						size={20}
						color={DesignSystem.colors.primary[700]}
					/>
					<Text style={styles.statsTitle}>Proof Statistics</Text>
				</View>
			</View>

			<View style={styles.statsGrid}>
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{userStats.totalProofs}</Text>
					<Text style={styles.statLabel}>Total Proofs</Text>
				</View>

				<View style={styles.statItem}>
					<Text style={styles.statValue}>
						${userStats.verifiedBalance.toFixed(0)}
					</Text>
					<Text style={styles.statLabel}>Verified Balance</Text>
				</View>

				<View style={styles.statItem}>
					<Text style={styles.statValue}>{userStats.awaitingProofs}</Text>
					<Text style={styles.statLabel}>Awaiting Proof</Text>
				</View>

				<View style={styles.statItem}>
					<Text style={styles.statValue}>
						{Math.floor(
							(Date.now() - userStats.activeSince.getTime()) /
								(1000 * 60 * 60 * 24)
						)}
						d
					</Text>
					<Text style={styles.statLabel}>Days Active</Text>
				</View>
			</View>
		</View>
	);

	const renderTreasuryCard = () => {
		const treasuryBalance = 4200.0;
		const isAdmin = false; // Mock - would be determined by user role

		return (
			<View style={styles.treasuryCard}>
				<View style={styles.treasuryHeader}>
					<View style={styles.treasuryIconContainer}>
						<Ionicons
							name="business"
							size={20}
							color={DesignSystem.colors.text.inverse}
						/>
					</View>
					<View style={styles.treasuryInfo}>
						<Text style={styles.treasuryTitle}>Treasury</Text>
						<Text style={styles.treasurySubtitle}>
							Pooled balance secured by XION
						</Text>
					</View>
				</View>

				<Text style={styles.treasuryAmount}>${treasuryBalance.toFixed(2)}</Text>

				<Pressable
					style={[
						styles.treasuryButton,
						!isAdmin && styles.treasuryButtonDisabled,
					]}
					disabled={!isAdmin}
				>
					<Text
						style={[
							styles.treasuryButtonText,
							!isAdmin && styles.treasuryButtonTextDisabled,
						]}
					>
						{isAdmin ? "Manage Treasury →" : "View Only"}
					</Text>
				</Pressable>
			</View>
		);
	};

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
				title="Proof ID"
				subtitle="Your proof-backed identity on XION"
			/>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Identity Header */}
				<View style={styles.identityHeader}>
					<AddressChip
						address={userWallet.address}
						ens={userWallet.ens}
						activeSince={userWallet.activeSince}
						variant="large"
					/>
				</View>

				{/* Stats Card */}
				{renderStatsCard()}

				{/* Treasury Card */}
				{renderTreasuryCard()}

				{/* Verification Info */}
				<InfoCard
					title="Cryptographic Verification"
					body="Your identity is secured with zero-knowledge proofs and blockchain verification"
					icon="shield-checkmark"
				/>

				{/* Menu Sections */}
				{menuSections.map((section) => (
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

				{/* Logout Section */}
				<View style={styles.logoutSection}>
					<Pressable
						style={styles.logoutButton}
						onPress={handleLogout}
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
		gap: DesignSystem.spacing["4xl"],
	},

	// Identity Header
	identityHeader: {
		alignItems: "center",
	},

	// Stats Card
	statsCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		overflow: "hidden",
		...DesignSystem.shadows.sm,
	},

	statsHeader: {
		padding: DesignSystem.spacing["2xl"],
		borderBottomWidth: 1,
		borderBottomColor: DesignSystem.colors.border.tertiary,
	},

	statsHeaderContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.md,
	},

	statsTitle: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		padding: DesignSystem.spacing["2xl"],
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
		color: DesignSystem.colors.text.primary,
	},

	statLabel: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
	},

	// Menu Sections
	menuSection: {
		gap: DesignSystem.spacing.xl,
	},

	sectionTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
	},

	menuCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		overflow: "hidden",
		...DesignSystem.shadows.sm,
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
		backgroundColor: DesignSystem.colors.primary[800] + "20",
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.xs,
		borderRadius: DesignSystem.radius.md,
	},

	badgeText: {
		...DesignSystem.typography.label.small,
		color: DesignSystem.colors.primary[700],
	},

	// Logout Section
	logoutSection: {},

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
	},

	versionText: {
		...DesignSystem.typography.caption,
		color: DesignSystem.colors.text.tertiary,
	},

	bottomSpacer: {
		height: 140, // Space for tab bar
	},

	// Treasury Card
	treasuryCard: {
		backgroundColor: DesignSystem.colors.surface.tertiary,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["3xl"],
		marginBottom: DesignSystem.spacing["4xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
	},

	treasuryHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.lg,
		marginBottom: DesignSystem.spacing.lg,
	},

	treasuryIconContainer: {
		width: 40,
		height: 40,
		borderRadius: DesignSystem.radius.lg,
		backgroundColor: DesignSystem.colors.primary[800],
		alignItems: "center",
		justifyContent: "center",
	},

	treasuryInfo: {
		flex: 1,
		gap: DesignSystem.spacing.xs,
	},

	treasuryTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
	},

	treasurySubtitle: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},

	treasuryAmount: {
		...DesignSystem.typography.h2,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing["2xl"],
	},

	treasuryButton: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		alignItems: "center",
	},

	treasuryButtonDisabled: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},

	treasuryButtonText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	treasuryButtonTextDisabled: {
		color: DesignSystem.colors.text.tertiary,
	},
});

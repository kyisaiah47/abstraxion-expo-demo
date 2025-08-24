import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Alert,
	ScrollView,
	Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import AddressChip from "@/components/AddressChip";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import { useAuth } from "@/context/AuthContext";
import * as Clipboard from 'expo-clipboard';
import Toast from "react-native-toast-message";

interface WalletInfo {
	address: string;
	balance: string;
	network: string;
	connected: boolean;
}

export default function WalletSettingsScreen() {
	const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
	const [loading, setLoading] = useState(true);
	
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const { data: account, logout } = useAbstraxionAccount();
	const { client } = useAbstraxionSigningClient();
	const { user } = useAuth();

	useEffect(() => {
		loadWalletInfo();
	}, [account]);

	const loadWalletInfo = async () => {
		setLoading(true);
		try {
			if (account?.bech32Address) {
				// For now, we'll use mock data for balance and network
				// In a real app, you'd fetch this from the blockchain
				setWalletInfo({
					address: account.bech32Address,
					balance: "0.00", // Would be fetched from chain
					network: "Xion Testnet",
					connected: !!client,
				});
			} else {
				setWalletInfo(null);
			}
		} catch (error) {
			console.error("Error loading wallet info:", error);
			setWalletInfo(null);
		} finally {
			setLoading(false);
		}
	};

	const handleCopyAddress = async () => {
		if (walletInfo?.address) {
			await Clipboard.setStringAsync(walletInfo.address);
			Toast.show({
				type: 'success',
				text1: 'Copied!',
				text2: 'Wallet address copied to clipboard',
				position: 'bottom',
			});
		}
	};

	const handleShareAddress = async () => {
		if (walletInfo?.address) {
			try {
				await Share.share({
					message: `My ProofPay wallet address: ${walletInfo.address}`,
					title: 'My Wallet Address',
				});
			} catch (error) {
				console.error('Error sharing address:', error);
			}
		}
	};

	const handleDisconnectWallet = () => {
		Alert.alert(
			"Disconnect Wallet",
			"Are you sure you want to disconnect your wallet? You'll need to reconnect to use ProofPay.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Disconnect",
					style: "destructive",
					onPress: async () => {
						try {
							await logout();
							Toast.show({
								type: 'success',
								text1: 'Disconnected',
								text2: 'Wallet disconnected successfully',
								position: 'bottom',
							});
							router.replace("/");
						} catch (error) {
							console.error("Error disconnecting wallet:", error);
							Alert.alert("Error", "Failed to disconnect wallet");
						}
					},
				},
			]
		);
	};

	const handleRefresh = () => {
		loadWalletInfo();
		Toast.show({
			type: 'info',
			text1: 'Refreshed',
			text2: 'Wallet information updated',
			position: 'bottom',
		});
	};

	const menuItems = [
		{
			id: "copy-address",
			title: "Copy Address",
			subtitle: "Copy wallet address to clipboard",
			icon: "copy-outline" as const,
			action: handleCopyAddress,
		},
		{
			id: "share-address",
			title: "Share Address",
			subtitle: "Share your wallet address",
			icon: "share-outline" as const,
			action: handleShareAddress,
		},
		{
			id: "refresh",
			title: "Refresh",
			subtitle: "Update wallet information",
			icon: "refresh-outline" as const,
			action: handleRefresh,
		},
		{
			id: "transaction-history",
			title: "Transaction History",
			subtitle: "View transaction history",
			icon: "list-outline" as const,
			action: () => Alert.alert("Coming Soon", "Transaction history will be available soon!"),
		},
		{
			id: "export-keys",
			title: "Export Private Keys",
			subtitle: "Export wallet private keys",
			icon: "key-outline" as const,
			action: () => Alert.alert("Security", "Private key export is handled by your wallet provider for security reasons."),
		},
	];

	const dangerousActions = [
		{
			id: "disconnect",
			title: "Disconnect Wallet",
			subtitle: "Remove wallet from ProofPay",
			icon: "log-out-outline" as const,
			action: handleDisconnectWallet,
		},
	];

	const renderMenuItem = (item: any, isDangerous = false) => (
		<Pressable
			key={item.id}
			style={styles.menuItem}
			onPress={item.action}
			android_ripple={{
				color: isDangerous ? '#FEE2E2' : DesignSystem.colors.primary[100],
			}}
		>
			{({ pressed }) => (
				<View
					style={[styles.menuItemContent, pressed && styles.menuItemPressed]}
				>
					<View style={styles.menuItemLeft}>
						<View style={[styles.menuIconContainer, isDangerous && styles.dangerIconContainer]}>
							<Ionicons
								name={item.icon}
								size={20}
								color={isDangerous ? colors.status?.error || '#DC2626' : colors.primary[700]}
							/>
						</View>
						<View style={styles.menuTextContainer}>
							<Text style={[styles.menuItemTitle, isDangerous && styles.dangerText]}>
								{item.title}
							</Text>
							<Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
						</View>
					</View>
					<Ionicons
						name="chevron-forward"
						size={20}
						color={colors.text.tertiary}
					/>
				</View>
			)}
		</Pressable>
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable 
					style={styles.backButton} 
					onPress={() => router.back()}
				>
					<Ionicons name="arrow-back" size={24} color={colors.text.primary} />
				</Pressable>
				<Text style={styles.title}>Wallet Settings</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Wallet Status Card */}
				<View style={styles.walletCard}>
					<View style={styles.walletHeader}>
						<View style={styles.walletStatus}>
							<View style={[
								styles.statusDot,
								{ backgroundColor: walletInfo?.connected ? colors.status?.success || '#059669' : colors.status?.error || '#DC2626' }
							]} />
							<Text style={styles.statusText}>
								{walletInfo?.connected ? 'Connected' : 'Disconnected'}
							</Text>
						</View>
					</View>

					{walletInfo ? (
						<>
							{/* Wallet Address */}
							<View style={styles.addressSection}>
								<Text style={styles.sectionLabel}>Wallet Address</Text>
								<AddressChip
									address={walletInfo.address}
									variant="default"
								/>
							</View>

							{/* Wallet Info */}
							<View style={styles.infoGrid}>
								<View style={styles.infoItem}>
									<Text style={styles.infoLabel}>Network</Text>
									<Text style={styles.infoValue}>{walletInfo.network}</Text>
								</View>
								<View style={styles.infoItem}>
									<Text style={styles.infoLabel}>Balance</Text>
									<Text style={styles.infoValue}>{walletInfo.balance} XION</Text>
								</View>
							</View>
						</>
					) : (
						<View style={styles.noWalletState}>
							<Ionicons name="wallet-outline" size={48} color={colors.text.tertiary} />
							<Text style={styles.noWalletText}>No wallet connected</Text>
							<Text style={styles.noWalletSubtext}>
								Connect a wallet to view settings
							</Text>
						</View>
					)}
				</View>

				{walletInfo && (
					<>
						{/* Wallet Actions */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Actions</Text>
							<View style={styles.menuContainer}>
								{menuItems.map(item => renderMenuItem(item))}
							</View>
						</View>

						{/* Dangerous Actions */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Advanced</Text>
							<View style={styles.menuContainer}>
								{dangerousActions.map(item => renderMenuItem(item, true))}
							</View>
						</View>
					</>
				)}

				{/* Info Section */}
				<View style={styles.infoSection}>
					<Text style={styles.infoText}>
						Your wallet is managed by Abstraxion. ProofPay does not store your private keys or have access to your funds beyond authorized transactions.
					</Text>
				</View>

				{/* Bottom Spacer */}
				<View style={styles.bottomSpacer} />
			</ScrollView>
		</SafeAreaView>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.surface.primary,
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingHorizontal: DesignSystem.spacing.xl,
			paddingVertical: DesignSystem.spacing.lg,
			borderBottomWidth: 1,
			borderBottomColor: colors.border.secondary,
		},
		backButton: {
			width: 40,
			height: 40,
			alignItems: "center",
			justifyContent: "center",
		},
		title: {
			...DesignSystem.typography.h3,
			color: colors.text.primary,
			fontWeight: "600",
		},
		placeholder: {
			width: 40,
		},
		content: {
			flex: 1,
			padding: DesignSystem.spacing.xl,
		},
		walletCard: {
			backgroundColor: colors.surface.secondary,
			borderRadius: DesignSystem.radius.xl,
			padding: DesignSystem.spacing.xl,
			marginBottom: DesignSystem.spacing.xl,
			...DesignSystem.shadows.sm,
		},
		walletHeader: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			marginBottom: DesignSystem.spacing.lg,
		},
		walletStatus: {
			flexDirection: "row",
			alignItems: "center",
		},
		statusDot: {
			width: 8,
			height: 8,
			borderRadius: 4,
			marginRight: DesignSystem.spacing.sm,
		},
		statusText: {
			...DesignSystem.typography.label.medium,
			color: colors.text.primary,
			fontWeight: "600",
		},
		addressSection: {
			marginBottom: DesignSystem.spacing.lg,
		},
		sectionLabel: {
			...DesignSystem.typography.label.small,
			color: colors.text.secondary,
			marginBottom: DesignSystem.spacing.sm,
		},
		infoGrid: {
			flexDirection: "row",
			gap: DesignSystem.spacing.lg,
		},
		infoItem: {
			flex: 1,
		},
		infoLabel: {
			...DesignSystem.typography.label.small,
			color: colors.text.secondary,
			marginBottom: 4,
		},
		infoValue: {
			...DesignSystem.typography.body.medium,
			color: colors.text.primary,
			fontWeight: "600",
		},
		noWalletState: {
			alignItems: "center",
			paddingVertical: DesignSystem.spacing["2xl"],
		},
		noWalletText: {
			...DesignSystem.typography.h4,
			color: colors.text.primary,
			marginTop: DesignSystem.spacing.md,
			marginBottom: 4,
		},
		noWalletSubtext: {
			...DesignSystem.typography.body.medium,
			color: colors.text.secondary,
			textAlign: "center",
		},
		section: {
			marginBottom: DesignSystem.spacing.xl,
		},
		sectionTitle: {
			...DesignSystem.typography.h4,
			color: colors.text.primary,
			marginBottom: DesignSystem.spacing.md,
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
			paddingHorizontal: DesignSystem.spacing.xl,
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
		dangerIconContainer: {
			backgroundColor: '#FEE2E2',
		},
		menuTextContainer: {
			flex: 1,
		},
		menuItemTitle: {
			...DesignSystem.typography.label.large,
			color: colors.text.primary,
			marginBottom: 2,
		},
		dangerText: {
			color: colors.status?.error || '#DC2626',
		},
		menuItemSubtitle: {
			...DesignSystem.typography.body.small,
			color: colors.text.secondary,
		},
		infoSection: {
			marginTop: DesignSystem.spacing.xl,
			paddingTop: DesignSystem.spacing.xl,
			borderTopWidth: 1,
			borderTopColor: colors.border.tertiary,
		},
		infoText: {
			...DesignSystem.typography.body.medium,
			color: colors.text.secondary,
			textAlign: "center",
			lineHeight: 20,
		},
		bottomSpacer: {
			height: 100,
		},
	});
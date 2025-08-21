import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	ActivityIndicator,
	SafeAreaView,
	Alert,
	ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import { ContractService } from "../lib/contractService";
import { TreasuryService } from "../lib/treasury";
import { TREASURY_CONFIG } from "../constants/contracts";
import Toast from "react-native-toast-message";

export default function TreasuryManagementScreen() {
	const router = useRouter();
	const { data: account } = useAbstraxionAccount();
	const { client } = useAbstraxionSigningClient();

	const [treasuryService, setTreasuryService] =
		useState<TreasuryService | null>(null);
	const [loading, setLoading] = useState(true);
	const [fundAmount, setFundAmount] = useState("");
	const [withdrawAmount, setWithdrawAmount] = useState("");
	const [status, setStatus] = useState({
		isAvailable: false,
		balance: 0,
		canSponsorGas: false,
		estimatedTransactionsLeft: 0,
		lastChecked: new Date(),
	});
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	useEffect(() => {
		if (account && client && TREASURY_CONFIG.enabled) {
			initializeTreasury();
		} else {
			setLoading(false);
		}
	}, [account, client]);

	const initializeTreasury = async () => {
		try {
			if (!client) {
				throw new Error("Signing client not available");
			}

			const contractService = new ContractService(
				account,
				client,
				TREASURY_CONFIG.address
			);
			const treasury = contractService.getTreasuryService();

			if (treasury) {
				setTreasuryService(treasury);
				await loadTreasuryStatus(treasury);
			}
		} catch (error) {
			console.error("Failed to initialize Treasury:", error);
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Failed to initialize Treasury service",
				position: "bottom",
			});
		} finally {
			setLoading(false);
		}
	};

	const loadTreasuryStatus = async (treasury?: TreasuryService) => {
		try {
			const service = treasury || treasuryService;
			if (service) {
				const treasuryStatus = await service.getTreasuryStatus();
				setStatus(treasuryStatus);
			}
		} catch (error) {
			console.error("Failed to load Treasury status:", error);
		}
	};

	const handleFundTreasury = async () => {
		if (!treasuryService || !fundAmount) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Please enter a valid amount",
				position: "bottom",
			});
			return;
		}

		const amount = parseFloat(fundAmount);
		if (amount <= 0) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Amount must be greater than 0",
				position: "bottom",
			});
			return;
		}

		Alert.alert(
			"Fund Treasury",
			`Are you sure you want to fund the Treasury with ${amount} XION? This will help sponsor gasless transactions for users.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Fund",
					onPress: async () => {
						try {
							setActionLoading("fund");
							const result = await treasuryService.fundTreasury(amount);

							if (result.success) {
								Toast.show({
									type: "success",
									text1: "Treasury Funded!",
									text2: `${amount} XION added to Treasury`,
									position: "bottom",
								});
								setFundAmount("");
								await loadTreasuryStatus();
							} else {
								Toast.show({
									type: "error",
									text1: "Funding Failed",
									text2: result.error || "Unknown error",
									position: "bottom",
								});
							}
						} catch (error: any) {
							console.error("Treasury funding failed:", error);
							Toast.show({
								type: "error",
								text1: "Funding Failed",
								text2: error.message || "Unknown error",
								position: "bottom",
							});
						} finally {
							setActionLoading(null);
						}
					},
				},
			]
		);
	};

	const handleWithdrawTreasury = async () => {
		if (!treasuryService || !withdrawAmount) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Please enter a valid amount",
				position: "bottom",
			});
			return;
		}

		const amount = parseFloat(withdrawAmount);
		if (amount <= 0 || amount > status.balance) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: `Amount must be between 0 and ${status.balance.toFixed(2)} XION`,
				position: "bottom",
			});
			return;
		}

		Alert.alert(
			"Withdraw from Treasury",
			`Are you sure you want to withdraw ${amount} XION from the Treasury? This will reduce gasless transaction capacity.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Withdraw",
					style: "destructive",
					onPress: async () => {
						try {
							setActionLoading("withdraw");
							const result = await treasuryService.withdrawFromTreasury(amount);

							if (result.success) {
								Toast.show({
									type: "success",
									text1: "Withdrawal Successful!",
									text2: `${amount} XION withdrawn from Treasury`,
									position: "bottom",
								});
								setWithdrawAmount("");
								await loadTreasuryStatus();
							} else {
								Toast.show({
									type: "error",
									text1: "Withdrawal Failed",
									text2: result.error || "Unknown error",
									position: "bottom",
								});
							}
						} catch (error: any) {
							console.error("Treasury withdrawal failed:", error);
							Toast.show({
								type: "error",
								text1: "Withdrawal Failed",
								text2: error.message || "Unknown error",
								position: "bottom",
							});
						} finally {
							setActionLoading(null);
						}
					},
				},
			]
		);
	};

	if (!TREASURY_CONFIG.enabled) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.centered}>
					<Text style={styles.disabledTitle}>Treasury Disabled</Text>
					<Text style={styles.disabledText}>
						Treasury contract is not configured in this environment.
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!account || !client) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.centered}>
					<Text>Connect your wallet to manage Treasury</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen
				options={{
					title: "Treasury Management",
					headerTitleAlign: "center",
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: "#F4F4F5",
					},
					headerTitleStyle: {
						fontSize: 18,
						fontWeight: "600",
						color: "#111827",
					},
				}}
			/>

			<ScrollView style={styles.content}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Text style={styles.backButtonText}>← Back to Dashboard</Text>
				</TouchableOpacity>

				{loading ? (
					<View style={styles.centered}>
						<ActivityIndicator size="large" />
						<Text style={styles.loadingText}>Loading Treasury status...</Text>
					</View>
				) : (
					<>
						{/* Treasury Status Card */}
						<View style={styles.statusCard}>
							<View style={styles.statusHeader}>
								<Text style={styles.statusTitle}>Treasury Status</Text>
								<View
									style={[
										styles.statusIndicator,
										{
											backgroundColor: status.canSponsorGas
												? "#22C55E"
												: "#EF4444",
										},
									]}
								/>
							</View>

							<View style={styles.statusGrid}>
								<View style={styles.statusItem}>
									<Text style={styles.statusLabel}>Balance</Text>
									<Text style={styles.statusValue}>
										{status.balance.toFixed(2)} XION
									</Text>
								</View>
								<View style={styles.statusItem}>
									<Text style={styles.statusLabel}>Transactions Left</Text>
									<Text style={styles.statusValue}>
										{status.estimatedTransactionsLeft}
									</Text>
								</View>
								<View style={styles.statusItem}>
									<Text style={styles.statusLabel}>Gas Sponsorship</Text>
									<Text
										style={[
											styles.statusValue,
											{ color: status.canSponsorGas ? "#22C55E" : "#EF4444" },
										]}
									>
										{status.canSponsorGas ? "Active" : "Inactive"}
									</Text>
								</View>
								<View style={styles.statusItem}>
									<Text style={styles.statusLabel}>Last Updated</Text>
									<Text style={styles.statusValue}>
										{status.lastChecked.toLocaleTimeString()}
									</Text>
								</View>
							</View>

							<TouchableOpacity
								style={styles.refreshButton}
								onPress={() => loadTreasuryStatus()}
							>
								<Text style={styles.refreshButtonText}>Refresh Status</Text>
							</TouchableOpacity>
						</View>

						{/* Fund Treasury Card */}
						<View style={styles.actionCard}>
							<Text style={styles.actionTitle}>Fund Treasury</Text>
							<Text style={styles.actionDescription}>
								Add XION to the Treasury to sponsor gasless transactions for
								users.
							</Text>

							<TextInput
								style={styles.input}
								placeholder="Amount in XION"
								value={fundAmount}
								onChangeText={setFundAmount}
								keyboardType="numeric"
								editable={actionLoading !== "fund"}
							/>

							<TouchableOpacity
								style={[
									styles.actionButton,
									styles.fundButton,
									actionLoading === "fund" && styles.actionButtonDisabled,
								]}
								onPress={handleFundTreasury}
								disabled={actionLoading === "fund"}
							>
								{actionLoading === "fund" ? (
									<ActivityIndicator
										size="small"
										color="#fff"
									/>
								) : (
									<Text style={styles.actionButtonText}>Fund Treasury</Text>
								)}
							</TouchableOpacity>
						</View>

						{/* Withdraw Treasury Card */}
						<View style={styles.actionCard}>
							<Text style={styles.actionTitle}>Withdraw from Treasury</Text>
							<Text style={styles.actionDescription}>
								Remove XION from the Treasury. This will reduce gasless
								transaction capacity.
							</Text>

							<TextInput
								style={styles.input}
								placeholder={`Max: ${status.balance.toFixed(2)} XION`}
								value={withdrawAmount}
								onChangeText={setWithdrawAmount}
								keyboardType="numeric"
								editable={actionLoading !== "withdraw"}
							/>

							<TouchableOpacity
								style={[
									styles.actionButton,
									styles.withdrawButton,
									actionLoading === "withdraw" && styles.actionButtonDisabled,
								]}
								onPress={handleWithdrawTreasury}
								disabled={actionLoading === "withdraw" || status.balance === 0}
							>
								{actionLoading === "withdraw" ? (
									<ActivityIndicator
										size="small"
										color="#fff"
									/>
								) : (
									<Text style={styles.actionButtonText}>Withdraw</Text>
								)}
							</TouchableOpacity>
						</View>

						{/* Treasury Info */}
						<View style={styles.infoCard}>
							<Text style={styles.infoTitle}>About Treasury</Text>
							<Text style={styles.infoText}>
								The Treasury contract sponsors gas fees for user transactions,
								making the app more accessible. When users accept jobs, submit
								proofs, or perform other actions, the Treasury pays the gas fees
								automatically.
							</Text>
							<Text style={styles.infoText}>
								Contract Address: {TREASURY_CONFIG.address}
							</Text>
						</View>
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F4F4F5",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 8,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	backButton: {
		paddingHorizontal: 0,
		paddingVertical: 8,
		marginBottom: 16,
		alignSelf: "flex-start",
	},
	backButtonText: {
		fontSize: 16,
		color: "#111827",
		fontWeight: "500",
	},
	loadingText: {
		marginTop: 16,
		color: "#666",
	},
	disabledTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#111827",
		marginBottom: 8,
	},
	disabledText: {
		fontSize: 16,
		color: "#6B7280",
		textAlign: "center",
	},
	statusCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 20,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	statusHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	statusTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#111827",
	},
	statusIndicator: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	statusGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: 16,
	},
	statusItem: {
		width: "50%",
		marginBottom: 12,
	},
	statusLabel: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 2,
	},
	statusValue: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	refreshButton: {
		backgroundColor: "#F3F4F6",
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignSelf: "center",
	},
	refreshButtonText: {
		fontSize: 14,
		color: "#374151",
		fontWeight: "500",
	},
	actionCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 20,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	actionTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
		marginBottom: 8,
	},
	actionDescription: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 16,
		lineHeight: 20,
	},
	input: {
		borderWidth: 1,
		borderColor: "#D1D5DB",
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		color: "#111827",
		marginBottom: 16,
	},
	actionButton: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
	},
	actionButtonDisabled: {
		opacity: 0.6,
	},
	fundButton: {
		backgroundColor: "#22C55E",
	},
	withdrawButton: {
		backgroundColor: "#EF4444",
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
	infoCard: {
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		color: "#6B7280",
		lineHeight: 20,
		marginBottom: 8,
	},
});

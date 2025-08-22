import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	SafeAreaView,
	Alert,
} from "react-native";
import PersistentHeader from "../../components/PersistentHeader";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import { ContractService, type Job } from "../../lib/contractService";
import { TREASURY_CONFIG } from "../../constants/contracts";
import Toast from "react-native-toast-message";

export default function MarketplaceScreen() {
	const router = useRouter();
	const { data: account, logout } = useAbstraxionAccount();
	const { client } = useAbstraxionSigningClient();

	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [acceptingJobId, setAcceptingJobId] = useState<number | null>(null);
	const [contractService, setContractService] =
		useState<ContractService | null>(null);
	const [treasuryStatus, setTreasuryStatus] = useState({
		isAvailable: false,
		balance: 0,
		canSponsorGas: false,
		estimatedTransactionsLeft: 0,
	});

	// Helper function to map Treasury status
	const mapTreasuryStatus = (status: any) => ({
		isAvailable: status.isConnected || status.isAvailable || false,
		balance: status.balance || 0,
		canSponsorGas: status.canSponsorGas || false,
		estimatedTransactionsLeft: Math.floor((status.balance || 0) * 5), // Estimate 5 txs per XION
	});

	// Initialize contract service and load jobs
	useEffect(() => {
		if (account && client) {
			// Initialize with Treasury if available
			const treasuryAddress = TREASURY_CONFIG.enabled
				? TREASURY_CONFIG.address
				: undefined;
			const service = new ContractService(account, client, treasuryAddress);
			setContractService(service);

			// Load jobs and Treasury status
			const loadInitialData = async () => {
				try {
					setLoading(true);
					const allJobs = await service.queryJobs();
					// Filter for open jobs only (worker === null and status === 'Open')
					const openJobs = allJobs.filter(
						(job) => job.worker === null && job.status === "Open"
					);
					setJobs(openJobs);

					// Check Treasury status if available
					if (treasuryAddress) {
						const status = await service.getTreasuryStatus();
						setTreasuryStatus(mapTreasuryStatus(status));
					}
				} catch (error) {
					console.error("Failed to load jobs:", error);
					Toast.show({
						type: "error",
						text1: "Error",
						text2: "Failed to load jobs from blockchain",
						position: "bottom",
					});
				} finally {
					setLoading(false);
				}
			};

			loadInitialData();
		}
	}, [account?.bech32Address, client]); // Use specific properties instead of objects

	const handleRefresh = async () => {
		if (contractService) {
			setRefreshing(true);
			try {
				const allJobs = await contractService.queryJobs();
				// Filter for open jobs only (worker === null and status === 'Open')
				const openJobs = allJobs.filter(
					(job) => job.worker === null && job.status === "Open"
				);
				setJobs(openJobs);
			} catch (error) {
				console.error("Failed to refresh jobs:", error);
				Toast.show({
					type: "error",
					text1: "Error",
					text2: "Failed to refresh jobs from blockchain",
					position: "bottom",
				});
			} finally {
				setRefreshing(false);
			}
		}
	};

	const handleAcceptJob = async (jobId: number) => {
		if (!contractService || !account) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Wallet not connected",
				position: "bottom",
			});
			return;
		}

		const treasuryInfo = treasuryStatus.canSponsorGas
			? "This transaction will be gasless via Treasury."
			: treasuryStatus.isAvailable
			? "Treasury is low on funds. You may need to pay gas fees."
			: "You will pay gas fees for this transaction.";

		Alert.alert(
			"Accept Job",
			`Are you sure you want to accept this job? You'll be responsible for completing the work.\n\n${treasuryInfo}`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Accept",
					onPress: async () => {
						try {
							setAcceptingJobId(jobId);

							// Use Treasury-enabled contract service
							const result = await contractService.acceptJob(jobId);

							if (result.success) {
								const gasMessage = result.usedTreasury
									? "Job accepted gaslessly via Treasury!"
									: "Job accepted! Gas fees were paid directly.";

								Toast.show({
									type: "success",
									text1: "Job Accepted!",
									text2: gasMessage,
									position: "bottom",
								});

								// Refresh jobs list and Treasury status
								try {
									const allJobs = await contractService.queryJobs();
									const openJobs = allJobs.filter(
										(job) => job.worker === null && job.status === "Open"
									);
									setJobs(openJobs);

									// Update Treasury status
									if (TREASURY_CONFIG.enabled) {
										const status = await contractService.getTreasuryStatus();
										setTreasuryStatus(mapTreasuryStatus(status));
									}
								} catch (refreshError) {
									console.error(
										"Failed to refresh after job acceptance:",
										refreshError
									);
								}
							} else {
								// Handle Treasury-specific errors
								const errorMessage = result.error || "Unknown error occurred";
								const displayMessage = result.usedTreasury
									? `Treasury transaction failed: ${errorMessage}`
									: `Transaction failed: ${errorMessage}`;

								Toast.show({
									type: "error",
									text1: "Failed to Accept Job",
									text2: displayMessage,
									position: "bottom",
								});
							}
						} catch (error: any) {
							console.error("Failed to accept job:", error);
							Toast.show({
								type: "error",
								text1: "Failed to Accept Job",
								text2: error?.message || "Unknown error",
								position: "bottom",
							});
						} finally {
							setAcceptingJobId(null);
						}
					},
				},
			]
		);
	};

	const truncateAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const formatTimeAgo = (timestamp: string | number) => {
		try {
			// Handle both string and number timestamps
			const date =
				typeof timestamp === "string"
					? new Date(timestamp)
					: new Date(timestamp * 1000);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

			if (diffDays === 0) return "Today";
			if (diffDays === 1) return "1 day ago";
			return `${diffDays} days ago`;
		} catch {
			return "Recently";
		}
	};

	const getJobTags = (job: Job) => {
		const tags = ["Remote"];

		// Add payment tier tag
		const paymentAmount = ContractService.convertUxionToXion(
			parseInt(job.escrow_amount.amount)
		);
		if (paymentAmount >= 10) tags.push("High Pay");
		else if (paymentAmount >= 5) tags.push("Good Pay");

		// Add urgency if deadline is soon
		if (job.deadline) {
			const deadline = new Date(job.deadline);
			const now = new Date();
			const daysUntil = Math.ceil(
				(deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
			);
			if (daysUntil <= 3) tags.push("Urgent");
		}

		return tags;
	};

	if (!account || !client) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.centered}>
					<Text>Connect your wallet to view jobs</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Persistent Header */}
			<PersistentHeader
				address={account?.bech32Address}
				onLogout={async () => {
					await logout();
					router.replace("/");
				}}
			/>
			<View style={styles.content}>
				{/* Marketplace header row below persistent header */}
				<View style={styles.header}>
					<View style={styles.headerInfoRow}>
						<Text style={styles.subheading}>
							{loading ? "Loading..." : `${jobs.length} available jobs`}
						</Text>
						{TREASURY_CONFIG.enabled && (
							<View style={styles.treasuryStatus}>
								<View
									style={[
										styles.treasuryIndicator,
										{
											backgroundColor: treasuryStatus.canSponsorGas
												? "#10B981"
												: "#EF4444",
										},
									]}
								/>
								<Text style={styles.treasuryText}>
									{treasuryStatus.canSponsorGas
										? `Treasury Active (${treasuryStatus.estimatedTransactionsLeft} txns)`
										: treasuryStatus.isAvailable
										? "Treasury Low"
										: "Treasury Unavailable"}
								</Text>
							</View>
						)}
					</View>
				</View>

				{loading ? (
					<View style={styles.centered}>
						<ActivityIndicator size="large" />
						<Text style={styles.loadingText}>
							Loading jobs from blockchain...
						</Text>
					</View>
				) : (
					<FlatList
						data={jobs}
						keyExtractor={(item) => item.id.toString()}
						contentContainerStyle={styles.listContainer}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={handleRefresh}
							/>
						}
						ListEmptyComponent={
							<View style={styles.emptyState}>
								<Ionicons
									name="briefcase-outline"
									size={64}
									color="#D1D5DB"
								/>
								<Text style={styles.emptyTitle}>No jobs available</Text>
								<Text style={styles.emptySubtitle}>
									Check back later for new opportunities!
								</Text>
							</View>
						}
						renderItem={({ item }) => (
							<View style={styles.jobCard}>
								<View style={styles.jobHeader}>
									<Text style={styles.jobTitle}>{item.description}</Text>
									<Text style={styles.paymentText}>
										{ContractService.formatXionAmount(
											parseInt(item.escrow_amount.amount)
										)}
									</Text>
								</View>

								<View style={styles.jobContent}>
									<View style={styles.jobInfo}>
										<View style={styles.infoRow}>
											<Ionicons
												name="person-outline"
												size={16}
												color="#6B7280"
											/>
											<Text style={styles.clientText}>
												{truncateAddress(item.client)}
											</Text>
										</View>
										<View style={styles.infoRow}>
											<Ionicons
												name="time-outline"
												size={16}
												color="#6B7280"
											/>
											<Text style={styles.dateText}>
												{formatTimeAgo(item.created_at)}
											</Text>
										</View>
										{item.deadline && (
											<View style={styles.infoRow}>
												<Ionicons
													name="calendar-outline"
													size={16}
													color="#EF4444"
												/>
												<Text style={styles.deadlineText}>
													Due {new Date(item.deadline).toLocaleDateString()}
												</Text>
											</View>
										)}
									</View>

									<View style={styles.tagRow}>
										{getJobTags(item).map((tag) => (
											<View
												style={[
													styles.tag,
													tag === "Urgent" && styles.urgentTag,
													tag === "High Pay" && styles.highPayTag,
												]}
												key={tag}
											>
												<Text
													style={[
														styles.tagText,
														tag === "Urgent" && styles.urgentTagText,
														tag === "High Pay" && styles.highPayTagText,
													]}
												>
													{tag}
												</Text>
											</View>
										))}
									</View>
								</View>

								<TouchableOpacity
									style={[
										styles.acceptButton,
										acceptingJobId === item.id && styles.acceptButtonDisabled,
									]}
									onPress={() => handleAcceptJob(item.id)}
									disabled={acceptingJobId === item.id}
									activeOpacity={0.8}
								>
									{acceptingJobId === item.id ? (
										<ActivityIndicator
											size="small"
											color="#fff"
										/>
									) : (
										<>
											<Ionicons
												name="checkmark"
												size={20}
												color="#fff"
											/>
											<Text style={styles.acceptButtonText}>Accept Job</Text>
										</>
									)}
								</TouchableOpacity>
							</View>
						)}
					/>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	// Container - clean white background like onboarding
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
		paddingTop: 8,
	},

	// Header - spacious and clean
	header: {
		paddingVertical: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
		backgroundColor: "#ffffff",
		marginHorizontal: -32,
		paddingHorizontal: 32,
		marginBottom: 8,
	},
	headerInfoRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 16,
	},
	subheading: {
		fontSize: 14,
		color: "#666",
		fontWeight: "500",
		letterSpacing: 0.1,
	},
	treasuryStatus: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: "#f8f9fa",
		borderRadius: 20,
		shadowColor: "#000",
		shadowOpacity: 0.04,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	treasuryIndicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 8,
	},
	treasuryText: {
		fontSize: 12,
		color: "#191919",
		fontWeight: "500",
	},

	// Loading and Empty States - sophisticated design
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 32,
	},
	loadingText: {
		marginTop: 20,
		color: "#666",
		fontSize: 16,
		fontWeight: "400",
	},
	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 80,
		paddingHorizontal: 32,
	},
	emptyTitle: {
		color: "#191919",
		fontSize: 24,
		fontWeight: "700",
		marginBottom: 12,
		marginTop: 24,
		textAlign: "center",
		letterSpacing: -0.3,
	},
	emptySubtitle: {
		color: "#666",
		fontSize: 16,
		textAlign: "center",
		lineHeight: 22,
		fontWeight: "400",
	},

	// List Container - generous spacing
	listContainer: {
		paddingBottom: 48,
	},
	// Job Cards - sophisticated design matching onboarding
	jobCard: {
		backgroundColor: "#ffffff",
		borderRadius: 16,
		padding: 24,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.06,
		shadowRadius: 16,
		elevation: 4,
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},
	jobHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 16,
	},
	jobContent: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 20,
	},
	jobTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#191919",
		flex: 1,
		marginRight: 16,
		lineHeight: 24,
		letterSpacing: 0.1,
	},
	paymentText: {
		fontSize: 20,
		fontWeight: "700",
		color: "#059669",
		letterSpacing: -0.2,
	},

	// Job Info - clean layout
	jobInfo: {
		gap: 12,
		flex: 1,
	},
	infoRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	clientText: {
		fontSize: 14,
		color: "#666",
		fontWeight: "500",
	},
	dateText: {
		fontSize: 14,
		color: "#666",
		fontWeight: "500",
	},
	deadlineText: {
		fontSize: 14,
		color: "#DC2626",
		fontWeight: "600",
	},

	// Tags - refined design
	tagRow: {
		flexDirection: "column",
		alignItems: "flex-end",
		gap: 8,
		flex: 0,
	},
	tag: {
		backgroundColor: "#f8f9fa",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},
	urgentTag: {
		backgroundColor: "#FEF2F2",
		borderColor: "#FECACA",
	},
	highPayTag: {
		backgroundColor: "#ECFDF5",
		borderColor: "#D1FAE5",
	},
	tagText: {
		fontSize: 12,
		color: "#666",
		fontWeight: "600",
		letterSpacing: 0.2,
	},
	urgentTagText: {
		color: "#DC2626",
	},
	highPayTagText: {
		color: "#059669",
	},

	// Accept Button - sophisticated design like onboarding
	acceptButton: {
		backgroundColor: "#191919",
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
		gap: 8,
		shadowColor: "#191919",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 6,
	},
	acceptButtonDisabled: {
		backgroundColor: "#9CA3AF",
		shadowOpacity: 0.05,
	},
	acceptButtonText: {
		color: "#ffffff",
		fontWeight: "600",
		fontSize: 16,
		letterSpacing: 0.2,
	},
});

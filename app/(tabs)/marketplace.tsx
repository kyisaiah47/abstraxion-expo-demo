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
			<PersistentHeader address={account?.bech32Address} onLogout={async () => {
				await logout();
				router.replace('/');
			}} />
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
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 0,
	},
	header: {
		paddingVertical: 4,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
		backgroundColor: "#FFFFFF",
		marginHorizontal: -20,
		paddingHorizontal: 20,
		marginBottom: 4,
	},
	headerInfoRow: {
		marginTop: 0,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 12,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	subheading: {
		fontSize: 12,
		color: "#6B7280",
		fontWeight: "400",
		marginBottom: 0,
		letterSpacing: 0.2,
		paddingVertical: 0,
		marginTop: 0,
		marginLeft: 0,
		marginRight: 0,
		minHeight: 0,
		height: undefined,
	},
	treasuryStatus: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: "#F9FAFB",
		borderRadius: 16,
		alignSelf: "flex-start",
	},
	treasuryIndicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 8,
	},
	treasuryText: {
		fontSize: 12,
		color: "#6B7280",
		fontWeight: "500",
	},
	loadingText: {
		marginTop: 16,
		color: "#6B7280",
		fontSize: 16,
	},
	listContainer: {
		paddingBottom: 24,
	},
	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 60,
	},
	emptyTitle: {
		color: "#374151",
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 8,
		marginTop: 16,
		textAlign: "center",
	},
	emptySubtitle: {
		color: "#6B7280",
		fontSize: 14,
		textAlign: "center",
	},
	jobCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 14,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	jobHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	jobContent: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	jobTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#111827",
		flex: 1,
		marginRight: 10,
		lineHeight: 20,
	},
	tagRow: {
		flexDirection: "column",
		alignItems: "flex-end",
		gap: 6,
		flex: 0,
	},
	tag: {
		backgroundColor: "#F3F4F6",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	urgentTag: {
		backgroundColor: "#FEE2E2",
	},
	highPayTag: {
		backgroundColor: "#D1FAE5",
	},
	tagText: {
		fontSize: 12,
		color: "#6B7280",
		fontWeight: "600",
	},
	urgentTagText: {
		color: "#DC2626",
	},
	highPayTagText: {
		color: "#059669",
	},
	jobInfo: {
		gap: 6,
		marginBottom: 12,
	},
	infoRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	clientText: {
		fontSize: 13,
		color: "#6B7280",
		fontWeight: "500",
	},
	paymentText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#059669",
	},
	dateText: {
		fontSize: 13,
		color: "#6B7280",
		fontWeight: "500",
	},
	deadlineText: {
		fontSize: 13,
		color: "#DC2626",
		fontWeight: "600",
	},
	acceptButton: {
		backgroundColor: "#111827",
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 10,
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
		gap: 6,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
		elevation: 1,
	},
	acceptButtonDisabled: {
		backgroundColor: "#9CA3AF",
	},
	acceptButtonText: {
		color: "#FFFFFF",
		fontWeight: "600",
		fontSize: 14,
	},
});

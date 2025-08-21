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
import { Stack, useRouter } from "expo-router";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import { ContractService, type Job } from "../lib/contractService";
import Toast from "react-native-toast-message";

export default function MarketplaceScreen() {
	const router = useRouter();
	const { data: account } = useAbstraxionAccount();
	const { client } = useAbstraxionSigningClient();

	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [acceptingJobId, setAcceptingJobId] = useState<number | null>(null);
	const [contractService, setContractService] =
		useState<ContractService | null>(null);

	// Initialize contract service and load jobs
	useEffect(() => {
		if (account && client) {
			const service = new ContractService(account, client);
			setContractService(service);

			// Load jobs directly in the effect
			const loadInitialJobs = async () => {
				try {
					setLoading(true);
					const allJobs = await service.queryJobs();
					// Filter for open jobs only (worker === null and status === 'Open')
					const openJobs = allJobs.filter(
						(job) => job.worker === null && job.status === "Open"
					);
					setJobs(openJobs);
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

			loadInitialJobs();
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

		Alert.alert(
			"Accept Job",
			"Are you sure you want to accept this job? You'll be responsible for completing the work.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Accept",
					onPress: async () => {
						try {
							setAcceptingJobId(jobId);
							await contractService.acceptJob(jobId);

							Toast.show({
								type: "success",
								text1: "Job Accepted!",
								text2: "You can now work on this job",
								position: "bottom",
							});

							// Refresh jobs list
							try {
								const allJobs = await contractService.queryJobs();
								const openJobs = allJobs.filter(
									(job) => job.worker === null && job.status === "Open"
								);
								setJobs(openJobs);
							} catch (refreshError) {
								console.error(
									"Failed to refresh after job acceptance:",
									refreshError
								);
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
			<Stack.Screen
				options={{
					title: "Job Marketplace",
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

			<View style={styles.content}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Text style={styles.backButtonText}>← Back to Dashboard</Text>
				</TouchableOpacity>

				<Text style={styles.subheading}>
					{loading ? "Loading..." : `${jobs.length} available jobs`}
				</Text>

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
							<View style={styles.centered}>
								<Text style={styles.emptyTitle}>No jobs available</Text>
								<Text style={styles.emptySubtitle}>
									Check back later for new opportunities!
								</Text>
							</View>
						}
						renderItem={({ item }) => (
							<View style={styles.jobCard}>
								<Text style={styles.jobTitle}>{item.description}</Text>

								<View style={styles.tagRow}>
									{getJobTags(item).map((tag) => (
										<View
											style={styles.tag}
											key={tag}
										>
											<Text style={styles.tagText}>{tag}</Text>
										</View>
									))}
								</View>

								<View style={styles.jobMeta}>
									<Text style={styles.clientText}>
										Client: {truncateAddress(item.client)}
									</Text>
									<Text style={styles.paymentText}>
										{ContractService.formatXionAmount(
											parseInt(item.escrow_amount.amount)
										)}
									</Text>
								</View>

								<Text style={styles.dateText}>
									Posted {formatTimeAgo(item.created_at)}
								</Text>

								{item.deadline && (
									<Text style={styles.deadlineText}>
										Deadline: {new Date(item.deadline).toLocaleDateString()}
									</Text>
								)}

								<TouchableOpacity
									style={[
										styles.acceptButton,
										acceptingJobId === item.id && styles.acceptButtonDisabled,
									]}
									onPress={() => handleAcceptJob(item.id)}
									disabled={acceptingJobId === item.id}
								>
									{acceptingJobId === item.id ? (
										<ActivityIndicator
											size="small"
											color="#fff"
										/>
									) : (
										<Text style={styles.acceptButtonText}>Accept Job</Text>
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
		marginBottom: 8,
		alignSelf: "flex-start",
	},
	backButtonText: {
		fontSize: 16,
		color: "#111827",
		fontWeight: "500",
	},
	subheading: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 16,
		marginTop: 4,
	},
	loadingText: {
		marginTop: 16,
		color: "#666",
	},
	listContainer: {
		paddingBottom: 24,
	},
	emptyTitle: {
		color: "#666",
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	emptySubtitle: {
		color: "#999",
		fontSize: 14,
	},
	jobCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	jobTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
		marginBottom: 8,
	},
	tagRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 12,
	},
	tag: {
		backgroundColor: "#E5E7EB",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	tagText: {
		fontSize: 12,
		color: "#374151",
		fontWeight: "500",
	},
	jobMeta: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	clientText: {
		fontSize: 14,
		color: "#6B7280",
	},
	paymentText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#111827",
	},
	dateText: {
		fontSize: 12,
		color: "#9CA3AF",
		marginBottom: 4,
	},
	deadlineText: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 12,
	},
	acceptButton: {
		backgroundColor: "#111827",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
	},
	acceptButtonDisabled: {
		backgroundColor: "#9CA3AF",
	},
	acceptButtonText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 14,
	},
});

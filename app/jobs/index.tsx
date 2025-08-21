import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import { ContractService, type Job } from "../../lib/contractService";
import { JobStatus } from "../../constants/contracts";

export default function JobMarketplaceScreen() {
	const router = useRouter();
	const { data: account } = useAbstraxionAccount();
	const { client } = useAbstraxionSigningClient();

	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [contractService, setContractService] =
		useState<ContractService | null>(null);

	// Initialize contract service
	useEffect(() => {
		if (account && client) {
			const service = new ContractService(account, client);
			setContractService(service);
			loadJobs(service);
		}
	}, [account, client]);

	const loadJobs = async (service: ContractService) => {
		try {
			setLoading(true);
			const allJobs = await service.queryJobs();
			// Only show open jobs in the marketplace
			const openJobs = service.getOpenJobs(allJobs);
			setJobs(openJobs);
		} catch (error) {
			console.error("Failed to load jobs:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async () => {
		if (contractService) {
			setRefreshing(true);
			await loadJobs(contractService);
			setRefreshing(false);
		}
	};

	const truncateAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const formatTimeAgo = (timestamp: string) => {
		try {
			const date = new Date(timestamp);
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
			<View style={[styles.container, styles.centered]}>
				<Text>Connect your wallet to view jobs</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Stack.Screen
				options={{
					title: "Available Tasks",
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

			<Text style={styles.subheading}>
				{loading ? "Loading..." : `${jobs.length} open tasks`}
			</Text>

			<View style={styles.searchBar}>
				<Text style={styles.searchPlaceholder}>🔍 Search tasks</Text>
			</View>

			{/* Treasury Authorization Test Button */}
			<TouchableOpacity
				style={styles.treasuryTestButton}
				onPress={async () => {
					if (contractService) {
						try {
							console.log("Testing Treasury authorization...");
							const result = await contractService.testTreasuryAuthorization();
							console.log("Treasury test result:", result);
							alert(result.message);
						} catch (error) {
							console.error("Treasury test failed:", error);
							alert("Treasury test failed: " + (error as Error).message);
						}
					}
				}}
			>
				<Text style={styles.treasuryTestButtonText}>
					🏦 Test Treasury Authorization
				</Text>
			</TouchableOpacity>

			{loading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text style={{ marginTop: 16, color: "#666" }}>
						Loading jobs from blockchain...
					</Text>
				</View>
			) : (
				<FlatList
					data={jobs}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={{ paddingBottom: 24 }}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={handleRefresh}
						/>
					}
					ListEmptyComponent={
						<View style={styles.centered}>
							<Text style={{ color: "#666", fontSize: 16 }}>
								No open jobs available
							</Text>
							<Text style={{ color: "#999", fontSize: 14, marginTop: 4 }}>
								Check back later or create a job!
							</Text>
						</View>
					}
					renderItem={({ item }) => (
						<TouchableOpacity
							style={styles.card}
							onPress={() => router.push(`/jobs/${item.id}`)}
						>
							<Text style={styles.title}>{item.description}</Text>
							<View style={styles.badgeRow}>
								{getJobTags(item).map((tag) => (
									<View
										style={styles.badge}
										key={tag}
									>
										<Text style={styles.badgeText}>{tag}</Text>
									</View>
								))}
							</View>
							<Text style={styles.meta}>
								{truncateAddress(item.client)} •{" "}
								{ContractService.formatXionAmount(
									parseInt(item.escrow_amount.amount)
								)}
							</Text>
							<Text style={styles.due}>
								Posted {formatTimeAgo(item.created_at)}
							</Text>
						</TouchableOpacity>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F4F4F5",
		paddingHorizontal: 20,
		paddingTop: 8,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	subheading: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 12,
		marginTop: 4,
	},
	searchBar: {
		backgroundColor: "#E5E7EB",
		borderRadius: 100,
		paddingVertical: 10,
		paddingHorizontal: 16,
		marginBottom: 16,
	},
	searchPlaceholder: {
		color: "#9CA3AF",
		fontSize: 14,
	},
	treasuryTestButton: {
		backgroundColor: "#10B981",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginHorizontal: 16,
		marginBottom: 16,
		alignItems: "center",
	},
	treasuryTestButtonText: {
		color: "#FFFFFF",
		fontWeight: "600",
		fontSize: 14,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	meta: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 8,
	},
	due: {
		fontSize: 12,
		color: "#9CA3AF",
		marginTop: 2,
	},
	badgeRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 8,
	},
	badge: {
		backgroundColor: "#E0E7FF",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 999,
	},
	badgeText: {
		fontSize: 12,
		color: "#4338CA",
		fontWeight: "500",
	},
});

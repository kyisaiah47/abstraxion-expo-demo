import {
	View,
	SafeAreaView,
	ActivityIndicator,
	Alert,
	Text,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
} from "react-native";
import PersistentHeader from "../../components/PersistentHeader";
import * as Clipboard from "expo-clipboard";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import Toast from "react-native-toast-message";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ProofSubmissionSheet from "./jobs/[id]/proof-submission";
import QRScanner from "../qr-scanner";
import JobCreateSheet from "../create";
import { Modalize } from "react-native-modalize";
import { ContractService, type Job } from "../../lib/contractService";
import {
	XION_DECIMALS,
	CONTRACT_CONFIG,
	TREASURY_CONFIG,
} from "../../constants/contracts";

// Remove the old XION fetch logic and replace with contract service
type CreateJobInput = {
	description: string;
	amount?: string;
	deadline?: string;
};

export default function DashboardScreen() {
	const [showScanner, setShowScanner] = useState(false);
	const { data, logout } = useAbstraxionAccount();
	const { client } = useAbstraxionSigningClient();
	const router = useRouter();
	const modalRef = useRef<Modalize>(null);
	const createModalRef = useRef<Modalize>(null);

	// Real blockchain state
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loadingJobs, setLoadingJobs] = useState(true);
	const [activeJob, setActiveJob] = useState<Job | null>(null);
	const [postingJob, setPostingJob] = useState(false);
	const [contractService, setContractService] =
		useState<ContractService | null>(null);
	const [totalEarnings, setTotalEarnings] = useState(0);
	const [error, setError] = useState<string | null>(null);

	// Load jobs from blockchain
	const loadJobs = useCallback(
		async (service: ContractService) => {
			try {
				setLoadingJobs(true);
				setError(null);

				const allJobs = await service.queryJobs();
				setJobs(allJobs);

				if (data?.bech32Address) {
					// Calculate total earnings
					const earnings = service.calculateTotalEarnings(
						allJobs,
						data.bech32Address
					);
					setTotalEarnings(earnings);

					// Find active job for current user
					const userActiveJob = service.getActiveJobForUser(
						allJobs,
						data.bech32Address
					);
					setActiveJob(userActiveJob);
				}
			} catch (error) {
				console.error("Failed to load jobs:", error);
				setError("Failed to load jobs from blockchain");
				Toast.show({
					type: "error",
					text1: "Network Error",
					text2: "Failed to load jobs from blockchain",
					position: "bottom",
				});
			} finally {
				setLoadingJobs(false);
			}
		},
		[data?.bech32Address]
	);

	// Initialize contract service when account and client are available
	useEffect(() => {
		if (data && client && data.bech32Address) {
			console.log("=== NETWORK DEBUG ===");
			console.log("Connected Account:", data.bech32Address);
			console.log(
				"Expected CLI Account: xion1n6nesg6yzdq3nzrzxv8zxms9tx7eh7d65zaadr"
			);
			console.log(
				"Addresses Match:",
				data.bech32Address === "xion1n6nesg6yzdq3nzrzxv8zxms9tx7eh7d65zaadr"
			);
			console.log("Client Config:", {
				rpcUrl: CONTRACT_CONFIG.rpcUrl,
				chainId: CONTRACT_CONFIG.chainId,
				contractAddress: CONTRACT_CONFIG.address,
			});

			const service = new ContractService(data, client);
			setContractService(service);
			loadJobs(service);
		}
	}, [data?.bech32Address, client]);

	function truncateAddress(address: string | undefined | null): string {
		if (!address) return "";
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	const copyToClipboard = async () => {
		if (data?.bech32Address) {
			await Clipboard.setStringAsync(data?.bech32Address);
			Toast.show({
				type: "success",
				text1: "Copied",
				text2: "Wallet address copied",
				position: "bottom",
			});
		}
	};

	const handleLogout = async () => {
		await logout();
		Toast.show({
			type: "success",
			text1: "Logged out",
			text2: "You have been disconnected.",
			position: "bottom",
		});
		router.replace("/");
	};

	const handleSubmitProof = async (proofText: string) => {
		if (!contractService || !activeJob) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "No active job found",
				position: "bottom",
			});
			return;
		}

		try {
			await contractService.submitProof(activeJob.id, proofText);
			Toast.show({
				type: "success",
				text1: "Proof submitted!",
				text2: "Your proof has been submitted to the blockchain",
				position: "bottom",
			});
			(modalRef.current as any)?.close && modalRef.current?.close();

			// Reload jobs to get updated status
			await loadJobs(contractService);
		} catch (error: any) {
			console.error("Failed to submit proof:", error);
			Toast.show({
				type: "error",
				text1: "Submission Failed",
				text2: error?.message || "Failed to submit proof",
				position: "bottom",
			});
		}
	};

	const handleScanQR = () => setShowScanner(true);

	const handleScanned = (data: string) => {
		alert(`QR Code: ${data}`);
		setShowScanner(false);
	};

	const handleCreateJob = async ({
		description,
		amount = "1",
	}: CreateJobInput) => {
		if (!contractService || !data) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Wallet not connected",
				position: "bottom",
			});
			return;
		}

		setPostingJob(true);
		try {
			// Convert XION to uxion (multiply by 1,000,000)
			const paymentAmount = ContractService.convertXionToUxion(
				parseFloat(amount)
			);

			await contractService.postJob(description, paymentAmount);

			Toast.show({
				type: "success",
				text1: "Job Created",
				text2: "Your job has been posted to the blockchain",
				position: "bottom",
			});
			createModalRef.current?.close();
			await loadJobs(contractService);
		} catch (error) {
			console.error("Error creating job:", error);
			Toast.show({
				type: "error",
				text1: "Failed to Create Job",
				text2: error instanceof Error ? error.message : "Unknown error",
				position: "bottom",
			});
		} finally {
			setPostingJob(false);
		}
	};

	// Show loading screen if still connecting
	if (!data || !client) {
		return (
			<SafeAreaView style={styles.container}>
				<View
					style={[
						styles.container,
						{ justifyContent: "center", alignItems: "center" },
					]}
				>
					<ActivityIndicator
						size="large"
						style={{ marginBottom: 16 }}
					/>
					<Text>Connecting to blockchain...</Text>
				</View>
			</SafeAreaView>
		);
	}

	// Show error screen if there's a network error
	if (error && !loadingJobs) {
		return (
			<SafeAreaView style={styles.container}>
				<View
					style={[
						styles.container,
						{ justifyContent: "center", alignItems: "center" },
					]}
				>
					<Text style={{ marginBottom: 16, textAlign: "center" }}>
						Failed to connect to blockchain
					</Text>
					<TouchableOpacity
						style={{
							backgroundColor: "#191919",
							paddingHorizontal: 20,
							paddingVertical: 12,
							borderRadius: 8,
						}}
						onPress={() => contractService && loadJobs(contractService)}
					>
						<Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	if (showScanner) {
		return (
			<QRScanner
				onScanned={handleScanned}
				onCancel={() => setShowScanner(false)}
			/>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Persistent Header */}
			<PersistentHeader
				address={data?.bech32Address}
				onCopy={copyToClipboard}
				onLogout={handleLogout}
			/>

			{/* Earnings Summary Subheader - Marketplace layout */}
			<View style={styles.dashboardSubheaderMarketplaceRow}>
				<Text style={styles.dashboardSubheaderText}>
					{
						jobs.filter(
							(job) =>
								job.worker === data?.bech32Address && job.status === "Completed"
						).length
					}{" "}
					completed jobs
				</Text>
				<View style={styles.dashboardChip}>
					<Ionicons
						name="wallet-outline"
						size={14}
						color="#059669"
						style={{ marginRight: 4 }}
					/>
					<Text style={styles.dashboardChipText}>
						Earnings: {(totalEarnings / XION_DECIMALS).toFixed(2)} XION
					</Text>
				</View>
			</View>

			<ScrollView
				style={styles.scrollContainer}
				showsVerticalScrollIndicator={false}
			>
				{/* Recent Activity Card */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<Text style={styles.cardTitle}>Recent Activity</Text>
						<TouchableOpacity
							onPress={() => router.push("/(tabs)/recent-activity")}
						>
							<Text style={styles.viewAllText}>View All</Text>
						</TouchableOpacity>
					</View>

					{loadingJobs ? (
						<ActivityIndicator style={styles.loading} />
					) : jobs.length === 0 ? (
						<View style={styles.emptyState}>
							<Ionicons
								name="document-outline"
								size={32}
								color="#ccc"
							/>
							<Text style={styles.emptyStateText}>No recent activity</Text>
							<Text style={styles.emptyStateSubtext}>
								Start by finding or posting a job
							</Text>
						</View>
					) : (
						<View style={styles.activityList}>
							{jobs.slice(0, 3).map((job, index) => (
								<View
									key={job.id}
									style={styles.activityItem}
								>
									<View style={styles.activityIcon}>
										<Ionicons
											name={
												job.status === "Completed"
													? "checkmark-circle"
													: "time-outline"
											}
											size={20}
											color={job.status === "Completed" ? "#10B981" : "#F59E0B"}
										/>
									</View>
									<View style={styles.activityContent}>
										<Text
											style={styles.activityTitle}
											numberOfLines={1}
										>
											{job.description}
										</Text>
										<Text style={styles.activitySubtitle}>
											{(
												parseInt(job.escrow_amount.amount) / XION_DECIMALS
											).toFixed(2)}{" "}
											XION • {job.status}
										</Text>
									</View>
									<Text style={styles.activityTime}>2h ago</Text>
								</View>
							))}
						</View>
					)}
				</View>
			</ScrollView>

			{/* Modals */}
			<Modalize
				ref={modalRef}
				adjustToContentHeight
				handlePosition="inside"
			>
				<ProofSubmissionSheet
					job={activeJob}
					onSubmit={handleSubmitProof}
				/>
			</Modalize>
			{/* Removed Modalize for job creation. Use /create page instead. */}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	// Container - matching onboarding generous spacing
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},

	// Stats Subheader - clean and spacious
	dashboardSubheaderMarketplaceRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 16,
		paddingVertical: 20,
		marginBottom: 8,
		backgroundColor: "#ffffff",
		paddingHorizontal: 32,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	dashboardSubheaderText: {
		fontSize: 14,
		color: "#666",
		fontWeight: "500",
		letterSpacing: 0.1,
	},
	dashboardChip: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f8f9fa",
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 8,
		gap: 6,
		shadowColor: "#000",
		shadowOpacity: 0.04,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	dashboardChipText: {
		fontSize: 14,
		color: "#191919",
		fontWeight: "500",
	},

	// Scroll Container - generous padding like onboarding
	scrollContainer: {
		flex: 1,
		paddingHorizontal: 32,
		paddingTop: 8,
	},

	// Cards - matching onboarding sophisticated style
	card: {
		backgroundColor: "#ffffff",
		borderRadius: 16,
		padding: 32,
		marginTop: 24,
		marginBottom: 8,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},
	cardTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: "#191919",
		marginBottom: 24,
		letterSpacing: -0.3,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 24,
	},
	cardDescription: {
		fontSize: 16,
		color: "#666",
		lineHeight: 24,
		marginBottom: 24,
		fontWeight: "400",
	},
	viewAllText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#191919",
		letterSpacing: 0.1,
	},

	// Activity List - spacious and clean
	activityList: {
		gap: 20,
	},
	activityItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		paddingVertical: 8,
	},
	activityIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#f8f9fa",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},
	activityContent: {
		flex: 1,
		gap: 4,
	},
	activityTitle: {
		fontSize: 16,
		fontWeight: "500",
		color: "#191919",
		lineHeight: 20,
		letterSpacing: 0.1,
	},
	activitySubtitle: {
		fontSize: 14,
		color: "#666",
		fontWeight: "400",
	},
	activityTime: {
		fontSize: 14,
		color: "#999",
		fontWeight: "400",
	},

	// Empty State - sophisticated design
	emptyState: {
		alignItems: "center",
		paddingVertical: 48,
		gap: 16,
	},
	emptyStateText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#191919",
		textAlign: "center",
	},
	emptyStateSubtext: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
		lineHeight: 22,
		maxWidth: 280,
		fontWeight: "400",
	},

	// Loading - centered and spacious
	loading: {
		paddingVertical: 48,
	},

	// Bottom Spacing - generous like onboarding
	bottomSpacing: {
		height: 48,
	},
});

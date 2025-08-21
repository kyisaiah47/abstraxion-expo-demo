import {
	View,
	SafeAreaView,
	ActivityIndicator,
	Alert,
	Text,
	TouchableOpacity,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import Toast from "react-native-toast-message";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import ProofSubmissionSheet from "./jobs/[id]/proof-submission";
import QRScanner from "./qr-scanner";
import JobCreateSheet from "./create";
import { styles } from "./dashboard.styles";
import ProfileRow from "../components/ProfileRow";
import MetricsRow from "../components/MetricsRow";
import ActiveJobCard from "../components/ActiveJobCard";
import BottomActions from "../components/BottomActions";
import { Modalize } from "react-native-modalize";
import { ContractService, type Job } from "../lib/contractService";
import { XION_DECIMALS, CONTRACT_CONFIG } from "../constants/contracts";

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

	// Test Treasury authorization function
	const handleTestTreasuryAuth = async () => {
		if (!contractService) {
			Alert.alert("Error", "Contract service not available");
			return;
		}

		try {
			const result = await contractService.testTreasuryAuthorization();
			if (result.success) {
				Alert.alert("Treasury Success!", result.message);
			} else {
				Alert.alert("Treasury Failed", result.message);
			}
		} catch (error) {
			Alert.alert(
				"Treasury Error",
				`Treasury test failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	};

	// Test function for minimal format
	const handleTestMinimalJob = async () => {
		if (!contractService) {
			Alert.alert("Error", "Contract service not available");
			return;
		}

		try {
			setPostingJob(true);
			await contractService.testPostJobMinimal();
			Alert.alert("Success", "Minimal test worked!");
			await loadJobs(contractService);
		} catch (error) {
			Alert.alert(
				"Error",
				`Minimal test failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			setPostingJob(false);
		}
	};

	// Test contract query function
	const handleTestQuery = async () => {
		if (!contractService) {
			Alert.alert("Error", "Contract service not available");
			return;
		}

		try {
			const result = await contractService.testContractQuery();
			Alert.alert("Query Success", `Found ${result.jobs?.length || 0} jobs`);
		} catch (error) {
			Alert.alert(
				"Query Failed",
				`Query error: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	};

	// Test execute without funds
	const handleTestExecuteNoFunds = async () => {
		if (!contractService) {
			Alert.alert("Error", "Contract service not available");
			return;
		}

		try {
			const result = await contractService.testExecuteWithoutFunds();
			Alert.alert("Execute Success", "Execute without funds worked!");
		} catch (error) {
			Alert.alert(
				"Execute Failed",
				`Execute error: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	};

	// Test client debugging
	const handleTestClientDebug = async () => {
		if (!contractService) {
			Alert.alert("Error", "Contract service not available");
			return;
		}

		try {
			const result = await contractService.testClientDebugging();
			Alert.alert("Debug Success", "Check console for client details");
		} catch (error) {
			Alert.alert(
				"Debug Failed",
				`Debug error: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	};

	// Force create authorization grants
	const handleCreateGrants = async () => {
		if (!contractService || !data?.bech32Address) {
			Alert.alert("Error", "Contract service not available or not connected");
			return;
		}

		Alert.alert(
			"Create Authorization Grants",
			`This will attempt to create authorization grants for your wallet (${data.bech32Address}) to allow Abstraxion to execute contract transactions on your behalf. You may see permission prompts from Abstraxion.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Create Grants",
					onPress: async () => {
						try {
							console.log("🔑 Starting authorization grant creation...");
							const result = await contractService.createAbstraxionGrants();

							if (result.success) {
								Alert.alert("✅ Success", result.message);
								Toast.show({
									type: "success",
									text1: "Authorization Success",
									text2: "Grants created successfully!",
									position: "bottom",
								});
							} else {
								Alert.alert("⚠️ Authorization Required", result.message);
								Toast.show({
									type: "info",
									text1: "Authorization Needed",
									text2: "Please approve any Abstraxion permission requests",
									position: "bottom",
								});
							}
						} catch (error: any) {
							console.error("Authorization flow error:", error);
							Alert.alert(
								"Error",
								`Authorization failed: ${error.message || "Unknown error"}`
							);
						}
					},
				},
			]
		);
	};

	// Test direct signing function
	const handleTestDirectSigning = async () => {
		if (!contractService) {
			Alert.alert("Error", "Contract service not available");
			return;
		}

		try {
			console.log("🧪 Testing direct signing...");
			const result = await contractService.testDirectSigning();

			if (result.success) {
				Alert.alert("✅ Direct Signing", result.message);
			} else {
				Alert.alert("❌ Direct Signing Failed", result.message);
			}
		} catch (error: any) {
			Alert.alert(
				"Error",
				`Direct signing test failed: ${error.message || "Unknown error"}`
			);
		}
	};

	// Direct grant creation function
	const handleDirectGrantCreation = async () => {
		if (!contractService || !data?.bech32Address) {
			Alert.alert("Error", "Contract service not available or not connected");
			return;
		}

		Alert.alert(
			"Direct Grant Creation",
			"This will attempt to create authorization grants using a direct transaction method, bypassing Abstraxion's UI flow.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Create Direct Grant",
					onPress: async () => {
						try {
							console.log("🔧 Starting direct grant creation...");
							const result = await contractService.createAuthorizationGrant();

							if (result.success) {
								Alert.alert("✅ Success", result.message);
								Toast.show({
									type: "success",
									text1: "Grant Created",
									text2: "Direct authorization grant created!",
									position: "bottom",
								});
							} else {
								Alert.alert("❌ Failed", result.message);
								Toast.show({
									type: "error",
									text1: "Grant Creation Failed",
									text2: result.message,
									position: "bottom",
								});
							}
						} catch (error: any) {
							console.error("Direct grant creation error:", error);
							Alert.alert(
								"Error",
								`Direct grant creation failed: ${
									error.message || "Unknown error"
								}`
							);
						}
					},
				},
			]
		);
	};

	// Reconnect wallet function
	const handleReconnectWallet = async () => {
		try {
			await logout();
			setTimeout(() => {
				router.replace("/");
			}, 1000);
			Toast.show({
				type: "info",
				text1: "Reconnecting",
				text2: "Please reconnect your wallet",
				position: "bottom",
			});
		} catch (error) {
			console.error("Error during reconnection:", error);
		}
	};

	// Error retry function
	const handleRetry = () => {
		if (contractService) {
			loadJobs(contractService);
		}
	};

	// Show loading screen if still connecting
	if (!data || !client) {
		return (
			<SafeAreaView style={styles.safeArea}>
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
			<SafeAreaView style={styles.safeArea}>
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
						onPress={handleRetry}
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
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<ProfileRow
					data={data}
					copyToClipboard={copyToClipboard}
					handleLogout={handleLogout}
					truncateAddress={truncateAddress}
				/>
				<MetricsRow
					loadingJobs={loadingJobs}
					jobs={jobs}
					totalEarnings={totalEarnings}
					userAddress={data?.bech32Address}
				/>
				<View style={{ flex: 1, width: "100%" }}>
					{loadingJobs ? (
						<ActivityIndicator
							size="large"
							style={{ marginTop: 40 }}
						/>
					) : (
						<ActiveJobCard
							activeJob={activeJob}
							modalRef={modalRef}
							truncateAddress={truncateAddress}
							userAddress={data?.bech32Address}
						/>
					)}
				</View>

				{/* Debug Test Buttons */}
				<View style={{ padding: 20, gap: 10 }}>
					<TouchableOpacity
						style={{
							backgroundColor: "#FF3030",
							paddingVertical: 12,
							paddingHorizontal: 20,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleReconnectWallet}
					>
						<Text style={{ color: "white", fontWeight: "bold" }}>
							🔄 Reconnect Wallet
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={{
							backgroundColor: "#4ECDC4",
							paddingVertical: 12,
							paddingHorizontal: 20,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleTestQuery}
					>
						<Text style={{ color: "white", fontWeight: "bold" }}>
							🔍 Test Contract Query
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={{
							backgroundColor: "#E67E22",
							paddingVertical: 12,
							paddingHorizontal: 20,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleTestClientDebug}
					>
						<Text style={{ color: "white", fontWeight: "bold" }}>
							🔧 Debug Client Info
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={{
							backgroundColor: "#FFA500",
							paddingVertical: 12,
							paddingHorizontal: 20,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleCreateGrants}
					>
						<Text style={{ color: "white", fontWeight: "bold" }}>
							🔑 Create Authorization Grants
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={{
							backgroundColor: "#FF8C00",
							paddingVertical: 12,
							paddingHorizontal: 20,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleDirectGrantCreation}
					>
						<Text style={{ color: "white", fontWeight: "bold" }}>
							🛠️ Direct Grant Creation
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={{
							backgroundColor: "#8B4513",
							paddingVertical: 12,
							paddingHorizontal: 20,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleTestDirectSigning}
					>
						<Text style={{ color: "white", fontWeight: "bold" }}>
							🧪 Test Direct Signing
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={{
							backgroundColor: "#9B59B6",
							paddingVertical: 12,
							paddingHorizontal: 20,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleTestExecuteNoFunds}
					>
						<Text style={{ color: "white", fontWeight: "bold" }}>
							⚡ Test Execute (No Funds)
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={{
							backgroundColor: "#FF6B6B",
							paddingVertical: 12,
							paddingHorizontal: 20,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleTestMinimalJob}
						disabled={postingJob}
					>
						<Text style={{ color: "white", fontWeight: "bold" }}>
							{postingJob ? "Testing..." : "🔧 Test Minimal Job Post"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={{
							backgroundColor: "#2ECC71",
							paddingVertical: 12,
							paddingHorizontal: 20,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleTestTreasuryAuth}
					>
						<Text style={{ color: "white", fontWeight: "bold" }}>
							🏦 Test Treasury Authorization
						</Text>
					</TouchableOpacity>
				</View>

				<BottomActions
					handleScanQR={handleScanQR}
					createModalRef={createModalRef}
				/>
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
				<Modalize
					ref={createModalRef}
					adjustToContentHeight
					handlePosition="inside"
				>
					<JobCreateSheet
						onCreate={handleCreateJob}
						creating={postingJob}
					/>
				</Modalize>
			</View>
		</SafeAreaView>
	);
}

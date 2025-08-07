import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	TouchableOpacity,
	Image,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import Toast from "react-native-toast-message";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Modalize } from "react-native-modalize";
import ProofSubmissionSheet from "./jobs/[id]/proof-submission";
import QRScanner from "./qr-scanner";

// === BEGIN: XION FETCH LOGIC ===
const CONTRACT_ADDRESS =
	"xion1d7zer33uxd3u8cp8e4huck03z0gg6v2kv02n088yrgg5qkwxsfnqxnvxvt";
const API_URL = `https://api.xion-testnet-2.burnt.com/cosmwasm/wasm/v1/contract/${CONTRACT_ADDRESS}/smart/${btoa(
	JSON.stringify({ ListJobs: {} })
)}`;

async function fetchJobsFromChain() {
	try {
		const res = await fetch(API_URL, { method: "GET" });
		const json = await res.json();
		return json.data?.jobs ?? [];
	} catch (e) {
		console.warn("Failed to fetch jobs:", e);
		return [];
	}
}
// === END: XION FETCH LOGIC ===

export default function JobsDashboardScreen() {
	const [showScanner, setShowScanner] = useState(false);
	const { data, logout } = useAbstraxionAccount();
	const router = useRouter();
	const modalRef = useRef(null);

	const [jobs, setJobs] = useState([]);
	const [loadingJobs, setLoadingJobs] = useState(true);
	const [activeJob, setActiveJob] = useState(null);

	const truncateAddress = (address) => {
		if (!address) return "";
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

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

	const handleSubmitProof = () => {
		Toast.show({
			type: "success",
			text1: "Proof submitted!",
			position: "bottom",
		});
		modalRef.current?.close();
	};

	const handleScanQR = () => setShowScanner(true);

	const handleScanned = (data) => {
		alert(`QR Code: ${data}`);
		setShowScanner(false);
	};

	// --- Fetch jobs from XION on mount ---
	useEffect(() => {
		let mounted = true;
		setLoadingJobs(true);
		fetchJobsFromChain().then((jobs) => {
			if (!mounted) return;
			setJobs(jobs);
			// Pick the first open job as active for demo
			setActiveJob(jobs.find((j) => !j.accepted) || null);
			setLoadingJobs(false);
		});
		return () => {
			mounted = false;
		};
	}, []);

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
				{/* Profile row */}
				<View style={styles.profileRow}>
					<View style={styles.iconRow}>
						<Image
							source={{
								uri: "https://hvnbpd9agmcawbt2.public.blob.vercel-storage.com/Grow.png",
							}}
							style={styles.logo}
							resizeMode="contain"
						/>
						{data?.bech32Address && (
							<TouchableOpacity
								style={styles.walletBadge}
								onPress={copyToClipboard}
							>
								<Text style={styles.walletText}>
									{truncateAddress(data.bech32Address)}
								</Text>
								<MaterialIcons
									name="content-copy"
									size={14}
									color="#191919"
									style={{ marginLeft: 5 }}
								/>
							</TouchableOpacity>
						)}
					</View>
					<TouchableOpacity onPress={handleLogout}>
						<MaterialIcons
							name="logout"
							size={22}
							color="#64748B"
						/>
					</TouchableOpacity>
				</View>
				{/* Wallet */}
				<View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
					<View style={[styles.balanceCard, { flex: 1 }]}>
						<Text style={styles.balanceLabel}>Total Earned</Text>
						<Text style={styles.balanceValue}>$1,200</Text>
					</View>
					<View style={[styles.balanceCard, { flex: 1 }]}>
						<Text style={styles.balanceLabel}>Jobs Open</Text>
						<Text style={styles.balanceValue}>
							{loadingJobs ? (
								<ActivityIndicator size="small" />
							) : (
								jobs.filter((j) => !j.accepted).length
							)}
						</Text>
					</View>
				</View>
				<View style={{ flex: 1, width: "100%" }}>
					{loadingJobs ? (
						<ActivityIndicator
							size="large"
							style={{ marginTop: 40 }}
						/>
					) : activeJob ? (
						<View style={styles.activeJobCard}>
							<View style={styles.activeJobText}>
								<Text style={styles.activeJobLabel}>Resume work</Text>
								<Text style={styles.activeJobTitle}>
									{activeJob.description}
								</Text>
								<Text style={styles.activeJobClient}>
									Client: {truncateAddress(activeJob.client)}
								</Text>
								{activeJob.worker && (
									<Text style={styles.activeJobClient}>
										Worker: {truncateAddress(activeJob.worker)}
									</Text>
								)}
								{activeJob.proof && (
									<Text style={styles.activeJobClient}>
										Proof: {activeJob.proof}
									</Text>
								)}
								<Text style={styles.activeJobClient}>
									Accepted: {activeJob.accepted ? "✅" : "❌"}
								</Text>
							</View>
							<TouchableOpacity
								style={styles.resumeButton}
								onPress={() => modalRef.current?.open()}
							>
								<Text style={styles.resumeButtonText}>Submit</Text>
							</TouchableOpacity>
						</View>
					) : (
						<Text>No open jobs right now.</Text>
					)}
				</View>

				<TouchableOpacity
					style={styles.primaryButton}
					onPress={handleScanQR}
				>
					<MaterialCommunityIcons
						name="qrcode-scan"
						size={22}
						color="#fff"
						style={{ marginRight: 8 }}
					/>
					<Text style={styles.primaryButtonText}>Scan Job QR</Text>
				</TouchableOpacity>
				<Modalize
					ref={modalRef}
					adjustToContentHeight
					handlePosition="inside"
				>
					<ProofSubmissionSheet
						job={activeJob}
						proofEvents={[]} // you can pass real proof events here
						onSubmit={handleSubmitProof}
					/>
				</Modalize>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#fafafa",
	},
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
	},
	logo: {
		width: 25,
		height: 25,
		marginTop: 2,
	},
	iconRow: {
		flexDirection: "row",
		gap: 7,
	},
	greeting: {
		fontSize: 22,
		fontWeight: "800",
		color: "#191919",
		marginBottom: 12,
	},
	profileRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 12,
	},
	walletBadge: {
		backgroundColor: "#e5e5e5",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 100,
		marginBottom: 16,
		flexDirection: "row",
		alignItems: "center",
	},
	walletText: {
		fontSize: 13,
		color: "#191919",
		fontWeight: "600",
		letterSpacing: 0.4,
	},
	balanceCard: {
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#ededed",
		alignItems: "flex-start",
		flex: 1,
	},
	balanceLabel: {
		fontSize: 15,
		color: "#8e8e8e",
		marginBottom: 4,
		fontWeight: "500",
	},
	balanceValue: {
		fontSize: 28,
		fontWeight: "700",
		color: "#191919",
	},
	activeJobCard: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#fff",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#ededed",
		padding: 18,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOpacity: 0.03,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 8,
		elevation: 2,
	},
	activeJobText: {
		flex: 1,
	},
	activeJobLabel: {
		color: "#8e8e8e",
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 2,
	},
	activeJobTitle: {
		fontSize: 17,
		fontWeight: "700",
		color: "#191919",
	},
	activeJobClient: {
		fontSize: 15,
		color: "#8e8e8e",
	},
	resumeButton: {
		backgroundColor: "#191919",
		paddingVertical: 8,
		paddingHorizontal: 18,
		borderRadius: 8,
		marginLeft: 18,
	},
	resumeButtonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 15,
	},
	primaryButton: {
		backgroundColor: "#191919",
		paddingVertical: 17,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 28,
		flexDirection: "row",
	},
	primaryButtonText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
		letterSpacing: 0.1,
	},
});

import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import Toast from "react-native-toast-message";
import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Modalize } from "react-native-modalize";
import TestModalize from "./test-modalize";

// Example for current/active job (replace with your logic or Redux/store/etc)
const activeJob = {
	title: "Design landing page",
	client: "Acme Inc.",
};

export default function JobsDashboardScreen() {
	const { data, logout } = useAbstraxionAccount();
	const router = useRouter();
	const modalRef = useRef<Modalize>(null);

	const [showResume, setShowResume] = useState(Boolean(activeJob)); // true if there's an active job

	const truncateAddress = (address: string | undefined | null) => {
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
		router.replace("/"); // Back to WelcomeScreen
	};

	const openJobsCount = 3; // Replace with your data logic
	const jobsScanned = 8; // Replace with your data logic

	const handleResumeJob = () => {
		// Navigate to current job detail or work screen
		router.push("/job-detail"); // Adjust route as needed
	};

	const handleScanQR = () => {
		// Navigate to QR scanner screen
		router.push("/scan-qr"); // Adjust route as needed
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				{/* Profile row */}
				<View style={styles.profileRow}>
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
					<TouchableOpacity onPress={handleLogout}>
						<MaterialIcons
							name="logout"
							size={22}
							color="#64748B"
						/>
					</TouchableOpacity>
				</View>

				{/* Wallet */}

				{/* Metrics Row */}
				<View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
					<View style={[styles.balanceCard, { flex: 1 }]}>
						<Text style={styles.balanceLabel}>Total Earned</Text>
						<Text style={styles.balanceValue}>$1,200</Text>
					</View>
					<View style={[styles.balanceCard, { flex: 1 }]}>
						<Text style={styles.balanceLabel}>Jobs Open</Text>
						<Text style={styles.balanceValue}>{openJobsCount}</Text>
					</View>
				</View>

				<View style={{ flex: 1, width: "100%" }}>
					{/* Only show if an active job exists */}
					{showResume && activeJob && (
						<View style={styles.activeJobCard}>
							<View style={styles.activeJobText}>
								<Text style={styles.activeJobLabel}>Resume work</Text>
								<Text style={styles.activeJobTitle}>{activeJob.title}</Text>
								<Text style={styles.activeJobClient}>{activeJob.client}</Text>
							</View>
							<TouchableOpacity
								style={styles.resumeButton}
								onPress={() => modalRef.current?.open()}
							>
								<Text style={styles.resumeButtonText}>Submit</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>

				{/* Main CTA */}
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

				<Modalize ref={modalRef}>...your content</Modalize>
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
	greeting: {
		fontSize: 22,
		fontWeight: "800",
		color: "#191919",
		marginBottom: 12,
	},
	profileRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		marginBottom: 12,
	},
	walletBadge: {
		alignSelf: "flex-start",
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
		borderRadius: 100,
		marginLeft: 18,
	},
	resumeButtonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 15,
	},
	primaryButton: {
		backgroundColor: "#191919",
		paddingVertical: 16,
		borderRadius: 100,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 28,
		flexDirection: "row", // <-- to align icon + text
	},
	primaryButtonText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
		letterSpacing: 0.1,
	},
});

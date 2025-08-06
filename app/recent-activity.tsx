import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	FlatList,
	TouchableOpacity,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import Toast from "react-native-toast-message";
import { useState } from "react";
import { useRouter } from "expo-router";

const jobs = [
	{
		id: "1",
		title: "Design landing page",
		client: "Acme Inc.",
		status: "open",
		timestamp: "2h ago",
	},
	{
		id: "2",
		title: "Logo design",
		client: "Self",
		status: "completed",
		timestamp: "4h ago",
	},
	{
		id: "3",
		title: "Web App Dev",
		client: "Zebra Corp.",
		status: "archived",
		timestamp: "1d ago",
	},
];

const statusColors = {
	open: "#6366F1",
	completed: "#10B981",
	archived: "#9CA3AF",
};

export default function JobsDashboardScreen() {
	const { data, logout } = useAbstraxionAccount();
	const [selectedStatus, setSelectedStatus] = useState("open");
	const router = useRouter();

	const filteredJobs = jobs.filter((j) => j.status === selectedStatus);

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
		router.replace("/"); // This is the index route (WelcomeScreen)
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				{/* Profile row */}
				<View style={styles.profileRow}>
					<Text style={styles.greeting}>Welcome back 👋</Text>
					<TouchableOpacity onPress={handleLogout}>
						<MaterialIcons
							name="logout"
							size={22}
							color="#64748B"
						/>
					</TouchableOpacity>
				</View>

				{/* Wallet */}
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
							color="#6366F1"
							style={{ marginLeft: 5 }}
						/>
					</TouchableOpacity>
				)}

				{/* Balance */}
				<View style={styles.balanceCard}>
					<Text style={styles.balanceLabel}>Total Earned</Text>
					<Text style={styles.balanceValue}>$1,200</Text>
				</View>

				{/* Start Task */}
				<TouchableOpacity style={styles.primaryButton}>
					<Text style={styles.primaryButtonText}>Start New Task</Text>
				</TouchableOpacity>

				{/* Job Filters */}
				<View style={styles.chipRow}>
					{["open", "completed", "archived"].map((status) => (
						<TouchableOpacity
							key={status}
							style={[
								styles.chip,
								selectedStatus === status && {
									backgroundColor: statusColors[status],
									color: "#fff",
								},
							]}
							onPress={() => setSelectedStatus(status)}
						>
							<Text
								style={{
									color:
										selectedStatus === status ? "#fff" : statusColors[status],
									fontWeight: "600",
								}}
							>
								{status.charAt(0).toUpperCase() + status.slice(1)}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Jobs List */}
				<FlatList
					data={filteredJobs}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<View style={styles.activityItem}>
							<View
								style={[
									styles.iconWrapper,
									{ backgroundColor: statusColors[item.status] + "22" },
								]}
							>
								<MaterialCommunityIcons
									name={
										item.status === "open"
											? "clock-outline"
											: item.status === "completed"
											? "check-circle-outline"
											: "archive-outline"
									}
									size={24}
									color={statusColors[item.status]}
								/>
							</View>
							<View style={styles.textWrapper}>
								<Text style={styles.activityTitle}>{item.title}</Text>
								<Text style={styles.activitySubtitle}>{item.client}</Text>
							</View>
							<View style={styles.timestampWrapper}>
								<Text style={styles.timestamp}>{item.timestamp}</Text>
							</View>
						</View>
					)}
					ListEmptyComponent={
						<Text style={styles.emptyState}>No jobs yet.</Text>
					}
					contentContainerStyle={{ paddingBottom: 24 }}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F4F4F5",
	},
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
	},
	greeting: {
		fontSize: 20,
		fontWeight: "600",
		color: "#111827",
		marginBottom: 12,
	},
	walletBadge: {
		alignSelf: "flex-start",
		backgroundColor: "#E0E7FF",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 100,
		marginBottom: 16,
	},
	walletText: {
		fontSize: 12,
		color: "#4338CA",
		fontWeight: "600",
		letterSpacing: 0.4,
	},
	balanceCard: {
		backgroundColor: "#EEF2FF",
		padding: 20,
		borderRadius: 12,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	balanceLabel: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 4,
	},
	balanceValue: {
		fontSize: 24,
		fontWeight: "700",
		color: "#4F46E5",
	},
	primaryButton: {
		backgroundColor: "#6366F1",
		paddingVertical: 14,
		borderRadius: 100,
		alignItems: "center",
		marginBottom: 24,
	},
	primaryButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#111827",
		marginBottom: 12,
	},
	activityItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 1,
	},
	profileRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	chipRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 16,
		justifyContent: "center",
	},
	chip: {
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 100,
		backgroundColor: "#F1F5F9",
	},
	iconWrapper: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#EEF2FF",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	timestampWrapper: {
		position: "absolute",
		top: 12,
		right: 16,
	},
	timestamp: {
		fontSize: 12,
		color: "#9CA3AF",
	},
	textWrapper: {
		flex: 1,
	},
	activityTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	activitySubtitle: {
		fontSize: 14,
		color: "#6B7280",
	},
	emptyState: {
		textAlign: "center",
		color: "#6B7280",
		marginTop: 40,
		fontSize: 14,
		fontStyle: "italic",
	},
});

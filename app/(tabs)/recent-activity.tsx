import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	FlatList,
	TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { Platform, ToastAndroid } from "react-native";
import Toast from "react-native-toast-message";

const recentActivities = [
	{
		id: "1",
		title: "Accepted task",
		subtitle: "Design landing page",
		icon: "check-circle",
	},
	{
		id: "2",
		title: "Submitted proof",
		subtitle: "Logo design",
		icon: "upload-file",
	},
	{
		id: "3",
		title: "Received payment",
		subtitle: "$500 for Web App",
		icon: "attach-money",
	},
];

if (Platform.OS === "android") {
	ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
}

export default function RecentActivityScreen() {
	const hasActivity = recentActivities.length > 0;

	const truncateAddress = (address: string) => {
		if (!address) return "";
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const { data } = useAbstraxionAccount();

	const copyToClipboard = async () => {
		if (data?.bech32Address) {
			await Clipboard.setStringAsync(data?.bech32Address);
			Toast.show({
				type: "success",
				text1: "Copied",
				text2: "Wallet address copied to clipboard",
				position: "bottom",
			});
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<Text style={styles.greeting}>Welcome back 👋</Text>

				{data?.bech32Address && (
					<TouchableOpacity
						style={styles.walletBadge}
						onPress={copyToClipboard}
					>
						<Text style={styles.walletText}>
							{truncateAddress(data.bech32Address)}
						</Text>
					</TouchableOpacity>
				)}

				<View style={styles.balanceCard}>
					<Text style={styles.balanceLabel}>Total Earned</Text>
					<Text style={styles.balanceValue}>$1,200</Text>
				</View>

				<TouchableOpacity style={styles.primaryButton}>
					<Text style={styles.primaryButtonText}>Start New Task</Text>
				</TouchableOpacity>

				<Text style={styles.sectionTitle}>Recent Activity</Text>

				{hasActivity ? (
					<FlatList
						data={recentActivities}
						keyExtractor={(item) => item.id}
						contentContainerStyle={{ paddingBottom: 24 }}
						renderItem={({ item }) => (
							<View style={styles.activityItem}>
								<View style={styles.iconWrapper}>
									<MaterialIcons
										name={item.icon}
										size={24}
										color="#6366F1"
									/>
								</View>
								<View style={styles.textWrapper}>
									<Text style={styles.activityTitle}>{item.title}</Text>
									<Text style={styles.activitySubtitle}>{item.subtitle}</Text>
								</View>
							</View>
						)}
					/>
				) : (
					<Text style={styles.emptyState}>
						No recent activity yet. Complete a task to get started!
					</Text>
				)}
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
	iconWrapper: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#EEF2FF",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
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

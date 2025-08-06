import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";

export default function JobDetailsScreen() {
	const { jobId } = useLocalSearchParams();
	const insets = useSafeAreaInsets();
	const tabBarHeight = useBottomTabBarHeight();
	const router = useRouter();

	const { data: account, isConnected, login } = useAbstraxionAccount();
	const { client: signingClient } = useAbstraxionSigningClient();

	const handleAcceptTask = async () => {
		try {
			if (!isConnected) {
				await login();
			}

			if (!signingClient || !account?.address) {
				throw new Error("Wallet not ready");
			}

			const result = await signingClient.execute(
				account.address, // sender (freelancer)
				"xion1trustcontract...", // your deployed trust contract address
				{
					create_trust: {
						job_id: jobId,
						amount: "500000", // 500 XION in uxion
						client: "xion1client...", // client wallet address
						task: "Design landing page",
					},
				},
				"auto" // fee
			);

			console.log("✅ Trust created:", result);
			router.push("/proof-submission");
		} catch (err: any) {
			console.error("❌ Error creating trust:", err);
			Alert.alert("Error", err.message || "Failed to create trust.");
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<Stack.Screen options={{ title: "Job Details" }} />
			<KeyboardAvoidingView
				style={styles.keyboardAvoiding}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View
					style={[
						styles.wrapper,
						{ paddingBottom: Math.max(insets.bottom, tabBarHeight) + 16 },
					]}
				>
					<View style={styles.centeredContent}>
						<View style={styles.card}>
							<View style={[styles.iconRow, { marginTop: 0 }]}>
								<MaterialCommunityIcons
									name="clipboard-text-outline"
									size={20}
									color="#6B7280"
									style={styles.icon}
								/>
								<Text style={styles.sectionTitle}>Task</Text>
							</View>

							<View style={{ gap: 8 }}>
								<Text style={styles.jobTitle}>Design landing page</Text>
								<Text style={styles.description}>
									Create a modern, responsive landing page for client
								</Text>
							</View>

							<View style={styles.gridRow}>
								<View style={styles.gridItem}>
									<MaterialCommunityIcons
										name="wallet-outline"
										size={18}
										color="#6B7280"
										style={styles.icon}
									/>
									<View>
										<Text style={styles.label}>Budget</Text>
										<Text style={styles.value}>$500</Text>
									</View>
								</View>
								<View style={styles.gridItem}>
									<MaterialCommunityIcons
										name="calendar-blank-outline"
										size={18}
										color="#6B7280"
										style={styles.icon}
									/>
									<View>
										<Text style={styles.label}>Due</Text>
										<Text style={styles.value}>Aug 9</Text>
									</View>
								</View>
							</View>

							<View style={styles.iconRow}>
								<Text style={styles.label}>Client</Text>
							</View>
							<View style={styles.clientRow}>
								<View style={styles.avatar}>
									<Text style={styles.avatarText}>D</Text>
								</View>
								<Text style={styles.clientName}>David Smith</Text>
							</View>
						</View>
					</View>

					<View style={styles.footer}>
						<TouchableOpacity
							style={styles.button}
							onPress={handleAcceptTask}
						>
							<Text style={styles.buttonText}>ACCEPT TASK</Text>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F4F4F5",
	},
	keyboardAvoiding: {
		flex: 1,
	},
	wrapper: {
		flex: 1,
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	centeredContent: {
		flexGrow: 1,
		justifyContent: "center",
	},
	card: {
		backgroundColor: "#FFFFFF",
		padding: 20,
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	iconRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
		marginTop: 32,
	},
	icon: {
		marginRight: 6,
		marginTop: 2,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: "500",
		color: "#6B7280",
	},
	jobTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
	description: {
		fontSize: 15,
		color: "#4B5563",
		lineHeight: 22,
	},
	gridRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 16,
		marginTop: 16,
	},
	gridItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		width: "48%",
	},
	label: {
		fontSize: 13,
		color: "#6B7280",
		marginBottom: 2,
	},
	value: {
		fontSize: 15,
		fontWeight: "600",
		color: "#111827",
	},
	clientRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#EDE9FE",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	avatarText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#7C3AED",
	},
	clientName: {
		fontSize: 16,
		color: "#111827",
	},
	footer: {
		paddingTop: 16,
	},
	button: {
		backgroundColor: "#6366F1",
		paddingVertical: 16,
		borderRadius: 10,
		alignItems: "center",
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});

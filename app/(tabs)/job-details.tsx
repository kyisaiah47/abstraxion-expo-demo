import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	KeyboardAvoidingView,
	Platform,
	Linking,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

export default function JobDetailsScreen() {
	const { jobId } = useLocalSearchParams();

	const openExplorer = () => {
		Linking.openURL("https://xion.explorer/tx/0x123");
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<Stack.Screen options={{ title: "Job Details" }} />
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View style={styles.wrapper}>
					<View style={styles.content}>
						<Text style={styles.sectionTitle}>Task</Text>

						<View style={{ gap: 8 }}>
							<Text style={styles.jobTitle}>Design landing page</Text>
							<Text style={styles.description}>
								Create a modern, responsive landing page for client
							</Text>
						</View>

						<View style={{ marginTop: 24 }}>
							<View style={styles.row}>
								<View>
									<Text style={styles.label}>Budget</Text>
									<Text style={styles.value}>$500</Text>
								</View>
								<View>
									<Text style={styles.label}>Due</Text>
									<Text style={styles.value}>Aug 9</Text>
								</View>
							</View>

							<Text style={styles.label}>Client</Text>
							<View style={styles.clientRow}>
								<View style={styles.avatar}>
									<Text style={styles.avatarText}>D</Text>
								</View>
								<Text style={styles.clientName}>David Smith</Text>
							</View>
						</View>
					</View>

					<View>
						<View style={styles.separator} />
						<View style={styles.buttonContainer}>
							<TouchableOpacity style={styles.button}>
								<Text style={styles.buttonText}>ACCEPT TASK</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#fff",
	},
	wrapper: {
		flex: 1,
		justifyContent: "space-between",
		paddingHorizontal: 24,
		paddingBottom: 24,
	},
	content: {
		flexGrow: 1,
		justifyContent: "center",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "500",
		color: "#444",
		marginBottom: 12,
	},
	jobTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#111",
	},
	description: {
		fontSize: 16,
		color: "#555",
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		color: "#666",
		marginBottom: 6,
	},
	value: {
		fontSize: 14,
		color: "#111",
		lineHeight: 20,
	},
	clientRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#E0D5FA",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	avatarText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#3A1E78",
	},
	clientName: {
		fontSize: 16,
		color: "#111",
	},
	separator: {
		height: 1,
		backgroundColor: "#eee",
		marginBottom: 12,
	},
	buttonContainer: {
		paddingTop: 12,
		backgroundColor: "#fff",
	},
	button: {
		backgroundColor: "#2563EB",
		paddingVertical: 16,
		borderRadius: 10,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});

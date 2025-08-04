import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	ScrollView,
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
			<Stack.Screen options={{ title: "Proof of Work" }} />
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView contentContainerStyle={styles.container}>
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

					<View style={styles.section}>
						<Text style={styles.label}>Required Proof</Text>
						<View style={styles.proofList}>
							<Text style={styles.proofItem}>• Access https://figma.com</Text>
							<Text style={styles.proofItem}>
								• Upload assets to Google Drive
							</Text>
							<Text style={styles.proofItem}>• Deploy to Vercel</Text>
						</View>
					</View>

					<View style={styles.section}>
						<Text style={styles.label}>Proof Type</Text>
						<Text style={styles.value}>
							Zero-Knowledge TLS Session Proof (zkTLS)
						</Text>
					</View>

					<View style={styles.section}>
						<Text style={styles.label}>Job ID</Text>
						<Text style={styles.value}>#{jobId}</Text>

						<Text style={[styles.label, { marginTop: 16 }]}>
							Payment Contract
						</Text>
						<Text
							style={styles.link}
							onPress={openExplorer}
						>
							View on chain →
						</Text>
					</View>

					<View style={styles.section}>
						<Text style={styles.label}>Escrow</Text>
						<Text style={styles.value}>
							Funds held in smart contract. Released upon verified proof and
							client approval.
						</Text>
					</View>
				</ScrollView>

				<View style={styles.separator} />
				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.button}>
						<Text style={styles.buttonText}>ACCEPT TASK</Text>
					</TouchableOpacity>
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
	container: {
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 48,
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
	proofList: {
		marginTop: 4,
		marginBottom: 12,
		gap: 4,
	},
	proofItem: {
		fontSize: 14,
		color: "#333",
	},
	link: {
		color: "#2563EB",
		fontSize: 14,
		fontWeight: "500",
	},
	section: {
		marginTop: 24,
	},
	separator: {
		height: 1,
		backgroundColor: "#eee",
		marginHorizontal: 24,
	},
	buttonContainer: {
		paddingHorizontal: 24,
		paddingVertical: 16,
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

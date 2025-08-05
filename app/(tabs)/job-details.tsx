import React from "react";
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
				style={styles.keyboardAvoiding}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View style={styles.wrapper}>
					<View style={styles.centeredContent}>
						<View style={styles.card}>
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
					</View>

					<View style={styles.footer}>
						<TouchableOpacity
							style={styles.button}
							onPress={openExplorer}
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
	sectionTitle: {
		fontSize: 14,
		fontWeight: "500",
		color: "#6B7280",
		marginBottom: 12,
	},
	jobTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111827",
	},
	description: {
		fontSize: 15,
		color: "#4B5563",
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
		marginTop: 8,
	},
	label: {
		fontSize: 13,
		color: "#6B7280",
		marginBottom: 4,
	},
	value: {
		fontSize: 15,
		color: "#111827",
		fontWeight: "500",
	},
	clientRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
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

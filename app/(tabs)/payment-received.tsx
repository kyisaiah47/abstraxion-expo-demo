import React from "react";
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";

export default function PaymentReceivedScreen() {
	const handleShareProof = () => {
		console.log("Proof of completion shared");
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<Stack.Screen options={{ title: "Payment Received" }} />
			<View style={styles.wrapper}>
				<View style={styles.content}>
					<Text style={styles.title}>Payment Received</Text>
					<Text style={styles.description}>
						Your payment has been successfully received for the task.
					</Text>

					<View style={styles.section}>
						<Text style={styles.label}>Task</Text>
						<Text style={styles.value}>Design landing page</Text>

						<Text style={[styles.label, { marginTop: 16 }]}>Amount</Text>
						<Text style={styles.value}>$500</Text>

						<Text style={[styles.label, { marginTop: 16 }]}>
							Proof of Completion
						</Text>
						<Text style={styles.value}>
							Zero-Knowledge TLS Session Proof (zkTLS)
						</Text>
					</View>
				</View>

				<View style={styles.footer}>
					<TouchableOpacity
						style={styles.button}
						onPress={handleShareProof}
					>
						<Text style={styles.buttonText}>SHARE PROOF</Text>
					</TouchableOpacity>
				</View>
			</View>
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
		paddingHorizontal: 24,
		paddingBottom: 24,
		justifyContent: "space-between",
	},
	content: {
		flexGrow: 1,
		justifyContent: "center",
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		color: "#111",
		marginBottom: 12,
	},
	description: {
		fontSize: 16,
		color: "#555",
		marginBottom: 24,
	},
	section: {
		marginBottom: 24,
	},
	label: {
		fontSize: 14,
		color: "#666",
		marginBottom: 6,
	},
	value: {
		fontSize: 16,
		color: "#111",
		lineHeight: 20,
	},
	footer: {
		paddingTop: 12,
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

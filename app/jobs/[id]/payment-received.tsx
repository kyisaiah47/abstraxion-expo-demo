import React from "react";
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PaymentReceivedScreen() {
	const insets = useSafeAreaInsets();
	let tabBarHeight = 0;
	try {
		tabBarHeight = useBottomTabBarHeight();
	} catch (e) {
		tabBarHeight = 0;
	}

	const handleShareProof = () => {
		console.log("Proof of completion shared");
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<Stack.Screen options={{ title: "Payment Received" }} />
			<View
				style={[
					styles.wrapper,
					{
						paddingBottom: Math.max(insets.bottom, tabBarHeight) + 16,
					},
				]}
			>
				<View style={styles.centeredContent}>
					<View style={styles.card}>
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
		backgroundColor: "#F4F4F5",
	},
	wrapper: {
		flex: 1,
		paddingHorizontal: 20,
		paddingBottom: 20,
		justifyContent: "space-between",
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
	title: {
		fontSize: 22,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 12,
	},
	description: {
		fontSize: 16,
		color: "#4B5563",
		marginBottom: 24,
	},
	section: {
		marginBottom: 8,
	},
	label: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 4,
	},
	value: {
		fontSize: 16,
		color: "#111827",
		lineHeight: 22,
	},
	footer: {
		paddingTop: 12,
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

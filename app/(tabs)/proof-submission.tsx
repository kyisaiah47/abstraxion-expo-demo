import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const proofEvents = [
	{ description: "Accessed figma.com", time: "10:22 AM" },
	{ description: "Deployed to vercel.com", time: "1:10 AM" },
	{ description: "Uploaded assets to figma.com", time: "9:00 AM" },
];

export default function ProofSubmissionScreen() {
	const handleSubmit = () => {
		console.log("Proof submitted!");
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<Stack.Screen options={{ title: "Proof of Work" }} />
			<View style={styles.wrapper}>
				<View style={styles.content}>
					<Text style={styles.title}>Submit proof{"\n"}of work</Text>

					{proofEvents.map((item, idx) => (
						<View
							key={idx}
							style={styles.proofRow}
						>
							<Ionicons
								name="checkmark-circle"
								size={20}
								color="#10B981"
							/>
							<Text style={styles.proofText}>{item.description}</Text>
							<Text style={styles.proofTime}>{item.time}</Text>
						</View>
					))}
				</View>

				<View style={styles.footer}>
					<TouchableOpacity
						style={styles.button}
						onPress={handleSubmit}
					>
						<Text style={styles.buttonText}>SUBMIT PROOF</Text>
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
		justifyContent: "space-between",
		paddingHorizontal: 24,
		paddingBottom: 24,
	},
	content: {
		flexGrow: 1,
		justifyContent: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#111",
		marginBottom: 32,
		lineHeight: 32,
	},
	proofRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	proofText: {
		flex: 1,
		fontSize: 16,
		color: "#111",
		marginLeft: 8,
	},
	proofTime: {
		fontSize: 14,
		color: "#666",
		marginLeft: 8,
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

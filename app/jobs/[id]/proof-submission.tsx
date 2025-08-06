import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// You can pass these as props if you want dynamic data
const proofEvents = [
	{ description: "Accessed figma.com", time: "10:22 AM" },
	{ description: "Deployed to vercel.com", time: "1:10 AM" },
	{ description: "Uploaded assets to figma.com", time: "9:00 AM" },
];

export default function ProofSubmissionSheet({ job, onSubmit }) {
	return (
		<View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
			{job && (
				<View style={styles.header}>
					<Text style={styles.jobTitle}>{job.title}</Text>
					<Text style={styles.jobClient}>for {job.clientName}</Text>
				</View>
			)}
			<View style={styles.card}>
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
			<TouchableOpacity
				style={styles.button}
				onPress={onSubmit}
			>
				<Text style={styles.buttonText}>SUBMIT PROOF</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		alignItems: "center",
		marginBottom: 16,
	},
	jobTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#6366F1",
	},
	jobClient: {
		fontSize: 15,
		color: "#6B7280",
		marginTop: 2,
	},
	card: {
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 12,
		marginBottom: 16,
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
		marginBottom: 24,
		lineHeight: 30,
	},
	proofRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	proofText: {
		flex: 1,
		fontSize: 16,
		color: "#111827",
		marginLeft: 8,
	},
	proofTime: {
		fontSize: 14,
		color: "#6B7280",
		marginLeft: 8,
	},
	button: {
		backgroundColor: "#6366F1",
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: "center",
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});

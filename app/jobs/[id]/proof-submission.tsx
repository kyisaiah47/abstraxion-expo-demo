import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	TextInput,
} from "react-native";

export default function ProofSubmissionSheet({ job, onSubmit }) {
	const [proof, setProof] = useState("");

	const truncateAddress = (address) => {
		if (!address) return "";
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const handleSubmit = () => {
		if (!proof.trim()) return;
		onSubmit(proof);
	};

	return (
		<View style={styles.sheetWrapper}>
			<Text style={styles.clientAddr}>{truncateAddress(job?.client)}</Text>
			<Text style={styles.headline}>{job?.description}</Text>

			<Text style={styles.inputLabel}>Proof link or description</Text>
			<TextInput
				style={styles.input}
				placeholder="Paste your work link or describe what you did"
				value={proof}
				onChangeText={setProof}
				autoCapitalize="none"
				autoCorrect={false}
			/>
			<TouchableOpacity
				style={[styles.button, { opacity: proof.trim() ? 1 : 0.5 }]}
				onPress={handleSubmit}
				disabled={!proof.trim()}
			>
				<Text style={styles.buttonText}>Submit Proof</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	sheetWrapper: {
		paddingHorizontal: 28,
		paddingTop: 22,
		paddingBottom: 20,
		backgroundColor: "#fff",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	headline: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#111",
		marginBottom: 3,
	},
	clientAddr: {
		fontSize: 13,
		fontWeight: "500",
		marginBottom: 6,
		alignSelf: "flex-start",
		backgroundColor: "#e5e5e5",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 100,
		flexDirection: "row",
		alignItems: "center",
	},
	jobTitle: {
		fontSize: 17,
		fontWeight: "700",
		color: "#222",
		marginBottom: 15,
	},
	inputLabel: {
		fontSize: 15,
		fontWeight: "600",
		color: "#222",
		marginBottom: 8,
		marginTop: 30,
	},
	input: {
		borderWidth: 1,
		borderColor: "#E5E5E5",
		borderRadius: 12,
		padding: 12,
		fontSize: 16,
		backgroundColor: "#FAFAFA",
		marginBottom: 18,
	},
	button: {
		backgroundColor: "#191919",
		paddingVertical: 17,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
		letterSpacing: 0.1,
	},
});

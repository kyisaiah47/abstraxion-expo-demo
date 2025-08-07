import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
} from "react-native";

export default function JobCreateSheet({ onCreate, creating }) {
	const [description, setDescription] = useState("");
	// Add more fields if needed: payout, requirements, etc.

	const handleCreate = () => {
		if (!description.trim()) return;
		onCreate({ description: description.trim() });
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			style={styles.sheetWrapper}
		>
			<Text style={styles.title}>Create a New Contract</Text>
			<TextInput
				style={styles.input}
				placeholder="Describe the work, e.g. 'Build landing page for Acme Inc.'"
				value={description}
				onChangeText={setDescription}
				autoFocus
			/>
			{/* Add more fields here */}
			<TouchableOpacity
				style={[styles.button, { opacity: description.trim() ? 1 : 0.5 }]}
				disabled={!description.trim() || creating}
				onPress={handleCreate}
			>
				<Text style={styles.buttonText}>
					{creating ? "Posting..." : "Create Contract"}
				</Text>
			</TouchableOpacity>
		</KeyboardAvoidingView>
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
	title: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#111",
		marginBottom: 18,
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
		marginBottom: 16,
	},
	buttonText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
		letterSpacing: 0.1,
	},
});

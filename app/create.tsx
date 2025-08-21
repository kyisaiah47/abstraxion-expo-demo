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

interface JobCreateSheetProps {
	onCreate: (job: { description: string; amount: string }) => void;
	creating: boolean;
}

export default function JobCreateSheet({
	onCreate,
	creating,
}: JobCreateSheetProps) {
	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("1");

	const handleCreate = () => {
		if (!description.trim() || !amount.trim()) return;

		// Validate amount is a positive number
		const amountNum = parseFloat(amount);
		if (isNaN(amountNum) || amountNum <= 0) {
			alert("Please enter a valid payment amount");
			return;
		}

		onCreate({
			description: description.trim(),
			amount: amount.trim(),
		});

		// Reset form
		setDescription("");
		setAmount("1");
	};

	const isValid = description.trim() && amount.trim() && parseFloat(amount) > 0;

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			style={styles.sheetWrapper}
		>
			<Text style={styles.title}>Create a New Job Contract</Text>

			<Text style={styles.label}>Job Description</Text>
			<TextInput
				style={styles.input}
				placeholder="Describe the work, e.g. 'Build landing page for Acme Inc.'"
				value={description}
				onChangeText={setDescription}
				multiline
				numberOfLines={3}
				autoFocus
			/>

			<Text style={styles.label}>Payment Amount (XION)</Text>
			<TextInput
				style={styles.input}
				placeholder="1.0"
				value={amount}
				onChangeText={setAmount}
				keyboardType="decimal-pad"
			/>
			<Text style={styles.hint}>
				Payment will be held in escrow and released upon proof acceptance
			</Text>

			<TouchableOpacity
				style={[styles.button, { opacity: isValid && !creating ? 1 : 0.5 }]}
				disabled={!isValid || creating}
				onPress={handleCreate}
			>
				<Text style={styles.buttonText}>
					{creating
						? "Posting to Blockchain..."
						: `Create Job (${amount} XION)`}
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
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 8,
		marginTop: 8,
	},
	input: {
		borderWidth: 1,
		borderColor: "#E5E5E5",
		borderRadius: 12,
		padding: 12,
		fontSize: 16,
		backgroundColor: "#FAFAFA",
		marginBottom: 12,
	},
	hint: {
		fontSize: 14,
		color: "#666",
		marginBottom: 20,
		textAlign: "center",
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

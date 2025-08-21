import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	TextInput,
} from "react-native";
import { type Job, ContractService } from "../../../lib/contractService";

interface ProofSubmissionSheetProps {
	job: Job | null;
	onSubmit: (proof: string) => void;
}

export default function ProofSubmissionSheet({
	job,
	onSubmit,
}: ProofSubmissionSheetProps) {
	const [proof, setProof] = useState("");

	const truncateAddress = (address: string | undefined) => {
		if (!address) return "";
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const handleSubmit = () => {
		if (!proof.trim()) return;
		onSubmit(proof.trim());
		setProof(""); // Reset form after submission
	};

	if (!job) {
		return (
			<View style={styles.sheetWrapper}>
				<Text style={styles.headline}>No Job Selected</Text>
				<Text style={{ color: "#666", marginTop: 10 }}>
					Please select a job to submit proof for.
				</Text>
			</View>
		);
	}

	const paymentAmount = ContractService.formatXionAmount(
		parseInt(job.escrow_amount.amount)
	);

	return (
		<View style={styles.sheetWrapper}>
			<Text style={styles.clientAddr}>{truncateAddress(job.client)}</Text>
			<Text style={styles.headline}>{job.description}</Text>

			<View style={styles.jobDetails}>
				<Text style={styles.detailText}>Payment: {paymentAmount}</Text>
				<Text style={styles.detailText}>Status: {job.status}</Text>
				{job.deadline && (
					<Text style={styles.detailText}>Deadline: {job.deadline}</Text>
				)}
			</View>

			<Text style={styles.inputLabel}>Proof of Work Completion</Text>
			<TextInput
				style={styles.input}
				placeholder="Provide a link to your completed work, detailed description, or evidence of completion..."
				value={proof}
				onChangeText={setProof}
				autoCapitalize="none"
				autoCorrect={false}
				multiline
				numberOfLines={4}
				textAlignVertical="top"
			/>

			<Text style={styles.hint}>
				This proof will be submitted to the blockchain and reviewed by the
				client
			</Text>

			<TouchableOpacity
				style={[styles.button, { opacity: proof.trim() ? 1 : 0.5 }]}
				onPress={handleSubmit}
				disabled={!proof.trim()}
			>
				<Text style={styles.buttonText}>Submit Proof to Blockchain</Text>
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
		marginBottom: 12,
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
	},
	jobDetails: {
		backgroundColor: "#f8f9fa",
		padding: 12,
		borderRadius: 8,
		marginBottom: 20,
	},
	detailText: {
		fontSize: 14,
		color: "#666",
		marginBottom: 4,
	},
	inputLabel: {
		fontSize: 15,
		fontWeight: "600",
		color: "#222",
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderColor: "#E5E5E5",
		borderRadius: 12,
		padding: 12,
		fontSize: 16,
		backgroundColor: "#FAFAFA",
		marginBottom: 12,
		minHeight: 100,
	},
	hint: {
		fontSize: 12,
		color: "#666",
		textAlign: "center",
		marginBottom: 20,
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

import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	ScrollView,
} from "react-native";
import { type Job, ContractService } from "../../../../lib/contractService";
import ZKTLSVerification from "../../../../components/ZKTLSVerification";
// ...existing code...

interface ProofSubmissionSheetProps {
	job: Job | null;
	onSubmit: (proof: string) => void;
	userAddress?: string;
	contractClient?: any;
}

export default function ProofSubmissionSheet({
	job,
	onSubmit,
	userAddress,
	contractClient,
}: ProofSubmissionSheetProps) {
	const [proof, setProof] = useState("");
	const [verificationMethod, setVerificationMethod] = useState<
		"manual" | "zktls"
	>("manual");

	const truncateAddress = (address: string | undefined) => {
		if (!address) return "";
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const handleSubmit = () => {
		if (!proof.trim()) return;
		onSubmit(proof.trim());
		setProof(""); // Reset form after submission
	};

	const handleZKTLSComplete = (success: boolean, transactionHash?: string) => {
		if (success) {
			// zkTLS verification completed, simulate proof submission
			const zkTLSProof = `zkTLS website delivery verification completed${
				transactionHash ? ` (tx: ${transactionHash})` : ""
			}`;
			onSubmit(zkTLSProof);
		}
	};

	if (!job) {
		return (
			<ScrollView style={styles.sheetWrapper}>
				<Text style={styles.headline}>No Job Selected</Text>
				<Text style={{ color: "#666", marginTop: 10 }}>
					Please select a job to submit proof for.
				</Text>
			</ScrollView>
		);
	}

	const paymentAmount = ContractService.formatXionAmount(
		parseInt(job.escrow_amount.amount)
	);

	return (
		<ScrollView
			style={styles.sheetWrapper}
			showsVerticalScrollIndicator={false}
		>
			<Text style={styles.clientAddr}>{truncateAddress(job.client)}</Text>
			<Text style={styles.headline}>{job.description}</Text>

			<View style={styles.jobDetails}>
				<Text style={styles.detailText}>Payment: {paymentAmount}</Text>
				<Text style={styles.detailText}>Status: {job.status}</Text>
				{job.deadline && (
					<Text style={styles.detailText}>Deadline: {job.deadline}</Text>
				)}
			</View>

			{/* Verification Method Selection */}
			<Text style={styles.methodTitle}>Choose Verification Method:</Text>
			<View style={styles.methodSelector}>
				<TouchableOpacity
					style={[
						styles.methodButton,
						verificationMethod === "manual" && styles.methodButtonActive,
					]}
					onPress={() => setVerificationMethod("manual")}
				>
					<Text
						style={[
							styles.methodButtonText,
							verificationMethod === "manual" && styles.methodButtonTextActive,
						]}
					>
						📝 Manual Proof
					</Text>
					<Text style={styles.methodDescription}>
						Submit text description or links
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.methodButton,
						verificationMethod === "zktls" && styles.methodButtonActive,
					]}
					onPress={() => setVerificationMethod("zktls")}
				>
					<Text
						style={[
							styles.methodButtonText,
							verificationMethod === "zktls" && styles.methodButtonTextActive,
						]}
					>
						🔐 zkTLS Verification
					</Text>
					<Text style={styles.methodDescription}>
						Automated website delivery proof
					</Text>
				</TouchableOpacity>
			</View>

			{verificationMethod === "manual" ? (
				<>
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
				</>
			) : (
				<>
					{userAddress && contractClient ? (
						<ZKTLSVerification
							job={job}
							userAddress={userAddress}
							contractClient={contractClient}
							onVerificationComplete={handleZKTLSComplete}
						/>
					) : (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>
								⚠️ zkTLS verification requires wallet connection and contract
								access.
							</Text>
							<Text style={styles.errorHint}>
								Please ensure you're connected to your wallet and try again.
							</Text>
						</View>
					)}
				</>
			)}
		</ScrollView>
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
	methodTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#222",
		marginBottom: 12,
	},
	methodSelector: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 20,
	},
	methodButton: {
		flex: 1,
		padding: 16,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "#E5E5E5",
		backgroundColor: "#FAFAFA",
		alignItems: "center",
	},
	methodButtonActive: {
		borderColor: "#6366F1",
		backgroundColor: "#EEF2FF",
	},
	methodButtonText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#666",
		marginBottom: 4,
	},
	methodButtonTextActive: {
		color: "#6366F1",
	},
	methodDescription: {
		fontSize: 12,
		color: "#999",
		textAlign: "center",
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
	errorContainer: {
		backgroundColor: "#FEF2F2",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#FECACA",
		marginTop: 16,
	},
	errorText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#DC2626",
		marginBottom: 4,
	},
	errorHint: {
		fontSize: 12,
		color: "#991B1B",
	},
});

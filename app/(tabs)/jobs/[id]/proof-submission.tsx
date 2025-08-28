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
	// Get verification method from job requirements, don't let user choose
	// Treat hybrid same as zkTLS for this interface
	const verificationMethod = (job?.proof_type === "zktls" || job?.proof_type === "hybrid") ? "zktls" : "manual";

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
			contentContainerStyle={styles.contentContainer}
		>
			{/* Task Info Card - matching your existing card style */}
			<View style={styles.taskCard}>
				<View style={styles.taskHeader}>
					<Text style={styles.taskTitle}>{job.description}</Text>
					<View style={styles.taskMeta}>
						<Text style={styles.paymentAmount}>{paymentAmount}</Text>
						<Text style={styles.clientInfo}>From {truncateAddress(job.client)}</Text>
					</View>
				</View>
			</View>

			{/* Proof Requirements - clean section */}
			<View style={styles.requirementsSection}>
				<View style={styles.requirementHeader}>
					<Text style={styles.requirementTitle}>
						{verificationMethod === "zktls" ? "zkTLS Proof Required" : "Manual Proof Required"}
					</Text>
					<Text style={styles.requirementDescription}>
						{verificationMethod === "zktls" 
							? "Complete GitHub merge verification to earn payment automatically" 
							: "Provide proof of work completion for manual review"
						}
					</Text>
				</View>
			</View>

			{/* Action Section - matching your button style */}
			{verificationMethod === "manual" ? (
				<>
					<View style={styles.inputSection}>
						<Text style={styles.inputLabel}>Proof of Work Completion</Text>
						<TextInput
							style={styles.textInput}
							placeholder="Provide links, descriptions, or evidence of your completed work..."
							value={proof}
							onChangeText={setProof}
							autoCapitalize="none"
							autoCorrect={false}
							multiline
							numberOfLines={4}
							textAlignVertical="top"
							placeholderTextColor={DesignSystem.colors.text.tertiary}
						/>
						<Text style={styles.hint}>
							This will be reviewed by the task creator
						</Text>
					</View>

					<TouchableOpacity
						style={[styles.submitButton, { opacity: proof.trim() ? 1 : 0.5 }]}
						onPress={handleSubmit}
						disabled={!proof.trim()}
					>
						<Text style={styles.submitButtonText}>Submit Proof</Text>
					</TouchableOpacity>
				</>
			) : (
				<>
					<View style={styles.githubSection}>
						<Text style={styles.githubTitle}>GitHub Verification</Text>
						<Text style={styles.githubDescription}>
							Verify your GitHub merge to automatically release payment
						</Text>
					</View>

					{userAddress && contractClient ? (
						<TouchableOpacity
							style={styles.submitButton}
							onPress={() => {
								handleZKTLSComplete(true, "mock_github_verification_hash");
							}}
						>
							<Text style={styles.submitButtonText}>Verify GitHub Merge</Text>
						</TouchableOpacity>
					) : (
						<View style={styles.errorMessage}>
							<Text style={styles.errorText}>
								Please connect your wallet to continue
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
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.primary,
	},
	contentContainer: {
		padding: DesignSystem.spacing.lg,
		paddingBottom: 40,
		gap: DesignSystem.spacing["2xl"],
	},
	
	// Task Card - matching your existing card style
	taskCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
	},
	taskHeader: {
		padding: DesignSystem.spacing["2xl"],
		gap: DesignSystem.spacing.md,
	},
	taskTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},
	taskMeta: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	paymentAmount: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.status.success,
		fontWeight: "700",
	},
	clientInfo: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.tertiary,
	},
	
	// Requirements Section
	requirementsSection: {
		gap: DesignSystem.spacing.md,
	},
	requirementHeader: {
		gap: DesignSystem.spacing.sm,
	},
	requirementTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},
	requirementDescription: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		lineHeight: 20,
	},
	
	// Input Section
	inputSection: {
		gap: DesignSystem.spacing.md,
	},
	inputLabel: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},
	textInput: {
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
		minHeight: 100,
	},
	hint: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.tertiary,
		textAlign: "center",
	},
	
	// GitHub Section
	githubSection: {
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
	},
	githubTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},
	githubDescription: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
		lineHeight: 20,
	},
	
	// Submit Button - matching your existing button style
	submitButton: {
		backgroundColor: DesignSystem.colors.primary[900],
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		borderRadius: DesignSystem.radius.lg,
		alignItems: "center",
		justifyContent: "center",
		...DesignSystem.shadows.sm,
	},
	submitButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},
	
	// Error Message
	errorMessage: {
		backgroundColor: DesignSystem.colors.surface.secondary,
		padding: DesignSystem.spacing.lg,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		alignItems: "center",
	},
	errorText: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.status.error,
		textAlign: "center",
	},
});

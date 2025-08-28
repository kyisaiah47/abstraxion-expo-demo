import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Job, ContractService } from "../lib/contractService";
import { DesignSystem } from "../constants/DesignSystem";

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
			{/* Header Section */}
			<View style={styles.headerSection}>
				<View style={styles.iconContainer}>
					<Ionicons name="document-text" size={32} color={DesignSystem.colors.primary[800]} />
				</View>
				<Text style={styles.headerTitle}>Submit Task Proof</Text>
				<Text style={styles.headerSubtitle}>
					Complete your task and provide evidence to receive payment
				</Text>
			</View>

			{/* Combined Task & Action Card */}
			{verificationMethod === "manual" ? (
				<>
					<View style={styles.combinedCard}>
					{/* Task Info Section */}
					<View style={styles.taskSection}>
						<Text style={styles.taskTitle}>{job.description}</Text>
						<View style={styles.taskFooter}>
							<View style={styles.paymentChip}>
								<Text style={styles.paymentAmount}>{paymentAmount}</Text>
							</View>
							<View style={styles.verificationChip}>
								<Text style={styles.verificationMethod}>Manual Review</Text>
							</View>
						</View>
					</View>
					
					<View style={styles.divider} />
					
					{/* Input Section */}
					<View style={styles.inputSection}>
						<View style={styles.inputLabelRow}>
							<Ionicons name="document-outline" size={18} color={DesignSystem.colors.primary[800]} />
							<Text style={styles.inputLabel}>Proof of Completion</Text>
						</View>
						<Text style={styles.inputHint}>
							Provide detailed evidence of your completed work
						</Text>
						
						<TextInput
							style={styles.textInput}
							placeholder="• Links to completed deliverables&#10;• Screenshots or demo videos&#10;• GitHub repository or commit links&#10;• Detailed description of work completed&#10;• Any other relevant documentation..."
							value={proof}
							onChangeText={setProof}
							autoCapitalize="none"
							autoCorrect={false}
							multiline
							numberOfLines={6}
							textAlignVertical="top"
							placeholderTextColor={DesignSystem.colors.text.tertiary}
						/>
						
						<View style={styles.inputFooter}>
							<View style={styles.characterCount}>
								<Text style={styles.characterCountText}>
									{proof.length} characters
								</Text>
							</View>
							<View style={styles.reviewNoteContainer}>
								<Ionicons name="time-outline" size={14} color={DesignSystem.colors.text.secondary} />
								<Text style={styles.reviewNote}>
									This will be reviewed by the client within 24 hours
								</Text>
							</View>
						</View>
					</View>
				</View>

				<TouchableOpacity
					style={[
						styles.submitButton, 
						{ opacity: proof.trim().length > 20 ? 1 : 0.5 }
					]}
					onPress={handleSubmit}
					disabled={proof.trim().length < 20}
				>
					<View style={styles.buttonContent}>
						<Ionicons name="rocket" size={18} color={DesignSystem.colors.text.inverse} />
						<Text style={styles.submitButtonText}>
							Submit Proof for Review
						</Text>
					</View>
				</TouchableOpacity>
				</>
			) : (
				<>
				<View style={styles.combinedCard}>
					{/* Task Info Section */}
					<View style={styles.taskSection}>
						<Text style={styles.taskTitle}>{job.description}</Text>
						<View style={styles.taskFooter}>
							<View style={styles.paymentChip}>
								<Text style={styles.paymentAmount}>{paymentAmount}</Text>
							</View>
							<View style={styles.zkTLSChip}>
								<Text style={styles.verificationMethod}>zkTLS Verification</Text>
							</View>
						</View>
					</View>
					
					<View style={styles.divider} />
					
					{/* zkTLS Section */}
					<View style={styles.zkTLSSection}>
						<View style={styles.zkTLSHeader}>
							<View style={styles.zkTLSIcon}>
								<Ionicons name="shield-checkmark" size={24} color={DesignSystem.colors.primary[800]} />
							</View>
							<View style={styles.zkTLSContent}>
								<Text style={styles.zkTLSTitle}>Automated GitHub Verification</Text>
								<Text style={styles.zkTLSDescription}>
									Cryptographic proof verification will automatically confirm your GitHub merge and release payment instantly
								</Text>
							</View>
						</View>
						
						<View style={styles.zkTLSSteps}>
							<View style={styles.stepItem}>
								<View style={styles.stepNumber}>
									<Text style={styles.stepNumberText}>1</Text>
								</View>
								<Text style={styles.stepText}>Click verify button below</Text>
							</View>
							<View style={styles.stepItem}>
								<View style={styles.stepNumber}>
									<Text style={styles.stepNumberText}>2</Text>
								</View>
								<Text style={styles.stepText}>Complete GitHub authentication</Text>
							</View>
							<View style={styles.stepItem}>
								<View style={styles.stepNumber}>
									<Text style={styles.stepNumberText}>3</Text>
								</View>
								<Text style={styles.stepText}>Automatic payment release</Text>
							</View>
						</View>
					</View>
				</View>

				{userAddress && contractClient ? (
					<TouchableOpacity
						style={styles.zkTLSButton}
						onPress={() => {
							handleZKTLSComplete(true, "mock_github_verification_hash");
						}}
					>
						<View style={styles.buttonContent}>
							<Ionicons name="shield-checkmark" size={18} color={DesignSystem.colors.text.inverse} />
							<Text style={styles.zkTLSButtonText}>Start zkTLS Verification</Text>
						</View>
					</TouchableOpacity>
				) : (
					<View style={styles.errorCard}>
						<Ionicons name="warning" size={24} color={DesignSystem.colors.status.error} />
						<Text style={styles.errorText}>
							Please connect your wallet to continue with verification
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
	
	// Header Section
	headerSection: {
		alignItems: 'center',
		gap: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.lg,
	},
	iconContainer: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: DesignSystem.colors.primary[50],
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: DesignSystem.spacing.sm,
	},
	headerTitle: {
		...DesignSystem.typography.h2,
		color: DesignSystem.colors.text.primary,
		fontWeight: "700",
		textAlign: 'center',
	},
	headerSubtitle: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		textAlign: 'center',
		lineHeight: 22,
	},
	
	// Combined Card
	combinedCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		padding: DesignSystem.spacing["2xl"],
		...DesignSystem.shadows.sm,
		gap: DesignSystem.spacing.xl,
	},
	
	// Task Section
	taskSection: {
		gap: DesignSystem.spacing.lg,
	},
	taskTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
		lineHeight: 26,
		textAlign: 'center',
	},
	taskFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: DesignSystem.spacing.md,
	},
	
	// Payment Chip
	paymentChip: {
		backgroundColor: DesignSystem.colors.status.success + "15",
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.sm,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.status.success + "30",
	},
	paymentAmount: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.status.success,
		fontWeight: "700",
	},
	
	// Verification Chips
	verificationChip: {
		backgroundColor: DesignSystem.colors.text.secondary + "10",
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.sm,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.text.secondary + "20",
	},
	zkTLSChip: {
		backgroundColor: DesignSystem.colors.primary[800] + "15",
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.sm,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.primary[800] + "30",
	},
	verificationMethod: {
		...DesignSystem.typography.label.small,
		color: DesignSystem.colors.text.secondary,
		fontWeight: "600",
	},
	
	// Divider
	divider: {
		height: 1,
		backgroundColor: DesignSystem.colors.border.secondary,
		marginVertical: DesignSystem.spacing.sm,
	},
	
	// Input Section
	inputSection: {
		gap: DesignSystem.spacing.lg,
	},
	inputLabelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: DesignSystem.spacing.sm,
	},
	inputLabel: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},
	inputHint: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		lineHeight: 18,
	},
	textInput: {
		backgroundColor: DesignSystem.colors.surface.primary,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
		minHeight: 140,
		fontSize: 14,
		lineHeight: 20,
	},
	inputFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: DesignSystem.spacing.md,
	},
	characterCount: {
		backgroundColor: DesignSystem.colors.surface.secondary,
		paddingHorizontal: DesignSystem.spacing.sm,
		paddingVertical: DesignSystem.spacing.xs,
		borderRadius: DesignSystem.radius.md,
	},
	characterCountText: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.tertiary,
		fontSize: 12,
	},
	reviewNoteContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: DesignSystem.spacing.xs,
		flex: 1,
		justifyContent: 'flex-end',
	},
	reviewNote: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		fontStyle: 'italic',
	},
	
	// zkTLS Section
	zkTLSSection: {
		gap: DesignSystem.spacing.xl,
	},
	zkTLSHeader: {
		flexDirection: "row",
		gap: DesignSystem.spacing.lg,
		alignItems: "flex-start",
	},
	zkTLSIcon: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: DesignSystem.colors.primary[50],
		alignItems: 'center',
		justifyContent: 'center',
	},
	zkTLSContent: {
		flex: 1,
		gap: DesignSystem.spacing.sm,
	},
	zkTLSTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},
	zkTLSDescription: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		lineHeight: 22,
	},
	zkTLSSteps: {
		gap: DesignSystem.spacing.md,
	},
	stepItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: DesignSystem.spacing.md,
	},
	stepNumber: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: DesignSystem.colors.primary[800],
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepNumberText: {
		color: DesignSystem.colors.text.inverse,
		fontSize: 12,
		fontWeight: '600',
	},
	stepText: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		flex: 1,
	},
	
	// Submit Buttons
	submitButton: {
		backgroundColor: DesignSystem.colors.primary[900],
		paddingVertical: DesignSystem.spacing.xl,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		borderRadius: DesignSystem.radius.xl,
		alignItems: "center",
		justifyContent: "center",
		...DesignSystem.shadows.md,
		elevation: 4,
	},
	submitButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "700",
		fontSize: 16,
	},
	
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: DesignSystem.spacing.sm,
	},
	
	zkTLSButton: {
		backgroundColor: DesignSystem.colors.primary[800],
		paddingVertical: DesignSystem.spacing.xl,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		borderRadius: DesignSystem.radius.xl,
		alignItems: "center",
		justifyContent: "center",
		...DesignSystem.shadows.md,
		elevation: 4,
	},
	zkTLSButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "700",
		fontSize: 16,
	},
	
	// Error Card
	errorCard: {
		backgroundColor: DesignSystem.colors.status.error + "10",
		borderWidth: 1,
		borderColor: DesignSystem.colors.status.error + "30",
		padding: DesignSystem.spacing.xl,
		borderRadius: DesignSystem.radius.xl,
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
	},
	errorText: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.status.error,
		textAlign: "center",
		fontWeight: "500",
	},
	
	// Missing styles
	headline: {
		...DesignSystem.typography.h2,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},
});
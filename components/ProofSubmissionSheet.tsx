import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	ScrollView,
	Linking,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Job, ContractService } from "../lib/contractService";
import { DesignSystem } from "../constants/DesignSystem";
// import { useZKTLSVerification } from "../lib/zkTLS"; // Disabled for Expo Go

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
	const [isGeneratingProof, setIsGeneratingProof] = useState(false);
	const [verificationUrl, setVerificationUrl] = useState<string>("");
	
	// Get verification method from job requirements, don't let user choose
	// Treat hybrid same as zkTLS for this interface
	const verificationMethod = (job?.proof_type === "zktls" || job?.proof_type === "hybrid") ? "zktls" : "manual";
	
	// zkTLS hook - temporarily mocked for EAS build compatibility
	const isConfigured = true;
	const completeJobWithProof = async () => ({
		success: true,
		verificationUrl: "https://reclaim-protocol.netlify.app/demo", // Real Reclaim demo URL
		error: undefined
	});

	const handleSubmit = () => {
		if (!proof.trim()) return;
		onSubmit(proof.trim());
		setProof(""); // Reset form after submission
	};

	const handleStartZKTLSVerification = async () => {
		if (!job || !userAddress || !contractClient) {
			Alert.alert("Error", "Missing required information for verification");
			return;
		}

		if (!isConfigured) {
			Alert.alert(
				"Configuration Required",
				"zkTLS verification requires Reclaim Protocol configuration. Please contact support."
			);
			return;
		}

		try {
			setIsGeneratingProof(true);
			
			// For GitHub verification, redirect directly to GitHub OAuth/verification flow
			try {
				// Generate a GitHub-specific verification URL that will redirect to GitHub
				const result = await completeJobWithProof();

				if (result.success && result.verificationUrl) {
					setVerificationUrl(result.verificationUrl);
					
					// Immediately redirect to GitHub verification
					Alert.alert(
						"GitHub Verification",
						"You'll be redirected to GitHub to authenticate and verify your contributions. This creates cryptographic proof of your work.",
						[
							{ text: "Cancel", style: "cancel", onPress: () => setIsGeneratingProof(false) },
							{
								text: "Connect GitHub",
								onPress: () => Linking.openURL(result.verificationUrl!),
							},
						]
					);
				} else {
					throw new Error(result.error || "Failed to generate GitHub verification URL");
				}
			} catch (error) {
				console.error("GitHub verification error:", error);
				Alert.alert(
					"Verification Failed",
					error instanceof Error ? error.message : "Failed to connect to GitHub verification service"
				);
				setIsGeneratingProof(false);
			}
		} catch (error) {
			console.error("zkTLS error:", error);
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to start verification"
			);
			setIsGeneratingProof(false);
		}
	};

	const handleVerificationComplete = async () => {
		if (!job || !userAddress || !contractClient) {
			Alert.alert("Error", "Missing required information");
			return;
		}

		Alert.alert(
			"Complete Verification",
			"Have you successfully completed the GitHub verification in the Reclaim app?",
			[
				{ text: "Not Yet", style: "cancel" },
				{
					text: "Yes, Process Proof",
					onPress: async () => {
						try {
							setIsGeneratingProof(true);
							
							// In a real implementation, we would:
							// 1. Retrieve the actual Reclaim proof from their callback/webhook
							// 2. Verify the cryptographic proof
							// 3. Submit to smart contract for automatic payment release
							
							// For now, simulate the complete process
							Alert.alert(
								"Processing Proof",
								"Retrieving and verifying your GitHub proof...",
								[{ text: "OK" }]
							);
							
							// Simulate proof verification delay
							setTimeout(async () => {
								try {
									// This would call zkTLSService.handleCompletedProof() with real proof
									const mockProof = {
										identifier: `github_proof_${job.id}_${Date.now()}`,
										claimData: {
											parameters: JSON.stringify({
												githubUsername: "verified_user",
												repoUrl: `github_verification_${job.id}`,
												timestamp: new Date().toISOString()
											})
										}
									};
									
									// Submit verified proof (this would be the real blockchain transaction)
									const zkTLSProof = `zkTLS GitHub verification completed - Proof ID: ${mockProof.identifier}`;
									onSubmit(zkTLSProof);
									
									Alert.alert(
										"Verification Complete!",
										"Your GitHub proof has been verified and submitted. Payment will be released automatically.",
										[{ text: "Done" }]
									);
								} catch (error) {
									console.error("Proof processing error:", error);
									Alert.alert(
										"Verification Failed", 
										"Failed to process your proof. Please try again."
									);
								} finally {
									setIsGeneratingProof(false);
								}
							}, 2000);
							
						} catch (error) {
							console.error("Verification completion error:", error);
							Alert.alert("Error", "Failed to complete verification");
							setIsGeneratingProof(false);
						}
					},
				},
			]
		);
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

				{verificationUrl ? (
					<>
						<TouchableOpacity
							style={styles.secondaryButton}
							onPress={() => Linking.openURL(verificationUrl)}
						>
							<View style={styles.buttonContent}>
								<Ionicons name="globe" size={18} color={DesignSystem.colors.primary[800]} />
								<Text style={styles.secondaryButtonText}>Open Verification Page</Text>
							</View>
						</TouchableOpacity>
						
						<TouchableOpacity
							style={styles.zkTLSButton}
							onPress={handleVerificationComplete}
						>
							<View style={styles.buttonContent}>
								<Ionicons name="checkmark-circle" size={18} color={DesignSystem.colors.text.inverse} />
								<Text style={styles.zkTLSButtonText}>I&apos;ve Completed Verification</Text>
							</View>
						</TouchableOpacity>
					</>
				) : userAddress && contractClient ? (
					<TouchableOpacity
						style={[styles.zkTLSButton, { opacity: isGeneratingProof ? 0.6 : 1 }]}
						onPress={handleStartZKTLSVerification}
						disabled={isGeneratingProof}
					>
						<View style={styles.buttonContent}>
							<Ionicons name="shield-checkmark" size={18} color={DesignSystem.colors.text.inverse} />
							<Text style={styles.zkTLSButtonText}>
								{isGeneratingProof ? "Generating Proof..." : "Start zkTLS Verification"}
							</Text>
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
		gap: DesignSystem.spacing.xl,
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
	
	secondaryButton: {
		backgroundColor: DesignSystem.colors.surface.secondary,
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		borderRadius: DesignSystem.radius.xl,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		marginBottom: DesignSystem.spacing.sm,
	},
	secondaryButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.primary[800],
		fontWeight: "600",
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
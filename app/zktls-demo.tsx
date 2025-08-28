/**
 * Unified zkTLS Proof Experience
 *
 * Single-page proof generation that combines demo explanation
 * with actual verification workflow
 */

import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Pressable,
	Alert,
	SafeAreaView,
	TextInput,
	Linking,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "../constants/DesignSystem";
import { useZKTLSVerification } from "../lib/zkTLS";
import StepCard from "../components/StepCard";
import ProofVerifiedCard from "../components/ProofVerifiedCard";
import InfoCard from "../components/InfoCard";
import SelectableCard from "../components/SelectableCard";
import TrustFooter from "../components/TrustFooter";

// Mock job for demo purposes
const demoJob = {
	id: 999,
	description:
		"Create a landing page for Acme Corp with hero section and contact form",
	client: "xion1demoklj43k5j34k5j43k5j34k5j34k5j34k5j34",
	worker: "xion1worker123456789012345678901234567890123",
	escrow_amount: { denom: "uxion", amount: "1000000" },
	status: "Accepted" as any,
	deadline: "2024-12-25T23:59:59Z",
	created_at: "2024-12-20T10:00:00Z",
};

type FlowStep = "overview" | "setup" | "verification" | "complete";

export default function ZKTLSDemoScreen() {
	const [currentStep, setCurrentStep] = useState<FlowStep>("overview");
	const [deliveryUrl, setDeliveryUrl] = useState("");
	const [selectedTemplate, setSelectedTemplate] = useState("");
	const [expectedContent, setExpectedContent] = useState("");
	const [verificationUrl, setVerificationUrl] = useState("");
	const [isGeneratingProof, setIsGeneratingProof] = useState(false);
	const [demoResults, setDemoResults] = useState<any>(null);

	const { zkTLSService, isConfigured, templates } = useZKTLSVerification();
	const router = useRouter();

	const templateOptions = [
		{
			key: "landing_page",
			label: "Landing Page",
			description: "Business or product landing page",
			icon: "rocket" as const,
		},
		{
			key: "blog_post",
			label: "Blog Post",
			description: "Article or blog content",
			icon: "document-text" as const,
		},
		{
			key: "portfolio",
			label: "Portfolio Site",
			description: "Personal or professional portfolio",
			icon: "person" as const,
		},
		{
			key: "ecommerce",
			label: "E-commerce Site",
			description: "Online store or marketplace",
			icon: "storefront" as const,
		},
		{
			key: "documentation",
			label: "Documentation",
			description: "Technical documentation site",
			icon: "library" as const,
		},
		{
			key: "custom",
			label: "Custom Website",
			description: "Custom website implementation",
			icon: "code-slash" as const,
		},
	];

	const handleTemplateSelect = (templateKey: string) => {
		setSelectedTemplate(templateKey);
		if (templateKey !== "custom") {
			const template = templates(templateKey as any);
			if (template.params?.expectedContent) {
				setExpectedContent(template.params.expectedContent);
			}
		} else {
			setExpectedContent("");
		}
	};

	const generateProof = async () => {
		if (!deliveryUrl.trim()) {
			Alert.alert("Error", "Please enter the website URL for verification");
			return;
		}

		if (!isConfigured) {
			Alert.alert(
				"Configuration Required",
				"To run the zkTLS demo, you need to configure Reclaim Protocol credentials in your .env.local file.",
				[
					{ text: "OK", style: "default" },
					{
						text: "Show Instructions",
						onPress: () =>
							Alert.alert(
								"Setup Instructions",
								"1. Get credentials from https://dev.reclaimprotocol.org/\n2. Add to .env.local:\nEXPO_PUBLIC_RECLAIM_APP_ID=your_app_id\nEXPO_PUBLIC_RECLAIM_APP_SECRET=your_secret"
							),
					},
				]
			);
			return;
		}

		try {
			setIsGeneratingProof(true);

			const result = await zkTLSService.generateWebsiteDeliveryProof(
				deliveryUrl.trim(),
				expectedContent.trim() || undefined
			);

			if (result.success && result.verificationUrl) {
				setVerificationUrl(result.verificationUrl);
				setCurrentStep("verification");

				Alert.alert(
					"Verification Required",
					"A verification URL has been generated. Complete the verification process to prove your website delivery.",
					[
						{ text: "Cancel", style: "cancel" },
						{
							text: "Open Verification",
							onPress: () => Linking.openURL(result.verificationUrl!),
						},
					]
				);
			} else {
				throw new Error(result.error || "Failed to generate proof");
			}
		} catch (error) {
			Alert.alert(
				"Proof Generation Failed",
				error instanceof Error ? error.message : "Unknown error occurred"
			);
		} finally {
			setIsGeneratingProof(false);
		}
	};

	const openVerificationUrl = () => {
		if (verificationUrl) {
			Linking.openURL(verificationUrl);
		}
	};

	const handleVerificationComplete = () => {
		Alert.alert(
			"Verification Status",
			"Have you completed the website verification process in your browser?",
			[
				{ text: "Not Yet", style: "cancel" },
				{
					text: "Yes, Complete",
					onPress: () => {
						setDemoResults({ success: true });
						setCurrentStep("complete");
					},
				},
			]
		);
	};

	const resetFlow = () => {
		setCurrentStep("overview");
		setDeliveryUrl("");
		setSelectedTemplate("");
		setExpectedContent("");
		setVerificationUrl("");
		setDemoResults(null);
	};

	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen
				options={{
					headerShown: true,
					title: "Generate Proof",
					headerStyle: {
						backgroundColor: DesignSystem.colors.surface.primary,
					},
					headerTitleStyle: {
						...DesignSystem.typography.h3,
						color: DesignSystem.colors.text.primary,
					},
					headerLeft: () => (
						<Pressable
							onPress={() => router.back()}
							style={styles.headerButton}
						>
							<Ionicons
								name="chevron-back"
								size={24}
								color={DesignSystem.colors.primary[700]}
							/>
						</Pressable>
					),
				}}
			/>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.content}>
					{/* Progress indicator */}
					<View style={styles.progressContainer}>
						<View style={styles.progressBar}>
							<View
								style={[
									styles.progressFill,
									{
										width:
											currentStep === "overview"
												? "25%"
												: currentStep === "setup"
												? "50%"
												: currentStep === "verification"
												? "75%"
												: "100%",
									},
								]}
							/>
						</View>
						<Text style={styles.progressText}>
							{currentStep === "overview" && "Learn about proofs"}
							{currentStep === "setup" && "Configure verification"}
							{currentStep === "verification" && "Complete verification"}
							{currentStep === "complete" && "Proof generated"}
						</Text>
					</View>

					{currentStep === "overview" && (
						<>
							<View style={styles.header}>
								<View style={styles.heroIcon}>
									<Ionicons
										name="shield-checkmark"
										size={48}
										color={DesignSystem.colors.primary[700]}
									/>
								</View>
								<Text style={styles.title}>Automated Proof Verification</Text>
								<Text style={styles.subtitle}>
									Generate cryptographic proof of website delivery instantly
								</Text>
							</View>

							<InfoCard
								icon="information-circle"
								title="Configuration Status"
								body={
									isConfigured
										? "Reclaim Protocol is configured and ready"
										: "Setup required to run verification demo"
								}
							/>

							<View style={styles.stepsContainer}>
								<Text style={styles.sectionTitle}>How it works</Text>

								<StepCard
									stepNumber={1}
									title="Complete Website"
									description="Finish building and deploy your website to a public URL"
									icon="code-slash"
									isActive={false}
								/>

								<StepCard
									stepNumber={2}
									title="Generate Proof"
									description="Our system visits your URL and generates tamper-proof verification"
									icon="shield-checkmark"
									isActive={false}
								/>

								<StepCard
									stepNumber={3}
									title="Release Payment"
									description="Payment is released instantly once proof is verified"
									icon="card"
									isActive={false}
								/>
							</View>

							<Pressable
								style={[
									styles.primaryButton,
									{ opacity: isConfigured ? 1 : 0.6 },
								]}
								onPress={() => setCurrentStep("setup")}
							>
								<Text style={styles.primaryButtonText}>Start Verification</Text>
							</Pressable>
						</>
					)}

					{currentStep === "setup" && (
						<>
							<View style={styles.setupHeader}>
								<Text style={styles.setupTitle}>Website Configuration</Text>
								<Text style={styles.setupDescription}>
									Provide details about your delivered website for verification
								</Text>
							</View>

							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Select Website Type</Text>
								<View style={styles.templateGrid}>
									{templateOptions.map((option) => (
										<SelectableCard
											key={option.key}
											title={option.label}
											description={option.description}
											icon={option.icon}
											isSelected={selectedTemplate === option.key}
											onPress={() => handleTemplateSelect(option.key)}
										/>
									))}
								</View>
							</View>

							<View style={styles.section}>
								<Text style={styles.inputLabel}>Website URL</Text>
								<TextInput
									style={styles.textInput}
									placeholder="https://your-delivered-website.com"
									value={deliveryUrl}
									onChangeText={setDeliveryUrl}
									autoCapitalize="none"
									autoCorrect={false}
									keyboardType="url"
									placeholderTextColor={DesignSystem.colors.text.tertiary}
								/>
							</View>

							<View style={styles.section}>
								<Text style={styles.inputLabel}>
									Expected Content (Optional)
								</Text>
								<TextInput
									style={[styles.textInput, styles.textArea]}
									placeholder="Describe key elements that should be present..."
									value={expectedContent}
									onChangeText={setExpectedContent}
									multiline
									textAlignVertical="top"
									placeholderTextColor={DesignSystem.colors.text.tertiary}
								/>
							</View>

							<View style={styles.buttonGroup}>
								<Pressable
									style={styles.secondaryButton}
									onPress={() => setCurrentStep("overview")}
								>
									<Text style={styles.secondaryButtonText}>Back</Text>
								</Pressable>

								<Pressable
									style={[
										styles.primaryButton,
										{ opacity: isGeneratingProof ? 0.6 : 1, flex: 1 },
									]}
									onPress={generateProof}
									disabled={isGeneratingProof}
								>
									<Text style={styles.primaryButtonText}>
										{isGeneratingProof ? "Generating..." : "Generate Proof"}
									</Text>
								</Pressable>
							</View>
						</>
					)}

					{currentStep === "verification" && (
						<>
							<InfoCard
								icon="checkmark-circle"
								title="Verification URL Generated"
								body="Complete the verification process to prove your website delivery."
							/>

							<Pressable
								style={styles.primaryButton}
								onPress={openVerificationUrl}
							>
								<Ionicons
									name="globe"
									size={20}
									color={DesignSystem.colors.text.inverse}
									style={{ marginRight: DesignSystem.spacing.sm }}
								/>
								<Text style={styles.primaryButtonText}>
									Open Verification Page
								</Text>
							</Pressable>

							<Pressable
								style={styles.secondaryButton}
								onPress={handleVerificationComplete}
							>
								<Ionicons
									name="checkmark"
									size={20}
									color={DesignSystem.colors.primary[700]}
									style={{ marginRight: DesignSystem.spacing.sm }}
								/>
								<Text style={styles.secondaryButtonText}>
									I've Completed Verification
								</Text>
							</Pressable>

							<Text style={styles.note}>
								After completing verification in your browser, return here to
								finalize.
							</Text>
						</>
					)}

					{currentStep === "complete" && (
						<>
							<ProofVerifiedCard
								title="Proof Generated Successfully"
								subtitle="Website delivery verified with cryptographic proof"
								details={[
									{
										icon: "globe",
										text: "Website Status: Live and accessible",
									},
									{
										icon: "shield-checkmark",
										text: "Verification Method: zkTLS Protocol",
									},
									{ icon: "lock-closed", text: "Proof Type: Cryptographic" },
									{
										icon: "card",
										text: "Payment Status: Released automatically",
									},
								]}
							/>

							<Pressable
								style={styles.primaryButton}
								onPress={resetFlow}
							>
								<Text style={styles.primaryButtonText}>
									Try Another Verification
								</Text>
							</Pressable>

							<TrustFooter />
						</>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.primary,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
	content: {
		padding: DesignSystem.spacing.lg,
		gap: DesignSystem.spacing.lg,
	},
	headerButton: {
		padding: DesignSystem.spacing.sm,
		marginLeft: DesignSystem.spacing.sm,
	},
	progressContainer: {
		gap: DesignSystem.spacing.sm,
		marginBottom: DesignSystem.spacing.md,
	},
	progressBar: {
		height: 4,
		backgroundColor: DesignSystem.colors.border.primary,
		borderRadius: 2,
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		backgroundColor: DesignSystem.colors.primary[700],
		borderRadius: 2,
	},
	progressText: {
		...DesignSystem.typography.caption,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
	},
	header: {
		alignItems: "center",
		gap: DesignSystem.spacing.md,
	},
	heroIcon: {
		padding: DesignSystem.spacing.lg,
		backgroundColor: DesignSystem.colors.primary[50],
		borderRadius: DesignSystem.radius.full,
	},
	title: {
		...DesignSystem.typography.h1,
		color: DesignSystem.colors.text.primary,
		textAlign: "center",
	},
	subtitle: {
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
		maxWidth: 280,
	},
	stepsContainer: {
		gap: DesignSystem.spacing.md,
	},
	sectionTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.sm,
	},
	setupHeader: {
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
		marginBottom: DesignSystem.spacing.lg,
	},
	setupTitle: {
		...DesignSystem.typography.h2,
		color: DesignSystem.colors.text.primary,
		textAlign: "center",
	},
	setupDescription: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
	},
	section: {
		gap: DesignSystem.spacing.md,
	},
	templateGrid: {
		gap: DesignSystem.spacing.sm,
	},
	inputLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.xs,
	},
	textInput: {
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderRadius: DesignSystem.radius.md,
		padding: DesignSystem.spacing.md,
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
	},
	textArea: {
		minHeight: 80,
		textAlignVertical: "top",
	},
	buttonGroup: {
		flexDirection: "row",
		gap: DesignSystem.spacing.md,
		alignItems: "center",
	},
	primaryButton: {
		backgroundColor: DesignSystem.colors.primary[900],
		paddingVertical: DesignSystem.spacing.md,
		paddingHorizontal: DesignSystem.spacing.lg,
		borderRadius: DesignSystem.radius.lg,
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
		gap: DesignSystem.spacing.sm,
	},
	primaryButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
	},
	secondaryButton: {
		backgroundColor: "transparent",
		paddingVertical: DesignSystem.spacing.md,
		paddingHorizontal: DesignSystem.spacing.lg,
		borderRadius: DesignSystem.radius.lg,
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
		gap: DesignSystem.spacing.sm,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},
	secondaryButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.secondary,
	},
	note: {
		...DesignSystem.typography.caption,
		color: DesignSystem.colors.text.tertiary,
		textAlign: "center",
		fontStyle: "italic",
	},
});

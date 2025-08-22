/**
 * zkTLS Website Verification Component
 *
 * Allows workers to submit cryptographic proof that they've delivered a website,
 * replacing manual client approval with automated verification
 */

import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	TextInput,
	Pressable,
	Alert,
	Linking,
	StyleSheet,
} from "react-native";
import { useZKTLSVerification } from "../lib/zkTLS";
import type { Job } from "../lib/contractService";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "../constants/DesignSystem";
import SelectableCard from "./SelectableCard";
import InfoCard from "./InfoCard";
import ProofVerifiedCard from "./ProofVerifiedCard";

interface ZKTLSVerificationProps {
	job: Job;
	userAddress: string;
	contractClient: any;
	onVerificationComplete: (success: boolean, transactionHash?: string) => void;
}

export function ZKTLSVerification({
	job,
	userAddress,
	contractClient,
	onVerificationComplete,
}: ZKTLSVerificationProps) {
	const { zkTLSService, isConfigured, templates } = useZKTLSVerification();
	const [deliveryUrl, setDeliveryUrl] = useState("");
	const [expectedContent, setExpectedContent] = useState("");
	const [selectedTemplate, setSelectedTemplate] = useState<string>("");
	const [isGeneratingProof, setIsGeneratingProof] = useState(false);
	const [verificationUrl, setVerificationUrl] = useState<string>("");
	const [step, setStep] = useState<"input" | "verification" | "complete">(
		"input"
	);

	const templateOptions = [
		{ key: "landing_page", label: "Landing Page" },
		{ key: "blog_post", label: "Blog Post" },
		{ key: "portfolio", label: "Portfolio Site" },
		{ key: "ecommerce", label: "E-commerce Site" },
		{ key: "documentation", label: "Documentation" },
		{ key: "custom", label: "Custom Website" },
	];

	const getTemplateDescription = (key: string): string => {
		const descriptions: Record<string, string> = {
			landing_page: "Business or product landing page",
			blog_post: "Article or blog content",
			portfolio: "Personal or professional portfolio",
			ecommerce: "Online store or marketplace",
			documentation: "Technical documentation site",
			custom: "Custom website implementation",
		};
		return descriptions[key] || "Website type";
	};

	const getTemplateIcon = (key: string): keyof typeof Ionicons.glyphMap => {
		const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
			landing_page: "rocket",
			blog_post: "document-text",
			portfolio: "person",
			ecommerce: "storefront",
			documentation: "library",
			custom: "code-slash",
		};
		return icons[key] || "globe";
	};

	const handleTemplateSelect = useCallback(
		(templateKey: string) => {
			setSelectedTemplate(templateKey);
			if (templateKey !== "custom") {
				const template = templates(templateKey as any);
				if (template.params?.expectedContent) {
					setExpectedContent(template.params.expectedContent);
				}
			} else {
				setExpectedContent("");
			}
		},
		[templates]
	);

	const generateWebsiteProof = useCallback(async () => {
		if (!deliveryUrl.trim()) {
			Alert.alert("Error", "Please enter the website URL for verification");
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
			console.log("🚀 Starting zkTLS proof generation for job:", job.id);

			const result = await zkTLSService.generateWebsiteDeliveryProof(
				deliveryUrl.trim(),
				expectedContent.trim() || undefined
			);

			if (result.success && result.verificationUrl) {
				setVerificationUrl(result.verificationUrl);
				setStep("verification");

				Alert.alert(
					"Verification Required",
					"A verification URL has been generated. You need to complete the verification process to prove your website delivery.",
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
			console.error("❌ Failed to generate website proof:", error);
			Alert.alert(
				"Proof Generation Failed",
				error instanceof Error ? error.message : "Unknown error occurred"
			);
		} finally {
			setIsGeneratingProof(false);
		}
	}, [deliveryUrl, expectedContent, isConfigured, zkTLSService, job.id]);

	const openVerificationUrl = useCallback(() => {
		if (verificationUrl) {
			Linking.openURL(verificationUrl);
		}
	}, [verificationUrl]);

	const handleVerificationComplete = useCallback(() => {
		Alert.alert(
			"Verification Status",
			"Have you completed the website verification process in your browser?",
			[
				{ text: "Not Yet", style: "cancel" },
				{
					text: "Yes, Complete Job",
					onPress: () => {
						setStep("complete");
						onVerificationComplete(true);
					},
				},
			]
		);
	}, [onVerificationComplete]);

	if (!isConfigured) {
		return (
			<InfoCard
				icon="shield"
				title="zkTLS Configuration Required"
				body="Website verification requires Reclaim Protocol setup. Contact your administrator to configure zkTLS verification for secure proof generation."
			/>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.headerIcon}>
					<Ionicons
						name="shield-checkmark"
						size={24}
						color={DesignSystem.colors.primary[700]}
					/>
				</View>
				<View style={styles.headerText}>
					<Text style={styles.title}>Proof Generation</Text>
					<Text style={styles.subtitle}>
						Generate cryptographic proof of website delivery
					</Text>
				</View>
			</View>

			{step === "input" && (
				<View style={styles.content}>
					<Text style={styles.sectionTitle}>Select Website Type</Text>

					<View style={styles.templateGrid}>
						{templateOptions.map((option) => (
							<SelectableCard
								key={option.key}
								title={option.label}
								description={getTemplateDescription(option.key)}
								icon={getTemplateIcon(option.key)}
								isSelected={selectedTemplate === option.key}
								onPress={() => handleTemplateSelect(option.key)}
							/>
						))}
					</View>

					<View style={styles.inputSection}>
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

					<View style={styles.inputSection}>
						<Text style={styles.inputLabel}>Expected Content (Optional)</Text>
						<TextInput
							style={[styles.textInput, styles.textArea]}
							placeholder="Describe key elements that should be present on the website..."
							value={expectedContent}
							onChangeText={setExpectedContent}
							multiline
							textAlignVertical="top"
							placeholderTextColor={DesignSystem.colors.text.tertiary}
						/>
					</View>

					<Pressable
						style={[
							styles.primaryButton,
							{ opacity: isGeneratingProof ? 0.6 : 1 },
						]}
						onPress={generateWebsiteProof}
						disabled={isGeneratingProof}
					>
						<Text style={styles.primaryButtonText}>
							{isGeneratingProof ? "Generating Proof..." : "Generate Proof"}
						</Text>
					</Pressable>
				</View>
			)}

			{step === "verification" && (
				<View style={styles.content}>
					<InfoCard
						icon="checkmark-circle"
						title="Verification URL Generated"
						body="Complete the secure verification process to generate cryptographic proof of your website delivery."
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
						<Text style={styles.primaryButtonText}>Open Verification Page</Text>
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
							I&apos;ve Completed Verification
						</Text>
					</Pressable>

					<Text style={styles.note}>
						After completing secure verification in your browser, return here to
						finalize proof generation and trigger payment release.
					</Text>
				</View>
			)}

			{step === "complete" && (
				<View style={styles.content}>
					<ProofVerifiedCard
						title="Verification Complete!"
						subtitle="Your website delivery has been cryptographically verified. Payment will be released automatically upon confirmation."
						details={[
							{ icon: "globe", text: "Website accessibility confirmed" },
							{
								icon: "shield-checkmark",
								text: "Cryptographic proof generated",
							},
							{ icon: "card", text: "Payment processing automatically" },
						]}
					/>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		gap: DesignSystem.spacing["2xl"],
		...DesignSystem.shadows.sm,
	},

	header: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: DesignSystem.spacing.lg,
	},

	headerIcon: {
		width: 40,
		height: 40,
		borderRadius: DesignSystem.radius.lg,
		backgroundColor: DesignSystem.colors.primary[800] + "20",
		alignItems: "center",
		justifyContent: "center",
	},

	headerText: {
		flex: 1,
		gap: DesignSystem.spacing.xs,
	},

	title: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},

	subtitle: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		lineHeight: 20,
	},

	content: {
		gap: DesignSystem.spacing["2xl"],
	},

	sectionTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.md,
	},

	templateGrid: {
		gap: DesignSystem.spacing.md,
	},

	inputSection: {
		gap: DesignSystem.spacing.sm,
	},

	inputLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},

	textInput: {
		backgroundColor: DesignSystem.colors.surface.primary,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
	},

	textArea: {
		height: 100,
		textAlignVertical: "top",
	},

	primaryButton: {
		backgroundColor: DesignSystem.colors.primary[900],
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		borderRadius: DesignSystem.radius.lg,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		...DesignSystem.shadows.sm,
	},

	primaryButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	secondaryButton: {
		backgroundColor: DesignSystem.colors.surface.secondary,
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		borderRadius: DesignSystem.radius.lg,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
	},

	secondaryButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.primary[700],
		fontWeight: "600",
	},

	note: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.tertiary,
		textAlign: "center",
		lineHeight: 18,
	},
});

export default ZKTLSVerification;

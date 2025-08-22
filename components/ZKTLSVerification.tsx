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
	TouchableOpacity,
	Alert,
	Linking,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { useZKTLSVerification } from "../lib/zkTLS";
import type { Job } from "../lib/contractService";
import { Ionicons } from "@expo/vector-icons";

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
			<ThemedView
				style={{
					backgroundColor: "white",
					borderRadius: 16,
					padding: 20,
					marginBottom: 20,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.06,
					shadowRadius: 8,
					elevation: 2,
				}}
			>
				<ThemedText
					style={{ fontWeight: "600", color: "#856404", marginBottom: 8 }}
				>
					⚠️ zkTLS Configuration Required
				</ThemedText>
				<ThemedText style={{ color: "#856404", fontSize: 14 }}>
					Website verification requires Reclaim Protocol setup. Contact your
					administrator to configure zkTLS verification.
				</ThemedText>
			</ThemedView>
		);
	}

	return (
		<ThemedView
			style={{
				backgroundColor: "white",
				borderRadius: 16,
				padding: 20,
				marginBottom: 20,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.06,
				shadowRadius: 8,
				elevation: 2,
			}}
		>
			<ThemedText style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
				Website Delivery Verification
			</ThemedText>

			<ThemedText style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
				Submit cryptographic proof that your website has been delivered instead
				of waiting for manual client approval.
			</ThemedText>

			{step === "input" && (
				<>
					<ThemedText style={{ fontWeight: "600", marginBottom: 8 }}>
						Select Website Type:
					</ThemedText>
					<View style={{ marginBottom: 16 }}>
						{templateOptions.map((option) => (
							<TouchableOpacity
								key={option.key}
								style={{
									flexDirection: "row",
									alignItems: "center",
									paddingVertical: 8,
									paddingHorizontal: 12,
									marginVertical: 2,
									borderRadius: 6,
									backgroundColor:
										selectedTemplate === option.key ? "#E3F2FD" : "transparent",
									borderWidth: 1,
									borderColor:
										selectedTemplate === option.key ? "#2196F3" : "#E0E0E0",
								}}
								onPress={() => handleTemplateSelect(option.key)}
							>
								<Ionicons
									name={
										selectedTemplate === option.key
											? "radio-button-on"
											: "radio-button-off"
									}
									size={20}
									color={selectedTemplate === option.key ? "#2196F3" : "#999"}
									style={{ marginRight: 8 }}
								/>
								<ThemedText>{option.label}</ThemedText>
							</TouchableOpacity>
						))}
					</View>

					<ThemedText style={{ fontWeight: "600", marginBottom: 8 }}>
						Website URL:
					</ThemedText>
					<TextInput
						style={{
							borderWidth: 1,
							borderColor: "#DDD",
							borderRadius: 6,
							padding: 12,
							marginBottom: 16,
							backgroundColor: "white",
							fontSize: 16,
						}}
						placeholder="https://your-delivered-website.com"
						value={deliveryUrl}
						onChangeText={setDeliveryUrl}
						autoCapitalize="none"
						autoCorrect={false}
						keyboardType="url"
					/>

					<ThemedText style={{ fontWeight: "600", marginBottom: 8 }}>
						Expected Content (Optional):
					</ThemedText>
					<TextInput
						style={{
							borderWidth: 1,
							borderColor: "#DDD",
							borderRadius: 6,
							padding: 12,
							marginBottom: 16,
							backgroundColor: "white",
							fontSize: 16,
							height: 80,
						}}
						placeholder="Describe key elements that should be present on the website..."
						value={expectedContent}
						onChangeText={setExpectedContent}
						multiline
						textAlignVertical="top"
					/>

					<TouchableOpacity
						style={{
							backgroundColor: "#4CAF50",
							padding: 16,
							borderRadius: 8,
							alignItems: "center",
							opacity: isGeneratingProof ? 0.7 : 1,
						}}
						onPress={generateWebsiteProof}
						disabled={isGeneratingProof}
					>
						<ThemedText
							style={{ color: "white", fontWeight: "600", fontSize: 16 }}
						>
							{isGeneratingProof
								? "Generating Proof..."
								: "Generate Website Proof"}
						</ThemedText>
					</TouchableOpacity>
				</>
			)}

			{step === "verification" && (
				<>
					<View
						style={{
							backgroundColor: "#E8F5E8",
							padding: 16,
							borderRadius: 8,
							marginBottom: 16,
							borderLeftWidth: 4,
							borderLeftColor: "#4CAF50",
						}}
					>
						<ThemedText
							style={{ fontWeight: "600", color: "#2E7D32", marginBottom: 8 }}
						>
							✅ Verification URL Generated!
						</ThemedText>
						<ThemedText style={{ color: "#2E7D32", fontSize: 14 }}>
							Complete the verification process to prove your website delivery.
						</ThemedText>
					</View>

					<TouchableOpacity
						style={{
							backgroundColor: "#2196F3",
							padding: 16,
							borderRadius: 8,
							alignItems: "center",
							marginBottom: 12,
						}}
						onPress={openVerificationUrl}
					>
						<ThemedText
							style={{ color: "white", fontWeight: "600", fontSize: 16 }}
						>
							🌐 Open Verification Page
						</ThemedText>
					</TouchableOpacity>

					<TouchableOpacity
						style={{
							backgroundColor: "#4CAF50",
							padding: 16,
							borderRadius: 8,
							alignItems: "center",
						}}
						onPress={handleVerificationComplete}
					>
						<ThemedText
							style={{ color: "white", fontWeight: "600", fontSize: 16 }}
						>
							✅ I've Completed Verification
						</ThemedText>
					</TouchableOpacity>

					<ThemedText
						style={{
							fontSize: 12,
							color: "#666",
							textAlign: "center",
							marginTop: 8,
						}}
					>
						Note: After completing verification in your browser, return here to
						finalize the job.
					</ThemedText>
				</>
			)}

			{step === "complete" && (
				<View
					style={{
						backgroundColor: "#E8F5E8",
						padding: 16,
						borderRadius: 8,
						alignItems: "center",
					}}
				>
					<Ionicons
						name="checkmark-circle"
						size={48}
						color="#4CAF50"
					/>
					<ThemedText
						style={{
							fontWeight: "600",
							color: "#2E7D32",
							fontSize: 18,
							marginTop: 8,
							textAlign: "center",
						}}
					>
						🎉 Verification Complete!
					</ThemedText>
					<ThemedText
						style={{
							color: "#2E7D32",
							fontSize: 14,
							textAlign: "center",
							marginTop: 4,
						}}
					>
						Your website delivery has been cryptographically verified. Payment
						should be released automatically.
					</ThemedText>
				</View>
			)}
		</ThemedView>
	);
}

export default ZKTLSVerification;

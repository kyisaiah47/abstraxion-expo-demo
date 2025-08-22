/**
 * zkTLS Demo Screen
 *
 * Demonstrates the zkTLS website verification functionality
 * for automated work completion without manual client approval
 */

import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import ZKTLSVerification from "../components/ZKTLSVerification";
import { useZKTLSVerification } from "../lib/zkTLS";
import { RECLAIM_CONFIG } from "../constants/contracts";
import { Ionicons } from "@expo/vector-icons";

// Mock job for demo purposes
const demoJob = {
	id: 999,
	description:
		"Create a landing page for Acme Corp with hero section and contact form",
	client: "xion1demoklj43k5j34k5j43k5j34k5j34k5j34k5j34",
	worker: "xion1worker123456789012345678901234567890123",
	escrow_amount: {
		denom: "uxion",
		amount: "1000000", // 1 XION
	},
	status: "Accepted" as any,
	deadline: "2024-12-25T23:59:59Z",
	created_at: "2024-12-20T10:00:00Z",
};

export default function ZKTLSDemoScreen() {
	const [step, setStep] = useState<"intro" | "demo" | "results">("intro");
	const [demoResults, setDemoResults] = useState<any>(null);
	const { isConfigured } = useZKTLSVerification();
	const router = useRouter();

	const handleStartDemo = () => {
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
		setStep("demo");
	};

	const handleDemoComplete = (success: boolean, transactionHash?: string) => {
		setDemoResults({ success, transactionHash });
		setStep("results");
	};

	const resetDemo = () => {
		setStep("intro");
		setDemoResults(null);
	};

	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen
				options={{
					headerShown: true,
					title: "zkTLS Demo",
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => router.back()}
							style={{ padding: 8, marginLeft: -8 }}
						>
							<Ionicons
								name="arrow-back"
								size={24}
								color="#007AFF"
							/>
						</TouchableOpacity>
					),
				}}
			/>

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
			>
				{step === "intro" && (
					<View style={styles.content}>
						<View style={styles.header}>
							<Ionicons
								name="logo-github"
								size={64}
								color="#333"
							/>
							<ThemedText style={styles.title}>
								GitHub Repository Verification
							</ThemedText>
							<ThemedText style={styles.subtitle}>
								Prove you own the GitHub account that delivered the code
							</ThemedText>
						</View>
						<View style={styles.infoCard}>
							<ThemedText style={styles.cardTitle}>How it works:</ThemedText>
							<View style={styles.stepList}>
								<View style={styles.stepItem}>
									<View style={styles.stepNumber}>
										<Text style={styles.stepNumberText}>1</Text>
									</View>
									<View style={styles.stepContent}>
										<ThemedText style={styles.stepTitle}>
											Complete Work
										</ThemedText>
										<ThemedText style={styles.stepDescription}>
											Finish building the code in your GitHub repository
										</ThemedText>
									</View>
								</View>

								<View style={styles.stepItem}>
									<View style={styles.stepNumber}>
										<Text style={styles.stepNumberText}>2</Text>
									</View>
									<View style={styles.stepContent}>
										<ThemedText style={styles.stepTitle}>
											Prove GitHub Ownership
										</ThemedText>
										<ThemedText style={styles.stepDescription}>
											Log in with GitHub to prove you own the account that
											delivered the code
										</ThemedText>
									</View>
								</View>

								<View style={styles.stepItem}>
									<View style={styles.stepNumber}>
										<Text style={styles.stepNumberText}>3</Text>
									</View>
									<View style={styles.stepContent}>
										<ThemedText style={styles.stepTitle}>
											Receive Payment
										</ThemedText>
										<ThemedText style={styles.stepDescription}>
											Get paid for your verified GitHub contributions
										</ThemedText>
									</View>
								</View>
							</View>
						</View>
						<View style={styles.benefitsCard}>
							<ThemedText style={styles.cardTitle}>Benefits:</ThemedText>
							<View style={styles.benefitsList}>
								<View style={styles.benefitItem}>
									<Ionicons
										name="flash"
										size={20}
										color="#FF9800"
									/>
									<ThemedText style={styles.benefitText}>
										Instant payment
									</ThemedText>
								</View>
								<View style={styles.benefitItem}>
									<Ionicons
										name="shield"
										size={20}
										color="#2196F3"
									/>
									<ThemedText style={styles.benefitText}>
										Tamper-proof verification
									</ThemedText>
								</View>
								<View style={styles.benefitItem}>
									<Ionicons
										name="checkmark-circle"
										size={20}
										color="#4CAF50"
									/>
									<ThemedText style={styles.benefitText}>
										No waiting for approval
									</ThemedText>
								</View>
								<View style={styles.benefitItem}>
									<Ionicons
										name="trending-up"
										size={20}
										color="#9C27B0"
									/>
									<ThemedText style={styles.benefitText}>
										Better cash flow
									</ThemedText>
								</View>
							</View>
						</View>
						<View style={styles.configStatus}>
							<View
								style={[
									styles.statusBadge,
									{ backgroundColor: isConfigured ? "#E8F5E8" : "#FFF3CD" },
								]}
							>
								<Ionicons
									name={isConfigured ? "checkmark-circle" : "warning"}
									size={20}
									color={isConfigured ? "#4CAF50" : "#FF9800"}
								/>
								<ThemedText
									style={{
										color: isConfigured ? "#2E7D32" : "#856404",
										fontWeight: "600",
										marginLeft: 8,
									}}
								>
									{isConfigured
										? "Reclaim Protocol Configured"
										: "Configuration Required"}
								</ThemedText>
							</View>
						</View>
						<TouchableOpacity
							style={[styles.demoButton, { opacity: isConfigured ? 1 : 0.6 }]}
							onPress={handleStartDemo}
						>
							<ThemedText style={styles.demoButtonText}>
								🚀 Start Demo
							</ThemedText>
						</TouchableOpacity>
					</View>
				)}

				{step === "demo" && (
					<View style={styles.content}>
						<View style={styles.demoHeader}>
							<ThemedText style={styles.demoTitle}>
								Demo Job: Landing Page
							</ThemedText>
							<ThemedText style={styles.demoDescription}>
								Complete this sample job using zkTLS verification
							</ThemedText>
						</View>

						<ZKTLSVerification
							job={demoJob}
							userAddress={demoJob.worker!}
							contractClient={null} // In demo mode, no real contract calls
							onVerificationComplete={handleDemoComplete}
						/>

						<TouchableOpacity
							style={styles.backButton}
							onPress={() => setStep("intro")}
						>
							<Ionicons
								name="arrow-back"
								size={20}
								color="#666"
							/>
							<ThemedText style={styles.backButtonText}>
								Back to Overview
							</ThemedText>
						</TouchableOpacity>
					</View>
				)}

				{step === "results" && (
					<View style={styles.content}>
						<View style={styles.resultsHeader}>
							<Ionicons
								name={
									demoResults?.success ? "checkmark-circle" : "close-circle"
								}
								size={64}
								color={demoResults?.success ? "#4CAF50" : "#F44336"}
							/>
							<ThemedText style={styles.resultsTitle}>
								{demoResults?.success ? "Demo Completed!" : "Demo Failed"}
							</ThemedText>
							<ThemedText style={styles.resultsDescription}>
								{demoResults?.success
									? "zkTLS verification would automatically release payment"
									: "Something went wrong with the verification process"}
							</ThemedText>
						</View>

						{demoResults?.success && (
							<View style={styles.successDetails}>
								<ThemedText style={styles.successTitle}>
									What happened:
								</ThemedText>
								<View style={styles.successStep}>
									<Ionicons
										name="globe"
										size={20}
										color="#4CAF50"
									/>
									<ThemedText style={styles.successText}>
										Website accessibility verified
									</ThemedText>
								</View>
								<View style={styles.successStep}>
									<Ionicons
										name="shield-checkmark"
										size={20}
										color="#4CAF50"
									/>
									<ThemedText style={styles.successText}>
										Cryptographic proof generated
									</ThemedText>
								</View>
								<View style={styles.successStep}>
									<Ionicons
										name="card"
										size={20}
										color="#4CAF50"
									/>
									<ThemedText style={styles.successText}>
										Payment would be released automatically
									</ThemedText>
								</View>
								{demoResults.transactionHash && (
									<View style={styles.successStep}>
										<Ionicons
											name="receipt"
											size={20}
											color="#4CAF50"
										/>
										<ThemedText style={styles.successText}>
											Transaction: {demoResults.transactionHash.slice(0, 8)}...
										</ThemedText>
									</View>
								)}
							</View>
						)}

						<TouchableOpacity
							style={styles.resetButton}
							onPress={resetDemo}
						>
							<ThemedText style={styles.resetButtonText}>
								🔄 Try Again
							</ThemedText>
						</TouchableOpacity>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F8F9FA",
	},
	scrollView: {
		flex: 1,
	},
	content: {
		padding: 20,
	},
	header: {
		alignItems: "center",
		marginBottom: 32,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		textAlign: "center",
		marginTop: 16,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
		lineHeight: 22,
	},
	infoCard: {
		backgroundColor: "white",
		borderRadius: 16,
		padding: 20,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 16,
	},
	stepList: {
		gap: 16,
	},
	stepItem: {
		flexDirection: "row",
		alignItems: "flex-start",
	},
	stepNumber: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#6366F1",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	stepNumberText: {
		color: "white",
		fontWeight: "600",
		fontSize: 16,
	},
	stepContent: {
		flex: 1,
	},
	stepTitle: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	stepDescription: {
		fontSize: 14,
		color: "#666",
		lineHeight: 20,
	},
	benefitsCard: {
		backgroundColor: "white",
		borderRadius: 16,
		padding: 20,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},
	benefitsList: {
		gap: 12,
	},
	benefitItem: {
		flexDirection: "row",
		alignItems: "center",
	},
	benefitText: {
		fontSize: 16,
		marginLeft: 12,
	},
	configStatus: {
		marginBottom: 24,
	},
	statusBadge: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 8,
	},
	demoButton: {
		backgroundColor: "#6366F1",
		padding: 18,
		borderRadius: 12,
		alignItems: "center",
	},
	demoButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "600",
	},
	demoHeader: {
		backgroundColor: "white",
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
	},
	demoTitle: {
		fontSize: 20,
		fontWeight: "600",
		marginBottom: 8,
	},
	demoDescription: {
		fontSize: 14,
		color: "#666",
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 16,
		marginTop: 20,
	},
	backButtonText: {
		color: "#666",
		marginLeft: 8,
		fontSize: 16,
	},
	resultsHeader: {
		alignItems: "center",
		marginBottom: 32,
	},
	resultsTitle: {
		fontSize: 22,
		fontWeight: "700",
		textAlign: "center",
		marginTop: 16,
		marginBottom: 8,
	},
	resultsDescription: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
		lineHeight: 22,
	},
	successDetails: {
		backgroundColor: "white",
		borderRadius: 16,
		padding: 20,
		marginBottom: 24,
	},
	successTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 16,
	},
	successStep: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	successText: {
		fontSize: 16,
		marginLeft: 12,
	},
	resetButton: {
		backgroundColor: "#6366F1",
		padding: 18,
		borderRadius: 12,
		alignItems: "center",
	},
	resetButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "600",
	},
});

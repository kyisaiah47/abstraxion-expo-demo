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
	Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import ZKTLSVerification from "../components/ZKTLSVerification";
import { useZKTLSVerification } from "../lib/zkTLS";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "../constants/DesignSystem";
import StepCard from "../components/StepCard";
import ProofVerifiedCard from "../components/ProofVerifiedCard";
import InfoCard from "../components/InfoCard";
import TrustFooter from "../components/TrustFooter";

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
					title: "zkTLS Proof Demo",
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
				{step === "intro" && (
					<View style={styles.content}>
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
								Prove website delivery instantly without manual review
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
								description="Finish building the website and deploy it to a public URL"
								icon="code-slash"
							/>

							<StepCard
								stepNumber={2}
								title="Generate Cryptographic Proof"
								description="Our system visits your URL and generates tamper-proof verification"
								icon="shield-checkmark"
							/>

							<StepCard
								stepNumber={3}
								title="Release Payment Automatically"
								description="Payment is released instantly once proof is verified on-chain"
								icon="card"
							/>
						</View>

						<View style={styles.benefitsContainer}>
							<Text style={styles.sectionTitle}>Why use proofs?</Text>

							<InfoCard
								icon="flash"
								title="Instant Settlement"
								body="No waiting for manual approval or client review"
							/>

							<InfoCard
								icon="shield-checkmark"
								title="Tamper-Proof Verification"
								body="Mathematical certainty that work was completed"
							/>

							<InfoCard
								icon="trending-up"
								title="Better Cash Flow"
								body="Get paid immediately when work is delivered"
							/>
						</View>

						<Pressable
							style={[
								styles.primaryButton,
								{ opacity: isConfigured ? 1 : 0.6 },
							]}
							onPress={handleStartDemo}
						>
							<Text style={styles.primaryButtonText}>Start Proof Demo</Text>
						</Pressable>

						<TrustFooter />
					</View>
				)}

				{step === "demo" && (
					<View style={styles.content}>
						<View style={styles.demoHeader}>
							<Text style={styles.demoTitle}>Demo: Landing Page Delivery</Text>
							<Text style={styles.demoDescription}>
								Simulating proof generation for website completion
							</Text>
						</View>

						<ZKTLSVerification
							job={demoJob}
							userAddress={demoJob.worker!}
							contractClient={null}
							onVerificationComplete={handleDemoComplete}
						/>

						<Pressable
							style={styles.secondaryButton}
							onPress={() => setStep("intro")}
						>
							<Ionicons
								name="chevron-back"
								size={20}
								color={DesignSystem.colors.text.secondary}
							/>
							<Text style={styles.secondaryButtonText}>Back to Overview</Text>
						</Pressable>
					</View>
				)}

				{step === "results" && (
					<View style={styles.content}>
						{demoResults?.success ? (
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

								<TrustFooter />
							</>
						) : (
							<View style={styles.errorContainer}>
								<View style={styles.errorIcon}>
									<Ionicons
										name="warning"
										size={48}
										color={DesignSystem.colors.status.error}
									/>
								</View>
								<Text style={styles.errorTitle}>Proof Generation Failed</Text>
								<Text style={styles.errorDescription}>
									Unable to verify website delivery. Please check your
									implementation and try again.
								</Text>
							</View>
						)}

						<Pressable
							style={styles.primaryButton}
							onPress={resetDemo}
						>
							<Text style={styles.primaryButtonText}>Try Demo Again</Text>
						</Pressable>
					</View>
				)}
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
		padding: DesignSystem.spacing["3xl"],
		gap: DesignSystem.spacing["3xl"],
	},

	headerButton: {
		padding: DesignSystem.spacing.sm,
		marginLeft: -DesignSystem.spacing.sm,
	},

	header: {
		alignItems: "center",
		gap: DesignSystem.spacing.lg,
	},

	heroIcon: {
		width: 80,
		height: 80,
		borderRadius: DesignSystem.radius["2xl"],
		backgroundColor: DesignSystem.colors.primary[800] + "20",
		alignItems: "center",
		justifyContent: "center",
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
		lineHeight: 26,
	},

	stepsContainer: {
		gap: DesignSystem.spacing.lg,
	},

	benefitsContainer: {
		gap: DesignSystem.spacing.lg,
	},

	sectionTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.md,
	},

	primaryButton: {
		backgroundColor: DesignSystem.colors.primary[900],
		paddingVertical: DesignSystem.spacing.xl,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		borderRadius: DesignSystem.radius.xl,
		alignItems: "center",
		...DesignSystem.shadows.sm,
	},

	primaryButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	secondaryButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: DesignSystem.spacing.lg,
		gap: DesignSystem.spacing.sm,
	},

	secondaryButtonText: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
	},

	demoHeader: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
	},

	demoTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.sm,
	},

	demoDescription: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		lineHeight: 22,
	},

	errorContainer: {
		alignItems: "center",
		gap: DesignSystem.spacing.lg,
		backgroundColor: DesignSystem.colors.status.error + "10",
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["3xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.status.error + "30",
	},

	errorIcon: {
		width: 80,
		height: 80,
		borderRadius: DesignSystem.radius["2xl"],
		backgroundColor: DesignSystem.colors.status.error + "20",
		alignItems: "center",
		justifyContent: "center",
	},

	errorTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		textAlign: "center",
	},

	errorDescription: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
		lineHeight: 22,
	},
});

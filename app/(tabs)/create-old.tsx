import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	Alert,
	Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import { DesignSystem } from "@/constants/DesignSystem";

interface TaskFormData {
	description: string;
	amount: string;
	deadline: string;
}

export default function ProofPayCreate() {
	const [step, setStep] = useState<"form" | "generated">("form");
	const [formData, setFormData] = useState<TaskFormData>({
		description: "",
		amount: "",
		deadline: "",
	});
	const [taskCode, setTaskCode] = useState("");

	const generateTaskCode = (): string => {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let result = "";
		for (let i = 0; i < 8; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	};

	const handleSubmit = () => {
		if (!formData.description.trim() || !formData.amount.trim()) {
			Alert.alert("Error", "Please fill in all required fields");
			return;
		}

		const amount = parseFloat(formData.amount);
		if (isNaN(amount) || amount <= 0) {
			Alert.alert("Error", "Please enter a valid amount");
			return;
		}

		// Generate task code and move to generated step
		const code = generateTaskCode();
		setTaskCode(code);
		setStep("generated");
	};

	const handleShare = async () => {
		try {
			const shareMessage = `Complete this task for $${formData.amount}!\n\n"${formData.description}"\n\nUse code: ${taskCode}\n\nDownload ProofPay to get paid!`;

			await Share.share({
				message: shareMessage,
				title: "ProofPay Task",
			});
		} catch (error) {
			console.error("Error sharing:", error);
		}
	};

	const handleCreateAnother = () => {
		setStep("form");
		setFormData({
			description: "",
			amount: "",
			deadline: "",
		});
		setTaskCode("");
	};

	const renderForm = () => (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={styles.scrollContent}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.formSection}>
				<Text style={styles.sectionTitle}>What needs to be done?</Text>

				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>
						Task Description <Text style={styles.required}>*</Text>
					</Text>
					<TextInput
						style={[styles.textInput, styles.textArea]}
						value={formData.description}
						onChangeText={(text) =>
							setFormData({ ...formData, description: text })
						}
						placeholder="e.g., Take a photo of your coffee, Write a review, Answer a survey..."
						placeholderTextColor={DesignSystem.colors.text.tertiary}
						multiline
						numberOfLines={4}
						textAlignVertical="top"
					/>
				</View>

				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>
						Payment Amount <Text style={styles.required}>*</Text>
					</Text>
					<View style={styles.amountInputContainer}>
						<Text style={styles.currencySymbol}>$</Text>
						<TextInput
							style={styles.amountInput}
							value={formData.amount}
							onChangeText={(text) =>
								setFormData({ ...formData, amount: text })
							}
							placeholder="0.00"
							placeholderTextColor={DesignSystem.colors.text.tertiary}
							keyboardType="numeric"
						/>
					</View>
				</View>

				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>Deadline (Optional)</Text>
					<TextInput
						style={styles.textInput}
						value={formData.deadline}
						onChangeText={(text) =>
							setFormData({ ...formData, deadline: text })
						}
						placeholder="e.g., 24 hours, By tomorrow, etc."
						placeholderTextColor={DesignSystem.colors.text.tertiary}
					/>
				</View>
			</View>

			<View style={styles.infoSection}>
				<View style={styles.infoCard}>
					<Ionicons
						name="shield-checkmark"
						size={24}
						color={DesignSystem.colors.primary[700]}
					/>
					<View style={styles.infoContent}>
						<Text style={styles.infoTitle}>Verified Completion</Text>
						<Text style={styles.infoSubtitle}>
							Payments are secured with cryptographic proof verification
						</Text>
					</View>
				</View>
			</View>

			<View style={styles.buttonContainer}>
				<Pressable
					style={styles.createButton}
					onPress={handleSubmit}
				>
					<LinearGradient
						colors={[
							DesignSystem.colors.primary[700],
							DesignSystem.colors.primary[900],
						]}
						style={StyleSheet.absoluteFillObject}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					/>
					<Ionicons
						name="add-circle"
						size={20}
						color={DesignSystem.colors.text.inverse}
					/>
					<Text style={styles.createButtonText}>Create Task</Text>
				</Pressable>
			</View>
		</ScrollView>
	);

	const renderGenerated = () => (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.successSection}>
				<View style={styles.successIcon}>
					<Ionicons
						name="checkmark-circle"
						size={48}
						color={DesignSystem.colors.status.success}
					/>
				</View>
				<Text style={styles.successTitle}>Task Created!</Text>
				<Text style={styles.successSubtitle}>
					Share this with someone to get started
				</Text>
			</View>

			<View style={styles.taskCard}>
				<View style={styles.taskHeader}>
					<Text style={styles.taskTitle}>{formData.description}</Text>
					<View style={styles.taskAmount}>
						<Text style={styles.taskAmountText}>${formData.amount}</Text>
					</View>
				</View>

				{formData.deadline && (
					<View style={styles.taskDeadline}>
						<Ionicons
							name="time-outline"
							size={16}
							color={DesignSystem.colors.text.secondary}
						/>
						<Text style={styles.taskDeadlineText}>
							Deadline: {formData.deadline}
						</Text>
					</View>
				)}
			</View>

			<View style={styles.codeSection}>
				<Text style={styles.codeLabel}>Task Code</Text>
				<View style={styles.codeContainer}>
					<Text style={styles.codeText}>{taskCode}</Text>
					<Pressable
						style={styles.copyButton}
						onPress={() => {
							// Copy to clipboard logic would go here
							Alert.alert("Copied!", "Task code copied to clipboard");
						}}
					>
						<Ionicons
							name="copy-outline"
							size={20}
							color={DesignSystem.colors.primary[700]}
						/>
					</Pressable>
				</View>
			</View>

			<View style={styles.qrSection}>
				<Text style={styles.qrLabel}>Share Link</Text>
				<View style={styles.qrContainer}>
					<View style={styles.qrPlaceholder}>
						<Ionicons
							name="qr-code"
							size={80}
							color={DesignSystem.colors.text.secondary}
						/>
					</View>
				</View>
				<Text style={styles.qrSubtext}>QR code coming soon!</Text>
			</View>

			<View style={styles.actionButtons}>
				<Pressable
					style={styles.shareButton}
					onPress={handleShare}
				>
					<Ionicons
						name="share-outline"
						size={20}
						color={DesignSystem.colors.text.inverse}
					/>
					<Text style={styles.shareButtonText}>Share Task</Text>
				</Pressable>

				<Pressable
					style={styles.anotherButton}
					onPress={handleCreateAnother}
				>
					<Text style={styles.anotherButtonText}>Create Another</Text>
				</Pressable>
			</View>
		</ScrollView>
	);

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title={step === "form" ? "Create Task" : "Task Created"}
				subtitle={
					step === "form"
						? "Set up a new P2P task"
						: "Share with others to get started"
				}
				showBackButton={step === "generated"}
				onBackPress={handleCreateAnother}
			/>

			<KeyboardAvoidingView
				style={styles.keyboardView}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				{step === "form" ? renderForm() : renderGenerated()}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.primary,
	},

	keyboardView: {
		flex: 1,
	},

	scrollView: {
		flex: 1,
	},

	scrollContent: {
		paddingHorizontal: DesignSystem.layout.containerPadding,
		paddingTop: DesignSystem.spacing["2xl"],
		paddingBottom: 120, // Space for tab bar
	},

	// Form Styles
	formSection: {
		gap: DesignSystem.spacing["3xl"],
	},

	sectionTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		textAlign: "center",
		marginBottom: DesignSystem.spacing.xl,
	},

	inputContainer: {
		gap: DesignSystem.spacing.md,
	},

	inputLabel: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	required: {
		color: DesignSystem.colors.status.error,
	},

	textInput: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.primary,
		minHeight: 56,
	},

	textArea: {
		minHeight: 120,
		textAlignVertical: "top",
	},

	amountInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		paddingHorizontal: DesignSystem.spacing["2xl"],
	},

	currencySymbol: {
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.secondary,
		marginRight: DesignSystem.spacing.sm,
	},

	amountInput: {
		flex: 1,
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.primary,
		minHeight: 56,
	},

	infoSection: {
		marginTop: DesignSystem.spacing["4xl"],
	},

	infoCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		gap: DesignSystem.spacing.lg,
	},

	infoContent: {
		flex: 1,
		gap: DesignSystem.spacing.xs,
	},

	infoTitle: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	infoSubtitle: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		lineHeight: 18,
	},

	buttonContainer: {
		marginTop: DesignSystem.spacing["4xl"],
	},

	createButton: {
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.md,
		...DesignSystem.shadows.lg,
		overflow: "hidden",
	},

	createButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
	},

	// Generated Styles
	successSection: {
		alignItems: "center",
		marginBottom: DesignSystem.spacing["4xl"],
		gap: DesignSystem.spacing.lg,
	},

	successIcon: {
		marginBottom: DesignSystem.spacing.md,
	},

	successTitle: {
		...DesignSystem.typography.h2,
		color: DesignSystem.colors.text.primary,
		textAlign: "center",
	},

	successSubtitle: {
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
	},

	taskCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["3xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		marginBottom: DesignSystem.spacing["3xl"],
		...DesignSystem.shadows.sm,
	},

	taskHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: DesignSystem.spacing.lg,
	},

	taskTitle: {
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.primary,
		flex: 1,
		marginRight: DesignSystem.spacing.md,
	},

	taskAmount: {
		backgroundColor: DesignSystem.colors.primary[800],
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingVertical: DesignSystem.spacing.sm,
		borderRadius: DesignSystem.radius.md,
	},

	taskAmountText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
	},

	taskDeadline: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
	},

	taskDeadlineText: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
	},

	codeSection: {
		marginBottom: DesignSystem.spacing["3xl"],
	},

	codeLabel: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.md,
		textAlign: "center",
	},

	codeContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		gap: DesignSystem.spacing.md,
	},

	codeText: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		flex: 1,
		textAlign: "center",
		letterSpacing: 2,
	},

	copyButton: {
		padding: DesignSystem.spacing.sm,
	},

	qrSection: {
		alignItems: "center",
		marginBottom: DesignSystem.spacing["4xl"],
		gap: DesignSystem.spacing.lg,
	},

	qrLabel: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	qrContainer: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		padding: DesignSystem.spacing["2xl"],
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
	},

	qrPlaceholder: {
		width: 160,
		height: 160,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: DesignSystem.colors.surface.tertiary,
		borderRadius: DesignSystem.radius.lg,
	},

	qrSubtext: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.tertiary,
		textAlign: "center",
	},

	actionButtons: {
		gap: DesignSystem.spacing.lg,
	},

	shareButton: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.md,
		...DesignSystem.shadows.lg,
	},

	shareButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
	},

	anotherButton: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},

	anotherButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},
});

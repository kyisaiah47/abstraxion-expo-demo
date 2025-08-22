import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Alert,
	Modal,
	Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import CreateTaskForm from "@/components/CreateTaskForm";
import InfoCard from "@/components/InfoCard";
import { DesignSystem } from "@/constants/DesignSystem";
import { TaskFormData } from "@/types/proofpay";

export default function CreateScreen() {
	const [showQRModal, setShowQRModal] = useState(false);
	const [taskCode, setTaskCode] = useState("");

	const generateTaskCode = (): string => {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let result = "";
		for (let i = 0; i < 8; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	};

	const handleSubmit = (payload: TaskFormData) => {
		console.log("Creating task:", payload);

		// Generate task code
		const code = generateTaskCode();
		setTaskCode(code);

		// Show success and navigate back or stay on create
		Alert.alert(
			"Task Created!",
			`Your task has been created with code: ${code}`,
			[
				{ text: "Share QR", onPress: () => setShowQRModal(true) },
				{ text: "OK", onPress: () => router.push("/(tabs)/activity") },
			]
		);
	};

	const handleShareQR = () => {
		setShowQRModal(true);
	};

	const renderQRModal = () => (
		<Modal
			visible={showQRModal}
			transparent
			animationType="slide"
			onRequestClose={() => setShowQRModal(false)}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Share Task</Text>
						<Pressable onPress={() => setShowQRModal(false)}>
							<Ionicons
								name="close"
								size={24}
								color={DesignSystem.colors.text.primary}
							/>
						</Pressable>
					</View>

					<View style={styles.qrContainer}>
						<View style={styles.qrPlaceholder}>
							<Ionicons
								name="qr-code"
								size={80}
								color={DesignSystem.colors.text.secondary}
							/>
						</View>
						<Text style={styles.qrSubtext}>QR code for task: {taskCode}</Text>
					</View>

					<Pressable
						style={styles.modalButton}
						onPress={() => setShowQRModal(false)}
					>
						<Text style={styles.modalButtonText}>Close</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title="Start a Task"
				subtitle="Create a verified payment request"
			/>

			<KeyboardAvoidingView
				style={styles.keyboardView}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{/* Task Creation Form */}
					<CreateTaskForm onSubmit={handleSubmit} />

					{/* Info Block */}
					<InfoCard
						title="Proof Verified"
						body="Payments are secured with cryptographic verification"
						icon="shield-checkmark"
					/>

					{/* Secondary Action */}
					<Pressable
						style={styles.shareButton}
						onPress={handleShareQR}
					>
						<Ionicons
							name="qr-code-outline"
							size={20}
							color={DesignSystem.colors.text.primary}
						/>
						<Text style={styles.shareButtonText}>Share QR</Text>
					</Pressable>

					{/* Bottom Spacer */}
					<View style={styles.bottomSpacer} />
				</ScrollView>
			</KeyboardAvoidingView>

			{renderQRModal()}
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
		gap: DesignSystem.spacing["4xl"],
	},

	shareButton: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.md,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		minHeight: 56,
	},

	shareButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	bottomSpacer: {
		height: 140, // Space for tab bar
	},

	// Modal Styles
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		padding: DesignSystem.spacing["2xl"],
	},

	modalContent: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["3xl"],
		width: "100%",
		maxWidth: 320,
		gap: DesignSystem.spacing["2xl"],
	},

	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	modalTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
	},

	qrContainer: {
		alignItems: "center",
		gap: DesignSystem.spacing.lg,
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
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
	},

	modalButton: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		alignItems: "center",
	},

	modalButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
	},
});

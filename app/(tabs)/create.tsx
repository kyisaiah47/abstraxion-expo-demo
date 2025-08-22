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
import SocialPaymentForm from "@/components/SocialPaymentForm";
import PaymentTabSwitcher from "@/components/PaymentTabSwitcher";
import InfoCard from "@/components/InfoCard";
import { DesignSystem } from "@/constants/DesignSystem";
import { PaymentFormData, PaymentType } from "@/types/proofpay";

export default function CreateScreen() {
	const [activeTab, setActiveTab] = useState<PaymentType>("request_help");
	const [showQRModal, setShowQRModal] = useState(false);
	const [requestCode, setRequestCode] = useState("");

	const generateRequestCode = (): string => {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let result = "";
		for (let i = 0; i < 8; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	};

	const handleSubmit = (payload: PaymentFormData) => {
		console.log("Creating payment request:", payload);

		// Generate request code
		const code = generateRequestCode();
		setRequestCode(code);

		// Show success message based on payment type
		const getSuccessMessage = () => {
			switch (payload.type) {
				case "request_help":
					return "Help Request Sent! 🙏";
				case "request_money":
					return "Payment Request Sent! 💳";
				case "send_money":
					return "Payment Sent! �";
			}
		};

		Alert.alert(
			getSuccessMessage(),
			`Your request has been shared with code: ${code}`,
			[
				{ text: "Share", onPress: () => setShowQRModal(true) },
				{ text: "Done", onPress: () => router.push("/(tabs)/activity") },
			]
		);
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
						<Text style={styles.modalTitle}>Share Request</Text>
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
						<Text style={styles.qrSubtext}>
							Share this with friends: {requestCode}
						</Text>
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
					{/* Payment Type Tabs */}
					<PaymentTabSwitcher
						activeTab={activeTab}
						onTabChange={setActiveTab}
					/>

					{/* Social Payment Form */}
					<SocialPaymentForm
						paymentType={activeTab}
						onSubmit={handleSubmit}
					/>

					{/* Info Block */}
					<InfoCard
						title="Secured by Crypto"
						body="All payments are protected with cryptographic verification on XION"
						icon="shield-checkmark"
					/>

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
		paddingTop: DesignSystem.spacing.xl,
		gap: DesignSystem.spacing.xl,
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

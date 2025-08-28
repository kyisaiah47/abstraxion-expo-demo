import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	Modal,
	Pressable,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SocialPaymentForm from "@/components/SocialPaymentForm";
import PaymentTabSwitcher from "@/components/PaymentTabSwitcher";
import { DesignSystem } from "@/constants/DesignSystem";
import { PaymentFormData, PaymentType } from "@/types/proofpay";
import { useTheme } from "@/contexts/ThemeContext";

export default function CreateScreen() {
	const { colors } = useTheme();
	const [activeTab, setActiveTab] = useState<PaymentType>("request_task");
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

		// Generate request code
		const code = generateRequestCode();
		setRequestCode(code);

		// Show success message based on payment type
		const getSuccessMessage = () => {
			switch (payload.type) {
				case "request_task":
					return "Task Request Sent! 🙏";
				case "request_money":
					return "Payment Request Sent! 💳";
				case "send_money":
					return "Payment Sent! �";
			}
		};

		Toast.show({
			type: 'success',
			text1: getSuccessMessage(),
			text2: `Your request has been shared with code: ${code}`,
			position: 'bottom',
			visibilityTime: 4000,
		});
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
								color={colors.text.primary}
							/>
						</Pressable>
					</View>

					<View style={styles.qrContainer}>
						<View style={styles.qrPlaceholder}>
							<Ionicons
								name="qr-code"
								size={80}
								color={colors.text.secondary}
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

	const styles = createStyles(colors);

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<KeyboardAvoidingView
				style={styles.keyboardView}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View style={styles.content}>
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

					{/* Minimal Crypto Badge at Bottom */}
					<View style={styles.cryptoBadge}>
						<Ionicons
							name="shield-checkmark"
							size={16}
							color={colors.text.tertiary}
						/>
						<Text style={styles.cryptoBadgeText}>
							Secured by XION blockchain
						</Text>
					</View>
				</View>
			</KeyboardAvoidingView>

			{renderQRModal()}
		</SafeAreaView>
	);
}

const createStyles = (colors: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface.primary,
	},

	keyboardView: {
		flex: 1,
	},

	content: {
		flex: 1,
		paddingHorizontal: DesignSystem.layout.containerPadding,
		paddingTop: DesignSystem.spacing["4xl"], // Increased top margin
		gap: DesignSystem.spacing["2xl"], // More space between sections
		justifyContent: "space-between",
	},

	// Minimal Crypto Badge
	cryptoBadge: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 8,
		marginBottom: 12,
	},

	cryptoBadgeText: {
		fontSize: 12,
		color: colors.text.tertiary,
		fontWeight: "400",
	},

	// Modal Styles
	modalOverlay: {
		flex: 1,
		backgroundColor: colors.surface.overlay,
		justifyContent: "center",
		alignItems: "center",
		padding: DesignSystem.spacing["2xl"],
	},

	modalContent: {
		backgroundColor: colors.surface.elevated,
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
		color: colors.text.primary,
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
		backgroundColor: colors.surface.tertiary,
		borderRadius: DesignSystem.radius.lg,
	},

	qrSubtext: {
		...DesignSystem.typography.body.small,
		color: colors.text.secondary,
		textAlign: "center",
	},

	modalButton: {
		backgroundColor: colors.primary[800],
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		alignItems: "center",
	},

	modalButtonText: {
		...DesignSystem.typography.label.large,
		color: colors.text.inverse,
	},
});

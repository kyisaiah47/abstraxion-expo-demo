import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Pressable,
	Alert,
	Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PaymentFormData, PaymentType, ProofType } from "@/types/proofpay";

interface SocialPaymentFormProps {
	paymentType: PaymentType;
	onSubmit: (payload: PaymentFormData) => void;
}

const PROOF_TYPE_OPTIONS = [
	{
		id: "none" as ProofType,
		label: "None",
		icon: "ban",
		disabled: false,
	},
	{
		id: "text" as ProofType,
		label: "Text Proof",
		icon: "chatbubble-outline",
		disabled: false,
	},
	{
		id: "photo" as ProofType,
		label: "Photo Proof",
		icon: "camera-outline",
		disabled: false,
	},
	{
		id: "zktls" as ProofType,
		label: "zkTLS Proof",
		icon: "shield-checkmark-outline",
		disabled: false,
	},
];

export default function SocialPaymentForm({
	paymentType,
	onSubmit,
}: SocialPaymentFormProps) {
	const [formData, setFormData] = useState<PaymentFormData>({
		type: paymentType,
		amount: 0,
		description: "",
		proofType: "none",
	});

	const [showProofDropdown, setShowProofDropdown] = useState(false);

	// Update form type when prop changes
	useEffect(() => {
		setFormData((prev) => ({ ...prev, type: paymentType }));
	}, [paymentType]);

	const handleSubmit = () => {
		// Validation
		if (formData.amount <= 0) {
			Alert.alert("Error", "Please enter a valid amount");
			return;
		}

		if (!formData.description.trim()) {
			Alert.alert("Error", "Please add a description");
			return;
		}

		onSubmit(formData);
	};

	const getSubmitButtonText = () => {
		switch (paymentType) {
			case "request_help":
				return "Ask for Help";
			case "request_money":
				return "Request Payment";
			case "send_money":
				return "Send Payment";
		}
	};

	const getDescriptionPlaceholder = () => {
		switch (paymentType) {
			case "request_help":
				return "e.g., Help me move furniture, Pick me up from airport...";
			case "request_money":
				return "e.g., Dinner we split last night, Concert ticket...";
			case "send_money":
				return "e.g., Thanks for dinner, Paying you back...";
		}
	};

	const getSelectedProofType = () => {
		return (
			PROOF_TYPE_OPTIONS.find((option) => option.id === formData.proofType) ||
			PROOF_TYPE_OPTIONS[0]
		);
	};

	const isSubmitDisabled = formData.amount <= 0 || !formData.description.trim();

	return (
		<View style={styles.container}>
			{/* Username Display - Centered */}
			<View style={styles.userSection}>
				<Text style={styles.userDisplayText}>@username</Text>
			</View>

			{/* Amount Display */}
			<View style={styles.amountSection}>
				<Text style={styles.currencySymbol}>$</Text>
				<TextInput
					style={styles.amountInput}
					value={formData.amount > 0 ? formData.amount.toString() : ""}
					onChangeText={(text) => {
						const amount = parseFloat(text) || 0;
						setFormData((prev) => ({ ...prev, amount }));
					}}
					placeholder="0"
					placeholderTextColor="#ccc"
					keyboardType="numeric"
				/>
			</View>

			{/* Proof Type Chip Dropdown */}
			<View style={styles.proofSection}>
				<Pressable
					style={styles.proofChipButton}
					onPress={() => setShowProofDropdown(!showProofDropdown)}
				>
					<Ionicons
						name={getSelectedProofType().icon as any}
						size={16}
						color={formData.proofType === "none" ? "#ff6b6b" : "#666"}
					/>
					<Text
						style={[
							styles.proofChipText,
							formData.proofType === "none" && styles.proofChipTextDisabled,
						]}
					>
						{getSelectedProofType().label}
					</Text>
					<Ionicons
						name={showProofDropdown ? "chevron-up" : "chevron-down"}
						size={16}
						color="#666"
					/>
				</Pressable>

				{/* Dropdown Menu */}
				{showProofDropdown && (
					<View style={styles.dropdownMenu}>
						{PROOF_TYPE_OPTIONS.map((option) => (
							<Pressable
								key={option.id}
								style={[
									styles.dropdownMenuItem,
									option.disabled && styles.dropdownMenuItemDisabled,
								]}
								onPress={() => {
									if (!option.disabled) {
										setFormData((prev) => ({ ...prev, proofType: option.id }));
									}
									setShowProofDropdown(false);
								}}
								disabled={option.disabled}
							>
								<Ionicons
									name={option.icon as any}
									size={16}
									color={option.disabled ? "#ff6b6b" : "#333"}
								/>
								<Text
									style={[
										styles.dropdownMenuItemText,
										option.disabled && styles.dropdownMenuItemTextDisabled,
									]}
								>
									{option.label}
								</Text>
							</Pressable>
						))}
					</View>
				)}
			</View>

			{/* Description Input */}
			<View style={styles.descriptionSection}>
				<TextInput
					style={styles.descriptionInput}
					value={formData.description}
					onChangeText={(text) =>
						setFormData((prev) => ({ ...prev, description: text }))
					}
					placeholder={getDescriptionPlaceholder()}
					placeholderTextColor="#999"
					multiline
					textAlign="center"
				/>
			</View>

			{/* Action Button */}
			<Pressable
				style={[
					styles.actionButton,
					isSubmitDisabled && styles.actionButtonDisabled,
				]}
				onPress={handleSubmit}
				disabled={isSubmitDisabled}
			>
				<Text style={styles.actionButtonText}>{getSubmitButtonText()}</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8f8f8",
		paddingHorizontal: 20,
		alignItems: "center",
		justifyContent: "flex-start",
		paddingTop: 40,
	},

	// User Selection Section - Centered
	userSection: {
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 40,
		width: "100%",
	},

	userDisplayText: {
		fontSize: 18,
		fontWeight: "500",
		color: "#999",
		textAlign: "center",
	},

	// Amount Display
	amountSection: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 40,
		gap: 0,
	},

	currencySymbol: {
		fontSize: 64,
		fontWeight: "300",
		color: "#333",
	},

	amountInput: {
		fontSize: 64,
		fontWeight: "300",
		color: "#333",
		textAlign: "center",
		minWidth: 40,
	},

	// Proof Section - Small chip style
	proofSection: {
		marginBottom: 40,
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		zIndex: 1000,
	},

	proofChipButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#fff",
		borderRadius: 20,
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderWidth: 1,
		borderColor: "#e0e0e0",
		gap: 6,
		alignSelf: "center",
	},

	proofChipText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#666",
	},

	proofChipTextDisabled: {
		color: "#ff6b6b",
	},

	// Dropdown Menu Styles
	dropdownMenu: {
		position: "absolute",
		top: 42,
		backgroundColor: "#fff",
		borderRadius: 12,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: "#e0e0e0",
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 4,
		minWidth: 150,
		zIndex: 1001,
	},

	dropdownMenuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		gap: 10,
	},

	dropdownMenuItemDisabled: {
		opacity: 0.5,
	},

	dropdownMenuItemText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#333",
	},

	dropdownMenuItemTextDisabled: {
		color: "#ff6b6b",
	},

	// Description Section
	descriptionSection: {
		width: "100%",
		marginBottom: 40,
	},

	descriptionInput: {
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: "#e0e0e0",
		fontSize: 16,
		color: "#333",
		textAlign: "center",
		minHeight: 60,
	},

	// Action Button
	actionButton: {
		backgroundColor: "#333",
		borderRadius: 24,
		paddingVertical: 20,
		paddingHorizontal: 40,
		width: "100%",
		alignItems: "center",
		marginBottom: 40,
	},

	actionButtonDisabled: {
		backgroundColor: "#ccc",
	},

	actionButtonText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#fff",
	},

	// Modal Styles (kept for potential future use)
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},

	modalContent: {
		backgroundColor: "#fff",
		borderRadius: 20,
		padding: 30,
		width: "90%",
		maxWidth: 320,
		alignItems: "center",
		gap: 20,
	},

	modalTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#333",
	},

	amountModalInput: {
		fontSize: 48,
		fontWeight: "300",
		color: "#333",
		textAlign: "center",
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
		paddingVertical: 10,
		minWidth: 200,
	},

	modalButton: {
		backgroundColor: "#007AFF",
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 24,
	},

	modalButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},

	// Legacy Dropdown Styles (now unused)
	dropdownContent: {
		backgroundColor: "#fff",
		borderRadius: 16,
		margin: 20,
		padding: 8,
		shadowColor: "#000",
		shadowOpacity: 0.15,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 8,
	},

	dropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 20,
		gap: 12,
	},

	dropdownItemDisabled: {
		opacity: 0.5,
	},

	dropdownItemText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
	},

	dropdownItemTextDisabled: {
		color: "#ff6b6b",
	},

	// User search styles
	searchResults: {
		backgroundColor: "#fff",
		borderRadius: 16,
		margin: 20,
		padding: 8,
		shadowColor: "#000",
		shadowOpacity: 0.15,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 8,
		maxHeight: 200,
	},

	searchResultItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 20,
		gap: 12,
	},

	searchUserAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#007AFF",
		alignItems: "center",
		justifyContent: "center",
	},

	searchUserAvatarText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},

	searchUserInfo: {
		flex: 1,
	},

	searchUserName: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
	},

	searchUserUsername: {
		fontSize: 14,
		color: "#666",
	},
});

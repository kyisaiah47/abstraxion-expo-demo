import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Pressable,
	Alert,
	ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PaymentFormData, PaymentType, ProofType } from "@/types/proofpay";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import {
	useSocialOperations,
	useUserByUsername,
} from "@/hooks/useSocialContract";
import { formatXionAmount } from "@/lib/socialContract";

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

export default function SocialPaymentForm(props: SocialPaymentFormProps) {
	const { paymentType, onSubmit } = props;
	const [formData, setFormData] = useState<PaymentFormData>({
		type: paymentType,
		amount: 0,
		description: "",
		proofType: "none",
	});
	const [recipient, setRecipient] = useState("");
	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [showProofDropdown, setShowProofDropdown] = useState(false);

	// Wallet and contract hooks
	const { data: account, isConnected } = useAbstraxionAccount();
	const { client: signingClient } = useAbstraxionSigningClient();
	const { sendDirectPayment, createPaymentRequest, createHelpRequest } =
		useSocialOperations(signingClient);
	const {
		user,
		loading: userLoading,
		refetch: refetchUser,
	} = useUserByUsername(recipient);

	// Update form type when prop changes
	useEffect(() => {
		setFormData((prev) => ({ ...prev, type: paymentType }));
	}, [paymentType]);

	// Validate recipient username existence
	useEffect(() => {
		if (recipient && /^[a-zA-Z0-9_]{3,50}$/.test(recipient)) {
			refetchUser();
		}
	}, [recipient, refetchUser]);

	const handleSubmit = async () => {
		if (!isConnected || !account?.bech32Address || !signingClient) {
			Alert.alert("Wallet Not Connected", "Please connect your wallet.");
			return;
		}
		if (!recipient || !/^[a-zA-Z0-9_]{3,50}$/.test(recipient)) {
			Alert.alert("Error", "Enter a valid recipient username.");
			return;
		}
		if (userLoading) {
			Alert.alert("Checking recipient", "Please wait...");
			return;
		}
		if (!user) {
			Alert.alert("Error", "Recipient username not found.");
			return;
		}
		if (formData.amount <= 0) {
			Alert.alert("Error", "Please enter a valid amount");
			return;
		}
		if (!formData.description.trim()) {
			Alert.alert("Error", "Please add a description");
			return;
		}
		setLoading(true);
		setFeedback(null);
		try {
			const payload = {
				to_username: recipient,
				amount: formatXionAmount(formData.amount),
				description: formData.description,
				payment_type: paymentType,
				proof_type: formData.proofType,
			};
			if (paymentType === "send_money") {
				await sendDirectPayment(account.bech32Address, payload);
			} else if (paymentType === "request_money") {
				await createPaymentRequest(account.bech32Address, payload);
			} else if (paymentType === "request_help") {
				await createHelpRequest(account.bech32Address, payload);
			}
			setFeedback("Transaction submitted successfully!");
			onSubmit(formData);
		} catch (err: any) {
			setFeedback(err?.message || "Transaction failed. Please try again.");
		} finally {
			setLoading(false);
		}
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

	const isSubmitDisabled =
		!recipient ||
		!user ||
		formData.amount <= 0 ||
		!formData.description.trim() ||
		loading ||
		userLoading;

	return (
		<View style={styles.container}>
			{/* Recipient Username Input */}
			<View style={styles.userSection}>
				<TextInput
					style={styles.userDisplayText}
					value={recipient}
					onChangeText={setRecipient}
					placeholder="Recipient username"
					placeholderTextColor="#999"
					autoCapitalize="none"
					autoCorrect={false}
					editable={!loading}
				/>
				{userLoading && (
					<Text style={{ color: "#666", marginTop: 4 }}>
						Checking username...
					</Text>
				)}
				{recipient && !userLoading && !user && (
					<Text style={{ color: "#ff6b6b", marginTop: 4 }}>User not found</Text>
				)}
				{recipient && !userLoading && user && (
					<Text style={{ color: "#4caf50", marginTop: 4 }}>User found</Text>
				)}
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
					editable={!loading}
				/>
			</View>

			{/* Proof Type Chip Dropdown */}
			<View style={styles.proofSection}>
				<Pressable
					style={styles.proofChipButton}
					onPress={() => setShowProofDropdown(!showProofDropdown)}
					disabled={loading}
				>
					<Ionicons
						name={getSelectedProofType().icon as any}
						size={16}
						color={
							formData.proofType === "zktls"
								? "#1976D2"
								: formData.proofType === "none"
								? "#ff6b6b"
								: "#666"
						}
					/>
					<Text
						style={[
							styles.proofChipText,
							formData.proofType === "none" && styles.proofChipTextDisabled,
							formData.proofType === "zktls" && { color: "#1976D2" },
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
								disabled={option.disabled || loading}
							>
								<Ionicons
									name={option.icon as any}
									size={16}
									color={
										option.id === "zktls" && formData.proofType === "zktls"
											? "#1976D2"
											: option.disabled
											? "#ff6b6b"
											: "#333"
									}
								/>
								<Text
									style={[
										styles.dropdownMenuItemText,
										option.disabled && styles.dropdownMenuItemTextDisabled,
										option.id === "zktls" &&
											formData.proofType === "zktls" && { color: "#1976D2" },
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
					editable={!loading}
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
				{loading ? (
					<ActivityIndicator color="#fff" />
				) : (
					<Text style={styles.actionButtonText}>{getSubmitButtonText()}</Text>
				)}
			</Pressable>
			{feedback && (
				<Text
					style={{
						color: feedback.includes("success") ? "#4caf50" : "#ff6b6b",
						marginTop: 12,
						textAlign: "center",
					}}
				>
					{feedback}
				</Text>
			)}
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

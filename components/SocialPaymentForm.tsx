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
import {
	PaymentFormData,
	PaymentType,
	ProofType,
	User,
} from "@/types/proofpay";

interface SocialPaymentFormProps {
	paymentType: PaymentType;
	onSubmit: (payload: PaymentFormData) => void;
}

const PROOF_TYPE_OPTIONS = [
	{
		id: "none" as ProofType,
		label: "None",
		icon: "ban",
		disabled: true,
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

	const [selectedUser] = useState<User | null>(null);
	const [showProofDropdown, setShowProofDropdown] = useState(false);
	const [showAmountModal, setShowAmountModal] = useState(false);
	const [cursorVisible, setCursorVisible] = useState(true);

	// Blinking cursor animation
	useEffect(() => {
		const interval = setInterval(() => {
			setCursorVisible((prev) => !prev);
		}, 500);
		return () => clearInterval(interval);
	}, []);

	// Update form type when prop changes
	useEffect(() => {
		setFormData((prev) => ({ ...prev, type: paymentType }));
	}, [paymentType]);

	const formatAmount = (amount: number) => {
		if (amount === 0) return "$0";
		return `$${amount.toLocaleString()}`;
	};

	const handleSubmit = () => {
		// Validation
		if (!selectedUser) {
			Alert.alert("Error", "Please select a recipient");
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

		onSubmit(formData);
	};

	const getSubmitButtonText = () => {
		switch (paymentType) {
			case "request_help":
				return "Ask for Help";
			case "request_money":
				return "Request";
			case "send_money":
				return "Pay";
		}
	};

	const isSubmitDisabled =
		!selectedUser || formData.amount <= 0 || !formData.description.trim();

	return (
		<View style={styles.container}>
			{/* User Avatar Section */}
			<Pressable
				style={styles.avatarSection}
				onPress={() => {}}
			>
				<View style={styles.avatarContainer}>
					{selectedUser ? (
						<View style={styles.avatar}>
							<Text style={styles.avatarText}>
								{selectedUser.displayName.charAt(0).toUpperCase()}
							</Text>
						</View>
					) : (
						<View style={styles.avatarPlaceholder}>
							<Ionicons
								name="camera"
								size={40}
								color="#999"
							/>
						</View>
					)}
					<View style={styles.addIcon}>
						<Ionicons
							name="add"
							size={20}
							color="#007AFF"
						/>
					</View>
				</View>
				{selectedUser ? (
					<Text style={styles.userName}>{selectedUser.displayName}</Text>
				) : (
					<Text style={styles.userNamePlaceholder}>Select User</Text>
				)}
			</Pressable>

			{/* Amount Display */}
			<Pressable
				style={styles.amountSection}
				onPress={() => setShowAmountModal(true)}
			>
				<Text style={styles.amountText}>
					{formatAmount(formData.amount)}
					{cursorVisible && <Text style={styles.cursor}>|</Text>}
				</Text>
			</Pressable>

			{/* Proof Type Dropdown */}
			<View style={styles.proofSection}>
				<Pressable
					style={styles.proofDropdownButton}
					onPress={() => setShowProofDropdown(true)}
				>
					<Ionicons
						name="shield-outline"
						size={20}
						color="#666"
					/>
					<Text style={styles.proofDropdownText}>Proof type</Text>
					<Ionicons
						name="chevron-down"
						size={20}
						color="#666"
					/>
				</Pressable>
			</View>

			{/* Description Input */}
			<View style={styles.descriptionSection}>
				<TextInput
					style={styles.descriptionInput}
					value={formData.description}
					onChangeText={(text) =>
						setFormData((prev) => ({ ...prev, description: text }))
					}
					placeholder="What's this for?"
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

			{/* Amount Modal */}
			<Modal
				visible={showAmountModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowAmountModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Enter Amount</Text>
						<TextInput
							style={styles.amountModalInput}
							value={formData.amount > 0 ? formData.amount.toString() : ""}
							onChangeText={(text) => {
								const amount = parseFloat(text) || 0;
								setFormData((prev) => ({ ...prev, amount }));
							}}
							placeholder="0"
							keyboardType="numeric"
							autoFocus
						/>
						<Pressable
							style={styles.modalButton}
							onPress={() => setShowAmountModal(false)}
						>
							<Text style={styles.modalButtonText}>Done</Text>
						</Pressable>
					</View>
				</View>
			</Modal>

			{/* Proof Dropdown Modal */}
			<Modal
				visible={showProofDropdown}
				transparent
				animationType="fade"
				onRequestClose={() => setShowProofDropdown(false)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setShowProofDropdown(false)}
				>
					<View style={styles.dropdownContent}>
						{PROOF_TYPE_OPTIONS.map((option) => (
							<Pressable
								key={option.id}
								style={[
									styles.dropdownItem,
									option.disabled && styles.dropdownItemDisabled,
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
									size={20}
									color={option.disabled ? "#ff6b6b" : "#333"}
								/>
								<Text
									style={[
										styles.dropdownItemText,
										option.disabled && styles.dropdownItemTextDisabled,
									]}
								>
									{option.label}
								</Text>
							</Pressable>
						))}
					</View>
				</Pressable>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8f8f8",
		paddingHorizontal: 20,
		alignItems: "center",
		justifyContent: "space-between",
	},

	// User Avatar Section
	avatarSection: {
		alignItems: "center",
		marginTop: 60,
	},

	avatarContainer: {
		position: "relative",
		marginBottom: 16,
	},

	avatar: {
		width: 120,
		height: 120,
		borderRadius: 12,
		backgroundColor: "#007AFF",
		alignItems: "center",
		justifyContent: "center",
	},

	avatarPlaceholder: {
		width: 120,
		height: 120,
		borderRadius: 12,
		backgroundColor: "#e0e0e0",
		alignItems: "center",
		justifyContent: "center",
	},

	avatarText: {
		fontSize: 48,
		fontWeight: "600",
		color: "#fff",
	},

	addIcon: {
		position: "absolute",
		top: -5,
		right: -5,
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
	},

	userName: {
		fontSize: 24,
		fontWeight: "600",
		color: "#333",
	},

	userNamePlaceholder: {
		fontSize: 24,
		fontWeight: "600",
		color: "#999",
	},

	// Amount Display
	amountSection: {
		alignItems: "center",
		marginVertical: 60,
	},

	amountText: {
		fontSize: 64,
		fontWeight: "300",
		color: "#333",
		textAlign: "center",
	},

	cursor: {
		fontSize: 64,
		fontWeight: "300",
		color: "#007AFF",
	},

	// Proof Section
	proofSection: {
		marginVertical: 60,
		width: "100%",
	},

	proofDropdownButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#fff",
		borderRadius: 16,
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderWidth: 1,
		borderColor: "#e0e0e0",
		gap: 8,
	},

	proofDropdownText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#666",
	},

	// Description Section
	descriptionSection: {
		width: "100%",
		marginVertical: 60,
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
		minHeight: 80,
	},

	// Action Button
	actionButton: {
		backgroundColor: "#333",
		borderRadius: 24,
		paddingVertical: 20,
		paddingHorizontal: 40,
		width: "100%",
		alignItems: "center",
		marginBottom: 60,
	},

	actionButtonDisabled: {
		backgroundColor: "#ccc",
	},

	actionButtonText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#fff",
	},

	// Modal Styles
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

	// Dropdown Styles
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

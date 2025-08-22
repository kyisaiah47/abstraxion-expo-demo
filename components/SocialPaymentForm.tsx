import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Pressable,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import {
	PaymentFormData,
	PaymentType,
	ProofType,
	User,
} from "@/types/proofpay";
import { UserService } from "@/lib/userService";

interface SocialPaymentFormProps {
	paymentType: PaymentType;
	onSubmit: (payload: PaymentFormData) => void;
}

const PROOF_TYPE_OPTIONS = [
	{
		id: "none" as ProofType,
		icon: "ban" as const,
		emoji: "🚫",
	},
	{
		id: "text" as ProofType,
		icon: "chatbubble-outline" as const,
		emoji: "💬",
	},
	{
		id: "photo" as ProofType,
		icon: "camera-outline" as const,
		emoji: "📸",
	},
	{
		id: "zktls" as ProofType,
		icon: "shield-checkmark-outline" as const,
		emoji: "🔒",
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

	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);

	// Update form type when prop changes
	useEffect(() => {
		setFormData((prev) => ({ ...prev, type: paymentType }));
	}, [paymentType]);

	// Handle user search
	useEffect(() => {
		const searchUsers = async () => {
			if (searchQuery.trim().length < 2) {
				setSearchResults([]);
				return;
			}

			try {
				const results = await UserService.searchUsers(searchQuery);
				setSearchResults(results);
			} catch (error) {
				console.error("Search error:", error);
			}
		};

		const debounceTimer = setTimeout(searchUsers, 300);
		return () => clearTimeout(debounceTimer);
	}, [searchQuery]);

	const handleUserSelect = (user: User) => {
		setSelectedUser(user);
		setFormData((prev) => ({ ...prev, recipientUserId: user.id }));
		setSearchQuery(user.displayName);
		setSearchResults([]);
	};

	const clearSelectedUser = () => {
		setSelectedUser(null);
		setFormData((prev) => ({ ...prev, recipientUserId: undefined }));
		setSearchQuery("");
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

	const getFormLabels = () => {
		switch (paymentType) {
			case "request_help":
				return {
					title: "Request Help",
					recipientLabel: "Who can help you?",
					amountLabel: "Thank you amount",
					descriptionLabel: "What do you need help with?",
					descriptionPlaceholder:
						"e.g., Help me move furniture, Pick me up from airport...",
					proofLabel: "How should they confirm completion?",
					submitText: "Ask for Help",
					submitIcon: "heart" as const,
				};
			case "request_money":
				return {
					title: "Request Money",
					recipientLabel: "Who owes you money?",
					amountLabel: "Amount to request",
					descriptionLabel: "What's this for?",
					descriptionPlaceholder:
						"e.g., Dinner we split last night, Concert ticket...",
					proofLabel: "What proof do you want?",
					submitText: "Request Payment",
					submitIcon: "card-outline" as const,
				};
			case "send_money":
				return {
					title: "Send Money",
					recipientLabel: "Who are you paying?",
					amountLabel: "Amount to send",
					descriptionLabel: "What's this for?",
					descriptionPlaceholder: "e.g., Thanks for dinner, Paying you back...",
					proofLabel: "What proof do you need?",
					submitText: "Send Money",
					submitIcon: "send" as const,
				};
		}
	};

	const labels = getFormLabels();
	const isSubmitDisabled =
		!selectedUser || formData.amount <= 0 || !formData.description.trim();

	return (
		<View style={styles.container}>
			<View style={styles.formSection}>
				{/* Horizontal Row: Person Search + Amount */}
				<View style={styles.horizontalInputRow}>
					{/* User Search/Selection */}
					<View style={[styles.inputContainer, styles.personInputContainer]}>
						<Text style={styles.inputLabel}>
							{labels.recipientLabel} <Text style={styles.required}>*</Text>
						</Text>

						{selectedUser ? (
							<View style={styles.selectedUserContainer}>
								<View style={styles.selectedUserInfo}>
									<View style={styles.avatarPlaceholder}>
										<Text style={styles.avatarText}>
											{selectedUser.displayName.charAt(0).toUpperCase()}
										</Text>
									</View>
									<View style={styles.userTextContainer}>
										<Text style={styles.selectedUserName}>
											{selectedUser.displayName}
										</Text>
										<Text style={styles.selectedUserUsername}>
											@{selectedUser.username}
										</Text>
									</View>
								</View>
								<Pressable
									onPress={clearSelectedUser}
									style={styles.clearButton}
								>
									<Ionicons
										name="close-circle"
										size={20}
										color={DesignSystem.colors.text.secondary}
									/>
								</Pressable>
							</View>
						) : (
							<>
								<TextInput
									style={styles.textInput}
									value={searchQuery}
									onChangeText={setSearchQuery}
									placeholder="Search name or username..."
									placeholderTextColor={DesignSystem.colors.text.tertiary}
								/>

								{searchResults.length > 0 && (
									<View style={styles.searchResults}>
										{searchResults.map((user) => (
											<Pressable
												key={user.id}
												style={styles.searchResultItem}
												onPress={() => handleUserSelect(user)}
											>
												<View style={styles.avatarPlaceholder}>
													<Text style={styles.avatarText}>
														{user.displayName.charAt(0).toUpperCase()}
													</Text>
												</View>
												<View style={styles.userTextContainer}>
													<Text style={styles.userName}>
														{user.displayName}
													</Text>
													<Text style={styles.userUsername}>
														@{user.username}
													</Text>
												</View>
											</Pressable>
										))}
									</View>
								)}
							</>
						)}
					</View>

					{/* Amount Input */}
					<View style={[styles.inputContainer, styles.amountInputWrapper]}>
						<Text style={styles.inputLabel}>
							{labels.amountLabel} <Text style={styles.required}>*</Text>
						</Text>
						<View style={styles.amountInputContainer}>
							<Text style={styles.currencySymbol}>$</Text>
							<TextInput
								style={styles.amountInput}
								value={formData.amount > 0 ? formData.amount.toString() : ""}
								onChangeText={(text) => {
									const amount = parseFloat(text) || 0;
									setFormData((prev) => ({ ...prev, amount }));
								}}
								placeholder="0"
								placeholderTextColor={DesignSystem.colors.text.tertiary}
								keyboardType="numeric"
							/>
						</View>
					</View>
				</View>

				{/* Description Input - Full Width */}
				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>
						{labels.descriptionLabel} <Text style={styles.required}>*</Text>
					</Text>
					<TextInput
						style={[styles.textInput, styles.textArea]}
						value={formData.description}
						onChangeText={(text) =>
							setFormData((prev) => ({ ...prev, description: text }))
						}
						placeholder={labels.descriptionPlaceholder}
						placeholderTextColor={DesignSystem.colors.text.tertiary}
						multiline
						numberOfLines={2}
						textAlignVertical="top"
					/>
				</View>

				{/* Proof Type Selector - Horizontal Icon Radio Buttons */}
				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>Proof:</Text>
					<View style={styles.proofTypeContainer}>
						{PROOF_TYPE_OPTIONS.map((option) => (
							<Pressable
								key={option.id}
								style={[
									styles.proofIconButton,
									formData.proofType === option.id &&
										styles.proofIconButtonActive,
								]}
								onPress={() =>
									setFormData((prev) => ({ ...prev, proofType: option.id }))
								}
							>
								<Text
									style={[
										styles.proofIconEmoji,
										formData.proofType === option.id &&
											styles.proofIconEmojiActive,
									]}
								>
									{option.emoji}
								</Text>
							</Pressable>
						))}
					</View>
				</View>
			</View>

			{/* Submit Button */}
			<Pressable
				style={[
					styles.submitButton,
					isSubmitDisabled && styles.submitButtonDisabled,
				]}
				onPress={handleSubmit}
				disabled={isSubmitDisabled}
			>
				<Ionicons
					name={labels.submitIcon}
					size={20}
					color={
						isSubmitDisabled
							? DesignSystem.colors.text.tertiary
							: DesignSystem.colors.text.inverse
					}
				/>
				<Text
					style={[
						styles.submitButtonText,
						isSubmitDisabled && styles.submitButtonTextDisabled,
					]}
				>
					{labels.submitText}
				</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	formSection: {
		gap: DesignSystem.spacing["2xl"], // More white space between sections
		marginBottom: DesignSystem.spacing["2xl"],
	},

	// Horizontal Layout for Person + Amount
	horizontalInputRow: {
		flexDirection: "row",
		gap: DesignSystem.spacing.lg,
	},

	personInputContainer: {
		flex: 7, // 70% width
	},

	amountInputWrapper: {
		flex: 3, // 30% width
	},

	inputContainer: {
		gap: DesignSystem.spacing.sm,
	},

	inputLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.secondary,
	},

	required: {
		color: DesignSystem.colors.status.error,
	},

	textInput: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
		minHeight: 48, // Slightly smaller for compact design
	},

	textArea: {
		minHeight: 64, // Reduced from 80 for more compact design
		textAlignVertical: "top",
	},

	// User Selection Styles
	selectedUserContainer: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.md, // Reduced padding
		borderWidth: 1,
		borderColor: DesignSystem.colors.primary[800],
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		minHeight: 48,
	},

	selectedUserInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},

	avatarPlaceholder: {
		width: 32, // Smaller avatar
		height: 32,
		borderRadius: 16,
		backgroundColor: DesignSystem.colors.primary[800],
		alignItems: "center",
		justifyContent: "center",
		marginRight: DesignSystem.spacing.sm,
	},

	avatarText: {
		...DesignSystem.typography.label.small,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	userTextContainer: {
		flex: 1,
	},

	selectedUserName: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
		fontSize: 14,
	},

	selectedUserUsername: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		fontSize: 12,
	},

	userName: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
	},

	userUsername: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},

	clearButton: {
		padding: DesignSystem.spacing.xs,
	},

	searchResults: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		maxHeight: 160, // Reduced max height
		position: "absolute",
		top: "100%",
		left: 0,
		right: 0,
		zIndex: 1000,
		...DesignSystem.shadows.lg,
	},

	searchResultItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: DesignSystem.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: DesignSystem.colors.border.tertiary,
	},

	// Amount Input Styles - Venmo-like
	amountInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 2, // Thicker border for prominence
		borderColor: DesignSystem.colors.border.secondary,
		paddingHorizontal: DesignSystem.spacing.lg,
		minHeight: 48,
	},

	currencySymbol: {
		...DesignSystem.typography.h3, // Large and prominent like Venmo
		color: DesignSystem.colors.primary[800],
		marginRight: DesignSystem.spacing.xs,
		fontWeight: "600",
	},

	amountInput: {
		flex: 1,
		...DesignSystem.typography.h3, // Large amount input like Venmo
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
		textAlign: "left",
	},

	// Proof Type Selector - Icon Radio Buttons
	proofTypeContainer: {
		flexDirection: "row",
		gap: DesignSystem.spacing.md,
		justifyContent: "space-between",
	},

	proofIconButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderWidth: 2,
		borderColor: DesignSystem.colors.border.secondary,
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},

	proofIconButtonActive: {
		borderColor: DesignSystem.colors.primary[800],
		backgroundColor:
			DesignSystem.colors.primary[50] || DesignSystem.colors.surface.secondary,
		...DesignSystem.shadows.sm,
	},

	proofIconEmoji: {
		fontSize: 20,
	},

	proofIconEmojiActive: {
		fontSize: 22, // Slightly larger when active
	},

	// Submit Button Styles - Prominent
	submitButton: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"], // Larger padding for prominence
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.sm,
		...DesignSystem.shadows.lg,
		minHeight: 56, // Taller button
		marginTop: DesignSystem.spacing.xl,
	},

	submitButtonText: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	submitButtonDisabled: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},

	submitButtonTextDisabled: {
		color: DesignSystem.colors.text.tertiary,
	},
});

import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Pressable,
	Alert,
	ScrollView,
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
		label: "No proof needed",
		subtitle: "Just trust",
		icon: "heart-outline" as const,
	},
	{
		id: "text" as ProofType,
		label: "Tell me what you did",
		subtitle: "Simple description",
		icon: "chatbubble-outline" as const,
	},
	{
		id: "photo" as ProofType,
		label: "Send a photo",
		subtitle: "Visual confirmation",
		icon: "camera-outline" as const,
	},
	{
		id: "zktls" as ProofType,
		label: "zkTLS verification",
		subtitle: "Cryptographic proof",
		icon: "shield-checkmark-outline" as const,
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
	const [isSearching, setIsSearching] = useState(false);

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

			setIsSearching(true);
			try {
				const results = await UserService.searchUsers(searchQuery);
				setSearchResults(results);
			} catch (error) {
				console.error("Search error:", error);
			} finally {
				setIsSearching(false);
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
		<ScrollView
			style={styles.container}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.formSection}>
				{/* User Search/Selection */}
				<View style={styles.inputContainer}>
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
									size={24}
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
								placeholder="Search by name or username..."
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
												<Text style={styles.userName}>{user.displayName}</Text>
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
				<View style={styles.inputContainer}>
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
							placeholder="0.00"
							placeholderTextColor={DesignSystem.colors.text.tertiary}
							keyboardType="numeric"
						/>
					</View>
				</View>

				{/* Description Input */}
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
						numberOfLines={3}
						textAlignVertical="top"
					/>
				</View>

				{/* Proof Type Selector */}
				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>{labels.proofLabel}</Text>
					<View style={styles.proofTypeContainer}>
						{PROOF_TYPE_OPTIONS.map((option) => (
							<Pressable
								key={option.id}
								style={[
									styles.proofTypeOption,
									formData.proofType === option.id &&
										styles.proofTypeOptionActive,
								]}
								onPress={() =>
									setFormData((prev) => ({ ...prev, proofType: option.id }))
								}
							>
								<View style={styles.proofTypeOptionContent}>
									<View style={styles.proofTypeHeader}>
										<Ionicons
											name={option.icon}
											size={20}
											color={
												formData.proofType === option.id
													? DesignSystem.colors.primary[800]
													: DesignSystem.colors.text.secondary
											}
										/>
										<View style={styles.proofTypeTextContainer}>
											<Text
												style={[
													styles.proofTypeLabel,
													formData.proofType === option.id &&
														styles.proofTypeLabelActive,
												]}
											>
												{option.label}
											</Text>
											<Text style={styles.proofTypeSubtitle}>
												{option.subtitle}
											</Text>
										</View>
									</View>
									{formData.proofType === option.id && (
										<Ionicons
											name="checkmark-circle"
											size={20}
											color={DesignSystem.colors.primary[800]}
										/>
									)}
								</View>
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
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	formSection: {
		gap: DesignSystem.spacing["3xl"],
		marginBottom: DesignSystem.spacing["4xl"],
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
		minHeight: 100,
		textAlignVertical: "top",
	},

	// User Selection Styles
	selectedUserContainer: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.primary[800],
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	selectedUserInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},

	avatarPlaceholder: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: DesignSystem.colors.primary[800],
		alignItems: "center",
		justifyContent: "center",
		marginRight: DesignSystem.spacing.md,
	},

	avatarText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	userTextContainer: {
		flex: 1,
	},

	selectedUserName: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
	},

	selectedUserUsername: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
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
		maxHeight: 200,
	},

	searchResultItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: DesignSystem.spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: DesignSystem.colors.border.tertiary,
	},

	// Amount Input Styles
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

	// Proof Type Selector Styles
	proofTypeContainer: {
		gap: DesignSystem.spacing.md,
	},

	proofTypeOption: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		padding: DesignSystem.spacing.lg,
	},

	proofTypeOptionActive: {
		borderColor: DesignSystem.colors.primary[800],
		backgroundColor:
			DesignSystem.colors.primary[50] || DesignSystem.colors.surface.elevated,
	},

	proofTypeOptionContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	proofTypeHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.md,
		flex: 1,
	},

	proofTypeTextContainer: {
		flex: 1,
	},

	proofTypeLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
	},

	proofTypeLabelActive: {
		color: DesignSystem.colors.primary[800],
		fontWeight: "600",
	},

	proofTypeSubtitle: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		marginTop: 2,
	},

	// Submit Button Styles
	submitButton: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.md,
		...DesignSystem.shadows.lg,
		minHeight: 56,
		marginBottom: DesignSystem.spacing["4xl"],
	},

	submitButtonText: {
		...DesignSystem.typography.label.large,
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

import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Pressable,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PaymentFormData, PaymentType, ProofType } from "@/types/proofpay";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import {
	useSocialOperations,
	useUserByUsername,
	useUserFriends,
	useSearchUsers,
	useUserProfile,
} from "@/hooks/useSocialContract";
import { User, formatXionAmount } from "@/lib/socialContract";
import { useTheme } from "@/contexts/ThemeContext";
import ZkTLSSelectionModal from "./ZkTLSSelectionModal";
import { ZKTLS_OPTIONS } from "@/constants/zkTLSOptions";

interface SocialPaymentFormProps {
	paymentType: PaymentType;
	onSubmit: (payload: PaymentFormData) => void;
}

const PROOF_TYPE_OPTIONS = [
	{
		id: "soft" as ProofType,
		label: "Soft Proof",
		sublabel: "(manual approval)",
		icon: "document-text-outline",
		description: "📝 Manual review and approval",
		disabled: false,
	},
	{
		id: "zktls" as ProofType,
		label: "zkTLS Proof",
		sublabel: "(instant auto-release)",
		icon: "shield-checkmark-outline",
		description: "🔒 Instant verification & release",
		disabled: false,
	},
	{
		id: "hybrid" as ProofType,
		label: "Hybrid",
		sublabel: "(zkTLS + 24h review)",
		icon: "time-outline",
		description: "⏳ Auto-verify + dispute window",
		disabled: false,
		recommended: true,
	},
];

export default function SocialPaymentForm(props: SocialPaymentFormProps) {
	const { paymentType, onSubmit } = props;
	const { colors } = useTheme();
	const [formData, setFormData] = useState<PaymentFormData>({
		type: paymentType,
		amount: 0,
		description: "",
		proofType: "soft",
	});
	const [amountText, setAmountText] = useState("");
	const [recipient, setRecipient] = useState("");
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [showProofDropdown, setShowProofDropdown] = useState(false);
	const [showFriendSuggestions, setShowFriendSuggestions] = useState(false);
	const [debouncedRecipient, setDebouncedRecipient] = useState("");
	const [reviewWindow, setReviewWindow] = useState(24);
	const [showZkTLSModal, setShowZkTLSModal] = useState(false);
	const [selectedZkTLSOption, setSelectedZkTLSOption] = useState("custom");
	const [showCompletionView, setShowCompletionView] = useState(false);
	const [completionData, setCompletionData] = useState<{
		type: 'payment' | 'request';
		txHash?: string;
		requestId?: string;
		amount: number;
		recipient: string;
		paymentType: string;
	} | null>(null);

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

	// Friend suggestions
	const { user: currentUser } = useUserProfile(account?.bech32Address ?? "");
	const { friends } = useUserFriends(currentUser?.username ?? "");
	const { users: searchResults } = useSearchUsers(debouncedRecipient);

	// Update form type when prop changes
	useEffect(() => {
		setFormData((prev) => ({ ...prev, type: paymentType }));
	}, [paymentType]);

	// Debounce recipient input for search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedRecipient(recipient);
		}, 300);
		return () => clearTimeout(timer);
	}, [recipient]);

	// Validate recipient username existence
	useEffect(() => {
		if (recipient && /^[a-zA-Z0-9_]{1,50}$/.test(recipient)) {
			refetchUser();
		}
	}, [recipient, refetchUser]);

	// Show friend suggestions when typing
	useEffect(() => {
		const shouldShow = recipient.length > 0 && !selectedUser && !user && !userLoading;
		setShowFriendSuggestions(shouldShow);
	}, [recipient, selectedUser, user, userLoading]);

	// Clear selectedUser when recipient changes (manual typing)
	useEffect(() => {
		if (selectedUser && recipient !== selectedUser.username) {
			setSelectedUser(null);
		}
	}, [recipient, selectedUser]);

	const handleSubmit = async () => {
		if (!isConnected || !account?.bech32Address || !signingClient) {
			Toast.show({
				type: "error",
				text1: "Wallet Not Connected",
				text2: "Please connect your wallet.",
				position: "bottom",
			});
			return;
		}
		if (!recipient || !/^[a-zA-Z0-9_]{1,50}$/.test(recipient)) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Enter a valid recipient username.",
				position: "bottom",
			});
			return;
		}
		const recipientUser = selectedUser || user;
		if (!selectedUser && userLoading) {
			Toast.show({
				type: "info",
				text1: "Checking recipient",
				text2: "Please wait...",
				position: "bottom",
			});
			return;
		}
		if (!recipientUser) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Recipient username not found.",
				position: "bottom",
			});
			return;
		}
		if (!recipientUser.wallet_address) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Recipient wallet address not found. They may need to complete their profile setup.",
				position: "bottom",
			});
			return;
		}
		
		if (formData.amount <= 0) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Please enter a valid amount",
				position: "bottom",
			});
			return;
		}
		if (!formData.description.trim()) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: "Please add a description",
				position: "bottom",
			});
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

			let result;
			if (paymentType === "send_money") {
				// Actual blockchain transaction
				result = await sendDirectPayment(
					recipientUser.username,
					payload.amount,
					payload.description,
					account.bech32Address
				);
			} else if (paymentType === "request_money" || paymentType === "request_task") {
				if (!currentUser?.username) {
					throw new Error("Current user profile not found");
				}

				// Add request to activity feed
				try {
					const { supabaseServiceClient } = await import("@/lib/supabase");
					
					const requestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
						const r = Math.random() * 16 | 0;
						const v = c == 'x' ? r : (r & 0x3 | 0x8);
						return v.toString(16);
					});

					const { data, error } = await supabaseServiceClient
						.from('activity_feed')
						.insert({
							actor: currentUser.username,
							verb: paymentType === 'request_money' ? 'request_money' : 'created_task',
							meta: {
								amount: parseFloat(formData.amount) * 1000000, // Convert to uxion
								description: formData.description,
								to_username: recipientUser.username,
								request_id: requestId,
								status: 'pending',
								proof_type: formData.proofType
							}
						})
						.select()
						.single();

					if (error) {
						throw new Error(`Failed to create request: ${error.message}`);
					}

					result = { id: requestId, type: 'request', data };
				} catch (dbError) {
					console.error('Database error:', dbError);
					throw new Error(`Failed to save request: ${dbError.message}`);
				}
			}

			// Show completion view for all successful actions
			if (result?.type === 'request') {
				setCompletionData({
					type: 'request',
					requestId: result.id,
					amount: formData.amount,
					recipient: recipientUser.display_name || recipientUser.username,
					paymentType: paymentType
				});
				setShowCompletionView(true);
			} else {
				const txHash = result?.transactionHash || result?.txhash || result?.hash;
				if (txHash) {
					setCompletionData({
						type: 'payment',
						txHash: txHash,
						amount: formData.amount,
						recipient: recipientUser.display_name || recipientUser.username,
						paymentType: paymentType
					});
					setShowCompletionView(true);
					
					// Store blockchain transaction in database for activity feed
					try {
						const { supabaseServiceClient } = await import("@/lib/supabase");
						const { data: { user } } = await supabaseServiceClient.auth.getUser();
						
						if (user) {
							await supabaseServiceClient.from('transactions').insert({
								id: txHash,
								from_user: account.bech32Address,
								to_user: recipientUser.wallet_address,
								to_username: recipientUser.username,
								amount: formData.amount,
								description: formData.description,
								payment_type: paymentType,
								proof_type: formData.proofType,
								status: "completed",
								created_at: new Date().toISOString(),
								created_by: user.id
							});
						}
					} catch (dbError) {
						console.error("Error storing transaction in database:", dbError);
						// Don't fail the whole transaction if database storage fails
					}
				} else {
					setFeedback("Transaction submitted successfully!");
				}
			}
			
			onSubmit(formData);
		} catch (err: any) {
			console.error("💥 Transaction failed:", err);
			console.error("💥 Error message:", err?.message);
			console.error("💥 Full error:", err);

			// Check if it's a contract method not found error
			if (
				err?.message?.includes("Invalid type") ||
				err?.message?.includes("unknown request")
			) {
				setFeedback(
					"Payment features are currently in development. Smart contract methods not yet deployed."
				);
			} else if (err?.message?.includes("Insufficient funds")) {
				setFeedback(
					`Insufficient funds. You need ${formData.amount} XION + gas fees. ${
						paymentType === "request_task" || paymentType === "request_money"
							? "Note: Requests should not require funds - this may be a contract issue."
							: ""
					}`
				);
			} else if (err?.message?.includes("User not found")) {
				setFeedback(
					`User "${recipient}" hasn't completed their ProofPay registration in the smart contract. They may need to finish their profile setup to receive payments.`
				);
			} else {
				setFeedback(err?.message || "Transaction failed. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	const getSubmitButtonText = () => {
		switch (paymentType) {
			case "request_task":
				return "Create Task";
			case "request_money":
				return "Request Payment";
			case "send_money":
				return "Send Payment";
		}
	};

	const getDescriptionPlaceholder = () => {
		switch (paymentType) {
			case "request_task":
				return "e.g., Review my code, Design a logo, Write documentation...";
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

	const getSelectedZkTLSOption = () => {
		return (
			ZKTLS_OPTIONS.find((option) => option.id === selectedZkTLSOption) ||
			ZKTLS_OPTIONS[ZKTLS_OPTIONS.length - 1] // default to custom
		);
	};

	const getSuggestions = () => {
		if (!showFriendSuggestions || recipient.length === 0) return [];

		const friendSuggestions =
			friends?.filter(
				(friend) =>
					// Exclude current user
					friend.username !== currentUser?.username &&
					(friend.username.toLowerCase().includes(recipient.toLowerCase()) ||
					(friend.display_name &&
						friend.display_name.toLowerCase().includes(recipient.toLowerCase())))
			) || [];

		const searchSuggestions =
			searchResults?.filter(
				(user) =>
					// Exclude current user
					user.username !== currentUser?.username &&
					(user.username.toLowerCase().includes(recipient.toLowerCase()) ||
					(user.display_name &&
						user.display_name.toLowerCase().includes(recipient.toLowerCase())))
			) || [];

		const combined = [...friendSuggestions, ...searchSuggestions];
		const unique = combined.filter(
			(user, index, arr) =>
				arr.findIndex((u) => u.username === user.username) === index
		);

		return unique.slice(0, 10); // Limit to 10 suggestions with scroll
	};

	const recipientUser = selectedUser || user;
	const isSubmitDisabled =
		!recipient ||
		!recipientUser ||
		formData.amount <= 0 ||
		!formData.description.trim() ||
		loading ||
		(!selectedUser && userLoading);

	const styles = createStyles(colors);

	// Show completion view instead of form when completed
	if (showCompletionView && completionData) {
		return (
			<View style={styles.completionContainer}>
				<View style={styles.completionContent}>
					{/* Big checkmark icon */}
					<View style={styles.checkmarkContainer}>
						<Ionicons 
							name="checkmark-circle" 
							size={80} 
							color={colors.status?.success || colors.primary[700]} 
						/>
					</View>
					
					{/* Success message */}
					<Text style={[styles.completionTitle, { color: colors.text.primary }]}>
						{completionData.type === 'payment' ? 'Payment Sent!' : 'Request Sent!'}
					</Text>
					
					{/* Transaction details */}
					<View style={styles.completionDetails}>
						<Text style={[styles.completionAmount, { color: colors.text.primary }]}>
							{completionData.amount} XION
						</Text>
						<Text style={[styles.completionRecipient, { color: colors.text.secondary }]}>
							to {completionData.recipient}
						</Text>
					</View>
					
					{/* Transaction/Request ID */}
					{completionData.txHash && (
						<View style={styles.txHashContainer}>
							<Text style={[styles.txHashLabel, { color: colors.text.tertiary }]}>
								Transaction Hash
							</Text>
							<Text style={[styles.txHashValue, { color: colors.text.secondary }]}>
								{completionData.txHash.slice(0, 8)}...{completionData.txHash.slice(-6)}
							</Text>
						</View>
					)}
					
					{completionData.requestId && (
						<View style={styles.txHashContainer}>
							<Text style={[styles.txHashLabel, { color: colors.text.tertiary }]}>
								Request ID
							</Text>
							<Text style={[styles.txHashValue, { color: colors.text.secondary }]}>
								{completionData.requestId.slice(0, 8)}
							</Text>
						</View>
					)}
					
					{/* Action buttons */}
					<View style={styles.completionActions}>
						<Pressable 
							style={[styles.completionButton, { backgroundColor: colors.primary[700] }]}
							onPress={() => {
								setShowCompletionView(false);
								setCompletionData(null);
								// Reset form
								setRecipient("");
								setSelectedUser(null);
								setFormData({
									type: paymentType,
									amount: 0,
									description: "",
									proofType: "soft",
								});
								setAmountText("");
								setFeedback(null);
							}}
						>
							<Text style={[styles.completionButtonText, { color: colors.text.inverse }]}>
								Create Another
							</Text>
						</Pressable>
						
						<Pressable 
							style={[styles.completionButtonSecondary, { borderColor: colors.border.secondary }]}
							onPress={() => router.push("/(tabs)/activity")}
						>
							<Text style={[styles.completionButtonSecondaryText, { color: colors.text.primary }]}>
								View Activity
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.scrollContent}
		>
			{/* Recipient Username Input */}
			<View style={styles.userSection}>
				{selectedUser ? (
					/* Selected User Chip */
					<View style={styles.selectedUserChip}>
						<View style={styles.chipAvatar}>
							<Text style={styles.chipAvatarText}>
								{(selectedUser.display_name || selectedUser.username).charAt(0).toUpperCase()}
							</Text>
						</View>
						<Text style={styles.chipUsername}>
							{selectedUser.display_name || selectedUser.username}
						</Text>
						<Pressable
							style={styles.chipRemoveButton}
							onPress={() => {
								setRecipient("");
								setSelectedUser(null);
								setShowFriendSuggestions(false);
							}}
						>
							<Ionicons
								name="close"
								size={18}
								color={colors.text.secondary}
							/>
						</Pressable>
					</View>
				) : (
					/* Username Input */
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.userDisplayText}
							value={recipient}
							onChangeText={setRecipient}
							placeholder="@username"
							placeholderTextColor={colors.text.tertiary}
							autoCapitalize="none"
							autoCorrect={false}
							editable={!loading}
							onFocus={() =>
								setShowFriendSuggestions(recipient.length > 0 && !recipientUser)
							}
						/>
						{userLoading && (
							<View style={styles.loadingIndicator}>
								<Text style={styles.statusText}>Checking...</Text>
							</View>
						)}
						{recipient && !userLoading && !recipientUser && !showFriendSuggestions && (
							<Text style={styles.statusTextError}>User not found</Text>
						)}
					</View>
				)}

				{/* Friend Suggestions Dropdown */}
				{showFriendSuggestions && getSuggestions().length > 0 && (
					<View style={styles.suggestionsContainer}>
						<ScrollView
							style={styles.suggestionsScrollView}
							showsVerticalScrollIndicator={true}
							keyboardShouldPersistTaps="handled"
						>
							{getSuggestions().map((suggestion) => (
								<Pressable
									key={suggestion.username}
									style={styles.suggestionItem}
									onPress={() => {
										setRecipient(suggestion.username);
										setSelectedUser(suggestion);
										setShowFriendSuggestions(false);
									}}
								>
									<View style={styles.suggestionAvatar}>
										<Text style={styles.suggestionAvatarText}>
											{(suggestion.display_name || suggestion.username)
												.charAt(0)
												.toUpperCase()}
										</Text>
									</View>
									<View style={styles.suggestionInfo}>
										<Text style={styles.suggestionName}>
											{suggestion.display_name || suggestion.username}
										</Text>
										<Text style={styles.suggestionUsername}>
											@{suggestion.username}
										</Text>
									</View>
									{friends?.some((f) => f.username === suggestion.username) && (
										<View style={styles.friendBadge}>
											<Text style={styles.friendBadgeText}>Friend</Text>
										</View>
									)}
								</Pressable>
							))}
						</ScrollView>
					</View>
				)}
			</View>

			{/* Amount Display */}
			<View style={styles.amountSection}>
				<TextInput
					style={styles.amountInput}
					value={amountText}
					onChangeText={(text) => {
						setAmountText(text);
						const amount = parseFloat(text) || 0;
						setFormData((prev) => ({ ...prev, amount }));
					}}
					placeholder="0"
					placeholderTextColor={colors.text.tertiary}
					keyboardType="numeric"
					editable={!loading}
				/>
				<Text style={styles.currencySymbol}>XION</Text>
			</View>

			{/* Proof Type Chip Dropdown - Only for task requests */}
			{paymentType === "request_task" && (
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
								? colors.primary[700]
								: formData.proofType === "soft"
								? colors.status?.warning || colors.primary[600]
								: "#666"
						}
					/>
					<Text
						style={[
							styles.proofChipText,
							formData.proofType === "soft" && styles.proofChipTextDisabled,
							formData.proofType === "zktls" && { color: colors.primary[700] },
						]}
					>
						{getSelectedProofType().label}
					</Text>
					<Ionicons
						name={showProofDropdown ? "chevron-up" : "chevron-down"}
						size={16}
						color={colors.text.secondary}
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
											? colors.primary[700]
											: option.disabled
											? colors.status?.error || colors.primary[600]
											: "#333"
									}
								/>
								<Text
									style={[
										styles.dropdownMenuItemText,
										option.disabled && styles.dropdownMenuItemTextDisabled,
										option.id === "zktls" &&
											formData.proofType === "zktls" && {
												color: colors.primary[700],
											},
									]}
								>
									{option.label}
								</Text>
							</Pressable>
						))}
					</View>
				)}
			</View>
			)}

			{/* Simple proof type info - Only for task requests */}
			{paymentType === "request_task" && (
			<Text style={styles.proofTypeHint}>
				{getSelectedProofType().sublabel}
			</Text>
			)}

			{/* zkTLS and Review Window Row */}
			{paymentType === "request_task" &&
				(formData.proofType === "zktls" || formData.proofType === "hybrid") && (
					<View style={styles.zkTLSReviewRow}>
						{/* zkTLS Options - Navigate to selection */}
						<View style={styles.zkTLSSection}>
							<Pressable
								style={styles.zkTLSChipButton}
								onPress={() => setShowZkTLSModal(true)}
								disabled={loading}
							>
								<Ionicons
									name={getSelectedZkTLSOption().icon as any}
									size={16}
									color={colors.primary[700]}
								/>
								<Text
									style={[styles.zkTLSChipText, { color: colors.primary[700] }]}
								>
									{getSelectedZkTLSOption().label}
								</Text>
								<Ionicons
									name="chevron-forward"
									size={16}
									color={colors.text.secondary}
								/>
							</Pressable>
						</View>

						{/* Review Window - only for hybrid */}
						{formData.proofType === "hybrid" && (
							<View style={styles.reviewWindowSection}>
								<View
									style={[styles.compactTextInput, styles.hoursInputWrapper]}
								>
									<TextInput
										style={styles.hoursTextInput}
										value={reviewWindow.toString()}
										onChangeText={(text) =>
											setReviewWindow(parseInt(text) || 24)
										}
										placeholder="24"
										placeholderTextColor={colors.text.tertiary}
										keyboardType="numeric"
										editable={!loading}
									/>
									<Text style={styles.hoursLabel}>Hrs</Text>
								</View>
							</View>
						)}
					</View>
				)}

			{/* Description Input */}
			<View style={styles.descriptionSection}>
				<TextInput
					style={styles.descriptionInput}
					value={formData.description}
					onChangeText={(text) =>
						setFormData((prev) => ({ ...prev, description: text }))
					}
					placeholder={getDescriptionPlaceholder()}
					placeholderTextColor={colors.text.tertiary}
					multiline
					textAlign="center"
					editable={!loading}
				/>
			</View>

			{/* Action Button */}
			<Pressable
				style={[
					styles.actionButton,
					{
						backgroundColor: isSubmitDisabled
							? colors.text.secondary
							: colors.text.primary,
					},
					isSubmitDisabled && styles.actionButtonDisabled,
				]}
				onPress={handleSubmit}
				disabled={isSubmitDisabled}
			>
				{loading ? (
					<ActivityIndicator color={colors.surface.primary} />
				) : (
					<Text
						style={[
							styles.actionButtonText,
							{
								color: isSubmitDisabled
									? colors.text.tertiary
									: colors.surface.primary,
							},
						]}
					>
						{getSubmitButtonText()}
					</Text>
				)}
			</Pressable>
			{feedback && (
				<Text
					style={{
						color: feedback.includes("success")
							? colors.status?.success || colors.primary[700]
							: colors.status?.error || colors.primary[600],
						marginTop: 12,
						textAlign: "center",
					}}
				>
					{feedback}
				</Text>
			)}

			{/* zkTLS Selection Modal */}
			<ZkTLSSelectionModal
				visible={showZkTLSModal}
				selectedOption={selectedZkTLSOption}
				onSelect={setSelectedZkTLSOption}
				onClose={() => setShowZkTLSModal(false)}
			/>
		</ScrollView>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.surface.primary,
		},

		scrollContent: {
			paddingHorizontal: 20,
			paddingTop: 40,
			paddingBottom: 20,
			alignItems: "center",
		},

		// User Selection Section - Centered
		userSection: {
			alignItems: "center",
			justifyContent: "center",
			width: "100%",
			position: "relative",
			zIndex: 1000,
		},

		inputContainer: {
			width: "100%",
			alignItems: "center",
			position: "relative",
		},

		userDisplayText: {
			fontSize: 18,
			fontWeight: "500",
			color: colors.text.tertiary,
			textAlign: "center",
		},

		userDisplayTextValid: {
			color: colors.text.primary,
		},

		loadingIndicator: {
			marginTop: 8,
			alignItems: "center",
		},

		statusText: {
			fontSize: 14,
			color: colors.text.secondary,
			fontStyle: "italic",
		},

		statusTextError: {
			fontSize: 14,
			color: colors.status?.error || colors.primary[600],
			marginTop: 8,
			textAlign: "center",
		},

		statusTextSuccess: {
			fontSize: 14,
			color: colors.text.primary,
			fontWeight: "500",
		},

		userFoundIndicator: {
			marginTop: 8,
			alignItems: "center",
			backgroundColor: colors.surface.secondary,
			borderRadius: 8,
			paddingVertical: 6,
			paddingHorizontal: 12,
		},

		// Friend Suggestions
		suggestionsContainer: {
			position: "absolute",
			top: 25,
			left: 0,
			right: 0,
			backgroundColor: colors.surface.elevated,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.border.secondary,
			shadowColor: "#000",
			shadowOpacity: 0.1,
			shadowRadius: 12,
			shadowOffset: { width: 0, height: 4 },
			elevation: 8,
			maxHeight: 200,
			zIndex: 1001,
		},

		suggestionsScrollView: {
			maxHeight: 200,
		},

		suggestionItem: {
			flexDirection: "row",
			alignItems: "center",
			paddingVertical: 12,
			paddingHorizontal: 16,
			borderBottomWidth: 1,
			borderBottomColor: colors.border.tertiary,
		},

		suggestionAvatar: {
			width: 36,
			height: 36,
			borderRadius: 18,
			backgroundColor: colors.primary[800],
			alignItems: "center",
			justifyContent: "center",
			marginRight: 12,
		},

		suggestionAvatarText: {
			fontSize: 14,
			fontWeight: "600",
			color: colors.text.inverse,
		},

		suggestionInfo: {
			flex: 1,
		},

		suggestionName: {
			fontSize: 16,
			fontWeight: "500",
			color: colors.text.primary,
		},

		suggestionUsername: {
			fontSize: 14,
			color: colors.text.secondary,
			marginTop: 2,
		},

		friendBadge: {
			backgroundColor: colors.primary[50] || colors.surface.tertiary,
			borderRadius: 6,
			paddingVertical: 2,
			paddingHorizontal: 6,
		},

		friendBadgeText: {
			fontSize: 10,
			color: colors.primary[700],
			fontWeight: "500",
		},

		// Selected User Chip
		selectedUserChip: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: colors.surface.primary,
			borderRadius: 16,
			paddingVertical: 4,
			paddingHorizontal: 12,
			gap: 6,
			borderWidth: 1,
			borderColor: colors.border.tertiary,
			alignSelf: "center",
		},

		chipAvatar: {
			width: 20,
			height: 20,
			borderRadius: 10,
			backgroundColor: "#666",
			alignItems: "center",
			justifyContent: "center",
		},

		chipAvatarText: {
			fontSize: 10,
			fontWeight: "600",
			color: colors.text.inverse,
		},

		chipUsername: {
			fontSize: 14,
			fontWeight: "400",
			color: colors.text.secondary,
		},

		chipRemoveButton: {
			width: 18,
			height: 18,
			borderRadius: 9,
			backgroundColor: colors.surface.tertiary,
			alignItems: "center",
			justifyContent: "center",
		},

		// Amount Display
		amountSection: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			marginBottom: 80,
			marginTop: 80,
			gap: 12,
		},

		currencySymbol: {
			fontSize: 64,
			fontWeight: "300",
			color: colors.text.primary,
		},

		amountInput: {
			fontSize: 64,
			fontWeight: "300",
			color: colors.text.primary,
			textAlign: "center",
			minWidth: 40,
		},

		// Proof Section - Small chip style
		proofSection: {
			marginBottom: 4,
			alignItems: "center",
			justifyContent: "center",
			position: "relative",
			zIndex: 999,
		},

		proofChipButton: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: colors.surface.elevated,
			borderRadius: 20,
			paddingVertical: 12,
			paddingHorizontal: 18,
			borderWidth: 1,
			borderColor: colors.border.secondary,
			gap: 8,
			alignSelf: "center",
			shadowColor: "#000",
			shadowOpacity: 0.05,
			shadowRadius: 6,
			shadowOffset: { width: 0, height: 2 },
			elevation: 2,
		},

		proofChipText: {
			fontSize: 14,
			fontWeight: "500",
			color: colors.text.primary,
		},

		proofChipTextDisabled: {
			color: colors.status?.error || colors.primary[600],
		},

		// Dropdown Menu Styles
		dropdownMenu: {
			position: "absolute",
			top: 52,
			left: -20,
			right: -20,
			backgroundColor: colors.surface.elevated,
			borderRadius: 12,
			paddingVertical: 8,
			borderWidth: 1,
			borderColor: colors.border.secondary,
			shadowColor: "#000",
			shadowOpacity: 0.1,
			shadowRadius: 8,
			shadowOffset: { width: 0, height: 2 },
			elevation: 4,
			minWidth: 200,
			maxWidth: 300,
			alignSelf: "center",
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
			color: colors.text.primary,
		},

		dropdownMenuItemTextDisabled: {
			color: colors.status?.error || colors.primary[600],
		},

		recommendedBadge: {
			fontSize: 9,
			fontWeight: "700",
			color: colors.primary[700],
			backgroundColor: colors.primary[100],
			paddingHorizontal: 6,
			paddingVertical: 2,
			borderRadius: 8,
			marginLeft: 6,
			textTransform: "uppercase",
			letterSpacing: 0.5,
		},

		// Simple proof type hint
		proofTypeHint: {
			fontSize: 12,
			color: colors.text.tertiary,
			textAlign: "center",
			marginTop: 0,
			marginBottom: 32,
			fontStyle: "italic",
		},

		// Compact Input Sections
		compactInputSection: {
			width: "100%",
			marginBottom: 20,
			alignItems: "center",
		},

		compactInputLabel: {
			fontSize: 12,
			fontWeight: "500",
			color: colors.text.secondary,
			marginBottom: 6,
			textAlign: "center",
		},

		compactTextInput: {
			backgroundColor: colors.surface.secondary,
			borderRadius: 8,
			paddingVertical: 10,
			paddingHorizontal: 12,
			borderWidth: 1,
			borderColor: colors.border.secondary,
			fontSize: 14,
			color: colors.text.primary,
			width: "100%",
		},

		numericInput: {
			maxWidth: 100,
			textAlign: "center",
			alignSelf: "center",
		},

		// Hybrid fields on same line
		hybridFieldsRow: {
			flexDirection: "row",
			width: "100%",
			marginBottom: 20,
			gap: 12,
		},

		hybridFieldContainer: {
			flex: 2,
		},

		hybridFieldContainerSmall: {
			flex: 1,
		},

		// Description Section
		descriptionSection: {
			width: "100%",
			marginBottom: 40,
		},

		descriptionInput: {
			backgroundColor: colors.surface.elevated,
			borderRadius: 16,
			padding: 20,
			borderWidth: 1,
			borderColor: colors.border.secondary,
			fontSize: 16,
			color: colors.text.primary,
			textAlign: "center",
			minHeight: 80,
			shadowColor: "#000",
			shadowOpacity: 0.05,
			shadowRadius: 8,
			shadowOffset: { width: 0, height: 2 },
			elevation: 2,
		},

		// Action Button
		actionButton: {
			backgroundColor: colors.text.primary,
			borderRadius: 24,
			paddingVertical: 18,
			paddingHorizontal: 40,
			width: "100%",
			alignItems: "center",
			marginBottom: 40,
			shadowColor: colors.surface.overlay,
			shadowOpacity: 0.1,
			shadowRadius: 6,
			shadowOffset: { width: 0, height: 2 },
			elevation: 3,
		},

		actionButtonDisabled: {
			backgroundColor: colors.surface.tertiary,
			shadowOpacity: 0,
			elevation: 0,
		},

		actionButtonText: {
			fontSize: 18,
			fontWeight: "600",
			color: colors.surface.primary,
		},

		// Modal Styles (kept for potential future use)
		modalOverlay: {
			flex: 1,
			backgroundColor: colors.surface.overlay,
			justifyContent: "center",
			alignItems: "center",
			padding: 20,
		},

		modalContent: {
			backgroundColor: colors.surface.elevated,
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
			color: colors.text.primary,
		},

		amountModalInput: {
			fontSize: 48,
			fontWeight: "300",
			color: colors.text.primary,
			textAlign: "center",
			borderBottomWidth: 1,
			borderBottomColor: colors.border.secondary,
			paddingVertical: 10,
			minWidth: 200,
		},

		modalButton: {
			backgroundColor: colors.primary[800],
			borderRadius: 12,
			paddingVertical: 12,
			paddingHorizontal: 24,
		},

		modalButtonText: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.text.inverse,
		},

		// Legacy Dropdown Styles (now unused)
		dropdownContent: {
			backgroundColor: colors.surface.elevated,
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
			color: colors.text.primary,
		},

		dropdownItemTextDisabled: {
			color: colors.status?.error || colors.primary[600],
		},

		// User search styles
		searchResults: {
			backgroundColor: colors.surface.elevated,
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
			backgroundColor: colors.primary[800],
			alignItems: "center",
			justifyContent: "center",
		},

		searchUserAvatarText: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.text.inverse,
		},

		searchUserInfo: {
			flex: 1,
		},

		searchUserName: {
			fontSize: 16,
			fontWeight: "500",
			color: colors.text.primary,
		},

		searchUserUsername: {
			fontSize: 14,
			color: colors.text.secondary,
		},

		// zkTLS and Review Window Row
		zkTLSReviewRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 16,
			marginBottom: 16,
			paddingHorizontal: 20,
		},

		// zkTLS Dropdown Styles
		zkTLSSection: {
			flex: 1,
			alignItems: "stretch",
			position: "relative",
		},

		reviewWindowSection: {
			alignItems: "center",
			width: 80,
		},

		hoursInputWrapper: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			gap: 8,
			width: 80,
		},

		hoursTextInput: {
			flex: 1,
			fontSize: 14,
			color: colors.text.primary,
			textAlign: "center",
			padding: 0,
		},

		hoursLabel: {
			fontSize: 14,
			fontWeight: "500",
			color: colors.text.secondary,
		},

		zkTLSChipButton: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: colors.surface.elevated,
			borderRadius: 12,
			paddingVertical: 10,
			paddingHorizontal: 12,
			gap: 8,
			borderWidth: 1,
			borderColor: colors.primary[300] || colors.border.secondary,
		},

		zkTLSChipText: {
			fontSize: 14,
			fontWeight: "500",
			flex: 1,
		},

		// Completion View Styles
		completionContainer: {
			flex: 1,
			backgroundColor: colors.surface.primary,
			justifyContent: "center",
			alignItems: "center",
			padding: 20,
		},

		completionContent: {
			alignItems: "center",
			gap: 24,
			width: "100%",
			maxWidth: 320,
		},

		checkmarkContainer: {
			marginBottom: 8,
		},

		completionTitle: {
			fontSize: 28,
			fontWeight: "600",
			textAlign: "center",
			marginBottom: 8,
		},

		completionDetails: {
			alignItems: "center",
			gap: 12,
			width: "100%",
		},

		completionAmount: {
			fontSize: 24,
			fontWeight: "500",
			color: colors.text.primary,
			textAlign: "center",
		},

		completionRecipient: {
			fontSize: 16,
			color: colors.text.secondary,
			textAlign: "center",
		},

		txHashContainer: {
			backgroundColor: colors.surface.elevated,
			borderRadius: 12,
			padding: 16,
			width: "100%",
			alignItems: "center",
			gap: 8,
			borderWidth: 1,
			borderColor: colors.border.secondary,
		},

		txHashLabel: {
			fontSize: 14,
			fontWeight: "500",
			color: colors.text.secondary,
		},

		txHashValue: {
			fontSize: 12,
			color: colors.text.primary,
			fontFamily: "monospace",
			textAlign: "center",
		},

		completionActions: {
			flexDirection: "row",
			gap: 12,
			width: "100%",
			marginTop: 16,
		},

		completionButton: {
			flex: 1,
			backgroundColor: colors.text.primary,
			borderRadius: 24,
			paddingVertical: 16,
			paddingHorizontal: 24,
			alignItems: "center",
		},

		completionButtonText: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.surface.primary,
		},

		completionButtonSecondary: {
			flex: 1,
			backgroundColor: colors.surface.elevated,
			borderRadius: 24,
			paddingVertical: 16,
			paddingHorizontal: 24,
			alignItems: "center",
			borderWidth: 1,
			borderColor: colors.border.secondary,
		},

		completionButtonSecondaryText: {
			fontSize: 16,
			fontWeight: "500",
			color: colors.text.primary,
		},
	});

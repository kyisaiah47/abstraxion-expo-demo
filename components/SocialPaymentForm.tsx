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
	useUserFriends,
	useSearchUsers,
	useUserProfile,
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
	const [amountText, setAmountText] = useState("");
	const [recipient, setRecipient] = useState("");
	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [showProofDropdown, setShowProofDropdown] = useState(false);
	const [showFriendSuggestions, setShowFriendSuggestions] = useState(false);
	const [debouncedRecipient, setDebouncedRecipient] = useState("");

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
		if (recipient && /^[a-zA-Z0-9_]{3,50}$/.test(recipient)) {
			refetchUser();
		}
	}, [recipient, refetchUser]);

	// Show friend suggestions when typing
	useEffect(() => {
		const shouldShow = recipient.length > 0 && !user && !userLoading;
		setShowFriendSuggestions(shouldShow);
	}, [recipient, user, userLoading]);

	const handleSubmit = async () => {
		console.log("🚀 SUBMIT DEBUG - Starting submission...");
		console.log("📋 Form Data:", {
			paymentType,
			recipient,
			amount: formData.amount,
			description: formData.description,
			proofType: formData.proofType
		});
		console.log("👤 User Info:", { user, userLoading });
		console.log("🔗 Wallet Info:", { 
			isConnected, 
			address: account?.bech32Address, 
			hasSigningClient: !!signingClient 
		});
		
		// DEBUG: Check current user registration
		console.log("🔍 DEBUG - Checking user registration...");
		if (currentUser) {
			console.log("✅ Current user found:", currentUser);
		} else {
			console.log("❌ Current user not found - this might be the issue!");
			console.log("📱 Account address:", account?.bech32Address);
			
			// Try to manually query for the user
			try {
				console.log("🔍 Attempting manual user lookup...");
				const client = await import("@cosmjs/cosmwasm-stargate").then(m => m.CosmWasmClient.connect(
					process.env.EXPO_PUBLIC_RPC_ENDPOINT || "https://rpc.xion-testnet-2.burnt.com:443"
				));
				const result = await client.queryContractSmart(
					process.env.EXPO_PUBLIC_CONTRACT_ADDRESS || "xion1lxcdce37k8n4zyanq3ne5uw958cj0r6mnrr4kdpzrylvsanfcvpq0gzrxy",
					{ get_user_by_wallet: { wallet_address: account?.bech32Address } }
				);
				console.log("🔍 Manual lookup result:", result);
			} catch (lookupError: any) {
				console.log("❌ Manual lookup failed:", lookupError.message);
			}
		}

		if (!isConnected || !account?.bech32Address || !signingClient) {
			console.log("❌ Wallet not connected");
			Alert.alert("Wallet Not Connected", "Please connect your wallet.");
			return;
		}
		if (!recipient || !/^[a-zA-Z0-9_]{3,50}$/.test(recipient)) {
			console.log("❌ Invalid recipient:", recipient);
			Alert.alert("Error", "Enter a valid recipient username.");
			return;
		}
		if (userLoading) {
			console.log("⏳ User still loading");
			Alert.alert("Checking recipient", "Please wait...");
			return;
		}
		if (!user) {
			console.log("❌ User not found");
			Alert.alert("Error", "Recipient username not found.");
			return;
		}
		if (formData.amount <= 0) {
			console.log("❌ Invalid amount:", formData.amount);
			Alert.alert("Error", "Please enter a valid amount");
			return;
		}
		if (!formData.description.trim()) {
			console.log("❌ No description");
			Alert.alert("Error", "Please add a description");
			return;
		}

		console.log("✅ All validations passed, proceeding...");
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
			console.log("📦 Final payload:", payload);
			console.log("💰 Formatted amount:", formatXionAmount(formData.amount));

			if (paymentType === "send_money") {
				console.log("💸 Calling sendDirectPayment...");
				await sendDirectPayment(
					payload.to_username,
					payload.amount,
					payload.description,
					account.bech32Address
				);
				console.log("✅ sendDirectPayment completed");
			} else if (paymentType === "request_money") {
				console.log("💳 Calling createPaymentRequest...");
				await createPaymentRequest(
					payload.to_username,
					payload.amount,
					payload.description,
					account.bech32Address
				);
				console.log("✅ createPaymentRequest completed");
			} else if (paymentType === "request_help") {
				console.log("🙏 Calling createHelpRequest...");
				await createHelpRequest(
					payload.to_username,
					payload.amount,
					payload.description,
					account.bech32Address
				);
				console.log("✅ createHelpRequest completed");
			}
			
			console.log("🎉 Transaction submitted successfully!");
			setFeedback("Transaction submitted successfully!");
			onSubmit(formData);
		} catch (err: any) {
			console.error("💥 Transaction failed:", err);
			console.error("💥 Error message:", err?.message);
			console.error("💥 Full error:", err);
			
			// Check if it's a contract method not found error
			if (err?.message?.includes("Invalid type") || err?.message?.includes("unknown request")) {
				setFeedback("Payment features are currently in development. Smart contract methods not yet deployed.");
			} else if (err?.message?.includes("Insufficient funds")) {
				setFeedback(`Insufficient funds. You need ${formData.amount} XION + gas fees. ${paymentType === 'request_help' || paymentType === 'request_money' ? 'Note: Requests should not require funds - this may be a contract issue.' : ''}`);
			} else {
				setFeedback(err?.message || "Transaction failed. Please try again.");
			}
		} finally {
			setLoading(false);
			console.log("🏁 Submit process finished");
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

	const getSuggestions = () => {
		if (!showFriendSuggestions || recipient.length === 0) return [];
		
		const friendSuggestions = friends?.filter(friend => 
			friend.username.toLowerCase().includes(recipient.toLowerCase()) ||
			(friend.display_name && friend.display_name.toLowerCase().includes(recipient.toLowerCase()))
		) || [];
		
		const searchSuggestions = searchResults?.filter(user => 
			user.username.toLowerCase().includes(recipient.toLowerCase()) ||
			(user.display_name && user.display_name.toLowerCase().includes(recipient.toLowerCase()))
		) || [];
		
		const combined = [...friendSuggestions, ...searchSuggestions];
		const unique = combined.filter((user, index, arr) => 
			arr.findIndex(u => u.username === user.username) === index
		);
		
		return unique.slice(0, 5); // Limit to 5 suggestions
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
				{user ? (
					/* Selected User Chip */
					<View style={styles.selectedUserChip}>
						<View style={styles.chipAvatar}>
							<Text style={styles.chipAvatarText}>
								{(user.display_name || user.username).charAt(0).toUpperCase()}
							</Text>
						</View>
						<Text style={styles.chipUsername}>{user.display_name || user.username}</Text>
						<Pressable 
							style={styles.chipRemoveButton}
							onPress={() => {
								setRecipient("");
								setShowFriendSuggestions(false);
							}}
						>
							<Ionicons name="close" size={18} color="#666" />
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
							placeholderTextColor="#999"
							autoCapitalize="none"
							autoCorrect={false}
							editable={!loading}
							onFocus={() => setShowFriendSuggestions(recipient.length > 0 && !user)}
						/>
						{userLoading && (
							<View style={styles.loadingIndicator}>
								<Text style={styles.statusText}>Checking...</Text>
							</View>
						)}
						{recipient && !userLoading && !user && !showFriendSuggestions && (
							<Text style={styles.statusTextError}>User not found</Text>
						)}
					</View>
				)}
				
				{/* Friend Suggestions Dropdown */}
				{showFriendSuggestions && getSuggestions().length > 0 && (
					<View style={styles.suggestionsContainer}>
						{getSuggestions().map((suggestion) => (
							<Pressable
								key={suggestion.username}
								style={styles.suggestionItem}
								onPress={() => {
									setRecipient(suggestion.username);
									setShowFriendSuggestions(false);
								}}
							>
								<View style={styles.suggestionAvatar}>
									<Text style={styles.suggestionAvatarText}>
										{(suggestion.display_name || suggestion.username).charAt(0).toUpperCase()}
									</Text>
								</View>
								<View style={styles.suggestionInfo}>
									<Text style={styles.suggestionName}>
										{suggestion.display_name || suggestion.username}
									</Text>
									<Text style={styles.suggestionUsername}>@{suggestion.username}</Text>
								</View>
								{friends?.some(f => f.username === suggestion.username) && (
									<View style={styles.friendBadge}>
										<Text style={styles.friendBadgeText}>Friend</Text>
									</View>
								)}
							</Pressable>
						))}
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
					placeholderTextColor="#ccc"
					keyboardType="numeric"
					editable={!loading}
				/>
				<Text style={styles.currencySymbol}>XION</Text>
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
		color: "#999",
		textAlign: "center",
	},

	userDisplayTextValid: {
		color: "#333",
	},

	loadingIndicator: {
		marginTop: 8,
		alignItems: "center",
	},

	statusText: {
		fontSize: 14,
		color: "#666",
		fontStyle: "italic",
	},

	statusTextError: {
		fontSize: 14,
		color: "#ff6b6b",
		marginTop: 8,
		textAlign: "center",
	},

	statusTextSuccess: {
		fontSize: 14,
		color: "#333",
		fontWeight: "500",
	},

	userFoundIndicator: {
		marginTop: 8,
		alignItems: "center",
		backgroundColor: "#f5f5f5",
		borderRadius: 8,
		paddingVertical: 6,
		paddingHorizontal: 12,
	},

	// Friend Suggestions
	suggestionsContainer: {
		position: "absolute",
		top: 60,
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#e0e0e0",
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 8,
		maxHeight: 200,
		zIndex: 1001,
	},

	suggestionItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},

	suggestionAvatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#007AFF",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},

	suggestionAvatarText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
	},

	suggestionInfo: {
		flex: 1,
	},

	suggestionName: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
	},

	suggestionUsername: {
		fontSize: 14,
		color: "#666",
		marginTop: 2,
	},

	friendBadge: {
		backgroundColor: "#e3f2fd",
		borderRadius: 6,
		paddingVertical: 2,
		paddingHorizontal: 6,
	},

	friendBadgeText: {
		fontSize: 10,
		color: "#1976d2",
		fontWeight: "500",
	},

	// Selected User Chip
	selectedUserChip: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f8f8f8",
		borderRadius: 16,
		paddingVertical: 4,
		paddingHorizontal: 12,
		gap: 6,
		borderWidth: 1,
		borderColor: "#e8e8e8",
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
		color: "#fff",
	},

	chipUsername: {
		fontSize: 14,
		fontWeight: "400",
		color: "#666",
	},

	chipRemoveButton: {
		width: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: "#ddd",
		alignItems: "center",
		justifyContent: "center",
	},

	// Amount Display
	amountSection: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 40,
		gap: 12,
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
		zIndex: 999,
	},

	proofChipButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#fff",
		borderRadius: 20,
		paddingVertical: 12,
		paddingHorizontal: 18,
		borderWidth: 1,
		borderColor: "#e0e0e0",
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
		minHeight: 80,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},

	// Action Button
	actionButton: {
		backgroundColor: "#333",
		borderRadius: 24,
		paddingVertical: 18,
		paddingHorizontal: 40,
		width: "100%",
		alignItems: "center",
		marginBottom: 40,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
	},

	actionButtonDisabled: {
		backgroundColor: "#ccc",
		shadowOpacity: 0,
		elevation: 0,
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

import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	SafeAreaView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import { DesignSystem } from "@/constants/DesignSystem";
import {
	useIsUsernameAvailable,
	useSocialOperations,
} from "@/hooks/useSocialContract";
import AsyncStorage from "@react-native-async-storage/async-storage";

function validateFormat(username: string): { valid: boolean; message: string } {
	if (!username) return { valid: false, message: "" };
	if (username.length < 3 || username.length > 50)
		return { valid: false, message: "3-50 characters required" };
	if (!/^[a-zA-Z0-9_]+$/.test(username))
		return { valid: false, message: "Alphanumeric and underscores only" };
	return { valid: true, message: "" };
}

export default function UsernameSetupScreen() {
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [formatError, setFormatError] = useState("");
	const router = useRouter();
	const { data: account, isConnected, logout, login } = useAbstraxionAccount();
	const { client: signingClient } = useAbstraxionSigningClient();
	const {
		available,
		loading: checking,
		error: checkError,
		refetch,
	} = useIsUsernameAvailable(username);
	const {
		loading: registering,
		error: registerError,
		registerUser,
	} = useSocialOperations(signingClient);

	useEffect(() => {
		const { valid, message } = validateFormat(username);
		setFormatError(valid ? "" : message);
		if (valid && username) refetch();
	}, [username, refetch]);

	const isValid =
		!formatError &&
		available &&
		isConnected &&
		!!signingClient &&
		!!account?.bech32Address &&
		displayName.trim().length > 0;

	const handleRegisterUsername = async () => {
		console.log("🚀 Starting registration process...");
		console.log("📊 Initial state:");
		console.log("  - signingClient:", !!signingClient);
		console.log("  - account?.bech32Address:", account?.bech32Address);
		console.log("  - isValid:", isValid);
		console.log("  - username:", username);

		// Add this check!
		if (!signingClient) {
			console.log("❌ Signing client not ready");
			Alert.alert("Error", "Signing client not ready. Please try again.");
			return;
		}

		if (!account?.bech32Address || !isValid) {
			console.log("❌ Invalid state for registration");
			console.log("  - account?.bech32Address:", account?.bech32Address);
			console.log("  - isValid:", isValid);
			Alert.alert("Error", "Invalid state for registration");
			return;
		}

		console.log("✅ All checks passed, proceeding with registration...");
		console.log("🔗 Calling registerUser with:");
		console.log("  - username:", username);
		console.log("  - wallet:", account.bech32Address);

		try {
			const result = await registerUser(
				username,
				displayName,
				account.bech32Address
			);
			console.log("✅ Registration successful!");
			console.log("📋 Registration result:", result);
			console.log("🏠 Navigating to main app...");
			router.replace("/(tabs)/activity");
		} catch (error) {
			console.error("❌ Registration error occurred:");
			const errorMsg = error instanceof Error ? error.message : String(error);
			console.error("  - Error message:", errorMsg);
			console.error("  - Full error:", error);
			if (error instanceof Error) {
				console.error("  - Error stack:", error.stack);
			}

			// Check if it's the "already registered" error
			if (errorMsg && errorMsg.includes("already registered")) {
				console.log(
					"🎯 This is the 'already registered' error - wallet exists in contract"
				);
			}

			Alert.alert("Registration Failed", errorMsg || "Please try again.");
		}
	};

	// Force Re-authentication function
	const handleForceReauth = async () => {
		try {
			await AsyncStorage.removeItem("xion-authz-temp-account");
			await AsyncStorage.removeItem("xion-authz-granter-account");
			await AsyncStorage.removeItem("walletConnection");
			await logout();
			setTimeout(async () => {
				try {
					await login();
					Alert.alert(
						"Re-authentication",
						"Successfully re-authenticated. Please check your wallet grants."
					);
				} catch (e) {
					Alert.alert(
						"Re-authentication Failed",
						e instanceof Error ? e.message : String(e)
					);
				}
			}, 2000);
		} catch (e) {
			Alert.alert("Error", e instanceof Error ? e.message : String(e));
		}
	};

	const renderValidationIcon = () => {
		if (!username) return null;
		if (checking) {
			return (
				<ActivityIndicator
					size="small"
					color={DesignSystem.colors.primary[800]}
				/>
			);
		}
		if (isValid) {
			return (
				<Ionicons
					name="checkmark-circle"
					size={24}
					color={DesignSystem.colors.status.success}
				/>
			);
		}
		if (username && (formatError || !available)) {
			return (
				<Ionicons
					name="close-circle"
					size={24}
					color={DesignSystem.colors.status.error}
				/>
			);
		}
		return null;
	};

	const isButtonDisabled = !isValid || registering;

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				style={styles.keyboardView}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View style={styles.content}>
					<View style={styles.mainContent}>
						{/* Header */}
						<View style={styles.header}>
							<Text style={styles.title}>Create Your Profile</Text>
							<Text style={styles.subtitle}>
								Choose a username and display name to get started
							</Text>
						</View>

						{/* Input Fields */}
						<View style={styles.inputsContainer}>
							{/* Display Name Input */}
							<View style={styles.inputWrapper}>
								<View style={styles.inputContainer}>
									<Ionicons
										name="person-outline"
										size={20}
										color={DesignSystem.colors.text.secondary}
										style={styles.inputIcon}
									/>
									<TextInput
										style={styles.displayNameInput}
										value={displayName}
										onChangeText={setDisplayName}
										placeholder="Display Name"
										placeholderTextColor={DesignSystem.colors.text.tertiary}
										autoCorrect={true}
										maxLength={50}
										editable={!registering && isConnected}
									/>
								</View>
							</View>

							{/* Username Input */}
							<View style={styles.inputWrapper}>
								<View style={styles.inputContainer}>
									<Ionicons
										name="at-outline"
										size={20}
										color={DesignSystem.colors.text.secondary}
										style={styles.inputIcon}
									/>
									<TextInput
										style={styles.usernameInput}
										value={username}
										onChangeText={setUsername}
										placeholder="Username"
										placeholderTextColor={DesignSystem.colors.text.tertiary}
										autoCapitalize="none"
										autoCorrect={false}
										autoComplete="username"
										maxLength={50}
										editable={!registering && isConnected}
									/>
									<View style={styles.validationIcon}>
										{renderValidationIcon()}
									</View>
								</View>

								{/* Character Counter */}
								<Text style={styles.characterCounter}>
									{username.length}/50
								</Text>
							</View>

							{/* Validation Messages */}
							{formatError && (
								<Text
									style={[styles.validationMessage, styles.validationError]}
								>
									{formatError}
								</Text>
							)}
							{!formatError && username && checking && (
								<Text style={styles.validationMessage}>
									Checking availability...
								</Text>
							)}
							{!formatError && username && !checking && available && (
								<Text
									style={[styles.validationMessage, styles.validationSuccess]}
								>
									Username is available!
								</Text>
							)}
							{!formatError && username && !checking && !available && (
								<Text
									style={[styles.validationMessage, styles.validationError]}
								>
									Username is already taken
								</Text>
							)}
							{checkError && (
								<Text
									style={[styles.validationMessage, styles.validationError]}
								>
									{checkError}
								</Text>
							)}

							{/* Requirements Card */}
							<View style={styles.requirementsCard}>
								<View style={styles.requirementsList}>
									<View style={styles.requirement}>
										<Ionicons
											name="checkmark-circle"
											size={16}
											color={
												username.length >= 3 && username.length <= 50
													? DesignSystem.colors.status.success
													: DesignSystem.colors.text.tertiary
											}
										/>
										<Text style={styles.requirementText}>3-50 characters</Text>
									</View>
									<View style={styles.requirement}>
										<Ionicons
											name="checkmark-circle"
											size={16}
											color={
												/^[a-zA-Z0-9_]+$/.test(username) && username.length > 0
													? DesignSystem.colors.status.success
													: DesignSystem.colors.text.tertiary
											}
										/>
										<Text style={styles.requirementText}>
											Letters, numbers, underscores only
										</Text>
									</View>
									<View style={styles.requirement}>
										<Ionicons
											name="checkmark-circle"
											size={16}
											color={
												isValid
													? DesignSystem.colors.status.success
													: DesignSystem.colors.text.tertiary
											}
										/>
										<Text style={styles.requirementText}>
											Username available
										</Text>
									</View>
								</View>
							</View>

							{/* Continue Button */}
							<TouchableOpacity
								style={[
									styles.continueButton,
									registering && styles.continueButtonLoading,
									isButtonDisabled &&
										!registering &&
										styles.continueButtonDisabled,
								]}
								onPress={handleRegisterUsername}
								disabled={isButtonDisabled}
								activeOpacity={0.8}
							>
								{registering ? (
									<>
										<ActivityIndicator
											color={DesignSystem.colors.text.inverse}
											size="small"
										/>
										<Text style={styles.continueButtonText}>
											Creating account...
										</Text>
									</>
								) : (
									<>
										<Text
											style={[
												styles.continueButtonText,
												isButtonDisabled && styles.continueButtonTextDisabled,
											]}
										>
											Continue
										</Text>
										<Ionicons
											name="arrow-forward"
											size={20}
											color={
												isButtonDisabled
													? DesignSystem.colors.text.secondary
													: DesignSystem.colors.text.inverse
											}
										/>
									</>
								)}
							</TouchableOpacity>
							{registerError && (
								<Text
									style={[styles.validationMessage, styles.validationError]}
								>
									{registerError}
								</Text>
							)}
						</View>

						{/* Wallet Info */}
						<View style={styles.walletInfo}>
							<Ionicons
								name="wallet-outline"
								size={16}
								color={DesignSystem.colors.text.secondary}
							/>
							<Text style={styles.walletText}>
								{isConnected && account?.bech32Address
									? `Connected: ${account.bech32Address.slice(
											0,
											8
									  )}...${account.bech32Address.slice(-6)}`
									: "Wallet not connected"}
							</Text>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
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
	content: {
		flex: 1,
		paddingHorizontal: DesignSystem.layout.containerPadding,
		paddingTop: DesignSystem.spacing["2xl"],
		paddingBottom: DesignSystem.spacing.xl,
		justifyContent: "space-between",
	},
	mainContent: {
		flex: 1,
		justifyContent: "center",
	},
	header: {
		alignItems: "center",
		marginBottom: DesignSystem.spacing["3xl"],
	},
	title: {
		...DesignSystem.typography.h1,
		color: DesignSystem.colors.text.primary,
		textAlign: "center",
		marginBottom: DesignSystem.spacing.md,
	},
	subtitle: {
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
		maxWidth: 280,
	},
	inputsContainer: {
		marginBottom: DesignSystem.spacing.xl,
	},
	inputWrapper: {
		marginBottom: DesignSystem.spacing.lg,
	},
	inputIcon: {
		marginRight: DesignSystem.spacing.md,
	},
	displayNameInput: {
		flex: 1,
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.primary,
		padding: 0,
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		paddingHorizontal: DesignSystem.spacing.xl,
		paddingVertical: DesignSystem.spacing.xl,
		minHeight: 56,
		...DesignSystem.shadows.sm,
	},
	atSymbol: {
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.secondary,
		marginRight: DesignSystem.spacing.xs,
	},
	usernameInput: {
		flex: 1,
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.primary,
		padding: 0,
	},
	validationIcon: {
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	validationMessage: {
		...DesignSystem.typography.body.small,
		marginBottom: DesignSystem.spacing.xs,
		paddingHorizontal: DesignSystem.spacing.sm,
	},
	validationSuccess: {
		color: DesignSystem.colors.status.success,
	},
	validationError: {
		color: DesignSystem.colors.status.error,
	},
	characterCounter: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.tertiary,
		textAlign: "right",
		marginTop: DesignSystem.spacing.xs,
		marginRight: DesignSystem.spacing.sm,
	},
	requirementsCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingVertical: DesignSystem.spacing.md,
		marginBottom: DesignSystem.spacing.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},
	requirementsList: {
		gap: DesignSystem.spacing.sm,
	},
	requirement: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
	},
	requirementText: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},
	continueButton: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: DesignSystem.radius.xl,
		paddingVertical: DesignSystem.spacing.xl,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.sm,
		marginTop: DesignSystem.spacing.lg,
		marginBottom: DesignSystem.spacing.lg,
		...DesignSystem.shadows.lg,
	},
	continueButtonDisabled: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		shadowOpacity: 0,
	},
	continueButtonLoading: {
		backgroundColor: DesignSystem.colors.primary[600],
	},
	continueButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},
	continueButtonTextDisabled: {
		color: DesignSystem.colors.text.secondary,
	},
	walletInfo: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.sm,
		paddingBottom: DesignSystem.spacing["4xl"],
	},
	walletText: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},
});

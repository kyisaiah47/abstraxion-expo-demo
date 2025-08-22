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
	const [formatError, setFormatError] = useState("");
	const [registered, setRegistered] = useState(false);
	const router = useRouter();
	const { data: account, isConnected } = useAbstraxionAccount();
	const { client: signingClient } = useAbstraxionSigningClient();
	const {
		available,
		loading: checking,
		error: checkError,
		refetch,
	} = useIsUsernameAvailable(username);
	const {
		registerUser,
		loading: registering,
		error: registerError,
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
		!!account?.bech32Address;

	const handleRegisterUsername = async () => {
		if (!isValid) {
			Alert.alert(
				"Wallet Not Connected",
				"Please connect your wallet before registering."
			);
			return;
		}
		try {
			await registerUser(
				{
					username,
					wallet_address: account.bech32Address,
					display_name: undefined,
					profile_picture: undefined,
				},
				account.bech32Address
			);
			setRegistered(true);
			// Save to app state here if needed
			router.replace("/(tabs)/activity");
		} catch (error) {
			Alert.alert(
				"Registration Failed",
				registerError || "Failed to register username. Please try again.",
				[{ text: "OK" }]
			);
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

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				style={styles.keyboardView}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View style={styles.content}>
					{/* Header */}
					<View style={styles.header}>
						<View style={styles.iconContainer}>
							<Ionicons
								name="person-add"
								size={48}
								color={DesignSystem.colors.primary[800]}
							/>
						</View>
						<Text style={styles.title}>Choose Your Username</Text>
						<Text style={styles.subtitle}>
							This will be your unique identifier on the platform
						</Text>
					</View>

					{/* Username Input */}
					<View style={styles.inputSection}>
						<View style={styles.inputContainer}>
							<Text style={styles.atSymbol}>@</Text>
							<TextInput
								style={styles.usernameInput}
								value={username}
								onChangeText={setUsername}
								placeholder="username"
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

						{/* Validation Message */}
						{formatError ? (
							<Text style={[styles.validationMessage, styles.validationError]}>
								{formatError}
							</Text>
						) : null}
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
							<Text style={[styles.validationMessage, styles.validationError]}>
								Username is already taken
							</Text>
						)}
						{checkError && (
							<Text style={[styles.validationMessage, styles.validationError]}>
								{checkError}
							</Text>
						)}

						{/* Character Counter */}
						<Text style={styles.characterCounter}>
							{username.length}/50 characters
						</Text>
					</View>

					{/* Requirements */}
					<View style={styles.requirementsSection}>
						<Text style={styles.requirementsTitle}>Username requirements:</Text>
						<View style={styles.requirementsList}>
							<View style={styles.requirement}>
								<Ionicons
									name="checkmark"
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
									name="checkmark"
									size={16}
									color={
										/^[a-zA-Z0-9_]+$/.test(username) && username.length > 0
											? DesignSystem.colors.status.success
											: DesignSystem.colors.text.tertiary
									}
								/>
								<Text style={styles.requirementText}>
									Alphanumeric and underscores only
								</Text>
							</View>
							<View style={styles.requirement}>
								<Ionicons
									name="checkmark"
									size={16}
									color={
										isValid
											? DesignSystem.colors.status.success
											: DesignSystem.colors.text.tertiary
									}
								/>
								<Text style={styles.requirementText}>Must be unique</Text>
							</View>
						</View>
					</View>

					{/* Continue Button */}
					<TouchableOpacity
						style={[
							styles.continueButton,
							(!isValid || registering) && styles.continueButtonDisabled,
						]}
						onPress={handleRegisterUsername}
						disabled={!isValid || registering}
						activeOpacity={0.8}
					>
						{registering ? (
							<ActivityIndicator color={DesignSystem.colors.text.inverse} />
						) : (
							<>
								<Text style={styles.continueButtonText}>Continue</Text>
								<Ionicons
									name="arrow-forward"
									size={20}
									color={DesignSystem.colors.text.inverse}
								/>
							</>
						)}
					</TouchableOpacity>
					{registerError && (
						<Text style={[styles.validationMessage, styles.validationError]}>
							{registerError}
						</Text>
					)}

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
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

// ...existing code...
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
		paddingTop: DesignSystem.spacing["4xl"],
		justifyContent: "center",
	},
	header: {
		alignItems: "center",
		marginBottom: DesignSystem.spacing["4xl"],
	},
	iconContainer: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor:
			DesignSystem.colors.primary[50] || DesignSystem.colors.surface.elevated,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: DesignSystem.spacing["2xl"],
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
	inputSection: {
		marginBottom: DesignSystem.spacing["3xl"],
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 2,
		borderColor: DesignSystem.colors.border.secondary,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		paddingVertical: DesignSystem.spacing.lg,
		marginBottom: DesignSystem.spacing.sm,
	},
	atSymbol: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.secondary,
		marginRight: DesignSystem.spacing.xs,
	},
	usernameInput: {
		flex: 1,
		...DesignSystem.typography.h3,
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
		paddingHorizontal: DesignSystem.spacing.sm,
	},
	requirementsSection: {
		marginBottom: DesignSystem.spacing["4xl"],
	},
	requirementsTitle: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.secondary,
		marginBottom: DesignSystem.spacing.md,
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
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
	},
	continueButton: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: DesignSystem.radius.xl,
		paddingVertical: DesignSystem.spacing["2xl"],
		paddingHorizontal: DesignSystem.spacing["3xl"],
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.md,
		marginBottom: DesignSystem.spacing["2xl"],
		...DesignSystem.shadows.lg,
	},
	continueButtonDisabled: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},
	continueButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
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

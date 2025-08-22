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
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { DesignSystem } from "@/constants/DesignSystem";
import { UserService } from "@/lib/userService";

interface UsernameValidation {
	isValid: boolean;
	isAvailable: boolean;
	isChecking: boolean;
	message: string;
}

export default function UsernameSetupScreen() {
	const [username, setUsername] = useState("");
	const [validation, setValidation] = useState<UsernameValidation>({
		isValid: false,
		isAvailable: false,
		isChecking: false,
		message: "",
	});
	const [isRegistering, setIsRegistering] = useState(false);
	const router = useRouter();
	const { data: account } = useAbstraxionAccount();

	// Real-time username validation
	useEffect(() => {
		const validateUsername = async () => {
			if (!username) {
				setValidation({
					isValid: false,
					isAvailable: false,
					isChecking: false,
					message: "",
				});
				return;
			}

			// Check format first
			const formatValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
			if (!formatValid) {
				setValidation({
					isValid: false,
					isAvailable: false,
					isChecking: false,
					message: "3-20 characters, letters, numbers, and underscores only",
				});
				return;
			}

			// Check availability
			setValidation((prev) => ({ ...prev, isChecking: true }));

			try {
				const isAvailable = await UserService.checkUsernameAvailability(
					username
				);
				setValidation({
					isValid: formatValid && isAvailable,
					isAvailable,
					isChecking: false,
					message: isAvailable
						? "Username is available!"
						: "Username is already taken",
				});
			} catch (error) {
				console.error("Username validation error:", error);
				setValidation({
					isValid: false,
					isAvailable: false,
					isChecking: false,
					message: "Error checking availability",
				});
			}
		};

		const debounceTimer = setTimeout(validateUsername, 300);
		return () => clearTimeout(debounceTimer);
	}, [username]);

	const handleRegisterUsername = async () => {
		if (!validation.isValid || !account?.bech32Address) {
			return;
		}

		setIsRegistering(true);
		try {
			// Register username with wallet address
			await UserService.registerUsername(username, account.bech32Address);

			// Navigate to main app
			router.replace("/(tabs)/activity");
		} catch (error) {
			console.error("Username registration error:", error);
			Alert.alert(
				"Registration Failed",
				"Failed to register username. Please try again.",
				[{ text: "OK" }]
			);
		} finally {
			setIsRegistering(false);
		}
	};

	const renderValidationIcon = () => {
		if (!username) return null;

		if (validation.isChecking) {
			return (
				<ActivityIndicator
					size="small"
					color={DesignSystem.colors.primary[800]}
				/>
			);
		}

		if (validation.isValid && validation.isAvailable) {
			return (
				<Ionicons
					name="checkmark-circle"
					size={24}
					color={DesignSystem.colors.status.success}
				/>
			);
		}

		if (username && !validation.isValid) {
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
								maxLength={20}
								editable={!isRegistering}
							/>
							<View style={styles.validationIcon}>
								{renderValidationIcon()}
							</View>
						</View>

						{/* Validation Message */}
						{validation.message ? (
							<Text
								style={[
									styles.validationMessage,
									validation.isValid
										? styles.validationSuccess
										: styles.validationError,
								]}
							>
								{validation.message}
							</Text>
						) : null}

						{/* Character Counter */}
						<Text style={styles.characterCounter}>
							{username.length}/20 characters
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
										username.length >= 3 && username.length <= 20
											? DesignSystem.colors.status.success
											: DesignSystem.colors.text.tertiary
									}
								/>
								<Text style={styles.requirementText}>3-20 characters</Text>
							</View>
							<View style={styles.requirement}>
								<Ionicons
									name="checkmark"
									size={16}
									color={
										/^[a-zA-Z0-9_]*$/.test(username) && username.length > 0
											? DesignSystem.colors.status.success
											: DesignSystem.colors.text.tertiary
									}
								/>
								<Text style={styles.requirementText}>
									Letters, numbers, and underscores only
								</Text>
							</View>
							<View style={styles.requirement}>
								<Ionicons
									name="checkmark"
									size={16}
									color={
										validation.isAvailable && validation.isValid
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
							(!validation.isValid || isRegistering) &&
								styles.continueButtonDisabled,
						]}
						onPress={handleRegisterUsername}
						disabled={!validation.isValid || isRegistering}
						activeOpacity={0.8}
					>
						{isRegistering ? (
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

					{/* Wallet Info */}
					<View style={styles.walletInfo}>
						<Ionicons
							name="wallet-outline"
							size={16}
							color={DesignSystem.colors.text.secondary}
						/>
						<Text style={styles.walletText}>
							Connected: {account?.bech32Address?.slice(0, 8)}...
							{account?.bech32Address?.slice(-6)}
						</Text>
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
		paddingTop: DesignSystem.spacing["4xl"],
		justifyContent: "center",
	},

	// Header
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

	// Input Section
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

	// Requirements
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

	// Continue Button
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

	// Wallet Info
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

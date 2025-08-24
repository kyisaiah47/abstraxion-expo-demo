import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Pressable,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import { User } from "@/types/proofpay";
import { UserService } from "@/lib/userService";
import {
	useSocialOperations,
	useIsUsernameAvailable,
} from "@/hooks/useSocialContract";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";

export default function EditProfileScreen() {
	const [displayName, setDisplayName] = useState("");
	const [username, setUsername] = useState("");
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const { data: account } = useAbstraxionAccount();
	const { client: signingClient } = useAbstraxionSigningClient();
	const {
		loading,
		updateUser,
		checkUsernameAvailability,
	} = useSocialOperations(signingClient);
	const {
		available: isUsernameAvailable,
		loading: checkingUsername,
	} = useIsUsernameAvailable(username !== currentUser?.username ? username : "");

	// Load current user data
	useEffect(() => {
		const loadUserData = async () => {
			try {
				const user = await UserService.getCurrentUser();
				setCurrentUser(user);
				setDisplayName(user?.display_name || "");
				setUsername(user?.username || "");
			} catch (error) {
				console.error("Error loading user:", error);
				Alert.alert("Error", "Failed to load profile data");
			}
		};
		loadUserData();
	}, []);


	const handleSave = async () => {
		if (!displayName.trim() || !username.trim()) {
			Alert.alert("Error", "Please fill in all fields");
			return;
		}

		if (username !== currentUser?.username && !isUsernameAvailable) {
			Alert.alert("Error", "Username is not available");
			return;
		}

		if (!account?.bech32Address) {
			Alert.alert("Error", "Wallet not connected");
			return;
		}

		try {
			await updateUser(username, displayName, account.bech32Address);
			Alert.alert(
				"Success", 
				"Profile updated successfully!", 
				[{ text: "OK", onPress: () => router.back() }]
			);
		} catch (error) {
			console.error("Error updating profile:", error);
			Alert.alert("Error", "Failed to update profile. Please try again.");
		}
	};

	const hasChanges = displayName !== (currentUser?.display_name || "") || 
					   username !== (currentUser?.username || "");

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardView}
			>
				{/* Header */}
				<View style={styles.header}>
					<Pressable 
						style={styles.backButton} 
						onPress={() => router.back()}
					>
						<Ionicons name="arrow-back" size={24} color={colors.text.primary} />
					</Pressable>
					<Text style={styles.title}>Edit Profile</Text>
					<Pressable 
						style={[styles.saveButton, (!hasChanges || loading) && styles.saveButtonDisabled]}
						onPress={handleSave}
						disabled={!hasChanges || loading}
					>
						<Text style={[styles.saveText, (!hasChanges || loading) && styles.saveTextDisabled]}>
							{loading ? "Saving..." : "Save"}
						</Text>
					</Pressable>
				</View>

				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					{/* Avatar Section */}
					<View style={styles.avatarSection}>
						<View style={styles.avatarContainer}>
							<View style={styles.avatarPlaceholder}>
								<Text style={styles.avatarText}>
									{displayName ? displayName.charAt(0).toUpperCase() : "U"}
								</Text>
							</View>
						</View>
						<Text style={styles.avatarLabel}>Profile Photo</Text>
						<Text style={styles.avatarSubtitle}>Photo editing coming soon</Text>
					</View>

					{/* Form Fields */}
					<View style={styles.formSection}>
						{/* Display Name Field */}
						<View style={styles.fieldContainer}>
							<Text style={styles.fieldLabel}>Display Name</Text>
							<View style={styles.inputContainer}>
								<TextInput
									style={styles.input}
									value={displayName}
									onChangeText={setDisplayName}
									placeholder="Enter your display name"
									placeholderTextColor={colors.text.tertiary}
									autoCapitalize="words"
									maxLength={50}
								/>
							</View>
						</View>

						{/* Username Field */}
						<View style={styles.fieldContainer}>
							<Text style={styles.fieldLabel}>Username</Text>
							<View style={styles.inputContainer}>
								<View style={styles.usernameInputWrapper}>
									<Text style={styles.atSymbol}>@</Text>
									<TextInput
										style={styles.usernameInput}
										value={username}
										onChangeText={setUsername}
										placeholder="username"
										placeholderTextColor={colors.text.tertiary}
										autoCapitalize="none"
										autoCorrect={false}
										maxLength={30}
									/>
								</View>
								{username !== currentUser?.username && isUsernameAvailable !== null && (
									<View style={styles.availabilityIndicator}>
										<Ionicons 
											name={isUsernameAvailable ? "checkmark-circle" : "close-circle"}
											size={20}
											color={isUsernameAvailable ? colors.status?.success || "#059669" : colors.status?.error || "#DC2626"}
										/>
									</View>
								)}
							</View>
							{username !== currentUser?.username && isUsernameAvailable !== null && (
								<Text style={[
									styles.availabilityText,
									{ color: isUsernameAvailable ? colors.status?.success || "#059669" : colors.status?.error || "#DC2626" }
								]}>
									{isUsernameAvailable ? "Username is available" : "Username is not available"}
								</Text>
							)}
						</View>
					</View>

					{/* Info Section */}
					<View style={styles.infoSection}>
						<Text style={styles.infoText}>
							Your display name is shown to other users, while your username is used for mentions and searches.
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.surface.primary,
		},
		keyboardView: {
			flex: 1,
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingHorizontal: DesignSystem.spacing.xl,
			paddingVertical: DesignSystem.spacing.lg,
			borderBottomWidth: 1,
			borderBottomColor: colors.border.secondary,
		},
		backButton: {
			width: 40,
			height: 40,
			alignItems: "center",
			justifyContent: "center",
		},
		title: {
			...DesignSystem.typography.h3,
			color: colors.text.primary,
			fontWeight: "600",
		},
		saveButton: {
			paddingHorizontal: DesignSystem.spacing.md,
			paddingVertical: DesignSystem.spacing.sm,
		},
		saveButtonDisabled: {
			opacity: 0.5,
		},
		saveText: {
			...DesignSystem.typography.label.medium,
			color: colors.primary[700],
			fontWeight: "600",
		},
		saveTextDisabled: {
			color: colors.text.tertiary,
		},
		content: {
			flex: 1,
			padding: DesignSystem.spacing.xl,
		},
		avatarSection: {
			alignItems: "center",
			paddingVertical: DesignSystem.spacing["3xl"],
			marginBottom: DesignSystem.spacing.xl,
		},
		avatarContainer: {
			marginBottom: DesignSystem.spacing.md,
		},
		avatarPlaceholder: {
			width: 80,
			height: 80,
			borderRadius: 40,
			backgroundColor: colors.primary[700],
			alignItems: "center",
			justifyContent: "center",
		},
		avatarText: {
			...DesignSystem.typography.h2,
			color: colors.text.inverse,
			fontWeight: "600",
		},
		avatarLabel: {
			...DesignSystem.typography.label.large,
			color: colors.text.primary,
			marginBottom: 4,
		},
		avatarSubtitle: {
			...DesignSystem.typography.body.small,
			color: colors.text.secondary,
		},
		formSection: {
			gap: DesignSystem.spacing["2xl"],
		},
		fieldContainer: {
			gap: DesignSystem.spacing.sm,
		},
		fieldLabel: {
			...DesignSystem.typography.label.medium,
			color: colors.text.primary,
			fontWeight: "600",
		},
		inputContainer: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: colors.surface.elevated,
			borderRadius: DesignSystem.radius.lg,
			borderWidth: 1,
			borderColor: colors.border.secondary,
			paddingHorizontal: DesignSystem.spacing.lg,
			paddingVertical: DesignSystem.spacing.md,
		},
		input: {
			...DesignSystem.typography.body.large,
			color: colors.text.primary,
			flex: 1,
			paddingVertical: 0,
		},
		usernameInputWrapper: {
			flexDirection: "row",
			alignItems: "center",
			flex: 1,
		},
		atSymbol: {
			...DesignSystem.typography.body.large,
			color: colors.text.secondary,
			marginRight: 4,
		},
		usernameInput: {
			...DesignSystem.typography.body.large,
			color: colors.text.primary,
			flex: 1,
			paddingVertical: 0,
		},
		availabilityIndicator: {
			marginLeft: DesignSystem.spacing.sm,
		},
		availabilityText: {
			...DesignSystem.typography.body.small,
			marginTop: 4,
		},
		infoSection: {
			marginTop: DesignSystem.spacing["3xl"],
			paddingTop: DesignSystem.spacing.xl,
			borderTopWidth: 1,
			borderTopColor: colors.border.tertiary,
		},
		infoText: {
			...DesignSystem.typography.body.medium,
			color: colors.text.secondary,
			textAlign: "center",
			lineHeight: 20,
		},
	});
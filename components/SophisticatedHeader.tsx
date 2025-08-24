import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { DesignSystem } from "@/constants/DesignSystem";
import { useTheme } from "@/contexts/ThemeContext";

interface SophisticatedHeaderProps {
	title: string;
	subtitle?: string;
	showBackButton?: boolean;
	onBackPress?: () => void;
	onLogout?: () => void;
	rightAction?: React.ReactNode;
	variant?: "default" | "transparent" | "minimal";
}

export default function SophisticatedHeader({
	title,
	subtitle,
	showBackButton = false,
	onBackPress,
	onLogout,
	rightAction,
	variant = "default",
}: SophisticatedHeaderProps) {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();

	const handleLogout = () => {
		if (onLogout) {
			onLogout();
		} else {
			// Fallback - redirect to home/login
			router.replace("/");
		}
	};

	const handleBack = () => {
		if (onBackPress) {
			onBackPress();
		} else {
			router.back();
		}
	};

	const renderBackground = () => {
		if (variant === "transparent") {
			return Platform.OS === "ios" ? (
				<BlurView
					intensity={100}
					tint="light"
					style={StyleSheet.absoluteFillObject}
				/>
			) : (
				<View style={[StyleSheet.absoluteFillObject, styles.androidBlur]} />
			);
		}

		return variant === "minimal" ? null : (
			<View style={[StyleSheet.absoluteFillObject, styles.defaultBackground]} />
		);
	};

	const styles = createStyles(colors);

	return (
		<View
			style={[
				styles.container,
				{ paddingTop: insets.top },
				variant === "minimal" && styles.containerMinimal,
			]}
		>
			{renderBackground()}

			<View style={styles.content}>
				{/* Left Section */}
				<View style={styles.leftSection}>
					{showBackButton ? (
						<Pressable
							style={styles.actionButton}
							onPress={handleBack}
							android_ripple={{
								color: colors.primary[100] || colors.surface.tertiary,
								borderless: true,
								radius: 24,
							}}
						>
							{({ pressed }) => (
								<View
									style={[
										styles.buttonContent,
										pressed && styles.buttonPressed,
									]}
								>
									<Ionicons
										name="chevron-back"
										size={24}
										color={colors.text.primary}
									/>
								</View>
							)}
						</Pressable>
					) : (
						<View style={styles.titleContainer}>
							<Text style={styles.title}>{title}</Text>
							{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
						</View>
					)}
				</View>

				{/* Center Section (for back button scenarios) */}
				{showBackButton && (
					<View style={styles.centerSection}>
						<Text style={styles.titleCentered}>{title}</Text>
						{subtitle && (
							<Text style={styles.subtitleCentered}>{subtitle}</Text>
						)}
					</View>
				)}

				{/* Right Section */}
				<View style={styles.rightSection}>
					{rightAction || (
						<Pressable
							style={styles.logoutButton}
							onPress={handleLogout}
							android_ripple={{
								color: colors.status?.error + "20" || colors.surface.tertiary,
								borderless: true,
								radius: 24,
							}}
						>
							{({ pressed }) => (
								<View
									style={[
										styles.logoutButtonContent,
										pressed && styles.buttonPressed,
									]}
								>
									<Ionicons
										name="log-out-outline"
										size={22}
										color={colors.status?.error || colors.text.primary}
									/>
								</View>
							)}
						</Pressable>
					)}
				</View>
			</View>

			{/* Bottom Border */}
			{variant !== "minimal" && <View style={styles.bottomBorder} />}
		</View>
	);
}

const createStyles = (colors: any) => StyleSheet.create({
	container: {
		backgroundColor: "transparent",
		borderBottomWidth: 1,
		borderBottomColor: colors.border.secondary,
		zIndex: 50,
	},

	containerMinimal: {
		borderBottomWidth: 0,
	},

	defaultBackground: {
		backgroundColor: `${colors.surface.elevated}FB`, // 98% opacity
	},

	androidBlur: {
		backgroundColor: `${colors.surface.elevated}F0`, // 94% opacity
	},

	content: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: DesignSystem.layout.containerPadding,
		paddingVertical: DesignSystem.spacing.xl,
		minHeight: 64,
	},

	leftSection: {
		flex: 1,
		alignItems: "flex-start",
	},

	centerSection: {
		flex: 2,
		alignItems: "center",
	},

	rightSection: {
		flex: 1,
		alignItems: "flex-end",
	},

	titleContainer: {
		gap: DesignSystem.spacing.xs,
	},

	title: {
		...DesignSystem.typography.h2,
		color: colors.text.primary,
	},

	titleCentered: {
		...DesignSystem.typography.h3,
		color: colors.text.primary,
		textAlign: "center",
	},

	subtitle: {
		...DesignSystem.typography.body.medium,
		color: colors.text.secondary,
	},

	subtitleCentered: {
		...DesignSystem.typography.body.small,
		color: colors.text.secondary,
		textAlign: "center",
	},

	actionButton: {
		width: 48,
		height: 48,
		borderRadius: DesignSystem.radius.lg,
		backgroundColor: colors.surface.secondary,
		borderWidth: 1,
		borderColor: colors.border.primary,
		...DesignSystem.shadows.sm,
	},

	logoutButton: {
		width: 48,
		height: 48,
		borderRadius: DesignSystem.radius.lg,
		backgroundColor: colors.surface.secondary,
		borderWidth: 1,
		borderColor: colors.border.primary,
		...DesignSystem.shadows.sm,
	},

	buttonContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},

	logoutButtonContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},

	buttonPressed: {
		opacity: 0.7,
		transform: [{ scale: 0.95 }],
	},

	bottomBorder: {
		height: 1,
		backgroundColor: colors.border.secondary,
		marginHorizontal: DesignSystem.layout.containerPadding,
	},
});

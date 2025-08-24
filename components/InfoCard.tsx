import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import { useTheme } from "@/contexts/ThemeContext";

interface InfoCardProps {
	title: string;
	body: string;
	icon?: keyof typeof Ionicons.glyphMap;
}

export default function InfoCard({
	title,
	body,
	icon = "shield-checkmark",
}: InfoCardProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	
	return (
		<View style={styles.container}>
			<View style={styles.iconContainer}>
				<Ionicons
					name={icon}
					size={24}
					color={colors.primary[700] || colors.primary[800]}
				/>
			</View>

			<View style={styles.textContainer}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.body}>{body}</Text>
			</View>
		</View>
	);
}

const createStyles = (colors: any) => StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "flex-start",
		backgroundColor: colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: colors.border.secondary,
		gap: DesignSystem.spacing.lg,
		...DesignSystem.shadows.sm,
	},

	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: DesignSystem.radius.lg,
		backgroundColor: colors.primary[800] + "20",
		alignItems: "center",
		justifyContent: "center",
	},

	textContainer: {
		flex: 1,
		gap: DesignSystem.spacing.sm,
	},

	title: {
		...DesignSystem.typography.h4,
		color: colors.text.primary,
	},

	body: {
		...DesignSystem.typography.body.medium,
		color: colors.text.secondary,
		lineHeight: 22,
	},
});

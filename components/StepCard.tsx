import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";

interface StepCardProps {
	stepNumber: number;
	title: string;
	description: string;
	icon: keyof typeof Ionicons.glyphMap;
	isActive?: boolean;
}

export default function StepCard({
	stepNumber,
	title,
	description,
	icon,
	isActive = false,
}: StepCardProps) {
	return (
		<View style={[styles.container, isActive && styles.containerActive]}>
			<View style={styles.leftContent}>
				<View style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
					<Text
						style={[
							styles.stepNumberText,
							isActive && styles.stepNumberTextActive,
						]}
					>
						{stepNumber}
					</Text>
				</View>
			</View>

			<View style={styles.content}>
				<View style={styles.header}>
					<View
						style={[
							styles.iconContainer,
							isActive && styles.iconContainerActive,
						]}
					>
						<Ionicons
							name={icon}
							size={20}
							color={
								isActive
									? DesignSystem.colors.text.inverse
									: DesignSystem.colors.primary[700]
							}
						/>
					</View>
					<Text style={[styles.title, isActive && styles.titleActive]}>
						{title}
					</Text>
				</View>
				<Text style={styles.description}>{description}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
	},

	containerActive: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderColor: DesignSystem.colors.primary[800],
	},

	leftContent: {
		marginRight: DesignSystem.spacing.lg,
	},

	stepNumber: {
		width: 32,
		height: 32,
		borderRadius: DesignSystem.radius.lg,
		backgroundColor: DesignSystem.colors.surface.tertiary,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
	},

	stepNumberActive: {
		backgroundColor: DesignSystem.colors.text.inverse,
		borderColor: DesignSystem.colors.text.inverse,
	},

	stepNumberText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},

	stepNumberTextActive: {
		color: DesignSystem.colors.primary[800],
	},

	content: {
		flex: 1,
		gap: DesignSystem.spacing.sm,
	},

	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.md,
	},

	iconContainer: {
		width: 28,
		height: 28,
		borderRadius: DesignSystem.radius.md,
		backgroundColor: DesignSystem.colors.primary[800] + "20",
		alignItems: "center",
		justifyContent: "center",
	},

	iconContainerActive: {
		backgroundColor: DesignSystem.colors.text.inverse + "30",
	},

	title: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},

	titleActive: {
		color: DesignSystem.colors.text.inverse,
	},

	description: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		lineHeight: 20,
	},
});

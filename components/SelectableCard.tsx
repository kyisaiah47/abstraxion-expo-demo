import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";

interface SelectableCardProps {
	title: string;
	description: string;
	icon: keyof typeof Ionicons.glyphMap;
	isSelected: boolean;
	onPress: () => void;
}

export default function SelectableCard({
	title,
	description,
	icon,
	isSelected,
	onPress,
}: SelectableCardProps) {
	return (
		<Pressable
			style={[styles.container, isSelected && styles.containerSelected]}
			onPress={onPress}
		>
			<View style={styles.content}>
				<View
					style={[
						styles.iconContainer,
						isSelected && styles.iconContainerSelected,
					]}
				>
					<Ionicons
						name={icon}
						size={24}
						color={
							isSelected
								? DesignSystem.colors.text.inverse
								: DesignSystem.colors.primary[700]
						}
					/>
				</View>

				<View style={styles.textContainer}>
					<Text style={[styles.title, isSelected && styles.titleSelected]}>
						{title}
					</Text>
					<Text
						style={[
							styles.description,
							isSelected && styles.descriptionSelected,
						]}
					>
						{description}
					</Text>
				</View>
			</View>

			<View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
				{isSelected && (
					<Ionicons
						name="checkmark"
						size={16}
						color={DesignSystem.colors.text.inverse}
					/>
				)}
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.lg,
		...DesignSystem.shadows.sm,
	},

	containerSelected: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderColor: DesignSystem.colors.primary[800],
	},

	content: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.lg,
	},

	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: DesignSystem.radius.lg,
		backgroundColor: DesignSystem.colors.primary[800] + "20",
		alignItems: "center",
		justifyContent: "center",
	},

	iconContainerSelected: {
		backgroundColor: DesignSystem.colors.text.inverse + "30",
	},

	textContainer: {
		flex: 1,
		gap: DesignSystem.spacing.xs,
	},

	title: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},

	titleSelected: {
		color: DesignSystem.colors.text.inverse,
	},

	description: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		lineHeight: 18,
	},

	descriptionSelected: {
		color: DesignSystem.colors.text.inverse + "CC",
	},

	checkbox: {
		width: 24,
		height: 24,
		borderRadius: DesignSystem.radius.md,
		borderWidth: 2,
		borderColor: DesignSystem.colors.border.primary,
		alignItems: "center",
		justifyContent: "center",
	},

	checkboxSelected: {
		backgroundColor: DesignSystem.colors.text.inverse,
		borderColor: DesignSystem.colors.text.inverse,
	},
});

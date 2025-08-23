import React from "react";
import { Pressable, StyleSheet, PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";

type ActionButtonVariant = "success" | "error" | "warning" | "info" | "primary" | "secondary";
type ActionButtonSize = "small" | "medium" | "large";

interface ActionButtonProps extends Omit<PressableProps, "style"> {
	/** Icon name from Ionicons */
	icon: keyof typeof Ionicons.glyphMap;
	/** Button variant that determines icon color */
	variant?: ActionButtonVariant;
	/** Button size */
	size?: ActionButtonSize;
	/** Custom style overrides */
	style?: any;
}

const VARIANT_COLORS: Record<ActionButtonVariant, string> = {
	success: DesignSystem.colors.status.success,
	error: DesignSystem.colors.status.error,
	warning: DesignSystem.colors.status.warning,
	info: DesignSystem.colors.status.info,
	primary: DesignSystem.colors.primary[800],
	secondary: DesignSystem.colors.text.secondary,
};

const SIZE_CONFIG = {
	small: { size: 32, iconSize: 16, borderRadius: 16 },
	medium: { size: 36, iconSize: 18, borderRadius: 18 },
	large: { size: 40, iconSize: 20, borderRadius: 20 },
};

export default function ActionButton({
	icon,
	variant = "primary",
	size = "medium",
	style,
	...props
}: ActionButtonProps) {
	const sizeConfig = SIZE_CONFIG[size];
	const iconColor = VARIANT_COLORS[variant];

	return (
		<Pressable
			style={[
				styles.button,
				{
					width: sizeConfig.size,
					height: sizeConfig.size,
					borderRadius: sizeConfig.borderRadius,
				},
				style,
			]}
			{...props}
		>
			<Ionicons
				name={icon}
				size={sizeConfig.iconSize}
				color={iconColor}
			/>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		alignItems: "center",
		justifyContent: "center",
		...DesignSystem.shadows.sm,
	},
});
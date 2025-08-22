import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";

export default function TrustFooter() {
	return (
		<View style={styles.container}>
			<View style={styles.iconContainer}>
				<Ionicons
					name="shield-checkmark"
					size={16}
					color={DesignSystem.colors.primary[700]}
				/>
			</View>
			<Text style={styles.text}>Backed by mathematical proof, not trust.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		marginTop: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.tertiary,
		gap: DesignSystem.spacing.sm,
	},

	iconContainer: {
		opacity: 0.8,
	},

	text: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		fontStyle: "italic",
		textAlign: "center",
	},
});

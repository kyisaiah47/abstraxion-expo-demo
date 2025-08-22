import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import { ProofStatus } from "@/types/proofpay";

interface StatusPillProps {
	status: ProofStatus;
}

export default function StatusPill({ status }: StatusPillProps) {
	const getStatusConfig = (status: ProofStatus) => {
		switch (status) {
			case "Proof Confirmed":
				return {
					color: DesignSystem.colors.status.success,
					backgroundColor: DesignSystem.colors.status.success + "20",
					icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
				};
			case "Awaiting Proof":
				return {
					color: DesignSystem.colors.status.warning,
					backgroundColor: DesignSystem.colors.status.warning + "20",
					icon: "time" as keyof typeof Ionicons.glyphMap,
				};
			case "Payment Sent":
				return {
					color: DesignSystem.colors.text.secondary,
					backgroundColor: DesignSystem.colors.surface.tertiary,
					icon: "arrow-up" as keyof typeof Ionicons.glyphMap,
				};
			default:
				return {
					color: DesignSystem.colors.text.secondary,
					backgroundColor: DesignSystem.colors.surface.tertiary,
					icon: "help" as keyof typeof Ionicons.glyphMap,
				};
		}
	};

	const config = getStatusConfig(status);

	return (
		<View
			style={[styles.pill, { backgroundColor: config.backgroundColor }]}
			accessibilityLabel={`Status: ${status}`}
		>
			<Ionicons
				name={config.icon}
				size={12}
				color={config.color}
			/>
			<Text style={[styles.text, { color: config.color }]}>{status}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	pill: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.xs,
		borderRadius: DesignSystem.radius.md,
		gap: DesignSystem.spacing.xs,
	},

	text: {
		...DesignSystem.typography.label.small,
		fontWeight: "500",
	},
});

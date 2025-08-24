import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import { ProofStatus, TaskStatus } from "@/types/proofpay";

interface StatusPillProps {
	status: ProofStatus | TaskStatus;
}

export default function StatusPill({ status }: StatusPillProps) {
	const getStatusConfig = (status: ProofStatus | TaskStatus) => {
		switch (status) {
			// Legacy ProofStatus cases
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
					icon: "shield-outline" as keyof typeof Ionicons.glyphMap,
				};
			case "Payment Sent":
				return {
					color: DesignSystem.colors.text.secondary,
					backgroundColor: DesignSystem.colors.surface.tertiary,
					icon: "paper-plane" as keyof typeof Ionicons.glyphMap,
				};
			
			// New TaskStatus cases
			case "pending":
				return {
					color: DesignSystem.colors.status.info,
					backgroundColor: DesignSystem.colors.status.info + "20",
					icon: "time-outline" as keyof typeof Ionicons.glyphMap,
				};
			case "proof_submitted":
				return {
					color: DesignSystem.colors.status.warning,
					backgroundColor: DesignSystem.colors.status.warning + "20",
					icon: "document-outline" as keyof typeof Ionicons.glyphMap,
				};
			case "pending_release":
				return {
					color: "#FF6B35",
					backgroundColor: "#FF6B35" + "20",
					icon: "hourglass-outline" as keyof typeof Ionicons.glyphMap,
				};
			case "released":
				return {
					color: DesignSystem.colors.status.success,
					backgroundColor: DesignSystem.colors.status.success + "20",
					icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
				};
			case "disputed":
				return {
					color: DesignSystem.colors.status.error,
					backgroundColor: DesignSystem.colors.status.error + "20",
					icon: "alert-circle" as keyof typeof Ionicons.glyphMap,
				};
			case "refunded":
				return {
					color: "#6B7280",
					backgroundColor: "#6B7280" + "20",
					icon: "refresh-circle" as keyof typeof Ionicons.glyphMap,
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

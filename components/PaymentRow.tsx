import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import { ProofStatus } from "@/types/proofpay";
import StatusPill from "./StatusPill";

interface PaymentRowProps {
	title: string;
	subtitle: string;
	amount: number;
	direction: "in" | "out";
	status?: ProofStatus;
	timeAgo: string;
	showStatus?: boolean;
}

export default function PaymentRow({
	title,
	subtitle,
	amount,
	direction,
	status,
	timeAgo,
	showStatus = true,
}: PaymentRowProps) {
	const getDirectionIcon = () => {
		return direction === "in" ? "arrow-down" : "arrow-up";
	};

	const getDirectionColor = () => {
		return direction === "in"
			? DesignSystem.colors.status.success
			: DesignSystem.colors.text.secondary;
	};

	return (
		<View style={styles.container}>
			<View style={styles.leftSection}>
				<View
					style={[
						styles.iconContainer,
						{ backgroundColor: getDirectionColor() + "20" },
					]}
				>
					<Ionicons
						name={getDirectionIcon()}
						size={20}
						color={getDirectionColor()}
					/>
				</View>

				<View style={styles.textContainer}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.subtitle}>{subtitle}</Text>
					<Text style={styles.timeAgo}>{timeAgo}</Text>
				</View>
			</View>

			<View style={styles.rightSection}>
				<Text style={[styles.amount, { color: getDirectionColor() }]}>
					{direction === "in" ? "+" : "-"}{amount.toFixed(2)} XION
				</Text>
				{showStatus && status && <StatusPill status={status} />}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		marginBottom: DesignSystem.spacing.md,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
	},

	leftSection: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		gap: DesignSystem.spacing.lg,
	},

	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: DesignSystem.radius.lg,
		alignItems: "center",
		justifyContent: "center",
	},

	textContainer: {
		flex: 1,
		gap: DesignSystem.spacing.xs,
	},

	title: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	subtitle: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},

	timeAgo: {
		...DesignSystem.typography.caption,
		color: DesignSystem.colors.text.tertiary,
	},

	rightSection: {
		alignItems: "flex-end",
		gap: DesignSystem.spacing.md,
		marginLeft: DesignSystem.spacing.lg,
	},

	amount: {
		...DesignSystem.typography.label.large,
		fontWeight: "600",
	},
});

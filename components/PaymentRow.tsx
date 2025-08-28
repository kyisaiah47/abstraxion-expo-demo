import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import { ProofStatus } from "@/types/proofpay";
import StatusPill from "./StatusPill";

interface PaymentRowProps {
	title: string;
	subtitle: string;
	amount: number;
	direction: "in" | "out" | "request";
	status?: ProofStatus;
	timeAgo: string;
	showStatus?: boolean;
	onPress?: () => void;
}

export default function PaymentRow({
	title,
	subtitle,
	amount,
	direction,
	status,
	timeAgo,
	showStatus = true,
	onPress,
}: PaymentRowProps) {
	const getDirectionIcon = () => {
		switch (direction) {
			case "in": return "arrow-down";
			case "out": return "arrow-up"; 
			case "request": return "hand-left";
			default: return "arrow-up";
		}
	};

	const getDirectionColor = () => {
		switch (direction) {
			case "in": return DesignSystem.colors.status.success;
			case "out": return DesignSystem.colors.text.secondary;
			case "request": return DesignSystem.colors.status.warning;
			default: return DesignSystem.colors.text.secondary;
		}
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
				{direction === "request" ? (
					<Pressable 
						style={[styles.requestButton, { backgroundColor: getDirectionColor() + "20", borderColor: getDirectionColor() }]}
						onPress={onPress}
					>
						<Text style={[styles.requestButtonText, { color: getDirectionColor() }]}>
							Send
						</Text>
						<Text style={[styles.requestAmountText, { color: getDirectionColor() }]}>
							{amount.toFixed(2)} XION
						</Text>
					</Pressable>
				) : (
					<Text style={[styles.amount, { color: getDirectionColor() }]}>
						{direction === "in" ? "+" : "-"}{amount.toFixed(2)} XION
					</Text>
				)}
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

	requestButton: {
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.sm,
		borderRadius: DesignSystem.radius.md,
		borderWidth: 1,
		alignItems: "center",
	},

	requestButtonText: {
		...DesignSystem.typography.label.small,
		fontWeight: "600",
		textAlign: "center",
	},

	requestAmountText: {
		...DesignSystem.typography.label.small,
		fontWeight: "600",
		textAlign: "center",
	},
});

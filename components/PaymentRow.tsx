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
	direction: "in" | "out" | "request" | "task_created" | "task_received";
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
			case "task_created": return "briefcase";
			case "task_received": return "briefcase-outline";
			default: return "arrow-up";
		}
	};

	const getDirectionColor = () => {
		switch (direction) {
			case "in": return DesignSystem.colors.status.success;
			case "out": return DesignSystem.colors.text.secondary;
			case "request": return DesignSystem.colors.status.warning;
			case "task_created": return DesignSystem.colors.text.secondary;
			case "task_received": return DesignSystem.colors.status.info; // Blue for incoming money opportunity
			default: return DesignSystem.colors.text.secondary;
		}
	};

	return (
		<View style={[styles.container, direction === "task_received" && styles.taskContainer]}>
			<View style={styles.topRow}>
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
					) : direction === "task_received" || direction === "request" ? null : (
						<Text style={[styles.amount, { color: getDirectionColor() }]}>
							{direction === "in" ? "+" : direction === "task_created" ? "" : "-"}{amount.toFixed(2)} XION
						</Text>
					)}
					{showStatus && status && <StatusPill status={status} />}
				</View>
			</View>
			{direction === "task_received" && (
				<Pressable 
					style={[styles.taskButtonRow, { backgroundColor: getDirectionColor() + "10", borderColor: getDirectionColor() }]}
					onPress={onPress}
				>
					<Text style={[styles.taskButtonRowText, { color: getDirectionColor() }]}>
						Submit Proof • Earn {amount.toFixed(2)} XION
					</Text>
				</Pressable>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		marginBottom: DesignSystem.spacing.md,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
	},

	taskContainer: {
		paddingBottom: DesignSystem.spacing.md,
	},

	topRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
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

	taskButton: {
		paddingHorizontal: DesignSystem.spacing.sm,
		paddingVertical: DesignSystem.spacing.xs,
		borderRadius: DesignSystem.radius.sm,
		borderWidth: 1,
		alignItems: "center",
		minWidth: 80,
	},

	taskButtonText: {
		...DesignSystem.typography.caption,
		fontWeight: "600",
		textAlign: "center",
		fontSize: 11,
	},

	taskAmountText: {
		...DesignSystem.typography.label.medium,
		fontWeight: "600",
		textAlign: "center",
		fontSize: 13,
	},

	taskButtonRow: {
		marginTop: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.md,
		paddingHorizontal: DesignSystem.spacing.lg,
		borderRadius: DesignSystem.radius.md,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},

	taskButtonRowText: {
		...DesignSystem.typography.label.medium,
		fontWeight: "600",
		textAlign: "center",
	},
});

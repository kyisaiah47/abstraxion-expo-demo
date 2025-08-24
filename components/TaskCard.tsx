import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { DesignSystem } from "@/constants/DesignSystem";
import { useTheme } from "@/contexts/ThemeContext";
import StatusPill from "./StatusPill";
import { Task, ProofType, TaskStatus } from "@/types/proofpay";

interface TaskCardProps {
	task: Task;
	showCountdown?: boolean;
	countdownText?: string;
}

const getProofTypeIcon = (proofType: ProofType) => {
	switch (proofType) {
		case "soft":
			return "📝";
		case "zktls":
			return "🔒";
		case "hybrid":
			return "⏳";
		default:
			return "📋";
	}
};

const getProofTypeName = (proofType: ProofType) => {
	switch (proofType) {
		case "soft":
			return "Soft Proof";
		case "zktls":
			return "zkTLS Proof";
		case "hybrid":
			return "Hybrid Proof";
		default:
			return "Unknown";
	}
};

export default function TaskCard({ task, showCountdown, countdownText }: TaskCardProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	const handlePress = () => {
		router.push(`/jobs/${task.id}`);
	};

	const formatTimeAgo = (date: Date) => {
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
		
		if (diffInHours < 1) return "Just now";
		if (diffInHours < 24) return `${diffInHours}h ago`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays}d ago`;
		
		return date.toLocaleDateString();
	};

	return (
		<Pressable style={styles.card} onPress={handlePress}>
			<View style={styles.header}>
				<View style={styles.titleRow}>
					<Text style={styles.proofTypeIcon}>
						{getProofTypeIcon(task.proofType)}
					</Text>
					<Text style={styles.title} numberOfLines={2}>
						{task.description}
					</Text>
				</View>
				<StatusPill status={task.status} />
			</View>

			<View style={styles.details}>
				<View style={styles.amountRow}>
					<Text style={styles.amount}>{task.amount} XION</Text>
					<Text style={styles.proofType}>
						{getProofTypeName(task.proofType)}
					</Text>
				</View>

				<View style={styles.metaRow}>
					<Text style={styles.counterparty}>
						{task.worker ? `With @${task.worker}` : "No worker yet"}
					</Text>
					<Text style={styles.timeAgo}>
						{formatTimeAgo(task.createdAt)}
					</Text>
				</View>

				{showCountdown && countdownText && (
					<View style={styles.countdownRow}>
						<View style={styles.countdownChip}>
							<Ionicons
								name="hourglass-outline"
								size={14}
								color={colors.status?.warning || "#D97706"}
							/>
							<Text style={styles.countdownText}>{countdownText}</Text>
						</View>
					</View>
				)}
			</View>
		</Pressable>
	);
}

const createStyles = (colors: any) => StyleSheet.create({
	card: {
		backgroundColor: colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		marginBottom: DesignSystem.spacing.lg,
		borderWidth: 1,
		borderColor: colors.border.secondary,
		...DesignSystem.shadows.sm,
	},

	header: {
		marginBottom: DesignSystem.spacing.lg,
	},

	titleRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: DesignSystem.spacing.md,
		gap: DesignSystem.spacing.sm,
	},

	proofTypeIcon: {
		fontSize: 20,
		marginTop: 2,
	},

	title: {
		flex: 1,
		...DesignSystem.typography.body.large,
		color: colors.text.primary,
		fontWeight: "500",
	},

	details: {
		gap: DesignSystem.spacing.sm,
	},

	amountRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	amount: {
		...DesignSystem.typography.h4,
		color: colors.text.primary,
		fontWeight: "600",
	},

	proofType: {
		...DesignSystem.typography.label.small,
		color: colors.text.secondary,
		backgroundColor: colors.surface.tertiary,
		paddingHorizontal: DesignSystem.spacing.sm,
		paddingVertical: DesignSystem.spacing.xs,
		borderRadius: DesignSystem.radius.sm,
	},

	metaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	counterparty: {
		...DesignSystem.typography.body.small,
		color: colors.text.secondary,
	},

	timeAgo: {
		...DesignSystem.typography.body.small,
		color: colors.text.tertiary,
	},

	countdownRow: {
		marginTop: DesignSystem.spacing.sm,
		alignItems: "center",
	},

	countdownChip: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: (colors.status?.warning || "#D97706") + "20",
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.xs,
		borderRadius: DesignSystem.radius.lg,
		gap: DesignSystem.spacing.xs,
	},

	countdownText: {
		...DesignSystem.typography.label.small,
		color: colors.status?.warning || "#D97706",
		fontWeight: "500",
	},
});
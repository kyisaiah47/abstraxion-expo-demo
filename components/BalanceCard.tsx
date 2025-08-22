import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DesignSystem } from "@/constants/DesignSystem";

interface BalanceCardProps {
	total: number;
	awaitingAmount: number;
	verifiedCount: number;
	ctaLabel?: string;
	onPressCta?: () => void;
}

export default function BalanceCard({
	total,
	awaitingAmount,
	verifiedCount,
	ctaLabel = "+ Start Task",
	onPressCta,
}: BalanceCardProps) {
	return (
		<View style={styles.container}>
			<LinearGradient
				colors={[
					DesignSystem.colors.primary[700],
					DesignSystem.colors.primary[900],
				]}
				style={StyleSheet.absoluteFillObject}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			/>

			<View style={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>Verified Balance</Text>
					{onPressCta && (
						<Pressable
							style={styles.ctaButton}
							onPress={onPressCta}
						>
							<Text style={styles.ctaText}>{ctaLabel}</Text>
						</Pressable>
					)}
				</View>

				<Text style={styles.totalAmount}>${total.toFixed(2)}</Text>

				<View style={styles.statsRow}>
					<View style={styles.statItem}>
						<Text style={styles.statValue}>${awaitingAmount.toFixed(0)}</Text>
						<Text style={styles.statLabel}>Awaiting Proof</Text>
					</View>

					<View style={styles.statDivider} />

					<View style={styles.statItem}>
						<Text style={styles.statValue}>{verifiedCount}</Text>
						<Text style={styles.statLabel}>Proof Confirmed</Text>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: DesignSystem.radius.xl,
		overflow: "hidden",
		marginBottom: DesignSystem.spacing["3xl"],
		...DesignSystem.shadows.lg,
	},

	content: {
		padding: DesignSystem.spacing["3xl"],
		gap: DesignSystem.spacing.lg,
	},

	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	title: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
		opacity: 0.9,
	},

	ctaButton: {
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingVertical: DesignSystem.spacing.sm,
		borderRadius: DesignSystem.radius.md,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.3)",
	},

	ctaText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	totalAmount: {
		...DesignSystem.typography.h1,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "700",
	},

	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.xl,
	},

	statItem: {
		flex: 1,
		alignItems: "center",
		gap: DesignSystem.spacing.xs,
	},

	statDivider: {
		width: 1,
		height: 40,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
	},

	statValue: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	statLabel: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.inverse,
		opacity: 0.8,
		textAlign: "center",
	},
});

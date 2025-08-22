import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import { PaymentType } from "@/types/proofpay";

interface PaymentTabSwitcherProps {
	activeTab: PaymentType;
	onTabChange: (tab: PaymentType) => void;
}

const PAYMENT_TABS = [
	{
		id: "request_help" as PaymentType,
		label: "TASK",
		icon: "heart-outline" as const,
		activeIcon: "heart" as const,
		isPrimary: true,
	},
	{
		id: "request_money" as PaymentType,
		label: "$ Request",
		icon: "card-outline" as const,
		activeIcon: "card" as const,
		isPrimary: false,
	},
	{
		id: "send_money" as PaymentType,
		label: "$ Pay",
		icon: "send-outline" as const,
		activeIcon: "send" as const,
		isPrimary: false,
	},
];

export default function PaymentTabSwitcher({
	activeTab,
	onTabChange,
}: PaymentTabSwitcherProps) {
	return (
		<View style={styles.container}>
			{/* Primary TASK tab */}
			<Pressable
				style={[
					styles.taskTab,
					activeTab === "request_help" && styles.taskTabActive,
				]}
				onPress={() => onTabChange("request_help")}
			>
				<Ionicons
					name={activeTab === "request_help" ? "heart" : "heart-outline"}
					size={22}
					color={
						activeTab === "request_help"
							? DesignSystem.colors.primary[800]
							: DesignSystem.colors.text.secondary
					}
				/>
				<Text
					style={[
						styles.taskTabLabel,
						activeTab === "request_help" && styles.taskTabLabelActive,
					]}
				>
					TASK
				</Text>
			</Pressable>

			{/* Money tabs group */}
			<View style={styles.moneyTabsGroup}>
				{PAYMENT_TABS.slice(1).map((tab) => {
					const isActive = activeTab === tab.id;
					return (
						<Pressable
							key={tab.id}
							style={[styles.moneyTab, isActive && styles.moneyTabActive]}
							onPress={() => onTabChange(tab.id)}
						>
							<Text
								style={[
									styles.moneyTabLabel,
									isActive && styles.moneyTabLabelActive,
								]}
							>
								{tab.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing["3xl"], // Larger gap between TASK and money group
	},

	// TASK tab (primary)
	taskTab: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.sm,
		paddingVertical: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 2,
		borderColor: DesignSystem.colors.border.secondary,
	},

	taskTabActive: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderColor: DesignSystem.colors.primary[800],
		...DesignSystem.shadows.md,
	},

	taskTabLabel: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		fontWeight: "700",
		fontSize: 18,
	},

	taskTabLabelActive: {
		color: DesignSystem.colors.text.inverse,
	},

	// Money tabs group
	moneyTabsGroup: {
		flexDirection: "row",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		padding: 2,
		gap: 2,
	},

	moneyTab: {
		paddingVertical: DesignSystem.spacing.md,
		paddingHorizontal: DesignSystem.spacing.lg,
		borderRadius: DesignSystem.radius.md,
	},

	moneyTabActive: {
		backgroundColor: DesignSystem.colors.surface.primary,
		...DesignSystem.shadows.sm,
	},

	moneyTabLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.secondary,
		fontWeight: "600",
		fontSize: 14,
	},

	moneyTabLabelActive: {
		color: DesignSystem.colors.primary[800],
		fontWeight: "700",
	},
});

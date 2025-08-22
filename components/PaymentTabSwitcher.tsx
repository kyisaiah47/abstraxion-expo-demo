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
		label: "Request Help",
		icon: "heart-outline" as const,
		activeIcon: "heart" as const,
	},
	{
		id: "request_money" as PaymentType,
		label: "Request $",
		icon: "card-outline" as const,
		activeIcon: "card" as const,
	},
	{
		id: "send_money" as PaymentType,
		label: "Pay",
		icon: "send-outline" as const,
		activeIcon: "send" as const,
	},
];

export default function PaymentTabSwitcher({
	activeTab,
	onTabChange,
}: PaymentTabSwitcherProps) {
	return (
		<View style={styles.container}>
			{PAYMENT_TABS.map((tab) => {
				const isActive = activeTab === tab.id;
				return (
					<Pressable
						key={tab.id}
						style={[styles.tab, isActive && styles.tabActive]}
						onPress={() => onTabChange(tab.id)}
					>
						<Ionicons
							name={isActive ? tab.activeIcon : tab.icon}
							size={20}
							color={
								isActive
									? DesignSystem.colors.primary[800]
									: DesignSystem.colors.text.secondary
							}
						/>
						<Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: 4,
		gap: 4,
	},

	tab: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.xs,
		paddingVertical: DesignSystem.spacing.md,
		paddingHorizontal: DesignSystem.spacing.sm,
		borderRadius: DesignSystem.radius.lg,
	},

	tabActive: {
		backgroundColor: DesignSystem.colors.surface.primary,
		...DesignSystem.shadows.sm,
	},

	tabLabel: {
		...DesignSystem.typography.label.small,
		color: DesignSystem.colors.text.secondary,
		fontWeight: "500",
	},

	tabLabelActive: {
		color: DesignSystem.colors.primary[800],
		fontWeight: "600",
	},
});

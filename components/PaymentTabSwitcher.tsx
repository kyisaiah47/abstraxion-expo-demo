import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { PaymentType } from "@/types/proofpay";
import { useTheme } from "@/contexts/ThemeContext";

interface PaymentTabSwitcherProps {
	activeTab: PaymentType;
	onTabChange: (tab: PaymentType) => void;
}

const PAYMENT_TABS = [
	{
		id: "request_help" as PaymentType,
		label: "Help",
	},
	{
		id: "request_money" as PaymentType,
		label: "Request",
	},
	{
		id: "send_money" as PaymentType,
		label: "Pay",
	},
];

export default function PaymentTabSwitcher({
	activeTab,
	onTabChange,
}: PaymentTabSwitcherProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	
	return (
		<View style={styles.container}>
			<View style={styles.tabContainer}>
				{PAYMENT_TABS.map((tab) => {
					const isActive = activeTab === tab.id;
					return (
						<Pressable
							key={tab.id}
							style={[styles.tab, isActive && styles.tabActive]}
							onPress={() => onTabChange(tab.id)}
						>
							<Text
								style={[styles.tabLabel, isActive && styles.tabLabelActive]}
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

const createStyles = (colors: any) => StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
	},

	// Venmo-style tab container
	tabContainer: {
		flexDirection: "row",
		backgroundColor: colors.surface.secondary,
		borderRadius: 20,
		padding: 4,
		gap: 2,
	},

	// Individual tabs
	tab: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		minWidth: 80,
	},

	tabActive: {
		backgroundColor: colors.primary[800],
	},

	// Tab labels
	tabLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.text.secondary,
	},

	tabLabelActive: {
		color: colors.text.inverse,
	},
});

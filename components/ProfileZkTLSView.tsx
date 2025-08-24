import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import ZkTLSSelectionModal from "./ZkTLSSelectionModal";

interface ProfileZkTLSViewProps {
	onNavigateBack?: () => void;
}

export default function ProfileZkTLSView({ onNavigateBack }: ProfileZkTLSViewProps) {
	const [showModal, setShowModal] = useState(false);
	const { colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<View style={styles.container}>
			<Pressable style={styles.menuItem} onPress={() => setShowModal(true)}>
				<View style={styles.menuItemIcon}>
					<Ionicons name="shield-checkmark" size={24} color={colors.primary[700]} />
				</View>
				<View style={styles.menuItemContent}>
					<Text style={styles.menuItemTitle}>Available zkTLS Providers</Text>
					<Text style={styles.menuItemSubtitle}>
						Browse verification methods for task completion
					</Text>
				</View>
				<Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
			</Pressable>

			<ZkTLSSelectionModal
				visible={showModal}
				onClose={() => setShowModal(false)}
				title="zkTLS Verification Providers"
				subtitle="Explore all available verification methods"
				mode="browse"
				showCategories={true}
				showStatus={true}
			/>
		</View>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
		},
		menuItem: {
			flexDirection: "row",
			alignItems: "center",
			paddingVertical: 16,
			paddingHorizontal: 20,
			backgroundColor: colors.surface.primary,
			borderBottomWidth: 1,
			borderBottomColor: colors.border.secondary,
		},
		menuItemIcon: {
			width: 44,
			height: 44,
			borderRadius: 22,
			backgroundColor: colors.surface.elevated,
			alignItems: "center",
			justifyContent: "center",
			marginRight: 16,
		},
		menuItemContent: {
			flex: 1,
		},
		menuItemTitle: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.text.primary,
			marginBottom: 2,
		},
		menuItemSubtitle: {
			fontSize: 14,
			color: colors.text.secondary,
			lineHeight: 18,
		},
	});
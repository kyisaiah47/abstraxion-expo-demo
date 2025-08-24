import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Modal,
	SafeAreaView,
	ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { ZKTLS_OPTIONS, ZkTLSOption } from "@/constants/zkTLSOptions";

interface ZkTLSSelectionModalProps {
	visible: boolean;
	selectedOption?: string;
	onSelect?: (optionId: string) => void;
	onClose: () => void;
	title?: string;
	subtitle?: string;
	mode?: "selection" | "browse";
	showCategories?: boolean;
	showStatus?: boolean;
}

export default function ZkTLSSelectionModal({
	visible,
	selectedOption,
	onSelect,
	onClose,
	title = "Choose Verification Method",
	subtitle = "Select how you want to verify task completion",
	mode = "selection",
	showCategories = false,
	showStatus = false,
}: ZkTLSSelectionModalProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	const handleSelect = (optionId: string) => {
		if (onSelect) {
			onSelect(optionId);
		}
		if (mode === "selection") {
			onClose();
		}
	};

	const groupedOptions = showCategories 
		? ZKTLS_OPTIONS.reduce((groups, option) => {
				const category = option.category || "Other";
				if (!groups[category]) groups[category] = [];
				groups[category].push(option);
				return groups;
			}, {} as Record<string, ZkTLSOption[]>)
		: { "All": ZKTLS_OPTIONS };

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<SafeAreaView style={styles.container}>
				<View style={styles.header}>
					<Pressable style={styles.closeButton} onPress={onClose}>
						<Ionicons name="close" size={24} color={colors.text.secondary} />
					</Pressable>
					<Text style={styles.title}>{title}</Text>
					<View style={styles.placeholder} />
				</View>

				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					<Text style={styles.subtitle}>{subtitle}</Text>

					{Object.entries(groupedOptions).map(([category, options]) => (
						<View key={category}>
							{showCategories && (
								<Text style={styles.categoryTitle}>{category}</Text>
							)}
							{options.map((option) => (
								<Pressable
									key={option.id}
									style={[
										styles.optionCard,
										selectedOption === option.id && styles.optionCardSelected,
									]}
									onPress={() => handleSelect(option.id)}
								>
							<View style={styles.optionIcon}>
								<Ionicons
									name={option.icon as any}
									size={24}
									color={
										selectedOption === option.id
											? colors.primary[700]
											: colors.text.secondary
									}
								/>
							</View>
							<View style={styles.optionContent}>
								<Text
									style={[
										styles.optionLabel,
										selectedOption === option.id && styles.optionLabelSelected,
									]}
								>
									{option.label}
								</Text>
									<Text style={styles.optionDescription}>
										{option.description}
									</Text>
									{option.baseEndpoint && (
										<Text style={styles.optionEndpoint}>
											{option.baseEndpoint}
										</Text>
									)}
									{showStatus && option.status && (
										<View style={styles.statusContainer}>
											<Text 
												style={[
													styles.statusText,
													option.status === "active" && styles.statusActive,
													option.status === "beta" && styles.statusBeta,
													option.status === "coming_soon" && styles.statusComingSoon,
												]}
											>
												{option.status === "coming_soon" ? "Coming Soon" : option.status.toUpperCase()}
											</Text>
										</View>
									)}
								</View>
								{mode === "selection" && selectedOption === option.id && (
									<View style={styles.selectedIndicator}>
										<Ionicons
											name="checkmark-circle"
											size={20}
											color={colors.primary[700]}
										/>
									</View>
								)}
								</Pressable>
							))}
						</View>
					))}
				</ScrollView>
			</SafeAreaView>
		</Modal>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.surface.primary,
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingHorizontal: 20,
			paddingVertical: 16,
			borderBottomWidth: 1,
			borderBottomColor: colors.border.secondary,
		},
		closeButton: {
			width: 40,
			height: 40,
			alignItems: "center",
			justifyContent: "center",
		},
		title: {
			fontSize: 18,
			fontWeight: "600",
			color: colors.text.primary,
		},
		placeholder: {
			width: 40,
		},
		content: {
			flex: 1,
			padding: 20,
		},
		subtitle: {
			fontSize: 16,
			color: colors.text.secondary,
			textAlign: "center",
			marginBottom: 24,
			lineHeight: 22,
		},
		optionCard: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: colors.surface.elevated,
			borderRadius: 16,
			padding: 20,
			marginBottom: 12,
			borderWidth: 1,
			borderColor: colors.border.secondary,
		},
		optionCardSelected: {
			borderColor: colors.primary[700],
			backgroundColor: colors.primary[50] || colors.surface.elevated,
		},
		optionIcon: {
			width: 48,
			height: 48,
			borderRadius: 24,
			backgroundColor: colors.surface.secondary,
			alignItems: "center",
			justifyContent: "center",
			marginRight: 16,
		},
		optionContent: {
			flex: 1,
		},
		optionLabel: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.text.primary,
			marginBottom: 4,
		},
		optionLabelSelected: {
			color: colors.primary[700],
		},
		optionDescription: {
			fontSize: 14,
			color: colors.text.secondary,
			lineHeight: 18,
		},
		optionEndpoint: {
			fontSize: 12,
			color: colors.text.tertiary,
			marginTop: 4,
			fontStyle: "italic",
		},
		selectedIndicator: {
			marginLeft: 12,
		},
		categoryTitle: {
			fontSize: 18,
			fontWeight: "700",
			color: colors.text.primary,
			marginTop: 24,
			marginBottom: 12,
		},
		statusContainer: {
			marginTop: 8,
		},
		statusText: {
			fontSize: 11,
			fontWeight: "600",
			paddingHorizontal: 8,
			paddingVertical: 2,
			borderRadius: 10,
			overflow: "hidden",
			alignSelf: "flex-start",
		},
		statusActive: {
			backgroundColor: colors.status?.success || colors.primary[700],
			color: colors.text.inverse,
		},
		statusBeta: {
			backgroundColor: colors.status?.warning || colors.primary[600],
			color: colors.text.inverse,
		},
		statusComingSoon: {
			backgroundColor: colors.surface.secondary,
			color: colors.text.secondary,
		},
	});
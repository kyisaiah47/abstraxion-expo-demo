import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";

interface ConfirmationModalProps {
	visible: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	confirmStyle?: "default" | "destructive";
	icon?: keyof typeof Ionicons.glyphMap;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmationModal({
	visible,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	confirmStyle = "default",
	icon = "alert-circle-outline",
	onConfirm,
	onCancel,
}: ConfirmationModalProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onCancel}
		>
			<View style={styles.overlay}>
				<View style={styles.modal}>
					<View style={styles.header}>
						<View style={styles.iconContainer}>
							<Ionicons
								name={icon}
								size={24}
								color={confirmStyle === "destructive" ? colors.status?.error || '#DC2626' : colors.primary[700]}
							/>
						</View>
						<View style={styles.content}>
							<Text style={styles.title}>{title}</Text>
							<Text style={styles.message}>{message}</Text>
						</View>
					</View>
					
					<View style={styles.actions}>
						<Pressable
							style={[styles.button, styles.cancelButton]}
							onPress={onCancel}
						>
							<Text style={styles.cancelText}>{cancelText}</Text>
						</Pressable>
						
						<Pressable
							style={[
								styles.button,
								styles.confirmButton,
								confirmStyle === "destructive" && styles.destructiveButton
							]}
							onPress={onConfirm}
						>
							<Text style={[
								styles.confirmText,
								confirmStyle === "destructive" && styles.destructiveText
							]}>
								{confirmText}
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		overlay: {
			flex: 1,
			backgroundColor: 'rgba(0, 0, 0, 0.3)',
			justifyContent: 'flex-end',
			paddingBottom: 100,
			paddingHorizontal: DesignSystem.spacing.lg,
		},
		modal: {
			backgroundColor: colors.surface.secondary,
			borderRadius: DesignSystem.radius.xl,
			borderWidth: 1,
			borderColor: colors.border.primary,
			overflow: 'hidden',
			...DesignSystem.shadows.lg,
		},
		header: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			padding: DesignSystem.spacing.xl,
		},
		iconContainer: {
			marginRight: DesignSystem.spacing.md,
			marginTop: 2,
		},
		content: {
			flex: 1,
		},
		title: {
			...DesignSystem.typography.label.large,
			color: colors.text.primary,
			fontWeight: '600',
			marginBottom: 4,
		},
		message: {
			...DesignSystem.typography.body.medium,
			color: colors.text.secondary,
			lineHeight: 20,
		},
		actions: {
			flexDirection: 'row',
			borderTopWidth: 1,
			borderTopColor: colors.border.secondary,
		},
		button: {
			flex: 1,
			paddingVertical: DesignSystem.spacing.lg,
			alignItems: 'center',
			justifyContent: 'center',
		},
		cancelButton: {
			borderRightWidth: 1,
			borderRightColor: colors.border.secondary,
		},
		confirmButton: {
			// Default confirm button styling
		},
		destructiveButton: {
			backgroundColor: colors.status?.error ? `${colors.status.error}08` : '#DC262608',
		},
		cancelText: {
			...DesignSystem.typography.label.medium,
			color: colors.text.secondary,
			fontWeight: '500',
		},
		confirmText: {
			...DesignSystem.typography.label.medium,
			color: colors.primary[700],
			fontWeight: '600',
		},
		destructiveText: {
			color: colors.status?.error || '#DC2626',
		},
	});
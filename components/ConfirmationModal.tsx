import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Modal,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";

interface ConfirmationModalProps {
	visible: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	confirmStyle?: "default" | "destructive";
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
					<View style={styles.content}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.message}>{message}</Text>
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
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: DesignSystem.spacing.xl,
		},
		modal: {
			backgroundColor: colors.surface.elevated,
			borderRadius: DesignSystem.radius.xl,
			width: '100%',
			maxWidth: 400,
			overflow: 'hidden',
			...DesignSystem.shadows.lg,
		},
		content: {
			padding: DesignSystem.spacing.xl,
		},
		title: {
			...DesignSystem.typography.h3,
			color: colors.text.primary,
			fontWeight: '600',
			marginBottom: DesignSystem.spacing.md,
			textAlign: 'center',
		},
		message: {
			...DesignSystem.typography.body.medium,
			color: colors.text.secondary,
			lineHeight: 22,
			textAlign: 'center',
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
			backgroundColor: colors.status?.error ? `${colors.status.error}10` : '#DC262610',
		},
		cancelText: {
			...DesignSystem.typography.label.large,
			color: colors.text.secondary,
			fontWeight: '500',
		},
		confirmText: {
			...DesignSystem.typography.label.large,
			color: colors.primary[700],
			fontWeight: '600',
		},
		destructiveText: {
			color: colors.status?.error || '#DC2626',
		},
	});
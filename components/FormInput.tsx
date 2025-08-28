import React from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";

interface FormInputProps extends Omit<TextInputProps, 'style'> {
	label?: string;
	prefix?: string;
	suffix?: React.ReactNode;
	helperText?: string;
	error?: string;
	success?: string;
	containerStyle?: object;
}

export default function FormInput({
	label,
	prefix,
	suffix,
	helperText,
	error,
	success,
	containerStyle,
	...textInputProps
}: FormInputProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	const hasError = !!error;
	const hasSuccess = !!success;

	return (
		<View style={[styles.container, containerStyle]}>
			{label && (
				<Text style={styles.label}>{label}</Text>
			)}
			
			<View style={[
				styles.inputContainer,
				hasError && styles.inputContainerError,
				hasSuccess && styles.inputContainerSuccess,
			]}>
				{prefix && (
					<Text style={styles.prefix}>{prefix}</Text>
				)}
				
				<TextInput
					style={styles.input}
					placeholderTextColor={colors.text.tertiary}
					{...textInputProps}
				/>
				
				{suffix && suffix}
			</View>
			
			{(helperText || error || success) && (
				<Text style={[
					styles.helperText,
					hasError && styles.errorText,
					hasSuccess && styles.successText,
				]}>
					{error || success || helperText}
				</Text>
			)}
		</View>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			marginBottom: DesignSystem.spacing.lg,
		},
		label: {
			...DesignSystem.typography.label.medium,
			color: colors.text.primary,
			fontWeight: "600",
			marginBottom: DesignSystem.spacing.sm,
		},
		inputContainer: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: colors.surface.elevated,
			borderRadius: DesignSystem.radius.xl,
			borderWidth: 1,
			borderColor: colors.border.secondary,
			paddingHorizontal: DesignSystem.spacing.xl,
			paddingVertical: DesignSystem.spacing.lg,
			...DesignSystem.shadows.sm,
		},
		inputContainerError: {
			borderColor: colors.status?.error || "#DC2626",
		},
		inputContainerSuccess: {
			borderColor: colors.status?.success || "#059669",
		},
		input: {
			flex: 1,
			color: colors.text.primary,
			paddingHorizontal: 0,
			fontSize: 16,
			lineHeight: 22,
			includeFontPadding: false,
		},
		prefix: {
			...DesignSystem.typography.body.large,
			color: colors.text.secondary,
			marginRight: 4,
		},
		helperText: {
			...DesignSystem.typography.body.small,
			color: colors.text.secondary,
			marginTop: 4,
		},
		errorText: {
			color: colors.status?.error || "#DC2626",
		},
		successText: {
			color: colors.status?.success || "#059669",
		},
	});
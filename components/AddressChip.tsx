import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import { useTheme } from "@/contexts/ThemeContext";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

interface AddressChipProps {
	address: string;
	ens?: string;
	chain?: "XION" | "EVM";
	activeSince?: Date;
	variant?: "default" | "large";
	onCopy?: () => void;
}

export default function AddressChip({
	address,
	ens,
	chain = "XION",
	activeSince,
	variant = "default",
	onCopy,
}: AddressChipProps) {
	const { colors } = useTheme();
	const formatAddress = (addr: string) => {
		return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
	};

	const formatActiveSince = (date?: Date) => {
		if (!date) return null;

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		const diffMonths = Math.floor(diffDays / 30);
		const diffYears = Math.floor(diffMonths / 12);

		if (diffYears > 0) {
			const remainingMonths = diffMonths % 12;
			if (remainingMonths > 0) {
				return `Member for ${diffYears} yr ${remainingMonths} mo`;
			}
			return `Member for ${diffYears} yr`;
		} else if (diffMonths > 0) {
			return `Member for ${diffMonths} mo`;
		} else if (diffDays > 0) {
			return `Member for ${diffDays} days`;
		} else {
			return "New member";
		}
	};

	const handleCopy = async () => {
		try {
			await Clipboard.setStringAsync(address);
			Toast.show({
				type: 'success',
				text1: 'Copied!',
				text2: 'Address copied to clipboard',
				position: 'bottom',
			});
			onCopy?.();
		} catch (error) {
			
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Failed to copy address',
				position: 'bottom',
			});
		}
	};

	const displayText = ens || formatAddress(address);
	const subText = formatActiveSince(activeSince);
	const isLarge = variant === "large";
	const styles = createStyles(colors);

	return (
		<View style={styles.container}>
			<Pressable
				style={[styles.addressChip, isLarge && styles.addressChipLarge]}
				onPress={handleCopy}
			>
				<View style={styles.leftContent}>
					<View style={[styles.chainBadge, isLarge && styles.chainBadgeLarge]}>
						<Ionicons
							name="shield-checkmark"
							size={isLarge ? 12 : 10}
							color={colors.text.inverse}
						/>
						<Text style={[styles.chainText, isLarge && styles.chainTextLarge]}>
							{chain}
						</Text>
					</View>
					
					<Text
						style={[styles.addressText, isLarge && styles.addressTextLarge]}
					>
						{displayText}
					</Text>
				</View>
				
				<Ionicons
					name="copy-outline"
					size={isLarge ? 20 : 16}
					color={colors.text.secondary}
				/>
			</Pressable>

			{subText && (
				<Text style={[styles.subText, isLarge && styles.subTextLarge]}>
					{subText}
				</Text>
			)}
		</View>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			alignItems: "center",
			gap: DesignSystem.spacing.sm,
		},

		addressChip: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			backgroundColor: colors.surface.secondary,
			paddingHorizontal: DesignSystem.spacing.lg,
			paddingVertical: DesignSystem.spacing.md,
			borderRadius: DesignSystem.radius.lg,
			borderWidth: 1,
			borderColor: colors.border.primary,
			width: "100%",
			...DesignSystem.shadows.sm,
		},

		addressChipLarge: {
			paddingHorizontal: DesignSystem.spacing["2xl"],
			paddingVertical: DesignSystem.spacing.lg,
		},

		leftContent: {
			flexDirection: "row",
			alignItems: "center",
			gap: DesignSystem.spacing.md,
			flex: 1,
		},

		addressText: {
			...DesignSystem.typography.label.large,
			color: colors.text.primary,
			fontFamily: "monospace",
		},

		addressTextLarge: {
			...DesignSystem.typography.h4,
		},

		chainBadge: {
			backgroundColor: colors.primary[700],
			paddingHorizontal: DesignSystem.spacing.md,
			paddingVertical: DesignSystem.spacing.xs,
			borderRadius: DesignSystem.radius.md,
			flexDirection: "row",
			alignItems: "center",
			gap: DesignSystem.spacing.xs,
		},

		chainBadgeLarge: {
			paddingHorizontal: DesignSystem.spacing.lg,
			paddingVertical: DesignSystem.spacing.sm,
			borderRadius: DesignSystem.radius.lg,
		},

		chainText: {
			...DesignSystem.typography.label.small,
			color: colors.text.inverse,
			fontWeight: "600",
		},

		chainTextLarge: {
			...DesignSystem.typography.label.large,
		},

		subText: {
			...DesignSystem.typography.body.small,
			color: colors.text.secondary,
			textAlign: "center",
		},

		subTextLarge: {
			...DesignSystem.typography.body.medium,
		},
	});

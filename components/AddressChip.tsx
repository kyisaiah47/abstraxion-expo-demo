import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import * as Clipboard from "expo-clipboard";

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
	const formatAddress = (addr: string) => {
		return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
	};

	const formatActiveSince = (date?: Date) => {
		if (!date) return "Proof ID active since Jan 2024";

		const month = date.toLocaleDateString("en-US", { month: "short" });
		const year = date.getFullYear();
		return `Proof ID active since ${month} ${year}`;
	};

	const handleCopy = async () => {
		try {
			await Clipboard.setStringAsync(address);
			Alert.alert("Copied", "Address copied to clipboard");
			onCopy?.();
		} catch (error) {
			console.error("Failed to copy address:", error);
		}
	};

	const displayText = ens || formatAddress(address);
	const subText = formatActiveSince(activeSince);
	const isLarge = variant === "large";

	return (
		<View style={styles.container}>
			<View style={styles.addressRow}>
				<Pressable
					style={[styles.addressChip, isLarge && styles.addressChipLarge]}
					onPress={handleCopy}
				>
					<Text
						style={[styles.addressText, isLarge && styles.addressTextLarge]}
					>
						{displayText}
					</Text>
					<Ionicons
						name="copy-outline"
						size={isLarge ? 20 : 16}
						color={DesignSystem.colors.text.secondary}
					/>
				</Pressable>

				<View style={[styles.chainBadge, isLarge && styles.chainBadgeLarge]}>
					<Text style={[styles.chainText, isLarge && styles.chainTextLarge]}>
						{chain}
					</Text>
				</View>
			</View>

			<Text style={[styles.subText, isLarge && styles.subTextLarge]}>
				{subText}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
	},

	addressRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.md,
	},

	addressChip: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingVertical: DesignSystem.spacing.md,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		gap: DesignSystem.spacing.sm,
	},

	addressChipLarge: {
		paddingHorizontal: DesignSystem.spacing["2xl"],
		paddingVertical: DesignSystem.spacing.lg,
		gap: DesignSystem.spacing.md,
	},

	addressText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
		fontFamily: "monospace",
	},

	addressTextLarge: {
		...DesignSystem.typography.h4,
	},

	chainBadge: {
		backgroundColor: DesignSystem.colors.primary[800],
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.xs,
		borderRadius: DesignSystem.radius.md,
	},

	chainBadgeLarge: {
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingVertical: DesignSystem.spacing.sm,
		borderRadius: DesignSystem.radius.lg,
	},

	chainText: {
		...DesignSystem.typography.label.small,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	chainTextLarge: {
		...DesignSystem.typography.label.large,
	},

	subText: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
	},

	subTextLarge: {
		...DesignSystem.typography.body.medium,
	},
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";

interface ProofVerifiedCardProps {
	title?: string;
	subtitle?: string;
	details?: Array<{
		icon: keyof typeof Ionicons.glyphMap;
		text: string;
	}>;
}

export default function ProofVerifiedCard({
	title = "Proof Verified",
	subtitle = "Your work has been cryptographically verified with zkTLS.",
	details = [],
}: ProofVerifiedCardProps) {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.iconContainer}>
					<Ionicons
						name="shield-checkmark"
						size={28}
						color={DesignSystem.colors.status.success}
					/>
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.subtitle}>{subtitle}</Text>
				</View>
			</View>

			{details.length > 0 && (
				<View style={styles.detailsContainer}>
					{details.map((detail, index) => (
						<View
							key={index}
							style={styles.detailItem}
						>
							<Ionicons
								name={detail.icon}
								size={16}
								color={DesignSystem.colors.status.success}
							/>
							<Text style={styles.detailText}>{detail.text}</Text>
						</View>
					))}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: DesignSystem.colors.status.success + "10",
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["3xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.status.success + "30",
		gap: DesignSystem.spacing["2xl"],
	},

	header: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: DesignSystem.spacing.lg,
	},

	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: DesignSystem.radius.xl,
		backgroundColor: DesignSystem.colors.status.success + "20",
		alignItems: "center",
		justifyContent: "center",
	},

	textContainer: {
		flex: 1,
		gap: DesignSystem.spacing.sm,
	},

	title: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		fontWeight: "600",
	},

	subtitle: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		lineHeight: 22,
	},

	detailsContainer: {
		gap: DesignSystem.spacing.md,
	},

	detailItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.md,
	},

	detailText: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
	},
});

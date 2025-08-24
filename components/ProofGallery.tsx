import React, { useState } from "react";
import { 
	View, 
	Text, 
	Image,
	Pressable,
	Modal,
	ScrollView,
	StyleSheet,
	Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";

interface ProofEvidence {
	type: "text" | "image" | "zktls_receipt" | "link";
	title: string;
	content: string;
	timestamp: string;
	verified?: boolean;
}

interface ProofGalleryProps {
	evidence: ProofEvidence[];
	compact?: boolean;
}

const { width: screenWidth } = Dimensions.get("window");

export default function ProofGallery({ evidence, compact = false }: ProofGalleryProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [selectedEvidence, setSelectedEvidence] = useState<ProofEvidence | null>(null);

	const getEvidenceIcon = (type: string) => {
		switch (type) {
			case "text":
				return "document-text";
			case "image":
				return "image";
			case "zktls_receipt":
				return "shield-checkmark";
			case "link":
				return "link";
			default:
				return "document";
		}
	};

	const getEvidenceColor = (type: string, verified: boolean = false) => {
		if (verified) return colors.status?.success || "#059669";
		
		switch (type) {
			case "zktls_receipt":
				return colors.primary[700];
			case "image":
				return "#8B5CF6";
			case "text":
				return colors.text.secondary;
			case "link":
				return "#3B82F6";
			default:
				return colors.text.tertiary;
		}
	};

	const renderEvidencePreview = (item: ProofEvidence, index: number) => {
		const isImage = item.type === "image";
		const isZktls = item.type === "zktls_receipt";
		
		return (
			<Pressable 
				key={index}
				style={[
					styles.evidenceCard,
					compact && styles.evidenceCardCompact,
					isZktls && styles.zkTlsCard
				]}
				onPress={() => setSelectedEvidence(item)}
			>
				<View style={styles.evidenceHeader}>
					<View style={[
						styles.evidenceIcon, 
						{ backgroundColor: getEvidenceColor(item.type, item.verified) + "20" }
					]}>
						<Ionicons 
							name={getEvidenceIcon(item.type) as any}
							size={16}
							color={getEvidenceColor(item.type, item.verified)}
						/>
					</View>
					<View style={styles.evidenceInfo}>
						<Text style={styles.evidenceTitle} numberOfLines={1}>
							{item.title}
						</Text>
						<Text style={styles.evidenceTime}>
							{new Date(item.timestamp).toLocaleDateString()}
						</Text>
					</View>
					{item.verified && (
						<View style={styles.verifiedBadge}>
							<Ionicons name="checkmark-circle" size={16} color={colors.status?.success} />
						</View>
					)}
				</View>

				{!compact && (
					<View style={styles.evidencePreview}>
						{isImage ? (
							<Image 
								source={{ uri: item.content }} 
								style={styles.evidenceImage}
								resizeMode="cover"
							/>
						) : isZktls ? (
							<View style={styles.zkTlsPreview}>
								<Text style={styles.zkTlsHash} numberOfLines={2}>
									{item.content}
								</Text>
								<View style={styles.zkTlsBadge}>
									<Ionicons name="lock-closed" size={12} color={colors.primary[700]} />
									<Text style={styles.zkTlsText}>zkTLS Verified</Text>
								</View>
							</View>
						) : (
							<Text style={styles.evidenceText} numberOfLines={3}>
								{item.content}
							</Text>
						)}
					</View>
				)}
			</Pressable>
		);
	};

	const renderFullEvidence = () => {
		if (!selectedEvidence) return null;

		return (
			<Modal 
				visible={!!selectedEvidence}
				animationType="slide"
				presentationStyle="pageSheet"
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>{selectedEvidence.title}</Text>
						<Pressable onPress={() => setSelectedEvidence(null)}>
							<Ionicons name="close" size={24} color={colors.text.primary} />
						</Pressable>
					</View>
					
					<ScrollView style={styles.modalContent}>
						{selectedEvidence.type === "image" ? (
							<Image 
								source={{ uri: selectedEvidence.content }}
								style={styles.fullImage}
								resizeMode="contain"
							/>
						) : selectedEvidence.type === "zktls_receipt" ? (
							<View style={styles.zkTlsDetails}>
								<View style={styles.zkTlsHeader}>
									<Ionicons name="shield-checkmark" size={32} color={colors.primary[700]} />
									<Text style={styles.zkTlsTitle}>Zero-Knowledge Proof</Text>
								</View>
								<View style={styles.zkTlsInfo}>
									<Text style={styles.zkTlsLabel}>Proof Hash:</Text>
									<Text style={styles.zkTlsValue}>{selectedEvidence.content}</Text>
									<Text style={styles.zkTlsLabel}>Verified:</Text>
									<Text style={styles.zkTlsValue}>
										{new Date(selectedEvidence.timestamp).toLocaleString()}
									</Text>
									<Text style={styles.zkTlsDescription}>
										This cryptographic proof verifies task completion without revealing private data.
									</Text>
								</View>
							</View>
						) : (
							<Text style={styles.fullText}>{selectedEvidence.content}</Text>
						)}
					</ScrollView>
				</View>
			</Modal>
		);
	};

	if (evidence.length === 0) {
		return (
			<View style={styles.emptyState}>
				<Ionicons name="folder-open-outline" size={48} color={colors.text.tertiary} />
				<Text style={styles.emptyText}>No proof evidence available</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Ionicons name="shield-checkmark" size={20} color={colors.primary[700]} />
				<Text style={styles.headerTitle}>Proof Evidence</Text>
				<View style={styles.evidenceCount}>
					<Text style={styles.countText}>{evidence.length}</Text>
				</View>
			</View>

			<View style={[
				styles.gallery,
				compact && styles.galleryCompact
			]}>
				{evidence.map(renderEvidencePreview)}
			</View>

			{renderFullEvidence()}
		</View>
	);
}

const createStyles = (colors: any) => StyleSheet.create({
	container: {
		marginVertical: DesignSystem.spacing.md,
	},

	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: DesignSystem.spacing.md,
		gap: DesignSystem.spacing.sm,
	},

	headerTitle: {
		...DesignSystem.typography.label.large,
		color: colors.text.primary,
		fontWeight: "600",
		flex: 1,
	},

	evidenceCount: {
		backgroundColor: colors.primary[100] || colors.surface.tertiary,
		paddingHorizontal: DesignSystem.spacing.sm,
		paddingVertical: 2,
		borderRadius: 12,
	},

	countText: {
		...DesignSystem.typography.label.small,
		color: colors.primary[700],
		fontWeight: "600",
	},

	gallery: {
		gap: DesignSystem.spacing.md,
	},

	galleryCompact: {
		flexDirection: "row",
		flexWrap: "wrap",
	},

	evidenceCard: {
		backgroundColor: colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.lg,
		borderWidth: 1,
		borderColor: colors.border.secondary,
	},

	evidenceCardCompact: {
		flex: 1,
		minWidth: (screenWidth - DesignSystem.spacing.xl * 3) / 2,
		padding: DesignSystem.spacing.md,
	},

	zkTlsCard: {
		borderColor: colors.primary[300] || colors.border.primary,
		backgroundColor: (colors.primary[50] || colors.surface.elevated) + "40",
	},

	evidenceHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: DesignSystem.spacing.md,
		gap: DesignSystem.spacing.sm,
	},

	evidenceIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},

	evidenceInfo: {
		flex: 1,
	},

	evidenceTitle: {
		...DesignSystem.typography.label.medium,
		color: colors.text.primary,
		fontWeight: "500",
	},

	evidenceTime: {
		...DesignSystem.typography.body.small,
		color: colors.text.tertiary,
	},

	verifiedBadge: {
		marginLeft: DesignSystem.spacing.xs,
	},

	evidencePreview: {
		marginTop: DesignSystem.spacing.sm,
	},

	evidenceImage: {
		width: "100%",
		height: 120,
		borderRadius: DesignSystem.radius.md,
		backgroundColor: colors.surface.tertiary,
	},

	evidenceText: {
		...DesignSystem.typography.body.medium,
		color: colors.text.secondary,
		lineHeight: 20,
	},

	zkTlsPreview: {
		gap: DesignSystem.spacing.sm,
	},

	zkTlsHash: {
		...DesignSystem.typography.body.small,
		color: colors.text.secondary,
		fontFamily: "monospace",
		backgroundColor: colors.surface.tertiary,
		padding: DesignSystem.spacing.sm,
		borderRadius: DesignSystem.radius.sm,
	},

	zkTlsBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.xs,
	},

	zkTlsText: {
		...DesignSystem.typography.label.small,
		color: colors.primary[700],
		fontWeight: "600",
	},

	emptyState: {
		alignItems: "center",
		paddingVertical: DesignSystem.spacing["2xl"],
	},

	emptyText: {
		...DesignSystem.typography.body.medium,
		color: colors.text.tertiary,
		marginTop: DesignSystem.spacing.sm,
	},

	// Modal styles
	modalContainer: {
		flex: 1,
		backgroundColor: colors.surface.primary,
	},

	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: DesignSystem.spacing.xl,
		borderBottomWidth: 1,
		borderBottomColor: colors.border.secondary,
	},

	modalTitle: {
		...DesignSystem.typography.h3,
		color: colors.text.primary,
		fontWeight: "600",
	},

	modalContent: {
		flex: 1,
		padding: DesignSystem.spacing.xl,
	},

	fullImage: {
		width: "100%",
		height: 400,
		borderRadius: DesignSystem.radius.lg,
	},

	fullText: {
		...DesignSystem.typography.body.large,
		color: colors.text.primary,
		lineHeight: 24,
	},

	zkTlsDetails: {
		gap: DesignSystem.spacing.lg,
	},

	zkTlsHeader: {
		alignItems: "center",
		paddingVertical: DesignSystem.spacing.lg,
		gap: DesignSystem.spacing.md,
	},

	zkTlsTitle: {
		...DesignSystem.typography.h2,
		color: colors.primary[700],
		fontWeight: "600",
	},

	zkTlsInfo: {
		gap: DesignSystem.spacing.md,
	},

	zkTlsLabel: {
		...DesignSystem.typography.label.medium,
		color: colors.text.secondary,
		fontWeight: "600",
	},

	zkTlsValue: {
		...DesignSystem.typography.body.medium,
		color: colors.text.primary,
		fontFamily: "monospace",
		marginBottom: DesignSystem.spacing.sm,
	},

	zkTlsDescription: {
		...DesignSystem.typography.body.medium,
		color: colors.text.secondary,
		lineHeight: 22,
		fontStyle: "italic",
		textAlign: "center",
		marginTop: DesignSystem.spacing.lg,
	},
});
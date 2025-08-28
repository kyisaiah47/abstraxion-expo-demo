import React from "react";
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	Pressable
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";

interface SocialActivity {
	id: string;
	payerName: string;
	workerName: string;
	amount: number;
	denom: string;
	taskTitle: string;
	proofType: 'soft' | 'zktls' | 'hybrid';
	timestamp: string;
	isZkTLSVerified: boolean;
}

interface SocialFeedProps {
	activities: SocialActivity[];
	compact?: boolean;
	style?: any;
}

export default function SocialFeed({ activities, compact = false, style }: SocialFeedProps) {
	const { colors } = useTheme();

	const getTaskEmoji = (taskTitle: string) => {
		const title = taskTitle.toLowerCase();
		if (title.includes('bug') || title.includes('fix')) return '🛠️';
		if (title.includes('design') || title.includes('ui')) return '🎨';
		if (title.includes('code') || title.includes('develop')) return '💻';
		if (title.includes('test') || title.includes('qa')) return '🧪';
		if (title.includes('doc') || title.includes('write')) return '📝';
		if (title.includes('review')) return '👀';
		if (title.includes('deploy') || title.includes('launch')) return '🚀';
		return '⚡';
	};

	const getProofBadge = (proofType: string, isZkTLSVerified: boolean) => {
		switch (proofType) {
			case 'zktls':
				return (
					<View style={[styles.proofBadge, { backgroundColor: '#3B82F6' + '20' }]}>
						<Ionicons name="shield-checkmark" size={12} color="#3B82F6" />
						<Text style={[styles.proofText, { color: '#3B82F6' }]}>zkTLS</Text>
					</View>
				);
			case 'hybrid':
				return (
					<View style={[styles.proofBadge, { backgroundColor: colors.status?.warning + '20' }]}>
						<Ionicons name="layers" size={12} color={colors.status?.warning} />
						<Text style={[styles.proofText, { color: colors.status?.warning }]}>Hybrid</Text>
					</View>
				);
			default:
				return (
					<View style={[styles.proofBadge, { backgroundColor: colors.text.tertiary + '20' }]}>
						<Ionicons name="document" size={12} color={colors.text.tertiary} />
						<Text style={[styles.proofText, { color: colors.text.tertiary }]}>Soft</Text>
					</View>
				);
		}
	};

	const formatTimeAgo = (timestamp: string) => {
		const now = new Date();
		const time = new Date(timestamp);
		const diff = now.getTime() - time.getTime();
		
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	};

	const renderActivity = (activity: SocialActivity) => (
			<Pressable 
				key={activity.id}
				style={[
					styles.activityCard, 
					{ 
						backgroundColor: colors.surface.secondary,
						borderColor: colors.border.secondary 
					},
					compact && styles.activityCardCompact
				]}
			>
				<View style={styles.activityHeader}>
					<Text style={[styles.activityText, { color: colors.text.primary }]}>
						<Text style={styles.payerName}>{activity.payerName}</Text>
						{' paid '}
						<Text style={styles.workerName}>{activity.workerName}</Text>
						{' for '}
						<Text style={styles.taskTitle}>{activity.taskTitle}</Text>
						{' '}
						<Text style={styles.taskEmoji}>{getTaskEmoji(activity.taskTitle)}</Text>
					</Text>
				</View>
			
			<View style={styles.activityFooter}>
				<View style={styles.leftFooter}>
					{getProofBadge(activity.proofType, activity.isZkTLSVerified)}
				</View>
				
				<Text style={[styles.timeText, { color: colors.text.tertiary }]}>
					{formatTimeAgo(activity.timestamp)}
				</Text>
			</View>
		</Pressable>
	);

	if (activities.length === 0) {
		return (
			<View style={styles.emptyState}>
				<Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
				<Text style={[styles.emptyText, { color: colors.text.secondary }]}>
					No recent activity to show
				</Text>
				<Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
					Activity from completed tasks will appear here
				</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, style]}>
			<View style={[styles.header, { justifyContent: 'flex-end' }]}>
				<View style={[styles.liveBadge, { backgroundColor: colors.status?.success + '20' }]}>
					<View style={[styles.liveDot, { backgroundColor: colors.status?.success }]} />
					<Text style={[styles.liveText, { color: colors.status?.success }]}>Live</Text>
				</View>
			</View>
			
			<View style={styles.feedContent}>
				{activities.map(renderActivity)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingVertical: DesignSystem.spacing.md,
		gap: DesignSystem.spacing.sm,
	},
	
	headerTitle: {
		...DesignSystem.typography.h3,
		fontWeight: "600",
		flex: 1,
	},
	
	liveBadge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: DesignSystem.spacing.sm,
		paddingVertical: 4,
		borderRadius: 12,
		gap: 4,
	},
	
	liveDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	
	liveText: {
		...DesignSystem.typography.caption,
		fontWeight: "600",
	},
	
	feed: {
		flex: 1,
	},
	
	scrollView: {
		flex: 1,
	},
	
	feedContent: {
		paddingHorizontal: DesignSystem.spacing.lg,
		gap: DesignSystem.spacing.md,
	},
	
	activityCard: {
		padding: DesignSystem.spacing.lg,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		gap: DesignSystem.spacing.md,
	},
	
	activityCardCompact: {
		padding: DesignSystem.spacing.md,
		gap: DesignSystem.spacing.sm,
	},
	
	activityHeader: {
		minHeight: 50,
	},
	
	activityText: {
		...DesignSystem.typography.body,
		lineHeight: 22,
	},
	
	payerName: {
		fontWeight: "600",
	},
	
	workerName: {
		fontWeight: "600",
	},
	
	taskTitle: {
		fontStyle: "italic",
	},
	
	taskEmoji: {
		fontSize: 16,
	},
	
	activityFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	
	leftFooter: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
	},
	
	amount: {
		...DesignSystem.typography.bodyMedium,
		fontWeight: "600",
	},
	
	proofBadge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: DesignSystem.spacing.sm,
		paddingVertical: 2,
		borderRadius: 8,
		gap: 4,
	},
	
	proofText: {
		...DesignSystem.typography.caption,
		fontWeight: "600",
	},
	
	timeText: {
		...DesignSystem.typography.caption,
	},
	
	emptyState: {
		alignItems: "center",
		paddingVertical: DesignSystem.spacing["3xl"],
		paddingHorizontal: DesignSystem.spacing.lg,
		gap: DesignSystem.spacing.md,
	},
	
	emptyText: {
		...DesignSystem.typography.bodyMedium,
		fontWeight: "500",
		textAlign: "center",
	},
	
	emptySubtext: {
		...DesignSystem.typography.body,
		textAlign: "center",
	},
});
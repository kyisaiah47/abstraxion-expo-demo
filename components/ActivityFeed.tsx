import React from "react";
import { 
	View, 
	Text, 
	FlatList, 
	Pressable,
	RefreshControl 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import { Notification, NotificationType } from "@/types/proofpay";

interface ActivityFeedProps {
	notifications: Notification[];
	onRefresh?: () => void;
	refreshing?: boolean;
	onMarkAsRead?: (id: string) => void;
}

const getNotificationIcon = (type: NotificationType) => {
	switch (type) {
		case "task_created":
			return "add-circle";
		case "proof_submitted":
			return "document-text";
		case "pending_release_started":
			return "hourglass";
		case "task_released":
			return "checkmark-circle";
		case "task_disputed":
			return "alert-circle";
		case "task_refunded":
			return "refresh-circle";
		default:
			return "notifications";
	}
};

const getNotificationColor = (type: NotificationType, colors: any) => {
	switch (type) {
		case "task_created":
			return colors.status?.info || "#2563EB";
		case "proof_submitted":
			return colors.status?.warning || "#D97706";
		case "pending_release_started":
			return "#FF6B35";
		case "task_released":
			return colors.status?.success || "#059669";
		case "task_disputed":
		case "task_refunded":
			return colors.status?.error || "#DC2626";
		default:
			return colors.text.secondary;
	}
};

export default function ActivityFeed({ 
	notifications, 
	onRefresh, 
	refreshing = false,
	onMarkAsRead 
}: ActivityFeedProps) {
	const { colors } = useTheme();

	const handleNotificationPress = (notification: Notification) => {
		// Mark as read
		if (onMarkAsRead && !notification.read) {
			onMarkAsRead(notification.id);
		}

		// Navigate to task if applicable
		if (notification.taskId) {
			router.push(`/jobs/${notification.taskId}`);
		}
	};

	const formatTimeAgo = (date: Date) => {
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
		
		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m`;
		
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}h`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays}d`;
		
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};

	const getEnhancedMessage = (notification: Notification) => {
		const payload = (notification as any)?.payload || {};
		const amount = payload.amount ? `$${payload.amount}` : '';
		
		switch (notification.type) {
			case 'task_created':
				return `New ${amount} task available!`;
			case 'proof_submitted':
				return 'Proof submitted — review required';
			case 'pending_release_started':
				return 'Auto-release started — 24h countdown';
			case 'task_released':
				return `${amount} payment released! 💰`;
			case 'task_disputed':
				return 'Task disputed — review needed';
			case 'task_refunded':
				return `${amount} refund processed`;
			default:
				return notification.message;
		}
	};

	const renderNotification = ({ item }: { item: Notification }) => (
		<Pressable
			onPress={() => handleNotificationPress(item)}
			style={{
				backgroundColor: !item.read ? colors.surface.secondary : colors.surface.primary,
				borderBottomWidth: 1,
				borderBottomColor: colors.border.primary,
				paddingVertical: DesignSystem.spacing.lg,
				paddingHorizontal: DesignSystem.spacing.lg,
			}}
		>
			<View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
				{/* Icon with gradient-like styling */}
				<View style={{ marginRight: DesignSystem.spacing.md, marginTop: 2 }}>
					<View style={{
						width: 44,
						height: 44,
						borderRadius: 22,
						backgroundColor: getNotificationColor(item.type, colors),
						alignItems: 'center',
						justifyContent: 'center',
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.1,
						shadowRadius: 4,
						elevation: 2,
					}}>
						<Ionicons
							name={getNotificationIcon(item.type) as any}
							size={22}
							color="white"
						/>
					</View>
				</View>

				{/* Content */}
				<View style={{ flex: 1 }}>
					<View style={{ 
						flexDirection: 'row', 
						justifyContent: 'space-between', 
						alignItems: 'center',
						marginBottom: DesignSystem.spacing.xs
					}}>
						<Text style={{
							...DesignSystem.typography.bodyMedium,
							color: colors.text.primary,
							fontWeight: !item.read ? '600' : '500',
							flex: 1,
							marginRight: DesignSystem.spacing.sm,
						}} numberOfLines={1}>
							{item.title}
						</Text>
						<Text style={{
							...DesignSystem.typography.caption,
							color: colors.text.tertiary,
							fontWeight: '500',
						}}>
							{formatTimeAgo(item.createdAt)}
						</Text>
					</View>

					<Text style={{
						...DesignSystem.typography.body,
						color: colors.text.secondary,
						lineHeight: 20,
					}} numberOfLines={2}>
						{getEnhancedMessage(item)}
					</Text>

					{/* Unread indicator */}
					{!item.read && (
						<View style={{
							width: 8,
							height: 8,
							backgroundColor: colors.accent?.primary || '#2563EB',
							borderRadius: 4,
							marginTop: DesignSystem.spacing.sm,
							alignSelf: 'flex-start',
						}} />
					)}
				</View>

				{/* Arrow for navigation */}
				{item.taskId && (
					<View style={{ marginLeft: DesignSystem.spacing.sm, marginTop: 8 }}>
						<Ionicons
							name="chevron-forward"
							size={18}
							color={colors.text.tertiary}
						/>
					</View>
				)}
			</View>
		</Pressable>
	);

	const renderEmpty = () => (
		<View style={{
			alignItems: 'center',
			paddingVertical: DesignSystem.spacing['3xl'],
			paddingHorizontal: DesignSystem.spacing.xl,
		}}>
			<View style={{
				width: 80,
				height: 80,
				borderRadius: 40,
				backgroundColor: colors.surface.secondary,
				alignItems: 'center',
				justifyContent: 'center',
				marginBottom: DesignSystem.spacing.lg,
			}}>
				<Ionicons
					name="notifications-outline"
					size={40}
					color={colors.text.tertiary}
				/>
			</View>
			<Text style={{
				...DesignSystem.typography.h3,
				color: colors.text.primary,
				textAlign: 'center',
				marginBottom: DesignSystem.spacing.md,
			}}>
				Stay In The Loop
			</Text>
			<Text style={{
				...DesignSystem.typography.body,
				color: colors.text.secondary,
				textAlign: 'center',
				lineHeight: 22,
			}}>
				Your task activity, payments, and proof confirmations will appear here. Create your first task to get started!
			</Text>
		</View>
	);

	return (
		<FlatList
			data={notifications}
			keyExtractor={(item) => item.id}
			renderItem={renderNotification}
			ListEmptyComponent={renderEmpty}
			refreshControl={
				onRefresh ? (
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={colors.accent?.primary || '#2563EB'}
					/>
				) : undefined
			}
			showsVerticalScrollIndicator={false}
			style={{
				flex: 1,
				backgroundColor: colors.surface.primary,
			}}
			contentContainerStyle={{
				flexGrow: 1,
			}}
		/>
	);
}
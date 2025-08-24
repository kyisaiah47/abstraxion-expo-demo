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
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}h ago`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays}d ago`;
		
		return date.toLocaleDateString();
	};

	const renderNotification = ({ item }: { item: Notification }) => (
		<Pressable
			onPress={() => handleNotificationPress(item)}
			className={`border-b border-gray-100 dark:border-gray-800 p-4 ${
				!item.read ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900'
			}`}
		>
			<View className="flex-row items-start">
				{/* Icon */}
				<View className="mr-3 mt-1">
					<View className={`w-10 h-10 rounded-full items-center justify-center ${
						!item.read ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-800'
					}`}>
						<Ionicons
							name={getNotificationIcon(item.type) as any}
							size={20}
							color={getNotificationColor(item.type, colors)}
						/>
					</View>
				</View>

				{/* Content */}
				<View className="flex-1">
					<View className="flex-row items-center justify-between mb-1">
						<Text className={`font-medium text-gray-900 dark:text-white ${
							!item.read ? 'font-semibold' : ''
						}`} numberOfLines={1}>
							{item.title}
						</Text>
						<Text className="text-xs text-gray-500 dark:text-gray-400">
							{formatTimeAgo(item.createdAt)}
						</Text>
					</View>

					<Text className="text-sm text-gray-600 dark:text-gray-300" numberOfLines={2}>
						{item.message}
					</Text>

					{/* Unread indicator */}
					{!item.read && (
						<View className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
					)}
				</View>

				{/* Arrow */}
				{item.taskId && (
					<View className="ml-2 mt-2">
						<Ionicons
							name="chevron-forward"
							size={16}
							color={colors.text.tertiary}
						/>
					</View>
				)}
			</View>
		</Pressable>
	);

	const renderEmpty = () => (
		<View className="items-center py-12">
			<Ionicons
				name="notifications-outline"
				size={48}
				color={colors.text.tertiary}
			/>
			<Text className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">
				No Activity Yet
			</Text>
			<Text className="text-gray-500 dark:text-gray-400 text-center px-8">
				Your task activity and notifications will appear here
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
					/>
				) : undefined
			}
			showsVerticalScrollIndicator={false}
			className="flex-1 bg-white dark:bg-gray-900"
		/>
	);
}
import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	RefreshControl,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import ActivityFeed from "@/components/ActivityFeed";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import { supabase } from "@/lib/supabase";
import { Notification, NotificationType } from "@/types/proofpay";
import Toast from "react-native-toast-message";

const createStyles = (colors: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface.primary,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: DesignSystem.spacing.lg,
		paddingBottom: DesignSystem.spacing["2xl"],
	},
});

export default function RecentActivityScreen() {
	const { user } = useAuth();
	const { colors } = useTheme();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [loading, setLoading] = useState(true);

	const styles = createStyles(colors);

	const fetchNotifications = async () => {
		if (!user?.walletAddress) return;

		try {
			// First get the user ID from wallet address
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('id')
				.eq('wallet_address', user.walletAddress)
				.single();

			if (userError || !userData) {
				console.log('User not found in database');
				return;
			}

			// Fetch notifications
			const { data, error } = await supabase
				.from('notifications')
				.select('*')
				.eq('user_id', userData.id)
				.order('created_at', { ascending: false })
				.limit(50);

			if (error) {
				console.error('Error fetching notifications:', error);
				return;
			}

			const mappedNotifications: Notification[] = (data || []).map(item => ({
				id: item.id,
				type: item.type as NotificationType,
				title: item.title,
				message: item.message,
				taskId: item.task_id,
				createdAt: new Date(item.created_at),
				read: !!item.read_at,
			}));

			setNotifications(mappedNotifications);
		} catch (error) {
			console.error('Error in fetchNotifications:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleMarkAsRead = async (notificationId: string) => {
		try {
			const { error } = await supabase
				.from('notifications')
				.update({ read_at: new Date().toISOString() })
				.eq('id', notificationId);

			if (error) {
				console.error('Error marking notification as read:', error);
				return;
			}

			// Update local state
			setNotifications(prev => 
				prev.map(notif => 
					notif.id === notificationId 
						? { ...notif, read: true }
						: notif
				)
			);
		} catch (error) {
			console.error('Error in handleMarkAsRead:', error);
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchNotifications();
		setRefreshing(false);
	};

	const handleLogout = async () => {
		Alert.alert(
			"Sign Out",
			"Are you sure you want to sign out?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Sign Out",
					style: "destructive",
					onPress: async () => {
						try {
							await supabase.auth.signOut();
							router.replace("/");
						} catch (error) {
							console.error('Logout error:', error);
							Alert.alert("Error", "Failed to sign out. Please try again.");
						}
					},
				},
			]
		);
	};

	// Set up real-time subscription for new notifications
	useEffect(() => {
		fetchNotifications();

		// Listen for new notifications
		const handleNewNotification = (event: any) => {
			const newNotification = event.detail.notification;
			setNotifications(prev => [newNotification, ...prev]);
			
			// Show toast for new notifications
			Toast.show({
				type: 'success',
				text1: newNotification.title,
				text2: newNotification.message,
				position: 'top',
				visibilityTime: 4000,
			});
		};

		window.addEventListener?.('newNotification', handleNewNotification);

		return () => {
			window.removeEventListener?.('newNotification', handleNewNotification);
		};
	}, [user?.walletAddress]);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<SophisticatedHeader
				title="Activity Feed"
				subtitle="Stay updated on your task activity"
				onLogout={handleLogout}
			/>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
					/>
				}
			>
				<ActivityFeed
					notifications={notifications}
					onRefresh={handleRefresh}
					refreshing={refreshing}
					onMarkAsRead={handleMarkAsRead}
				/>
			</ScrollView>
		</SafeAreaView>
	);
}

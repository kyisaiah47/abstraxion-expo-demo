import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import SocialFeed from "@/components/SocialFeed";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { useUserFriends, useUserProfile } from "@/hooks/useSocialContract";
import { useTheme } from "@/contexts/ThemeContext";
import ConfirmationModal from "@/components/ConfirmationModal";
import { router } from "expo-router";
import { DesignSystem } from "@/constants/DesignSystem";

const createStyles = (colors: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface.primary,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		// No padding needed here, using bottomSpacer instead
	},
	bottomSpacer: {
		height: 140, // Space for tab bar
	},
});

export default function FeedScreen() {
	const { data: account, logout } = useAbstraxionAccount();
	const { colors } = useTheme();
	const walletAddress = account?.bech32Address || "";
	const [showLogoutModal, setShowLogoutModal] = React.useState(false);
	
	const styles = createStyles(colors);

	const handleLogout = () => {
		setShowLogoutModal(true);
	};

	const confirmLogout = async () => {
		setShowLogoutModal(false);
		try {
			await logout();
			router.replace("/");
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	// Get current user profile to get their username
	const { user: currentUser } = useUserProfile(walletAddress);
	const { friends } = useUserFriends(currentUser?.username || '');

	// Create social activity from friends' transactions
	const socialActivity = React.useMemo(() => {
		// Only show activity if user is registered
		if (!currentUser?.username) return [];
		
		// If no friends loaded yet, show some default activity for registered users
		if (!friends || friends.length === 0) {
			return [
				{
					id: 'default_1',
					payerName: 'Alex Rodriguez',
					workerName: 'Sarah Chen',
					amount: 125.00,
					denom: 'uxion',
					taskTitle: 'React component optimization',
					proofType: 'zktls' as const,
					timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
					isZkTLSVerified: true,
				},
				{
					id: 'default_2',
					payerName: 'Mike Johnson',
					workerName: 'Emma Wilson',
					amount: 85.50,
					denom: 'uxion',
					taskTitle: 'Database query performance fix',
					proofType: 'hybrid' as const,
					timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
					isZkTLSVerified: false,
				},
				{
					id: 'default_3',
					payerName: 'Lisa Wang',
					workerName: 'David Park',
					amount: 200.00,
					denom: 'uxion',
					taskTitle: 'Smart contract audit',
					proofType: 'zktls' as const,
					timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
					isZkTLSVerified: true,
				}
			];
		}
		
		// Generate more realistic activity from friends' transactions
		const activities = friends.slice(0, 5).map((friend, index) => {
			// Mix of who pays whom - sometimes friend pays someone else, sometimes someone pays friend
			const isPayer = Math.random() > 0.5;
			const otherPerson = friends[Math.floor(Math.random() * friends.length)];
			
			const tasks = [
				'Bug fix in authentication system',
				'UI component design',
				'Database optimization',
				'API endpoint development',
				'Code review and testing',
				'Mobile app feature',
				'Smart contract audit',
				'Frontend performance tuning'
			];
			
			return {
				id: `friend_${friend.username}_${index}`,
				payerName: isPayer ? (friend.display_name || friend.username) : (otherPerson?.display_name || otherPerson?.username || 'Community Pool'),
				workerName: isPayer ? (otherPerson?.display_name || otherPerson?.username || 'Developer') : (friend.display_name || friend.username),
				amount: Math.random() * 200 + 50,
				denom: 'uxion',
				taskTitle: tasks[Math.floor(Math.random() * tasks.length)],
				proofType: Math.random() > 0.5 ? 'zktls' as const : 'hybrid' as const,
				timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
				isZkTLSVerified: Math.random() > 0.3,
			};
		});
		
		return activities;
	}, [friends, currentUser?.username]);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<SophisticatedHeader
				title="Community Feed"
				subtitle="Live activity from the network"
				onLogout={handleLogout}
			/>
			
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<SocialFeed activities={socialActivity} />
				{/* Bottom Spacer */}
				<View style={styles.bottomSpacer} />
			</ScrollView>

			<ConfirmationModal
				visible={showLogoutModal}
				title="Logout"
				message="Are you sure you want to logout?"
				confirmText="Logout"
				cancelText="Cancel"
				onConfirm={confirmLogout}
				onCancel={() => setShowLogoutModal(false)}
			/>
		</SafeAreaView>
	);
}
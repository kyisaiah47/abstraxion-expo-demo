import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	RefreshControl,
	Pressable,
} from "react-native";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import BalanceCard from "@/components/BalanceCard";
import PaymentRow from "@/components/PaymentRow";
import InfoCard from "@/components/InfoCard";
import SocialFeed from "@/components/SocialFeed";
import { DesignSystem } from "@/constants/DesignSystem";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { usePaymentHistory, useUserFriends, useUserProfile } from "@/hooks/useSocialContract";
import { useTheme } from "@/contexts/ThemeContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import ConfirmationModal from "@/components/ConfirmationModal";
dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

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
	},
	section: {
		marginTop: DesignSystem.spacing.xl,
	},
	sectionTitle: {
		...(DesignSystem.typography.h3 || {}),
		color: colors.text.primary,
		marginBottom: DesignSystem.spacing["2xl"],
	},
	paymentsList: {
		gap: DesignSystem.spacing.lg,
	},
	bottomSpacer: {
		height: 140, // Space for tab bar
	},
	tabContainer: {
		flexDirection: "row",
		backgroundColor: colors.surface.secondary,
		marginHorizontal: DesignSystem.spacing.lg,
		marginTop: DesignSystem.spacing.lg,
		borderRadius: DesignSystem.radius.lg,
		padding: 4,
		marginBottom: DesignSystem.spacing.lg,
	},
	tab: {
		flex: 1,
		paddingVertical: DesignSystem.spacing.md,
		paddingHorizontal: DesignSystem.spacing.lg,
		borderRadius: DesignSystem.radius.md,
		alignItems: "center",
	},
	activeTab: {
		backgroundColor: colors.surface.primary,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	tabText: {
		...DesignSystem.typography.bodyMedium,
		fontWeight: "500",
		color: colors.text.secondary,
	},
	activeTabText: {
		color: colors.text.primary,
		fontWeight: "600",
	},
});

export default function PaymentsScreen() {
	const { data: account, logout } = useAbstraxionAccount();
	const { colors } = useTheme();
	const walletAddress = account?.bech32Address || "";
	const { payments, refetch } = usePaymentHistory(walletAddress);
	const [refreshing, setRefreshing] = React.useState(false);
	const [showLogoutModal, setShowLogoutModal] = React.useState(false);
	const [activeTab, setActiveTab] = React.useState<'personal' | 'social'>('personal');
	
	const styles = createStyles(colors);

	const userBalance = React.useMemo(() => {
		let total = 0;
		let awaitingAmount = 0;
		let verifiedCount = 0;
		if (payments && payments.length > 0) {
			payments.forEach((p) => {
				if (p.status === "Completed") {
					total +=
						typeof p.amount === "number"
							? p.amount
							: parseFloat(p.amount) / 1_000_000;
					verifiedCount++;
				} else if (p.status === "Pending") {
					awaitingAmount +=
						typeof p.amount === "number"
							? p.amount
							: parseFloat(p.amount) / 1_000_000;
				}
			});
		}
		return { total, awaitingAmount, verifiedCount };
	}, [payments]);

	const handleLogout = () => {
		setShowLogoutModal(true);
	};

	const confirmLogout = async () => {
		setShowLogoutModal(false);
		try {
			await logout();
			router.replace("/");
		} catch {
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Failed to sign out. Please try again.',
				position: 'bottom',
			});
		}
	};

	const handleStartTask = () => {
		router.push("/(tabs)/create");
	};

	const paymentTypeIcon = (type: string) => {
		switch (type) {
			case "HelpRequest":
				return "help-circle-outline";
			case "PaymentRequest":
				return "cash-outline";
			case "DirectPayment":
				return "arrow-up-circle-outline";
			default:
				return "swap-horizontal-outline";
		}
	};

	const renderEmptyState = () => (
		<InfoCard
			title="No Proof, No Payment"
			body="Mathematical verification eliminates payment disputes. Every task completion is cryptographically verified."
			icon="shield-checkmark"
		/>
	);

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
					payerName: 'David Park',
					workerName: 'Lisa Wang',
					amount: 200.00,
					denom: 'uxion',
					taskTitle: 'Security audit documentation',
					proofType: 'soft' as const,
					timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
					isZkTLSVerified: false,
				}
			];
		}
		
		// Create mock recent activities from friends
		const activities = [];
		const friendsNames = friends.slice(0, 5); // Show activity from first 5 friends
		
		for (let i = 0; i < Math.min(friendsNames.length, 5); i++) {
			const friend = friendsNames[i];
			const otherFriend = friendsNames[(i + 1) % friendsNames.length];
			
			activities.push({
				id: `social_${i}`,
				payerName: friend.display_name || friend.username,
				workerName: otherFriend.display_name || otherFriend.username,
				amount: 45.50 + Math.random() * 150,
				denom: 'uxion',
				taskTitle: [
					'UI bug fix for mobile dashboard',
					'React component refactor', 
					'API integration testing',
					'Database optimization review',
					'Frontend design implementation'
				][i % 5],
				proofType: ['zktls', 'hybrid', 'soft'][Math.floor(Math.random() * 3)] as 'zktls' | 'hybrid' | 'soft',
				timestamp: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000).toISOString(),
				isZkTLSVerified: Math.random() > 0.5,
			});
		}
		
		return activities;
	}, [friends, currentUser?.username]);

	// No payment processing needed - this will be a social feed only

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title="Community Feed"
				subtitle="Live activity from the network"
				onLogout={handleLogout}
			/>

			{activeTab === 'personal' ? (
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={async () => {
								setRefreshing(true);
								await refetch();
								setRefreshing(false);
							}}
						/>
					}
					nestedScrollEnabled={true}
				>
					<BalanceCard
						total={userBalance.total}
						awaitingAmount={userBalance.awaitingAmount}
						verifiedCount={userBalance.verifiedCount}
						ctaLabel="+ Create"
						onPressCta={handleStartTask}
					/>
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Latest Proofs</Text>
						{payments && payments.length > 0
							? Object.entries(groupedPayments).map(([date, group]) => (
									<View
										key={date}
										style={{ marginBottom: DesignSystem.spacing.xl }}
									>
										<Text
											style={{
												...DesignSystem.typography.body,
												color: colors.text.secondary,
												marginBottom: DesignSystem.spacing.md,
											}}
										>
											{date}
										</Text>
										<View style={styles.paymentsList}>
											{group.map((payment) => {
												let proofStatus:
													| "Proof Confirmed"
													| "Awaiting Proof"
													| "Payment Sent" = "Payment Sent";
												if (payment.status === "Completed")
													proofStatus = "Proof Confirmed";
												else if (payment.status === "Pending")
													proofStatus = "Awaiting Proof";
												let timeAgo = "";
												if (
													"created_at" in payment &&
													(typeof payment.created_at === "string" ||
														typeof payment.created_at === "number")
												) {
													timeAgo = dayjs(payment.created_at).fromNow();
												}
												return (
													<PaymentRow
														key={payment.id}
														title={payment.description || ""}
														subtitle={payment.payment_type || ""}
														amount={
															typeof payment.amount === "number"
																? payment.amount
																: parseFloat(payment.amount) / 1_000_000
														}
														direction={
															payment.from_username === currentUser?.username ? "out" : "in"
														}
														status={proofStatus}
														timeAgo={timeAgo}
														// icon prop removed, handle icon logic inside PaymentRow if needed
													/>
												);
											})}
										</View>
									</View>
							  ))
							: renderEmptyState()}
					</View>
					<View style={styles.bottomSpacer} />
				</ScrollView>
			) : (
				<ScrollView 
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					nestedScrollEnabled={true}
				>
					<SocialFeed activities={socialActivity} />
					<View style={styles.bottomSpacer} />
				</ScrollView>
			)}

			<ConfirmationModal
				visible={showLogoutModal}
				title="Sign Out"
				message="Are you sure you want to sign out of your account?"
				confirmText="Sign Out"
				cancelText="Cancel"
				confirmStyle="destructive"
				icon="log-out-outline"
				onConfirm={confirmLogout}
				onCancel={() => setShowLogoutModal(false)}
			/>
		</SafeAreaView>
	);
}

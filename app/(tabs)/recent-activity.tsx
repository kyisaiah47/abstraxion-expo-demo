import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import PaymentRow from "@/components/PaymentRow";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import { usePaymentHistory } from "@/hooks/useSocialContract";
import Toast from "react-native-toast-message";
import ConfirmationModal from "@/components/ConfirmationModal";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

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
		paddingBottom: DesignSystem.spacing["2xl"],
	},
	sectionTitle: {
		...DesignSystem.typography.h3,
		color: colors.text.primary,
		marginBottom: DesignSystem.spacing.lg,
		marginTop: DesignSystem.spacing.xl,
	},
	paymentsList: {
		gap: DesignSystem.spacing.lg,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: DesignSystem.spacing["4xl"],
	},
	emptyTitle: {
		...DesignSystem.typography.h3,
		color: colors.text.primary,
		marginBottom: DesignSystem.spacing.md,
		textAlign: 'center',
	},
	emptyMessage: {
		...DesignSystem.typography.body,
		color: colors.text.secondary,
		textAlign: 'center',
		lineHeight: 22,
	},
});

export default function RecentActivityScreen() {
	const { data: account, logout } = useAbstraxionAccount();
	const { colors } = useTheme();
	const walletAddress = account?.bech32Address || "";
	const { payments, refetch } = usePaymentHistory(walletAddress);
	const [refreshing, setRefreshing] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);

	const styles = createStyles(colors);

	console.log('🔄 Payment activity:', payments?.length || 0, 'items');
	console.log('💳 Wallet address:', walletAddress);
	console.log('📊 Payments data:', payments);

	const handleRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

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
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Failed to sign out. Please try again.',
				position: 'bottom',
			});
		}
	};

	// Group payments by date
	const groupedPayments: { [date: string]: typeof payments } = {};
	if (payments && payments.length > 0) {
		payments.forEach((payment) => {
			let dateLabel = "";
			if (
				"created_at" in payment &&
				(typeof payment.created_at === "string" ||
					typeof payment.created_at === "number")
			) {
				const d = dayjs(payment.created_at);
				if (d.isToday()) dateLabel = "Today";
				else if (d.isYesterday()) dateLabel = "Yesterday";
				else dateLabel = d.format("MMM D, YYYY");
			} else {
				dateLabel = "Unknown Date";
			}
			if (!groupedPayments[dateLabel]) groupedPayments[dateLabel] = [];
			groupedPayments[dateLabel].push(payment);
		});
	}

	const renderEmptyState = () => (
		<View style={styles.emptyContainer}>
			<Text style={styles.emptyTitle}>No Activity Yet</Text>
			<Text style={styles.emptyMessage}>
				Your payment requests, task completions, and transaction history will appear here. Create your first task or payment to get started!
			</Text>
		</View>
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<SophisticatedHeader
				title="Activity Feed"
				subtitle="Your complete transaction history"
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
				{payments && payments.length > 0 
					? Object.entries(groupedPayments).map(([date, group]) => (
						<View key={date} style={{ marginBottom: DesignSystem.spacing.xl }}>
							<Text style={{
								...DesignSystem.typography.body,
								color: colors.text.secondary,
								marginBottom: DesignSystem.spacing.md,
							}}>
								{date}
							</Text>
							<View style={styles.paymentsList}>
								{group.map((payment) => {
									let proofStatus: "Proof Confirmed" | "Awaiting Proof" | "Payment Sent" = "Payment Sent";
									if (payment.status === "Completed") proofStatus = "Proof Confirmed";
									else if (payment.status === "Pending") proofStatus = "Awaiting Proof";
									
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
												payment.from_username === walletAddress ? "out" : "in"
											}
											status={proofStatus}
											timeAgo={timeAgo}
										/>
									);
								})}
							</View>
						</View>
					))
					: renderEmptyState()
				}
			</ScrollView>

			<ConfirmationModal
				visible={showLogoutModal}
				title="Sign Out"
				message="Are you sure you want to sign out?"
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
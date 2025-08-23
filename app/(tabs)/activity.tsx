import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Alert,
	RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import BalanceCard from "@/components/BalanceCard";
import PaymentRow from "@/components/PaymentRow";
import InfoCard from "@/components/InfoCard";
import { DesignSystem } from "@/constants/DesignSystem";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { usePaymentHistory } from "@/hooks/useSocialContract";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.primary,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: DesignSystem.spacing.lg,
		paddingBottom: DesignSystem.spacing["2xl"],
	},
	section: {
		marginTop: DesignSystem.spacing.xl,
	},
	sectionTitle: {
		...(DesignSystem.typography.h3 || {}),
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing["2xl"],
	},
	paymentsList: {
		gap: DesignSystem.spacing.lg,
	},
	bottomSpacer: {
		height: DesignSystem.spacing["3xl"],
	},
});

export default function PaymentsScreen() {
	const { data: account, logout } = useAbstraxionAccount();
	// TODO: Replace with actual user profile fetch logic
	const username = account?.bech32Address || "";
	const { payments, refetch } = usePaymentHistory(username);
	const [refreshing, setRefreshing] = React.useState(false);

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

	const handleLogout = async () => {
		try {
			await logout();
			router.replace("/");
		} catch {
			Alert.alert("Error", "Failed to sign out. Please try again.");
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

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title="Verified Payments"
				subtitle="Your cryptographically secured transactions"
				onLogout={handleLogout}
			/>
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
											color: DesignSystem.colors.text.secondary,
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
														payment.from_username === username ? "out" : "in"
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
		</SafeAreaView>
	);
}

import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Pressable,
	Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import { DesignSystem } from "@/constants/DesignSystem";

const { width } = Dimensions.get("window");

interface PaymentActivity {
	id: string;
	type: "sent" | "received" | "pending" | "waiting_proof";
	title: string;
	description: string;
	amount: number;
	timestamp: string;
	status: "completed" | "pending" | "waiting" | "failed";
	recipient?: string;
	sender?: string;
	proofRequired?: boolean;
	hasProof?: boolean;
}

export default function PaymentActivity() {
	const recentPayments: PaymentActivity[] = [
		{
			id: "1",
			type: "received",
			title: "Logo Design",
			description: "Payment received from Alex Chen",
			amount: 150.0,
			timestamp: "2 hours ago",
			status: "completed",
			sender: "Alex Chen",
			proofRequired: true,
			hasProof: true,
		},
		{
			id: "2",
			type: "waiting_proof",
			title: "Lawn Mowing",
			description: "Waiting for proof from Jordan Kim",
			amount: 75.0,
			timestamp: "4 hours ago",
			status: "waiting",
			recipient: "Jordan Kim",
			proofRequired: true,
			hasProof: false,
		},
		{
			id: "3",
			type: "sent",
			title: "Grocery Run",
			description: "Sent to Sarah Wilson",
			amount: 45.5,
			timestamp: "6 hours ago",
			status: "completed",
			recipient: "Sarah Wilson",
			proofRequired: false,
		},
		{
			id: "4",
			type: "pending",
			title: "House Cleaning",
			description: "Payment pending - proof submitted",
			amount: 120.0,
			timestamp: "1 day ago",
			status: "pending",
			recipient: "Maria Santos",
			proofRequired: true,
			hasProof: true,
		},
		{
			id: "5",
			type: "received",
			title: "Moving Help",
			description: "Payment received from David Park",
			amount: 200.0,
			timestamp: "2 days ago",
			status: "completed",
			sender: "David Park",
			proofRequired: true,
			hasProof: true,
		},
	];

	const getActivityIcon = (
		type: PaymentActivity["type"],
		status: PaymentActivity["status"]
	) => {
		if (type === "waiting_proof") return "hourglass-outline";
		if (status === "failed") return "close-circle";
		if (status === "pending") return "time-outline";

		switch (type) {
			case "received":
				return "arrow-down-circle";
			case "sent":
				return "arrow-up-circle";
			default:
				return "swap-horizontal";
		}
	};

	const getStatusColor = (
		type: PaymentActivity["type"],
		status: PaymentActivity["status"]
	) => {
		if (status === "failed") return DesignSystem.colors.status.error;
		if (status === "waiting" || type === "waiting_proof")
			return DesignSystem.colors.status.warning;
		if (status === "pending") return DesignSystem.colors.status.info;

		switch (type) {
			case "received":
				return DesignSystem.colors.status.success;
			case "sent":
				return DesignSystem.colors.primary[700];
			default:
				return DesignSystem.colors.status.info;
		}
	};

	const getAmountPrefix = (type: PaymentActivity["type"]) => {
		switch (type) {
			case "received":
				return "+";
			case "sent":
				return "-";
			default:
				return "";
		}
	};

	const totalBalance = recentPayments
		.filter((p) => p.status === "completed")
		.reduce((sum, p) => {
			return sum + (p.type === "received" ? p.amount : -p.amount);
		}, 0);

	const pendingAmount = recentPayments
		.filter((p) => p.status === "pending" || p.status === "waiting")
		.reduce((sum, p) => sum + p.amount, 0);

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title="Payment Activity"
				subtitle="Your verified payment history"
			/>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Balance Overview */}
				<View style={styles.section}>
					<View style={styles.balanceCard}>
						<LinearGradient
							colors={[
								DesignSystem.colors.primary[700],
								DesignSystem.colors.primary[900],
							]}
							style={StyleSheet.absoluteFillObject}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
						/>

						<View style={styles.balanceContent}>
							<Text style={styles.balanceLabel}>Total Balance</Text>
							<Text style={styles.balanceAmount}>
								$
								{Math.abs(totalBalance).toLocaleString("en-US", {
									minimumFractionDigits: 2,
								})}
							</Text>

							<View style={styles.balanceStats}>
								<View style={styles.balanceStat}>
									<Text style={styles.balanceStatValue}>
										$
										{pendingAmount.toLocaleString("en-US", {
											minimumFractionDigits: 2,
										})}
									</Text>
									<Text style={styles.balanceStatLabel}>Pending</Text>
								</View>
								<View style={styles.balanceStat}>
									<Text style={styles.balanceStatValue}>
										{
											recentPayments.filter(
												(p) => p.proofRequired && p.hasProof
											).length
										}
									</Text>
									<Text style={styles.balanceStatLabel}>Verified</Text>
								</View>
							</View>
						</View>
					</View>
				</View>

				{/* Quick Actions */}
				<View style={styles.section}>
					<View style={styles.quickActionsGrid}>
						<Pressable
							style={styles.quickActionCard}
							onPress={() => router.push("/create")}
						>
							<View
								style={[
									styles.quickActionIcon,
									{
										backgroundColor: DesignSystem.colors.status.success + "20",
									},
								]}
							>
								<Ionicons
									name="add"
									size={24}
									color={DesignSystem.colors.status.success}
								/>
							</View>
							<Text style={styles.quickActionTitle}>Create Task</Text>
						</Pressable>

						<Pressable
							style={styles.quickActionCard}
							onPress={() => router.push("/qr-scanner")}
						>
							<View
								style={[
									styles.quickActionIcon,
									{ backgroundColor: DesignSystem.colors.status.info + "20" },
								]}
							>
								<Ionicons
									name="qr-code"
									size={24}
									color={DesignSystem.colors.status.info}
								/>
							</View>
							<Text style={styles.quickActionTitle}>Scan QR</Text>
						</Pressable>

						<Pressable
							style={styles.quickActionCard}
							onPress={() => router.push("/zktls-demo")}
						>
							<View
								style={[
									styles.quickActionIcon,
									{ backgroundColor: DesignSystem.colors.primary[600] + "20" },
								]}
							>
								<Ionicons
									name="shield-checkmark"
									size={24}
									color={DesignSystem.colors.primary[600]}
								/>
							</View>
							<Text style={styles.quickActionTitle}>Demo</Text>
						</Pressable>
					</View>
				</View>

				{/* Payment History */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Recent Payments</Text>

					<View style={styles.paymentsList}>
						{recentPayments.map((payment, index) => (
							<Pressable
								key={payment.id}
								style={[
									styles.paymentItem,
									index < recentPayments.length - 1 && styles.paymentItemBorder,
								]}
								onPress={() => router.push(`/jobs/${payment.id}`)}
							>
								<View
									style={[
										styles.paymentIcon,
										{
											backgroundColor:
												getStatusColor(payment.type, payment.status) + "20",
										},
									]}
								>
									<Ionicons
										name={getActivityIcon(payment.type, payment.status)}
										size={22}
										color={getStatusColor(payment.type, payment.status)}
									/>
								</View>

								<View style={styles.paymentContent}>
									<View style={styles.paymentText}>
										<Text style={styles.paymentTitle}>{payment.title}</Text>
										<Text style={styles.paymentDescription}>
											{payment.description}
										</Text>
									</View>

									<View style={styles.paymentMeta}>
										<Text
											style={[
												styles.paymentAmount,
												{
													color:
														payment.type === "received"
															? DesignSystem.colors.status.success
															: payment.type === "sent"
															? DesignSystem.colors.text.primary
															: DesignSystem.colors.status.warning,
												},
											]}
										>
											{getAmountPrefix(payment.type)}$
											{payment.amount.toFixed(2)}
										</Text>
										<Text style={styles.paymentTime}>{payment.timestamp}</Text>

										{payment.proofRequired && (
											<View style={styles.proofBadge}>
												<Ionicons
													name={
														payment.hasProof
															? "shield-checkmark"
															: "shield-outline"
													}
													size={12}
													color={
														payment.hasProof
															? DesignSystem.colors.status.success
															: DesignSystem.colors.text.tertiary
													}
												/>
												<Text
													style={[
														styles.proofText,
														{
															color: payment.hasProof
																? DesignSystem.colors.status.success
																: DesignSystem.colors.text.tertiary,
														},
													]}
												>
													{payment.hasProof ? "Verified" : "Proof Required"}
												</Text>
											</View>
										)}
									</View>
								</View>
							</Pressable>
						))}
					</View>
				</View>

				{/* Trust Message */}
				<View style={styles.trustSection}>
					<View style={styles.trustCard}>
						<Ionicons
							name="shield-checkmark"
							size={32}
							color={DesignSystem.colors.primary[700]}
						/>
						<Text style={styles.trustTitle}>No Proof, No Payment</Text>
						<Text style={styles.trustSubtitle}>
							Mathematical verification eliminates payment disputes. Every task
							completion is cryptographically verified.
						</Text>
					</View>
				</View>

				{/* Bottom Spacer for Tab Bar */}
				<View style={styles.bottomSpacer} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.primary,
	},

	scrollView: {
		flex: 1,
	},

	scrollContent: {
		paddingHorizontal: DesignSystem.layout.containerPadding,
		paddingTop: DesignSystem.spacing["2xl"],
	},

	section: {
		marginBottom: DesignSystem.spacing["4xl"],
	},

	sectionTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing["2xl"],
	},

	// Balance Overview
	balanceCard: {
		borderRadius: DesignSystem.radius.xl,
		overflow: "hidden",
		...DesignSystem.shadows.lg,
	},

	balanceContent: {
		padding: DesignSystem.spacing["3xl"],
		gap: DesignSystem.spacing.lg,
	},

	balanceLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.inverse,
		opacity: 0.9,
	},

	balanceAmount: {
		...DesignSystem.typography.h1,
		color: DesignSystem.colors.text.inverse,
		fontSize: 36,
	},

	balanceStats: {
		flexDirection: "row",
		gap: DesignSystem.spacing["2xl"],
	},

	balanceStat: {
		flex: 1,
	},

	balanceStatValue: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.inverse,
	},

	balanceStatLabel: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.inverse,
		opacity: 0.8,
	},

	// Quick Actions
	quickActionsGrid: {
		flexDirection: "row",
		gap: DesignSystem.spacing.xl,
	},

	quickActionCard: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		alignItems: "center",
		gap: DesignSystem.spacing.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
	},

	quickActionIcon: {
		width: 56,
		height: 56,
		borderRadius: DesignSystem.radius.xl,
		alignItems: "center",
		justifyContent: "center",
	},

	quickActionTitle: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
		textAlign: "center",
	},

	// Payment History
	paymentsList: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
		overflow: "hidden",
	},

	paymentItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: DesignSystem.spacing["2xl"],
		gap: DesignSystem.spacing.xl,
	},

	paymentItemBorder: {
		borderBottomWidth: 1,
		borderBottomColor: DesignSystem.colors.border.tertiary,
	},

	paymentIcon: {
		width: 48,
		height: 48,
		borderRadius: DesignSystem.radius.xl,
		alignItems: "center",
		justifyContent: "center",
	},

	paymentContent: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	paymentText: {
		flex: 1,
		gap: DesignSystem.spacing.xs,
	},

	paymentTitle: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	paymentDescription: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},

	paymentMeta: {
		alignItems: "flex-end",
		gap: DesignSystem.spacing.xs,
	},

	paymentAmount: {
		...DesignSystem.typography.label.large,
		fontWeight: "600",
	},

	paymentTime: {
		...DesignSystem.typography.caption,
		color: DesignSystem.colors.text.tertiary,
	},

	proofBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.xs,
	},

	proofText: {
		...DesignSystem.typography.caption,
		fontSize: 11,
	},

	// Trust Section
	trustSection: {
		marginBottom: DesignSystem.spacing["2xl"],
	},

	trustCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["3xl"],
		alignItems: "center",
		gap: DesignSystem.spacing.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
	},

	trustTitle: {
		...DesignSystem.typography.h4,
		color: DesignSystem.colors.text.primary,
		textAlign: "center",
	},

	trustSubtitle: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
		lineHeight: 22,
	},

	bottomSpacer: {
		height: 140, // Space for sophisticated tab bar
	},
});

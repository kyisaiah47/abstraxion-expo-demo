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

interface EarningsData {
	period: string;
	amount: number;
	change: number;
}

interface ActivityItem {
	id: string;
	type: "job_completed" | "payment_received" | "job_posted";
	title: string;
	subtitle: string;
	amount?: number;
	timestamp: string;
	status: "success" | "pending" | "warning";
}

export default function SophisticatedDashboard() {
	const earningsData: EarningsData[] = [
		{ period: "Today", amount: 245.8, change: 12.5 },
		{ period: "This Week", amount: 1847.2, change: 8.2 },
		{ period: "This Month", amount: 6234.75, change: -2.1 },
	];

	const recentActivity: ActivityItem[] = [
		{
			id: "1",
			type: "payment_received",
			title: "Payment Received",
			subtitle: "Data Entry Task #1247",
			amount: 125.5,
			timestamp: "2 hours ago",
			status: "success",
		},
		{
			id: "2",
			type: "job_completed",
			title: "Task Completed",
			subtitle: "Image Verification Project",
			amount: 89.25,
			timestamp: "5 hours ago",
			status: "pending",
		},
		{
			id: "3",
			type: "job_posted",
			title: "New Job Available",
			subtitle: "Content Moderation Task",
			timestamp: "1 day ago",
			status: "warning",
		},
	];

	const getActivityIcon = (type: ActivityItem["type"]) => {
		switch (type) {
			case "payment_received":
				return "card";
			case "job_completed":
				return "checkmark-circle";
			case "job_posted":
				return "briefcase";
		}
	};

	const getStatusColor = (status: ActivityItem["status"]) => {
		switch (status) {
			case "success":
				return DesignSystem.colors.status.success;
			case "pending":
				return DesignSystem.colors.status.warning;
			case "warning":
				return DesignSystem.colors.status.info;
		}
	};

	const handleQuickAction = (action: string) => {
		switch (action) {
			case "find_jobs":
				router.push("/(tabs)/marketplace");
				break;
			case "create_job":
				router.push("/create");
				break;
			case "view_earnings":
				// TODO: Navigate to detailed earnings
				break;
			case "view_activity":
				router.push("/recent-activity");
				break;
		}
	};

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title="Welcome back"
				subtitle="Track your progress and earnings"
			/>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Earnings Overview */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Earnings Overview</Text>
					<View style={styles.earningsGrid}>
						{earningsData.map((item, index) => (
							<Pressable
								key={item.period}
								style={[
									styles.earningsCard,
									index === 0 && styles.primaryEarningsCard,
								]}
								onPress={() => handleQuickAction("view_earnings")}
							>
								{index === 0 && (
									<LinearGradient
										colors={[
											DesignSystem.colors.primary[700],
											DesignSystem.colors.primary[900],
										]}
										style={StyleSheet.absoluteFillObject}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
									/>
								)}

								<View style={styles.earningsCardContent}>
									<Text
										style={[
											styles.earningsPeriod,
											index === 0 && styles.primaryText,
										]}
									>
										{item.period}
									</Text>

									<Text
										style={[
											styles.earningsAmount,
											index === 0 && styles.primaryText,
										]}
									>
										$
										{item.amount.toLocaleString("en-US", {
											minimumFractionDigits: 2,
										})}
									</Text>

									<View style={styles.changeContainer}>
										<Ionicons
											name={item.change >= 0 ? "trending-up" : "trending-down"}
											size={16}
											color={
												index === 0
													? DesignSystem.colors.text.inverse
													: item.change >= 0
													? DesignSystem.colors.status.success
													: DesignSystem.colors.status.error
											}
										/>
										<Text
											style={[
												styles.changeText,
												index === 0 && styles.primaryText,
												!index &&
													item.change < 0 && {
														color: DesignSystem.colors.text.inverse,
													},
												index > 0 && {
													color:
														item.change >= 0
															? DesignSystem.colors.status.success
															: DesignSystem.colors.status.error,
												},
											]}
										>
											{Math.abs(item.change)}%
										</Text>
									</View>
								</View>
							</Pressable>
						))}
					</View>
				</View>

				{/* Quick Actions */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Quick Actions</Text>
					<View style={styles.quickActionsGrid}>
						<Pressable
							style={styles.quickActionCard}
							onPress={() => handleQuickAction("find_jobs")}
						>
							<View
								style={[
									styles.quickActionIcon,
									{ backgroundColor: DesignSystem.colors.status.info + "20" },
								]}
							>
								<Ionicons
									name="search"
									size={24}
									color={DesignSystem.colors.status.info}
								/>
							</View>
							<Text style={styles.quickActionTitle}>Find Jobs</Text>
							<Text style={styles.quickActionSubtitle}>
								Browse available tasks
							</Text>
						</Pressable>

						<Pressable
							style={styles.quickActionCard}
							onPress={() => handleQuickAction("create_job")}
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
							<Text style={styles.quickActionTitle}>Post Job</Text>
							<Text style={styles.quickActionSubtitle}>Create new task</Text>
						</Pressable>
					</View>
				</View>

				{/* Recent Activity */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Recent Activity</Text>
						<Pressable onPress={() => handleQuickAction("view_activity")}>
							<Text style={styles.viewAllText}>View All</Text>
						</Pressable>
					</View>

					<View style={styles.activityList}>
						{recentActivity.map((item, index) => (
							<View
								key={item.id}
								style={[
									styles.activityItem,
									index < recentActivity.length - 1 &&
										styles.activityItemBorder,
								]}
							>
								<View
									style={[
										styles.activityIcon,
										{ backgroundColor: getStatusColor(item.status) + "20" },
									]}
								>
									<Ionicons
										name={getActivityIcon(item.type)}
										size={20}
										color={getStatusColor(item.status)}
									/>
								</View>

								<View style={styles.activityContent}>
									<View style={styles.activityText}>
										<Text style={styles.activityTitle}>{item.title}</Text>
										<Text style={styles.activitySubtitle}>{item.subtitle}</Text>
									</View>

									<View style={styles.activityMeta}>
										{item.amount && (
											<Text style={styles.activityAmount}>
												+${item.amount.toFixed(2)}
											</Text>
										)}
										<Text style={styles.activityTime}>{item.timestamp}</Text>
									</View>
								</View>
							</View>
						))}
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

	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: DesignSystem.spacing["2xl"],
	},

	sectionTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing["2xl"],
	},

	viewAllText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.primary[800],
	},

	// Earnings Overview
	earningsGrid: {
		gap: DesignSystem.spacing.xl,
	},

	earningsCard: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["3xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.md,
		overflow: "hidden",
	},

	primaryEarningsCard: {
		borderColor: "transparent",
		...DesignSystem.shadows.lg,
	},

	earningsCardContent: {
		gap: DesignSystem.spacing.md,
	},

	earningsPeriod: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.secondary,
	},

	earningsAmount: {
		...DesignSystem.typography.h1,
		color: DesignSystem.colors.text.primary,
	},

	changeContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: DesignSystem.spacing.sm,
	},

	changeText: {
		...DesignSystem.typography.label.medium,
	},

	primaryText: {
		color: DesignSystem.colors.text.inverse,
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

	quickActionSubtitle: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
	},

	// Recent Activity
	activityList: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.shadows.sm,
		overflow: "hidden",
	},

	activityItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: DesignSystem.spacing["2xl"],
		gap: DesignSystem.spacing.xl,
	},

	activityItemBorder: {
		borderBottomWidth: 1,
		borderBottomColor: DesignSystem.colors.border.tertiary,
	},

	activityIcon: {
		width: 44,
		height: 44,
		borderRadius: DesignSystem.radius.lg,
		alignItems: "center",
		justifyContent: "center",
	},

	activityContent: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	activityText: {
		flex: 1,
		gap: DesignSystem.spacing.xs,
	},

	activityTitle: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
	},

	activitySubtitle: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},

	activityMeta: {
		alignItems: "flex-end",
		gap: DesignSystem.spacing.xs,
	},

	activityAmount: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.status.success,
	},

	activityTime: {
		...DesignSystem.typography.caption,
		color: DesignSystem.colors.text.tertiary,
	},

	bottomSpacer: {
		height: 140, // Space for sophisticated tab bar
	},
});

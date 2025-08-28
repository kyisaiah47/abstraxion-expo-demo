import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	RefreshControl,
	Modal,
	ActivityIndicator,
	Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import PaymentRow from "@/components/PaymentRow";
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import { usePaymentHistory, useUserProfile, useSocialOperations } from "@/hooks/useSocialContract";
import Toast from "react-native-toast-message";
import ConfirmationModal from "@/components/ConfirmationModal";
import ProofSubmissionSheet from "./jobs/[id]/proof-submission";
import { type Job } from "@/lib/contractService";
import { createClient } from '@supabase/supabase-js';
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
		paddingBottom: 140, // Space for tab bar
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
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
	},
	spinnerModal: {
		padding: DesignSystem.spacing.xl,
		borderRadius: DesignSystem.radius.xl,
		borderWidth: 1,
		alignItems: 'center',
		gap: DesignSystem.spacing.md,
		marginHorizontal: DesignSystem.spacing.xl,
	},
	spinnerText: {
		...DesignSystem.typography.label.medium,
		fontWeight: '500',
	},
});

export default function RecentActivityScreen() {
	const { data: account, logout } = useAbstraxionAccount();
	const { client: signingClient } = useAbstraxionSigningClient();
	const { colors } = useTheme();
	const walletAddress = account?.bech32Address || "";
	const { payments, refetch } = usePaymentHistory(walletAddress);
	const { user: currentUser } = useUserProfile(walletAddress);
	const { sendDirectPayment } = useSocialOperations(signingClient);
	const [refreshing, setRefreshing] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [showProofModal, setShowProofModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState<any>(null);
	const [selectedTask, setSelectedTask] = useState<any>(null);
	const [sendingPayment, setSendingPayment] = useState(false);

	const styles = createStyles(colors);

	console.log('📱 Recent Activity Debug:');
	console.log('  - Wallet:', walletAddress);
	console.log('  - Payments count:', payments?.length || 0);
	console.log('  - Current user:', currentUser?.username);
	console.log('  - First payment:', payments?.[0]);
	console.log('  - Signing client available:', !!signingClient);
	console.log('  - Account:', account);


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

	const handleProofSubmit = async (proof: string) => {
		if (!selectedTask) return;
		
		try {
			console.log("📝 Proof submitted:", proof);
			
			const supabase = createClient(
				process.env.EXPO_PUBLIC_SUPABASE_URL!,
				process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
			);
			
			// Update the original task activity with proof submission
			const { error: updateError } = await supabase
				.from('activity_feed')
				.update({
					meta: {
						...selectedTask.meta,
						status: 'proof_submitted',
						proof: proof,
						submitted_at: new Date().toISOString()
					}
				})
				.eq('id', selectedTask.id);

			if (updateError) {
				console.error("Database update error:", updateError);
				throw new Error("Failed to update task status");
			}
			
			setShowProofModal(false);
			setSelectedTask(null);
			await refetch();
			
			Toast.show({
				type: 'success',
				text1: 'Proof Submitted!',
				text2: 'Your proof has been submitted for review.',
				position: 'bottom',
			});
		} catch (error) {
			console.error("Proof submission error:", error);
			Toast.show({
				type: 'error',
				text1: 'Submission Failed',
				text2: 'Please try again',
				position: 'bottom',
			});
		}
	};

	const displayPayments = payments || [];

	// Group payments by date
	const groupedPayments: { [date: string]: typeof displayPayments } = {};
	if (displayPayments && displayPayments.length > 0) {
		displayPayments.forEach((payment) => {
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
	
	console.log('  - Display payments count:', displayPayments?.length);
	console.log('  - Grouped payments keys:', Object.keys(groupedPayments));
	console.log('  - Grouped payments:', groupedPayments);

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
				title="Activities"
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
				{displayPayments && displayPayments.length > 0 
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
									console.log('🔍 Payment debug:', {
										id: payment.id,
										payment_type: payment.payment_type,
										verb: payment.verb,
										status: payment.status,
										from_username: payment.from_username,
										to_username: payment.to_username,
										currentUser: currentUser?.username,
										description: payment.description,
										displayDirection: payment.payment_type === 'request_money' && payment.to_username === currentUser?.username && payment.status === "Pending" ? "WILL_BE_REQUEST" : "WILL_BE_NORMAL"
									});
									
									let isOutgoing: boolean;
									let otherUsername: string;
									let actionText: string;
									
									if (payment.payment_type === 'request_money') {
										// For money requests: from_username is the requester, to_username is the one being asked to pay
										if (payment.from_username === currentUser?.username) {
											// Current user made the request
											isOutgoing = true;
											otherUsername = payment.to_username;
											actionText = "Requested from";
										} else {
											// Current user received the request (needs to pay)
											isOutgoing = false;
											otherUsername = payment.from_username;
											actionText = "Request from";
										}
									} else if (payment.payment_type === 'created_task') {
										// For task creation: from_username created task for to_username
										if (payment.from_username === currentUser?.username) {
											// Current user created the task
											isOutgoing = true;
											otherUsername = payment.to_username;
											actionText = "Created task for";
										} else {
											// Current user received the task
											isOutgoing = false;
											otherUsername = payment.from_username;
											actionText = "Task from";
										}
									} else {
										// For regular payments: from_username sent money to to_username
										if (payment.from_username === currentUser?.username) {
											// Current user sent money
											isOutgoing = true;
											otherUsername = payment.to_username;
											actionText = "Sent to";
										} else {
											// Current user received money
											isOutgoing = false;
											otherUsername = payment.from_username;
											actionText = "Received from";
										}
									}
									
									let transactionStatus: "Completed" | "Pending" | "Failed" = "Completed";
									
									let timeAgo = "";
									if (
										"created_at" in payment &&
										(typeof payment.created_at === "string" ||
											typeof payment.created_at === "number")
									) {
										timeAgo = dayjs(payment.created_at).fromNow();
									}
									
									// Create a nice display format with display name and @username
									// For known users, show a friendly name, otherwise use the username
									const getDisplayName = (username: string) => {
										const nameMap: Record<string, string> = {
											'isaiah_kim': 'Isaiah Kim',
											'mayathedesigner': 'Maya Designer',
											'samr_dev': 'Sam Rivera',
											'alice': 'Alice Cooper',
											'bob': 'Bob Builder',
										};
										return nameMap[username] || username.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
									};
									
									const displayName = getDisplayName(otherUsername || '');
									const formattedTitle = displayName;
									
									// Hide completed/fulfilled requests
									if (payment.payment_type === 'request_money' && payment.meta?.hidden) {
										return null;
									}

									// Determine direction for display
									let displayDirection: "in" | "out" | "request" | "task_created" | "task_received";
									if (payment.payment_type === 'request_money' && payment.to_username === currentUser?.username && payment.status === "Pending") {
										// User received a pending request - show as request button
										displayDirection = "request";
									} else if (payment.payment_type === 'created_task') {
										// Task creation/assignment
										if (isOutgoing) {
											displayDirection = "task_created";
										} else {
											displayDirection = "task_received";
										}
									} else if (isOutgoing) {
										displayDirection = "out";
									} else {
										displayDirection = "in";
									}
									
									const handleRequestPress = () => {
										console.log('🔍 Selected request for payment:', {
											id: payment.id,
											payment_type: payment.payment_type,
											status: payment.status,
											from_username: payment.from_username,
											to_username: payment.to_username
										});
										setSelectedRequest(payment);
										setShowPaymentModal(true);
									};

									const handleTaskPress = () => {
										console.log('🔍 Selected task for proof submission:', {
											id: payment.id,
											payment_type: payment.payment_type,
											description: payment.description,
											amount: payment.amount,
											meta: payment.meta
										});
										// Show proof modal instead of navigation
										setSelectedTask(payment);
										setShowProofModal(true);
									};
									
									return (
										<PaymentRow
											key={payment.id}
											title={formattedTitle || "Unknown User"}
											subtitle={`${actionText} • ${payment.description || payment.payment_type}`}
											amount={
												typeof payment.amount === "number"
													? payment.amount / 1_000_000
													: parseFloat(payment.amount) / 1_000_000
											}
											direction={displayDirection}
											showStatus={false}
											timeAgo={timeAgo}
											onPress={
												displayDirection === "request" 
													? handleRequestPress 
													: displayDirection === "task_received" 
														? handleTaskPress 
														: undefined
											}
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

			{sendingPayment ? (
				<Modal
					visible={sendingPayment}
					transparent
					animationType="fade"
				>
					<View style={[styles.overlay, { justifyContent: 'center', alignItems: 'center' }]}>
						<View style={[styles.spinnerModal, { backgroundColor: colors.surface.secondary, borderColor: colors.border.primary }]}>
							<ActivityIndicator size="large" color={colors.primary[700]} />
							<Text style={[styles.spinnerText, { color: colors.text.primary }]}>
								Sending Payment...
							</Text>
						</View>
					</View>
				</Modal>
			) : (
				<ConfirmationModal
					visible={showPaymentModal}
					title="Send Payment"
					message={selectedRequest ? `Send ${(selectedRequest.amount / 1_000_000).toFixed(2)} XION to ${selectedRequest.from_username}?` : ""}
					confirmText="Send"
					cancelText="Cancel"
					icon="paper-plane-outline"
					onConfirm={async () => {
						if (selectedRequest && currentUser && signingClient) {
							setShowPaymentModal(false);
							setSendingPayment(true);
							try {
								// Send the actual payment on blockchain (creates new entry)
								await sendDirectPayment(
									selectedRequest.from_username,
									selectedRequest.amount.toString(),
									selectedRequest.description || "Payment request fulfillment",
									walletAddress
								);

								// Mark the old request as completed/hidden using service key
								console.log('✅ Marking request as completed:', selectedRequest.id);
								const { createClient } = require('@supabase/supabase-js');
								const serviceClient = createClient(
									'https://mchiibkcxzejravsckzc.supabase.co',
									'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaGlpYmtjeHplanJhdnNja3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA0NTA2MSwiZXhwIjoyMDcxNjIxMDYxfQ.I_0fdEqhwhH5Y3kiXNUCSpCglgxMt5qqskhtdDULufE'
								);
								const { error: updateError } = await serviceClient
									.from('activity_feed')
									.update({ 
										meta: {
											...selectedRequest.meta,
											status: 'completed',
											hidden: true,
											fulfilled_at: new Date().toISOString()
										}
									})
									.eq('id', selectedRequest.id);

								if (updateError) {
									console.error('❌ Update error:', updateError);
									throw new Error(`Failed to update request: ${updateError.message}`);
								}
								console.log('✅ Request marked as completed/hidden');

								setSelectedRequest(null);
								setSendingPayment(false);
								await refetch();
								
								Toast.show({
									type: 'success',
									text1: 'Payment Sent!',
									text2: `Sent ${(selectedRequest.amount / 1_000_000).toFixed(2)} XION`,
									position: 'bottom',
								});
							} catch (error: any) {
								console.error('Payment error:', error);
								setSendingPayment(false);
								Toast.show({
									type: 'error',
									text1: 'Payment Failed',
									text2: error.message || 'Please try again',
									position: 'bottom',
								});
							}
						} else {
							Toast.show({
								type: 'error',
								text1: 'Unable to Send',
								text2: 'Wallet not connected properly',
								position: 'bottom',
							});
						}
					}}
					onCancel={() => {
						setShowPaymentModal(false);
						setSelectedRequest(null);
					}}
				/>
			)}

			{/* Proof Submission Modal */}
			<Modal
				visible={showProofModal}
				animationType="slide"
				presentationStyle="pageSheet"
			>
				<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
					<View style={{ 
						flexDirection: 'row', 
						justifyContent: 'space-between', 
						alignItems: 'center',
						paddingHorizontal: 20,
						paddingVertical: 16,
						borderBottomWidth: 1,
						borderBottomColor: '#E5E5E5'
					}}>
						<Text style={{ fontSize: 18, fontWeight: '600' }}>Submit Proof</Text>
						<Pressable onPress={() => {
							setShowProofModal(false);
							setSelectedTask(null);
						}}>
							<Text style={{ fontSize: 16, color: '#666' }}>Cancel</Text>
						</Pressable>
					</View>
					{selectedTask && (
						<ProofSubmissionSheet
							job={{
								id: parseInt(selectedTask.id || "0"),
								client: selectedTask.meta?.from_username || selectedTask.actor,
								worker: walletAddress,
								description: selectedTask.meta?.description || "Task completion",
								escrow_amount: {
									amount: selectedTask.meta?.amount?.toString() || "0",
									denom: "uxion"
								},
								status: "Accepted",
								deadline: selectedTask.meta?.deadline,
								proof_type: selectedTask.meta?.proof_type || "soft"
							}}
							onSubmit={handleProofSubmit}
							userAddress={walletAddress}
							contractClient={signingClient}
						/>
					)}
				</SafeAreaView>
			</Modal>
		</SafeAreaView>
	);
}
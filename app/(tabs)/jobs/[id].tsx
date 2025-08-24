import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	ScrollView,
	TouchableOpacity,
	Platform,
	ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import { supabase } from "@/lib/supabase";
import { TaskStatus, DisputeData } from "@/types/proofpay";
import DisputeModal from "@/components/DisputeModal";
import Toast from "react-native-toast-message";
import ProofGallery from "@/components/ProofGallery";

interface TaskDetails {
	id: string;
	payer: string;
	worker: string;
	amount: number;
	denom: string;
	description: string;
	status: TaskStatus;
	created_at: string;
	deadline_ts?: string;
	proof_type: 'soft' | 'zktls' | 'hybrid';
	pending_release_expires_at?: string;
	review_window_secs?: number;
}

export default function JobDetailsScreen() {
	const { id } = useLocalSearchParams();
	const { user } = useAuth();
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	const [task, setTask] = useState<TaskDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [showDisputeModal, setShowDisputeModal] = useState(false);

	const fetchTaskDetails = async () => {
		if (!id || typeof id !== 'string') return;

		try {
			const { data, error } = await supabase
				.from('tasks')
				.select('*')
				.eq('id', id)
				.single();

			if (error || !data) {
				console.error('Error fetching task:', error);
				return;
			}

			setTask({
				id: data.id,
				payer: data.payer,
				worker: data.worker,
				amount: parseFloat(data.amount) / 1000000,
				denom: data.denom,
				description: data.description || '',
				status: data.status,
				created_at: data.created_at,
				deadline_ts: data.deadline_ts,
				proof_type: data.proof_type,
				pending_release_expires_at: data.pending_release_expires_at,
				review_window_secs: data.review_window_secs,
			});
		} catch (error) {
			console.error('Error in fetchTaskDetails:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmitDispute = async (disputeData: DisputeData) => {
		try {
			const { error } = await supabase
				.from('disputes')
				.insert({
					task_id: disputeData.taskId,
					reason: disputeData.reason,
					evidence_url: disputeData.evidenceUrl,
					evidence_hash: disputeData.evidenceHash,
				});

			if (error) {
				console.error('Error submitting dispute:', error);
				throw error;
			}

			// Update task status to disputed
			const { error: updateError } = await supabase
				.from('tasks')
				.update({ status: 'disputed' })
				.eq('id', disputeData.taskId);

			if (updateError) {
				console.error('Error updating task status:', updateError);
			}

			Toast.show({
				type: 'success',
				text1: 'Dispute Submitted',
				text2: 'Your dispute has been submitted for review',
				position: 'bottom',
			});

			// Refresh task details
			fetchTaskDetails();
		} catch (error) {
			throw error;
		}
	};

	const canDispute = () => {
		return task?.status === 'pending_release' && user?.walletAddress === task.payer;
	};

	const getTimeRemaining = () => {
		if (!task?.pending_release_expires_at) return null;
		
		const now = new Date();
		const expires = new Date(task.pending_release_expires_at);
		const diff = expires.getTime() - now.getTime();
		
		if (diff <= 0) return 'Expired';
		
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		
		if (hours > 0) return `${hours}h ${minutes}m remaining`;
		return `${minutes}m remaining`;
	};

	const getStatusColor = (status: TaskStatus) => {
		switch (status) {
			case 'pending':
				return colors.status?.info || '#2563EB';
			case 'proof_submitted':
				return colors.status?.warning || '#D97706';
			case 'pending_release':
				return '#FF6B35';
			case 'released':
				return colors.status?.success || '#059669';
			case 'disputed':
				return colors.status?.error || '#DC2626';
			case 'refunded':
				return colors.text.secondary;
			default:
				return colors.text.secondary;
		}
	};

	const getStatusText = (status: TaskStatus) => {
		switch (status) {
			case 'pending':
				return 'Pending';
			case 'proof_submitted':
				return 'Proof Submitted';
			case 'pending_release':
				return 'Pending Release';
			case 'released':
				return 'Released';
			case 'disputed':
				return 'Disputed';
			case 'refunded':
				return 'Refunded';
			default:
				return status;
		}
	};

	const truncateAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const getProofEvidence = () => {
		if (!task) return [];

		const mockEvidence = [];

		// Add different types of proof evidence based on task status and proof type
		if (task.status === 'proof_submitted' || task.status === 'pending_release' || task.status === 'released') {
			if (task.proof_type === 'zktls' || task.proof_type === 'hybrid') {
				mockEvidence.push({
					type: 'zktls_receipt' as const,
					title: 'zkTLS Verification',
					content: `zktls_proof_${task.id}_${Date.now()}`,
					timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
					verified: true
				});
			}

			// Add completion screenshot for visual proof
			mockEvidence.push({
				type: 'image' as const,
				title: 'Task Completion Screenshot',
				content: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Task+Completed',
				timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
				verified: false
			});

			// Add completion description
			mockEvidence.push({
				type: 'text' as const,
				title: 'Completion Details',
				content: 'Task completed successfully. All requirements met including quality standards and deadline adherence. Worker provided detailed documentation and follow-up instructions.',
				timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
				verified: false
			});

			// Add external verification link
			if (task.proof_type === 'hybrid') {
				mockEvidence.push({
					type: 'link' as const,
					title: 'External Verification',
					content: 'https://github.com/example/repo/commit/abc123',
					timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
					verified: true
				});
			}
		}

		return mockEvidence;
	};

	useEffect(() => {
		fetchTaskDetails();
	}, [id]);

	if (loading) {
		return (
			<SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface.primary }]}>
				<Stack.Screen options={{ title: "Task Details" }} />
				<View style={styles.centerEmpty}>
					<ActivityIndicator size="large" color={colors.accent?.primary || '#2563EB'} />
					<Text style={[styles.loadingText, { color: colors.text.secondary }]}>
						Loading task details...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!task) {
		return (
			<SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface.primary }]}>
				<Stack.Screen options={{ title: "Task Not Found" }} />
				<View style={styles.centerEmpty}>
					<Ionicons name="alert-circle-outline" size={48} color={colors.text.tertiary} />
					<Text style={[styles.emptyText, { color: colors.text.primary }]}>Task not found</Text>
					<Text style={[styles.emptySubtext, { color: colors.text.secondary }]}>
						This task may have been removed or doesn&apos;t exist
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<>
			<SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface.primary, paddingBottom: insets.bottom }]}>
				<Stack.Screen options={{ title: "Task Details" }} />
				<View style={styles.flex1}>
					<ScrollView
						contentContainerStyle={styles.scrollContent}
						bounces={false}
						style={{ backgroundColor: colors.surface.primary }}
					>
						{/* Status Header */}
						<View style={[styles.statusHeader, { backgroundColor: colors.surface.secondary }]}>
							<View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
								<Ionicons 
									name={task.status === 'released' ? 'checkmark-circle' : 
										  task.status === 'pending_release' ? 'hourglass' :
										  task.status === 'disputed' ? 'alert-circle' : 'time'} 
									size={16} 
									color={getStatusColor(task.status)} 
								/>
								<Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
									{getStatusText(task.status)}
								</Text>
							</View>
							{task.status === 'pending_release' && (
								<Text style={[styles.timeRemaining, { color: colors.text.secondary }]}>
									{getTimeRemaining()}
								</Text>
							)}
						</View>

						{/* Task Details */}
						<View style={[styles.infoCard, { backgroundColor: colors.surface.primary, borderColor: colors.border.primary }]}>
							<Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={3}>
								{task.description}
							</Text>
							
							<View style={styles.payoutRow}>
								<View>
									<Text style={[styles.infoLabel, { color: colors.text.tertiary }]}>Amount</Text>
									<Text style={[styles.payout, { color: colors.status?.success || '#059669' }]}>
										${task.amount.toFixed(2)} {task.denom.replace('u', '').toUpperCase()}
									</Text>
								</View>
								<View style={{ alignItems: 'flex-end' }}>
									<Text style={[styles.infoLabel, { color: colors.text.tertiary }]}>Proof Type</Text>
									<Text style={[styles.proofType, { color: colors.text.primary }]}>
										{task.proof_type.toUpperCase()}
									</Text>
								</View>
							</View>

							{/* Participants */}
							<View style={styles.participantsSection}>
								<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Participants</Text>
								
								<View style={styles.participantRow}>
									<View style={styles.participantInfo}>
										<Ionicons name="person" size={16} color={colors.text.tertiary} />
										<View style={styles.participantText}>
											<Text style={[styles.participantLabel, { color: colors.text.secondary }]}>Payer</Text>
											<Text style={[styles.participantAddress, { color: colors.text.primary }]}>
												{user?.walletAddress === task.payer ? 'You' : truncateAddress(task.payer)}
											</Text>
										</View>
									</View>
								</View>

								{task.worker && (
									<View style={styles.participantRow}>
										<View style={styles.participantInfo}>
											<Ionicons name="hammer" size={16} color={colors.text.tertiary} />
											<View style={styles.participantText}>
												<Text style={[styles.participantLabel, { color: colors.text.secondary }]}>Worker</Text>
												<Text style={[styles.participantAddress, { color: colors.text.primary }]}>
													{user?.walletAddress === task.worker ? 'You' : truncateAddress(task.worker)}
												</Text>
											</View>
										</View>
									</View>
								)}
							</View>

							{/* Timeline */}
							<View style={styles.timelineSection}>
								<Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Timeline</Text>
								<View style={styles.timelineItem}>
									<Ionicons name="add-circle" size={16} color={colors.status?.success || '#059669'} />
									<Text style={[styles.timelineText, { color: colors.text.secondary }]}>
										Created {new Date(task.created_at).toLocaleDateString()}
									</Text>
								</View>
								{task.deadline_ts && (
									<View style={styles.timelineItem}>
										<Ionicons name="calendar" size={16} color={colors.status?.warning || '#D97706'} />
										<Text style={[styles.timelineText, { color: colors.text.secondary }]}>
											Due {new Date(task.deadline_ts).toLocaleDateString()}
										</Text>
									</View>
								)}
							</View>

							{/* Proof Evidence */}
							<ProofGallery evidence={getProofEvidence()} />
						</View>
					</ScrollView>

					{/* Action Footer */}
					{canDispute() && (
						<View style={[styles.footer, { 
							backgroundColor: colors.surface.primary, 
							borderTopColor: colors.border.primary,
							paddingBottom: insets.bottom + (Platform.OS === "ios" ? 12 : 20),
						}]}>
							<TouchableOpacity
								style={[styles.disputeButton, { backgroundColor: colors.status?.error || '#DC2626' }]}
								onPress={() => setShowDisputeModal(true)}
								activeOpacity={0.8}
							>
								<Ionicons name="alert-circle" size={20} color="white" />
								<Text style={styles.disputeButtonText}>Dispute Task</Text>
							</TouchableOpacity>
							
							<Text style={[styles.disputeWarning, { color: colors.text.tertiary }]}>
								Only dispute if you have legitimate concerns about the proof quality
							</Text>
						</View>
					)}
				</View>
			</SafeAreaView>

			{/* Dispute Modal */}
			<DisputeModal
				visible={showDisputeModal}
				taskId={task.id}
				onClose={() => setShowDisputeModal(false)}
				onSubmit={handleSubmitDispute}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	safeArea: { 
		flex: 1,
	},
	flex1: { 
		flex: 1,
	},
	scrollContent: {
		padding: DesignSystem.spacing.lg,
		paddingBottom: DesignSystem.spacing['3xl'],
	},
	centerEmpty: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: DesignSystem.spacing.md,
	},
	loadingText: {
		...DesignSystem.typography.body,
		marginTop: DesignSystem.spacing.md,
	},
	emptyText: {
		...DesignSystem.typography.h3,
		fontWeight: '600',
	},
	emptySubtext: {
		...DesignSystem.typography.body,
		textAlign: 'center',
		paddingHorizontal: DesignSystem.spacing.lg,
	},
	statusHeader: {
		padding: DesignSystem.spacing.lg,
		borderRadius: 16,
		marginBottom: DesignSystem.spacing.lg,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.sm,
		borderRadius: 12,
		gap: 6,
	},
	statusText: {
		...DesignSystem.typography.bodyMedium,
		fontWeight: '600',
	},
	timeRemaining: {
		...DesignSystem.typography.body,
		fontWeight: '500',
	},
	title: {
		...DesignSystem.typography.h2,
		fontWeight: '700',
		marginBottom: DesignSystem.spacing.lg,
		lineHeight: 28,
	},
	infoCard: {
		borderRadius: 20,
		padding: DesignSystem.spacing.xl,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 3,
		borderWidth: 1,
	},
	payoutRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: DesignSystem.spacing.xl,
	},
	infoLabel: {
		...DesignSystem.typography.caption,
		fontWeight: '500',
		marginBottom: 4,
	},
	payout: {
		...DesignSystem.typography.h3,
		fontWeight: '700',
	},
	proofType: {
		...DesignSystem.typography.bodyMedium,
		fontWeight: '600',
	},
	participantsSection: {
		marginBottom: DesignSystem.spacing.xl,
	},
	timelineSection: {
		marginBottom: 0,
	},
	sectionTitle: {
		...DesignSystem.typography.bodyMedium,
		fontWeight: '600',
		marginBottom: DesignSystem.spacing.md,
	},
	participantRow: {
		marginBottom: DesignSystem.spacing.md,
	},
	participantInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: DesignSystem.spacing.sm,
	},
	participantText: {
		gap: 2,
	},
	participantLabel: {
		...DesignSystem.typography.caption,
		fontWeight: '500',
	},
	participantAddress: {
		...DesignSystem.typography.body,
		fontWeight: '500',
	},
	timelineItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: DesignSystem.spacing.sm,
		marginBottom: DesignSystem.spacing.sm,
	},
	timelineText: {
		...DesignSystem.typography.body,
	},
	footer: {
		borderTopWidth: 1,
		paddingTop: DesignSystem.spacing.lg,
		paddingHorizontal: DesignSystem.spacing.lg,
	},
	disputeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: DesignSystem.spacing.lg,
		borderRadius: 16,
		gap: DesignSystem.spacing.sm,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
		marginBottom: DesignSystem.spacing.md,
	},
	disputeButtonText: {
		...DesignSystem.typography.bodyMedium,
		color: 'white',
		fontWeight: '600',
	},
	disputeWarning: {
		...DesignSystem.typography.caption,
		textAlign: 'center',
		lineHeight: 16,
	},
});

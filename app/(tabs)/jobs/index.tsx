import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	ActivityIndicator,
	RefreshControl,
	SafeAreaView,
	Pressable,
} from "react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import { supabase } from "@/lib/supabase";
import ConfirmationModal from "@/components/ConfirmationModal";
import { TaskStatus } from "@/types/proofpay";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import { getTaskCountdownText } from "@/utils/countdown";

type TabType = 'active' | 'pending' | 'completed';

interface Task {
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
}

export default function JobsScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const { colors } = useTheme();
	const { data: account } = useAbstraxionAccount();

	const [activeTab, setActiveTab] = useState<TabType>('active');
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);

	// Fetch tasks from Supabase
	const fetchTasks = async () => {
		if (!user?.walletAddress) return;

		try {
			const { data, error } = await supabase
				.from('tasks')
				.select('*')
				.or(`payer.eq.${user.walletAddress},worker.eq.${user.walletAddress}`)
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching tasks:', error);
				return;
			}

			const mappedTasks: Task[] = (data || []).map(item => ({
				id: item.id,
				payer: item.payer,
				worker: item.worker,
				amount: parseFloat(item.amount) / 1000000, // Convert from uxion to xion
				denom: item.denom,
				description: item.description || '',
				status: item.status,
				created_at: item.created_at,
				deadline_ts: item.deadline_ts,
				proof_type: item.proof_type,
			}));

			setTasks(mappedTasks);
		} catch (error) {
			console.error('Error in fetchTasks:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTasks();
	}, [user?.walletAddress]);

	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchTasks();
		setRefreshing(false);
	};

	// Filter tasks by tab
	const getFilteredTasks = () => {
		switch (activeTab) {
			case 'active':
				return tasks.filter(task => 
					task.status === 'pending' || 
					task.status === 'proof_submitted'
				);
			case 'pending':
				return tasks.filter(task => task.status === 'pending_release');
			case 'completed':
				return tasks.filter(task => 
					task.status === 'released' || 
					task.status === 'refunded'
				);
			default:
				return [];
		}
	};

	// Get task counts for tabs
	const getTaskCounts = () => {
		const active = tasks.filter(task => 
			task.status === 'pending' || 
			task.status === 'proof_submitted'
		).length;
		
		const pending = tasks.filter(task => task.status === 'pending_release').length;
		
		const completed = tasks.filter(task => 
			task.status === 'released' || 
			task.status === 'refunded'
		).length;

		return { active, pending, completed };
	};

	const truncateAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const formatTimeAgo = (timestamp: string) => {
		try {
			const date = new Date(timestamp);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

			if (diffDays === 0) return "Today";
			if (diffDays === 1) return "1 day ago";
			return `${diffDays} days ago`;
		} catch {
			return "Recently";
		}
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

	const handleLogout = () => {
		setShowLogoutModal(true);
	};

	const confirmLogout = async () => {
		setShowLogoutModal(false);
		try {
			await supabase.auth.signOut();
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

	if (!user?.walletAddress) {
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: colors.surface.primary }]}>
				<View style={styles.centered}>
					<Text style={{ color: colors.text.primary }}>Connect your wallet to view tasks</Text>
				</View>
			</SafeAreaView>
		);
	}

	const taskCounts = getTaskCounts();
	const filteredTasks = getFilteredTasks();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.surface.primary }]} edges={["top"]}>
			<SophisticatedHeader
				title="Task Dashboard"
				subtitle="Track all your tasks and progress"
				onLogout={handleLogout}
			/>
			
			<View style={[styles.content, { backgroundColor: colors.surface.primary }]}>
				{/* Tabs */}
				<View style={[styles.tabContainer, { backgroundColor: colors.surface.secondary }]}>
					<Pressable 
						style={[
							styles.tab,
							activeTab === 'active' && { backgroundColor: colors.accent?.primary || '#2563EB' }
						]}
						onPress={() => setActiveTab('active')}
					>
						<Text style={[
							styles.tabText,
							{ color: activeTab === 'active' ? '#FFFFFF' : colors.text.secondary }
						]}>
							Active {taskCounts.active > 0 && `(${taskCounts.active})`}
						</Text>
					</Pressable>
					
					<Pressable 
						style={[
							styles.tab,
							activeTab === 'pending' && { backgroundColor: colors.accent?.primary || '#2563EB' }
						]}
						onPress={() => setActiveTab('pending')}
					>
						<Text style={[
							styles.tabText,
							{ color: activeTab === 'pending' ? '#FFFFFF' : colors.text.secondary }
						]}>
							Pending {taskCounts.pending > 0 && `(${taskCounts.pending})`}
						</Text>
					</Pressable>
					
					<Pressable 
						style={[
							styles.tab,
							activeTab === 'completed' && { backgroundColor: colors.accent?.primary || '#2563EB' }
						]}
						onPress={() => setActiveTab('completed')}
					>
						<Text style={[
							styles.tabText,
							{ color: activeTab === 'completed' ? '#FFFFFF' : colors.text.secondary }
						]}>
							Completed {taskCounts.completed > 0 && `(${taskCounts.completed})`}
						</Text>
					</Pressable>
				</View>

				{loading ? (
					<View style={styles.centered}>
						<ActivityIndicator size="large" color={colors.accent?.primary || '#2563EB'} />
						<Text style={[styles.loadingText, { color: colors.text.secondary }]}>
							Loading your tasks...
						</Text>
					</View>
				) : (
					<FlatList
						data={filteredTasks}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContainer}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={handleRefresh}
								tintColor={colors.accent?.primary || '#2563EB'}
							/>
						}
						ListEmptyComponent={
							<View style={styles.emptyState}>
								<View style={[styles.emptyIconContainer, { backgroundColor: colors.surface.secondary }]}>
									<Ionicons
										name={activeTab === 'active' ? 'flash-outline' : 
											  activeTab === 'pending' ? 'hourglass-outline' :
											  'checkmark-circle-outline'}
										size={48}
										color={colors.text.tertiary}
									/>
								</View>
								<Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
									{activeTab === 'active' ? 'No Active Tasks' :
									 activeTab === 'pending' ? 'No Pending Tasks' :
									 'No Completed Tasks'}
								</Text>
								<Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
									{activeTab === 'active' ? 'Create a new task to get started!' :
									 activeTab === 'pending' ? 'Tasks pending approval will appear here' :
									 'Your completed tasks will show up here'}
								</Text>
							</View>
						}
						renderItem={({ item }) => (
							<Pressable 
								style={[styles.taskCard, { 
									backgroundColor: colors.surface.primary,
									borderColor: colors.border.primary,
								}]}
								onPress={() => router.push(`/(tabs)/jobs/${item.id}`)}
							>
								<View style={styles.taskHeader}>
									<View style={{ flex: 1 }}>
										<Text style={[styles.taskTitle, { color: colors.text.primary }]} numberOfLines={2}>
											{item.description}
										</Text>
										<View style={styles.taskMeta}>
											<Text style={[styles.taskAmount, { color: colors.status?.success || '#059669' }]}>
												${item.amount.toFixed(2)} XION
											</Text>
											<View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
												<Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
													{getStatusText(item.status)}
												</Text>
											</View>
										</View>
									</View>
								</View>
								
								<View style={styles.taskFooter}>
									<View style={styles.taskInfo}>
										<View style={styles.infoRow}>
											<Ionicons name="person-outline" size={14} color={colors.text.tertiary} />
											<Text style={[styles.infoText, { color: colors.text.tertiary }]}>
												{item.payer === user.walletAddress ? 'You created' : 'You accepted'}
											</Text>
										</View>
										<View style={styles.infoRow}>
											<Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
											<Text style={[styles.infoText, { color: colors.text.tertiary }]}>
												{formatTimeAgo(item.created_at)}
											</Text>
										</View>
										{(() => {
											const taskForCountdown = {
												...item,
												createdAt: new Date(item.created_at),
											};
											const countdownText = getTaskCountdownText(taskForCountdown);
											return countdownText ? (
												<View style={styles.countdownChip}>
													<Ionicons 
														name="hourglass-outline" 
														size={12} 
														color={colors.status?.warning || "#D97706"} 
													/>
													<Text style={[styles.countdownText, { color: colors.status?.warning || "#D97706" }]}>
														{countdownText}
													</Text>
												</View>
											) : null;
										})()}
									</View>
									
									<View style={styles.proofTypeBadge}>
										<Text style={[styles.proofTypeText, { color: colors.text.secondary }]}>
											{item.proof_type.toUpperCase()}
										</Text>
									</View>
								</View>
							</Pressable>
						)}
					/>
				)}
			</View>

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

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: DesignSystem.spacing.lg,
		fontSize: 16,
		fontWeight: '500',
	},
	tabContainer: {
		flexDirection: 'row',
		margin: DesignSystem.spacing.lg,
		borderRadius: 12,
		padding: 4,
	},
	tab: {
		flex: 1,
		paddingVertical: DesignSystem.spacing.md,
		paddingHorizontal: DesignSystem.spacing.sm,
		borderRadius: 8,
		alignItems: 'center',
	},
	tabText: {
		fontSize: 14,
		fontWeight: '600',
	},
	listContainer: {
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingBottom: DesignSystem.spacing['3xl'],
	},
	emptyState: {
		alignItems: 'center',
		paddingVertical: DesignSystem.spacing['3xl'],
		paddingHorizontal: DesignSystem.spacing.xl,
	},
	emptyIconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: DesignSystem.spacing.lg,
	},
	emptyTitle: {
		...DesignSystem.typography.h3,
		textAlign: 'center',
		marginBottom: DesignSystem.spacing.md,
	},
	emptySubtitle: {
		...DesignSystem.typography.body,
		textAlign: 'center',
		lineHeight: 22,
	},
	taskCard: {
		borderRadius: 16,
		padding: DesignSystem.spacing.lg,
		marginBottom: DesignSystem.spacing.lg,
		borderWidth: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 3,
	},
	taskHeader: {
		marginBottom: DesignSystem.spacing.md,
	},
	taskTitle: {
		...DesignSystem.typography.bodyMedium,
		fontWeight: '600',
		marginBottom: DesignSystem.spacing.sm,
		lineHeight: 22,
	},
	taskMeta: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	taskAmount: {
		...DesignSystem.typography.bodyMedium,
		fontWeight: '700',
	},
	statusBadge: {
		paddingHorizontal: DesignSystem.spacing.sm,
		paddingVertical: 4,
		borderRadius: 12,
	},
	statusText: {
		fontSize: 12,
		fontWeight: '600',
	},
	taskFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	taskInfo: {
		gap: DesignSystem.spacing.xs,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	infoText: {
		fontSize: 12,
		fontWeight: '500',
	},
	proofTypeBadge: {
		backgroundColor: 'rgba(107, 114, 128, 0.1)',
		paddingHorizontal: DesignSystem.spacing.sm,
		paddingVertical: 4,
		borderRadius: 8,
	},
	proofTypeText: {
		fontSize: 11,
		fontWeight: '600',
	},
	countdownChip: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(217, 119, 6, 0.15)',
		paddingHorizontal: DesignSystem.spacing.sm,
		paddingVertical: 4,
		borderRadius: 12,
		gap: 4,
		marginTop: 4,
	},
	countdownText: {
		fontSize: 11,
		fontWeight: '600',
	},
});

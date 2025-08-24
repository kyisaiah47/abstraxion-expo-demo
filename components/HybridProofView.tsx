import React, { useState, useEffect } from "react";
import { 
	View, 
	Text, 
	Pressable, 
	Alert,
	ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useCountdown } from "@/hooks/useCountdown";
import { Task } from "@/types/proofpay";
import DisputeModal from "./DisputeModal";

interface HybridProofViewProps {
	task: Task;
	onVerified: (proofData: { endpoint: string; proofHash: string; verificationResult: any }) => Promise<void>;
	onRelease: () => Promise<void>;
	onDispute: (disputeData: any) => Promise<void>;
}

export default function HybridProofView({ 
	task, 
	onVerified, 
	onRelease, 
	onDispute 
}: HybridProofViewProps) {
	const { colors } = useTheme();
	const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'pending_release' | 'released' | 'disputed'>('idle');
	const [verificationResult, setVerificationResult] = useState<any>(null);
	const [showDisputeModal, setShowDisputeModal] = useState(false);
	const [releaseTime, setReleaseTime] = useState<Date | null>(null);

	// Calculate release time (reviewWindow hours after verification)
	const reviewWindow = task.reviewWindow || 24;
	const { timeRemaining, isExpired } = useCountdown(releaseTime || new Date());

	useEffect(() => {
		if (verificationStatus === 'verified' && verificationResult) {
			// Set release time to reviewWindow hours from now
			const releaseDate = new Date();
			releaseDate.setHours(releaseDate.getHours() + reviewWindow);
			setReleaseTime(releaseDate);
			setVerificationStatus('pending_release');
		}
	}, [verificationStatus, verificationResult, reviewWindow]);

	useEffect(() => {
		if (isExpired && verificationStatus === 'pending_release') {
			// Auto-release when countdown expires
			handleAutoRelease();
		}
	}, [isExpired, verificationStatus]);

	const getServiceFromEndpoint = (endpoint: string) => {
		if (endpoint.includes('github.com')) return 'GitHub';
		if (endpoint.includes('docs.google.com')) return 'Google Docs';
		if (endpoint.includes('zoom.us')) return 'Zoom';
		return 'External Service';
	};

	const handleStartVerification = async () => {
		if (!task.endpoint) {
			Alert.alert('Error', 'No endpoint specified for verification.');
			return;
		}

		setVerificationStatus('verifying');

		try {
			// Simulate zkTLS verification
			await new Promise(resolve => setTimeout(resolve, 3000));

			const mockVerificationResult = {
				endpoint: task.endpoint,
				service: getServiceFromEndpoint(task.endpoint),
				timestamp: new Date().toISOString(),
				proofHash: `hybrid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				verified: true,
			};

			setVerificationResult(mockVerificationResult);
			setVerificationStatus('verified');

			await onVerified({
				endpoint: task.endpoint,
				proofHash: mockVerificationResult.proofHash,
				verificationResult: mockVerificationResult
			});

		} catch (error) {
			console.error('Verification failed:', error);
			setVerificationStatus('idle');
			Alert.alert('Verification Failed', 'Unable to verify task completion. Please try again.');
		}
	};

	const handleReleaseNow = async () => {
		try {
			await onRelease();
			setVerificationStatus('released');
			Alert.alert('Released', 'Funds have been released to the worker.');
		} catch (error) {
			Alert.alert('Error', 'Failed to release funds. Please try again.');
		}
	};

	const handleDispute = async (disputeData: any) => {
		try {
			await onDispute(disputeData);
			setVerificationStatus('disputed');
			setShowDisputeModal(false);
			Alert.alert('Dispute Submitted', 'Task has been frozen pending dispute resolution.');
		} catch (error) {
			Alert.alert('Error', 'Failed to submit dispute. Please try again.');
		}
	};

	const handleAutoRelease = async () => {
		try {
			await onRelease();
			setVerificationStatus('released');
		} catch (error) {
			console.error('Auto-release failed:', error);
		}
	};

	const getStatusIcon = () => {
		switch (verificationStatus) {
			case 'verified':
			case 'pending_release':
				return <Ionicons name="checkmark-circle" size={64} color={colors.status?.success} />;
			case 'released':
				return <Ionicons name="cash" size={64} color={colors.status?.success} />;
			case 'disputed':
				return <Ionicons name="alert-circle" size={64} color={colors.status?.error} />;
			case 'verifying':
				return <ActivityIndicator size="large" color={colors.status?.info} />;
			default:
				return <Ionicons name="time-outline" size={64} color={colors.text.secondary} />;
		}
	};

	const getStatusText = () => {
		switch (verificationStatus) {
			case 'verified':
				return 'Verification Complete ✓';
			case 'pending_release':
				return `Auto-releases in ${timeRemaining}`;
			case 'released':
				return 'Funds Released';
			case 'disputed':
				return 'Task Disputed';
			case 'verifying':
				return 'Verifying...';
			default:
				return 'Ready to Verify';
		}
	};

	return (
		<View className="flex-1 bg-white dark:bg-gray-900 p-6">
			{/* Header */}
			<View className="mb-6">
				<Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Hybrid Verification
				</Text>
				<Text className="text-gray-600 dark:text-gray-400">
					zkTLS proof with {reviewWindow}h review window
				</Text>
			</View>

			{/* Task Info */}
			<View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
				<Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					Task
				</Text>
				<Text className="text-gray-900 dark:text-white mb-3">
					{task.description}
				</Text>
				
				<View className="flex-row justify-between items-center">
					<Text className="text-sm text-gray-500 dark:text-gray-400">
						Reward: {task.amount} XION
					</Text>
					<Text className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">
						⏳ {reviewWindow}h Review Window
					</Text>
				</View>
			</View>

			{/* Verification Status */}
			<View className="items-center mb-8">
				{getStatusIcon()}
				<Text className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">
					{getStatusText()}
				</Text>

				{verificationStatus === 'pending_release' && (
					<View className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mt-4 w-full">
						<Text className="text-orange-800 dark:text-orange-200 font-medium mb-2 text-center">
							Countdown Active
						</Text>
						<Text className="text-orange-600 dark:text-orange-300 text-sm text-center mb-4">
							Funds will auto-release in {timeRemaining} unless disputed
						</Text>
						
						{/* Action Buttons for Payer */}
						<View className="flex-row gap-3">
							<Pressable
								onPress={handleReleaseNow}
								className="flex-1 bg-green-600 rounded-lg p-3 items-center"
							>
								<Text className="text-white font-medium">Release Now</Text>
							</Pressable>
							<Pressable
								onPress={() => setShowDisputeModal(true)}
								className="flex-1 bg-red-600 rounded-lg p-3 items-center"
							>
								<Text className="text-white font-medium">Dispute</Text>
							</Pressable>
						</View>
					</View>
				)}

				{verificationStatus === 'verified' && verificationResult && (
					<View className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4 w-full">
						<Text className="text-green-800 dark:text-green-200 font-medium mb-2">
							Verified by {verificationResult.service} ✓
						</Text>
						<Text className="text-green-600 dark:text-green-300 text-sm">
							Starting {reviewWindow}h review window...
						</Text>
					</View>
				)}

				{verificationStatus === 'released' && (
					<View className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4 w-full">
						<Text className="text-green-800 dark:text-green-200 font-medium text-center">
							✅ Funds Released Successfully
						</Text>
					</View>
				)}

				{verificationStatus === 'disputed' && (
					<View className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mt-4 w-full">
						<Text className="text-red-800 dark:text-red-200 font-medium text-center mb-2">
							🚨 Task Under Dispute
						</Text>
						<Text className="text-red-600 dark:text-red-300 text-sm text-center">
							Funds are frozen pending resolution
						</Text>
					</View>
				)}
			</View>

			{/* Action Button */}
			{verificationStatus === 'idle' && (
				<Pressable
					onPress={handleStartVerification}
					className="bg-blue-600 rounded-lg p-4 items-center mb-6"
				>
					<Text className="text-white font-medium text-lg">
						Start Verification
					</Text>
				</Pressable>
			)}

			{/* Info */}
			<View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
				<View className="flex-row items-start">
					<Ionicons
						name="information-circle"
						size={20}
						color={colors.text.secondary}
						style={{ marginRight: 12, marginTop: 2 }}
					/>
					<View className="flex-1">
						<Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Hybrid Process
						</Text>
						<Text className="text-sm text-gray-600 dark:text-gray-400">
							1. zkTLS verification happens instantly{'\n'}
						2. {reviewWindow}h review window begins{'\n'}
						3. Payer can release early or dispute{'\n'}
						4. Auto-release after countdown expires
						</Text>
					</View>
				</View>
			</View>

			{/* Dispute Modal */}
			<DisputeModal
				visible={showDisputeModal}
				taskId={task.id}
				onClose={() => setShowDisputeModal(false)}
				onSubmit={handleDispute}
			/>
		</View>
	);
}
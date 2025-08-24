import React, { useState, useEffect } from "react";
import { 
	View, 
	Text, 
	Pressable, 
	Alert,
	ActivityIndicator,
	Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Task } from "@/types/proofpay";

interface ZkTLSProofViewProps {
	task: Task;
	onVerified: (proofData: { endpoint: string; proofHash: string; verificationResult: any }) => Promise<void>;
}

export default function ZkTLSProofView({ task, onVerified }: ZkTLSProofViewProps) {
	const { colors } = useTheme();
	const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
	const [verificationResult, setVerificationResult] = useState<any>(null);

	const getServiceFromEndpoint = (endpoint: string) => {
		if (endpoint.includes('github.com')) return 'GitHub';
		if (endpoint.includes('docs.google.com')) return 'Google Docs';
		if (endpoint.includes('zoom.us')) return 'Zoom';
		if (endpoint.includes('linkedin.com')) return 'LinkedIn';
		if (endpoint.includes('twitter.com') || endpoint.includes('x.com')) return 'X (Twitter)';
		return 'External Service';
	};

	const handleStartVerification = async () => {
		if (!task.endpoint) {
			Alert.alert('Error', 'No endpoint specified for verification.');
			return;
		}

		setVerificationStatus('verifying');

		try {
			// In a real implementation, this would:
			// 1. Launch zkTLS verification process
			// 2. Connect to the specified endpoint
			// 3. Generate cryptographic proof
			// 4. Return verification result

			// Simulating verification process
			await new Promise(resolve => setTimeout(resolve, 3000));

			const mockVerificationResult = {
				endpoint: task.endpoint,
				service: getServiceFromEndpoint(task.endpoint),
				timestamp: new Date().toISOString(),
				proofHash: `zktls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				verified: true,
				metadata: {
					taskCompleted: true,
					completionTime: new Date().toISOString(),
				}
			};

			setVerificationResult(mockVerificationResult);
			setVerificationStatus('verified');

			// Auto-submit the verification
			await onVerified({
				endpoint: task.endpoint,
				proofHash: mockVerificationResult.proofHash,
				verificationResult: mockVerificationResult
			});

			Alert.alert(
				'Verification Complete',
				'Task has been automatically verified and funds will be released instantly!'
			);

		} catch (error) {
			console.error('Verification failed:', error);
			setVerificationStatus('failed');
			Alert.alert('Verification Failed', 'Unable to verify task completion. Please try again.');
		}
	};

	const handleOpenEndpoint = () => {
		if (task.endpoint) {
			Linking.openURL(task.endpoint);
		}
	};

	const getStatusIcon = () => {
		switch (verificationStatus) {
			case 'verified':
				return <Ionicons name="checkmark-circle" size={64} color={colors.status?.success} />;
			case 'failed':
				return <Ionicons name="close-circle" size={64} color={colors.status?.error} />;
			case 'verifying':
				return <ActivityIndicator size="large" color={colors.status?.info} />;
			default:
				return <Ionicons name="shield-outline" size={64} color={colors.text.secondary} />;
		}
	};

	const getStatusText = () => {
		switch (verificationStatus) {
			case 'verified':
				return 'Verification Complete ✓';
			case 'failed':
				return 'Verification Failed';
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
					zkTLS Verification
				</Text>
				<Text className="text-gray-600 dark:text-gray-400">
					Cryptographic proof of task completion with instant release
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
					<Text className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
						🔒 Instant Release
					</Text>
				</View>
			</View>

			{/* Verification Endpoint */}
			<View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
				<Text className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
					Verification Endpoint
				</Text>
				<View className="flex-row items-center justify-between">
					<View className="flex-1 mr-3">
						<Text className="text-blue-600 dark:text-blue-300 font-mono text-sm" numberOfLines={2}>
							{task.endpoint}
						</Text>
						<Text className="text-xs text-blue-500 dark:text-blue-400 mt-1">
							Service: {getServiceFromEndpoint(task.endpoint || '')}
						</Text>
					</View>
					<Pressable
						onPress={handleOpenEndpoint}
						className="bg-blue-600 px-3 py-2 rounded-lg"
					>
						<Text className="text-white text-sm font-medium">Open</Text>
					</Pressable>
				</View>
			</View>

			{/* Verification Status */}
			<View className="items-center mb-8">
				{getStatusIcon()}
				<Text className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">
					{getStatusText()}
				</Text>
				
				{verificationStatus === 'idle' && (
					<Text className="text-gray-600 dark:text-gray-400 text-center">
						Click verify when you&apos;ve completed the task
					</Text>
				)}
				
				{verificationStatus === 'verifying' && (
					<Text className="text-blue-600 dark:text-blue-400 text-center">
						Connecting to {getServiceFromEndpoint(task.endpoint || '')}...
					</Text>
				)}

				{verificationStatus === 'verified' && verificationResult && (
					<View className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4 w-full">
						<Text className="text-green-800 dark:text-green-200 font-medium mb-2">
							Verified by {verificationResult.service} ✓
						</Text>
						<Text className="text-green-600 dark:text-green-300 text-sm">
							Proof hash: {verificationResult.proofHash.substring(0, 20)}...
						</Text>
						<Text className="text-green-600 dark:text-green-300 text-sm">
							Verified at: {new Date(verificationResult.timestamp).toLocaleString()}
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

			{verificationStatus === 'failed' && (
				<Pressable
					onPress={handleStartVerification}
					className="bg-blue-600 rounded-lg p-4 items-center mb-6"
				>
					<Text className="text-white font-medium text-lg">
						Retry Verification
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
							How zkTLS Works
						</Text>
						<Text className="text-sm text-gray-600 dark:text-gray-400">
							• Creates cryptographic proof of your interaction with the endpoint{'\n'}
						• Verifies task completion without revealing private data{'\n'}
						• Funds are released instantly upon successful verification
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}
import React, { useState } from "react";
import { 
	View, 
	Text, 
	Modal, 
	TextInput, 
	Pressable, 
	Alert,
	ScrollView,
	KeyboardAvoidingView,
	Platform 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import { DisputeData } from "@/types/proofpay";

interface DisputeModalProps {
	visible: boolean;
	taskId: string;
	onClose: () => void;
	onSubmit: (disputeData: DisputeData) => Promise<void>;
}

export default function DisputeModal({ 
	visible, 
	taskId, 
	onClose, 
	onSubmit 
}: DisputeModalProps) {
	const { colors } = useTheme();
	const [reason, setReason] = useState("");
	const [evidenceUri, setEvidenceUri] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handlePickImage = async () => {
		try {
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			
			if (status !== 'granted') {
				Alert.alert('Permission Required', 'We need access to your photos to upload evidence.');
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.7,
			});

			if (!result.canceled && result.assets[0]) {
				setEvidenceUri(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Error', 'Failed to pick image. Please try again.');
		}
	};

	const handleSubmit = async () => {
		if (!reason.trim()) {
			Alert.alert('Missing Information', 'Please provide a reason for the dispute.');
			return;
		}

		setLoading(true);
		try {
			const disputeData: DisputeData = {
				taskId,
				reason: reason.trim(),
				evidenceUrl: evidenceUri || undefined,
				evidenceHash: evidenceUri ? await generateHash(evidenceUri) : undefined,
				createdAt: new Date(),
			};

			await onSubmit(disputeData);
			
			// Reset form
			setReason("");
			setEvidenceUri(null);
			onClose();
		} catch (error) {
			console.error('Error submitting dispute:', error);
			Alert.alert('Error', 'Failed to submit dispute. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const generateHash = async (uri: string): Promise<string> => {
		// This is a simplified hash - in production you'd use crypto.subtle
		return `hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<View className="flex-1 bg-black/50 justify-end">
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 max-h-[90%]"
				>
					<ScrollView showsVerticalScrollIndicator={false}>
						{/* Header */}
						<View className="flex-row items-center justify-between mb-6">
							<Text className="text-xl font-bold text-gray-900 dark:text-white">
								Dispute Task
							</Text>
							<Pressable
								onPress={onClose}
								className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
							>
								<Ionicons
									name="close"
									size={20}
									color={colors.text.primary}
								/>
							</Pressable>
						</View>

						{/* Warning */}
						<View className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 flex-row">
							<Ionicons
								name="warning"
								size={20}
								color={colors.status?.error}
								style={{ marginRight: 12 }}
							/>
							<View className="flex-1">
								<Text className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
									Dispute Warning
								</Text>
								<Text className="text-sm text-red-600 dark:text-red-300">
									Submitting a dispute will freeze the task funds until resolved. 
									Only dispute if you have legitimate concerns.
								</Text>
							</View>
						</View>

						{/* Reason Input */}
						<View className="mb-6">
							<Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Reason for Dispute *
							</Text>
							<TextInput
								className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-gray-900 dark:text-white min-h-[100px]"
								value={reason}
								onChangeText={setReason}
								placeholder="Explain why you're disputing this task..."
								placeholderTextColor={colors.text.tertiary}
								multiline
								textAlignVertical="top"
								editable={!loading}
							/>
						</View>

						{/* Evidence Upload */}
						<View className="mb-8">
							<Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Evidence (Optional)
							</Text>
							
							{evidenceUri ? (
								<View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex-row items-center justify-between">
									<View className="flex-row items-center flex-1">
										<Ionicons
											name="image"
											size={20}
											color={colors.text.secondary}
											style={{ marginRight: 8 }}
										/>
										<Text className="text-sm text-gray-600 dark:text-gray-400 flex-1" numberOfLines={1}>
											Evidence attached
										</Text>
									</View>
									<Pressable
										onPress={() => setEvidenceUri(null)}
										disabled={loading}
									>
										<Ionicons
											name="close-circle"
											size={20}
											color={colors.status?.error}
										/>
									</Pressable>
								</View>
							) : (
								<Pressable
									onPress={handlePickImage}
									disabled={loading}
									className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 items-center"
								>
									<Ionicons
										name="cloud-upload-outline"
										size={32}
										color={colors.text.secondary}
									/>
									<Text className="text-sm text-gray-600 dark:text-gray-400 mt-2">
										Tap to upload evidence
									</Text>
								</Pressable>
							)}
						</View>

						{/* Action Buttons */}
						<View className="flex-row gap-3">
							<Pressable
								onPress={onClose}
								disabled={loading}
								className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-4 items-center"
							>
								<Text className="text-gray-700 dark:text-gray-300 font-medium">
									Cancel
								</Text>
							</Pressable>
							
							<Pressable
								onPress={handleSubmit}
								disabled={loading || !reason.trim()}
								className={`flex-1 rounded-lg p-4 items-center ${
									loading || !reason.trim()
										? 'bg-gray-300 dark:bg-gray-600'
										: 'bg-red-600'
								}`}
							>
								<Text className="text-white font-medium">
									{loading ? 'Submitting...' : 'Submit Dispute'}
								</Text>
							</Pressable>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
}
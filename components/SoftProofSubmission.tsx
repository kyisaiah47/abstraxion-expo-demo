import React, { useState } from "react";
import { 
	View, 
	Text, 
	TextInput, 
	Pressable, 
	Alert,
	ScrollView 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/contexts/ThemeContext";
import { Task } from "@/types/proofpay";

interface SoftProofSubmissionProps {
	task: Task;
	onSubmit: (proof: { text?: string; imageUri?: string; hash: string }) => Promise<void>;
}

export default function SoftProofSubmission({ task, onSubmit }: SoftProofSubmissionProps) {
	const { colors } = useTheme();
	const [proofText, setProofText] = useState("");
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handlePickImage = async () => {
		try {
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			
			if (status !== 'granted') {
				Alert.alert('Permission Required', 'We need access to your photos to upload proof.');
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			if (!result.canceled && result.assets[0]) {
				setImageUri(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Error', 'Failed to pick image. Please try again.');
		}
	};

	const generateHash = async (content: string): Promise<string> => {
		// In production, use crypto.subtle.digest for SHA-256
		// For now, using a simple hash
		const encoder = new TextEncoder();
		const data = encoder.encode(content);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	};

	const handleSubmit = async () => {
		if (!proofText.trim() && !imageUri) {
			Alert.alert('Missing Proof', 'Please provide either text description or image proof.');
			return;
		}

		setLoading(true);
		try {
			const content = proofText.trim() + (imageUri ? `|${imageUri}` : '');
			const hash = await generateHash(content);

			await onSubmit({
				text: proofText.trim() || undefined,
				imageUri: imageUri || undefined,
				hash
			});

			Alert.alert('Success', 'Proof submitted successfully! Waiting for manual approval.');
		} catch (error) {
			console.error('Error submitting proof:', error);
			Alert.alert('Error', 'Failed to submit proof. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<ScrollView className="flex-1 bg-white dark:bg-gray-900 p-6">
			{/* Header */}
			<View className="mb-6">
				<Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Submit Soft Proof
				</Text>
				<Text className="text-gray-600 dark:text-gray-400">
					Provide evidence of task completion. This will be manually reviewed.
				</Text>
			</View>

			{/* Task Info */}
			<View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
				<Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					Task
				</Text>
				<Text className="text-gray-900 dark:text-white">
					{task.description}
				</Text>
				<Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">
					Reward: {task.amount} XION
				</Text>
			</View>

			{/* Text Proof */}
			<View className="mb-6">
				<Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Proof Description
				</Text>
				<TextInput
					className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-gray-900 dark:text-white min-h-[120px]"
					value={proofText}
					onChangeText={setProofText}
					placeholder="Describe how you completed the task..."
					placeholderTextColor={colors.text.tertiary}
					multiline
					textAlignVertical="top"
					editable={!loading}
				/>
			</View>

			{/* Image Upload */}
			<View className="mb-8">
				<Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Image Proof (Optional)
				</Text>
				
				{imageUri ? (
					<View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
						<View className="flex-row items-center justify-between mb-2">
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="image"
									size={20}
									color={colors.text.secondary}
									style={{ marginRight: 8 }}
								/>
								<Text className="text-sm text-gray-600 dark:text-gray-400 flex-1" numberOfLines={1}>
									Image attached
								</Text>
							</View>
							<Pressable
								onPress={() => setImageUri(null)}
								disabled={loading}
							>
								<Ionicons
									name="close-circle"
									size={20}
									color={colors.status?.error}
								/>
							</Pressable>
						</View>
						<Pressable
							onPress={handlePickImage}
							disabled={loading}
							className="bg-gray-200 dark:bg-gray-700 rounded-lg p-2 items-center"
						>
							<Text className="text-sm text-gray-600 dark:text-gray-400">
								Change Image
							</Text>
						</Pressable>
					</View>
				) : (
					<Pressable
						onPress={handlePickImage}
						disabled={loading}
						className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 items-center"
					>
						<Ionicons
							name="camera-outline"
							size={32}
							color={colors.text.secondary}
						/>
						<Text className="text-sm text-gray-600 dark:text-gray-400 mt-2">
							Tap to add image proof
						</Text>
					</Pressable>
				)}
			</View>

			{/* Submit Button */}
			<Pressable
				onPress={handleSubmit}
				disabled={loading || (!proofText.trim() && !imageUri)}
				className={`rounded-lg p-4 items-center mb-6 ${
					loading || (!proofText.trim() && !imageUri)
						? 'bg-gray-300 dark:bg-gray-600'
						: 'bg-blue-600'
				}`}
			>
				<Text className="text-white font-medium text-lg">
					{loading ? 'Submitting...' : 'Submit Proof'}
				</Text>
			</Pressable>

			{/* Info */}
			<View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
				<View className="flex-row items-start">
					<Ionicons
						name="information-circle"
						size={20}
						color={colors.status?.info}
						style={{ marginRight: 12, marginTop: 2 }}
					/>
					<View className="flex-1">
						<Text className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
							Manual Review Process
						</Text>
						<Text className="text-sm text-blue-600 dark:text-blue-300">
							Your proof will be reviewed by the task creator. They can approve or request changes.
						</Text>
					</View>
				</View>
			</View>
		</ScrollView>
	);
}
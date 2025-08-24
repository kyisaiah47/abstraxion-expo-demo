import { useState } from "react";
import { View, Text, Image, Pressable, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/contexts/ThemeContext";
import { User } from "@/types/proofpay";
import { uploadFile } from "@/lib/supabase";

interface UserProfileProps {
	user: User;
	onUpdateProfile: (updates: Partial<User>) => Promise<void>;
	stats: {
		completedTasks: number;
		disputedTasks: number;
		onTimeCompletion: number; // percentage
		totalEarned: number;
		averageRating: number;
	};
}

export default function UserProfile({
	user,
	onUpdateProfile,
	stats,
}: UserProfileProps) {
	const { colors } = useTheme();
	const [uploading, setUploading] = useState(false);

	const handleAvatarPress = async () => {
		Alert.alert(
			"Update Avatar",
			"Choose how you want to update your profile picture",
			[
				{ text: "Cancel", style: "cancel" },
				{ text: "Camera", onPress: () => pickImage("camera") },
				{ text: "Gallery", onPress: () => pickImage("gallery") },
			]
		);
	};

	const pickImage = async (source: "camera" | "gallery") => {
		try {
			// Request permissions
			const { status } =
				source === "camera"
					? await ImagePicker.requestCameraPermissionsAsync()
					: await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (status !== "granted") {
				Alert.alert(
					"Permission Required",
					`We need ${source} access to update your avatar.`
				);
				return;
			}

			const result =
				source === "camera"
					? await ImagePicker.launchCameraAsync({
							allowsEditing: true,
							aspect: [1, 1],
							quality: 0.8,
					  })
					: await ImagePicker.launchImageLibraryAsync({
							mediaTypes: ImagePicker.MediaTypeOptions.Images,
							allowsEditing: true,
							aspect: [1, 1],
							quality: 0.8,
					  });

			if (!result.canceled && result.assets[0]) {
				await uploadAvatar(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error picking image:", error);
			Alert.alert("Error", "Failed to pick image. Please try again.");
		}
	};

	const uploadAvatar = async (uri: string) => {
		setUploading(true);
		try {
			const file = {
				uri,
				name: `avatar-${user.wallet_address}.jpg`,
				type: "image/jpeg",
			};

			const result = await uploadFile(file);

			if (result) {
				await onUpdateProfile({ profile_picture: result.url });
				Alert.alert("Success", "Profile picture updated successfully!");
			} else {
				throw new Error("Upload failed");
			}
		} catch (error) {
			console.error("Avatar upload failed:", error);
			Alert.alert("Error", "Failed to upload avatar. Please try again.");
		} finally {
			setUploading(false);
		}
	};

	const formatAddress = (address: string) => {
		return `${address.slice(0, 8)}...${address.slice(-8)}`;
	};

	return (
		<ScrollView className="flex-1 bg-white dark:bg-gray-900">
			{/* Header */}
			<View className="bg-gradient-to-b from-blue-500 to-purple-600 pt-12 pb-8 px-6">
				<View className="items-center">
					{/* Avatar */}
					<Pressable
						onPress={handleAvatarPress}
						disabled={uploading}
					>
						<View className="relative">
							<View className="w-24 h-24 rounded-full bg-white shadow-lg items-center justify-center overflow-hidden">
								{user.profile_picture ? (
									<Image
										source={{ uri: user.profile_picture }}
										className="w-full h-full"
										resizeMode="cover"
									/>
								) : (
									<Text className="text-2xl font-bold text-gray-600">
										{(user.display_name || user.username || "?")
											.charAt(0)
											.toUpperCase()}
									</Text>
								)}
							</View>

							{/* Upload indicator */}
							<View className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full items-center justify-center shadow-lg">
								{uploading ? (
									<Ionicons
										name="hourglass"
										size={16}
										color="white"
									/>
								) : (
									<Ionicons
										name="camera"
										size={16}
										color="white"
									/>
								)}
							</View>
						</View>
					</Pressable>

					{/* Name & Username */}
					<Text className="text-xl font-bold text-white mt-4">
						{user.display_name || user.username}
					</Text>
					<Text className="text-blue-100 mt-1">@{user.username}</Text>
					<Text className="text-blue-200 text-sm mt-2 font-mono">
						{formatAddress(user.wallet_address)}
					</Text>
				</View>
			</View>

			{/* Stats Grid */}
			<View className="px-6 -mt-6 mb-6">
				<View className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
					<View className="flex-row justify-between mb-4">
						<View className="items-center flex-1">
							<Text className="text-2xl font-bold text-gray-900 dark:text-white">
								{stats.completedTasks}
							</Text>
							<Text className="text-sm text-gray-500 dark:text-gray-400">
								Completed
							</Text>
						</View>

						<View className="items-center flex-1">
							<Text className="text-2xl font-bold text-gray-900 dark:text-white">
								{stats.disputedTasks}
							</Text>
							<Text className="text-sm text-gray-500 dark:text-gray-400">
								Disputed
							</Text>
						</View>

						<View className="items-center flex-1">
							<Text className="text-2xl font-bold text-green-600">
								{stats.onTimeCompletion}%
							</Text>
							<Text className="text-sm text-gray-500 dark:text-gray-400">
								On-time
							</Text>
						</View>
					</View>

					<View className="border-t border-gray-200 dark:border-gray-600 pt-4 flex-row justify-between">
						<View className="items-center flex-1">
							<Text className="text-lg font-semibold text-gray-900 dark:text-white">
								{stats.totalEarned} XION
							</Text>
							<Text className="text-sm text-gray-500 dark:text-gray-400">
								Total Earned
							</Text>
						</View>

						<View className="items-center flex-1">
							<View className="flex-row items-center">
								<Text className="text-lg font-semibold text-gray-900 dark:text-white mr-1">
									{stats.averageRating.toFixed(1)}
								</Text>
								<Ionicons
									name="star"
									size={16}
									color="#F59E0B"
								/>
							</View>
							<Text className="text-sm text-gray-500 dark:text-gray-400">
								Rating
							</Text>
						</View>
					</View>
				</View>
			</View>

			{/* Profile Sections */}
			<View className="px-6 space-y-4">
				{/* Account Info */}
				<View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
					<Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
						Account Information
					</Text>

					<View className="space-y-3">
						<View className="flex-row justify-between items-center">
							<Text className="text-gray-600 dark:text-gray-400">
								Member since
							</Text>
							<Text className="text-gray-900 dark:text-white">
								{new Date(user.created_at * 1000).toLocaleDateString()}
							</Text>
						</View>

						<View className="flex-row justify-between items-center">
							<Text className="text-gray-600 dark:text-gray-400">Wallet</Text>
							<Text className="text-gray-900 dark:text-white font-mono text-sm">
								{formatAddress(user.wallet_address)}
							</Text>
						</View>
					</View>
				</View>

				{/* Achievements */}
				<View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
					<Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
						Achievements
					</Text>

					<View className="flex-row justify-between">
						<View
							className={`items-center p-3 rounded-lg ${
								stats.completedTasks >= 10
									? "bg-green-100 dark:bg-green-900/30"
									: "bg-gray-100 dark:bg-gray-700"
							}`}
						>
							<Text className="text-2xl mb-1">🏆</Text>
							<Text className="text-xs text-center font-medium text-gray-700 dark:text-gray-300">
								Task Master
							</Text>
						</View>

						<View
							className={`items-center p-3 rounded-lg ${
								stats.onTimeCompletion >= 90
									? "bg-blue-100 dark:bg-blue-900/30"
									: "bg-gray-100 dark:bg-gray-700"
							}`}
						>
							<Text className="text-2xl mb-1">⏰</Text>
							<Text className="text-xs text-center font-medium text-gray-700 dark:text-gray-300">
								Punctual
							</Text>
						</View>

						<View
							className={`items-center p-3 rounded-lg ${
								stats.averageRating >= 4.5
									? "bg-yellow-100 dark:bg-yellow-900/30"
									: "bg-gray-100 dark:bg-gray-700"
							}`}
						>
							<Text className="text-2xl mb-1">⭐</Text>
							<Text className="text-xs text-center font-medium text-gray-700 dark:text-gray-300">
								Top Rated
							</Text>
						</View>
					</View>
				</View>
			</View>

			<View className="h-20" />
		</ScrollView>
	);
}

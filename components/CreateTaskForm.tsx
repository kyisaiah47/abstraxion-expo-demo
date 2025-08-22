import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Pressable,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "@/constants/DesignSystem";
import { TaskFormData } from "@/types/proofpay";

interface CreateTaskFormProps {
	onSubmit: (payload: TaskFormData) => void;
}

const TIME_LIMIT_OPTIONS = [
	{ label: "1h", value: "1 hour" },
	{ label: "24h", value: "24 hours" },
	{ label: "3d", value: "3 days" },
];

export default function CreateTaskForm({ onSubmit }: CreateTaskFormProps) {
	const [formData, setFormData] = useState<TaskFormData>({
		description: "",
		reward: 0,
		deadline: undefined,
	});
	const [customDeadline, setCustomDeadline] = useState("");
	const [selectedTimeLimit, setSelectedTimeLimit] = useState<string | null>(
		null
	);

	const handleSubmit = () => {
		if (!formData.description.trim()) {
			Alert.alert("Error", "Please describe what proof is required");
			return;
		}

		if (formData.reward <= 0) {
			Alert.alert("Error", "Please enter a valid reward amount");
			return;
		}

		const deadline = selectedTimeLimit || customDeadline || undefined;

		onSubmit({
			...formData,
			deadline,
		});
	};

	const handleTimeLimitSelect = (value: string) => {
		setSelectedTimeLimit(value);
		setCustomDeadline("");
		setFormData({ ...formData, deadline: value });
	};

	const isSubmitDisabled = !formData.description.trim() || formData.reward <= 0;

	return (
		<View style={styles.container}>
			<View style={styles.formSection}>
				{/* Description Input */}
				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>
						What proof is required? <Text style={styles.required}>*</Text>
					</Text>
					<TextInput
						style={[styles.textInput, styles.textArea]}
						value={formData.description}
						onChangeText={(text) =>
							setFormData({ ...formData, description: text })
						}
						placeholder="e.g., Take a photo of your coffee, Write a review, Answer a survey…"
						placeholderTextColor={DesignSystem.colors.text.tertiary}
						multiline
						numberOfLines={4}
						textAlignVertical="top"
					/>
				</View>

				{/* Reward Input */}
				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>
						Reward <Text style={styles.required}>*</Text>
					</Text>
					<View style={styles.amountInputContainer}>
						<Text style={styles.currencySymbol}>$</Text>
						<TextInput
							style={styles.amountInput}
							value={formData.reward > 0 ? formData.reward.toString() : ""}
							onChangeText={(text) => {
								const amount = parseFloat(text) || 0;
								setFormData({ ...formData, reward: amount });
							}}
							placeholder="0.00"
							placeholderTextColor={DesignSystem.colors.text.tertiary}
							keyboardType="numeric"
						/>
					</View>
					{formData.reward <= 0 && (
						<Text style={styles.validationText}>
							Reward must be greater than zero to create a task
						</Text>
					)}
				</View>

				{/* Time Limit */}
				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>Time Limit</Text>

					<View style={styles.timeLimitChips}>
						{TIME_LIMIT_OPTIONS.map((option) => (
							<Pressable
								key={option.value}
								style={[
									styles.timeLimitChip,
									selectedTimeLimit === option.value &&
										styles.timeLimitChipActive,
								]}
								onPress={() => handleTimeLimitSelect(option.value)}
							>
								<Text
									style={[
										styles.timeLimitChipText,
										selectedTimeLimit === option.value &&
											styles.timeLimitChipTextActive,
									]}
								>
									{option.label}
								</Text>
							</Pressable>
						))}
					</View>

					<TextInput
						style={styles.textInput}
						value={customDeadline}
						onChangeText={(text) => {
							setCustomDeadline(text);
							setSelectedTimeLimit(null);
							setFormData({ ...formData, deadline: text });
						}}
						placeholder="e.g., 24 hours, By tomorrow, etc."
						placeholderTextColor={DesignSystem.colors.text.tertiary}
					/>
				</View>
			</View>

			{/* Submit Button */}
			<Pressable
				style={[
					styles.submitButton,
					isSubmitDisabled && styles.submitButtonDisabled,
				]}
				onPress={handleSubmit}
				disabled={isSubmitDisabled}
			>
				<Ionicons
					name="add-circle"
					size={20}
					color={
						isSubmitDisabled
							? DesignSystem.colors.text.tertiary
							: DesignSystem.colors.text.inverse
					}
				/>
				<Text
					style={[
						styles.submitButtonText,
						isSubmitDisabled && styles.submitButtonTextDisabled,
					]}
				>
					Create Task
				</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: DesignSystem.spacing["4xl"],
	},

	formSection: {
		gap: DesignSystem.spacing["3xl"],
	},

	inputContainer: {
		gap: DesignSystem.spacing.md,
	},

	inputLabel: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.primary,
	},

	required: {
		color: DesignSystem.colors.status.error,
	},

	textInput: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing["2xl"],
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.primary,
		minHeight: 56,
	},

	textArea: {
		minHeight: 120,
		textAlignVertical: "top",
	},

	amountInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		paddingHorizontal: DesignSystem.spacing["2xl"],
	},

	currencySymbol: {
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.secondary,
		marginRight: DesignSystem.spacing.sm,
	},

	amountInput: {
		flex: 1,
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.primary,
		minHeight: 56,
	},

	timeLimitChips: {
		flexDirection: "row",
		gap: DesignSystem.spacing.md,
		marginBottom: DesignSystem.spacing.md,
	},

	timeLimitChip: {
		paddingHorizontal: DesignSystem.spacing.lg,
		paddingVertical: DesignSystem.spacing.md,
		borderRadius: DesignSystem.radius.md,
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},

	timeLimitChipActive: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderColor: DesignSystem.colors.primary[800],
	},

	timeLimitChipText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
	},

	timeLimitChipTextActive: {
		color: DesignSystem.colors.text.inverse,
	},

	submitButton: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: DesignSystem.radius.xl,
		padding: DesignSystem.spacing["2xl"],
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.md,
		...DesignSystem.shadows.lg,
		minHeight: 56,
	},

	submitButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	submitButtonDisabled: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},

	submitButtonTextDisabled: {
		color: DesignSystem.colors.text.tertiary,
	},

	validationText: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.status.error,
		marginTop: DesignSystem.spacing.xs,
	},
});

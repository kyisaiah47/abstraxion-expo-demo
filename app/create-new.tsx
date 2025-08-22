import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import SophisticatedHeader from "@/components/SophisticatedHeader";
import { DesignSystem } from "@/constants/DesignSystem";

interface JobFormData {
	title: string;
	description: string;
	category: string;
	budget: string;
	deadline: string;
	difficulty: "beginner" | "intermediate" | "advanced" | "";
	type: "hourly" | "fixed" | "";
	skills: string[];
	location: "remote" | "onsite" | "hybrid" | "";
}

const JOB_CATEGORIES = [
	"Data Entry",
	"Content Creation",
	"Image Processing",
	"Content Moderation",
	"Research",
	"Virtual Assistant",
	"Quality Assurance",
	"Translation",
	"Other",
];

const DIFFICULTY_LEVELS = [
	{
		value: "beginner",
		label: "Beginner",
		description: "Entry level, no experience required",
	},
	{
		value: "intermediate",
		label: "Intermediate",
		description: "Some experience preferred",
	},
	{
		value: "advanced",
		label: "Advanced",
		description: "Expert level, specialized skills",
	},
];

const JOB_TYPES = [
	{ value: "hourly", label: "Hourly Rate", description: "Pay per hour worked" },
	{
		value: "fixed",
		label: "Fixed Price",
		description: "One-time payment for project",
	},
];

const LOCATION_OPTIONS = [
	{ value: "remote", label: "Remote", description: "Work from anywhere" },
	{
		value: "onsite",
		label: "On-site",
		description: "Work at specific location",
	},
	{
		value: "hybrid",
		label: "Hybrid",
		description: "Mix of remote and on-site",
	},
];

export default function SophisticatedCreateJob() {
	const [formData, setFormData] = useState<JobFormData>({
		title: "",
		description: "",
		category: "",
		budget: "",
		deadline: "",
		difficulty: "",
		type: "",
		skills: [],
		location: "",
	});

	const [currentSkill, setCurrentSkill] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const updateFormData = (field: keyof JobFormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const addSkill = () => {
		if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
			updateFormData("skills", [...formData.skills, currentSkill.trim()]);
			setCurrentSkill("");
		}
	};

	const removeSkill = (skill: string) => {
		updateFormData(
			"skills",
			formData.skills.filter((s) => s !== skill)
		);
	};

	const validateForm = (): boolean => {
		if (!formData.title.trim()) {
			Alert.alert("Validation Error", "Please enter a job title");
			return false;
		}
		if (!formData.description.trim()) {
			Alert.alert("Validation Error", "Please enter a job description");
			return false;
		}
		if (!formData.category) {
			Alert.alert("Validation Error", "Please select a category");
			return false;
		}
		if (!formData.budget.trim()) {
			Alert.alert("Validation Error", "Please enter a budget");
			return false;
		}
		if (!formData.type) {
			Alert.alert("Validation Error", "Please select a job type");
			return false;
		}
		if (!formData.difficulty) {
			Alert.alert("Validation Error", "Please select a difficulty level");
			return false;
		}
		if (!formData.location) {
			Alert.alert("Validation Error", "Please select a location type");
			return false;
		}
		return true;
	};

	const handleSubmit = async () => {
		if (!validateForm()) return;

		setIsSubmitting(true);
		try {
			// TODO: Implement job creation logic
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

			Alert.alert("Success", "Your job has been posted successfully!", [
				{ text: "OK", onPress: () => router.back() },
			]);
		} catch (error) {
			Alert.alert("Error", "Failed to create job. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderFormSection = (title: string, children: React.ReactNode) => (
		<View style={styles.formSection}>
			<Text style={styles.sectionTitle}>{title}</Text>
			{children}
		</View>
	);

	const renderTextInput = (
		placeholder: string,
		value: string,
		onChangeText: (text: string) => void,
		multiline = false,
		required = true
	) => (
		<View style={styles.inputContainer}>
			<TextInput
				style={[styles.textInput, multiline && styles.textAreaInput]}
				placeholder={placeholder}
				placeholderTextColor={DesignSystem.colors.text.tertiary}
				value={value}
				onChangeText={onChangeText}
				multiline={multiline}
				numberOfLines={multiline ? 4 : 1}
				textAlignVertical={multiline ? "top" : "center"}
			/>
			{required && (
				<View style={styles.requiredIndicator}>
					<Text style={styles.requiredText}>*</Text>
				</View>
			)}
		</View>
	);

	const renderSelector = <T extends string>(
		options: { value: T; label: string; description?: string }[],
		selectedValue: T,
		onSelect: (value: T) => void
	) => (
		<View style={styles.selectorContainer}>
			{options.map((option) => (
				<Pressable
					key={option.value}
					style={[
						styles.selectorOption,
						selectedValue === option.value && styles.selectorOptionSelected,
					]}
					onPress={() => onSelect(option.value)}
				>
					<View style={styles.selectorContent}>
						<Text
							style={[
								styles.selectorLabel,
								selectedValue === option.value && styles.selectorLabelSelected,
							]}
						>
							{option.label}
						</Text>
						{option.description && (
							<Text
								style={[
									styles.selectorDescription,
									selectedValue === option.value &&
										styles.selectorDescriptionSelected,
								]}
							>
								{option.description}
							</Text>
						)}
					</View>

					<View
						style={[
							styles.selectorRadio,
							selectedValue === option.value && styles.selectorRadioSelected,
						]}
					>
						{selectedValue === option.value && (
							<Ionicons
								name="checkmark"
								size={16}
								color={DesignSystem.colors.text.inverse}
							/>
						)}
					</View>
				</Pressable>
			))}
		</View>
	);

	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
		>
			<SophisticatedHeader
				title="Create Job"
				subtitle="Post a new task or project"
				showBackButton
			/>

			<KeyboardAvoidingView
				style={styles.keyboardAvoid}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{/* Basic Information */}
					{renderFormSection(
						"Basic Information",
						<>
							{renderTextInput(
								'Enter job title (e.g. "Data Entry for E-commerce")',
								formData.title,
								(text) => updateFormData("title", text)
							)}

							{renderTextInput(
								"Describe the job requirements, expectations, and deliverables...",
								formData.description,
								(text) => updateFormData("description", text),
								true
							)}

							<View style={styles.dropdownContainer}>
								<Text style={styles.dropdownLabel}>Category *</Text>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									style={styles.categoryScroll}
									contentContainerStyle={styles.categoryContainer}
								>
									{JOB_CATEGORIES.map((category) => (
										<Pressable
											key={category}
											style={[
												styles.categoryChip,
												formData.category === category &&
													styles.categoryChipSelected,
											]}
											onPress={() => updateFormData("category", category)}
										>
											<Text
												style={[
													styles.categoryText,
													formData.category === category &&
														styles.categoryTextSelected,
												]}
											>
												{category}
											</Text>
										</Pressable>
									))}
								</ScrollView>
							</View>
						</>
					)}

					{/* Job Details */}
					{renderFormSection(
						"Job Details",
						<>
							<View style={styles.budgetContainer}>
								<Text style={styles.inputLabel}>Budget *</Text>
								<View style={styles.budgetInputContainer}>
									<Text style={styles.currencySymbol}>$</Text>
									<TextInput
										style={styles.budgetInput}
										placeholder="0.00"
										placeholderTextColor={DesignSystem.colors.text.tertiary}
										value={formData.budget}
										onChangeText={(text) => updateFormData("budget", text)}
										keyboardType="decimal-pad"
									/>
								</View>
							</View>

							<View style={styles.inputContainer}>
								<Text style={styles.inputLabel}>Payment Type *</Text>
								{renderSelector(JOB_TYPES, formData.type, (value) =>
									updateFormData("type", value)
								)}
							</View>

							<View style={styles.inputContainer}>
								<Text style={styles.inputLabel}>Difficulty Level *</Text>
								{renderSelector(
									DIFFICULTY_LEVELS,
									formData.difficulty,
									(value) => updateFormData("difficulty", value)
								)}
							</View>

							<View style={styles.inputContainer}>
								<Text style={styles.inputLabel}>Location Type *</Text>
								{renderSelector(LOCATION_OPTIONS, formData.location, (value) =>
									updateFormData("location", value)
								)}
							</View>
						</>
					)}

					{/* Skills & Timeline */}
					{renderFormSection(
						"Skills & Timeline",
						<>
							<View style={styles.skillsContainer}>
								<Text style={styles.inputLabel}>Required Skills</Text>
								<View style={styles.skillsInputContainer}>
									<TextInput
										style={styles.skillInput}
										placeholder="Add a skill and press +"
										placeholderTextColor={DesignSystem.colors.text.tertiary}
										value={currentSkill}
										onChangeText={setCurrentSkill}
										onSubmitEditing={addSkill}
										returnKeyType="done"
									/>
									<Pressable
										style={styles.addSkillButton}
										onPress={addSkill}
									>
										<Ionicons
											name="add"
											size={20}
											color={DesignSystem.colors.text.inverse}
										/>
									</Pressable>
								</View>

								{formData.skills.length > 0 && (
									<View style={styles.skillsList}>
										{formData.skills.map((skill, index) => (
											<View
												key={index}
												style={styles.skillTag}
											>
												<Text style={styles.skillTagText}>{skill}</Text>
												<Pressable onPress={() => removeSkill(skill)}>
													<Ionicons
														name="close-circle"
														size={16}
														color={DesignSystem.colors.text.secondary}
													/>
												</Pressable>
											</View>
										))}
									</View>
								)}
							</View>

							{renderTextInput(
								'Deadline (e.g. "3 days", "1 week", "2024-12-31")',
								formData.deadline,
								(text) => updateFormData("deadline", text),
								false,
								false
							)}
						</>
					)}

					{/* Submit Button */}
					<View style={styles.submitSection}>
						<Pressable
							style={[
								styles.submitButton,
								isSubmitting && styles.submitButtonDisabled,
							]}
							onPress={handleSubmit}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<Text style={styles.submitButtonText}>Creating Job...</Text>
							) : (
								<>
									<Ionicons
										name="add-circle"
										size={20}
										color={DesignSystem.colors.text.inverse}
									/>
									<Text style={styles.submitButtonText}>Create Job</Text>
								</>
							)}
						</Pressable>

						<Text style={styles.submitNote}>
							By creating this job, you agree to our Terms of Service and
							Community Guidelines.
						</Text>
					</View>

					<View style={styles.bottomSpacer} />
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.primary,
	},

	keyboardAvoid: {
		flex: 1,
	},

	scrollView: {
		flex: 1,
	},

	scrollContent: {
		paddingHorizontal: DesignSystem.layout.containerPadding,
		paddingTop: DesignSystem.spacing["2xl"],
	},

	// Form Sections
	formSection: {
		marginBottom: DesignSystem.spacing["4xl"],
	},

	sectionTitle: {
		...DesignSystem.typography.h3,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing["2xl"],
	},

	// Input Components
	inputContainer: {
		marginBottom: DesignSystem.spacing["2xl"],
	},

	inputLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.md,
	},

	textInput: {
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
		minHeight: 56,
	},

	textAreaInput: {
		minHeight: 120,
		paddingTop: DesignSystem.spacing.xl,
	},

	requiredIndicator: {
		position: "absolute",
		top: DesignSystem.spacing.xl,
		right: DesignSystem.spacing.xl,
	},

	requiredText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.status.error,
	},

	// Budget Input
	budgetContainer: {
		marginBottom: DesignSystem.spacing["2xl"],
	},

	budgetInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		paddingLeft: DesignSystem.spacing.xl,
	},

	currencySymbol: {
		...DesignSystem.typography.body.large,
		color: DesignSystem.colors.text.secondary,
		marginRight: DesignSystem.spacing.sm,
	},

	budgetInput: {
		flex: 1,
		padding: DesignSystem.spacing.xl,
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
		minHeight: 56,
	},

	// Category Selector
	dropdownContainer: {
		marginBottom: DesignSystem.spacing["2xl"],
	},

	dropdownLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
		marginBottom: DesignSystem.spacing.md,
	},

	categoryScroll: {
		flexGrow: 0,
	},

	categoryContainer: {
		gap: DesignSystem.spacing.md,
		paddingRight: DesignSystem.spacing.xl,
	},

	categoryChip: {
		paddingHorizontal: DesignSystem.spacing.xl,
		paddingVertical: DesignSystem.spacing.md,
		borderRadius: DesignSystem.radius.xl,
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
	},

	categoryChipSelected: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderColor: DesignSystem.colors.primary[800],
	},

	categoryText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.secondary,
	},

	categoryTextSelected: {
		color: DesignSystem.colors.text.inverse,
	},

	// Selector Components
	selectorContainer: {
		gap: DesignSystem.spacing.md,
	},

	selectorOption: {
		flexDirection: "row",
		alignItems: "center",
		padding: DesignSystem.spacing.xl,
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderRadius: DesignSystem.radius.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		gap: DesignSystem.spacing.lg,
	},

	selectorOptionSelected: {
		backgroundColor: DesignSystem.colors.primary[50],
		borderColor: DesignSystem.colors.primary[800],
	},

	selectorContent: {
		flex: 1,
		gap: DesignSystem.spacing.xs,
	},

	selectorLabel: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
	},

	selectorLabelSelected: {
		color: DesignSystem.colors.primary[800],
	},

	selectorDescription: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.secondary,
	},

	selectorDescriptionSelected: {
		color: DesignSystem.colors.primary[700],
	},

	selectorRadio: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: DesignSystem.colors.border.primary,
		alignItems: "center",
		justifyContent: "center",
	},

	selectorRadioSelected: {
		backgroundColor: DesignSystem.colors.primary[800],
		borderColor: DesignSystem.colors.primary[800],
	},

	// Skills Input
	skillsContainer: {
		marginBottom: DesignSystem.spacing["2xl"],
	},

	skillsInputContainer: {
		flexDirection: "row",
		gap: DesignSystem.spacing.md,
	},

	skillInput: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.xl,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.primary,
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
		minHeight: 56,
	},

	addSkillButton: {
		width: 56,
		height: 56,
		borderRadius: DesignSystem.radius.lg,
		backgroundColor: DesignSystem.colors.primary[800],
		alignItems: "center",
		justifyContent: "center",
		...DesignSystem.shadows.sm,
	},

	skillsList: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: DesignSystem.spacing.md,
		marginTop: DesignSystem.spacing.lg,
	},

	skillTag: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.tertiary,
		borderRadius: DesignSystem.radius.md,
		paddingHorizontal: DesignSystem.spacing.md,
		paddingVertical: DesignSystem.spacing.sm,
		gap: DesignSystem.spacing.sm,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.tertiary,
	},

	skillTagText: {
		...DesignSystem.typography.label.small,
		color: DesignSystem.colors.text.secondary,
	},

	// Submit Section
	submitSection: {
		marginTop: DesignSystem.spacing["2xl"],
		gap: DesignSystem.spacing.lg,
	},

	submitButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: DesignSystem.radius.lg,
		padding: DesignSystem.spacing.xl,
		gap: DesignSystem.spacing.md,
		...DesignSystem.shadows.md,
		minHeight: 56,
	},

	submitButtonDisabled: {
		opacity: 0.6,
	},

	submitButtonText: {
		...DesignSystem.typography.label.large,
		color: DesignSystem.colors.text.inverse,
	},

	submitNote: {
		...DesignSystem.typography.body.small,
		color: DesignSystem.colors.text.tertiary,
		textAlign: "center",
		lineHeight: 20,
	},

	bottomSpacer: {
		height: 140,
	},
});

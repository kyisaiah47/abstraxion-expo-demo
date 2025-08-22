import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	SafeAreaView,
	Alert,
	Switch,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface JobCreateProps {
	onCreate?: (job: JobFormData) => void;
	creating?: boolean;
}

interface JobFormData {
	title: string;
	description: string;
	skills: string[];
	deadline: Date;
	budget: string;
	proofType: "github" | "website" | "document" | "custom";
	customVerification: string;
	distribution: {
		marketplace: boolean;
		qrCode: boolean;
		jobCode: boolean;
	};
}

const PROOF_TYPES = [
	{ id: "github", label: "GitHub Repository", icon: "logo-github" },
	{ id: "website", label: "Website/Portfolio Link", icon: "globe-outline" },
	{ id: "document", label: "Document Upload", icon: "document-outline" },
	{ id: "custom", label: "Custom Verification", icon: "settings-outline" },
];

export default function CreateJobScreen({
	onCreate,
	creating = false,
}: JobCreateProps) {
	const router = useRouter();
	const [formData, setFormData] = useState<JobFormData>({
		title: "",
		description: "",
		skills: [],
		deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
		budget: "",
		proofType: "github",
		customVerification: "",
		distribution: {
			marketplace: true,
			qrCode: false,
			jobCode: true,
		},
	});

	const [skillInput, setSkillInput] = useState("");
	const [isDraft, setIsDraft] = useState(false);

	// Generate job code based on title
	const generateJobCode = (title: string) => {
		const words = title
			.toUpperCase()
			.replace(/[^A-Z0-9 ]/g, "")
			.split(" ");
		const code = words.slice(0, 2).join("") + "2024";
		return code.substring(0, 8);
	};

	const addSkill = () => {
		if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
			setFormData((prev) => ({
				...prev,
				skills: [...prev.skills, skillInput.trim()],
			}));
			setSkillInput("");
		}
	};

	const removeSkill = (skill: string) => {
		setFormData((prev) => ({
			...prev,
			skills: prev.skills.filter((s) => s !== skill),
		}));
	};

	const handleCreate = () => {
		// Validation
		if (!formData.title.trim()) {
			Alert.alert("Error", "Please enter a job title");
			return;
		}
		if (!formData.description.trim()) {
			Alert.alert("Error", "Please enter a job description");
			return;
		}
		if (!formData.budget.trim() || parseFloat(formData.budget) <= 0) {
			Alert.alert("Error", "Please enter a valid budget amount");
			return;
		}

		// Here you would call the contract service to create the job
		console.log("Creating job:", formData);

		if (onCreate) {
			onCreate(formData);
		} else {
			// Navigate back or show success
			router.back();
		}
	};

	const handleSaveDraft = () => {
		setIsDraft(true);
		// Save to local storage or send to backend
		Alert.alert("Success", "Job saved as draft");
	};

	const isFormValid =
		formData.title.trim() &&
		formData.description.trim() &&
		formData.budget.trim() &&
		parseFloat(formData.budget) > 0;

	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen
				options={{
					title: "Post New Job",
					headerTitleAlign: "center",
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: "#FFFFFF",
					},
					headerTitleStyle: {
						fontSize: 20,
						fontWeight: "700",
						color: "#111827",
					},
					headerLeft: () => (
						<TouchableOpacity onPress={() => router.back()}>
							<Ionicons
								name="arrow-back"
								size={24}
								color="#111827"
							/>
						</TouchableOpacity>
					),
				}}
			/>

			<ScrollView
				style={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Job Details Card */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<Ionicons
							name="briefcase-outline"
							size={20}
							color="#111827"
						/>
						<Text style={styles.cardTitle}>Job Details</Text>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Job Title *</Text>
						<TextInput
							style={styles.input}
							placeholder="e.g., Design a modern logo for tech startup"
							value={formData.title}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, title: text }))
							}
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Job Description *</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							placeholder="Describe the work in detail, including requirements, deliverables, and any specific guidelines..."
							value={formData.description}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, description: text }))
							}
							multiline
							numberOfLines={4}
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Required Skills</Text>
						<View style={styles.skillsContainer}>
							<View style={styles.skillInputRow}>
								<TextInput
									style={[styles.input, styles.skillInput]}
									placeholder="Add a skill"
									value={skillInput}
									onChangeText={setSkillInput}
									onSubmitEditing={addSkill}
								/>
								<TouchableOpacity
									style={styles.addButton}
									onPress={addSkill}
								>
									<Ionicons
										name="add"
										size={20}
										color="#FFFFFF"
									/>
								</TouchableOpacity>
							</View>
							<View style={styles.skillTags}>
								{formData.skills.map((skill, index) => (
									<View
										key={index}
										style={styles.skillTag}
									>
										<Text style={styles.skillTagText}>{skill}</Text>
										<TouchableOpacity onPress={() => removeSkill(skill)}>
											<Ionicons
												name="close"
												size={16}
												color="#6B7280"
											/>
										</TouchableOpacity>
									</View>
								))}
							</View>
						</View>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Deadline</Text>
						<TouchableOpacity
							style={styles.dateButton}
							onPress={() => {
								// For now, just add 7 days to current date
								const newDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
								setFormData((prev) => ({ ...prev, deadline: newDate }));
							}}
						>
							<Ionicons
								name="calendar-outline"
								size={20}
								color="#6B7280"
							/>
							<Text style={styles.dateButtonText}>
								{formData.deadline.toLocaleDateString()}
							</Text>
							<Text style={styles.dateHint}>(Tap to add 7 days)</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Payment Details Card */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<Ionicons
							name="card-outline"
							size={20}
							color="#111827"
						/>
						<Text style={styles.cardTitle}>Payment Details</Text>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Job Budget (XION) *</Text>
						<TextInput
							style={styles.input}
							placeholder="e.g., 25.0"
							value={formData.budget}
							onChangeText={(text) =>
								setFormData((prev) => ({ ...prev, budget: text }))
							}
							keyboardType="decimal-pad"
						/>
						<View style={styles.infoBox}>
							<Ionicons
								name="shield-checkmark-outline"
								size={16}
								color="#059669"
							/>
							<Text style={styles.infoText}>
								Funds will be held securely in escrow until work is verified
							</Text>
						</View>
					</View>
				</View>

				{/* Verification Requirements Card */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<Ionicons
							name="checkmark-circle-outline"
							size={20}
							color="#111827"
						/>
						<Text style={styles.cardTitle}>Verification Requirements</Text>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Proof Type</Text>
						<View style={styles.proofTypeContainer}>
							{PROOF_TYPES.map((type) => (
								<TouchableOpacity
									key={type.id}
									style={[
										styles.proofTypeOption,
										formData.proofType === type.id && styles.proofTypeSelected,
									]}
									onPress={() =>
										setFormData((prev) => ({
											...prev,
											proofType: type.id as any,
										}))
									}
								>
									<Ionicons
										name={type.icon as any}
										size={20}
										color={
											formData.proofType === type.id ? "#FFFFFF" : "#6B7280"
										}
									/>
									<Text
										style={[
											styles.proofTypeText,
											formData.proofType === type.id &&
												styles.proofTypeTextSelected,
										]}
									>
										{type.label}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{formData.proofType === "custom" && (
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Custom Verification Instructions</Text>
							<TextInput
								style={[styles.input, styles.textArea]}
								placeholder="Describe how the freelancer should prove completion..."
								value={formData.customVerification}
								onChangeText={(text) =>
									setFormData((prev) => ({ ...prev, customVerification: text }))
								}
								multiline
								numberOfLines={3}
							/>
						</View>
					)}

					<View style={styles.infoBox}>
						<Ionicons
							name="information-circle-outline"
							size={16}
							color="#3B82F6"
						/>
						<Text style={styles.infoText}>
							zkTLS verification ensures proof authenticity without revealing
							sensitive data
						</Text>
					</View>
				</View>

				{/* Job Distribution Card */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<Ionicons
							name="share-outline"
							size={20}
							color="#111827"
						/>
						<Text style={styles.cardTitle}>Job Distribution</Text>
					</View>

					<View style={styles.distributionOptions}>
						<View style={styles.distributionOption}>
							<View style={styles.distributionInfo}>
								<Ionicons
									name="storefront-outline"
									size={20}
									color="#6B7280"
								/>
								<Text style={styles.distributionLabel}>Public Marketplace</Text>
							</View>
							<Switch
								value={formData.distribution.marketplace}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										distribution: { ...prev.distribution, marketplace: value },
									}))
								}
							/>
						</View>

						<View style={styles.distributionOption}>
							<View style={styles.distributionInfo}>
								<Ionicons
									name="qr-code-outline"
									size={20}
									color="#6B7280"
								/>
								<Text style={styles.distributionLabel}>Generate QR Code</Text>
							</View>
							<Switch
								value={formData.distribution.qrCode}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										distribution: { ...prev.distribution, qrCode: value },
									}))
								}
							/>
						</View>

						<View style={styles.distributionOption}>
							<View style={styles.distributionInfo}>
								<Ionicons
									name="code-outline"
									size={20}
									color="#6B7280"
								/>
								<Text style={styles.distributionLabel}>Generate Job Code</Text>
							</View>
							<Switch
								value={formData.distribution.jobCode}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										distribution: { ...prev.distribution, jobCode: value },
									}))
								}
							/>
						</View>
					</View>

					{formData.distribution.jobCode && formData.title.trim() && (
						<View style={styles.jobCodePreview}>
							<Text style={styles.jobCodeLabel}>Job Code Preview:</Text>
							<View style={styles.jobCodeContainer}>
								<Text style={styles.jobCode}>
									{generateJobCode(formData.title)}
								</Text>
								<Ionicons
									name="copy-outline"
									size={16}
									color="#6B7280"
								/>
							</View>
						</View>
					)}
				</View>

				{/* Action Buttons */}
				<View style={styles.actionButtons}>
					<TouchableOpacity
						style={[
							styles.primaryButton,
							{ opacity: isFormValid && !creating ? 1 : 0.6 },
						]}
						onPress={handleCreate}
						disabled={!isFormValid || creating}
					>
						{creating ? (
							<Text style={styles.primaryButtonText}>Creating Job...</Text>
						) : (
							<>
								<Ionicons
									name="shield-checkmark"
									size={20}
									color="#FFFFFF"
								/>
								<Text style={styles.primaryButtonText}>
									Create Job & Escrow Funds ({formData.budget || "0"} XION)
								</Text>
							</>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.secondaryButton}
						onPress={handleSaveDraft}
					>
						<Ionicons
							name="bookmark-outline"
							size={20}
							color="#6B7280"
						/>
						<Text style={styles.secondaryButtonText}>Save as Draft</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	content: {
		flex: 1,
		padding: 20,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 20,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 3,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
		gap: 8,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
	inputGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 15,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderColor: "#D1D5DB",
		borderRadius: 12,
		padding: 14,
		fontSize: 16,
		backgroundColor: "#FAFAFA",
		color: "#111827",
	},
	textArea: {
		height: 100,
		textAlignVertical: "top",
	},
	skillsContainer: {
		gap: 12,
	},
	skillInputRow: {
		flexDirection: "row",
		gap: 10,
	},
	skillInput: {
		flex: 1,
	},
	addButton: {
		backgroundColor: "#111827",
		padding: 14,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},
	skillTags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	skillTag: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F3F4F6",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		gap: 6,
	},
	skillTagText: {
		fontSize: 14,
		color: "#374151",
		fontWeight: "500",
	},
	dateButton: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#D1D5DB",
		borderRadius: 12,
		padding: 14,
		backgroundColor: "#FAFAFA",
		gap: 10,
	},
	dateButtonText: {
		fontSize: 16,
		color: "#111827",
	},
	dateHint: {
		fontSize: 12,
		color: "#6B7280",
		marginLeft: "auto",
	},
	infoBox: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F0FDF4",
		padding: 12,
		borderRadius: 8,
		marginTop: 8,
		gap: 8,
	},
	infoText: {
		fontSize: 14,
		color: "#374151",
		flex: 1,
	},
	proofTypeContainer: {
		gap: 8,
	},
	proofTypeOption: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		borderWidth: 1,
		borderColor: "#D1D5DB",
		borderRadius: 12,
		backgroundColor: "#FAFAFA",
		gap: 12,
	},
	proofTypeSelected: {
		backgroundColor: "#111827",
		borderColor: "#111827",
	},
	proofTypeText: {
		fontSize: 15,
		color: "#374151",
		fontWeight: "500",
	},
	proofTypeTextSelected: {
		color: "#FFFFFF",
	},
	distributionOptions: {
		gap: 12,
	},
	distributionOption: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
	},
	distributionInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	distributionLabel: {
		fontSize: 15,
		color: "#374151",
		fontWeight: "500",
	},
	jobCodePreview: {
		marginTop: 16,
		padding: 16,
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	jobCodeLabel: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 8,
	},
	jobCodeContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	jobCode: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
		fontFamily: "monospace",
	},
	actionButtons: {
		gap: 12,
		marginBottom: 40,
	},
	primaryButton: {
		backgroundColor: "#111827",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 16,
		borderRadius: 16,
		gap: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	primaryButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "700",
	},
	secondaryButton: {
		backgroundColor: "#FFFFFF",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#D1D5DB",
		gap: 8,
	},
	secondaryButtonText: {
		color: "#6B7280",
		fontSize: 16,
		fontWeight: "600",
	},
});

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
	ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import { ContractService } from "../lib/contractService";
import Toast from "react-native-toast-message";

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

export default function CreateJobScreen() {
	const router = useRouter();
	const { data: account } = useAbstraxionAccount();
	const { client } = useAbstraxionSigningClient();

	const [creating, setCreating] = useState(false);
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

	const handleCreate = async () => {
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

		if (!account || !client) {
			Alert.alert("Error", "Please connect your wallet first");
			return;
		}

		setCreating(true);

		try {
			// Create contract service instance
			const contractService = new ContractService(account, client);

			// Convert budget to proper format (convert XION to uxion)
			const budgetAmount = parseFloat(formData.budget);
			const amountInUxion = Math.floor(budgetAmount * Math.pow(10, 6)); // Convert to uxion (6 decimals)

			// Create the job with optional deadline
			const deadline = formData.deadline
				? formData.deadline.toISOString()
				: undefined;

			const result = await contractService.postJob(
				`${formData.title}\n\n${formData.description}`, // Combine title and description
				amountInUxion,
				deadline
			);

			Toast.show({
				type: "success",
				text1: "Job Created!",
				text2: `Job posted successfully with ${formData.budget} XION in escrow`,
				position: "bottom",
			});

			// Navigate back to dashboard
			router.replace("/dashboard");
		} catch (error: any) {
			console.error("Failed to create job:", error);
			Toast.show({
				type: "error",
				text1: "Failed to Create Job",
				text2: error?.message || "Unknown error occurred",
				position: "bottom",
			});
		} finally {
			setCreating(false);
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
		parseFloat(formData.budget) > 0 &&
		account &&
		client;

	// Show wallet connection message if not connected
	if (!account || !client) {
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
				<View style={styles.centered}>
					<Ionicons
						name="wallet-outline"
						size={64}
						color="#D1D5DB"
					/>
					<Text style={styles.emptyTitle}>Connect Your Wallet</Text>
					<Text style={styles.emptySubtitle}>
						Please connect your wallet to create a job
					</Text>
					<TouchableOpacity
						style={styles.connectButton}
						onPress={() => router.replace("/dashboard")}
					>
						<Text style={styles.connectButtonText}>Go to Dashboard</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen
				options={{
					title: "Post New Job",
					headerShown: true,
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
						<TouchableOpacity
							onPress={() => router.replace("/(tabs)/dashboard")}
						>
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
	// Container - clean white background like onboarding
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
		paddingTop: 8,
	},

	// Cards - sophisticated design matching onboarding
	card: {
		backgroundColor: "#ffffff",
		borderRadius: 16,
		padding: 32,
		marginBottom: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.06,
		shadowRadius: 16,
		elevation: 4,
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 24,
		gap: 12,
	},
	cardTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: "#191919",
		letterSpacing: -0.3,
	},

	// Form Elements - spacious and clean
	inputGroup: {
		marginBottom: 24,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: "#191919",
		marginBottom: 12,
		letterSpacing: 0.1,
	},
	input: {
		borderWidth: 1,
		borderColor: "#e1e5e9",
		borderRadius: 12,
		padding: 20,
		fontSize: 16,
		backgroundColor: "#fafafa",
		color: "#191919",
		fontWeight: "400",
	},
	textArea: {
		height: 120,
		textAlignVertical: "top",
		lineHeight: 22,
	},

	// Skills Section - refined design
	skillsContainer: {
		gap: 16,
	},
	skillInputRow: {
		flexDirection: "row",
		gap: 12,
	},
	skillInput: {
		flex: 1,
	},
	addButton: {
		backgroundColor: "#191919",
		padding: 20,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#191919",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 2,
	},
	skillTags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	skillTag: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f8f9fa",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		gap: 8,
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},
	skillTagText: {
		fontSize: 14,
		color: "#191919",
		fontWeight: "500",
	},

	// Date Button - clean design
	dateButton: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#e1e5e9",
		borderRadius: 12,
		padding: 20,
		backgroundColor: "#fafafa",
		gap: 12,
	},
	dateButtonText: {
		fontSize: 16,
		color: "#191919",
		fontWeight: "400",
	},
	dateHint: {
		fontSize: 14,
		color: "#666",
		marginLeft: "auto",
	},

	// Info Boxes - sophisticated messaging
	infoBox: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f0fdf4",
		padding: 16,
		borderRadius: 12,
		marginTop: 12,
		gap: 12,
		borderWidth: 1,
		borderColor: "#dcfce7",
	},
	infoText: {
		fontSize: 14,
		color: "#166534",
		flex: 1,
		lineHeight: 20,
		fontWeight: "400",
	},
	// Proof Type Selection - sophisticated options
	proofTypeContainer: {
		gap: 12,
	},
	proofTypeOption: {
		flexDirection: "row",
		alignItems: "center",
		padding: 20,
		borderWidth: 1,
		borderColor: "#e1e5e9",
		borderRadius: 12,
		backgroundColor: "#fafafa",
		gap: 16,
		minHeight: 64,
	},
	proofTypeSelected: {
		backgroundColor: "#191919",
		borderColor: "#191919",
		shadowColor: "#191919",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 2,
	},
	proofTypeText: {
		fontSize: 16,
		color: "#191919",
		fontWeight: "500",
		letterSpacing: 0.1,
	},
	proofTypeTextSelected: {
		color: "#ffffff",
	},

	// Distribution Options - clean switches
	distributionOptions: {
		gap: 16,
	},
	distributionOption: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
	},
	distributionInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
	},
	distributionLabel: {
		fontSize: 16,
		color: "#191919",
		fontWeight: "500",
		letterSpacing: 0.1,
	},

	// Job Code Preview - professional display
	jobCodePreview: {
		marginTop: 20,
		padding: 20,
		backgroundColor: "#f8f9fa",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},
	jobCodeLabel: {
		fontSize: 14,
		color: "#666",
		marginBottom: 12,
		fontWeight: "500",
	},
	jobCodeContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	jobCode: {
		fontSize: 20,
		fontWeight: "700",
		color: "#191919",
		fontFamily: "monospace",
		letterSpacing: 1,
	},

	// Action Buttons - sophisticated design like onboarding
	actionButtons: {
		gap: 16,
		marginBottom: 48,
	},
	primaryButton: {
		backgroundColor: "#191919",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 20,
		paddingHorizontal: 32,
		borderRadius: 12,
		gap: 12,
		shadowColor: "#191919",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 6,
	},
	primaryButtonText: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "600",
		letterSpacing: 0.2,
	},
	secondaryButton: {
		backgroundColor: "#ffffff",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 20,
		paddingHorizontal: 32,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#e1e5e9",
		gap: 12,
	},
	secondaryButtonText: {
		color: "#666",
		fontSize: 18,
		fontWeight: "600",
		letterSpacing: 0.2,
	},

	// Empty States - matching onboarding sophistication
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 32,
	},
	emptyTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: "#191919",
		marginTop: 24,
		marginBottom: 12,
		textAlign: "center",
		letterSpacing: -0.3,
	},
	emptySubtitle: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
		marginBottom: 32,
		lineHeight: 22,
		fontWeight: "400",
	},
	connectButton: {
		backgroundColor: "#191919",
		borderRadius: 12,
		paddingVertical: 20,
		paddingHorizontal: 32,
		alignItems: "center",
		shadowColor: "#191919",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 6,
	},
	connectButtonText: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "600",
		letterSpacing: 0.2,
	},
});

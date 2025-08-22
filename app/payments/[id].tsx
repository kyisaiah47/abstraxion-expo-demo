import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Pressable,
	TextInput,
	Image,
	Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import {
	usePaymentDetail,
	useSocialOperations,
} from "@/hooks/useSocialContract";
import * as ImagePicker from "expo-image-picker";
import { DesignSystem } from "@/constants/DesignSystem";

export default function PaymentDetailScreen() {
	const { id } = useLocalSearchParams();
	const { data } = useAbstraxionAccount();
	const address = data?.bech32Address ?? "";
	const { payment, loading, error, refetch } = usePaymentDetail(id as string);
	const {
		submitProof,
		approvePayment,
		rejectPayment,
		loading: contractLoading,
		error: contractError,
	} = useSocialOperations(address);

	const [proofType, setProofType] = useState<string>("text");
	const [proofText, setProofText] = useState("");
	const [proofPhoto, setProofPhoto] = useState<string | null>(null);
	const [proofLoading, setProofLoading] = useState(false);
	const [proofError, setProofError] = useState<string | null>(null);

	const handlePhotoUpload = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
		});
		if (!result.canceled && result.assets.length > 0) {
			setProofPhoto(result.assets[0].uri);
		}
	};

	const handleSubmitProof = async () => {
		if (!payment) return;
		setProofLoading(true);
		setProofError(null);
		try {
			let proofData: any = { type: proofType };
			if (proofType === "text") proofData.data = proofText;
			if (proofType === "photo") proofData.data = proofPhoto;
			// zkTLS can be extended here
			await submitProof(address, payment.id, proofData);
			Alert.alert("Success", "Proof submitted!");
			refetch();
		} catch (e: any) {
			setProofError(e.message);
		} finally {
			setProofLoading(false);
		}
	};

	const handleApprove = async () => {
		if (!payment) return;
		try {
			await approvePayment(payment.id);
			Alert.alert("Payment Approved");
			refetch();
		} catch (e: any) {
			Alert.alert("Error", e.message);
		}
	};

	const handleReject = async () => {
		if (!payment) return;
		try {
			await rejectPayment(payment.id);
			Alert.alert("Payment Rejected");
			refetch();
		} catch (e: any) {
			Alert.alert("Error", e.message);
		}
	};

	// Helper to extract proof data from payment
	const getProofData = (payment: any) => {
		return (
			payment.proofSubmission ||
			payment.proof_submission ||
			payment.proof ||
			null
		);
	};

	if (loading)
		return (
			<ActivityIndicator
				style={{ marginTop: 48 }}
				size="large"
				color={DesignSystem.colors.primary[800]}
			/>
		);
	if (error)
		return (
			<Text style={{ color: DesignSystem.colors.status.error, margin: 24 }}>
				Error: {error}
			</Text>
		);
	if (!payment) return <Text style={{ margin: 24 }}>Payment not found.</Text>;

	return (
		<ScrollView style={styles.container}>
			<Text style={styles.title}>Payment Details</Text>
			<View style={styles.section}>
				<Text style={styles.label}>From:</Text>
				<Text style={styles.value}>{payment.from_username}</Text>
				<Text style={styles.label}>To:</Text>
				<Text style={styles.value}>{payment.to_username}</Text>
				<Text style={styles.label}>Amount:</Text>
				<Text style={styles.value}>{payment.amount}</Text>
				<Text style={styles.label}>Description:</Text>
				<Text style={styles.value}>{payment.description}</Text>
				<Text style={styles.label}>Status:</Text>
				<Text style={styles.value}>{payment.status}</Text>
			</View>
			<View style={styles.section}>
				<Text style={styles.label}>Proof Type:</Text>
				<View style={styles.proofTypeRow}>
					{["text", "photo", "zktls"].map((type) => (
						<Pressable
							key={type}
							style={[
								styles.proofTypeButton,
								proofType === type && styles.proofTypeSelected,
							]}
							onPress={() => setProofType(type)}
						>
							<Text style={styles.proofTypeText}>{type.toUpperCase()}</Text>
						</Pressable>
					))}
				</View>
				{proofType === "text" && (
					<TextInput
						style={styles.input}
						placeholder="Enter proof text..."
						value={proofText}
						onChangeText={setProofText}
						multiline
					/>
				)}
				{proofType === "photo" && (
					<View style={styles.photoSection}>
						<Pressable
							style={styles.photoButton}
							onPress={handlePhotoUpload}
						>
							<Text style={styles.photoButtonText}>
								{proofPhoto ? "Change Photo" : "Upload Photo"}
							</Text>
						</Pressable>
						{proofPhoto && (
							<Image
								source={{ uri: proofPhoto }}
								style={styles.photoPreview}
							/>
						)}
					</View>
				)}
				{/* zkTLS proof UI can be added here */}
				<Pressable
					style={styles.submitButton}
					onPress={handleSubmitProof}
					disabled={proofLoading || contractLoading}
				>
					<Text style={styles.submitButtonText}>
						{proofLoading ? "Submitting..." : "Submit Proof"}
					</Text>
				</Pressable>
				{(proofError || contractError) && (
					<Text style={styles.errorText}>{proofError || contractError}</Text>
				)}
			</View>
			<View style={styles.section}>
				<Text style={styles.label}>Submitted Proof:</Text>
				{(() => {
					const proof = getProofData(payment);
					return proof ? (
						<View style={styles.proofData}>
							<Text style={styles.value}>Type: {proof.type}</Text>
							<Text style={styles.value}>Content: {proof.content}</Text>
							<Text style={styles.value}>
								Submitted At:{" "}
								{proof.submittedAt ? proof.submittedAt.toString() : ""}
							</Text>
						</View>
					) : (
						<Text style={styles.value}>No proof submitted yet.</Text>
					);
				})()}
				<Text style={styles.label}>Proof Verification Status:</Text>
				<Text style={styles.value}>{payment.status}</Text>
			</View>
			<View style={styles.section}>
				<Text style={styles.label}>Actions:</Text>
				<View style={styles.actionRow}>
					<Pressable
						style={styles.approveButton}
						onPress={handleApprove}
					>
						<Text style={styles.actionText}>Approve</Text>
					</Pressable>
					<Pressable
						style={styles.rejectButton}
						onPress={handleReject}
					>
						<Text style={styles.actionText}>Reject</Text>
					</Pressable>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.primary,
		padding: 24,
	},
	title: {
		...DesignSystem.typography.h2,
		marginBottom: 24,
		color: DesignSystem.colors.text.primary,
	},
	section: {
		marginBottom: 32,
	},
	label: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.secondary,
		marginBottom: 4,
	},
	value: {
		...DesignSystem.typography.body.medium,
		color: DesignSystem.colors.text.primary,
		marginBottom: 8,
	},
	proofTypeRow: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 16,
	},
	proofTypeButton: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
	},
	proofTypeSelected: {
		backgroundColor: DesignSystem.colors.primary[100],
		borderColor: DesignSystem.colors.primary[800],
	},
	proofTypeText: {
		...DesignSystem.typography.label.medium,
		color: DesignSystem.colors.text.primary,
	},
	input: {
		minHeight: 80,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.secondary,
		borderRadius: 8,
		padding: 12,
		backgroundColor: DesignSystem.colors.surface.elevated,
		color: DesignSystem.colors.text.primary,
		marginBottom: 16,
	},
	photoSection: {
		alignItems: "center",
		marginBottom: 16,
	},
	photoButton: {
		padding: 12,
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: 8,
		marginBottom: 8,
	},
	photoButtonText: {
		color: DesignSystem.colors.text.inverse,
		...DesignSystem.typography.label.medium,
	},
	photoPreview: {
		width: 120,
		height: 120,
		borderRadius: 12,
		marginTop: 8,
	},
	submitButton: {
		padding: 16,
		backgroundColor: DesignSystem.colors.primary[800],
		borderRadius: 8,
		alignItems: "center",
		marginTop: 8,
	},
	submitButtonText: {
		color: DesignSystem.colors.text.inverse,
		...DesignSystem.typography.label.large,
	},
	errorText: {
		color: DesignSystem.colors.status.error,
		marginTop: 8,
	},
	proofData: {
		backgroundColor: DesignSystem.colors.surface.elevated,
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
	},
	actionRow: {
		flexDirection: "row",
		gap: 16,
		marginTop: 8,
	},
	approveButton: {
		flex: 1,
		backgroundColor: DesignSystem.colors.status.success,
		borderRadius: 8,
		alignItems: "center",
		padding: 12,
	},
	rejectButton: {
		flex: 1,
		backgroundColor: DesignSystem.colors.status.error,
		borderRadius: 8,
		alignItems: "center",
		padding: 12,
	},
	actionText: {
		color: DesignSystem.colors.text.inverse,
		...DesignSystem.typography.label.large,
	},
});

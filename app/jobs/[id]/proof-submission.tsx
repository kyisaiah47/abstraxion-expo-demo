import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

// Your jobs data (copy from JobDetailsScreen for now)
const jobs = {
	"1": {
		title: "Design landing page",
		clientName: "David Smith",
		description: "Create a modern, responsive landing page for Acme Inc.",
	},
	"2": {
		title: "Build mobile prototype",
		clientName: "Emily Zhao",
		description: "Develop a high-fidelity mobile UI for ZenFlow.",
	},
};

const proofEvents = [
	{ description: "Accessed figma.com", time: "10:22 AM" },
	{ description: "Deployed to vercel.com", time: "1:10 AM" },
	{ description: "Uploaded assets to figma.com", time: "9:00 AM" },
];

export default function ProofSubmissionScreen() {
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams();
	const job = jobs[id];
	const router = useRouter();

	const handleSubmit = () => {
		router.push(`/jobs/${id}/payment-received`);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<Stack.Screen options={{ title: "Proof of Work" }} />
			<View
				style={[
					styles.wrapper,
					{
						paddingBottom: insets.bottom + 16,
					},
				]}
			>
				{/* JOB HEADER */}
				{job && (
					<View style={styles.header}>
						<Text style={styles.jobTitle}>{job.title}</Text>
						<Text style={styles.jobClient}>for {job.clientName}</Text>
					</View>
				)}

				<View style={styles.centeredContent}>
					<View style={styles.card}>
						<Text style={styles.title}>Submit proof{"\n"}of work</Text>

						{proofEvents.map((item, idx) => (
							<View
								key={idx}
								style={styles.proofRow}
							>
								<Ionicons
									name="checkmark-circle"
									size={20}
									color="#10B981"
								/>
								<Text style={styles.proofText}>{item.description}</Text>
								<Text style={styles.proofTime}>{item.time}</Text>
							</View>
						))}
					</View>
				</View>
				<View style={styles.footer}>
					<TouchableOpacity
						style={styles.button}
						onPress={handleSubmit}
					>
						<Text style={styles.buttonText}>SUBMIT PROOF</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F4F4F5",
	},
	wrapper: {
		flex: 1,
		paddingHorizontal: 20,
		paddingBottom: 20,
		justifyContent: "space-between",
	},
	header: {
		alignItems: "center",
		marginBottom: 20,
	},
	jobTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#6366F1",
	},
	jobClient: {
		fontSize: 15,
		color: "#6B7280",
		marginTop: 2,
	},
	centeredContent: {
		flexGrow: 1,
		justifyContent: "center",
	},
	card: {
		backgroundColor: "#FFFFFF",
		padding: 20,
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 24,
		lineHeight: 30,
	},
	proofRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	proofText: {
		flex: 1,
		fontSize: 16,
		color: "#111827",
		marginLeft: 8,
	},
	proofTime: {
		fontSize: 14,
		color: "#6B7280",
		marginLeft: 8,
	},
	footer: {
		paddingTop: 12,
	},
	button: {
		backgroundColor: "#6366F1",
		paddingVertical: 16,
		borderRadius: 10,
		alignItems: "center",
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});

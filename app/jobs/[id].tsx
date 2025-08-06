import React from "react";
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	ScrollView,
	TouchableOpacity,
	Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SlideToUnlock from "react-native-slide-to-unlock";

const jobs = {
	"1": {
		title: "Design landing page",
		description: "Create a modern, responsive landing page for Acme Inc.",
		budget: "$400",
		due: "Aug 9",
		clientName: "David Smith",
		clientAvatar: "D",
		tags: ["Remote", "3 days", "Fixed-price"],
		amountUxiom: "400000",
		clientAddress: "xion1client...",
	},
	"2": {
		title: "Build mobile prototype",
		description: "Develop a high-fidelity mobile UI for ZenFlow.",
		budget: "$700",
		due: "Aug 11",
		clientName: "Emily Zhao",
		clientAvatar: "E",
		tags: ["Mobile", "5 days", "Milestone"],
		amountUxiom: "700000",
		clientAddress: "xion1client...",
	},
};

export default function JobDetailsScreen() {
	const { id } = useLocalSearchParams();
	const insets = useSafeAreaInsets();
	const job = jobs[id as keyof typeof jobs];
	const router = useRouter();

	// Replace this with your wallet/contract logic

	const handleAcceptTask = () => {
		// Pass job ID to proof submission page
		router.push({
			pathname: "/proof-submission",
			params: { id }, // Passing the current job ID as a route param
		});
	};

	if (!job) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<Stack.Screen options={{ title: "Job Not Found" }} />
				<View style={styles.centerEmpty}>
					<Text style={{ color: "#6B7280" }}>Job not found.</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
			<Stack.Screen options={{ title: "Job Details" }} />
			<View style={styles.flex1}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					bounces={false}
				>
					<View style={styles.header}>
						<Text
							numberOfLines={2}
							style={styles.title}
						>
							{job.title}
						</Text>
						<View style={styles.tagsRow}>
							{job.tags.map((tag) => (
								<View
									key={tag}
									style={styles.chip}
								>
									<Text style={styles.chipText}>{tag}</Text>
								</View>
							))}
						</View>
						<Text style={styles.desc}>{job.description}</Text>
					</View>
					<View style={styles.infoCard}>
						<View style={styles.payoutDueRow}>
							<View>
								<Text style={styles.infoLabel}>Payout</Text>
								<Text style={styles.payout}>{job.budget}</Text>
							</View>
							<View style={{ alignItems: "flex-end" }}>
								<Text style={styles.infoLabel}>Due</Text>
								<Text style={styles.due}>{job.due}</Text>
							</View>
						</View>
						<View style={styles.clientRow}>
							<View style={styles.avatar}>
								<Text style={styles.avatarText}>{job.clientAvatar}</Text>
							</View>
							<Text style={styles.clientName}>{job.clientName}</Text>
						</View>
					</View>
				</ScrollView>
				{/* <View style={styles.slideToUnlock}>
					<SlideToUnlock
						containerStyle={styles.slider}
						thumbStyle={styles.sliderThumb}
						text="Slide to accept task"
						textStyle={styles.sliderText}
						animationType="spring"
						ThumbIconComponent={() => (
							<View style={styles.thumbIcon}>
								<Text style={styles.thumbIconText}>→</Text>
							</View>
						)}
						onUnlock={handleAcceptTask}
					/>
				</View> */}
				<View
					style={[
						styles.footer,
						{
							paddingBottom: insets.bottom + (Platform.OS === "ios" ? 12 : 20),
							backgroundColor: "#F4F4F5",
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 0,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: -3 },
							shadowOpacity: 0.06,
							shadowRadius: 8,
							elevation: 10,
						},
					]}
				>
					<TouchableOpacity
						style={styles.button}
						onPress={handleAcceptTask}
						activeOpacity={0.85}
					>
						<Text style={styles.buttonText}>ACCEPT TASK</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#F4F4F5" },
	flex1: { flex: 1 },
	scrollContent: {
		padding: 24,
		paddingBottom: 36,
	},
	header: {
		marginBottom: 14,
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		color: "#1E293B",
		marginBottom: 6,
	},
	tagsRow: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 10,
		flexWrap: "wrap",
	},
	chip: {
		backgroundColor: "#E0E7FF",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
		marginRight: 5,
		marginBottom: 4,
	},
	chipText: {
		fontSize: 12,
		color: "#4338CA",
		fontWeight: "500",
	},
	desc: {
		fontSize: 15,
		color: "#64748B",
		marginBottom: 14,
	},
	infoCard: {
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
		marginBottom: 12,
	},
	payoutDueRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 18,
	},
	infoLabel: {
		fontSize: 13,
		color: "#A1A1AA",
		marginBottom: 2,
	},
	payout: {
		fontSize: 18,
		fontWeight: "700",
		color: "#22c55e",
	},
	due: {
		fontSize: 16,
		fontWeight: "600",
		color: "#6366F1",
	},
	clientRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#EDE9FE",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	avatarText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#7C3AED",
	},
	clientName: {
		fontSize: 16,
		color: "#0F172A",
	},
	slideToUnlock: {
		padding: 16,
		paddingBottom: 0,
	},
	slider: {
		backgroundColor: "#EEF2FF",
		borderRadius: 100,
		width: "100%",
		height: 54,
		justifyContent: "center",
	},
	sliderThumb: {
		backgroundColor: "#6366F1",
		borderRadius: 100,
		width: 54,
		height: 54,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.12,
		shadowRadius: 8,
	},
	sliderText: {
		position: "absolute",
		left: 0,
		right: 0,
		textAlign: "center",
		color: "#6366F1",
		fontWeight: "700",
		fontSize: 15.5,
		letterSpacing: 0.2,
	},
	footer: {
		paddingTop: 10,
		paddingHorizontal: 20,
		// Remove old paddingBottom, it's now in the component inline
	},
	button: {
		backgroundColor: "#6366F1",
		paddingVertical: 16,
		borderRadius: 10,
		alignItems: "center",
		width: "100%",
		shadowColor: "#4F46E5",
		shadowOpacity: 0.18,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 8,
		elevation: 4,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 17,
		fontWeight: "700",
		letterSpacing: 0.2,
	},
	thumbIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 3,
	},
	thumbIconText: {
		fontSize: 21,
		color: "#6366F1",
		fontWeight: "bold",
	},
	centerEmpty: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});

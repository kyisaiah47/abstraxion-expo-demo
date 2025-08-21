import React from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { styles } from "@/app/dashboard.styles";
import { ContractService, type Job } from "../lib/contractService";

export type MetricsRowProps = {
	loadingJobs: boolean;
	jobs: Job[];
	totalEarnings: number;
	userAddress?: string;
};

export default function MetricsRow({
	loadingJobs,
	jobs,
	totalEarnings,
	userAddress,
}: MetricsRowProps) {
	const router = useRouter();

	// Calculate open jobs count
	const openJobsCount = loadingJobs
		? 0
		: jobs.filter((job) => job.status === "Open").length;

	// Format earnings display
	const earningsDisplay = loadingJobs
		? "Loading..."
		: ContractService.formatXionAmount(totalEarnings);

	const handleJobsOpenPress = () => {
		router.push("/marketplace" as any);
	};

	return (
		<View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
			<View style={[styles.balanceCard, { flex: 1 }]}>
				<Text style={styles.balanceLabel}>Total Earned</Text>
				<Text style={styles.balanceValue}>
					{loadingJobs ? <ActivityIndicator size="small" /> : earningsDisplay}
				</Text>
			</View>
			<TouchableOpacity
				style={[styles.balanceCard, { flex: 1 }]}
				onPress={handleJobsOpenPress}
				activeOpacity={0.7}
			>
				<Text style={styles.balanceLabel}>Jobs Open</Text>
				<Text style={styles.balanceValue}>
					{loadingJobs ? <ActivityIndicator size="small" /> : openJobsCount}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

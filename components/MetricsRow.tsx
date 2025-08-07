import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { styles } from "@/app/recent-activity.styles";

export type MetricsRowProps = {
	loadingJobs: boolean;
	jobs: any[];
};

export default function MetricsRow({ loadingJobs, jobs }: MetricsRowProps) {
	return (
		<View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
			<View style={[styles.balanceCard, { flex: 1 }]}>
				<Text style={styles.balanceLabel}>Total Earned</Text>
				<Text style={styles.balanceValue}>$1,200</Text>
			</View>
			<View style={[styles.balanceCard, { flex: 1 }]}>
				<Text style={styles.balanceLabel}>Jobs Open</Text>
				<Text style={styles.balanceValue}>
					{loadingJobs ? (
						<ActivityIndicator size="small" />
					) : (
						jobs.filter((j: any) => !j.accepted).length
					)}
				</Text>
			</View>
		</View>
	);
}

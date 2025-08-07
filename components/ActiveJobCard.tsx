import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "@/app/dashboard.styles";

export type ActiveJobCardProps = {
	activeJob: any;
	modalRef: React.RefObject<any>;
	truncateAddress: (address: string | undefined | null) => string;
};

export default function ActiveJobCard({
	activeJob,
	modalRef,
	truncateAddress,
}: ActiveJobCardProps) {
	if (!activeJob) return <Text>No open jobs right now.</Text>;
	return (
		<View style={styles.activeJobCard}>
			<View style={styles.activeJobText}>
				<Text style={styles.activeJobTitle}>{activeJob.description}</Text>
				<Text style={styles.activeJobClient}>
					{truncateAddress(activeJob.client)}
				</Text>
				{activeJob.worker && (
					<Text style={styles.activeJobClient}>
						Worker: {truncateAddress(activeJob.worker)}
					</Text>
				)}
				{activeJob.proof && (
					<Text style={styles.activeJobClient}>Proof: {activeJob.proof}</Text>
				)}
			</View>
			<TouchableOpacity
				style={styles.resumeButton}
				onPress={() => modalRef.current?.open()}
			>
				<Text style={styles.resumeButtonText}>Submit</Text>
			</TouchableOpacity>
		</View>
	);
}

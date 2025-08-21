import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "@/app/dashboard.styles";
import { type Job, ContractService } from "../lib/contractService";
import { JobStatus } from "../constants/contracts";

export type ActiveJobCardProps = {
	activeJob: Job | null;
	modalRef: React.RefObject<any>;
	truncateAddress: (address: string | undefined | null) => string;
	userAddress?: string;
};

export default function ActiveJobCard({
	activeJob,
	modalRef,
	truncateAddress,
	userAddress,
}: ActiveJobCardProps) {
	if (!activeJob) {
		return (
			<View
				style={[
					styles.activeJobCard,
					{ justifyContent: "center", alignItems: "center" },
				]}
			>
				<Text style={{ color: "#666", fontSize: 16 }}>
					No active jobs right now.
				</Text>
				<Text style={{ color: "#999", fontSize: 14, marginTop: 4 }}>
					Accept a job to get started!
				</Text>
			</View>
		);
	}

	// Determine button text and action based on job status and user role
	const getButtonInfo = () => {
		if (!userAddress) return { text: "Connect Wallet", disabled: true };

		if (activeJob.worker === userAddress) {
			switch (activeJob.status) {
				case JobStatus.ACCEPTED:
					return { text: "Submit Proof", disabled: false };
				case JobStatus.PROOF_SUBMITTED:
					return { text: "Proof Submitted", disabled: true };
				default:
					return { text: "View Job", disabled: false };
			}
		} else if (activeJob.client === userAddress) {
			switch (activeJob.status) {
				case JobStatus.PROOF_SUBMITTED:
					return { text: "Review Proof", disabled: false };
				default:
					return { text: "View Job", disabled: false };
			}
		}

		return { text: "View Job", disabled: false };
	};

	const buttonInfo = getButtonInfo();
	const paymentAmount = ContractService.formatXionAmount(
		parseInt(activeJob.escrow_amount.amount)
	);

	return (
		<View style={styles.activeJobCard}>
			<View style={styles.activeJobText}>
				<Text style={styles.activeJobTitle}>{activeJob.description}</Text>
				<Text style={styles.activeJobClient}>
					Client: {truncateAddress(activeJob.client)}
				</Text>
				{activeJob.worker && (
					<Text style={styles.activeJobClient}>
						Worker: {truncateAddress(activeJob.worker)}
					</Text>
				)}
				<Text style={styles.activeJobClient}>Payment: {paymentAmount}</Text>
				<Text style={styles.activeJobClient}>Status: {activeJob.status}</Text>
				{activeJob.proof && (
					<Text
						style={styles.activeJobClient}
						numberOfLines={2}
					>
						Proof: {activeJob.proof}
					</Text>
				)}
			</View>
			<TouchableOpacity
				style={[
					styles.resumeButton,
					buttonInfo.disabled && { backgroundColor: "#ccc" },
				]}
				onPress={() => !buttonInfo.disabled && modalRef.current?.open()}
				disabled={buttonInfo.disabled}
			>
				<Text style={styles.resumeButtonText}>{buttonInfo.text}</Text>
			</TouchableOpacity>
		</View>
	);
}

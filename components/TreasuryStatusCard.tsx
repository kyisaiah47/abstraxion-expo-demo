import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ContractService } from "../lib/contractService";
import { TREASURY_CONFIG } from "../constants/contracts";

interface TreasuryStatusProps {
	contractService: ContractService | null;
	onPress?: () => void;
}

interface TreasuryStatus {
	isAvailable: boolean;
	balance: number;
	canSponsorGas: boolean;
	estimatedTransactionsLeft: number;
	lastChecked: Date;
}

export function TreasuryStatusCard({
	contractService,
	onPress,
}: TreasuryStatusProps) {
	const [status, setStatus] = useState<TreasuryStatus>({
		isAvailable: false,
		balance: 0,
		canSponsorGas: false,
		estimatedTransactionsLeft: 0,
		lastChecked: new Date(),
	});
	const [loading, setLoading] = useState(true);

	const loadTreasuryStatus = useCallback(async () => {
		try {
			setLoading(true);
			if (contractService) {
				const treasuryStatus = await contractService.getTreasuryStatus();
				setStatus(treasuryStatus);
			}
		} catch (error) {
			console.error("Failed to load Treasury status:", error);
		} finally {
			setLoading(false);
		}
	}, [contractService]);

	useEffect(() => {
		if (contractService && TREASURY_CONFIG.enabled) {
			loadTreasuryStatus();
		} else {
			setLoading(false);
		}
	}, [contractService, loadTreasuryStatus]);

	const getStatusColor = () => {
		if (!status.isAvailable) return "#EF4444"; // Red
		if (!status.canSponsorGas) return "#F59E0B"; // Orange
		return "#22C55E"; // Green
	};

	const getStatusText = () => {
		if (loading) return "Checking Treasury...";
		if (!TREASURY_CONFIG.enabled) return "Treasury Disabled";
		if (!status.isAvailable) return "Treasury Unavailable";
		if (!status.canSponsorGas) return "Treasury Low Funds";
		return "Treasury Active";
	};

	const getSubtext = () => {
		if (loading || !TREASURY_CONFIG.enabled || !status.isAvailable) return "";
		if (status.canSponsorGas) {
			return `${status.estimatedTransactionsLeft} gasless transactions available`;
		}
		return `${status.balance.toFixed(2)} XION remaining`;
	};

	if (!TREASURY_CONFIG.enabled) {
		return null; // Don't show Treasury status if disabled
	}

	const Component = onPress ? TouchableOpacity : View;

	return (
		<Component
			style={styles.container}
			onPress={onPress}
		>
			<View style={styles.header}>
				<View style={styles.titleRow}>
					<View
						style={[styles.indicator, { backgroundColor: getStatusColor() }]}
					/>
					<Text style={styles.title}>Gas Sponsorship</Text>
				</View>
				{status.canSponsorGas && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>FREE</Text>
					</View>
				)}
			</View>

			<Text style={styles.status}>{getStatusText()}</Text>

			{getSubtext() && <Text style={styles.subtext}>{getSubtext()}</Text>}

			{status.isAvailable && (
				<Text style={styles.balance}>
					Treasury Balance: {status.balance.toFixed(2)} XION
				</Text>
			)}
		</Component>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	indicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 8,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	badge: {
		backgroundColor: "#22C55E",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 8,
	},
	badgeText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#fff",
		letterSpacing: 0.5,
	},
	status: {
		fontSize: 14,
		color: "#374151",
		marginBottom: 4,
	},
	subtext: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 4,
	},
	balance: {
		fontSize: 12,
		color: "#9CA3AF",
		fontStyle: "italic",
	},
});

export default TreasuryStatusCard;

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TREASURY_CONFIG } from "../constants/contracts";

interface SimpleTreasuryStatusProps {
	treasuryEnabled: boolean;
	onPress?: () => void;
}

/**
 * Simplified Treasury Status Card that avoids infinite loops
 * Shows basic Treasury availability without complex state queries
 */
export function SimpleTreasuryStatusCard({
	treasuryEnabled,
	onPress,
}: SimpleTreasuryStatusProps) {
	const [lastChecked, setLastChecked] = useState(new Date());

	const refreshStatus = useCallback(() => {
		setLastChecked(new Date());
	}, []);

	// Only update timestamp every 30 seconds to avoid frequent re-renders
	useEffect(() => {
		const interval = setInterval(refreshStatus, 30000);
		return () => clearInterval(interval);
	}, [refreshStatus]);

	if (!TREASURY_CONFIG.enabled) {
		return null; // Don't show if Treasury is disabled
	}

	const getStatusColor = () => {
		return treasuryEnabled && TREASURY_CONFIG.address ? "#22C55E" : "#F59E0B";
	};

	const getStatusText = () => {
		if (!TREASURY_CONFIG.address) return "Treasury Not Configured";
		if (!treasuryEnabled) return "Treasury Disabled";
		return "Treasury Available";
	};

	const getSubText = () => {
		if (!TREASURY_CONFIG.address) return "Configure Treasury contract address";
		if (!treasuryEnabled) return "Treasury integration disabled";
		return "Gasless transactions enabled";
	};

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={onPress}
		>
			<View style={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>⚡ Gas Sponsorship</Text>
					<View
						style={[styles.indicator, { backgroundColor: getStatusColor() }]}
					/>
				</View>

				<Text style={styles.statusText}>{getStatusText()}</Text>
				<Text style={styles.subText}>{getSubText()}</Text>

				<Text style={styles.timestamp}>
					Last checked: {lastChecked.toLocaleTimeString()}
				</Text>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#fff",
		borderRadius: 12,
		marginHorizontal: 20,
		marginVertical: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	content: {
		padding: 16,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	indicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	statusText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#374151",
		marginBottom: 4,
	},
	subText: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 8,
	},
	timestamp: {
		fontSize: 10,
		color: "#9CA3AF",
		fontStyle: "italic",
	},
});

export default SimpleTreasuryStatusCard;

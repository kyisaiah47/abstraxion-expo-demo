import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PersistentHeaderProps {
	address?: string;
	onCopy?: () => void;
	onLogout?: () => void;
}

function truncateAddress(address?: string) {
	if (!address) return "";
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function PersistentHeader({
	address,
	onCopy,
	onLogout,
}: PersistentHeaderProps) {
	return (
		<View style={styles.header}>
			<View style={styles.headerLeft}>
				<Image
					source={require("../assets/images/icon-sm.png")}
					style={{ width: 32, height: 32, borderRadius: 8 }}
				/>
				{/* <Text style={styles.headerTitle}>Proof of Work</Text> */}
			</View>
			<View style={styles.headerRight}>
				<TouchableOpacity
					style={styles.walletButton}
					onPress={onCopy}
				>
					<Ionicons
						name="wallet-outline"
						size={16}
						color="#666"
					/>
					<Text style={styles.walletText}>{truncateAddress(address)}</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.notificationButton}
					onPress={onLogout}
				>
					<Ionicons
						name="log-out-outline"
						size={20}
						color="#666"
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
		backgroundColor: "#fff",
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	headerRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	walletButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f8f9fa",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		gap: 6,
	},
	walletText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#666",
	},
	notificationButton: {
		padding: 8,
	},
});

import React from "react";
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import PersistentHeader from "../../components/PersistentHeader";

export default function ProfileScreen() {
	const router = useRouter();
	const { data, logout } = useAbstraxionAccount();

	const handleLogout = async () => {
		await logout();
		router.replace("/");
	};

	const truncateAddress = (address: string | undefined | null): string => {
		if (!address) return "";
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* Persistent Header */}
			<PersistentHeader
				address={data?.bech32Address}
				onLogout={handleLogout}
			/>

			<View style={styles.content}>
				{/* Profile Info */}
				<View style={styles.card}>
					<View style={styles.profileSection}>
						<View style={styles.avatar}>
							<Ionicons
								name="person"
								size={40}
								color="#666"
							/>
						</View>
						<View style={styles.profileInfo}>
							<Text style={styles.addressText}>
								{truncateAddress(data?.bech32Address)}
							</Text>
							<Text style={styles.statusText}>Connected Wallet</Text>
						</View>
					</View>
				</View>

				{/* Menu Items */}
				<View style={styles.card}>
					<TouchableOpacity
						style={styles.menuItem}
						onPress={() => router.push("/zktls-demo")}
					>
						<Ionicons
							name="shield-checkmark-outline"
							size={20}
							color="#666"
						/>
						<Text style={styles.menuText}>zkTLS Demo</Text>
						<Ionicons
							name="chevron-forward"
							size={16}
							color="#999"
						/>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.menuItem}
						onPress={() => router.push("/treasury-management")}
					>
						<Ionicons
							name="wallet-outline"
							size={20}
							color="#666"
						/>
						<Text style={styles.menuText}>Treasury Management</Text>
						<Ionicons
							name="chevron-forward"
							size={16}
							color="#999"
						/>
					</TouchableOpacity>
				</View>

				{/* Logout */}
				<View style={styles.card}>
					<TouchableOpacity
						style={styles.logoutItem}
						onPress={handleLogout}
					>
						<Ionicons
							name="log-out-outline"
							size={20}
							color="#DC2626"
						/>
						<Text style={styles.logoutText}>Logout</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
		backgroundColor: "#fff",
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: "#191919",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOpacity: 0.03,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},
	profileSection: {
		flexDirection: "row",
		alignItems: "center",
		padding: 20,
		gap: 16,
	},
	avatar: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#f8f9fa",
		alignItems: "center",
		justifyContent: "center",
	},
	profileInfo: {
		flex: 1,
	},
	addressText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#191919",
		marginBottom: 4,
	},
	statusText: {
		fontSize: 14,
		color: "#666",
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
		gap: 12,
	},
	menuText: {
		flex: 1,
		fontSize: 16,
		color: "#191919",
		fontWeight: "500",
	},
	logoutItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 20,
		gap: 12,
	},
	logoutText: {
		fontSize: 16,
		color: "#DC2626",
		fontWeight: "500",
	},
});

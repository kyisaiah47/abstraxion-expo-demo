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
	// Container - matching onboarding clean white background
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},

	// Content - generous padding like onboarding
	content: {
		flex: 1,
		paddingHorizontal: 32,
		paddingTop: 24,
	},

	// Cards - sophisticated design matching onboarding
	card: {
		backgroundColor: "#ffffff",
		borderRadius: 16,
		marginBottom: 24,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},

	// Profile Section - spacious and clean
	profileSection: {
		flexDirection: "row",
		alignItems: "center",
		padding: 32,
		gap: 20,
	},
	avatar: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: "#f8f9fa",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#f0f0f0",
	},
	profileInfo: {
		flex: 1,
		gap: 4,
	},
	addressText: {
		fontSize: 20,
		fontWeight: "700",
		color: "#191919",
		letterSpacing: -0.2,
	},
	statusText: {
		fontSize: 16,
		color: "#666",
		fontWeight: "400",
	},

	// Menu Items - generous spacing and clean design
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 20,
		paddingHorizontal: 32,
		borderBottomWidth: 1,
		borderBottomColor: "#f8f9fa",
		gap: 16,
		minHeight: 64,
	},
	menuText: {
		flex: 1,
		fontSize: 18,
		color: "#191919",
		fontWeight: "500",
		letterSpacing: 0.1,
	},

	// Logout - distinct styling
	logoutItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 20,
		paddingHorizontal: 32,
		gap: 16,
		minHeight: 64,
	},
	logoutText: {
		fontSize: 18,
		color: "#DC2626",
		fontWeight: "500",
		letterSpacing: 0.1,
	},
});

import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import SimpleTreasuryStatusCard from "../components/SimpleTreasuryStatusCard";
import { TREASURY_CONFIG } from "../constants/contracts";

export default function TreasuryManagementScreen() {
	const router = useRouter();

	if (!TREASURY_CONFIG.enabled) {
		return (
			<SafeAreaView style={styles.container}>
				<Stack.Screen
					options={{
						title: "Treasury Status",
						headerTitleAlign: "center",
					}}
				/>
				<View style={styles.centered}>
					<Text style={styles.disabledTitle}>Treasury Disabled</Text>
					<Text style={styles.disabledText}>
						Treasury contract is not configured in this environment.
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen
				options={{
					title: "Treasury Status",
					headerTitleAlign: "center",
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: "#F4F4F5",
					},
					headerTitleStyle: {
						fontSize: 18,
						fontWeight: "600",
						color: "#111827",
					},
				}}
			/>

			<ScrollView style={styles.content}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Text style={styles.backButtonText}>← Back to Dashboard</Text>
				</TouchableOpacity>

				{/* Treasury Status Card */}
				<View style={styles.treasuryCardWrapper}>
					<SimpleTreasuryStatusCard treasuryEnabled={TREASURY_CONFIG.enabled} />
				</View>

				{/* Treasury Information */}
				<View style={styles.infoCard}>
					<Text style={styles.infoTitle}>What is the Treasury?</Text>
					<Text style={styles.infoText}>
						The Treasury sponsors gasless transactions for all users, making the
						platform more accessible. When users accept jobs, submit proofs, or
						perform other blockchain actions, the Treasury automatically pays
						the gas fees so users don't have to worry about transaction costs.
					</Text>
					<Text style={styles.infoText}>
						This creates a seamless, Web2-like experience while maintaining all
						the benefits of blockchain technology.
					</Text>
				</View>

				{/* Treasury Details */}
				<View style={styles.infoCard}>
					<Text style={styles.infoTitle}>Treasury Details</Text>
					<Text style={styles.infoText}>
						Contract Address: {TREASURY_CONFIG.address}
					</Text>
					<Text style={styles.infoText}>Network: XION Mainnet</Text>
					<Text style={styles.infoText}>
						Purpose: Gasless transaction sponsorship
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F4F4F5",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 8,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	backButton: {
		paddingHorizontal: 0,
		paddingVertical: 8,
		marginBottom: 16,
		alignSelf: "flex-start",
	},
	backButtonText: {
		fontSize: 16,
		color: "#111827",
		fontWeight: "500",
	},
	disabledTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#111827",
		marginBottom: 8,
	},
	disabledText: {
		fontSize: 16,
		color: "#6B7280",
		textAlign: "center",
	},
	infoCard: {
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		color: "#6B7280",
		lineHeight: 20,
		marginBottom: 8,
	},
	treasuryCardWrapper: {
		marginHorizontal: -20, // Counteract the card's built-in margin
		marginBottom: 20,
	},
});

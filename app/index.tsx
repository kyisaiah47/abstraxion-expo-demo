import React, { useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
	const { login, isConnected, isConnecting } = useAbstraxionAccount();
	const router = useRouter();

	useEffect(() => {
		if (isConnected) {
			router.replace("/recent-activity");
		}
	}, [isConnected, router]);

	if (isConnected) {
		// Optionally show a loader or nothing
		return null;
	}

	return (
		<View style={styles.container}>
			{/* Top logo */}
			{/* <View style={styles.logoRow}>
				<View style={styles.logoCircle}>
					<Image
						source={{
							uri: "https://hvnbpd9agmcawbt2.public.blob.vercel-storage.com/proof-of-work-logo",
						}}
						style={styles.logo}
						resizeMode="contain"
					/>
				</View>
			</View> */}

			{/* Main content vertically centered */}
			<View style={styles.centerContent}>
				<Text style={styles.headline}>
					Verifiable work.{" "}
					<Text style={{ fontWeight: "400" }}>Trustless payments.</Text>
				</Text>
				<Text style={styles.subtext}>
					Submit your work, get paid instantly and securely. Powered by XION.
				</Text>
			</View>

			{/* Bottom area */}
			<View style={styles.bottom}>
				<TouchableOpacity
					onPress={login}
					style={[styles.connectButton, isConnecting && styles.disabledButton]}
					disabled={isConnecting}
					activeOpacity={0.92}
				>
					{isConnecting ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.connectText}>Connect Wallet</Text>
					)}
				</TouchableOpacity>
				<Text style={styles.footer}>Powered by XION • Burnt</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		paddingHorizontal: 32,
		paddingTop: 56,
		paddingBottom: 0, // Let bottom be fully pinned
		justifyContent: "space-between", // Main trick!
	},
	logoRow: {
		marginBottom: 0,
		marginTop: 8,
	},
	logoCircle: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: "#6366F1",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#6366F1",
		shadowOpacity: 0.1,
		shadowRadius: 14,
		shadowOffset: { width: 0, height: 3 },
		elevation: 6,
	},
	logo: {
		width: 70,
		height: 70,
	},
	centerContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "flex-start", // keep text left-aligned
		marginTop: 8,
		marginBottom: 8,
	},
	headline: {
		fontSize: 36, // try 40 for more drama
		fontWeight: "700",
		color: "#191919",
		textAlign: "left",
		marginBottom: 12,
		lineHeight: 42,
	},
	subtext: {
		fontSize: 16,
		color: "#555",
		marginBottom: 0,
		textAlign: "left",
		fontWeight: "400",
		lineHeight: 22,
	},
	bottom: {
		width: "100%",
		paddingBottom: 38,
	},
	connectButton: {
		backgroundColor: "#191919",
		paddingVertical: 17,
		borderRadius: 16,
		alignItems: "center",
		width: "100%",
		marginBottom: 12,
	},
	connectText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
		letterSpacing: 0.2,
	},
	disabledButton: {
		backgroundColor: "#888",
		opacity: 0.7,
	},
	footer: {
		fontSize: 15,
		color: "#BBB",
		textAlign: "left",
		marginTop: 0,
	},
});

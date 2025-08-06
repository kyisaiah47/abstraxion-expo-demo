import React from "react";
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

	if (isConnected) {
		router.replace("/recent-activity");
		return null;
	}

	return (
		<View style={styles.container}>
			<View style={styles.centerColumn}>
				<View style={styles.logoWrapper}>
					<View style={styles.logoGlow} />
					<Image
						source={{
							uri: "https://hvnbpd9agmcawbt2.public.blob.vercel-storage.com/proof-of-work-logo",
						}}
						style={styles.logo}
						resizeMode="contain"
					/>
				</View>
				<Text style={styles.headline}>Proof of Work</Text>
				<Text style={styles.tagline}>Verifiable Work. Trustless Payments.</Text>
				<TouchableOpacity
					onPress={login}
					style={[styles.connectButton, isConnecting && styles.disabledButton]}
					disabled={isConnecting}
					activeOpacity={0.9}
				>
					{isConnecting ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.connectText}>Connect Wallet</Text>
					)}
				</TouchableOpacity>
			</View>
			<Text style={styles.footer}>Powered by XION • Burnt</Text>
		</View>
	);
}

const CIRCLE_SIZE = 92;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		justifyContent: "space-between",
	},
	centerColumn: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	logoWrapper: {
		width: CIRCLE_SIZE,
		height: CIRCLE_SIZE,
		borderRadius: CIRCLE_SIZE / 2,
		backgroundColor: "#6675FF",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 32,
		overflow: "visible",
		// iOS only
		shadowColor: "#6675FF",
		shadowOpacity: 0.18,
		shadowRadius: 30,
		shadowOffset: { width: 0, height: 7 },
		// Android
		elevation: 12,
		position: "relative",
	},
	logoGlow: {
		position: "absolute",
		top: -20,
		left: -20,
		right: -20,
		bottom: -20,
		borderRadius: CIRCLE_SIZE,
		backgroundColor: "#6675FF30", // transparent blue glow
		opacity: 0.6,
		zIndex: 0,
	},
	logo: {
		width: 50,
		height: 50,
		zIndex: 1,
	},
	headline: {
		fontSize: 34,
		fontWeight: "800",
		color: "#191919",
		textAlign: "center",
		marginBottom: 8,
		letterSpacing: -1,
	},
	tagline: {
		fontSize: 16,
		color: "#444",
		textAlign: "center",
		marginBottom: 36,
		marginTop: 0,
		lineHeight: 22,
		fontWeight: "400",
	},
	connectButton: {
		width: "100%",
		backgroundColor: "#191919",
		borderRadius: 16,
		paddingVertical: 17,
		alignItems: "center",
		marginBottom: 0,
	},
	connectText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "700",
		letterSpacing: 0.5,
	},
	disabledButton: {
		backgroundColor: "#888",
		opacity: 0.7,
	},
	footer: {
		fontSize: 14,
		color: "#BBB",
		textAlign: "center",
		marginBottom: 38,
		marginTop: 12,
	},
});

import { useEffect } from "react";
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
			router.replace("/dashboard");
		}
	}, [isConnected, router]);

	if (isConnected) {
		return null;
	}

	return (
		<View style={styles.container}>
			{/* Centered Content */}
			<View style={styles.centerContent}>
				<View style={styles.logoShadowWrapper}>
					<Image
						source={{
							uri: "https://hvnbpd9agmcawbt2.public.blob.vercel-storage.com/Grow.png",
						}}
						style={styles.logo}
						resizeMode="contain"
						accessibilityRole="image"
						accessibilityLabel="Proof of Work logo"
					/>
				</View>
				<Text
					style={styles.headline}
					accessibilityRole="header"
				>
					Verifiable work.
					{"\n"}
					<Text style={styles.subheadline}>Trustless payments.</Text>
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
					accessibilityRole="button"
					accessibilityLabel="Connect Wallet"
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
		backgroundColor: "#f8f9fb", // Subtle off-white background
		paddingHorizontal: 32,
		paddingTop: 56,
		paddingBottom: 0,
		justifyContent: "space-between",
	},
	logoShadowWrapper: {
		shadowColor: "#191919",
		shadowOpacity: 0.12,
		shadowRadius: 24,
		shadowOffset: { width: 0, height: 6 },
		elevation: 10,
		alignSelf: "flex-start",
		marginBottom: 38,
		marginTop: 0,
		borderRadius: 50,
		backgroundColor: "#fff",
	},
	logo: {
		width: 90,
		height: 90,
		borderRadius: 45,
		backgroundColor: "#fff",
	},
	centerContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "flex-start",
		marginTop: 8,
		marginBottom: 8,
	},
	headline: {
		fontSize: 40,
		fontWeight: "700",
		color: "#191919",
		textAlign: "left",
		marginBottom: 10,
		lineHeight: 44,
		letterSpacing: 0.1,
	},
	subheadline: {
		fontWeight: "400",
		color: "#444",
		fontSize: 36,
	},
	subtext: {
		fontSize: 17,
		color: "#444",
		marginBottom: 0,
		textAlign: "left",
		fontWeight: "400",
		lineHeight: 23,
		marginTop: 6,
	},
	bottom: {
		width: "100%",
		paddingBottom: 38,
		alignItems: "center",
	},
	connectButton: {
		backgroundColor: "#191919",
		paddingVertical: 21,
		borderRadius: 16,
		alignItems: "center",
		width: "100%",
		marginBottom: 14,
		transition: "background-color 0.2s",
	},
	connectText: {
		color: "#fff",
		fontSize: 19,
		fontWeight: "600",
		letterSpacing: 0.2,
	},
	disabledButton: {
		backgroundColor: "#888",
		opacity: 0.7,
	},
	footer: {
		fontSize: 16,
		color: "#888",
		textAlign: "center",
		marginTop: 0,
		letterSpacing: 0.1,
	},
});

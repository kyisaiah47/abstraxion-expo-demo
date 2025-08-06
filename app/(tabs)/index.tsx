import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";

export default function WelcomeScreen() {
	const { login, isConnected, isConnecting } = useAbstraxionAccount();

	if (isConnected) return null; // or navigate to main app if already connected

	return (
		<View style={styles.container}>
			{/* Logo placeholder */}
			<View style={styles.logoContainer}>
				<Image
					source={{
						uri: "https://hvnbpd9agmcawbt2.public.blob.vercel-storage.com/proof-of-work-logo",
					}}
					style={{ width: 150, height: 150, borderRadius: 20 }}
					resizeMode="contain"
				/>
				{/* <Text style={styles.title}>Proof of Work</Text> */}
				<Text style={styles.tagline}>
					Verifiable Work.{"\n"}Trustless Payments.
				</Text>
			</View>

			{/* Connect Wallet */}
			<TouchableOpacity
				onPress={login}
				style={[styles.connectButton, isConnecting && styles.disabledButton]}
				disabled={isConnecting}
			>
				{isConnecting ? (
					<ActivityIndicator color="#fff" />
				) : (
					<Text style={styles.connectText}>Connect Wallet</Text>
				)}
			</TouchableOpacity>

			{/* Footer */}
			<Text style={styles.footer}>Powered by XION • Burnt</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#6366F1",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	logoContainer: {
		alignItems: "center",
		marginBottom: 40,
	},
	logoPlaceholder: {
		width: 100,
		height: 100,
		borderRadius: 20,
		backgroundColor: "#e0e0e0",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	logoText: {
		color: "#555",
		fontWeight: "bold",
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		color: "#fff",
		marginBottom: 8,
	},
	tagline: {
		fontSize: 14,
		color: "#ddd", // instead of #ccc or #aaa
		textAlign: "center",
		marginTop: 8,
		fontStyle: "italic",
		fontWeight: "300",
		lineHeight: 20,
	},
	connectButton: {
		backgroundColor: "#ffffff",
		paddingVertical: 16,
		borderRadius: 100,
		alignItems: "center",
		width: "100%",
		marginTop: 20,
	},
	connectText: {
		color: "#6366F1",
		fontSize: 16,
		fontWeight: "600",
	},
	disabledButton: {
		backgroundColor: "#ccc",
		opacity: 0.7,
	},
	footer: {
		marginTop: 40,
		fontSize: 12,
		color: "#d0cde1",
	},
});

import React, { useEffect, useRef, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { Camera } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

export default function QRScanner({ onScanned, onCancel }) {
	const [hasPermission, setHasPermission] = useState<null | boolean>(null);
	const [scanned, setScanned] = useState(false);
	const cameraRef = useRef<Camera>(null);

	useEffect(() => {
		(async () => {
			const { status } = await Camera.requestCameraPermissionsAsync();
			setHasPermission(status === "granted");
		})();
	}, []);

	const handleBarCodeScanned = ({ type, data }) => {
		setScanned(true);
		onScanned?.(data); // Callback to parent
	};

	if (hasPermission === null) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator
					size="large"
					color="#111"
				/>
				<Text style={styles.permissionText}>Requesting camera permission…</Text>
			</View>
		);
	}
	if (hasPermission === false) {
		return (
			<View style={styles.centered}>
				<Ionicons
					name="alert-circle"
					size={44}
					color="#f43f5e"
				/>
				<Text style={styles.permissionText}>No access to camera</Text>
				<TouchableOpacity
					style={styles.retryBtn}
					onPress={() => Camera.requestCameraPermissionsAsync()}
				>
					<Text style={styles.retryText}>Try Again</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Camera
				ref={cameraRef}
				style={StyleSheet.absoluteFillObject}
				onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
				ratio="16:9"
			>
				<View style={styles.overlay}>
					<View style={styles.frame} />
					<TouchableOpacity
						style={styles.closeBtn}
						onPress={onCancel}
					>
						<Ionicons
							name="close"
							size={32}
							color="#fff"
						/>
					</TouchableOpacity>
				</View>
			</Camera>
			{scanned && (
				<View style={styles.resultBox}>
					<Text style={styles.resultText}>QR code scanned!</Text>
					<TouchableOpacity
						style={styles.scanAgainBtn}
						onPress={() => setScanned(false)}
					>
						<Text style={styles.scanAgainText}>Scan Again</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	permissionText: {
		marginTop: 18,
		fontSize: 17,
		color: "#111",
		fontWeight: "500",
	},
	retryBtn: {
		marginTop: 18,
		backgroundColor: "#191919",
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 32,
	},
	retryText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 16,
	},
	overlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	frame: {
		width: 240,
		height: 240,
		borderRadius: 20,
		borderWidth: 4,
		borderColor: "#fff",
		backgroundColor: "rgba(0,0,0,0.12)",
		alignSelf: "center",
	},
	closeBtn: {
		position: "absolute",
		top: 50,
		right: 32,
		padding: 6,
		backgroundColor: "rgba(0,0,0,0.4)",
		borderRadius: 20,
	},
	resultBox: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		paddingVertical: 32,
		alignItems: "center",
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
		shadowColor: "#000",
		shadowOpacity: 0.04,
		shadowOffset: { width: 0, height: -6 },
		shadowRadius: 12,
	},
	resultText: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111",
		marginBottom: 16,
	},
	scanAgainBtn: {
		backgroundColor: "#191919",
		paddingVertical: 12,
		paddingHorizontal: 32,
		borderRadius: 12,
	},
	scanAgainText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});

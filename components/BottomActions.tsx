import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { styles } from "@/app/dashboard.styles";

export type BottomActionsProps = {
	handleScanQR: () => void;
	createModalRef: React.RefObject<any>;
};

export default function BottomActions({
	handleScanQR,
	createModalRef,
}: BottomActionsProps) {
	return (
		<View style={styles.bottomActions}>
			<TouchableOpacity
				style={styles.scanButton}
				onPress={handleScanQR}
				activeOpacity={0.85}
			>
				<MaterialCommunityIcons
					name="qrcode-scan"
					size={22}
					color="#fff"
					style={{ marginRight: 8 }}
				/>
				<Text style={styles.scanButtonText}>Scan Job QR</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.createJobButton}
				onPress={() => createModalRef.current?.open()}
				activeOpacity={0.85}
			>
				<MaterialIcons
					name="add"
					size={28}
					color="#191919"
				/>
			</TouchableOpacity>
		</View>
	);
}

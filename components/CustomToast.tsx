import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CustomToast({ text1, text2, ...props }) {
	return (
		<View style={styles.toastContainer}>
			<Text style={styles.toastTitle}>{text1}</Text>
			{!!text2 && <Text style={styles.toastSubtitle}>{text2}</Text>}
		</View>
	);
}

const styles = StyleSheet.create({
	toastContainer: {
		backgroundColor: "#fff",
		borderRadius: 18,
		paddingHorizontal: 20,
		paddingVertical: 16,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
		minWidth: 240,
		maxWidth: 330,
		marginHorizontal: 12,
		alignSelf: "center",
	},
	toastTitle: {
		fontWeight: "700",
		color: "#191919",
		fontSize: 16,
		marginBottom: 2,
	},
	toastSubtitle: {
		fontSize: 14,
		color: "#8e8e8e",
		fontWeight: "500",
	},
});

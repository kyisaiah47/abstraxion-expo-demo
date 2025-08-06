import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProofSubmissionSheet({ job, proofEvents, onSubmit }) {
	const [checked, setChecked] = useState(proofEvents.map((e) => !!e.verified));
	const handleToggle = (idx) => {
		if (proofEvents[idx].verified) {
			setChecked((prev) => prev.map((val, i) => (i === idx ? !val : val)));
		}
	};
	const allChecked = checked.every(Boolean);

	return (
		<View style={styles.sheetWrapper}>
			<Text style={styles.headline}>{job.title}</Text>
			<Text style={styles.subheadline}>for {job.client}</Text>
			{job.description ? (
				<Text style={styles.desc}>{job.description}</Text>
			) : null}
			{/* <Text style={styles.section}>Submit proof of work</Text> */}
			<View style={{ marginBottom: 12 }}>
				{proofEvents.map((item, idx) => (
					<TouchableOpacity
						key={idx}
						style={styles.proofRow}
						activeOpacity={item.verified ? 0.7 : 1}
						onPress={() => handleToggle(idx)}
						disabled={!item.verified}
					>
						<View
							style={[
								styles.checkbox,
								{
									backgroundColor: checked[idx]
										? "#111"
										: item.verified
										? "#fff"
										: "#F2F2F2",
									borderColor: checked[idx] ? "#111" : "#D1D5DB",
								},
							]}
						>
							{checked[idx] && (
								<Ionicons
									name="checkmark"
									size={15}
									color="#fff"
								/>
							)}
						</View>
						<Text
							style={[
								styles.proofText,
								{
									color: item.verified ? "#111" : "#BDBDBD",
									fontWeight: checked[idx] ? "600" : "400",
								},
							]}
						>
							{item.description}
						</Text>
						<Text style={styles.proofTime}>{item.time}</Text>
					</TouchableOpacity>
				))}
			</View>
			<TouchableOpacity
				style={[styles.button, { opacity: allChecked ? 1 : 0.5 }]}
				onPress={onSubmit}
				disabled={!allChecked}
			>
				<Text style={styles.buttonText}>SUBMIT PROOF</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	sheetWrapper: {
		paddingHorizontal: 28,
		paddingTop: 28,
		paddingBottom: 20, // minimal bottom
		backgroundColor: "#fff",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	headline: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#111",
		letterSpacing: -1,
		marginBottom: 3,
	},
	subheadline: {
		fontSize: 16,
		color: "#9A9A9A",
		marginBottom: 16,
	},
	desc: {
		fontSize: 16,
		color: "#5B5B5B",
		marginBottom: 22,
	},
	section: {
		fontSize: 17,
		fontWeight: "700",
		color: "#111",
		marginBottom: 16,
	},
	proofRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 8,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},
	proofText: {
		flex: 1,
		fontSize: 16,
	},
	proofTime: {
		fontSize: 13,
		color: "#BDBDBD",
		fontWeight: "500",
		marginLeft: 8,
	},
	button: {
		backgroundColor: "#111",
		paddingVertical: 18,
		borderRadius: 100,
		alignItems: "center",
		marginTop: 18,
		marginBottom: 6,
	},
	buttonText: {
		color: "#FFF",
		fontSize: 18,
		fontWeight: "700",
		letterSpacing: 1,
	},
});

import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const recentActivities = [
	{
		id: "1",
		title: "Accepted task",
		subtitle: "Design landing page",
		icon: "check-circle",
	},
	{
		id: "2",
		title: "Submitted proof",
		subtitle: "Logo design",
		icon: "upload-file",
	},
	{
		id: "3",
		title: "Received payment",
		subtitle: "$500 for Web App",
		icon: "attach-money",
	},
];

export default function RecentActivityScreen() {
	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.listWrapper}>
					<FlatList
						data={recentActivities}
						keyExtractor={(item) => item.id}
						contentContainerStyle={{
							flexGrow: 1,
							justifyContent: "center",
							paddingBottom: 24,
						}}
						ListHeaderComponent={
							<Text style={styles.title}>Recent Activity</Text>
						}
						renderItem={({ item }) => (
							<View style={styles.activityItem}>
								<View style={styles.iconWrapper}>
									<MaterialIcons
										name={item.icon}
										size={24}
										color="#6366F1"
									/>
								</View>
								<View style={styles.textWrapper}>
									<Text style={styles.activityTitle}>{item.title}</Text>
									<Text style={styles.activitySubtitle}>{item.subtitle}</Text>
								</View>
							</View>
						)}
					/>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F4F4F5",
	},
	container: {
		flex: 1,
		paddingHorizontal: 20,
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
		color: "#111827",
		marginTop: 16,
		marginBottom: 16,
	},
	listWrapper: {
		flex: 1,
	},
	activityItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 1,
	},
	iconWrapper: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#EEF2FF",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	textWrapper: {
		flex: 1,
	},
	activityTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	activitySubtitle: {
		fontSize: 14,
		color: "#6B7280",
	},
});

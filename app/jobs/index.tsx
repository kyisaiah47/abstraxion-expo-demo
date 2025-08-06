import React from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";

const jobs = [
	{
		id: "1",
		title: "Design landing page",
		client: "Acme Inc",
		payout: "$400",
		due: "in 3 days",
		tags: ["Remote", "Fixed-price", "Urgent"],
	},
	{
		id: "2",
		title: "Build mobile prototype",
		client: "ZenFlow",
		payout: "$700",
		due: "in 5 days",
		tags: ["Remote", "Milestone", "New"],
	},
];

export default function JobMarketplaceScreen() {
	const router = useRouter();

	return (
		<View style={styles.container}>
			<Stack.Screen
				options={{
					title: "Available Tasks",
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

			<Text style={styles.subheading}>{jobs.length} open tasks</Text>

			<View style={styles.searchBar}>
				<Text style={styles.searchPlaceholder}>🔍 Search tasks</Text>
			</View>

			<FlatList
				data={jobs}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ paddingBottom: 24 }}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={styles.card}
						onPress={() => router.push(`/jobs/${item.id}`)}
					>
						<Text style={styles.title}>{item.title}</Text>
						<View style={styles.badgeRow}>
							{item.tags.map((tag) => (
								<View
									style={styles.badge}
									key={tag}
								>
									<Text style={styles.badgeText}>{tag}</Text>
								</View>
							))}
						</View>
						<Text style={styles.meta}>
							{item.client} • {item.payout}
						</Text>
						<Text style={styles.due}>{item.due}</Text>
					</TouchableOpacity>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F4F4F5",
		paddingHorizontal: 20,
		paddingTop: 8,
	},
	subheading: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 12,
		marginTop: 4,
	},
	searchBar: {
		backgroundColor: "#E5E7EB",
		borderRadius: 100,
		paddingVertical: 10,
		paddingHorizontal: 16,
		marginBottom: 16,
	},
	searchPlaceholder: {
		color: "#9CA3AF",
		fontSize: 14,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	meta: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 8,
	},
	due: {
		fontSize: 12,
		color: "#9CA3AF",
		marginTop: 2,
	},
	badgeRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 8,
	},
	badge: {
		backgroundColor: "#E0E7FF",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 999,
	},
	badgeText: {
		fontSize: 12,
		color: "#4338CA",
		fontWeight: "500",
	},
});

import React from "react";
import {
	View,
	TouchableOpacity,
	StyleSheet,
	Text,
	SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

interface CustomTabBarProps extends BottomTabBarProps {
	onScanQR: () => void;
	onPostJob: () => void;
}

export default function MonochromeTabBar({
	state,
	descriptors,
	navigation,
	onScanQR,
	onPostJob,
}: CustomTabBarProps) {
	return (
		<SafeAreaView style={styles.container}>
			{/* Top Row - Action Buttons Side by Side */}
			<View style={styles.topRow}>
				{/* QR Scan Button - Small, Outlined with Text */}
				<TouchableOpacity
					style={styles.scanButton}
					onPress={onScanQR}
				>
					<Ionicons
						name="qr-code-outline"
						size={16}
						color="#000"
					/>
					<Text style={styles.scanButtonText}>Scan</Text>
				</TouchableOpacity>

				{/* Post Job Button - Large, Black with Text */}
				<TouchableOpacity
					style={styles.postJobButton}
					onPress={onPostJob}
				>
					{/* <Ionicons
						name="add"
						size={18}
						color="#fff"
					/> */}
					<Text style={styles.postJobText}>Post Job</Text>
				</TouchableOpacity>
			</View>

			{/* Bottom Row - 3 Navigation Icons */}
			<View style={styles.bottomRow}>
				{["dashboard", "marketplace", "profile"].map((name, idx) => {
					// Find the route by name
					const route = state.routes.find((r) => r.name === name);
					if (!route) return null;
					const isFocused =
						state.index === state.routes.findIndex((r) => r.name === name);
					const onPress = () => {
						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						});
						if (!isFocused && !event.defaultPrevented) {
							navigation.navigate(route.name);
						}
					};
					let iconName = "ellipse-outline";
					switch (name) {
						case "dashboard":
							iconName = isFocused ? "grid" : "grid-outline";
							break;
						case "marketplace":
							iconName = isFocused ? "briefcase" : "briefcase-outline";
							break;
						case "profile":
							iconName = isFocused ? "person" : "person-outline";
							break;
					}
					return (
						<TouchableOpacity
							key={route.key}
							style={styles.navItem}
							onPress={onPress}
						>
							<Ionicons
								name={iconName as any}
								size={24}
								color={isFocused ? "#000" : "#999"}
							/>
						</TouchableOpacity>
					);
				})}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#fff",
	},

	// Top Row - Action Buttons Side by Side
	topRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 12,
		borderTopWidth: 1,
		borderTopColor: "#f0f0f0",
		backgroundColor: "#fff",
		gap: 12,
	},
	scanButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fff",
		borderWidth: 1.5,
		borderColor: "#000",
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 20,
		gap: 6,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	scanButtonText: {
		color: "#000",
		fontSize: 14,
		fontWeight: "600",
	},
	postJobButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#000",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 25,
		gap: 8,
		flex: 1,
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	postJobText: {
		color: "#fff",
		fontSize: 15,
		fontWeight: "600",
		letterSpacing: 0.3,
	},

	// Bottom Row - 3 Navigation Icons with Labels
	bottomRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingBottom: 8,
		paddingTop: 8,
		backgroundColor: "#fff",
	},
	navItem: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 8,
		gap: 4,
	},
	navLabel: {
		fontSize: 11,
		fontWeight: "500",
	},
});

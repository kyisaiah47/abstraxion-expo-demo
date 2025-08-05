import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			initialRouteName="index"
			screenOptions={{
				tabBarActiveTintColor: "#6366F1", // Updated to match the purple button color
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: "absolute",
					},
					default: {},
				}),
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Activity",
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name="clock.fill"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="job-details"
				options={{
					title: "Job Details",
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name="briefcase.fill"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="proof-submission"
				options={{
					title: "Submit Proof",
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name="checkmark.seal.fill"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="payment-received"
				options={{
					title: "Payment Received",
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name="creditcard.fill"
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}

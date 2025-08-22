import { Tabs } from "expo-router";
import React, { useState } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import MonochromeTabBar from "../../components/TwoLayerBottomNav";

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const router = useRouter();

	const handleScanQR = () => {
		// Navigate to QR scanner screen
		router.push("/qr-scanner");
	};

	const handlePostJob = () => {
		router.push("/create");
	};

	return (
		<Tabs
			tabBar={(props) => (
				<MonochromeTabBar
					{...props}
					onScanQR={handleScanQR}
					onPostJob={handlePostJob}
				/>
			)}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="dashboard"
				options={{
					title: "Dashboard",
				}}
			/>
			<Tabs.Screen
				name="marketplace"
				options={{
					title: "Marketplace",
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
				}}
			/>
			{/* Hide these from tab bar - they should be stack pages */}
			<Tabs.Screen
				name="jobs/[id]"
				options={{
					href: null, // This hides it from the tab bar
				}}
			/>
			<Tabs.Screen
				name="jobs/[id]/payment-received"
				options={{
					href: null, // This hides it from the tab bar
				}}
			/>
			<Tabs.Screen
				name="jobs/[id]/proof-submission"
				options={{
					href: null, // This hides it from the tab bar
				}}
			/>
		</Tabs>
	);
}

import { Tabs } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import SophisticatedTabBar from "@/components/SophisticatedTabBar";
import { DesignSystem } from "@/constants/DesignSystem";

export default function TabLayout() {
	const router = useRouter();

	const handleScanQR = () => {
		router.push("/qr-scanner");
	};

	const handlePostJob = () => {
		router.push("/create");
	};

	return (
		<View style={styles.container}>
			<Tabs
				tabBar={() => <SophisticatedTabBar />}
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
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: DesignSystem.colors.surface.primary,
	},
});

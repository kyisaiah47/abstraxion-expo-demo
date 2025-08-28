import { Tabs } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";
import SophisticatedTabBar from "@/components/SophisticatedTabBar";
import { DesignSystem } from "@/constants/DesignSystem";
import { useTheme } from "@/contexts/ThemeContext";

export default function TabLayout() {
	const { colors } = useTheme();
	
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.surface.primary,
		},
	});

	return (
		<View style={styles.container}>
			<Tabs
				tabBar={() => <SophisticatedTabBar />}
				screenOptions={{
					headerShown: false,
				}}
			>
				<Tabs.Screen
					name="activity"
					options={{
						title: "Feed",
					}}
				/>
				<Tabs.Screen
					name="create"
					options={{
						title: "Create",
					}}
				/>
				<Tabs.Screen
					name="friends"
					options={{
						title: "Friends",
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
					name="recent-activity"
					options={{
						href: null, // This hides it from the tab bar
					}}
				/>
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

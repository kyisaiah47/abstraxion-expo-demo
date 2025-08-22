import React from "react";
import { View, StyleSheet, Pressable, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { DesignSystem } from "@/constants/DesignSystem";
import { Link, usePathname } from "expo-router";

interface TabBarItem {
	name: string;
	href: string;
	icon: keyof typeof Ionicons.glyphMap;
	activeIcon: keyof typeof Ionicons.glyphMap;
	label: string;
}

const tabItems: TabBarItem[] = [
	{
		name: "activity",
		href: "/(tabs)/activity",
		icon: "time-outline",
		activeIcon: "time",
		label: "Activity",
	},
	{
		name: "create",
		href: "/(tabs)/create",
		icon: "add-circle-outline",
		activeIcon: "add-circle",
		label: "Create",
	},
	{
		name: "profile",
		href: "/(tabs)/profile",
		icon: "person-outline",
		activeIcon: "person",
		label: "Profile",
	},
];

export default function SophisticatedTabBar() {
	const pathname = usePathname();

	const isActive = (href: string) => {
		if (href === "/(tabs)/activity" && pathname === "/") return true;
		return pathname === href || pathname.startsWith(href);
	};

	return (
		<View style={styles.container}>
			{/* Background Blur Effect */}
			{Platform.OS === "ios" ? (
				<BlurView
					intensity={100}
					tint="light"
					style={StyleSheet.absoluteFillObject}
				/>
			) : (
				<View
					style={[StyleSheet.absoluteFillObject, styles.androidBackground]}
				/>
			)}

			{/* Navigation Pills Container */}
			<View style={styles.pillsContainer}>
				{tabItems.map((item) => {
					const active = isActive(item.href);

					return (
						<Link
							key={item.name}
							href={item.href as any}
							asChild
						>
							<Pressable
								style={[styles.tabPill, active && styles.tabPillActive]}
								android_ripple={{
									color: DesignSystem.colors.primary[100],
									borderless: true,
									radius: 32,
								}}
							>
								{({ pressed }) => (
									<View
										style={[
											styles.tabContent,
											pressed && !active && styles.tabPressed,
										]}
									>
										<Ionicons
											name={active ? item.activeIcon : item.icon}
											size={24}
											color={
												active
													? DesignSystem.colors.text.inverse
													: DesignSystem.colors.text.secondary
											}
										/>
										<Text
											style={[styles.tabLabel, active && styles.tabLabelActive]}
										>
											{item.label}
										</Text>
									</View>
								)}
							</Pressable>
						</Link>
					);
				})}
			</View>

			{/* Safe Area Spacer */}
			<View style={styles.safeAreaSpacer} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor:
			Platform.OS === "android"
				? DesignSystem.colors.surface.elevated
				: "transparent",
		borderTopWidth: 1,
		borderTopColor: DesignSystem.colors.border.secondary,
		paddingHorizontal: DesignSystem.spacing["2xl"],
		paddingTop: DesignSystem.spacing.xl,
		zIndex: 100,
	},

	androidBackground: {
		backgroundColor: `${DesignSystem.colors.surface.elevated}F5`, // 96% opacity
	},

	pillsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: DesignSystem.colors.surface.secondary,
		borderRadius: DesignSystem.radius["2xl"],
		padding: DesignSystem.spacing.sm,
		...DesignSystem.shadows.lg,
		borderWidth: 1,
		borderColor: DesignSystem.colors.border.tertiary,
	},

	tabPill: {
		flex: 1,
		borderRadius: DesignSystem.radius.xl,
		marginHorizontal: DesignSystem.spacing.xs,
		paddingVertical: DesignSystem.spacing.md,
		paddingHorizontal: DesignSystem.spacing.lg,
		backgroundColor: "transparent",
	},

	tabPillActive: {
		backgroundColor: DesignSystem.colors.primary[800],
		...DesignSystem.shadows.md,
	},

	tabContent: {
		alignItems: "center",
		justifyContent: "center",
		gap: DesignSystem.spacing.xs,
	},

	tabPressed: {
		opacity: 0.7,
		transform: [{ scale: 0.96 }],
	},

	tabLabel: {
		...DesignSystem.typography.label.small,
		color: DesignSystem.colors.text.secondary,
		textAlign: "center",
	},

	tabLabelActive: {
		color: DesignSystem.colors.text.inverse,
		fontWeight: "600",
	},

	safeAreaSpacer: {
		height: Platform.OS === "ios" ? 34 : DesignSystem.spacing.xl,
	},
});

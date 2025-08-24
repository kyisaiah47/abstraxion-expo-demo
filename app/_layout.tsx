// app/_layout.tsx
import "react-native-reanimated";
import "react-native-get-random-values";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AbstraxionProvider } from "@burnt-labs/abstraxion-react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Toast from "react-native-toast-message";

import { Buffer } from "buffer";
import crypto from "react-native-quick-crypto";
import CustomToast from "@/components/CustomToast";
// @ts-ignore
global.crypto = crypto;
global.Buffer = Buffer;

SplashScreen.preventAutoHideAsync();

const treasuryConfig = {
	contracts: [process.env.EXPO_PUBLIC_CONTRACT_ADDRESS].filter(Boolean) as string[],
	treasury: process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS || "",
	gasPrice: "0.001uxion",
	rpcUrl: process.env.EXPO_PUBLIC_RPC_ENDPOINT || "",
	restUrl: process.env.EXPO_PUBLIC_REST_ENDPOINT || "",
	callbackUrl: "proofpay://",
	// Force Abstraxion to use our app's scheme
	redirectUri: "proofpay://",
	// Alternative: use a custom domain if deep links don't work
	// redirectUri: "https://your-domain.com/auth-callback"
};

function NavigationWrapper() {
	const { isDarkMode } = useTheme();
	
	return (
		<NavigationThemeProvider
			value={isDarkMode ? DarkTheme : DefaultTheme}
		>
			<Stack
				screenOptions={{
					headerShown: false, // Hide headers for all screens
				}}
			>
				<Stack.Screen name="index" />
				<Stack.Screen
					name="(tabs)"
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="create"
					options={{ headerShown: false }}
				/>
			</Stack>
			<StatusBar style={isDarkMode ? "light" : "auto"} />
		</NavigationThemeProvider>
	);
}

export default function RootLayout() {
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<ThemeProvider>
					<AbstraxionProvider config={treasuryConfig}>
						<NavigationWrapper />
					</AbstraxionProvider>
					<Toast
						config={{
							success: (props) => <CustomToast {...props} />,
							// You can also override 'error', 'info', etc if you want
						}}
					/>
				</ThemeProvider>
			</GestureHandlerRootView>
		</>
	);
}

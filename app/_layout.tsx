// app/_layout.tsx
import "react-native-reanimated";
import "react-native-get-random-values";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AbstraxionProvider } from "@burnt-labs/abstraxion-react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import Toast from "react-native-toast-message";

import { Buffer } from "buffer";
import crypto from "react-native-quick-crypto";
import CustomToast from "@/components/CustomToast";
// @ts-ignore
global.crypto = crypto;
global.Buffer = Buffer;

SplashScreen.preventAutoHideAsync();

const treasuryConfig = {
	treasury: process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS,
	gasPrice: "0.001uxion",
	rpcUrl: process.env.EXPO_PUBLIC_RPC_ENDPOINT,
	restUrl: process.env.EXPO_PUBLIC_REST_ENDPOINT,
	callbackUrl: "proof-of-work://",
	// Force Abstraxion to use our app's scheme
	redirectUri: "proof-of-work://auth",
	// Alternative: use a custom domain if deep links don't work
	// redirectUri: "https://your-domain.com/auth-callback"
};

export default function RootLayout() {
	const colorScheme = useColorScheme();
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
				<AbstraxionProvider config={treasuryConfig}>
					<ThemeProvider
						value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
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
							<Stack.Screen
								name="marketplace"
								options={{ headerShown: false }}
							/>
						</Stack>
						<StatusBar style="auto" />
					</ThemeProvider>
				</AbstraxionProvider>
				<Toast
					config={{
						success: (props) => <CustomToast {...props} />,
						// You can also override 'error', 'info', etc if you want
					}}
				/>
			</GestureHandlerRootView>
		</>
	);
}

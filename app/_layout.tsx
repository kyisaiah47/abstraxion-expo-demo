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
	callbackUrl: "abstraxion-expo-demo://",
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
			<AbstraxionProvider config={treasuryConfig}>
				<ThemeProvider
					value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
				>
					<Stack
						screenOptions={{
							headerShown: false, // Hide headers for all screens
						}}
					>
						{/* No more "(tabs)" route! */}
						{/* Just your pages, Expo Router will pick up /index, /recent-activity, /jobs, etc. */}
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
		</>
	);
}

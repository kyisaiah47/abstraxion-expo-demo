// app/_layout.tsx
import "react-native-reanimated";
import "react-native-get-random-values";

console.log("🚀 APP STARTING - This should show in terminal");
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Linking, Alert } from "react-native";
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

import { useTheme, ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { useTaskSubscriptions, useNotificationSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import Toast from "react-native-toast-message";
import { SimpleWalletManager } from "@/components/wallets/SimpleWalletManager";

import CustomToast from "@/components/CustomToast";

import { Buffer } from "buffer";
import crypto from "react-native-quick-crypto";
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

function RealtimeWrapper() {
	// Realtime subscriptions temporarily disabled for cleaner logs
	// useTaskSubscriptions();
	// useNotificationSubscriptions();
	
	return <NavigationWrapper />;
}

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

		// Handle deep links from Reclaim Protocol
		const handleDeepLink = (url: string) => {
			console.log('🔗 Deep link received:', url);
			if (url?.startsWith('proofpay://')) {
				// Handle any proofpay:// deep link as potential Reclaim callback
				try {
					// Try different ways to extract proof data
					const urlObj = new URL(url);
					console.log('URL params:', urlObj.searchParams.toString());
					
					// Look for various proof parameters
					const proofData = urlObj.searchParams.get('proof') || 
									  urlObj.searchParams.get('proofs') ||
									  urlObj.searchParams.get('data');
					
					if (proofData) {
						console.log('✅ Found proof data:', proofData);
						const event = new CustomEvent('reclaimProofReceived', {
							detail: { 
								proof: JSON.parse(decodeURIComponent(proofData)),
								rawUrl: url 
							}
						});
						// @ts-ignore
						global.dispatchEvent?.(event);
					} else {
						// Even if no proof data, signal that verification might be complete
						console.log('⚠️ No proof data found, but callback received');
						const event = new CustomEvent('reclaimProofReceived', {
							detail: { 
								success: true,
								rawUrl: url 
							}
						});
						// @ts-ignore
						global.dispatchEvent?.(event);
					}
				} catch (error) {
					console.error('Error parsing deep link:', error);
					// Still emit event to signal completion
					const event = new CustomEvent('reclaimProofReceived', {
						detail: { 
							success: true,
							rawUrl: url,
							error: error 
						}
					});
					// @ts-ignore
					global.dispatchEvent?.(event);
				}
			}
		};

		// Handle initial URL (if app was opened via deep link)
		Linking.getInitialURL().then((url) => {
			if (url) {
				handleDeepLink(url);
			}
		});

		// Handle URLs while app is running
		const linkingSubscription = Linking.addEventListener('url', (event) => {
			handleDeepLink(event.url);
		});

		return () => {
			linkingSubscription?.remove();
		};
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<ThemeProvider>
					<SimpleWalletManager>
						<AbstraxionProvider config={treasuryConfig}>
							<AuthProvider>
								<RealtimeWrapper />
							</AuthProvider>
						</AbstraxionProvider>
					</SimpleWalletManager>
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

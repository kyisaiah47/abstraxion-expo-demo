import { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ActivityIndicator,
	SafeAreaView,
} from "react-native";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { UserService } from "@/lib/userService";
import { useUserProfile } from "@/hooks/useSocialContract";

// Onboarding screens data
const onboardingScreens = [
	{
		id: 1,
		title: "Pay with proof\nbuilt in",
		subtitle: null,
		description:
			"Send payments that require cryptographic verification. No disputes, ever.",
		background: "#ffffff",
		backgroundColor: "#ffffff",
		showLogo: false,
		visual: "timeline",
		gradientType: "subtle",
	},
	{
		id: 2,
		title: "Venmo meets\nmathematics",
		subtitle: null,
		description:
			"Simple P2P payments with zero-knowledge proof verification for tasks.",
		background: "#f8f9fa",
		backgroundColor: "#f8f9fa",
		showLogo: false,
		visual: "comparison",
		gradientType: "light",
	},
	{
		id: 3,
		title: "Web3 made simple.\nWeb2 familiar.",
		subtitle: null,
		description:
			"No wallets, no seed phrases, no complexity. Just sign in and start earning.",
		background: "#ffffff",
		backgroundColor: "#ffffff",
		showLogo: false,
		visual: "google-interface",
		gradientType: null,
	},
];

export default function OnboardingScreen() {
	const {
		login,
		isConnected,
		isConnecting,
		data: account,
	} = useAbstraxionAccount();
	const router = useRouter();
	const [currentScreen, setCurrentScreen] = useState(0);
	const [isCheckingUser, setIsCheckingUser] = useState(false);
	const {
		user,
		loading: userLoading,
		error,
	} = useUserProfile(account?.bech32Address || "");

	// Add this state to track if we've completed at least one user check
	const [hasCompletedUserCheck, setHasCompletedUserCheck] = useState(false);

	useEffect(() => {
		// Mark as checked when we finish loading (whether user found or not)
		if (
			isConnected &&
			account?.bech32Address &&
			!userLoading &&
			!hasCompletedUserCheck
		) {
			setHasCompletedUserCheck(true);
		}

		// Only make navigation decisions after we've completed at least one check
		if (
			isConnected &&
			account?.bech32Address &&
			!userLoading &&
			hasCompletedUserCheck &&
			!isCheckingUser
		) {
			if (user) {
				router.replace("/(tabs)/activity");
			} else {
				router.replace("/username-setup");
			}
		}
	}, [
		isConnected,
		account?.bech32Address,
		user,
		userLoading,
		hasCompletedUserCheck,
		isCheckingUser,
		router,
	]);

	// Reset hasCompletedUserCheck when wallet address changes
	useEffect(() => {
		setHasCompletedUserCheck(false);
	}, [account?.bech32Address]);

	if (isConnected) {
		return null;
	}

	const screen = onboardingScreens[currentScreen];
	const isLastScreen = currentScreen === onboardingScreens.length - 1;

	const handleNext = () => {
		if (isLastScreen) {
			login();
		} else {
			setCurrentScreen(currentScreen + 1);
		}
	};

	const handleSkip = () => {
		setCurrentScreen(onboardingScreens.length - 1);
	};

	const renderVisual = () => {
		switch (screen.visual) {
			case "timeline":
				return (
					<View style={styles.visualContainer}>
						<View style={styles.timelineContainer}>
							{/* Laptop Icon */}
							<View style={styles.timelineStep}>
								<View style={styles.timelineIcon}>
									<Ionicons
										name="laptop-outline"
										size={28}
										color="#191919"
									/>
								</View>
								<Text style={styles.timelineLabel}>Complete work</Text>
							</View>

							{/* Arrow */}
							<View style={styles.timelineArrow}>
								<Ionicons
									name="chevron-forward"
									size={20}
									color="#666"
								/>
							</View>

							{/* Shield Icon */}
							<View style={styles.timelineStep}>
								<View style={styles.timelineIcon}>
									<Ionicons
										name="shield-checkmark"
										size={28}
										color="#191919"
									/>
								</View>
								<Text style={styles.timelineLabel}>Generate proof</Text>
							</View>

							{/* Arrow */}
							<View style={styles.timelineArrow}>
								<Ionicons
									name="chevron-forward"
									size={20}
									color="#666"
								/>
							</View>

							{/* Payment Icon (with brand color) */}
							<View style={styles.timelineStep}>
								<View style={[styles.timelineIcon, styles.paymentIcon]}>
									<Ionicons
										name="card"
										size={28}
										color="#ffffff"
									/>
								</View>
								<Text style={styles.timelineLabel}>Instant payment</Text>
							</View>
						</View>

						{/* Timer */}
						<View style={styles.timerBadge}>
							<Ionicons
								name="time-outline"
								size={16}
								color="#666"
							/>
							<Text style={styles.timerLabel}>30 seconds</Text>
						</View>
					</View>
				);

			case "comparison":
				return (
					<View style={styles.visualContainer}>
						<View style={styles.comparisonWrapper}>
							{/* Traditional Side */}
							<View style={styles.comparisonSide}>
								<Text style={styles.comparisonHeader}>Traditional</Text>
								<View style={styles.comparisonList}>
									<View style={styles.comparisonItem}>
										<Ionicons
											name="help-circle-outline"
											size={20}
											color="#999"
										/>
										<Text style={styles.comparisonTextMuted}>
											Payment disputes
										</Text>
									</View>
									<View style={styles.comparisonItem}>
										<Ionicons
											name="time-outline"
											size={20}
											color="#999"
										/>
										<Text style={styles.comparisonTextMuted}>
											Weeks of waiting
										</Text>
									</View>
									<View style={styles.comparisonItem}>
										<Ionicons
											name="alert-circle-outline"
											size={20}
											color="#999"
										/>
										<Text style={styles.comparisonTextMuted}>Trust issues</Text>
									</View>
								</View>
							</View>

							{/* Divider */}
							<View style={styles.comparisonDivider} />

							{/* Proof of Work Side */}
							<View style={styles.comparisonSide}>
								<Text style={styles.comparisonHeader}>Proof of Work</Text>
								<View style={styles.comparisonList}>
									<View style={styles.comparisonItem}>
										<Ionicons
											name="checkmark-circle"
											size={20}
											color="#191919"
										/>
										<Text style={styles.comparisonText}>
											Verified instantly
										</Text>
									</View>
									<View style={styles.comparisonItem}>
										<Ionicons
											name="flash"
											size={20}
											color="#191919"
										/>
										<Text style={styles.comparisonText}>Immediate payment</Text>
									</View>
									<View style={styles.comparisonItem}>
										<Ionicons
											name="shield-checkmark"
											size={20}
											color="#191919"
										/>
										<Text style={styles.comparisonText}>
											Mathematical proof
										</Text>
									</View>
								</View>
							</View>
						</View>
					</View>
				);

			case "google-interface":
				return (
					<View style={styles.visualContainer}>
						{/* Google Sign-in Button */}
						<View style={styles.googleButton}>
							<Ionicons
								name="logo-google"
								size={20}
								color="#4285F4"
							/>
							<Text style={styles.googleButtonText}>Sign in with Google</Text>
						</View>

						{/* Arrow */}
						<View style={styles.flowArrow}>
							<Ionicons
								name="arrow-down"
								size={24}
								color="#ccc"
							/>
						</View>

						{/* Dashboard Preview */}
						<View style={styles.dashboardPreview}>
							<View style={styles.dashboardHeader}>
								<View style={styles.dashboardAvatar} />
								<View style={styles.dashboardInfo}>
									<View style={styles.dashboardName} />
									<View style={styles.dashboardStatus} />
								</View>
							</View>
							<View style={styles.dashboardContent}>
								<View style={styles.dashboardCard} />
								<View style={styles.dashboardCard} />
							</View>
						</View>

						{/* Powered by text */}
						{/* <Text style={styles.poweredByText}>Powered by XION blockchain</Text> */}
					</View>
				);

			default:
				return null;
		}
	};

	return (
		<SafeAreaView
			style={[
				styles.container,
				{ backgroundColor: screen.backgroundColor || screen.background },
			]}
		>
			<View style={styles.content}>
				{/* Progress Dots */}
				<View style={styles.progressContainer}>
					{onboardingScreens.map((_, index) => (
						<TouchableOpacity
							key={index}
							onPress={() => setCurrentScreen(index)}
							style={[
								styles.progressDot,
								currentScreen === index && styles.activeDot,
							]}
							activeOpacity={0.7}
						/>
					))}
				</View>

				{/* Skip Button */}
				{!isLastScreen && (
					<TouchableOpacity
						onPress={handleSkip}
						style={styles.skipButton}
					>
						<Text style={styles.skipText}>Skip</Text>
					</TouchableOpacity>
				)}

				{/* Logo (Screen 1 only) */}
				{screen.showLogo && (
					<View style={styles.logoContainer}>
						<View style={styles.logoShadowWrapper}>
							<Image
								source={{
									uri: "https://rvpptly5bhkny5oc.public.blob.vercel-storage.com/Proof%20of%20Work",
								}}
								style={styles.logo}
								resizeMode="contain"
								accessibilityRole="image"
								accessibilityLabel="Proof of Work logo"
							/>
						</View>
					</View>
				)}

				{/* Visual Content */}
				{screen.visual && (
					<View style={styles.visualSection}>{renderVisual()}</View>
				)}

				{/* Text Content */}
				<View style={styles.textContainer}>
					<Text style={styles.title}>
						{screen.title}
						{screen.subtitle && (
							<Text style={styles.subtitle}>
								{"\n"}
								{screen.subtitle}
							</Text>
						)}
					</Text>
					<Text style={styles.description}>{screen.description}</Text>
				</View>

				{/* Action Button */}
				<View style={styles.actionContainer}>
					<TouchableOpacity
						onPress={handleNext}
						style={[styles.actionButton, isConnecting && styles.disabledButton]}
						disabled={isConnecting}
						activeOpacity={0.92}
					>
						{isConnecting ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.actionText}>
								{isLastScreen ? "Get Started" : "Continue"}
							</Text>
						)}
					</TouchableOpacity>

					<Text style={styles.footer}>Powered by XION blockchain</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	// Container and Layout
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
		paddingTop: 60,
		paddingBottom: 48,
	},

	// Progress Indicators
	progressContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 24,
		gap: 12,
	},
	progressDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#e1e5e9",
	},
	activeDot: {
		backgroundColor: "#191919",
		width: 32,
	},

	// Skip Button
	skipButton: {
		position: "absolute",
		top: 60,
		right: 32,
		paddingVertical: 8,
		paddingHorizontal: 16,
	},
	skipText: {
		color: "#666",
		fontSize: 16,
		fontWeight: "500",
	},

	// Logo (Screen 1)
	logoContainer: {
		alignItems: "flex-start",
		marginBottom: 24,
		marginTop: 8,
	},
	logoShadowWrapper: {
		shadowColor: "#191919",
		shadowOpacity: 0.08,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 4 },
		elevation: 8,
		borderRadius: 50,
		backgroundColor: "#fff",
	},
	logo: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#fff",
	},

	// Visual Content
	visualSection: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 16,
		minHeight: 200,
	},
	visualContainer: {
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},

	// Timeline Visual (Screen 1)
	timelineContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 20,
		paddingHorizontal: 8,
		flexWrap: "wrap",
	},
	timelineStep: {
		alignItems: "center",
		justifyContent: "center",
		maxWidth: 70,
	},
	timelineIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#f8f9fa",
		borderWidth: 2,
		borderColor: "#e1e5e9",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	paymentIcon: {
		backgroundColor: "#191919",
		borderColor: "#191919",
	},
	timelineLabel: {
		fontSize: 12,
		fontWeight: "500",
		color: "#666",
		textAlign: "center",
		maxWidth: 70,
		lineHeight: 14,
	},
	timelineArrow: {
		flexDirection: "row",
		alignItems: "center",
		marginHorizontal: 8,
	},
	arrowLine: {
		width: 16,
		height: 1,
		backgroundColor: "#e1e5e9",
		marginRight: 3,
	},
	timerBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f8f9fa",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		gap: 4,
		marginTop: 8,
	},
	timerLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: "#666",
	},

	// Comparison Visual (Screen 2)
	comparisonWrapper: {
		flexDirection: "row",
		width: "100%",
		paddingHorizontal: 8,
		alignItems: "flex-start",
	},
	comparisonSide: {
		flex: 1,
		alignItems: "center",
	},
	comparisonHeader: {
		fontSize: 16,
		fontWeight: "600",
		color: "#191919",
		marginBottom: 24,
		textAlign: "center",
	},
	comparisonList: {
		gap: 16,
		alignItems: "flex-start",
	},
	comparisonItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		minWidth: 140,
		gap: 8,
	},
	comparisonText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#191919",
	},
	comparisonTextMuted: {
		fontSize: 14,
		fontWeight: "500",
		color: "#999",
	},
	comparisonDivider: {
		width: 1,
		height: 210,
		backgroundColor: "#e1e5e9",
		marginHorizontal: 24,
	},

	// Google Interface Visual (Screen 3)
	googleButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: "#dadce0",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginBottom: 20,
		gap: 10,
		shadowColor: "#000",
		shadowOpacity: 0.04,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	googleButtonText: {
		fontSize: 15,
		fontWeight: "500",
		color: "#3c4043",
	},
	flowArrow: {
		marginVertical: 12,
	},
	dashboardPreview: {
		width: 260,
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: "#e1e5e9",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
	},
	dashboardHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
		gap: 10,
	},
	dashboardAvatar: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#f0f0f0",
	},
	dashboardInfo: {
		flex: 1,
		gap: 3,
	},
	dashboardName: {
		width: 70,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#f0f0f0",
	},
	dashboardStatus: {
		width: 50,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#f8f8f8",
	},
	dashboardContent: {
		gap: 8,
	},
	dashboardCard: {
		height: 20,
		borderRadius: 6,
		backgroundColor: "#f8f9fa",
	},
	poweredByText: {
		fontSize: 12,
		color: "#999",
		fontWeight: "400",
	},

	// Text Content
	textContainer: {
		alignItems: "center",
		paddingHorizontal: 16,
		marginBottom: 32,
		marginTop: 16,
	},
	title: {
		fontSize: 32,
		fontWeight: "700",
		color: "#191919",
		textAlign: "center",
		marginBottom: 12,
		lineHeight: 38,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontWeight: "400",
		color: "#444",
		fontSize: 32,
	},
	description: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
		lineHeight: 22,
		maxWidth: 300,
		fontWeight: "400",
	},

	// Action Buttons
	actionContainer: {
		alignItems: "center",
		paddingTop: 8,
		marginTop: "auto",
	},
	actionButton: {
		backgroundColor: "#191919",
		paddingVertical: 20,
		paddingHorizontal: 48,
		borderRadius: 12,
		alignItems: "center",
		width: "100%",
		maxWidth: 320,
		marginBottom: 20,
		shadowColor: "#191919",
		shadowOpacity: 0.15,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 6,
	},
	actionText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
		letterSpacing: 0.2,
	},
	disabledButton: {
		opacity: 0.7,
	},
	footer: {
		fontSize: 14,
		color: "#999",
		textAlign: "center",
		fontWeight: "400",
	},
});

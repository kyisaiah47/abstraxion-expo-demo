import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	ScrollView,
	Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { DesignSystem } from "@/constants/DesignSystem";
import * as Clipboard from 'expo-clipboard';
import Toast from "react-native-toast-message";

interface FAQItem {
	id: string;
	question: string;
	answer: string;
	expanded?: boolean;
}

export default function HelpCenterScreen() {
	const [faqs, setFaqs] = useState<FAQItem[]>([
		{
			id: "what-is-proofpay",
			question: "What is ProofPay?",
			answer: "ProofPay is a decentralized payment platform that uses zero-knowledge proofs (zkTLS) to verify task completion without revealing private data. You can send payments that are only released when specific conditions are met.",
			expanded: false,
		},
		{
			id: "how-zktls-works",
			question: "How does zkTLS verification work?",
			answer: "zkTLS (Zero-Knowledge Transport Layer Security) allows you to prove that certain data exists or actions were taken without revealing the actual data. For example, you can prove a GitHub PR was merged without showing the code content.",
			expanded: false,
		},
		{
			id: "supported-platforms",
			question: "What platforms are supported for verification?",
			answer: "ProofPay currently supports GitHub, Google Docs, Twitter, websites, APIs, and custom verification methods. More platforms are being added regularly based on user needs.",
			expanded: false,
		},
		{
			id: "payment-security",
			question: "How secure are payments?",
			answer: "Payments are secured by smart contracts on the Xion blockchain. Funds are held in escrow until verification conditions are met. Your private keys remain with you and are never shared with ProofPay.",
			expanded: false,
		},
		{
			id: "fees",
			question: "What fees does ProofPay charge?",
			answer: "ProofPay only charges network transaction fees. There are no platform fees for basic usage. Premium features may have associated costs in the future.",
			expanded: false,
		},
		{
			id: "wallet-connection",
			question: "How do I connect my wallet?",
			answer: "ProofPay uses Abstraxion for secure wallet connections. When you first open the app, you'll be prompted to connect. Your wallet handles all cryptographic operations securely.",
			expanded: false,
		},
		{
			id: "task-disputes",
			question: "What happens if there's a dispute?",
			answer: "If verification fails or there's a dispute, payments remain in escrow. You can provide additional proof or contact support. Future versions will include decentralized dispute resolution.",
			expanded: false,
		},
		{
			id: "privacy",
			question: "What data does ProofPay collect?",
			answer: "ProofPay only collects minimal data necessary for operation: your username, display name, and wallet address. Verification proofs are cryptographic and don't contain your private data.",
			expanded: false,
		},
	]);

	const { colors } = useTheme();
	const styles = createStyles(colors);

	const toggleFAQ = (id: string) => {
		setFaqs(prevFaqs =>
			prevFaqs.map(faq =>
				faq.id === id ? { ...faq, expanded: !faq.expanded } : faq
			)
		);
	};

	const handleEmailSupport = async () => {
		const email = "support@proofpay.io";
		const subject = "ProofPay Support Request";
		const body = "Hi ProofPay team,\n\nI need help with:\n\n[Describe your issue here]\n\nThanks!";
		
		const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		
		try {
			const canOpen = await Linking.canOpenURL(url);
			if (canOpen) {
				await Linking.openURL(url);
			} else {
				// Fallback: copy email to clipboard
				await Clipboard.setStringAsync(email);
				Toast.show({
					type: 'info',
					text1: 'Email copied',
					text2: `${email} copied to clipboard`,
					position: 'bottom',
				});
			}
		} catch (error) {
			
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Could not open email app',
				position: 'bottom',
			});
		}
	};

	const handleDiscordSupport = async () => {
		const discordUrl = "https://discord.gg/proofpay";
		try {
			const canOpen = await Linking.canOpenURL(discordUrl);
			if (canOpen) {
				await Linking.openURL(discordUrl);
			} else {
				Toast.show({
					type: 'error',
					text1: 'Error',
					text2: 'Could not open Discord',
					position: 'bottom',
				});
			}
		} catch (error) {
			
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Could not open Discord',
				position: 'bottom',
			});
		}
	};

	const handleDocumentation = async () => {
		const docsUrl = "https://docs.proofpay.io";
		try {
			const canOpen = await Linking.canOpenURL(docsUrl);
			if (canOpen) {
				await Linking.openURL(docsUrl);
			} else {
				Toast.show({
					type: 'error',
					text1: 'Error',
					text2: 'Could not open documentation',
					position: 'bottom',
				});
			}
		} catch (error) {
			
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Could not open documentation',
				position: 'bottom',
			});
		}
	};

	const contactOptions = [
		{
			id: "email",
			title: "Email Support",
			subtitle: "Get help via email (24-48h response)",
			icon: "mail-outline" as const,
			action: handleEmailSupport,
		},
		{
			id: "discord",
			title: "Discord Community",
			subtitle: "Join our community for real-time help",
			icon: "chatbubbles-outline" as const,
			action: handleDiscordSupport,
		},
		{
			id: "docs",
			title: "Documentation",
			subtitle: "Browse guides and tutorials",
			icon: "document-text-outline" as const,
			action: handleDocumentation,
		},
	];

	const quickActions = [
		{
			id: "reset-tutorial",
			title: "Reset Tutorial",
			subtitle: "Show onboarding screens again",
			icon: "refresh-outline" as const,
			action: () => Toast.show({
				type: 'info',
				text1: 'Coming Soon',
				text2: 'Tutorial reset will be available soon!',
				position: 'bottom',
			}),
		},
		{
			id: "report-bug",
			title: "Report Bug",
			subtitle: "Help us improve ProofPay",
			icon: "bug-outline" as const,
			action: () => Toast.show({
				type: 'info',
				text1: 'Bug Report',
				text2: 'Please use email or Discord to report bugs with detailed steps to reproduce.',
				position: 'bottom',
			}),
		},
		{
			id: "feature-request",
			title: "Request Feature",
			subtitle: "Suggest new features",
			icon: "bulb-outline" as const,
			action: () => Toast.show({
				type: 'info',
				text1: 'Feature Request',
				text2: "We'd love to hear your ideas! Please share them via email or Discord.",
				position: 'bottom',
			}),
		},
	];

	const renderFAQItem = (faq: FAQItem) => (
		<Pressable
			key={faq.id}
			style={styles.faqItem}
			onPress={() => toggleFAQ(faq.id)}
		>
			<View style={styles.faqHeader}>
				<Text style={styles.faqQuestion}>{faq.question}</Text>
				<Ionicons
					name={faq.expanded ? "chevron-up" : "chevron-down"}
					size={20}
					color={colors.text.secondary}
				/>
			</View>
			{faq.expanded && (
				<View style={styles.faqAnswer}>
					<Text style={styles.faqAnswerText}>{faq.answer}</Text>
				</View>
			)}
		</Pressable>
	);

	const renderMenuItem = (item: any) => (
		<Pressable
			key={item.id}
			style={styles.menuItem}
			onPress={item.action}
			android_ripple={{
				color: DesignSystem.colors.primary[100],
			}}
		>
			{({ pressed }) => (
				<View
					style={[styles.menuItemContent, pressed && styles.menuItemPressed]}
				>
					<View style={styles.menuItemLeft}>
						<View style={styles.menuIconContainer}>
							<Ionicons
								name={item.icon}
								size={20}
								color={colors.primary[700]}
							/>
						</View>
						<View style={styles.menuTextContainer}>
							<Text style={styles.menuItemTitle}>{item.title}</Text>
							<Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
						</View>
					</View>
					<Ionicons
						name="chevron-forward"
						size={20}
						color={colors.text.tertiary}
					/>
				</View>
			)}
		</Pressable>
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable 
					style={styles.backButton} 
					onPress={() => router.back()}
				>
					<Ionicons name="arrow-back" size={24} color={colors.text.primary} />
				</Pressable>
				<Text style={styles.title}>Help Center</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Welcome Section */}
				<View style={styles.welcomeSection}>
					<View style={styles.welcomeIcon}>
						<Ionicons name="help-circle" size={48} color={colors.primary[700]} />
					</View>
					<Text style={styles.welcomeTitle}>How can we help you?</Text>
					<Text style={styles.welcomeSubtitle}>
						Find answers to common questions or get in touch with our support team
					</Text>
				</View>

				{/* Contact Options */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Get Support</Text>
					<View style={styles.menuContainer}>
						{contactOptions.map(renderMenuItem)}
					</View>
				</View>

				{/* FAQ Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
					<View style={styles.faqContainer}>
						{faqs.map(renderFAQItem)}
					</View>
				</View>

				{/* Quick Actions */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Quick Actions</Text>
					<View style={styles.menuContainer}>
						{quickActions.map(renderMenuItem)}
					</View>
				</View>

				{/* App Info */}
				<View style={styles.infoSection}>
					<Text style={styles.infoTitle}>ProofPay v1.0.0</Text>
					<Text style={styles.infoText}>
						Built with ❤️ for the decentralized web. ProofPay uses zero-knowledge proofs to enable secure, private task verification.
					</Text>
				</View>

				{/* Bottom Spacer */}
				<View style={styles.bottomSpacer} />
			</ScrollView>
		</SafeAreaView>
	);
}

const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.surface.primary,
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingHorizontal: DesignSystem.spacing.xl,
			paddingVertical: DesignSystem.spacing.lg,
			borderBottomWidth: 1,
			borderBottomColor: colors.border.secondary,
		},
		backButton: {
			width: 40,
			height: 40,
			alignItems: "center",
			justifyContent: "center",
		},
		title: {
			...DesignSystem.typography.h3,
			color: colors.text.primary,
			fontWeight: "600",
		},
		placeholder: {
			width: 40,
		},
		content: {
			flex: 1,
			padding: DesignSystem.spacing.xl,
		},
		welcomeSection: {
			alignItems: "center",
			paddingVertical: DesignSystem.spacing["2xl"],
			marginBottom: DesignSystem.spacing.xl,
		},
		welcomeIcon: {
			width: 80,
			height: 80,
			borderRadius: 40,
			backgroundColor: colors.primary[50] || colors.surface.elevated,
			alignItems: "center",
			justifyContent: "center",
			marginBottom: DesignSystem.spacing.lg,
		},
		welcomeTitle: {
			...DesignSystem.typography.h2,
			color: colors.text.primary,
			textAlign: "center",
			marginBottom: DesignSystem.spacing.sm,
		},
		welcomeSubtitle: {
			...DesignSystem.typography.body.medium,
			color: colors.text.secondary,
			textAlign: "center",
			lineHeight: 22,
		},
		section: {
			marginBottom: DesignSystem.spacing.xl,
		},
		sectionTitle: {
			...DesignSystem.typography.h4,
			color: colors.text.primary,
			marginBottom: DesignSystem.spacing.md,
		},
		menuContainer: {
			backgroundColor: colors.surface.elevated,
			borderRadius: DesignSystem.radius.xl,
			overflow: "hidden",
			...DesignSystem.shadows.sm,
		},
		menuItem: {
			borderBottomWidth: 1,
			borderBottomColor: colors.border.tertiary,
		},
		menuItemContent: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingVertical: DesignSystem.spacing.lg,
			paddingHorizontal: DesignSystem.spacing.xl,
		},
		menuItemPressed: {
			backgroundColor: colors.surface.tertiary,
		},
		menuItemLeft: {
			flexDirection: "row",
			alignItems: "center",
			flex: 1,
		},
		menuIconContainer: {
			width: 32,
			height: 32,
			borderRadius: 16,
			backgroundColor: colors.primary[50] || colors.surface.tertiary,
			alignItems: "center",
			justifyContent: "center",
			marginRight: DesignSystem.spacing.md,
		},
		menuTextContainer: {
			flex: 1,
		},
		menuItemTitle: {
			...DesignSystem.typography.label.large,
			color: colors.text.primary,
			marginBottom: 2,
		},
		menuItemSubtitle: {
			...DesignSystem.typography.body.small,
			color: colors.text.secondary,
		},
		faqContainer: {
			backgroundColor: colors.surface.elevated,
			borderRadius: DesignSystem.radius.xl,
			overflow: "hidden",
			...DesignSystem.shadows.sm,
		},
		faqItem: {
			borderBottomWidth: 1,
			borderBottomColor: colors.border.tertiary,
		},
		faqHeader: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingVertical: DesignSystem.spacing.lg,
			paddingHorizontal: DesignSystem.spacing.xl,
		},
		faqQuestion: {
			...DesignSystem.typography.label.large,
			color: colors.text.primary,
			flex: 1,
			marginRight: DesignSystem.spacing.md,
		},
		faqAnswer: {
			paddingHorizontal: DesignSystem.spacing.xl,
			paddingBottom: DesignSystem.spacing.lg,
		},
		faqAnswerText: {
			...DesignSystem.typography.body.medium,
			color: colors.text.secondary,
			lineHeight: 20,
		},
		infoSection: {
			alignItems: "center",
			paddingVertical: DesignSystem.spacing.xl,
			borderTopWidth: 1,
			borderTopColor: colors.border.tertiary,
			marginTop: DesignSystem.spacing.xl,
		},
		infoTitle: {
			...DesignSystem.typography.label.large,
			color: colors.text.primary,
			fontWeight: "600",
			marginBottom: DesignSystem.spacing.sm,
		},
		infoText: {
			...DesignSystem.typography.body.medium,
			color: colors.text.secondary,
			textAlign: "center",
			lineHeight: 20,
		},
		bottomSpacer: {
			height: 100,
		},
	});
// Complete Design System - Matching Onboarding Sophistication
export const DesignSystem = {
	// Colors - Professional Palette
	colors: {
		// Primary Colors
		primary: {
			900: "#0F0F0F",
			800: "#191919",
			700: "#262626",
			600: "#404040",
			500: "#525252",
			400: "#737373",
			300: "#A3A3A3",
			200: "#D4D4D4",
			100: "#F5F5F5",
			50: "#FAFAFA",
		},

		// Surface Colors
		surface: {
			primary: "#FFFFFF",
			secondary: "#FAFAFA",
			tertiary: "#F5F5F5",
			elevated: "#FFFFFF",
			overlay: "rgba(0, 0, 0, 0.5)",
		},

		// Text Colors
		text: {
			primary: "#0F0F0F",
			secondary: "#525252",
			tertiary: "#737373",
			disabled: "#A3A3A3",
			inverse: "#FFFFFF",
		},

		// Status Colors
		status: {
			success: "#059669",
			warning: "#D97706",
			error: "#DC2626",
			info: "#2563EB",
		},

		// Border Colors
		border: {
			primary: "#E5E5E5",
			secondary: "#F0F0F0",
			tertiary: "#F5F5F5",
			focus: "#191919",
		},
	},

	// Typography - Professional Hierarchy
	typography: {
		// Display Text
		display: {
			fontSize: 48,
			lineHeight: 56,
			fontWeight: "800" as const,
			letterSpacing: -1.2,
		},

		// Headings
		h1: {
			fontSize: 32,
			lineHeight: 40,
			fontWeight: "700" as const,
			letterSpacing: -0.8,
		},
		h2: {
			fontSize: 24,
			lineHeight: 32,
			fontWeight: "700" as const,
			letterSpacing: -0.4,
		},
		h3: {
			fontSize: 20,
			lineHeight: 28,
			fontWeight: "600" as const,
			letterSpacing: -0.2,
		},
		h4: {
			fontSize: 18,
			lineHeight: 24,
			fontWeight: "600" as const,
			letterSpacing: 0,
		},

		// Body Text
		body: {
			large: {
				fontSize: 18,
				lineHeight: 28,
				fontWeight: "400" as const,
				letterSpacing: 0,
			},
			medium: {
				fontSize: 16,
				lineHeight: 24,
				fontWeight: "400" as const,
				letterSpacing: 0,
			},
			small: {
				fontSize: 14,
				lineHeight: 20,
				fontWeight: "400" as const,
				letterSpacing: 0,
			},
		},

		// Labels
		label: {
			large: {
				fontSize: 16,
				lineHeight: 20,
				fontWeight: "500" as const,
				letterSpacing: 0.1,
			},
			medium: {
				fontSize: 14,
				lineHeight: 18,
				fontWeight: "500" as const,
				letterSpacing: 0.1,
			},
			small: {
				fontSize: 12,
				lineHeight: 16,
				fontWeight: "500" as const,
				letterSpacing: 0.2,
			},
		},

		// Captions
		caption: {
			fontSize: 12,
			lineHeight: 16,
			fontWeight: "400" as const,
			letterSpacing: 0.4,
		},
	},

	// Spacing - Consistent Scale
	spacing: {
		xs: 4,
		sm: 8,
		md: 12,
		lg: 16,
		xl: 20,
		"2xl": 24,
		"3xl": 32,
		"4xl": 40,
		"5xl": 48,
		"6xl": 64,
		"7xl": 80,
		"8xl": 96,
	},

	// Shadows - Sophisticated Elevation
	shadows: {
		none: {
			shadowColor: "transparent",
			shadowOffset: { width: 0, height: 0 },
			shadowOpacity: 0,
			shadowRadius: 0,
			elevation: 0,
		},
		sm: {
			shadowColor: "#000000",
			shadowOffset: { width: 0, height: 1 },
			shadowOpacity: 0.05,
			shadowRadius: 2,
			elevation: 1,
		},
		md: {
			shadowColor: "#000000",
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.06,
			shadowRadius: 8,
			elevation: 3,
		},
		lg: {
			shadowColor: "#000000",
			shadowOffset: { width: 0, height: 8 },
			shadowOpacity: 0.08,
			shadowRadius: 16,
			elevation: 5,
		},
		xl: {
			shadowColor: "#000000",
			shadowOffset: { width: 0, height: 12 },
			shadowOpacity: 0.1,
			shadowRadius: 24,
			elevation: 8,
		},
	},

	// Border Radius - Consistent Rounding
	radius: {
		none: 0,
		sm: 6,
		md: 8,
		lg: 12,
		xl: 16,
		"2xl": 20,
		"3xl": 24,
		full: 9999,
	},

	// Layout - Professional Dimensions
	layout: {
		containerPadding: 32,
		cardPadding: 32,
		buttonHeight: 56,
		inputHeight: 56,
		headerHeight: 80,
		footerHeight: 120,
		maxWidth: 768,
	},

	// Animations - Smooth Interactions
	animations: {
		fast: 150,
		normal: 250,
		slow: 350,
		easing: {
			ease: "cubic-bezier(0.4, 0, 0.2, 1)",
			easeIn: "cubic-bezier(0.4, 0, 1, 1)",
			easeOut: "cubic-bezier(0, 0, 0.2, 1)",
			easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
		},
	},
};

// Component Variants - Reusable Styles
export const ComponentVariants = {
	// Button Variants
	button: {
		primary: {
			backgroundColor: DesignSystem.colors.primary[800],
			color: DesignSystem.colors.text.inverse,
			...DesignSystem.shadows.md,
		},
		secondary: {
			backgroundColor: DesignSystem.colors.surface.primary,
			color: DesignSystem.colors.text.primary,
			borderWidth: 1,
			borderColor: DesignSystem.colors.border.primary,
			...DesignSystem.shadows.sm,
		},
		ghost: {
			backgroundColor: "transparent",
			color: DesignSystem.colors.text.secondary,
		},
	},

	// Card Variants
	card: {
		elevated: {
			backgroundColor: DesignSystem.colors.surface.elevated,
			borderRadius: DesignSystem.radius.xl,
			padding: DesignSystem.layout.cardPadding,
			...DesignSystem.shadows.md,
			borderWidth: 1,
			borderColor: DesignSystem.colors.border.secondary,
		},
		flat: {
			backgroundColor: DesignSystem.colors.surface.secondary,
			borderRadius: DesignSystem.radius.lg,
			padding: DesignSystem.spacing["2xl"],
			borderWidth: 1,
			borderColor: DesignSystem.colors.border.tertiary,
		},
	},

	// Input Variants
	input: {
		default: {
			backgroundColor: DesignSystem.colors.surface.secondary,
			borderWidth: 1,
			borderColor: DesignSystem.colors.border.primary,
			borderRadius: DesignSystem.radius.lg,
			padding: DesignSystem.spacing.xl,
			fontSize: DesignSystem.typography.body.medium.fontSize,
			color: DesignSystem.colors.text.primary,
		},
	},
};

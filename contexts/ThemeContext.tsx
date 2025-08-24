import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DesignSystem } from "@/constants/DesignSystem";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: typeof lightColors;
}

const lightColors = {
  primary: DesignSystem.colors.primary,
  surface: {
    primary: "#FFFFFF",
    secondary: "#FAFAFA", 
    tertiary: "#F5F5F5",
    elevated: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  text: {
    primary: "#0F0F0F",
    secondary: "#525252",
    tertiary: "#737373",
    disabled: "#A3A3A3",
    inverse: "#FFFFFF",
  },
  border: {
    primary: "#E5E5E5",
    secondary: "#F0F0F0", 
    tertiary: "#F5F5F5",
    focus: "#191919",
  },
  status: DesignSystem.colors.status,
};

const darkColors = {
  primary: {
    900: "#FAFAFA",
    800: "#F5F5F5", 
    700: "#D4D4D4",
    600: "#A3A3A3",
    500: "#737373",
    400: "#525252",
    300: "#404040",
    200: "#262626",
    100: "#191919",
    50: "#0F0F0F",
  },
  surface: {
    primary: "#0F0F0F",
    secondary: "#191919",
    tertiary: "#262626",
    elevated: "#191919",
    overlay: "rgba(255, 255, 255, 0.1)",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#D4D4D4",
    tertiary: "#A3A3A3",
    disabled: "#525252",
    inverse: "#0F0F0F",
  },
  border: {
    primary: "#262626",
    secondary: "#191919",
    tertiary: "#191919",
    focus: "#F5F5F5",
  },
  status: DesignSystem.colors.status,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@proofpay_dark_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored !== null) {
          setIsDarkMode(JSON.parse(stored));
        }
      } catch (error) {
        
      }
    };
    loadTheme();
  }, []);

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newValue));
    } catch (error) {
      
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
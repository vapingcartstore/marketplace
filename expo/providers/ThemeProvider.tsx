import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

interface Colors {
  primary: string;
  primaryDark: string;
  accent: string;
  secondary: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

interface ThemeContextType {
  isDark: boolean;
  colors: Colors;
  toggleTheme: () => void;
}

const lightColors: Colors = {
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  accent: "#10B981",
  secondary: "#F59E0B",
  error: "#DC2626",
  background: "#FFFFFF",
  surface: "#F3F4F6",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
};

const darkColors: Colors = {
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  accent: "#34D399",
  secondary: "#FBBF24",
  error: "#EF4444",
  background: "#111827",
  surface: "#1F2937",
  text: "#F9FAFB",
  textSecondary: "#9CA3AF",
  border: "#374151",
};

export const [ThemeProvider, useTheme] = createContextHook<ThemeContextType>(() => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem("theme");
        if (stored) {
          setIsDark(stored === "dark");
        } else {
          setIsDark(systemColorScheme === "dark");
        }
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load theme:", error);
        setIsDark(systemColorScheme === "dark");
        setIsLoaded(true);
      }
    };

    if (!isLoaded) {
      loadTheme();
    }
  }, [systemColorScheme, isLoaded]);

  const toggleTheme = useCallback(async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }, [isDark]);

  const colors = useMemo(() => isDark ? darkColors : lightColors, [isDark]);

  return useMemo(() => ({
    isDark,
    colors,
    toggleTheme,
  }), [isDark, colors, toggleTheme]);
});
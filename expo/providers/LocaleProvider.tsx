import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";

type Locale = "en" | "fr";

interface LocaleContextType {
  locale: Locale;
  t: (key: string) => string;
  toggleLocale: () => void;
}

const translations = { en, fr };

export const [LocaleProvider, useLocale] = createContextHook<LocaleContextType>(() => {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    loadLocale();
  }, []);

  const loadLocale = async () => {
    try {
      const stored = await AsyncStorage.getItem("locale");
      if (stored) {
        setLocale(stored as Locale);
      } else {
        const locales = getLocales();
        const deviceLocale = locales[0]?.languageCode || "en";
        const defaultLocale = deviceLocale.startsWith("fr") ? "fr" : "en";
        setLocale(defaultLocale);
      }
    } catch (error) {
      console.error("Failed to load locale:", error);
    }
  };

  const toggleLocale = useCallback(async () => {
    const newLocale = locale === "en" ? "fr" : "en";
    setLocale(newLocale);
    await AsyncStorage.setItem("locale", newLocale);
    // Clear listings to force regeneration with new locale
    await AsyncStorage.removeItem("listings");
  }, [locale]);

  const t = useCallback((key: string): string => {
    return translations[locale][key as keyof typeof en] || key;
  }, [locale]);

  return useMemo(() => ({
    locale,
    t,
    toggleLocale,
  }), [locale, t, toggleLocale]);
});
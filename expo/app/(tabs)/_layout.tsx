import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Platform } from "react-native";

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === "ios" ? 0 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 64,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("search"),
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t("sell"),
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (user?.isGuest) {
              e.preventDefault();
              logout(); // Clear guest session first
              router.replace("/(auth)/login");
            }
          },
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: t("chats"),
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (user?.isGuest) {
              e.preventDefault();
              logout(); // Clear guest session first
              router.replace("/(auth)/login");
            }
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />

    </Tabs>
  );
}
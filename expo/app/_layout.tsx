import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/providers/AuthProvider";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ListingsProvider } from "@/providers/ListingsProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import { LocationProvider } from "@/providers/LocationProvider";
import { OnboardingProvider, useOnboarding } from "@/providers/OnboardingProvider";
import { ShopfrontProvider } from "@/providers/ShopfrontProvider";
import { NotificationsProvider } from "@/providers/NotificationsProvider";

// Prevent auto hide with error handling
try {
  SplashScreen.preventAutoHideAsync().catch((error) => {
    console.warn('Error preventing splash screen auto hide:', error);
  });
} catch (e) {
  console.warn('Error in splash screen initialization:', e);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function RootLayoutNav() {
  // Onboarding has been removed
  const { isLoading } = useOnboarding();
  
  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      {/* Onboarding screens have been removed */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="chat/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="admin" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ presentation: "card" }} />
      <Stack.Screen name="notifications" options={{ presentation: "card" }} />
      <Stack.Screen name="shopfront/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="shopfront-editor" options={{ presentation: "card" }} />
      <Stack.Screen name="my-shopfronts" options={{ presentation: "card" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen immediately
    try {
      SplashScreen.hideAsync().catch((error) => {
        console.warn('Error hiding splash screen:', error);
      });
    } catch (e) {
      console.warn('Error in splash screen hide:', e);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LocaleProvider>
          <ThemeProvider>
            <AuthProvider>
              <ListingsProvider>
                <LocationProvider>
                  <ChatProvider>
                  <ShopfrontProvider>
                    <NotificationsProvider>
                      <OnboardingProvider>
                        <RootLayoutNav />
                      </OnboardingProvider>
                    </NotificationsProvider>
                  </ShopfrontProvider>
                </ChatProvider>
                </LocationProvider>
              </ListingsProvider>
            </AuthProvider>
          </ThemeProvider>
        </LocaleProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
import createContextHook from "@nkzw/create-context-hook";
import { useMemo } from "react";

interface OnboardingContextType {
  isOnboardingCompleted: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>; // For testing purposes
}

// Simplified OnboardingProvider that doesn't cause delays
export const [OnboardingProvider, useOnboarding] = createContextHook<OnboardingContextType>(() => {
  // Always return completed onboarding status with no loading state
  return useMemo(() => ({
    isOnboardingCompleted: true,
    isLoading: false,
    completeOnboarding: async () => Promise.resolve(),
    resetOnboarding: async () => Promise.resolve(),
  }), []);
});
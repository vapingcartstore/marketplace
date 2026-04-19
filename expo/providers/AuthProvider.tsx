import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ShopfrontData {
  id: string;
  enabled: boolean;
  isShopfront?: boolean;
  brandName?: string;
  logoImage?: string | null;
  bannerImage?: string | null;
  about?: string;
  shopAddress?: string;
  shopPhone?: string;
  website?: string;
  email?: string;
  fullAddress?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
  hours?: {
    mon?: { closed?: boolean, open?: string, close?: string };
    tue?: { closed?: boolean, open?: string, close?: string };
    wed?: { closed?: boolean, open?: string, close?: string };
    thu?: { closed?: boolean, open?: string, close?: string };
    fri?: { closed?: boolean, open?: string, close?: string };
    sat?: { closed?: boolean, open?: string, close?: string };
    sun?: { closed?: boolean, open?: string, close?: string };
  };
  shopVerifiedLevel?: "none" | "phone" | "full";
  rating?: number;
  category?: string;
  createdAt?: Date;
}

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar: string | null;
  region?: string;
  isGuest: boolean;
  phoneVerified?: boolean;
  idVerified?: boolean;
  verificationLevel?: 'none' | 'phone' | 'full';
  isVerified?: boolean;
  // Main shopfront data (for backward compatibility)
  shopfrontData?: ShopfrontData;
  // Multiple shopfronts
  shopfronts?: ShopfrontData[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
        } catch (parseError) {
          console.error("Failed to parse user data:", parseError);
          // Clear corrupted data
          await AsyncStorage.removeItem("user");
        }
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      // Ensure loading state is always set to false
      setIsLoading(false);
    }
  };

  const login = useCallback(async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const loginAsGuest = useCallback(() => {
    const guestUser: User = {
      id: "guest",
      name: "Guest User",
      phone: "",
      avatar: null,
      isGuest: true,
    };
    setUser(guestUser);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    if (!user.isGuest) {
      await AsyncStorage.setItem("user", JSON.stringify(updated));
    }
  }, [user]);

  return useMemo(() => ({
    user,
    isLoading,
    login,
    loginAsGuest,
    logout,
    updateProfile,
  }), [user, isLoading, login, loginAsGuest, logout, updateProfile]);
});
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/providers/ThemeProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { useListings } from "@/providers/ListingsProvider";
import { Star, Shield, Phone } from "lucide-react-native";
import { generateMockShops, MockShop } from "@/services/mockData";

const { width } = Dimensions.get("window");
const SHOP_CARD_WIDTH = width * 0.7;

export function FeaturedShopsCarousel() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const { selectedRegion } = useListings();
  const [featuredShops, setFeaturedShops] = useState<MockShop[]>([]);

  const loadShops = useCallback(async () => {
    try {
      const currentRegion = selectedRegion || await AsyncStorage.getItem('selectedRegion');
      const storageKey = currentRegion ? `shops_${currentRegion}` : "shops";
      
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFeaturedShops(parsed.slice(0, 5)); // Show top 5 shops
      } else {
        const mockShops = await generateMockShops(8, currentRegion);
        setFeaturedShops(mockShops.slice(0, 5));
        await AsyncStorage.setItem(storageKey, JSON.stringify(mockShops));
      }
    } catch (error) {
      console.error("Failed to load shops:", error);
    }
  }, [selectedRegion]);

  // Load shops based on selected region
  useEffect(() => {
    loadShops();
  }, [loadShops]);

  if (featuredShops.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("featuredShops")}
        </Text>
        <TouchableOpacity onPress={() => console.log("View all shops")}>
          <Text style={[styles.viewAll, { color: colors.primary }]}>
            {t("all")}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {featuredShops.map((shop) => (
          <TouchableOpacity
            key={shop.id}
            style={[
              styles.shopCard,
              { backgroundColor: colors.surface, width: SHOP_CARD_WIDTH },
            ]}
            onPress={() => router.push(`/shopfront/${shop.id}`)}
          >
            <View style={styles.bannerContainer}>
              <Image source={{ uri: shop.banner }} style={styles.banner} />
              <View style={styles.logoContainer}>
                <Image source={{ uri: shop.logo }} style={styles.logo} />
              </View>
            </View>
            
            <View style={styles.shopInfo}>
              <View style={styles.shopHeader}>
                <Text style={[styles.shopName, { color: colors.text }]} numberOfLines={1}>
                  {shop.brandName}
                </Text>
                {shop.verificationLevel === "full" && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.accent }]}>
                    <Shield color="#fff" size={12} />
                  </View>
                )}
                {shop.verificationLevel === "phone" && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.secondary }]}>
                    <Phone color="#fff" size={12} />
                  </View>
                )}
              </View>
              
              <View style={styles.ratingRow}>
                <Star color={colors.primary} size={14} fill={colors.primary} />
                <Text style={[styles.rating, { color: colors.text }]}>
                  {shop.rating}
                </Text>
                <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                  ({shop.reviewCount})
                </Text>
              </View>
              
              <Text style={[styles.category, { color: colors.textSecondary }]}>
                {shop.category} • {shop.listingCount} {t("activeListings")}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  shopCard: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bannerContainer: {
    position: "relative",
    height: 80,
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  logoContainer: {
    position: "absolute",
    bottom: -20,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  shopInfo: {
    padding: 12,
    paddingTop: 24,
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewCount: {
    fontSize: 12,
  },
  category: {
    fontSize: 12,
  },
});
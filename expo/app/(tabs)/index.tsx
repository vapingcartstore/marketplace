import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useListings } from "@/providers/ListingsProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useLocation } from "@/providers/LocationProvider";
import { useNotifications } from "@/providers/NotificationsProvider";
import { Search, Bell, MapPin, Camera } from "lucide-react-native";
import { CATEGORIES } from "@/constants/categories";
import { REGIONS } from "@/constants/regions";
import { ListingCard } from "@/components/ListingCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { FeaturedShopsCarousel } from "@/components/FeaturedShopsCarousel";
import { PopularCategoriesGrid } from "@/components/PopularCategoriesGrid";
import { AdsCarousel } from "@/components/AdsCarousel";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 3;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { listings, featuredListings, loadMore, refresh, isLoading, selectedRegion: providerSelectedRegion } = useListings();
  const { location } = useLocation();
  const { unreadCount } = useNotifications();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(providerSelectedRegion);
  
  // Sync with provider's selected region
  useEffect(() => {
    setSelectedRegion(providerSelectedRegion);
  }, [providerSelectedRegion]);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Force refresh listings to generate new data with updated properties
  const forceRefresh = useCallback(async () => {
    try {
      // Clear listings to force regeneration
      await AsyncStorage.removeItem('listings');
      const currentRegion = await AsyncStorage.getItem('selectedRegion');
      if (currentRegion) {
        await AsyncStorage.removeItem(`listings_${currentRegion}`);
      }
      await refresh();
    } catch (error) {
      console.error('Failed to force refresh:', error);
    }
  }, [refresh]);

  // Initial load - force refresh to get listings with new properties
  useEffect(() => {
    forceRefresh();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const filteredListings = listings.filter((l) => {
    // Filter by user's location first (region and city)
    if (location.region) {
      if (l.region !== location.region) {
        return false;
      }
      
      // If user has selected a specific city, filter by city too
      if (location.city && l.city !== location.city) {
        return false;
      }
    }
    
    // Filter by category if selected
    if (selectedCategory && l.category !== selectedCategory) {
      return false;
    }
    
    // Filter by region if selected (and not 'all') - additional filter on top of user location
    if (selectedRegion && selectedRegion !== 'all' && l.region !== selectedRegion) {
      return false;
    }
    
    return true;
  });
  
  // Create sections with listings, ads, and popular categories
  const sections = React.useMemo(() => {
    const result: Array<{ type: 'listings' | 'ads' | 'popularCategories'; data: any; id: string }> = [];
    const listingsPerSection = 6;
    
    // Calculate the position for categories near you - we want it after 6-12 listings
    // This will place it after the first or second section of listings
    const categoriesNearYouPosition = 1; // Position after 1st section (6 listings)
    
    for (let i = 0; i < filteredListings.length; i += listingsPerSection) {
      const sectionIndex = Math.floor(i / listingsPerSection);
      const sectionListings = filteredListings.slice(i, i + listingsPerSection);
      
      result.push({
        type: 'listings',
        data: sectionListings,
        id: `listings-${i}`
      });
      
      // Add ads carousel after each section of listings
      if (sectionIndex > 0 || filteredListings.length <= listingsPerSection) {
        result.push({
          type: 'ads',
          data: null,
          id: `ads-${sectionIndex}`
        });
      }
      
      // Add categories near you after the first section of listings
      if (sectionIndex === categoriesNearYouPosition) {
        result.push({
          type: 'popularCategories',
          data: null,
          id: 'categories-near-you'
        });
      }
    }
    
    // If we don't have enough listings to reach the categories near you position,
    // add it at the end
    if (filteredListings.length <= categoriesNearYouPosition * listingsPerSection && 
        !result.some(item => item.type === 'popularCategories')) {
      result.push({
        type: 'popularCategories',
        data: null,
        id: 'popular-categories'
      });
    }
    
    return result;
  }, [filteredListings]);

  const renderHeader = () => (
    <View>
      <View style={[styles.welcomeHeader, { backgroundColor: colors.background === '#FFFFFF' ? colors.surface : colors.background }, Platform.OS === 'ios' ? styles.shadowIOS : styles.shadowAndroid]}>
        <View style={styles.welcomeContent}>
          <View style={styles.userAvatarContainer}>
            <Text style={styles.userInitials}>{user?.name ? user.name.substring(0, 2).toUpperCase() : 'GU'}</Text>
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.welcomeBack, { color: colors.textSecondary }]}>{t("welcomeBack")}</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || t("guest")}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => router.push("/notifications" as any)}
              testID="notifications-button"
            >
              <View style={styles.notificationIconContainer}>
                <Bell size={24} color={colors.primary} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => setShowRegionModal(true)}
              testID="location-changer-button"
            >
              <View style={styles.locationIconContainer}>
                <MapPin size={24} color={selectedRegion && selectedRegion !== 'all' ? colors.primary : colors.text} />
                {selectedRegion && selectedRegion !== 'all' && (
                  <View style={[styles.locationIndicator, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <HeroCarousel listings={featuredListings} />
      
      {/* AdsCarousel moved to be displayed within listings */}
      
      <FeaturedShopsCarousel />


      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/search" as any)}
        >
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={() => router.push("/camera-search" as any)}
            testID="camera-search-button"
          >
            <Camera color={colors.textSecondary} size={20} />
          </TouchableOpacity>
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary, outlineStyle: 'none' }]}>
            {t("searchPlaceholder")}
          </Text>
          <TouchableOpacity 
            style={styles.searchButtonInside}
            onPress={() => router.push("/search" as any)}
          >
            <Text style={styles.searchButtonTextInside}>Search</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextActive,
              { color: !selectedCategory ? colors.primary : colors.text },
            ]}
          >
            {t("all")}
          </Text>
        </TouchableOpacity>
        {CATEGORIES.slice(0, 8).map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
              { borderColor: colors.border },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive,
                { color: selectedCategory === category.id ? colors.primary : colors.text },
              ]}
            >
              {t(category.nameKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {selectedCategory ? t(CATEGORIES.find(c => c.id === selectedCategory)?.nameKey || "") : t("recentListings")}
          {location.region && (
            <Text style={[styles.regionFilter, { color: colors.primary }]}>
              {" "}{t("in")}{" "}{location.city ? `${location.city}, ${location.region}` : location.region}
            </Text>
          )}
        </Text>
        {!location.region && (
          <Text style={[styles.locationPrompt, { color: colors.textSecondary }]}>
            {t("setLocationToSeeNearbyListings")}
          </Text>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderRegionModal = () => (
    <Modal
      visible={showRegionModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRegionModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowRegionModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("changeLocation")}</Text>
            <TouchableOpacity onPress={() => setShowRegionModal(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={REGIONS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.regionItem, selectedRegion === item.id && styles.selectedRegionItem]}
                onPress={async () => {
                  setSelectedRegion(item.id);
                  // Save selected region to AsyncStorage
                  try {
                    await AsyncStorage.setItem('selectedRegion', item.id);
                    // Trigger refresh to load region-specific data
                    await refresh();
                  } catch (error) {
                    console.error('Failed to save region:', error);
                  }
                  setShowRegionModal(false);
                }}
              >
                <Text 
                  style={[
                    styles.regionItemText, 
                    { color: colors.text },
                    selectedRegion === item.id && { color: colors.primary, fontWeight: '600' }
                  ]}
                >
                  {t(item.nameKey)}
                </Text>
                {selectedRegion === item.id && (
                  <View style={[styles.checkmark, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderRegionModal()}
      <FlatList
        data={sections}
        renderItem={({ item }) => {
          if (item.type === 'popularCategories') {
            return (
              <View style={styles.popularCategoriesWrapper}>
                <PopularCategoriesGrid />
              </View>
            );
          }
          
          if (item.type === 'ads') {
            return (
              <View style={styles.adsWrapper}>
                <AdsCarousel />
              </View>
            );
          }
          
          // Render listings in a 3-column grid
          const listings = item.data;
          const rows: any[][] = [];
          for (let i = 0; i < listings.length; i += 3) {
            rows.push(listings.slice(i, i + 3));
          }
          
          return (
            <View style={styles.listingsSection}>
              {rows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.row}>
                  {row.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} width={CARD_WIDTH} />
                  ))}
                  {/* Fill empty spaces in incomplete rows */}
                  {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, emptyIndex) => (
                    <View key={`empty-${rowIndex}-${emptyIndex}`} style={{ width: CARD_WIDTH }} />
                  ))}
                </View>
              ))}
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shadowAndroid: {
    elevation: 4,
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#00BCD4",
    justifyContent: "center",
    alignItems: "center",
  },
  userInitials: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  welcomeTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeBack: {
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  locationIconContainer: {
    position: 'relative',
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  locationIndicator: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -2,
    right: -2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    outlineStyle: 'none',
  },
  cameraButton: {
    marginRight: 8,
  },
  searchButtonInside: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  searchButtonTextInside: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderColor: "#2563EB",
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryChipTextActive: {
    fontWeight: "600",
  },
  sectionHeader: {
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  regionFilter: {
    fontSize: 16,
    fontWeight: "500",
  },
  locationPrompt: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  regionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedRegionItem: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  regionItemText: {
    fontSize: 16,
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  popularCategoriesWrapper: {
    width: '100%',
    marginVertical: 16,
  },
  adsWrapper: {
    width: '100%',
    marginVertical: 8,
  },
  listingsSection: {
    marginBottom: 8,
  },
});
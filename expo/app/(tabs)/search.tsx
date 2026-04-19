import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useListings, Listing } from "@/providers/ListingsProvider";
import { useLocation } from "@/providers/LocationProvider";
import { Search as SearchIcon, X, MapPin, Filter, Camera, Check } from "lucide-react-native";
import { CATEGORIES } from "@/constants/categories";
import { REGIONS } from "@/constants/regions";
import { ListingCard } from "@/components/ListingCard";

export default function SearchScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const { colors, isDark } = useTheme();
  const { listings, isLoading, refresh } = useListings();
  const { location } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(category || null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [listingType, setListingType] = useState<'all' | 'sale' | 'barter' | 'shopfront'>('all');
  const [showClearButton, setShowClearButton] = useState(false);

  // Set category from URL params on mount
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
      setShowClearButton(true);
    }
  }, [category]);

  // Memoized filtered listings to prevent infinite loops
  const filteredListings = useMemo(() => {
    if (listings.length === 0) {
      return [];
    }
    
    let results = [...listings];
    
    // Filter by user's location first (region and city)
    if (location.region) {
      results = results.filter(listing => listing.region === location.region);
      
      // If user has selected a specific city, filter by city too
      if (location.city) {
        results = results.filter(listing => listing.city === location.city);
      }
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(listing => 
        listing.title.toLowerCase().includes(query) || 
        listing.description.toLowerCase().includes(query) ||
        (listing.tags && listing.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      results = results.filter(listing => listing.category === selectedCategory);
    }
    
    // Filter by region (additional filter on top of user location)
    if (selectedRegion) {
      results = results.filter(listing => listing.region === selectedRegion);
    }
    
    // Filter by price range
    if (priceRange.min && !isNaN(Number(priceRange.min))) {
      results = results.filter(listing => listing.price >= Number(priceRange.min));
    }
    
    if (priceRange.max && !isNaN(Number(priceRange.max))) {
      results = results.filter(listing => listing.price <= Number(priceRange.max));
    }
    
    // Filter by listing type
    if (listingType !== 'all') {
      if (listingType === 'shopfront') {
        results = results.filter(listing => listing.seller?.shopfrontData?.isShopfront);
      } else if (listingType === 'barter') {
        // For barter, only show items with listingType 'barter' and NOT shopfront items
        results = results.filter(listing => 
          listing.listingType === 'barter' && 
          !listing.seller?.shopfrontData?.isShopfront
        );
      } else {
        // For regular listings, only show items with listingType 'sale' and NOT shopfront items
        results = results.filter(listing => 
          listing.listingType === listingType && 
          !listing.seller?.shopfrontData?.isShopfront
        );
      }
    }
    
    console.log(`Filtered listings: ${results.length} items with listingType=${listingType}`);
    return results;
  }, [listings, searchQuery, selectedCategory, selectedRegion, priceRange.min, priceRange.max, location.region, location.city, listingType]);
  
  // Search results for real-time search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    
    let results = [...listings];
    
    // Filter by user's location first
    if (location.region) {
      results = results.filter(listing => listing.region === location.region);
      
      if (location.city) {
        results = results.filter(listing => listing.city === location.city);
      }
    }
    
    // Filter by listing type
    if (listingType !== 'all') {
      if (listingType === 'shopfront') {
        results = results.filter(listing => listing.seller?.shopfrontData?.isShopfront);
      } else if (listingType === 'barter') {
        // For barter, only show items with listingType 'barter' and NOT shopfront items
        results = results.filter(listing => 
          listing.listingType === 'barter' && 
          !listing.seller?.shopfrontData?.isShopfront
        );
      } else {
        // For regular listings, only show items with listingType 'sale' and NOT shopfront items
        results = results.filter(listing => 
          listing.listingType === listingType && 
          !listing.seller?.shopfrontData?.isShopfront
        );
      }
    }
    
    const query = searchQuery.toLowerCase().trim();
    return results.filter(listing => 
      listing.title.toLowerCase().includes(query) || 
      listing.description.toLowerCase().includes(query) ||
      (listing.tags && listing.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }, [listings, searchQuery, location.region, location.city, listingType]);
  
  // Filter listings as user types in search box
  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    setShowClearButton(text.length > 0);
  };
  
  // Refresh listings when component mounts or when listingType changes
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log(`Loading data for listing type: ${listingType}`);
        await refresh();
      } catch (error) {
        console.error('Error refreshing listings:', error);
      }
    };
    
    loadInitialData();
  }, [listingType, refresh]); // Run when listingType changes

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedRegion(null);
    setPriceRange({ min: "", max: "" });
    setListingType('all');
  };

  const dynamicStyles = {
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      position: 'relative' as const,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      outlineStyle: 'none',
    },
    categoryTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.text,
    },
    browseTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 20,
    },
    categoryCard: {
      width: '31%' as const,
      aspectRatio: 1,
      margin: 4,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: 12,
      marginBottom: 10,
      backgroundColor: colors.surface,
    },
    categoryName: {
      fontSize: 12,
      fontWeight: '500' as const,
      textAlign: 'center' as const,
      color: colors.text,
    },
    listingTitle: {
      fontSize: 12,
      color: colors.text,
      marginBottom: 4,
      lineHeight: 16,
    },
    filterModal: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 16,
      paddingBottom: 32,
      maxHeight: '80%' as const,
    },
    filterHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
    },
    filterSectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 12,
    },
    categoryFilterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.border,
      marginRight: 8,
    },
    categoryFilterChipText: {
      color: colors.text,
      fontSize: 14,
    },
    priceInputWrapper: {
      flex: 1,
      backgroundColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    priceInput: {
      color: colors.text,
      fontSize: 14,
      outlineStyle: 'none',
    },
    priceSeparator: {
      color: colors.text,
      marginHorizontal: 12,
      fontSize: 16,
    },
    filterActions: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchHeader}>
        <View style={styles.searchRow}>
          <View style={dynamicStyles.searchInputContainer}>
            {capturedImage ? (
              <TouchableOpacity onPress={() => setCapturedImage(null)}>
                <Image 
                  source={{ uri: capturedImage }} 
                  style={styles.searchImageThumbnail} 
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => router.push('/camera-search' as any)}
                style={styles.cameraButton}
                testID="camera-search-button"
              >
                <Camera color="#9ca3af" size={24} />
              </TouchableOpacity>
            )}
            <TextInput
              style={dynamicStyles.searchInput}
              placeholder="Search for anything..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              onSubmitEditing={() => refresh()}
              returnKeyType="search"
              outlineStyle="none"
            />
            <TouchableOpacity
              onPress={() => {
                // Just trigger a refresh, filtering is handled by useMemo
                refresh();
              }}
              style={styles.searchButtonInside}
              testID="search-button"
            >
              <Text style={styles.searchButtonTextInside}>Search</Text>
            </TouchableOpacity>
          </View>
          {showClearButton && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setShowClearButton(false);
              }}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>
          )}
          {!selectedCategory && searchQuery.length === 0 && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
              testID="filter-button"
            >
              <Filter color="#fff" size={24} />
            </TouchableOpacity>
          )}

        </View>
        
        {/* Listing Type Selector */}
        <View style={styles.listingTypeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.listingTypeButton, listingType === 'all' && styles.listingTypeButtonActive]}
              onPress={() => {
                setListingType('all');
                setSearchQuery("");
              }}
              testID="listing-type-all"
            >
              <Text style={[styles.listingTypeText, listingType === 'all' && styles.listingTypeTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.listingTypeButton, listingType === 'sale' && styles.listingTypeButtonActive]}
              onPress={() => {
                setListingType('sale');
                setSearchQuery("");
              }}
              testID="listing-type-sale"
            >
              <Text style={[styles.listingTypeText, listingType === 'sale' && styles.listingTypeTextActive]}>Listings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.listingTypeButton, listingType === 'barter' && styles.listingTypeButtonActive]}
              onPress={() => {
                setListingType('barter');
                setSearchQuery("");
              }}
              testID="listing-type-barter"
            >
              <Text style={[styles.listingTypeText, listingType === 'barter' && styles.listingTypeTextActive]}>Trade by Barter</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.listingTypeButton, listingType === 'shopfront' && styles.listingTypeButtonActive]}
              onPress={() => {
                setListingType('shopfront');
                setSearchQuery("");
              }}
              testID="listing-type-shopfront"
            >
              <Text style={[styles.listingTypeText, listingType === 'shopfront' && styles.listingTypeTextActive]}>Shopfronts</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      
      {/* Camera Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCamera}
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            facing={cameraFacing}
            ref={cameraRef}
          >
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.cameraCloseButton} 
                onPress={() => setShowCamera(false)}
              >
                <X color="#fff" size={24} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cameraCaptureButton} 
                onPress={async () => {
                  if (cameraRef.current) {
                    try {
                      const photo = await cameraRef.current.takePictureAsync();
                      setCapturedImage(photo.uri);
                      setShowCamera(false);
                      // Here you would typically upload the image for visual search
                      console.log('Photo taken:', photo.uri);
                    } catch (error) {
                      console.error('Error taking picture:', error);
                    }
                  }
                }}
              >
                <View style={styles.captureButtonInner}>
                  <Check color="#fff" size={32} />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cameraFlipButton} 
                onPress={() => setCameraFacing(current => current === 'back' ? 'front' : 'back')}
              >
                <Camera color="#fff" size={24} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilters}
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowFilters(false)}
        >
          <View 
            style={dynamicStyles.filterModal}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={dynamicStyles.filterHeader}>
              <Text style={dynamicStyles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X color="#fff" size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterContent}>
              {/* Listing Type Filter */}
              <View style={styles.filterSection}>
                <Text style={dynamicStyles.filterSectionTitle}>Listing Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  <TouchableOpacity 
                    style={[
                      dynamicStyles.categoryFilterChip,
                      listingType === 'all' && styles.categoryFilterChipSelected
                    ]}
                    onPress={() => setListingType('all')}
                  >
                    <Text style={[
                      dynamicStyles.categoryFilterChipText,
                      listingType === 'all' && styles.categoryFilterChipTextSelected
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      dynamicStyles.categoryFilterChip,
                      listingType === 'sale' && styles.categoryFilterChipSelected
                    ]}
                    onPress={() => setListingType('sale')}
                  >
                    <Text style={[
                      dynamicStyles.categoryFilterChipText,
                      listingType === 'sale' && styles.categoryFilterChipTextSelected
                    ]}>
                      Listings
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      dynamicStyles.categoryFilterChip,
                      listingType === 'barter' && styles.categoryFilterChipSelected
                    ]}
                    onPress={() => setListingType('barter')}
                  >
                    <Text style={[
                      dynamicStyles.categoryFilterChipText,
                      listingType === 'barter' && styles.categoryFilterChipTextSelected
                    ]}>
                      Trade by Barter
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      dynamicStyles.categoryFilterChip,
                      listingType === 'shopfront' && styles.categoryFilterChipSelected
                    ]}
                    onPress={() => setListingType('shopfront')}
                  >
                    <Text style={[
                      dynamicStyles.categoryFilterChipText,
                      listingType === 'shopfront' && styles.categoryFilterChipTextSelected
                    ]}>
                      Shopfronts
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
              
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={dynamicStyles.filterSectionTitle}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity 
                      key={category.id}
                      style={[
                        dynamicStyles.categoryFilterChip,
                        selectedCategory === category.id && styles.categoryFilterChipSelected
                      ]}
                      onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                    >
                      <Text style={[
                        dynamicStyles.categoryFilterChipText,
                        selectedCategory === category.id && styles.categoryFilterChipTextSelected
                      ]}>
                        {t(category.nameKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Region Filter */}
              <View style={styles.filterSection}>
                <Text style={dynamicStyles.filterSectionTitle}>Region</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {REGIONS.map((region) => (
                    <TouchableOpacity 
                      key={region.id}
                      style={[
                        dynamicStyles.categoryFilterChip,
                        selectedRegion === region.id && styles.categoryFilterChipSelected
                      ]}
                      onPress={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
                    >
                      <Text style={[
                        dynamicStyles.categoryFilterChipText,
                        selectedRegion === region.id && styles.categoryFilterChipTextSelected
                      ]}>
                        {t(region.nameKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={dynamicStyles.filterSectionTitle}>Price Range (XAF)</Text>
                <View style={styles.priceInputContainer}>
                  <View style={dynamicStyles.priceInputWrapper}>
                    <TextInput
                      style={dynamicStyles.priceInput}
                      placeholder="Min"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={priceRange.min}
                      onChangeText={(text) => setPriceRange({...priceRange, min: text})}
                      outlineStyle="none"
                    />
                  </View>
                  <Text style={dynamicStyles.priceSeparator}>-</Text>
                  <View style={dynamicStyles.priceInputWrapper}>
                    <TextInput
                      style={dynamicStyles.priceInput}
                      placeholder="Max"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={priceRange.max}
                      onChangeText={(text) => setPriceRange({...priceRange, max: text})}
                      outlineStyle="none"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
            
            <View style={dynamicStyles.filterActions}>
              <TouchableOpacity 
                style={styles.clearFiltersButton} 
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyFiltersButton} 
                onPress={() => {
                  setShowFilters(false);
                }}
              >
                <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {selectedCategory && (
        <View style={styles.categoryHeader}>
          <Text style={dynamicStyles.categoryTitle}>
            {CATEGORIES.find(cat => cat.id === selectedCategory)?.nameKey ? 
              t(CATEGORIES.find(cat => cat.id === selectedCategory)!.nameKey) : 
              selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
          </Text>
          {location.region && (
            <View style={styles.locationInfo}>
              <MapPin color={colors.textSecondary} size={16} />
              <Text style={[styles.locationInfoText, { color: colors.textSecondary }]}>
                {location.city ? `${location.city}, ${location.region}` : location.region}
              </Text>
            </View>
          )}
        </View>
      )}

      {searchQuery.trim() && searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <View style={styles.listingCard}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.images[0] }} 
                  style={styles.listingImage} 
                />
                {item.listingType === 'barter' && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>BARTER</Text>
                  </View>
                )}
                {item.seller?.shopfrontData?.isShopfront && (
                  <View style={[styles.badgeContainer, styles.shopBadge]}>
                    <Text style={styles.badgeText}>SHOPFRONT</Text>
                  </View>
                )}
              </View>
              <View style={styles.listingDetails}>
                <Text style={styles.listingPrice}>
                  {item.listingType === 'barter' && item.offerEstimatedValue 
                    ? `${item.offerEstimatedValue.toLocaleString()} XAF` 
                    : `${item.price.toLocaleString()} XAF`}
                </Text>
                <Text style={dynamicStyles.listingTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.locationContainer}>
                  <MapPin color="#9ca3af" size={12} />
                  <Text style={styles.locationText}>{item.city}</Text>
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.listingsGrid}
          columnWrapperStyle={styles.listingsRow}
          showsVerticalScrollIndicator={false}
        />
      ) : selectedCategory || listingType !== 'all' ? (
        <FlatList
          data={filteredListings}
          renderItem={({ item }) => (
            <View style={styles.listingCard}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.images[0] }} 
                  style={styles.listingImage} 
                />
                {item.listingType === 'barter' && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>BARTER</Text>
                  </View>
                )}
                {item.seller?.shopfrontData?.isShopfront && (
                  <View style={[styles.badgeContainer, styles.shopBadge]}>
                    <Text style={styles.badgeText}>SHOPFRONT</Text>
                  </View>
                )}
              </View>
              <View style={styles.listingDetails}>
                <Text style={styles.listingPrice}>
                  {item.listingType === 'barter' && item.offerEstimatedValue 
                    ? `${item.offerEstimatedValue.toLocaleString()} XAF` 
                    : `${item.price.toLocaleString()} XAF`}
                </Text>
                <Text style={dynamicStyles.listingTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.locationContainer}>
                  <MapPin color="#9ca3af" size={12} />
                  <Text style={styles.locationText}>{item.city}</Text>
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.listingsGrid}
          columnWrapperStyle={styles.listingsRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {location.region ? 
                  `No listings found in ${location.city ? `${location.city}, ${location.region}` : location.region}` :
                  'No listings found. Please set your location to see nearby listings.'}
              </Text>
              {!location.region && (
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                  Go to Profile → Settings to set your location
                </Text>
              )}
            </View>
          }
        />
      ) : (
        <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
          <Text style={dynamicStyles.browseTitle}>Browse Categories</Text>
          <View style={styles.categoryGridContainer}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={dynamicStyles.categoryCard}
                onPress={() => {
                  setSelectedCategory(item.id);
                  setShowClearButton(true);
                }}
              >
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text style={dynamicStyles.categoryName}>
                  {t(item.nameKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraButton: {
    marginRight: 8,
  },
  searchImageThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cameraCloseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCaptureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFlipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  searchHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  listingTypeContainer: {
    marginBottom: 8,
  },
  listingTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    marginRight: 8,
  },
  listingTypeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  listingTypeText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  listingTypeTextActive: {
    color: '#ffffff',
    fontWeight: '600',
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
  filterButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationInfoText: {
    fontSize: 14,
    fontWeight: '500',
  },

  categoriesContainer: {
    flex: 1,
    padding: 16,
  },

  categoryGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },

  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },

  listingsGrid: {
    padding: 16,
  },
  listingsRow: {
    justifyContent: 'space-between',
  },
  listingCard: {
    width: '31%',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shopBadge: {
    backgroundColor: '#3b82f6',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listingDetails: {
    paddingHorizontal: 4,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },

  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  categoryFilterChipSelected: {
    backgroundColor: '#3b82f6',
  },

  categoryFilterChipTextSelected: {
    fontWeight: '600',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  clearFiltersButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  clearFiltersButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  applyFiltersButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  applyFiltersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
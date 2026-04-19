import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useListings, User } from "@/providers/ListingsProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Star,
  Share2,
  MessageCircle,
  Settings,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { VerificationBadge } from "@/components/VerificationBadge";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES } from "@/constants/categories";

// Get screen width for responsive layout
const screenWidth = Dimensions.get("window").width;

export default function ShopfrontScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { listings, getSeller } = useListings();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [sellerListings, setSellerListings] = useState<any[]>([]);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');

  useEffect(() => {
    if (id) {
      // SWAP WITH BACKEND HERE
      // Mock seller data
      const mockSeller = getSeller(id);
      setSeller(mockSeller);

      // Get seller's listings
      const filteredListings = listings.filter(
        (listing) => listing.userId === id
      );
      setSellerListings(filteredListings);
    }
  }, [id, listings, getSeller]);

  let filteredListings = selectedCategory
    ? sellerListings.filter((listing) => listing.category === selectedCategory)
    : sellerListings;

  // Apply sorting
  filteredListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'priceAsc':
        return a.price - b.price;
      case 'priceDesc':
        return b.price - a.price;
      case 'newest':
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  // Get current day for working hours
  const getCurrentDay = () => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[new Date().getDay()];
  };

  const isShopOpen = () => {
    if (!seller?.shopfrontData?.hours) return null;
    const currentDay = getCurrentDay();
    const todayHours = seller.shopfrontData.hours[currentDay as keyof typeof seller.shopfrontData.hours];
    if (!todayHours || todayHours.closed) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return todayHours.open && todayHours.close && currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  const copyToClipboard = (text: string) => {
    // In a real app, you would use Clipboard.setString(text)
    console.log('Copied to clipboard:', text);
  };

  const openExternalLink = (url: string) => {
    // In a real app, you would use Linking.openURL(url)
    console.log('Opening external link:', url);
  };

  const callPhone = (phone: string) => {
    // In a real app, you would use Linking.openURL(`tel:${phone}`)
    console.log('Calling phone:', phone);
  };

  if (!seller) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t("loading")}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: seller.name,
          headerShown: true,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {user?.id === id && (
                <TouchableOpacity onPress={() => router.push('/shopfront-editor')}>
                  <Settings color={colors.text} size={24} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => console.log("Share shop")}>
                <Share2 color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Shop Banner */}
          <View style={styles.bannerContainer}>
            <Image
              source={{ uri: seller.shopfrontData?.bannerImage || "https://picsum.photos/800/300" }}
              style={styles.banner}
            />
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: seller.shopfrontData?.logoImage || seller.avatar || "https://picsum.photos/200" }}
                style={styles.logo}
              />
            </View>
          </View>

          {/* Shop Info */}
          <View style={styles.shopInfo}>
            <View style={styles.shopNameContainer}>
              <Text style={[styles.shopName, { color: colors.text }]}>{seller.name}</Text>
              {seller.verificationLevel === "full" && (
                <VerificationBadge size="small" />
              )}
            </View>
            
            <View style={styles.badgeRow}>
              {seller.verificationLevel === "phone" && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.secondary }]}>
                  <Phone color="#fff" size={14} />
                  <Text style={styles.verifiedText}>{t("phoneVerified")}</Text>
                </View>
              )}
              <View style={[styles.ratingBadge, { backgroundColor: colors.primary }]}>
                <Star color="#fff" size={14} />
                <Text style={styles.ratingText}>
                  {seller.shopfrontData?.rating || "4.8"} ({Math.floor(Math.random() * 100) + 10})
                </Text>
              </View>
              {isShopOpen() !== null && (
                <View style={[styles.statusBadge, { backgroundColor: isShopOpen() ? '#10B981' : '#EF4444' }]}>
                  <Text style={styles.statusText}>
                    {isShopOpen() ? t("open") : t("closed")}
                  </Text>
                </View>
              )}
            </View>

            {seller.shopfrontData?.about && (
              <View style={styles.aboutSection}>
                <TouchableOpacity 
                  style={styles.aboutHeader}
                  onPress={() => setAboutExpanded(!aboutExpanded)}
                >
                  <Text style={[styles.aboutTitle, { color: colors.text }]}>
                    {t("about")}
                  </Text>
                  {seller.shopfrontData.about.length > 150 && (
                    aboutExpanded ? 
                      <ChevronUp color={colors.textSecondary} size={20} /> :
                      <ChevronDown color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
                <Text 
                  style={[styles.aboutText, { color: colors.textSecondary }]}
                  numberOfLines={aboutExpanded ? undefined : 3}
                >
                  {seller.shopfrontData.about}
                </Text>
              </View>
            )}

            <View style={styles.contactSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("contact")}
              </Text>
              
              {(seller.shopfrontData?.fullAddress || seller.shopfrontData?.shopAddress) && (
                <TouchableOpacity 
                  style={styles.infoItem}
                  onPress={() => copyToClipboard(seller.shopfrontData?.fullAddress || seller.shopfrontData?.shopAddress || '')}
                >
                  <MapPin color={colors.primary} size={18} />
                  <Text style={[styles.infoText, { color: colors.text, flex: 1 }]}>
                    {seller.shopfrontData.fullAddress || seller.shopfrontData.shopAddress}
                  </Text>
                  <Copy color={colors.textSecondary} size={16} />
                </TouchableOpacity>
              )}
              
              {seller.shopfrontData?.shopPhone && (
                <TouchableOpacity 
                  style={styles.infoItem}
                  onPress={() => callPhone(seller.shopfrontData?.shopPhone || '')}
                >
                  <Phone color={colors.primary} size={18} />
                  <Text style={[styles.infoText, { color: colors.text, flex: 1 }]}>
                    {seller.shopfrontData.shopPhone}
                  </Text>
                  <ExternalLink color={colors.textSecondary} size={16} />
                </TouchableOpacity>
              )}
              
              {seller.shopfrontData?.email && (
                <TouchableOpacity 
                  style={styles.infoItem}
                  onPress={() => openExternalLink(`mailto:${seller.shopfrontData?.email}`)}
                >
                  <Mail color={colors.primary} size={18} />
                  <Text style={[styles.infoText, { color: colors.text, flex: 1 }]}>
                    {seller.shopfrontData.email}
                  </Text>
                  <ExternalLink color={colors.textSecondary} size={16} />
                </TouchableOpacity>
              )}
              
              {seller.shopfrontData?.website && (
                <TouchableOpacity 
                  style={styles.infoItem}
                  onPress={() => openExternalLink(seller.shopfrontData?.website || '')}
                >
                  <Globe color={colors.primary} size={18} />
                  <Text style={[styles.infoText, { color: colors.text, flex: 1 }]}>
                    {seller.shopfrontData.website}
                  </Text>
                  <ExternalLink color={colors.textSecondary} size={16} />
                </TouchableOpacity>
              )}
            </View>

            {/* Working Hours Section */}
            {seller.shopfrontData?.hours && (
              <View style={styles.hoursSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("workingHours")}
                </Text>
                <View style={[styles.hoursTable, { backgroundColor: colors.surface }]}>
                  {Object.entries(seller.shopfrontData.hours).map(([day, hours]) => {
                    if (!hours) return null;
                    const isToday = day === getCurrentDay();
                    return (
                      <View key={day} style={[styles.hoursRow, isToday && { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.dayText, { color: isToday ? colors.primary : colors.text, fontWeight: isToday ? '600' : '400' }]}>
                          {t(day)}
                        </Text>
                        <Text style={[styles.timeText, { color: isToday ? colors.primary : colors.textSecondary }]}>
                          {hours.closed ? t("closed") : `${hours.open} - ${hours.close}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Social Media Links */}
            {seller.shopfrontData?.socialMedia && (
              <View style={styles.socialMediaContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("followUs")}
                </Text>
                <View style={styles.socialMediaRow}>
                  {seller.shopfrontData.socialMedia.facebook && (
                    <TouchableOpacity 
                      style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                      onPress={() => console.log('Open Facebook:', seller.shopfrontData?.socialMedia?.facebook)}
                    >
                      <Facebook color="#fff" size={20} />
                    </TouchableOpacity>
                  )}
                  {seller.shopfrontData.socialMedia.instagram && (
                    <TouchableOpacity 
                      style={[styles.socialButton, { backgroundColor: '#E4405F' }]}
                      onPress={() => console.log('Open Instagram:', seller.shopfrontData?.socialMedia?.instagram)}
                    >
                      <Instagram color="#fff" size={20} />
                    </TouchableOpacity>
                  )}
                  {seller.shopfrontData.socialMedia.twitter && (
                    <TouchableOpacity 
                      style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]}
                      onPress={() => console.log('Open Twitter:', seller.shopfrontData?.socialMedia?.twitter)}
                    >
                      <Twitter color="#fff" size={20} />
                    </TouchableOpacity>
                  )}
                  {seller.shopfrontData.socialMedia.whatsapp && (
                    <TouchableOpacity 
                      style={[styles.socialButton, { backgroundColor: '#25D366' }]}
                      onPress={() => console.log('Open WhatsApp:', seller.shopfrontData?.socialMedia?.whatsapp)}
                    >
                      <MessageCircle color="#fff" size={20} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  // Create shop chat thread
                  router.push(`/chat/shop-${seller.id}`);
                }}
              >
                <MessageCircle color="#fff" size={20} />
                <Text style={styles.actionButtonText}>{t("message")} {t("shop")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters and Sort */}
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("catalog")}
              </Text>
              <TouchableOpacity 
                style={[styles.sortButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  const sortOptions: ('newest' | 'priceAsc' | 'priceDesc')[] = ['newest', 'priceAsc', 'priceDesc'];
                  const currentIndex = sortOptions.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % sortOptions.length;
                  setSortBy(sortOptions[nextIndex]);
                }}
              >
                <Text style={[styles.sortText, { color: colors.text }]}>
                  {sortBy === 'newest' ? t('newest') : sortBy === 'priceAsc' ? t('priceAsc') : t('priceDesc')}
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  !selectedCategory && styles.categoryChipSelected,
                  { borderColor: colors.border },
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: selectedCategory ? colors.text : colors.primary },
                  ]}
                >
                  {t("all")}
                </Text>
              </TouchableOpacity>
              
              {CATEGORIES.filter(cat => 
                sellerListings.some(listing => listing.category === cat.id)
              ).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipSelected,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color:
                          selectedCategory === category.id
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {t(category.nameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Listings */}
          <View style={styles.listingsContainer}>
            <Text style={[styles.listingsTitle, { color: colors.text }]}>
              {t("listings")} ({filteredListings.length})
            </Text>
            
            {filteredListings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t("noListingsInCategory")}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredListings}
                renderItem={({ item }) => (
                  <ListingCard
                    listing={item}
                    width={(screenWidth - 48 - 16) / 2} // Account for horizontal padding and gap
                  />
                )}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.listingsRow}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  bannerContainer: {
    position: "relative",
    height: 180,
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  logoContainer: {
    position: "absolute",
    bottom: -40,
    left: 24,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  logoVerificationBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  shopInfo: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  shopName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  shopNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  badgeItem: {
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoItems: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  categoryScroll: {
    maxHeight: 40,
  },
  categoryScrollContent: {
    paddingRight: 24,
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
  categoryChipSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderColor: "#2563EB",
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listingsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  listingsRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  hoursContainer: {
    flex: 1,
    marginLeft: 12,
  },
  hoursText: {
    fontSize: 12,
    marginTop: 2,
  },
  socialMediaContainer: {
    marginBottom: 20,
  },
  socialMediaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  contactSection: {
    marginBottom: 20,
  },
  hoursSection: {
    marginBottom: 20,
  },
  hoursTable: {
    borderRadius: 12,
    overflow: "hidden",
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  timeText: {
    fontSize: 14,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sortText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
});
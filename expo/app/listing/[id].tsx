import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useListings } from "@/providers/ListingsProvider";
import { useChat } from "@/providers/ChatProvider";
import { ListingCard } from "@/components/ListingCard";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Phone,
  MessageCircle,
  Shield,
  Eye,
  Flag,
} from "lucide-react-native";


const { width: screenWidth } = Dimensions.get("window");

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { listings, getSellerListings, getRelatedListings } = useListings();
  const { startConversation } = useChat();
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text>Listing not found</Text>
      </SafeAreaView>
    );
  }

  const sellerListings = getSellerListings(listing.userId).filter(l => l.id !== listing.id);
  const relatedListings = getRelatedListings(listing.category, listing.region, listing.id);

  const handleChat = () => {
    const conversationId = startConversation(listing.id, listing.userId);
    router.push(`/chat/${conversationId}` as any);
  };

  const handleCall = () => {
    Alert.alert(t("callSeller"), listing.phoneNumber || t("noPhoneNumber"));
  };

  const handleShare = () => {
    Alert.alert(t("share"), t("shareMessage"));
  };

  const handleReport = () => {
    Alert.alert(t("reportListing"), t("reportMessage"));
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.5)" }]}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#fff" size={20} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.5)" }]}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Heart
                  color={isFavorite ? "#DC2626" : "#fff"}
                  size={20}
                  fill={isFavorite ? "#DC2626" : "transparent"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.5)" }]}
                onPress={handleShare}
              >
                <Share2 color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {listing.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.image} />
            ))}
          </ScrollView>
          <View style={styles.imagePagination}>
            <Text style={styles.imageCounter}>
              {activeImageIndex + 1} / {listing.images.length}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {listing.price.toLocaleString()} XAF
            </Text>
            {listing.status !== "available" && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: listing.status === "sold" ? colors.error : colors.secondary },
                ]}
              >
                <Text style={styles.statusText}>
                  {t(listing.status.toUpperCase())}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{listing.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Eye color={colors.textSecondary} size={16} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {listing.views} views
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Heart color={colors.textSecondary} size={16} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {listing.favorites} favorites
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t("condition")}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {t(listing.condition)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t("category")}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {t(listing.category)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t("posted")}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(listing.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={[styles.locationCard, { backgroundColor: colors.surface }]}>
            <MapPin color={colors.primary} size={20} />
            <View style={styles.locationInfo}>
              <Text style={[styles.locationTitle, { color: colors.text }]}>
                {listing.city}, {t(listing.region)}
              </Text>
              {listing.address && (
                <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>
                  {listing.address}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("description")}
            </Text>
            <Text style={[styles.description, { color: colors.text }]}>
              {listing.description}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.sellerCard, { backgroundColor: colors.surface }]}
            onPress={() => listing.userId && router.push(`/shopfront/${listing.userId}` as any)}
          >
            <View style={styles.sellerHeader}>
              <Image
                source={{ uri: listing.userAvatar || "https://i.pravatar.cc/150" }}
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <Text style={[styles.sellerName, { color: colors.text }]}>
                    {listing.userName}
                  </Text>
                  {/* Verification badge is only shown when viewing the lister's profile */}
                  {listing.seller?.shopfrontData?.enabled && (
                    <View style={[styles.shopBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.shopText}>SHOP</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sellerMeta, { color: colors.textSecondary }]}>
                  {t("memberSince")} 2023
                </Text>
              </View>
            </View>
            {listing.phoneNumber && (
              <TouchableOpacity
                style={[styles.phoneButton, { backgroundColor: colors.background }]}
                onPress={handleCall}
              >
                <Phone color={colors.primary} size={16} />
                <Text style={[styles.phoneText, { color: colors.primary }]}>
                  {listing.phoneNumber}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
            <Flag color={colors.error} size={16} />
            <Text style={[styles.reportText, { color: colors.error }]}>
              {t("reportListing")}
            </Text>
          </TouchableOpacity>

          {/* Other Listings from Same Seller */}
          {sellerListings.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("moreFromSeller")}
              </Text>
              <FlatList
                data={sellerListings.slice(0, 6)}
                renderItem={({ item }) => (
                  <ListingCard
                    listing={item}
                    width={(screenWidth - 48) / 2}
                  />
                )}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.listingRow}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
              {sellerListings.length > 6 && (
                <TouchableOpacity
                  style={[styles.viewAllButton, { backgroundColor: colors.surface }]}
                  onPress={() => router.push(`/shopfront/${listing.userId}` as any)}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>
                    {t("viewAllFromSeller")} ({sellerListings.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Related Listings */}
          {relatedListings.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("relatedListings")}
              </Text>
              <FlatList
                data={relatedListings.slice(0, 6)}
                renderItem={({ item }) => (
                  <ListingCard
                    listing={item}
                    width={(screenWidth - 48) / 2}
                  />
                )}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.listingRow}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleChat}
        >
          <MessageCircle color="#fff" size={20} />
          <Text style={styles.actionButtonText}>{t("chat")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton, { backgroundColor: colors.accent }]}
          onPress={handleCall}
        >
          <Phone color="#fff" size={20} />
          <Text style={styles.actionButtonText}>{t("call")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  imageContainer: {
    height: 300,
    position: "relative",
  },
  image: {
    width: screenWidth,
    height: 300,
  },
  imagePagination: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounter: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  sellerCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sellerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shopBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shopText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  sellerMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  phoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  reportText: {
    fontSize: 14,
  },
  listingRow: {
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  viewAllButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomBar: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  callButton: {
    flex: 0.8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
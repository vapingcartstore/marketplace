import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useListings, Listing } from "@/providers/ListingsProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  Heart,
  Search,
  MapPin,
  Tag,
  Clock,
} from "lucide-react-native";

export default function FavoritesScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { listings, refresh } = useListings();
  const [refreshing, setRefreshing] = useState(false);
  
  // Mock favorites - in a real app, this would come from a user's favorites list
  // For now, we'll just show random listings as favorites
  const favoriteListings = listings
    .filter((_, index) => index % 3 === 0)
    .slice(0, 10);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderListingItem = ({ item }: { item: Listing }) => {
    return (
      <TouchableOpacity
        style={[styles.listingCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/listing/${item.id}`)}
        testID={`favorite-listing-${item.id}`}
      >
        <Image
          source={{ uri: item.images[0] }}
          style={styles.listingImage}
          resizeMode="cover"
        />
        <View style={styles.listingContent}>
          <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.listingPrice, { color: colors.primary }]}>
            {item.price.toLocaleString()} FCFA
          </Text>
          
          <View style={styles.listingDetails}>
            <View style={styles.detailItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {item.city}, {item.region}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Tag size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {t(item.category)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.favoriteButton, { backgroundColor: colors.error + "20" }]}
          onPress={() => {
            // In a real app, this would remove the item from favorites
            console.log("Remove from favorites:", item.id);
          }}
        >
          <Heart size={20} color={colors.error} fill={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("favorites"),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        {favoriteListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Heart size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("noFavorites")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t("addFavoritesDescription")}
            </Text>
            <TouchableOpacity
              style={[styles.browseButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/")}
            >
              <Search size={20} color="#fff" />
              <Text style={styles.browseButtonText}>{t("browseListing")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={favoriteListings}
            renderItem={renderListingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  listingCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  listingImage: {
    width: "100%",
    height: 180,
  },
  listingContent: {
    padding: 16,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  listingDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
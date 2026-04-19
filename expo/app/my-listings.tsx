import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useListings, Listing } from "@/providers/ListingsProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter,
  RefreshCw,
} from "lucide-react-native";

export default function MyListingsScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { listings, deleteListing, renewListing, refresh } = useListings();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  // Get user's listings
  const myListings = listings.filter(listing => listing.userId === user?.id);

  // Apply filters
  const filteredListings = filter
    ? myListings.filter(listing => listing.status === filter)
    : myListings;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleDelete = useCallback((listing: Listing) => {
    Alert.alert(
      t("deleteListing"),
      t("deleteListingConfirmation"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteListing(listing.id);
            } catch (error) {
              console.error("Failed to delete listing:", error);
              Alert.alert(t("error"), t("failedToDeleteListing"));
            }
          },
        },
      ]
    );
  }, [deleteListing, t]);

  const handleRenew = useCallback((listing: Listing) => {
    Alert.alert(
      t("renewListing"),
      t("renewListingConfirmation"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("renew"),
          onPress: async () => {
            try {
              await renewListing(listing.id);
              Alert.alert(t("success"), t("listingRenewedSuccess"));
            } catch (error) {
              console.error("Failed to renew listing:", error);
              Alert.alert(t("error"), t("failedToRenewListing"));
            }
          },
        },
      ]
    );
  }, [renewListing, t]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Eye size={16} color="#10B981" />;
      case "reserved":
        return <Clock size={16} color="#F59E0B" />;
      case "sold":
        return <CheckCircle size={16} color={colors.primary} />;
      case "expired":
        return <EyeOff size={16} color={colors.textSecondary} />;
      default:
        return <AlertCircle size={16} color={colors.error} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return t("available");
      case "reserved":
        return t("reserved");
      case "sold":
        return t("sold");
      case "expired":
        return t("expired");
      default:
        return status;
    }
  };

  const renderListingItem = ({ item }: { item: Listing }) => {
    const isExpired = item.status === "expired";
    const isSold = item.status === "sold";

    return (
      <TouchableOpacity
        style={[styles.listingCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/listing/${item.id}`)}
        testID={`listing-card-${item.id}`}
      >
        <View style={styles.listingImageContainer}>
          <Image
            source={{ uri: item.images[0] }}
            style={styles.listingImage}
            resizeMode="cover"
          />
          <View style={[styles.statusBadge, {
            backgroundColor: isExpired || isSold
              ? colors.surface + "E6"
              : item.status === "reserved"
                ? "#F59E0B33"
                : "transparent"
          }]}>
            <View style={styles.statusContent}>
              {getStatusIcon(item.status)}
              <Text style={[styles.statusText, {
                color: isExpired
                  ? colors.textSecondary
                  : isSold
                    ? colors.primary
                    : item.status === "reserved"
                      ? "#F59E0B"
                      : "#10B981"
              }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.listingContent}>
          <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.listingPrice, { color: colors.primary }]}>
            {item.price.toLocaleString()} FCFA
          </Text>
          <View style={styles.listingMeta}>
            <Text style={[styles.listingDate, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Text style={[styles.listingViews, { color: colors.textSecondary }]}>
              {item.views} {t("views")}
            </Text>
          </View>
        </View>

        <View style={styles.listingActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + "20" }]}
            onPress={() => console.log("Edit listing", item.id)}
          >
            <Edit size={16} color={colors.primary} />
          </TouchableOpacity>

          {isExpired && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#10B98120" }]}
              onPress={() => handleRenew(item)}
            >
              <RefreshCw size={16} color="#10B981" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + "20" }]}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("myListings"),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={styles.header}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterChip, !filter && styles.activeFilterChip, { borderColor: colors.border }]}
              onPress={() => setFilter(null)}
            >
              <Text style={[styles.filterText, !filter && styles.activeFilterText, { color: !filter ? colors.primary : colors.text }]}>
                {t("all")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === "available" && styles.activeFilterChip, { borderColor: colors.border }]}
              onPress={() => setFilter("available")}
            >
              <Text style={[styles.filterText, filter === "available" && styles.activeFilterText, { color: filter === "available" ? colors.primary : colors.text }]}>
                {t("available")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === "reserved" && styles.activeFilterChip, { borderColor: colors.border }]}
              onPress={() => setFilter("reserved")}
            >
              <Text style={[styles.filterText, filter === "reserved" && styles.activeFilterText, { color: filter === "reserved" ? colors.primary : colors.text }]}>
                {t("reserved")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === "sold" && styles.activeFilterChip, { borderColor: colors.border }]}
              onPress={() => setFilter("sold")}
            >
              <Text style={[styles.filterText, filter === "sold" && styles.activeFilterText, { color: filter === "sold" ? colors.primary : colors.text }]}>
                {t("sold")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === "expired" && styles.activeFilterChip, { borderColor: colors.border }]}
              onPress={() => setFilter("expired")}
            >
              <Text style={[styles.filterText, filter === "expired" && styles.activeFilterText, { color: filter === "expired" ? colors.primary : colors.text }]}>
                {t("expired")}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/create")}
          >
            <Plus color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        {filteredListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Filter color={colors.textSecondary} size={64} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {filter ? t("noListingsWithFilter") : t("noListings")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filter ? t("tryDifferentFilter") : t("createYourFirstListing")}
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/create")}
            >
              <Plus color="#fff" size={20} />
              <Text style={styles.createButtonText}>{t("createListing")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredListings}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeFilterChip: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderColor: "#2563EB",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilterText: {
    fontWeight: "600",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  listingCard: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  listingImageContainer: {
    width: 100,
    height: 100,
    position: "relative",
  },
  listingImage: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  listingContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  listingMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listingDate: {
    fontSize: 12,
  },
  listingViews: {
    fontSize: 12,
  },
  listingActions: {
    padding: 8,
    justifyContent: "space-around",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
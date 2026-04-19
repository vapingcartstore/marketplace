import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/providers/ThemeProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { MapPin } from "lucide-react-native";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Listing } from "@/providers/ListingsProvider";
import { getCDNImageUrl } from "@/utils/imageUtils";

export interface ListingCardProps {
  listing: Listing;
  width?: number;
  onPress?: () => void;
}

export function ListingCard({ listing, width, onPress }: ListingCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/listing/${listing.id}` as any);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width }]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: listing.images && listing.images.length > 0 
              ? (typeof listing.images[0] === 'string' && listing.images[0].startsWith('http') 
                  ? listing.images[0] 
                  : getCDNImageUrl(listing.images[0], 'card'))
              : "https://picsum.photos/200" 
          }}
          style={styles.image}
        />
        <View style={styles.badgesContainer}>
          {listing.sponsored && (
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.badgeText}>AD</Text>
            </View>
          )}
          {listing.listingType === 'barter' && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{t('trade').toUpperCase()}</Text>
            </View>
          )}
          {listing.seller?.shopfrontData?.enabled && listing.seller?.shopfrontData?.isShopfront && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{t('shop').toUpperCase()}</Text>
            </View>
          )}
        </View>
        {/* Trust indicators removed */}
      </View>
      <View style={styles.content}>
        <Text style={[styles.price, { color: colors.primary }]} numberOfLines={1}>
          {listing.listingType === 'barter' ? 
            (listing.offerEstimatedValue ? `~${listing.offerEstimatedValue.toLocaleString()} XAF` : t('trade')) :
            listing.priceRange ? 
              `${listing.price.toLocaleString()}-${listing.priceRange.max.toLocaleString()} XAF` :
              `${listing.price.toLocaleString()} XAF`
          }
        </Text>
        {listing.moq && (
          <Text style={[styles.moqText, { color: colors.textSecondary }]} numberOfLines={1}>
            {listing.moq} {listing.unit || 'Pieces'} (MOQ)
          </Text>
        )}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {listing.listingType === 'barter' ? listing.offerTitle || listing.title : listing.title}
        </Text>
        <View style={styles.location}>
          <MapPin color={colors.textSecondary} size={10} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {listing.city || listing.region}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badgesContainer: {
    position: "absolute",
    top: 4,
    left: 4,
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
    maxWidth: "80%",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  // Trust indicators styles removed
  verifiedBadgeContainer: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  content: {
    paddingHorizontal: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  moqText: {
    fontSize: 11,
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  locationText: {
    fontSize: 10,
    flex: 1,
  },
});
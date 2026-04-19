import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  Star,
  MessageCircle,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Flag,
} from "lucide-react-native";

// Mock review data
interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: Date;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  isReply?: boolean;
  replyTo?: string;
}

const mockReviews: Review[] = [
  {
    id: "1",
    userId: "user1",
    userName: "John Doe",
    userAvatar: "https://i.pravatar.cc/150?img=1",
    rating: 5,
    comment: "Great seller! Fast delivery and item as described.",
    date: new Date(2025, 8, 1),
    listingId: "listing1",
    listingTitle: "iPhone 13 Pro - Excellent Condition",
    listingImage: "https://picsum.photos/200/300?random=1",
  },
  {
    id: "2",
    userId: "user2",
    userName: "Alice Smith",
    userAvatar: "https://i.pravatar.cc/150?img=5",
    rating: 4,
    comment: "Good product, but delivery was a bit slow.",
    date: new Date(2025, 7, 28),
    listingId: "listing2",
    listingTitle: "Samsung Galaxy S22 - Like New",
    listingImage: "https://picsum.photos/200/300?random=2",
  },
  {
    id: "3",
    userId: "user3",
    userName: "Robert Johnson",
    userAvatar: "https://i.pravatar.cc/150?img=8",
    rating: 5,
    comment: "Excellent service! Would buy from again.",
    date: new Date(2025, 7, 25),
    listingId: "listing3",
    listingTitle: "MacBook Pro 2023 - 16GB RAM",
    listingImage: "https://picsum.photos/200/300?random=3",
  },
  {
    id: "4",
    userId: "user4",
    userName: "Emma Wilson",
    userAvatar: "https://i.pravatar.cc/150?img=9",
    rating: 3,
    comment: "Product was okay, but had some scratches not mentioned in the description.",
    date: new Date(2025, 7, 20),
    listingId: "listing4",
    listingTitle: "Sony PlayStation 5 - Barely Used",
    listingImage: "https://picsum.photos/200/300?random=4",
  },
  {
    id: "5",
    userId: "user5",
    userName: "Michael Brown",
    userAvatar: "https://i.pravatar.cc/150?img=12",
    rating: 5,
    comment: "Perfect transaction! Item was even better than described.",
    date: new Date(2025, 7, 15),
    listingId: "listing5",
    listingTitle: "Canon EOS R5 Camera with Lens",
    listingImage: "https://picsum.photos/200/300?random=5",
  },
];

// Mock reviews received
const mockReceivedReviews: Review[] = [
  {
    id: "6",
    userId: "user6",
    userName: "Sarah Johnson",
    userAvatar: "https://i.pravatar.cc/150?img=20",
    rating: 5,
    comment: "Great buyer! Prompt payment and easy to communicate with.",
    date: new Date(2025, 8, 2),
    listingId: "mylisting1",
    listingTitle: "Vintage Leather Jacket - Size L",
    listingImage: "https://picsum.photos/200/300?random=6",
  },
  {
    id: "7",
    userId: "user7",
    userName: "David Lee",
    userAvatar: "https://i.pravatar.cc/150?img=30",
    rating: 4,
    comment: "Good transaction overall. Responsive seller.",
    date: new Date(2025, 7, 30),
    listingId: "mylisting2",
    listingTitle: "Handcrafted Wooden Coffee Table",
    listingImage: "https://picsum.photos/200/300?random=7",
  },
  {
    id: "8",
    userId: "user8",
    userName: "Jennifer Garcia",
    userAvatar: "https://i.pravatar.cc/150?img=25",
    rating: 5,
    comment: "Excellent seller! Item was packaged very well and arrived quickly.",
    date: new Date(2025, 7, 27),
    listingId: "mylisting3",
    listingTitle: "Antique Bronze Desk Lamp",
    listingImage: "https://picsum.photos/200/300?random=8",
  },
];

export default function ReviewsScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"given" | "received">("given");

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            color={star <= rating ? colors.primary : colors.border}
            fill={star <= rating ? colors.primary : "transparent"}
          />
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => {
    return (
      <View style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            {item.userAvatar ? (
              <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {item.userName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
              <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                {item.date.toLocaleDateString()}
              </Text>
            </View>
          </View>
          {renderStars(item.rating)}
        </View>

        <Text style={[styles.reviewComment, { color: colors.text }]}>{item.comment}</Text>

        <TouchableOpacity
          style={[styles.listingPreview, { backgroundColor: colors.background }]}
          onPress={() => router.push(`/listing/${item.listingId}`)}
        >
          <Image source={{ uri: item.listingImage }} style={styles.listingImage} />
          <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={2}>
            {item.listingTitle}
          </Text>
          <ChevronRight size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.actionButton}>
            <ThumbsUp size={16} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              {t("helpful")}
            </Text>
          </TouchableOpacity>

          {activeTab === "received" && (
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={16} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {t("reply")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionButton}>
            <Flag size={16} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              {t("report")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("reviews"),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "given" && [styles.activeTab, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab("given")}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "given" ? colors.primary : colors.textSecondary },
              ]}
            >
              {t("reviewsGiven")} ({mockReviews.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "received" && [styles.activeTab, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab("received")}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "received" ? colors.primary : colors.textSecondary },
              ]}
            >
              {t("reviewsReceived")} ({mockReceivedReviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={activeTab === "given" ? mockReviews : mockReceivedReviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  reviewCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  reviewDate: {
    fontSize: 12,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  listingPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  listingImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  listingTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  reviewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useChat } from "@/providers/ChatProvider";
import { MessageCircle } from "lucide-react-native";

export default function ChatsScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { conversations } = useChat();

  if (user?.isGuest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <MessageCircle color={colors.textSecondary} size={48} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t("loginToChat")}
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>{t("login")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.conversationItem, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/chat/${item.id}` as any)}
    >
      <Image source={{ uri: item.listing.image }} style={styles.listingImage} />
      <View style={styles.conversationContent}>
        <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={1}>
          {item.listing.title}
        </Text>
        <Text style={[styles.otherUser, { color: colors.textSecondary }]}>
          {item.otherUser.name}
        </Text>
        <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.conversationMeta}>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {item.time}
        </Text>
        {item.unread > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadCount}>{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t("chats")}</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle color={colors.textSecondary} size={48} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t("noChatsYet")}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t("startChatting")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  listingImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  otherUser: {
    fontSize: 14,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  conversationMeta: {
    alignItems: "flex-end",
  },
  time: {
    fontSize: 12,
    marginBottom: 8,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
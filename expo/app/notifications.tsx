import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useNotifications, Notification } from '@/providers/NotificationsProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { Check, Trash2, Bell, AlertCircle, ShoppingBag, Repeat } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    loadNotifications,
  } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read when pressed
      markAsRead(notification.id);

      // Navigate based on notification type
      if (notification.type === 'listing' && notification.data?.listingId) {
        router.push(`/listing/${notification.data.listingId}`);
      } else if (notification.type === 'message' && notification.data?.chatId) {
        router.push(`/chat/${notification.data.chatId}`);
      } else if (notification.type === 'trade' && notification.data?.tradeId) {
        // Navigate to trade details if available
        // router.push(`/trade/${notification.data.tradeId}`);
      }
    },
    [markAsRead, router]
  );

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'listing':
        return <ShoppingBag size={24} color={colors.primary} />;
      case 'message':
        return <Bell size={24} color={colors.primary} />;
      case 'trade':
        return <Repeat size={24} color={colors.primary} />;
      case 'system':
      default:
        return <AlertCircle size={24} color={colors.primary} />;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: item.read ? colors.background : colors.surface },
          !item.read && { borderLeftColor: colors.primary, borderLeftWidth: 4 },
        ]}
        onPress={() => handleNotificationPress(item)}
        testID={`notification-${item.id}`}
      >
        <View style={styles.notificationIcon}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
            {item.message}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
          testID={`delete-notification-${item.id}`}
        >
          <Trash2 size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Bell size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t('noNotifications')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {t('notificationsWillAppearHere')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t('notifications'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={styles.headerButtons}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={[styles.headerButton, { backgroundColor: colors.surface }]}
                  onPress={markAllAsRead}
                  testID="mark-all-read-button"
                >
                  <Check size={18} color={colors.primary} />
                  <Text style={[styles.headerButtonText, { color: colors.primary }]}>
                    {t('markAllRead')}
                  </Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity
                  style={[styles.headerButton, { backgroundColor: colors.surface }]}
                  onPress={clearAllNotifications}
                  testID="clear-all-button"
                >
                  <Trash2 size={18} color={colors.error || '#FF3B30'} />
                  <Text style={[styles.headerButtonText, { color: colors.error || '#FF3B30' }]}>
                    {t('clearAll')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthProvider';
import { useListings } from './ListingsProvider';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'listing' | 'trade' | 'message' | 'system';
  read: boolean;
  createdAt: string;
  data?: any;
};

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { listings } = useListings();

  // Load notifications from storage
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const userId = user?.id || 'guest';
      const storedNotifications = await AsyncStorage.getItem(`notifications_${userId}`);
      
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications) as Notification[];
        setNotifications(parsedNotifications);
        updateUnreadCount(parsedNotifications);
      } else {
        // Generate initial notifications if none exist
        await generateInitialNotifications();
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save notifications to storage
  const saveNotifications = async (notificationsToSave: Notification[]) => {
    try {
      const userId = user?.id || 'guest';
      await AsyncStorage.setItem(
        `notifications_${userId}`,
        JSON.stringify(notificationsToSave)
      );
      updateUnreadCount(notificationsToSave);
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  };

  // Update unread count
  const updateUnreadCount = (notificationsToCount: Notification[]) => {
    const count = notificationsToCount.filter(n => !n.read).length;
    setUnreadCount(count);
  };

  // Generate initial notifications
  const generateInitialNotifications = async () => {
    const initialNotifications: Notification[] = [
      {
        id: '1',
        title: 'Welcome to the marketplace!',
        message: 'Start exploring items near you or list your own items for sale.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: '🛡️ Safety Tips',
        message: 'Meet in public places, verify items before payment, never send money upfront. Report suspicious activity immediately.',
        type: 'system',
        read: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Add some sample notifications based on listings
    if (listings.length > 0) {
      const randomListing = listings[Math.floor(Math.random() * listings.length)];
      initialNotifications.push({
        id: '3',
        title: 'New listing in your area',
        message: `"${randomListing.title}" was just listed in ${randomListing.city || randomListing.region}.`,
        type: 'listing',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        data: { listingId: randomListing.id }
      });

      // Add a trade match notification
      initialNotifications.push({
        id: '4',
        title: 'Potential trade match found',
        message: `Someone is looking to trade for items similar to what you're offering.`,
        type: 'trade',
        read: false,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      });
    }

    setNotifications(initialNotifications);
    await saveNotifications(initialNotifications);
  };

  // Add a new notification
  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    );
    
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true,
    }));
    
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    setNotifications([]);
    await saveNotifications([]);
  };

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    loadNotifications,
  };
});
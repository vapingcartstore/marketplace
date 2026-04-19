import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;
  listingId?: string;
  shopId?: string;
  type: 'listing' | 'shop';
  listing?: {
    title: string;
    image: string;
    price: number;
  };
  shop?: {
    brandName: string;
    logoImage: string;
  };
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  messages: Message[];
  lastMessage: string;
  time: string;
  unread: number;
  safetyNoticeShown?: boolean;
}

interface ChatContextType {
  conversations: Conversation[];
  sendMessage: (conversationId: string, text: string) => void;
  markAsRead: (conversationId: string) => void;
  startConversation: (listingId: string, sellerId: string) => string;
  startShopConversation: (shopId: string, sellerId: string) => string;
}

export const [ChatProvider, useChat] = createContextHook<ChatContextType>(() => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const stored = await AsyncStorage.getItem("conversations");
      if (stored) {
        setConversations(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const saveConversations = async (convos: Conversation[]) => {
    await AsyncStorage.setItem("conversations", JSON.stringify(convos));
  };

  const sendMessage = useCallback((conversationId: string, text: string) => {
    setConversations(prevConversations => {
      const updated = prevConversations.map(c => {
        if (c.id === conversationId) {
          const newMessage: Message = {
            id: Date.now().toString(),
            text,
            senderId: "current-user",
            timestamp: new Date(),
            read: false,
          };
          return {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessage: text,
            time: "now",
          };
        }
        return c;
      });
      saveConversations(updated);
      return updated;
    });
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations(prevConversations => {
      const updated = prevConversations.map(c => {
        if (c.id === conversationId) {
          return { ...c, unread: 0 };
        }
        return c;
      });
      saveConversations(updated);
      return updated;
    });
  }, []);

  const startConversation = useCallback((listingId: string, sellerId: string): string => {
    let conversationId = '';
    
    setConversations(prevConversations => {
      const existingConvo = prevConversations.find(c => c.listingId === listingId && c.type === 'listing');
      if (existingConvo) {
        conversationId = existingConvo.id;
        return prevConversations;
      }

      const safetyMessage: Message = {
        id: 'safety-notice-' + Date.now(),
        text: "🛡️ 🛡️ Safety Tips: Meet in public places, verify items before payment, never send money upfront. Report suspicious activity immediately.",
        senderId: 'system',
        timestamp: new Date(),
        read: false,
      };

      const newConvo: Conversation = {
        id: Date.now().toString(),
        listingId,
        type: 'listing',
        listing: {
          title: "Sample Listing",
          image: "https://picsum.photos/200",
          price: 50000,
        },
        otherUser: {
          id: sellerId,
          name: "Seller Name",
        },
        messages: [safetyMessage],
        lastMessage: "Safety notice",
        time: "now",
        unread: 0,
        safetyNoticeShown: true,
      };

      conversationId = newConvo.id;
      const updated = [newConvo, ...prevConversations];
      saveConversations(updated);
      return updated;
    });
    
    return conversationId;
  }, []);

  const startShopConversation = useCallback((shopId: string, sellerId: string): string => {
    let conversationId = '';
    
    setConversations(prevConversations => {
      const existingConvo = prevConversations.find(c => c.shopId === shopId && c.type === 'shop');
      if (existingConvo) {
        conversationId = existingConvo.id;
        return prevConversations;
      }

      const safetyMessage: Message = {
        id: 'safety-notice-shop-' + Date.now(),
        text: "🛡️ 🛡️ Safety Tips: Meet in public places, verify items before payment, never send money upfront. Report suspicious activity immediately.",
        senderId: 'system',
        timestamp: new Date(),
        read: false,
      };

      const newConvo: Conversation = {
        id: `shop-${Date.now()}`,
        shopId,
        type: 'shop',
        shop: {
          brandName: "Shop Name",
          logoImage: "https://picsum.photos/200",
        },
        otherUser: {
          id: sellerId,
          name: "Shop Owner",
        },
        messages: [safetyMessage],
        lastMessage: "Safety notice",
        time: "now",
        unread: 0,
        safetyNoticeShown: true,
      };

      conversationId = newConvo.id;
      const updated = [newConvo, ...prevConversations];
      saveConversations(updated);
      return updated;
    });
    
    return conversationId;
  }, []);

  return useMemo(() => ({
    conversations,
    sendMessage,
    markAsRead,
    startConversation,
    startShopConversation,
  }), [conversations, sendMessage, markAsRead, startConversation, startShopConversation]);
});
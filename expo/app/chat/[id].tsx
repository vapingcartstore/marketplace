import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useChat } from "@/providers/ChatProvider";
import { 
  Send, 
  Plus, 
  Camera, 
  Image as ImageIcon, 
  MapPin, 
  FileText, 
  X
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { conversations, sendMessage, startShopConversation, markAsRead } = useChat();
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<any>(null);
  const [showSafetyTips, setShowSafetyTips] = useState<boolean>(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const initializedRef = useRef<string | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Initialize conversation only once per ID
  useEffect(() => {
    if (!id || initializedRef.current === id) return;
    
    initializedRef.current = id;
    
    // Check if this is a shop conversation
    if (id.startsWith('shop-')) {
      const shopId = id.replace('shop-', '');
      const existingConvo = conversations.find(c => c.shopId === shopId && c.type === 'shop');
      
      if (existingConvo) {
        setConversation(existingConvo);
        markAsRead(existingConvo.id);
      } else {
        // Create new shop conversation
        startShopConversation(shopId, shopId);
        // The conversation will be updated in the next effect
      }
    } else {
      // Regular listing conversation
      const existingConvo = conversations.find(c => c.id === id);
      if (existingConvo) {
        setConversation(existingConvo);
        markAsRead(id);
      }
    }
  }, [id, conversations, markAsRead, startShopConversation]);

  // Update conversation when conversations change
  useEffect(() => {
    if (!id) return;
    
    if (id.startsWith('shop-')) {
      const shopId = id.replace('shop-', '');
      const existingConvo = conversations.find(c => c.shopId === shopId && c.type === 'shop');
      if (existingConvo && (!conversation || conversation.id !== existingConvo.id)) {
        setConversation(existingConvo);
      }
    } else {
      const existingConvo = conversations.find(c => c.id === id);
      if (existingConvo && (!conversation || JSON.stringify(existingConvo) !== JSON.stringify(conversation))) {
        setConversation(existingConvo);
      }
    }
  }, [conversations, id, conversation]);

  // Reset initialization when ID changes
  useEffect(() => {
    if (initializedRef.current !== id) {
      initializedRef.current = null;
    }
  }, [id]);

  const quickReplies = [
    t("isThisAvailable"),
    t("bestPrice"),
    t("canWeNegotiate"),
    t("whereLocated"),
  ];

  const handleSend = () => {
    if (message.trim() && conversation) {
      console.log('Sending message:', message.trim());
      sendMessage(conversation.id, message.trim());
      setMessage("");
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    
    return {
      camera: cameraStatus === 'granted',
      media: mediaStatus === 'granted',
      location: locationStatus === 'granted',
      audio: audioStatus === 'granted'
    };
  };

  const handleCamera = async () => {
    setShowAttachmentMenu(false);
    const permissions = await requestPermissions();
    
    if (!permissions.camera) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && conversation) {
      sendMessage(conversation.id, `📷 Photo: ${result.assets[0].uri}`);
    }
  };

  const handleImagePicker = async () => {
    setShowAttachmentMenu(false);
    const permissions = await requestPermissions();
    
    if (!permissions.media) {
      Alert.alert('Permission Required', 'Media library permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && conversation) {
      sendMessage(conversation.id, `🖼️ Image: ${result.assets[0].uri}`);
    }
  };

  const handleLocation = async () => {
    const permissions = await requestPermissions();
    
    if (!permissions.location) {
      Alert.alert('Permission Required', 'Location permission is required to share location.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      if (conversation) {
        sendMessage(conversation.id, `📍 Location: ${location.coords.latitude}, ${location.coords.longitude}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to get current location.');
    }
  };

  const handleDocument = async () => {
    setShowAttachmentMenu(false);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && conversation) {
        sendMessage(conversation.id, `📄 Document: ${result.assets[0].name}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const startRecording = async () => {
    console.log('Start recording button pressed');
    
    try {
      const permissions = await requestPermissions();
      
      if (!permissions.audio) {
        Alert.alert('Permission Required', 'Microphone permission is required to record voice messages.');
        return;
      }

      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      console.log('Creating new recording...');
      const newRecording = new Audio.Recording();
      
      console.log('Preparing to record...');
      await newRecording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: 2, // MPEG_4 format
          audioEncoder: 3, // AAC encoding
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: 1, // Linear PCM format (1 is the numeric value)
          audioQuality: 0.1, // High quality (0.1 is the numeric value)
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      console.log('Starting recording...');
      await newRecording.startAsync();
      
      console.log('Recording started successfully');
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      setIsRecording(false);
      setRecording(null);
      Alert.alert('Error', `Failed to start recording: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.log('No recording to stop');
      return;
    }

    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      await recording.stopAndUnloadAsync();
      
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      const uri = recording.getURI();
      console.log('Recording URI:', uri);
      if (uri && conversation) {
        const duration = Math.floor(recordingDuration);
        sendMessage(conversation.id, `🎤 Voice message (${duration}s): ${uri}`);
      }

      setRecording(null);
      setRecordingDuration(0);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
      Alert.alert('Error', `Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const cancelRecording = async () => {
    if (!recording) {
      console.log('No recording to cancel');
      return;
    }

    try {
      console.log('Cancelling recording...');
      setIsRecording(false);
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      await recording.stopAndUnloadAsync();
      
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      setRecording(null);
      setRecordingDuration(0);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to cancel recording', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickReply = (reply: string) => {
    if (conversation) {
      sendMessage(conversation.id, reply);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isSystem = item.senderId === 'system';
    const isOwn = item.senderId === "current-user";
    
    if (isSystem) {
      return (
        <View style={[styles.systemMessage, { backgroundColor: colors.surface }]}>
          <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
            {item.text}{' '}
            <Text 
              style={[styles.learnMoreLink, { color: colors.primary }]}
              onPress={() => setShowSafetyTips(true)}
            >
              Learn more
            </Text>
          </Text>
        </View>
      );
    }
    
    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.messageText, { color: isOwn ? "#fff" : colors.text }]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  

  const AttachmentMenu = () => {
    if (!showAttachmentMenu) return null;
    
    return (
      <Animated.View 
        style={[
          styles.attachmentMenuContainer,
          { backgroundColor: colors.surface },
          keyboardVisible && { position: 'absolute', bottom: 60, zIndex: 200 }
        ]}
      >
        <View style={styles.attachmentHeader}>
          <Text style={[styles.attachmentTitle, { color: colors.text }]}>Attachments</Text>
          <TouchableOpacity 
            style={styles.closeAttachmentButton} 
            onPress={() => setShowAttachmentMenu(false)}
            testID="close-attachment-menu"
          >
            <X color={colors.textSecondary} size={22} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.attachmentOptionsContainer}>
          <TouchableOpacity style={styles.attachmentOption} onPress={handleCamera}>
            <View style={[styles.attachmentIcon, { backgroundColor: colors.primary }]}>
              <Camera color="#fff" size={24} />
            </View>
            <Text style={[styles.attachmentText, { color: colors.text }]}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.attachmentOption} onPress={handleImagePicker}>
            <View style={[styles.attachmentIcon, { backgroundColor: colors.accent }]}>
              <ImageIcon color="#fff" size={24} />
            </View>
            <Text style={[styles.attachmentText, { color: colors.text }]}>Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.attachmentOption} onPress={handleDocument}>
            <View style={[styles.attachmentIcon, { backgroundColor: colors.error }]}>
              <FileText color="#fff" size={24} />
            </View>
            <Text style={[styles.attachmentText, { color: colors.text }]}>Document</Text>
          </TouchableOpacity>
          

        </View>
      </Animated.View>
    );
  };

  const SafetyTipsModal = () => (
    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t("safetyTipsTitle")}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowSafetyTips(false)}
            style={styles.closeButton}
          >
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>
              {t("close")}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tipsContainer}>
          {[
            t("safetyTip1"),
            t("safetyTip2"),
            t("safetyTip3"),
            t("safetyTip4"),
            t("safetyTip5"),
            t("safetyTip6"),
            t("safetyTip7"),
            t("safetyTip8")
          ].map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={[styles.tipNumber, { color: colors.primary }]}>
                {index + 1}.
              </Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                {tip}
              </Text>
            </View>
          ))}
          
          <View style={[styles.vigilantMessage, { backgroundColor: colors.surface }]}>
            <Text style={[styles.vigilantText, { color: colors.primary }]}>
              {t("stayVigilant")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Add keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: conversation?.type === 'shop' 
            ? (conversation.shop?.brandName || t("shopChat"))
            : (conversation?.otherUser.name || t("chat")),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '600',
          },
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={100}
        >
          {conversation?.messages.length === 0 && (
            <View style={styles.quickRepliesContainer}>
              <Text style={[styles.quickRepliesTitle, { color: colors.textSecondary }]}>
                {t("quickReplies")}
              </Text>
              <View style={styles.quickReplies}>
                {quickReplies.map((reply, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickReply, { borderColor: colors.border }]}
                    onPress={() => handleQuickReply(reply)}
                  >
                    <Text style={[styles.quickReplyText, { color: colors.primary }]}>
                      {reply}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={conversation?.messages || []}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            inverted
          />

          <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
            {!isRecording ? (
              <>
                <TouchableOpacity
                  style={[styles.attachButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    console.log('Plus button pressed, current state:', showAttachmentMenu);
                    setShowAttachmentMenu(!showAttachmentMenu);
                  }}
                  testID="attachment-button"
                >
                  <Plus color="#fff" size={20} />
                </TouchableOpacity>
                
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                  placeholder={t("typeMessage")}
                  placeholderTextColor={colors.textSecondary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={500}
                />
                
                {message.trim() ? (
                  <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: colors.primary }]}
                    onPress={handleSend}
                  >
                    <Send color="#fff" size={20} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.locationButton, { backgroundColor: colors.primary }]}
                    onPress={handleLocation}
                    testID="location-button"
                  >
                    <MapPin color="#fff" size={20} />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.recordingContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.error }]}
                  onPress={cancelRecording}
                >
                  <X color="#fff" size={20} />
                </TouchableOpacity>
                
                <View style={styles.recordingInfo}>
                  <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
                  </Animated.View>
                  <Text style={[styles.recordingText, { color: colors.text }]}>
                    Recording... {formatDuration(recordingDuration)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.stopButton, { backgroundColor: colors.primary }]}
                  onPress={stopRecording}
                  testID="send-voice-message-button"
                >
                  <Send color="#fff" size={20} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
        
        <AttachmentMenu />
        
        {showSafetyTips && <SafetyTipsModal />}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  quickRepliesContainer: {
    padding: 16,
  },
  quickRepliesTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  quickReplies: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickReply: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickReplyText: {
    fontSize: 14,
  },
  messagesList: {
    padding: 16,
    paddingTop: 50, /* Add space for the system message */
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  ownMessage: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    alignItems: "flex-end",
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  systemMessage: {
    alignSelf: 'center',
    marginVertical: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '90%',
    position: 'absolute',
    top: 5,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  systemMessageText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  learnMoreLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  attachmentMenuContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 200,
  },
  attachmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachmentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  attachmentOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 8,
  },
  closeAttachmentButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentOption: {
    alignItems: 'center',
    gap: 8,
  },
  attachmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tipsContainer: {
    flex: 1,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  vigilantMessage: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  vigilantText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
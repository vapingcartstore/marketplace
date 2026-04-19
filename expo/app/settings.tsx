import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  Bell,
  Shield,
  Lock,
  HelpCircle,
  ChevronRight,
  Camera,
  Phone,
  FileText,
  Trash2,
  Download,
  AlertTriangle,
  MessageSquare,
  Info,
  X,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user, updateProfile, logout } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState({
    chatMessages: true,
    favoritesUpdates: true,
    savedSearchAlerts: false,
    systemAnnouncements: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    showPhone: true,
    allowCalls: true,
  });
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key],
    });
    // SWAP WITH BACKEND HERE
    // Save to AsyncStorage for now
    AsyncStorage.setItem(
      "notificationSettings",
      JSON.stringify({
        ...notificationSettings,
        [key]: !notificationSettings[key],
      })
    );
  };

  const togglePrivacy = (key: keyof typeof privacySettings) => {
    setPrivacySettings({
      ...privacySettings,
      [key]: !privacySettings[key],
    });
    // SWAP WITH BACKEND HERE
    // Save to AsyncStorage for now
    AsyncStorage.setItem(
      "privacySettings",
      JSON.stringify({
        ...privacySettings,
        [key]: !privacySettings[key],
      })
    );
  };

  const handleVerifyID = () => {
    Alert.alert(
      t("idVerification"),
      t("uploadIdDescription"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("uploadId"),
          onPress: () => {
            // Mock ID upload
            setTimeout(() => {
              Alert.alert(
                t("idUploaded"),
                t("idVerificationPending"),
                [
                  {
                    text: t("ok"),
                    onPress: () => {
                      // Update user with pending ID verification
                      updateProfile({
                        idVerified: false,
                      });
                    },
                  },
                ]
              );
            }, 1000);
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    // Mock data export
    Alert.alert(
      t("exportData"),
      t("exportDataSuccess"),
      [
        {
          text: t("ok"),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation.toLowerCase() !== "delete") {
      Alert.alert(t("error"), t("typeDeleteToConfirm"));
      return;
    }

    // Mock account deletion
    setDeleteAccountModal(false);
    setDeleteConfirmation("");
    
    Alert.alert(
      t("accountDeleted"),
      t("accountDeletedDescription"),
      [
        {
          text: t("ok"),
          onPress: () => {
            logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  const handleReportIssue = () => {
    Alert.alert(
      t("reportIssue"),
      t("reportIssueDescription"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("takeScreenshot"),
          onPress: () => {
            // Mock screenshot
            setTimeout(() => {
              Alert.alert(
                t("reportSent"),
                t("reportSentDescription"),
                [
                  {
                    text: t("ok"),
                  },
                ]
              );
            }, 1000);
          },
        },
      ]
    );
  };

  const handleFAQ = () => {
    const faqs = [
      {
        question: t("faqQuestion1"),
        answer: t("faqAnswer1")
      },
      {
        question: t("faqQuestion2"),
        answer: t("faqAnswer2")
      },
      {
        question: t("faqQuestion3"),
        answer: t("faqAnswer3")
      },
      {
        question: t("faqQuestion4"),
        answer: t("faqAnswer4")
      },
      {
        question: t("faqQuestion5"),
        answer: t("faqAnswer5")
      }
    ];

    const faqText = faqs.map((faq, index) => 
      `${index + 1}. ${faq.question}\n\n${faq.answer}\n\n`
    ).join('');

    Alert.alert(
      t("faq"),
      faqText,
      [
        {
          text: t("ok"),
        },
      ],
      { cancelable: true }
    );
  };

  const notificationItems = [
    {
      key: "chatMessages" as const,
      label: t("chatMessages"),
      value: notificationSettings.chatMessages,
    },
    {
      key: "favoritesUpdates" as const,
      label: t("favoritesUpdates"),
      value: notificationSettings.favoritesUpdates,
    },
    {
      key: "savedSearchAlerts" as const,
      label: t("savedSearchAlerts"),
      value: notificationSettings.savedSearchAlerts,
    },
    {
      key: "systemAnnouncements" as const,
      label: t("systemAnnouncements"),
      value: notificationSettings.systemAnnouncements,
    },
  ];

  const verificationItems = [
    {
      icon: Phone,
      label: t("phoneVerification"),
      value: user?.phoneVerified ? t("verified") : t("notVerified"),
      action: user?.phoneVerified ? undefined : () => router.push("/verify"),
      verified: user?.phoneVerified,
    },
    {
      icon: Camera,
      label: t("idVerification"),
      value: user?.idVerified ? t("verified") : t("notVerified"),
      action: user?.idVerified ? undefined : handleVerifyID,
      verified: user?.idVerified,
    },
  ];

  const privacyItems = [
    {
      key: "showPhone" as const,
      label: t("showPhoneNumber"),
      value: privacySettings.showPhone,
    },
    {
      key: "allowCalls" as const,
      label: t("allowCalls"),
      value: privacySettings.allowCalls,
    },
  ];

  const privacyLinks = [
    {
      icon: FileText,
      label: t("privacyPolicy"),
      action: () => console.log("Privacy Policy"),
    },
    {
      icon: FileText,
      label: t("termsOfService"),
      action: () => console.log("Terms of Service"),
    },
    {
      icon: AlertTriangle,
      label: t("contentGuidelines"),
      action: () => console.log("Content Guidelines"),
    },
    {
      icon: Download,
      label: t("exportMyData"),
      action: handleExportData,
    },
  ];

  const dangerousActions = [
    {
      icon: Trash2,
      label: t("deleteAccount"),
      action: () => setDeleteAccountModal(true),
      danger: true,
    },
  ];

  const supportItems = [
    {
      icon: HelpCircle,
      label: t("faq"),
      action: handleFAQ,
    },
    {
      icon: MessageSquare,
      label: t("chatWithUs"),
      action: () => console.log("Chat with us"),
    },
    {
      icon: AlertTriangle,
      label: t("reportIssue"),
      action: handleReportIssue,
    },
    {
      icon: Info,
      label: t("safetyTips"),
      action: () => console.log("Safety Tips"),
    },
  ];

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: t("settings"),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Notifications Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell color={colors.primary} size={20} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("notifications")}
              </Text>
            </View>

            {notificationItems.map((item) => (
              <View
                key={item.key}
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
                <Switch
                  value={item.value}
                  onValueChange={() => toggleNotification(item.key)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            ))}
          </View>

          {/* Verification Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield color={colors.primary} size={20} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("verification")}
              </Text>
            </View>

            {verificationItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
                onPress={item.action}
                disabled={!item.action}
              >
                <View style={styles.settingRow}>
                  <item.icon color={colors.primary} size={20} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                </View>
                <View style={styles.settingValue}>
                  {item.verified ? (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.accent }]}>
                      <Text style={styles.verifiedText}>{item.value}</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.settingValueText, { color: colors.textSecondary }]}>
                        {item.value}
                      </Text>
                      {item.action && <ChevronRight color={colors.textSecondary} size={20} />}
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <View style={[styles.verificationStatus, { backgroundColor: colors.surface }]}>
              <Text style={[styles.verificationStatusText, { color: colors.text }]}>
                {t("verificationStatus")}:
              </Text>
              <View
                style={[
                  styles.verificationBadge,
                  {
                    backgroundColor: user?.verificationLevel === "full"
                      ? colors.accent
                      : user?.verificationLevel === "phone"
                        ? colors.secondary
                        : colors.border,
                  },
                ]}
              >
                <Text style={styles.verificationBadgeText}>
                  {user?.verificationLevel === "full"
                    ? t("fullyVerified")
                    : user?.verificationLevel === "phone"
                      ? t("phoneVerified")
                      : t("notVerified")}
                </Text>
              </View>
            </View>
          </View>

          {/* Privacy Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lock color={colors.primary} size={20} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("privacy")}
              </Text>
            </View>

            {privacyItems.map((item) => (
              <View
                key={item.key}
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
                <Switch
                  value={item.value}
                  onValueChange={() => togglePrivacy(item.key)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            ))}

            {privacyLinks.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
                onPress={item.action}
              >
                <View style={styles.settingRow}>
                  <item.icon color={colors.primary} size={20} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                </View>
                <ChevronRight color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Help & Support Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <HelpCircle color={colors.primary} size={20} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("helpAndSupport")}
              </Text>
            </View>

            {supportItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
                onPress={item.action}
              >
                <View style={styles.settingRow}>
                  <item.icon color={colors.primary} size={20} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                </View>
                <ChevronRight color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Account Actions Section */}
          <View style={styles.section}>

            {dangerousActions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
                onPress={item.action}
              >
                <View style={styles.settingRow}>
                  <item.icon color={colors.error} size={20} />
                  <Text style={[styles.settingLabel, { color: colors.error }]}>
                    {item.label}
                  </Text>
                </View>
                <ChevronRight color={colors.error} size={20} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Delete Account Modal */}
          <Modal
            visible={deleteAccountModal}
            transparent
            animationType="fade"
            onRequestClose={() => setDeleteAccountModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {t("deleteAccount")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDeleteAccountModal(false)}
                    style={styles.closeButton}
                  >
                    <X color={colors.text} size={24} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {t("deleteAccountWarning")}
                </Text>

                <Text style={[styles.confirmLabel, { color: colors.text }]}>
                  {t("typeDeleteToConfirm")}
                </Text>
                <TextInput
                  style={[
                    styles.confirmInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={deleteConfirmation}
                  onChangeText={setDeleteConfirmation}
                  placeholder={t("typeDelete")}
                  placeholderTextColor={colors.textSecondary}
                />

                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.error }]}
                  onPress={handleDeleteAccount}
                >
                  <Text style={styles.deleteButtonText}>{t("permanentlyDelete")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setDeleteAccountModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                    {t("cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingValueText: {
    fontSize: 14,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  verificationStatusText: {
    fontSize: 16,
    fontWeight: "500",
  },
  verificationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verificationBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  confirmInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 24,
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});